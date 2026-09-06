//appwrite/functions/api-join-datasets/src/main.ts
import { Client, Databases } from 'node-appwrite';
import { verifyApiKey, logApiUsage } from './apiAuth';
import {
  joinManyDatasets,
  datasetFromPlainRows,
  joinResultToPlainRows,
  aggregateByDimension,
  aggregateByDimensions,
  topNByDimension,
  crossCorrelateColumns,
  detectAnomaliesInColumn,
  analyzeTrendByPeriod,
  pivotTable,
  getDefaultThresholds,
  type JoinType,
  type AggregationType,
  type DatasetColumnDef,
  type AnalysisResult,
} from '@datainsight/engine';

interface RequestDataset {
  label: string;
  rows: Record<string, unknown>[];
}

interface RequestStep {
  datasetIndex: number;
  keyColumn: string;
  previousKeyColumn: string;
  joinType?: JoinType;
}

/**
 * Toutes les colonnes référencées ici le sont par leur NOM tel qu'il
 * apparaît dans `result.columns` de la réponse — c'est-à-dire tel que vu
 * par l'appelant, après jointure (donc déjà préfixé si collision).
 */
interface RequestAnalysis {
  type:
    | 'aggregate_by_dimension'
    | 'aggregate_by_dimensions'
    | 'top_n_by_dimension'
    | 'cross_correlate_columns'
    | 'detect_anomalies'
    | 'analyze_trend_by_period'
    | 'pivot_table';
  dimensionColumn?: string;
  dimensionColumns?: string[];
  metricColumn?: string;
  identifierColumn?: string;
  periodColumn?: string;
  groupColumn?: string;
  columnA?: string;
  columnB?: string;
  aggregation?: AggregationType;
  n?: number;
  thresholds?: Record<string, number>;
  // spécifique à pivot_table :
  rowColumns?: string[];
  pivotColumn?: string;
}

interface RequestPayload {
  datasets: RequestDataset[];
  steps: RequestStep[];
  analyses?: RequestAnalysis[];
}

const MAX_DATASETS = 6;
const MAX_ROWS_PER_DATASET = 20000;
const MAX_ANALYSES = 10;

const ANALYSIS_FUNCTION_ID: Record<RequestAnalysis['type'], string> = {
  aggregate_by_dimension: 'flexible.aggregate_by_dimension',
  aggregate_by_dimensions: 'flexible.aggregate_by_dimensions',
  top_n_by_dimension: 'flexible.top_n_by_dimension',
  cross_correlate_columns: 'flexible.cross_correlate',
  detect_anomalies: 'flexible.detect_anomalies',
  analyze_trend_by_period: 'flexible.analyze_trend_by_period',
  pivot_table: 'flexible.pivot_table',
};

function findColumnByName(columns: DatasetColumnDef[], name: string): DatasetColumnDef | undefined {
  return columns.find((c) => c.name === name);
}

/** Renvoie un message d'erreur si la config est invalide, sinon `null`. */
function validateAnalysis(a: RequestAnalysis, columns: DatasetColumnDef[]): string | null {
  const missingCol = (name: string | undefined) => !!name && !findColumnByName(columns, name);

  switch (a.type) {
    case 'aggregate_by_dimension':
      if (!a.dimensionColumn) return 'aggregate_by_dimension requiert "dimensionColumn".';
      if (missingCol(a.dimensionColumn) || missingCol(a.metricColumn)) return `Colonne introuvable pour aggregate_by_dimension.`;
      return null;
    case 'aggregate_by_dimensions':
      if (!a.dimensionColumns || a.dimensionColumns.length < 2) return 'aggregate_by_dimensions requiert "dimensionColumns" (2 minimum).';
      if (a.dimensionColumns.some((c) => missingCol(c)) || missingCol(a.metricColumn)) return `Colonne introuvable pour aggregate_by_dimensions.`;
      return null;
    case 'top_n_by_dimension':
      if (!a.dimensionColumn) return 'top_n_by_dimension requiert "dimensionColumn".';
      if (missingCol(a.dimensionColumn) || missingCol(a.metricColumn)) return `Colonne introuvable pour top_n_by_dimension.`;
      return null;
    case 'cross_correlate_columns':
      if (!a.columnA || !a.columnB) return 'cross_correlate_columns requiert "columnA" et "columnB".';
      if (missingCol(a.columnA) || missingCol(a.columnB)) return `Colonne introuvable pour cross_correlate_columns.`;
      return null;
    case 'detect_anomalies':
      if (!a.metricColumn) return 'detect_anomalies requiert "metricColumn".';
      if (missingCol(a.metricColumn) || missingCol(a.identifierColumn)) return `Colonne introuvable pour detect_anomalies.`;
      return null;
    case 'analyze_trend_by_period':
      if (!a.periodColumn) return 'analyze_trend_by_period requiert "periodColumn".';
      if (missingCol(a.periodColumn) || missingCol(a.groupColumn) || missingCol(a.metricColumn)) return `Colonne introuvable pour analyze_trend_by_period.`;
      return null;
    case 'pivot_table':
      if (!a.rowColumns || a.rowColumns.length === 0) return 'pivot_table requiert "rowColumns" (1 minimum).';
      if (a.rowColumns.some((c) => missingCol(c)) || missingCol(a.pivotColumn) || missingCol(a.metricColumn)) return `Colonne introuvable pour pivot_table.`;
      return null;
    default:
      return `Type d'analyse inconnu: ${(a as any).type}`;
  }
}

function runAnalysis(a: RequestAnalysis, columns: DatasetColumnDef[], rows: any[], periodLabel: string): AnalysisResult {
  const col = (name: string | undefined) => (name ? findColumnByName(columns, name) ?? null : null);
  const defaults = getDefaultThresholds(ANALYSIS_FUNCTION_ID[a.type]);
  const thresholds = { ...defaults, ...(a.thresholds ?? {}) };

  switch (a.type) {
    case 'aggregate_by_dimension':
      return aggregateByDimension(rows, col(a.dimensionColumn)!, col(a.metricColumn), a.aggregation ?? 'SUM', periodLabel);
    case 'aggregate_by_dimensions':
      return aggregateByDimensions(rows, a.dimensionColumns!.map((c) => col(c)!), col(a.metricColumn), a.aggregation ?? 'SUM', periodLabel);
    case 'top_n_by_dimension':
      return topNByDimension(rows, col(a.dimensionColumn)!, col(a.metricColumn), a.n ?? 5, periodLabel);
    case 'cross_correlate_columns':
      return crossCorrelateColumns(rows, col(a.columnA)!, col(a.columnB)!, periodLabel, thresholds);
    case 'detect_anomalies':
      return detectAnomaliesInColumn(rows, col(a.metricColumn)!, col(a.identifierColumn), periodLabel, thresholds);
    case 'analyze_trend_by_period':
      return analyzeTrendByPeriod(rows, col(a.periodColumn)!, col(a.groupColumn), col(a.metricColumn), a.aggregation ?? 'AVERAGE', periodLabel, thresholds);
    case 'pivot_table':
      return pivotTable(rows, a.rowColumns!.map((c) => col(c)!), col(a.pivotColumn), col(a.metricColumn), a.aggregation ?? 'SUM', periodLabel);
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
    if (body.analyses && body.analyses.length > MAX_ANALYSES) {
      return res.json({ error: `Maximum ${MAX_ANALYSES} analyses par appel.` }, 400);
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

    log(`Jointure de ${body.datasets.length} datasets (+ ${body.analyses?.length ?? 0} analyse(s)) demandée par ${auth.apiKey.owner_name}.`);

    let responseResult: any;
    try {
      const base = datasetFromPlainRows(body.datasets[0].label, body.datasets[0].rows);
      const resolvedSteps = body.steps.map((s) => ({
        dataset: datasetFromPlainRows(body.datasets[s.datasetIndex].label, body.datasets[s.datasetIndex].rows),
        keyColumnKey: s.keyColumn,
        previousKeyColumnKey: s.previousKeyColumn,
        joinType: s.joinType ?? ('INNER' as JoinType),
      }));

      const joinResult = joinManyDatasets(base, resolvedSteps);

      // Les analyses, si demandées, s'exécutent sur le résultat de la
      // jointure — les colonnes sont référencées par leur nom final
      // (celui déjà renvoyé dans `columns`), pas par une clé interne.
      let analyses: AnalysisResult[] | undefined;
      if (body.analyses && body.analyses.length > 0) {
        for (const a of body.analyses) {
          const validationError = validateAnalysis(a, joinResult.columns);
          if (validationError) {
            return res.json({ error: validationError }, 400);
          }
        }
        analyses = body.analyses.map((a) => runAnalysis(a, joinResult.columns, joinResult.rows, body.datasets[0].label));
      }

      responseResult = {
        rows: joinResultToPlainRows(joinResult),
        columns: joinResult.columns.map((c) => c.name),
        rowCount: joinResult.rows.length,
        unmatchedBaseCount: joinResult.unmatchedBaseCount,
        unmatchedAdditionCount: joinResult.unmatchedAdditionCount,
        ...(analyses ? { analyses } : {}),
      };
    } catch (joinErr) {
      error('Erreur pendant la jointure/analyse: ' + (joinErr as Error).message);
      await logApiUsage(databases, databaseId, process.env.APPWRITE_COLLECTION_API_USAGE_LOGS!, auth.apiKey.$id, 'ANALYSIS_ENGINE_API', 'flexible.join_datasets', 400);
      return res.json({ error: 'Erreur lors de la jointure ou de l\'analyse — vérifiez les noms de colonnes fournis.' }, 400);
    }

    await logApiUsage(databases, databaseId, process.env.APPWRITE_COLLECTION_API_USAGE_LOGS!, auth.apiKey.$id, 'ANALYSIS_ENGINE_API', 'flexible.join_datasets', 200);

    return res.json({ result: responseResult }, 200);
  } catch (err) {
    error('Erreur api-join-datasets: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};
