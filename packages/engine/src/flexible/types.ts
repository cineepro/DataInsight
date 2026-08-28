//packages/engine/src/flexible/types.ts
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

export interface DatasetRow {
  $id: string;
  dataset_id: string;
  row_index: number;
  payload: Record<string, unknown>;
}

export type AggregationType = 'SUM' | 'AVERAGE' | 'COUNT';