//apps/studio/src/engine/flexible/types.ts
export type ColumnDataType = 'TEXT' | 'NUMBER' | 'DATE' | 'CATEGORY' | 'BOOLEAN';
export type ColumnRole = 'DIMENSION' | 'METRIC' | 'DATE' | 'IDENTIFIER' | 'IGNORE';

export interface DatasetColumnDef {
  $id: string;
  dataset_id: string;
  name: string;
  key: string;
  data_type: ColumnDataType;
  role: ColumnRole;
  order: number;
}

/**
 * Une ligne de dataset une fois désérialisée — le payload JSON stocké en
 * base devient un simple Record<clé_colonne, valeur>. Les valeurs restent
 * en `unknown` volontairement : chaque fonction du moteur est responsable
 * de convertir/valider selon le data_type déclaré dans DatasetColumnDef.
 */
export interface DatasetRow {
  $id: string;
  dataset_id: string;
  row_index: number;
  payload: Record<string, unknown>;
}

export type AggregationType = 'SUM' | 'AVERAGE' | 'COUNT';

/**
 * Même forme que AnalysisResult (engine/common) — permet de réutiliser
 * ResultReviewPanel-like UI et le pipeline IA sans dupliquer de types.
 */
export interface AnalysisResult {
  metricName: string;
  period: string;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  dataPoints: Record<string, unknown>;
  keyFindings: string[];
}