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

// Mapping secteur (base de connaissances) -> catégories de tenants réelles,
// pour calculer les agrégats croisés correspondants.
const SECTOR_TO_TENANT_CATEGORIES: Record<string, string[]> = {
  RESTAURATION: ['RESTAURANT', 'FASTFOOD'],
  PHARMACIE: ['PHARMACIE'],
  COMMERCE_DETAIL: ['ENTREPRISE'],
  HOTELLERIE: [], // pas encore de catégorie tenant dédiée — la base de connaissances peut déjà exister avant la donnée réelle
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
): Promise<string | null> {
  const categories = SECTOR_TO_TENANT_CATEGORIES[sector] ?? [];
  if (categories.length === 0) return null;

  const collectionMap: Record<string, string> = {
    RESTAURANT: process.env.APPWRITE_COLLECTION_SCANS_RESTAURANT!,
    FASTFOOD: process.env.APPWRITE_COLLECTION_SCANS_RESTAURANT!,
    PHARMACIE: process.env.APPWRITE_COLLECTION_SCANS_PHARMACIE!,
    ENTREPRISE: process.env.APPWRITE_COLLECTION_SCANS_ENTREPRISE!,
  };

  const distinctTenants = new Set<string>();
  const satisfactionValues: number[] = [];
  let totalScans = 0;

  for (const category of categories) {
    const collectionId = collectionMap[category];
    if (!collectionId) continue;

    // Échantillon récent (30 derniers jours) pour rester pertinent et léger.
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
    return null; // pas assez de structures distinctes pour rester anonyme
  }

  const avgSatisfaction =
    satisfactionValues.length > 0
      ? (satisfactionValues.reduce((a, b) => a + b, 0) / satisfactionValues.length).toFixed(2)
      : null;

  return `Données agrégées et anonymisées de ${distinctTenants.size} structures du secteur (30 derniers jours) : ${totalScans} retours clients collectés${avgSatisfaction ? `, satisfaction moyenne de ${avgSatisfaction}/5` : ''}. Ces chiffres sont des moyennes globales, jamais liées à une structure identifiable.`;
}

async function fetchKnowledgeBase(databases: any, databaseId: string, sector: string): Promise<string> {
  const result = await databases.listDocuments(databaseId, process.env.APPWRITE_COLLECTION_KNOWLEDGE_BASE!, [
    Query.equal('sector', [sector, 'GENERAL']),
    Query.equal('status', 'PUBLISHED'), // NOUVEAU — les brouillons proposés par l'IA n'influencent jamais le chat tant qu'ils ne sont pas validés
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
    const [knowledgeContext, benchmarkContext] = await Promise.all([
      fetchKnowledgeBase(databases, databaseId, body.sector),
      computeSectorBenchmark(databases, databaseId, body.sector),
    ]);

    const prompt = `Tu es l'assistant IA d'ASILLIA DataInsight, spécialisé dans le commerce en Afrique de l'Ouest (restaurants, pharmacies, hôtels, commerces).

${knowledgeContext ? `Voici des connaissances de référence sur ce secteur :\n${knowledgeContext}\n` : ''}
${benchmarkContext ? `Voici des données réelles agrégées et anonymisées :\n${benchmarkContext}\n` : ''}

Question du visiteur : ${body.question}

Consignes :
1. Réponds de façon concise (maximum 150 mots), claire et actionnable.
2. Si tu t'appuies sur les données agrégées ci-dessus, mentionne-le explicitement.
3. Si tu n'as pas assez d'information pour répondre précisément, dis-le honnêtement plutôt que d'inventer.
4. Ne mentionne jamais de structure ou d'entreprise nommée — uniquement des tendances générales.
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

    // --- Journalisation : c'est ce log que tu relis dans le Studio pour
    // enrichir la base de connaissances au fil du temps ---
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