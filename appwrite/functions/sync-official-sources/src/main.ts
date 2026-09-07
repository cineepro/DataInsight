//appwrite/functions/sync-official-sources/src/main.ts
import { Client, Databases, Query, ID } from 'node-appwrite';
import { createHash } from 'crypto';
import pdfParse from 'pdf-parse';
import Parser from 'rss-parser';
import { convert as htmlToText } from 'html-to-text';
import { extractKnowledgeFromText } from '@datainsight/knowledge-ingestion';

/**
 * Veille hebdomadaire des sources officielles (partenariats institutionnels
 * suivis dans Studio, onglet "Sources officielles"). Pour chaque source au
 * statut ACTIVE, va chercher du nouveau contenu selon sa stratégie de
 * lecture (source_type), et le transforme en brouillons de connaissances
 * — jamais publiés automatiquement, une relecture humaine reste
 * obligatoire dans Studio avant qu'Astra ne puisse s'en servir.
 *
 * Trois stratégies supportées pour l'instant : PDF_FEED, RSS, WEBSITE.
 * API existe dans le modèle de données mais n'est pas encore automatisée
 * (chaque API officielle a sa propre forme — pas de connecteur générique
 * possible sans en cibler une précise).
 */

const MAX_ITEMS_PER_SOURCE_PER_RUN = 5; // limite l'explosion de coût si une source publie soudain beaucoup de contenu
const MAX_HASHES_KEPT = 300; // taille de l'historique de déduplication conservé par source

interface OfficialSourceDoc {
  $id: string;
  name: string;
  sector: string;
  source_type?: string;
  source_url?: string;
  processed_item_hashes?: string[];
}

function hashOf(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

/** Ajoute des hachages à l'historique, en le gardant borné (les plus anciens partent en premier). */
function appendHashes(existing: string[] | undefined, newOnes: string[]): string[] {
  const merged = [...(existing ?? []), ...newOnes];
  return merged.slice(-MAX_HASHES_KEPT);
}

async function saveKnowledgeProposals(
  databases: Databases,
  databaseId: string,
  knowledgeBaseCollectionId: string,
  proposals: Array<{ title: string; content: string }>,
  source: OfficialSourceDoc,
  itemLabel: string
): Promise<number> {
  let saved = 0;
  for (const proposal of proposals) {
    await databases.createDocument(databaseId, knowledgeBaseCollectionId, ID.unique(), {
      title: proposal.title,
      sector: source.sector,
      content: proposal.content,
      status: 'DRAFT',
      origin: 'OFFICIAL_SOURCE',
      source_document_name: itemLabel,
      official_source_id: source.$id,
      created_at: new Date().toISOString(),
    });
    saved++;
  }
  return saved;
}

// ---------------------------------------------------------------------
// Stratégie PDF_FEED : source_url est soit un PDF direct, soit une page
// qui liste des liens vers des PDF.
// ---------------------------------------------------------------------
async function syncPdfFeed(
  databases: Databases,
  databaseId: string,
  knowledgeBaseCollectionId: string,
  source: OfficialSourceDoc,
  anthropicApiKey: string,
  log: any
): Promise<{ newEntries: number; newHashes: string[] }> {
  const response = await fetch(source.source_url!);
  if (!response.ok) throw new Error(`Échec du téléchargement (${response.status})`);

  const contentType = response.headers.get('content-type') ?? '';
  let pdfLinks: string[] = [];

  if (contentType.includes('application/pdf') || source.source_url!.toLowerCase().endsWith('.pdf')) {
    pdfLinks = [source.source_url!];
  } else {
    const html = await response.text();
    const matches = [...html.matchAll(/href=["']([^"']+\.pdf)["']/gi)].map((m) => m[1]);
    pdfLinks = [...new Set(matches)].map((href) => new URL(href, source.source_url!).toString());
  }

  const alreadyProcessed = new Set(source.processed_item_hashes ?? []);
  const newLinks = pdfLinks.filter((link) => !alreadyProcessed.has(hashOf(link))).slice(0, MAX_ITEMS_PER_SOURCE_PER_RUN);

  let newEntries = 0;
  const newHashes: string[] = [];

  for (const link of newLinks) {
    try {
      log(`  PDF: ${link}`);
      const fileResponse = await fetch(link);
      if (!fileResponse.ok) continue;
      const buffer = Buffer.from(await fileResponse.arrayBuffer());
      const pdfData = await pdfParse(buffer);
      if (!pdfData.text || pdfData.text.trim().length < 200) continue;

      const proposals = await extractKnowledgeFromText(pdfData.text, source.name, anthropicApiKey);
      newEntries += await saveKnowledgeProposals(databases, databaseId, knowledgeBaseCollectionId, proposals, source, link);
      newHashes.push(hashOf(link));
    } catch (err) {
      log(`  Échec sur ${link}: ${(err as Error).message}`);
    }
  }

  return { newEntries, newHashes };
}

// ---------------------------------------------------------------------
// Stratégie RSS : suit un flux RSS/Atom, ne traite que les entrées non
// encore vues.
// ---------------------------------------------------------------------
async function syncRss(
  databases: Databases,
  databaseId: string,
  knowledgeBaseCollectionId: string,
  source: OfficialSourceDoc,
  anthropicApiKey: string,
  log: any
): Promise<{ newEntries: number; newHashes: string[] }> {
  const parser = new Parser();
  const feed = await parser.parseURL(source.source_url!);

  const alreadyProcessed = new Set(source.processed_item_hashes ?? []);
  const newItems = (feed.items ?? [])
    .filter((item) => item.link && !alreadyProcessed.has(hashOf(item.link)))
    .slice(0, MAX_ITEMS_PER_SOURCE_PER_RUN);

  let newEntries = 0;
  const newHashes: string[] = [];

  for (const item of newItems) {
    try {
      log(`  Article RSS: ${item.title ?? item.link}`);
      // Le contenu du flux est parfois un simple résumé — s'il est trop
      // court, on va chercher la page complète de l'article.
      let text = item.contentSnippet || item.content || '';
      if (text.length < 300 && item.link) {
        const pageResponse = await fetch(item.link);
        if (pageResponse.ok) text = htmlToText(await pageResponse.text(), { wordwrap: false });
      }
      if (text.trim().length < 200) continue;

      const proposals = await extractKnowledgeFromText(text, source.name, anthropicApiKey);
      newEntries += await saveKnowledgeProposals(databases, databaseId, knowledgeBaseCollectionId, proposals, source, item.title ?? item.link!);
      newHashes.push(hashOf(item.link!));
    } catch (err) {
      log(`  Échec sur ${item.link}: ${(err as Error).message}`);
    }
  }

  return { newEntries, newHashes };
}

// ---------------------------------------------------------------------
// Stratégie WEBSITE : une page web classique. Un seul "item" (la page
// elle-même) — on ne retraite que si son contenu textuel a changé depuis
// la dernière vérification.
// ---------------------------------------------------------------------
async function syncWebsite(
  databases: Databases,
  databaseId: string,
  knowledgeBaseCollectionId: string,
  source: OfficialSourceDoc,
  anthropicApiKey: string,
  log: any
): Promise<{ newEntries: number; newHashes: string[] }> {
  const response = await fetch(source.source_url!);
  if (!response.ok) throw new Error(`Échec du téléchargement (${response.status})`);

  const text = htmlToText(await response.text(), { wordwrap: false });
  if (text.trim().length < 200) return { newEntries: 0, newHashes: [] };

  const contentHash = hashOf(text);
  const alreadyProcessed = new Set(source.processed_item_hashes ?? []);
  if (alreadyProcessed.has(contentHash)) {
    log('  Page inchangée depuis la dernière vérification.');
    return { newEntries: 0, newHashes: [] };
  }

  log('  Page modifiée, extraction en cours...');
  const proposals = await extractKnowledgeFromText(text, source.name, anthropicApiKey);
  const newEntries = await saveKnowledgeProposals(databases, databaseId, knowledgeBaseCollectionId, proposals, source, source.source_url!);

  return { newEntries, newHashes: [contentHash] };
}

export default async ({ req, res, log, error }: any) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID!;
    const officialSourcesCollectionId = process.env.APPWRITE_COLLECTION_OFFICIAL_SOURCES!;
    const knowledgeBaseCollectionId = process.env.APPWRITE_COLLECTION_KNOWLEDGE_BASE!;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY!;

    const result = await databases.listDocuments(databaseId, officialSourcesCollectionId, [
      Query.equal('status', 'ACTIVE'),
      Query.limit(100),
    ]);
    const sources = result.documents as unknown as OfficialSourceDoc[];

    log(`${sources.length} source(s) active(s) à vérifier.`);

    let sourcesChecked = 0;
    let totalNewEntries = 0;

    for (const source of sources) {
      log(`Source: ${source.name} (${source.source_type ?? 'type non défini'})`);

      if (!source.source_url) {
        log('  Aucune URL configurée, ignorée.');
        continue;
      }

      sourcesChecked++;
      let outcome: { newEntries: number; newHashes: string[] };

      try {
        switch (source.source_type) {
          case 'PDF_FEED':
            outcome = await syncPdfFeed(databases, databaseId, knowledgeBaseCollectionId, source, anthropicApiKey, log);
            break;
          case 'RSS':
            outcome = await syncRss(databases, databaseId, knowledgeBaseCollectionId, source, anthropicApiKey, log);
            break;
          case 'WEBSITE':
            outcome = await syncWebsite(databases, databaseId, knowledgeBaseCollectionId, source, anthropicApiKey, log);
            break;
          case 'API':
            log('  Type API — pas encore automatisé, ignorée.');
            outcome = { newEntries: 0, newHashes: [] };
            break;
          default:
            log('  Type de source inconnu ou non défini, ignorée.');
            outcome = { newEntries: 0, newHashes: [] };
        }
      } catch (err) {
        error(`  Erreur sur la source ${source.name}: ${(err as Error).message}`);
        outcome = { newEntries: 0, newHashes: [] };
      }

      const updates: Record<string, unknown> = { last_checked_at: new Date().toISOString() };
      if (outcome.newHashes.length > 0) {
        updates.processed_item_hashes = appendHashes(source.processed_item_hashes, outcome.newHashes);
      }
      if (outcome.newEntries > 0) {
        updates.last_synced_at = new Date().toISOString();
      }
      await databases.updateDocument(databaseId, officialSourcesCollectionId, source.$id, updates);

      totalNewEntries += outcome.newEntries;
      log(`  -> ${outcome.newEntries} nouvelle(s) proposition(s) de connaissance.`);
    }

    log(`Terminé. ${sourcesChecked} source(s) vérifiée(s), ${totalNewEntries} proposition(s) au total.`);
    return res.json({ success: true, sourcesChecked, totalNewEntries }, 200);
  } catch (err) {
    error('Erreur sync-official-sources: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};
