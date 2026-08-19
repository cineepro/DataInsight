//appwrite/functions/extract-pdf-knowledge/src/main.ts
import { Client, Databases, Storage, ID } from 'node-appwrite';
import pdfParse from 'pdf-parse';

interface RequestPayload {
  document_id: string;
}

interface KnowledgeProposal {
  title: string;
  content: string;
}

const MAX_CHUNK_CHARS = 12000; // ~3000 tokens par morceau, marge de sécurité pour l'appel Claude
const MAX_CHUNKS_TO_PROCESS = 6; // filet de sécurité : un rapport de 100 pages ne doit pas générer 40 appels Claude d'affilée
const MAX_ENTRIES_PER_CHUNK = 3;

/**
 * Découpe le texte extrait en morceaux traitables par Claude un par un —
 * un PDF de plusieurs dizaines de pages dépasse largement ce qu'un seul
 * appel peut absorber. Coupe sur des sauts de paragraphe pour éviter de
 * trancher une phrase en plein milieu.
 */
function chunkText(text: string, maxChars: number): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + para).length > maxChars && current.length > 0) {
      chunks.push(current);
      current = para;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }
  if (current) chunks.push(current);

  return chunks;
}

/**
 * Contrainte de concision STRICTE dans le prompt — c'est elle qui protège
 * le coût récurrent en tokens à chaque question posée plus tard dans
 * ask-ai-lab, puisque chaque entrée générée ici sera relue à chaque appel
 * futur qui la sélectionne.
 */
function buildExtractionPrompt(sourceLabel: string, chunk: string): string {
  return `Voici un extrait d'un document officiel${sourceLabel ? ` (${sourceLabel})` : ''} concernant l'économie ou le commerce en Afrique de l'Ouest.

Extrait :
"""
${chunk}
"""

Ta tâche : identifie UNIQUEMENT les faits durables, généraux et réutilisables (pas des chiffres ponctuels d'une seule année qui seront vite obsolètes, sauf s'ils illustrent une tendance structurelle importante). Reformule ces faits en langage clair et concis — ne recopie JAMAIS de phrase entière du texte source, synthétise toujours avec tes propres mots.

Règles strictes :
- Maximum ${MAX_ENTRIES_PER_CHUNK} entrées pour cet extrait.
- Chaque entrée : 100 à 150 mots MAXIMUM. C'est une contrainte dure, pas une suggestion.
- Si l'extrait ne contient rien d'utile ou de suffisamment général, retourne un tableau vide.
- Ne mentionne jamais le nom du document source dans le contenu généré — reformule comme une connaissance autonome.

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ni après :
[
  { "title": "Titre court", "content": "Contenu reformulé, 100-150 mots" }
]`;
}

async function callClaude(prompt: string): Promise<KnowledgeProposal[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur API Claude: ${await response.text()}`);
  }

  const data = (await response.json()) as any;
  const text = data.content
    .filter((block: any) => block.type === 'text')
    .map((block: any) => block.text)
    .join('');

  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async ({ req, res, log, error }: any) => {
  try {
    let body: RequestPayload;
    try {
      body = JSON.parse(req.bodyText || '{}');
    } catch {
      return res.json({ error: 'Corps de requête invalide.' }, 400);
    }

    if (!body.document_id) {
      return res.json({ error: 'document_id manquant.' }, 400);
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    const storage = new Storage(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID!;
    const bucketId = process.env.APPWRITE_BUCKET_OFFICIAL_DOCUMENTS!;

    const document = await databases.getDocument(databaseId, process.env.APPWRITE_COLLECTION_IMPORTED_DOCUMENTS!, body.document_id) as any;

    log('Téléchargement du fichier ' + document.file_name);
    const fileBuffer = await storage.getFileDownload(bucketId, document.file_id);

    log('Extraction du texte du PDF...');
    const pdfData = await pdfParse(Buffer.from(fileBuffer));
    const fullText = pdfData.text;

    if (!fullText || fullText.trim().length < 200) {
      await databases.updateDocument(databaseId, process.env.APPWRITE_COLLECTION_IMPORTED_DOCUMENTS!, body.document_id, {
        status: 'FAILED',
      });
      return res.json({ error: 'Le PDF ne contient pas assez de texte exploitable (peut-être un PDF scanné en image).' }, 400);
    }

    const chunks = chunkText(fullText, MAX_CHUNK_CHARS).slice(0, MAX_CHUNKS_TO_PROCESS);
    log(`Texte découpé en ${chunks.length} morceau(x) à traiter.`);

    let totalGenerated = 0;

    for (let i = 0; i < chunks.length; i++) {
      log(`Traitement du morceau ${i + 1}/${chunks.length}...`);
      const prompt = buildExtractionPrompt(document.source_label, chunks[i]);
      const proposals = await callClaude(prompt);

      for (const proposal of proposals) {
        if (!proposal.title || !proposal.content) continue;

        await databases.createDocument(databaseId, process.env.APPWRITE_COLLECTION_KNOWLEDGE_BASE!, ID.unique(), {
          title: proposal.title,
          sector: document.sector,
          content: proposal.content,
          status: 'DRAFT',
          origin: 'OFFICIAL_SOURCE',
          source_document_name: document.file_name,
          created_at: new Date().toISOString(),
        });
        totalGenerated++;
      }
    }

    await databases.updateDocument(databaseId, process.env.APPWRITE_COLLECTION_IMPORTED_DOCUMENTS!, body.document_id, {
      status: 'PROCESSED',
      entries_generated: totalGenerated,
    });

    log(`Terminé : ${totalGenerated} proposition(s) créée(s).`);
    return res.json({ success: true, entries_generated: totalGenerated }, 200);
  } catch (err) {
    error('Erreur extract-pdf-knowledge: ' + (err as Error).message);
    try {
      const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
        .setKey(process.env.APPWRITE_API_KEY!);
      const databases = new Databases(client);
      const body = JSON.parse(req.bodyText || '{}');
      if (body.document_id) {
        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_COLLECTION_IMPORTED_DOCUMENTS!,
          body.document_id,
          { status: 'FAILED' }
        );
      }
    } catch {
      // best-effort — ne masque pas l'erreur d'origine si cette mise à jour échoue aussi
    }
    return res.json({ error: 'Erreur serveur: ' + (err as Error).message }, 500);
  }
};