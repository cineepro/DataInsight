//appwrite/functions/api-ask-astra/src/main.ts
import { Client, Databases, Query } from 'node-appwrite';
import { verifyApiKey, logApiUsage } from './apiAuth';
import { computeSectorBenchmark, fetchSectorFindings, fetchKnowledgeBase, MIN_TENANTS_FOR_BENCHMARK, type AstraContextEnv } from '@datainsight/astra-context';

interface RequestPayload {
  question: string;
  sector: string;
}

function astraContextEnv(): AstraContextEnv {
  return {
    scansRestaurantCollectionId: process.env.APPWRITE_COLLECTION_SCANS_RESTAURANT!,
    scansPharmacieCollectionId: process.env.APPWRITE_COLLECTION_SCANS_PHARMACIE!,
    scansEntrepriseCollectionId: process.env.APPWRITE_COLLECTION_SCANS_ENTREPRISE!,
    weeklyReportsCollectionId: process.env.APPWRITE_COLLECTION_WEEKLY_REPORTS!,
    datasetReportsCollectionId: process.env.APPWRITE_COLLECTION_DATASET_REPORTS!,
    knowledgeBaseCollectionId: process.env.APPWRITE_COLLECTION_KNOWLEDGE_BASE!,
  };
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
      fetchKnowledgeBase(databases, databaseId, body.sector, astraContextEnv()),
      computeSectorBenchmark(databases, databaseId, body.sector, astraContextEnv()),
    ]);

    const findingsContext =
      benchmark.distinctTenants.size >= MIN_TENANTS_FOR_BENCHMARK
        ? await fetchSectorFindings(databases, databaseId, benchmark.distinctTenants, astraContextEnv())
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