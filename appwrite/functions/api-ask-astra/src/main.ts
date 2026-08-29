//appwrite/functions/api-ask-astra/src/main.ts
import { Client, Databases, Query } from 'node-appwrite';
import { verifyApiKey, logApiUsage } from './apiAuth';

interface RequestPayload {
  question: string;
  sector: string;
}

const MIN_TENANTS_FOR_BENCHMARK = 3;
const MAX_FINDINGS_IN_CONTEXT = 12;

const SECTOR_TO_TENANT_CATEGORIES: Record<string, string[]> = {
  RESTAURATION: ['RESTAURANT', 'FASTFOOD'],
  PHARMACIE: ['PHARMACIE'],
  COMMERCE_DETAIL: ['ENTREPRISE'],
  HOTELLERIE: [],
  GENERAL: [],
};

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
      if (typeof doc.satisfaction_global === 'number') satisfactionValues.push(doc.satisfaction_global);
    }
  }

  if (distinctTenants.size < MIN_TENANTS_FOR_BENCHMARK) return { text: null, distinctTenants: new Set() };

  const avgSatisfaction =
    satisfactionValues.length > 0
      ? (satisfactionValues.reduce((a, b) => a + b, 0) / satisfactionValues.length).toFixed(2)
      : null;

  const text = `Données agrégées et anonymisées de ${distinctTenants.size} structures du secteur (30 derniers jours) : ${totalScans} retours clients collectés${avgSatisfaction ? `, satisfaction moyenne de ${avgSatisfaction}/5` : ''}.`;

  return { text, distinctTenants };
}

async function fetchSectorFindings(databases: any, databaseId: string, eligibleTenantIds: Set<string>): Promise<string | null> {
  if (eligibleTenantIds.size < MIN_TENANTS_FOR_BENCHMARK) return null;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const allFindings: string[] = [];

  const weeklyResult = await databases.listDocuments(databaseId, process.env.APPWRITE_COLLECTION_WEEKLY_REPORTS!, [
    Query.equal('status', 'PUBLISHED'),
    Query.greaterThan('published_at', since),
    Query.limit(100),
  ]);
  for (const report of weeklyResult.documents as any[]) {
    if (!eligibleTenantIds.has(report.tenant_id)) continue;
    try {
      const results = JSON.parse(report.analysis_result) as Array<{ keyFindings: string[] }>;
      for (const r of results) if (Array.isArray(r.keyFindings)) allFindings.push(...r.keyFindings);
    } catch {}
  }

  const datasetResult = await databases.listDocuments(databaseId, process.env.APPWRITE_COLLECTION_DATASET_REPORTS!, [
    Query.equal('status', 'PUBLISHED'),
    Query.greaterThan('published_at', since),
    Query.limit(100),
  ]);
  for (const report of datasetResult.documents as any[]) {
    if (!eligibleTenantIds.has(report.tenant_id)) continue;
    try {
      const results = JSON.parse(report.analysis_result) as Array<{ keyFindings: string[] }>;
      for (const r of results) if (Array.isArray(r.keyFindings)) allFindings.push(...r.keyFindings);
    } catch {}
  }

  if (allFindings.length === 0) return null;

  for (let i = allFindings.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allFindings[i], allFindings[j]] = [allFindings[j], allFindings[i]];
  }

  return `Constats récents (mélangés entre plusieurs structures anonymes) :\n${allFindings.slice(0, MAX_FINDINGS_IN_CONTEXT).map((f) => `- ${f}`).join('\n')}`;
}

async function fetchKnowledgeBase(databases: any, databaseId: string, sector: string): Promise<string> {
  const result = await databases.listDocuments(databaseId, process.env.APPWRITE_COLLECTION_KNOWLEDGE_BASE!, [
    Query.equal('sector', [sector, 'GENERAL']),
    Query.equal('status', 'PUBLISHED'),
    Query.limit(10),
  ]);
  if (result.documents.length === 0) return '';
  return result.documents.map((doc: any) => `### ${doc.title}\n${doc.content}`).join('\n\n');
}

export default async ({ req, res, log, error }: any) => {
  try {
    let body: RequestPayload;
    try {
      body = JSON.parse(req.bodyText || '{}');
    } catch {
      return res.json({ error: 'Corps de requête invalide.' }, 400);
    }

    if (!body.question || !body.sector) {
      return res.json({ error: 'Champs requis manquants (question, sector).' }, 400);
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID!;

    const rawKey = req.headers?.['x-api-key'];
    const auth = await verifyApiKey(databases, databaseId, process.env.APPWRITE_COLLECTION_API_KEYS!, rawKey, 'ASTRA_API');

    if (!auth.ok) {
      return res.json({ error: auth.error }, auth.status);
    }

    log('Requête Astra API pour secteur=' + body.sector + ' par ' + auth.apiKey.owner_name);

    const [knowledgeContext, benchmark] = await Promise.all([
      fetchKnowledgeBase(databases, databaseId, body.sector),
      computeSectorBenchmark(databases, databaseId, body.sector),
    ]);

    const findingsContext =
      benchmark.distinctTenants.size >= MIN_TENANTS_FOR_BENCHMARK
        ? await fetchSectorFindings(databases, databaseId, benchmark.distinctTenants)
        : null;

    const prompt = `Tu es Astra, l'assistant IA d'ASILLIA DataInsight, spécialisé dans le commerce en Afrique de l'Ouest.

${knowledgeContext ? `Connaissances de référence :\n${knowledgeContext}\n` : ''}
${benchmark.text ? `Données agrégées et anonymisées :\n${benchmark.text}\n` : ''}
${findingsContext ? `${findingsContext}\n` : ''}

Question : ${body.question}

Consignes :
1. Réponds de façon concise (maximum 200 mots), claire et actionnable.
2. Si tu t'appuies sur les données ci-dessus, mentionne-le explicitement.
3. Ne mentionne JAMAIS de structure identifiable.
4. Si tu n'as pas assez d'information, dis-le honnêtement.`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeResponse.ok) {
      error('Erreur API Claude: ' + (await claudeResponse.text()));
      await logApiUsage(databases, databaseId, process.env.APPWRITE_COLLECTION_API_USAGE_LOGS!, auth.apiKey.$id, 'ASTRA_API', '/ask', 502);
      return res.json({ error: "Erreur lors de la génération de la réponse." }, 502);
    }

    const claudeData = (await claudeResponse.json()) as any;
    const answer = claudeData.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');

    await logApiUsage(databases, databaseId, process.env.APPWRITE_COLLECTION_API_USAGE_LOGS!, auth.apiKey.$id, 'ASTRA_API', '/ask', 200);

    return res.json({ answer }, 200);
  } catch (err) {
    error('Erreur api-ask-astra: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};