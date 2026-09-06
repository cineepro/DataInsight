//appwrite/functions/api-join-datasets/src/main.ts
import { Client, Databases } from 'node-appwrite';
import { verifyApiKey, logApiUsage } from './apiAuth';
import { joinManyDatasets, datasetFromPlainRows, joinResultToPlainRows, type JoinType } from '@datainsight/engine';

interface RequestDataset {
  label: string;
  rows: Record<string, unknown>[];
}

interface RequestStep {
  datasetIndex: number; // index dans `datasets`, le dataset ajouté à cette étape
  keyColumn: string; // colonne de ce dataset utilisée comme clé
  previousKeyColumn: string; // colonne du résultat accumulé jusqu'ici sur laquelle joindre
  joinType?: JoinType; // défaut : INNER
}

interface RequestPayload {
  datasets: RequestDataset[];
  steps: RequestStep[];
}

const MAX_DATASETS = 6;
const MAX_ROWS_PER_DATASET = 20000;

export default async ({ req, res, log, error }: any) => {
  try {
    let body: RequestPayload;
    try {
      body = JSON.parse(req.bodyText || '{}');
    } catch {
      return res.json({ error: 'Corps de requête invalide.' }, 400);
    }

    if (!Array.isArray(body.datasets) || body.datasets.length < 2) {
      return res.json({ error: 'Au moins 2 datasets sont requis (champ "datasets").' }, 400);
    }
    if (body.datasets.length > MAX_DATASETS) {
      return res.json({ error: `Maximum ${MAX_DATASETS} datasets par appel.` }, 400);
    }
    if (!Array.isArray(body.steps) || body.steps.length !== body.datasets.length - 1) {
      return res.json({ error: 'Le champ "steps" doit contenir exactement (nombre de datasets - 1) étapes.' }, 400);
    }
    for (const d of body.datasets) {
      if (!d.label || !Array.isArray(d.rows)) {
        return res.json({ error: 'Chaque dataset doit avoir un "label" et un tableau "rows".' }, 400);
      }
      if (d.rows.length > MAX_ROWS_PER_DATASET) {
        return res.json({ error: `Maximum ${MAX_ROWS_PER_DATASET} lignes par dataset.` }, 400);
      }
    }
    for (const s of body.steps) {
      if (
        typeof s.datasetIndex !== 'number' ||
        s.datasetIndex < 1 ||
        s.datasetIndex >= body.datasets.length ||
        !s.keyColumn ||
        !s.previousKeyColumn
      ) {
        return res.json({ error: 'Chaque étape doit référencer un datasetIndex valide (>=1), keyColumn et previousKeyColumn.' }, 400);
      }
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

    log(`Jointure de ${body.datasets.length} datasets demandée par ${auth.apiKey.owner_name}.`);

    let result;
    try {
      const base = datasetFromPlainRows(body.datasets[0].label, body.datasets[0].rows);
      const resolvedSteps = body.steps.map((s) => ({
        dataset: datasetFromPlainRows(body.datasets[s.datasetIndex].label, body.datasets[s.datasetIndex].rows),
        keyColumnKey: s.keyColumn,
        previousKeyColumnKey: s.previousKeyColumn,
        joinType: s.joinType ?? ('INNER' as JoinType),
      }));

      const joinResult = joinManyDatasets(base, resolvedSteps);
      result = {
        rows: joinResultToPlainRows(joinResult),
        columns: joinResult.columns.map((c) => c.name),
        rowCount: joinResult.rows.length,
        unmatchedBaseCount: joinResult.unmatchedBaseCount,
        unmatchedAdditionCount: joinResult.unmatchedAdditionCount,
      };
    } catch (joinErr) {
      error('Erreur pendant la jointure: ' + (joinErr as Error).message);
      await logApiUsage(databases, databaseId, process.env.APPWRITE_COLLECTION_API_USAGE_LOGS!, auth.apiKey.$id, 'ANALYSIS_ENGINE_API', 'flexible.join_datasets', 400);
      return res.json({ error: 'Erreur lors de la jointure — vérifiez les noms de colonnes clés fournis.' }, 400);
    }

    await logApiUsage(databases, databaseId, process.env.APPWRITE_COLLECTION_API_USAGE_LOGS!, auth.apiKey.$id, 'ANALYSIS_ENGINE_API', 'flexible.join_datasets', 200);

    return res.json({ result }, 200);
  } catch (err) {
    error('Erreur api-join-datasets: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};
