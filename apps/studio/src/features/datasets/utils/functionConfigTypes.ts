//apps/studio/src/features/datasets/utils/functionConfigTypes.ts
import type { AggregationType } from '../../../engine/flexible/types';

export type FlexibleFunctionConfig =
  | { type: 'aggregate_by_dimension'; dimensionKey: string; metricKey?: string; aggregation: AggregationType }
  | { type: 'aggregate_by_dimensions'; dimensionKeys: string[]; metricKey?: string; aggregation: AggregationType }
  | { type: 'top_n_by_dimension'; dimensionKey: string; metricKey?: string; n: number }
  | { type: 'cross_correlate_columns'; columnAKey: string; columnBKey: string }
  | { type: 'detect_anomalies'; metricKey: string; identifierKey?: string }
  | { type: 'analyze_trend_by_period'; periodKey: string; groupKey?: string; metricKey?: string; aggregation: AggregationType }
  | { type: 'compare_snapshots'; previousDatasetId: string; metricKeys: string[] };