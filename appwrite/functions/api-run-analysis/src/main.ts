//appwrite/functions/api-run-analysis/src/main.ts
import { Client, Databases } from 'node-appwrite';
import { verifyApiKey, logApiUsage } from './apiAuth';
import { FUNCTION_ID_TO_RUNNER } from './engine/registry';
import { getDefaultThresholds } from './engine/thresholdDefaults';

interface RequestPayload {
  category: 'RESTAURANT' | 'FASTFOOD' | 'PHARMACIE' | 'ENTREPRISE';
  function_id: string;
  data: any[];
  context?: { year?: number; weekNumber?: number; previousPeriodData?: any[] };
  thresholds?: Record<string, number>;
}

export default async ({ req, res, log, error }: any) => {
  try {
    let body: RequestPayload;
    try {
      body = JSON.parse(req.bodyText || '{}');
    } catch {
      return res.json({ error: 'Corps de requête invalide.' }, 400);
    }

    if (!body.category || !body.function_id || !Array.isArray(body.data)) {
      return res.json({ error: 'Champs requis manquants (category, function_id, data).' }, 400);
    }

    const runner = FUNCTION_ID_TO_RUNNER[body.function_id];
    if (!runner) {
      return res.json({ error: `Fonction d'analyse inconnue: ${body.function_id}` }, 400);
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID!;

    const rawKey = req.headers?.['x-api-key'];
    const auth = await verifyApiKey(databases, databaseId, process.env.APPWRITE_COLLECTION_API_KEYS!, rawKey, 'ANALYSIS_ENGINE_API');

    if (!auth.ok) {
      return res.json({ error: auth.error }, auth.status);
    }

    log(`Analyse ${body.function_id} demandée par ${auth.apiKey.owner_name} sur ${body.data.length} lignes.`);

    // Seuils : ceux fournis par l'appelant, complétés par les valeurs par
    // défaut du moteur pour tout ce qui manquerait — jamais d'erreur pour
    // un seuil non précisé, jamais les seuils internes de tes propres
    // clients DataInsight exposés à l'appelant externe.
    const defaultThresholds = getDefaultThresholds(body.function_id);
    const thresholds = { ...defaultThresholds, ...(body.thresholds ?? {}) };

    const context = {
      tenantId: 'external-api-call',
      year: body.context?.year ?? new Date().getFullYear(),
      weekNumber: body.context?.weekNumber ?? 1,
      previousPeriodScans: body.context?.previousPeriodData ?? [],
    };

    let result;
    try {
      result = runner(body.data, context, thresholds);
    } catch (runErr) {
      error('Erreur pendant le calcul: ' + (runErr as Error).message);
      await logApiUsage(databases, databaseId, process.env.APPWRITE_COLLECTION_API_USAGE_LOGS!, auth.apiKey.$id, 'ANALYSIS_ENGINE_API', body.function_id, 400);
      return res.json({ error: 'Erreur lors du calcul — vérifiez le format de vos données.' }, 400);
    }

    await logApiUsage(databases, databaseId, process.env.APPWRITE_COLLECTION_API_USAGE_LOGS!, auth.apiKey.$id, 'ANALYSIS_ENGINE_API', body.function_id, 200);

    return res.json({ result }, 200);
  } catch (err) {
    error('Erreur api-run-analysis: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};