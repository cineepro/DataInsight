//appwrite/functions/ask-ai-lab/src/main.ts
import { Client, Databases, Query, ID } from 'node-appwrite';
import { hashVisitorToken } from './hashVisitor';

interface RequestPayload {
  question: string;
  sector: string; // GENERAL | RESTAURATION | HOTELLERIE | PHARMACIE | COMMERCE_DETAIL
  visitor_token: string;
}

const RATE_LIMIT_MAX_PER_DAY = 5;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const MIN_TENANTS_FOR_BENCHMARK = 3; // sous ce seuil, aucun chiffre n'est renvoyé (anonymat)
const MAX_FINDINGS_IN_CONTEXT = 12; // filet de sécurité token — pas la peine d'envoyer 100 findings à Claude

const SECTOR_TO_TENANT_CATEGORIES: Record<string, string[]> = {
  RESTAURATION: ['RESTAURANT', 'FASTFOOD'],
  PHARMACIE: ['PHARMACIE'],
  COMMERCE_DETAIL: ['ENTREPRISE'],
  HOTELLERIE: [],
  GENERAL: [],
};

/**
 * Calcule des moyennes ANONYMISÉES croisant TOUTES les structures d'une
 * ou plusieurs catégories, jamais une structure identifiée. Si moins de
 * MIN_TENANTS_FOR_BENCHMARK structures distinctes contribuent, ne renvoie
 * aucun chiffre — pour qu'aucune moyenne ne puisse être ré-attribuée à une
 * entreprise précise par déduction.
 */
async function computeSectorBenchmark(
  databases: any,
  databaseId: string,
  sector: string
): Promise<{ text: string | null; distinctTenants: Set<string> }> {
  const categories = SECTOR_TO_TENANT_CATEGORIES[sector] ?? [];
  const distinctTenants = new Set<string>();

  if (categories.length === 0) return { text: null, distinctTenants };

  const collectionMap: Record<string, string> = {
    RESTAURANT: process.env.APPWRITE_COLLECTION_SCANS_RESTAURANT!,
    FASTFOOD: process.env.APPWRITE_COLLECTION_SCANS_RESTAURANT!,
    PHARMACIE: process.env.APPWRITE_COLLECTION_SCANS_PHARMACIE!,
    ENTREPRISE: process.env.APPWRITE_COLLECTION_SCANS_ENTREPRISE!,
  };

  const satisfactionValues: number[] = [];
  let totalScans = 0;

  for (const category of categories) {
    const collectionId = collectionMap[category];
    if (!collectionId) continue;

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const result = await databases.listDocuments(databaseId, collectionId, [
      Query.greaterThan('timestamp', since),
      Query.limit(500),
    ]);

    for (const doc of result.documents as any[]) {
      distinctTenants.add(doc.tenant_id);
      totalScans++;
      if (typeof doc.satisfaction_global === 'number') {
        satisfactionValues.push(doc.satisfaction_global);
      }
    }
  }

  if (distinctTenants.size < MIN_TENANTS_FOR_BENCHMARK) {
    return { text: null, distinctTenants: new Set() }; // set vidé : signal clair "pas assez pour l'anonymat"
  }

  const avgSatisfaction =
    satisfactionValues.length > 0
      ? (satisfactionValues.reduce((a, b) => a + b, 0) / satisfactionValues.length).toFixed(2)
      : null;

  const text = `Données agrégées et anonymisées de ${distinctTenants.size} structures du secteur (30 derniers jours) : ${totalScans} retours clients collectés${avgSatisfaction ? `, satisfaction moyenne de ${avgSatisfaction}/5` : ''}. Ces chiffres sont des moyennes globales, jamais liées à une structure identifiable.`;

  return { text, distinctTenants };
}

/**
 * Récupère les keyFindings des rapports PUBLIÉS (hebdo + données brutes)
 * des structures du secteur concerné, sur les 30 derniers jours.
 *
 * Sécurité anonymat : n'est appelée QUE si computeSectorBenchmark a déjà
 * confirmé au moins MIN_TENANTS_FOR_BENCHMARK structures distinctes. Les
 * findings de toutes les structures sont ensuite MÉLANGÉS ensemble et
 * présentés comme une liste commune, jamais attribués individuellement à
 * une structure précise — pour qu'aucun finding cité ne puisse être
 * reconnu comme appartenant à une entreprise identifiable.
 */
async function fetchSectorFindings(
  databases: any,
  databaseId: string,
  sector: string,
  eligibleTenantIds: Set<string>
): Promise<string | null> {
  if (eligibleTenantIds.size < MIN_TENANTS_FOR_BENCHMARK) return null;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const allFindings: string[] = [];

  // --- Rapports hebdomadaires publiés ---
  const weeklyResult = await databases.listDocuments(databaseId, process.env.APPWRITE_COLLECTION_WEEKLY_REPORTS!, [
    Query.equal('status', 'PUBLISHED'),
    Query.greaterThan('published_at', since),
    Query.limit(100),
  ]);

  for (const report of weeklyResult.documents as any[]) {
    if (!eligibleTenantIds.has(report.tenant_id)) continue; // uniquement les tenants déjà comptés dans le benchmark de CE secteur
    try {
      const results = JSON.parse(report.analysis_result) as Array<{ keyFindings: string[] }>;
      for (const r of results) {
        if (Array.isArray(r.keyFindings)) allFindings.push(...r.keyFindings);
      }
    } catch {
      // rapport mal formé, ignoré
    }
  }

  // --- Rapports de données brutes publiés ---
  const datasetResult = await databases.listDocuments(databaseId, process.env.APPWRITE_COLLECTION_DATASET_REPORTS!, [
    Query.equal('status', 'PUBLISHED'),
    Query.greaterThan('published_at', since),
    Query.limit(100),
  ]);

  for (const report of datasetResult.documents as any[]) {
    if (!eligibleTenantIds.has(report.tenant_id)) continue;
    try {
      const results = JSON.parse(report.analysis_result) as Array<{ keyFindings: string[] }>;
      for (const r of results) {
        if (Array.isArray(r.keyFindings)) allFindings.push(...r.keyFindings);
      }
    } catch {
      // rapport mal formé, ignoré
    }
  }

  if (allFindings.length === 0) return null;

  // Mélange (Fisher-Yates) pour casser tout ordre qui pourrait laisser
  // deviner "ces 3 findings à la suite viennent de la même structure".
  for (let i = allFindings.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allFindings[i], allFindings[j]] = [allFindings[j], allFindings[i]];
  }

  const sample = allFindings.slice(0, MAX_FINDINGS_IN_CONTEXT);

  return `Constats récents observés (mélangés entre plusieurs structures anonymes du secteur, ne jamais associer un constat à une structure précise) :\n${sample.map((f) => `- ${f}`).join('\n')}`;
}

async function fetchKnowledgeBase(databases: any, databaseId: string, sector: string): Promise<string> {
  const result = await databases.listDocuments(databaseId, process.env.APPWRITE_COLLECTION_KNOWLEDGE_BASE!, [
    Query.equal('sector', [sector, 'GENERAL']),
    Query.equal('status', 'PUBLISHED'),
    Query.limit(10),
  ]);

  if (result.documents.length === 0) return '';

  return result.documents
    .map((doc: any) => `### ${doc.title}\n${doc.content}`)
    .join('\n\n');
}

export default async ({ req, res, log, error }: any) => {
  try {
    let body: RequestPayload;
    try {
      body = JSON.parse(req.bodyText || '{}');
    } catch {
      return res.json({ error: 'Corps de requête invalide.' }, 400);
    }

    if (!body.question || !body.sector || !body.visitor_token) {
      return res.json({ error: 'Champs requis manquants.' }, 400);
    }

    if (body.question.length > 500) {
      return res.json({ error: 'Question trop longue (500 caractères maximum).' }, 400);
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID!;
    const visitorHash = hashVisitorToken(body.visitor_token);

    // --- Anti-abus : quota quotidien par visiteur ---
    const rateLimitCollectionId = process.env.APPWRITE_COLLECTION_AI_LAB_RATE_LIMIT!;
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    const recent = await databases.listDocuments(databaseId, rateLimitCollectionId, [
      Query.equal('visitor_hash', visitorHash),
      Query.greaterThan('timestamp', windowStart),
      Query.limit(RATE_LIMIT_MAX_PER_DAY + 1),
    ]);

    if (recent.documents.length >= RATE_LIMIT_MAX_PER_DAY) {
      return res.json(
        { error: `Limite de ${RATE_LIMIT_MAX_PER_DAY} questions par jour atteinte. Revenez demain !` },
        429
      );
    }

    await databases.createDocument(databaseId, rateLimitCollectionId, ID.unique(), {
      visitor_hash: visitorHash,
      timestamp: new Date().toISOString(),
    });

    // --- Construction du contexte RAG ---
    log('Construction du contexte pour secteur=' + body.sector);

    const [knowledgeContext, benchmark] = await Promise.all([
      fetchKnowledgeBase(databases, databaseId, body.sector),
      computeSectorBenchmark(databases, databaseId, body.sector),
    ]);

    // Ne cherche les findings QUE si le benchmark a validé l'anonymat —
    // évite un appel inutile si le secteur n'a de toute façon pas assez
    // de structures actives.
    const findingsContext = benchmark.distinctTenants.size >= MIN_TENANTS_FOR_BENCHMARK
      ? await fetchSectorFindings(databases, databaseId, body.sector, benchmark.distinctTenants)
      : null;

    const prompt = `Tu es Astra, l'assistant IA d'ASILLIA DataInsight, spécialisé dans le commerce en Afrique de l'Ouest (restaurants, pharmacies, hôtels, commerces). Si on te demande qui tu es, présente-toi par ton nom.

${knowledgeContext ? `Voici des connaissances de référence sur ce secteur :\n${knowledgeContext}\n` : ''}
${benchmark.text ? `Voici des données réelles agrégées et anonymisées :\n${benchmark.text}\n` : ''}
${findingsContext ? `${findingsContext}\n` : ''}

Question du visiteur : ${body.question}

Consignes :
1. Réponds de façon concise (maximum 150 mots), claire et actionnable.
2. Si tu t'appuies sur les données ou constats ci-dessus, mentionne-le explicitement, mais reste toujours au niveau du secteur dans son ensemble.
3. Si tu n'as pas assez d'information pour répondre précisément, dis-le honnêtement plutôt que d'inventer.
4. Ne mentionne JAMAIS de structure ou d'entreprise nommée, ni aucun détail qui permettrait d'identifier une structure précise (nom de produit très spécifique, date exacte, lieu précis) — reformule toujours en tendance générale du secteur.
5. Termine en rappelant brièvement qu'ASILLIA DataInsight peut approfondir cette analyse pour une structure spécifique.`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      error('Erreur API Claude: ' + errorText);
      return res.json({ error: "Erreur lors de la génération de la réponse." }, 502);
    }

    const claudeData = (await claudeResponse.json()) as any;
    const answer = claudeData.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');

    await databases.createDocument(databaseId, process.env.APPWRITE_COLLECTION_AI_CHAT_LOGS!, ID.unique(), {
      visitor_hash: visitorHash,
      sector: body.sector,
      question: body.question,
      answer,
      created_at: new Date().toISOString(),
    });

    return res.json({ answer }, 200);
  } catch (err) {
    error('Erreur ask-ai-lab: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};