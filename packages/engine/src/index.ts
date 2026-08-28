//packages/engine/src/index.ts
export * from './types';
export * from './thresholdDefaults';

// Common
export * from './common/aggregateByTimeSlot';
export * from './common/comparePeriods';
export * from './common/crossCorrelate';
export * from './common/detectAnomalies';
export * from './common/detectChurnRisk';

// Restaurant
//export { analyzePeakHoursAndBottlenecks } from './restaurant/analyzePeakHoursAndBottlenecks';
//export { calculateMenuSatisfactionMatrix } from './restaurant/calculateMenuSatisfactionMatrix';
//export { comparePeriodCrossMetrics } from './restaurant/comparePeriodCrossMetrics';
// Restaurant
export {
  analyzePeakHoursAndBottlenecks,
  FUNCTION_ID as RESTAURANT_PEAK_HOURS_FUNCTION_ID,
} from './restaurant/analyzePeakHoursAndBottlenecks';

export {
  calculateMenuSatisfactionMatrix,
  FUNCTION_ID as RESTAURANT_MENU_SATISFACTION_FUNCTION_ID,
} from './restaurant/calculateMenuSatisfactionMatrix';

export {
  comparePeriodCrossMetrics,
  FUNCTION_ID as RESTAURANT_COMPARE_METRICS_FUNCTION_ID,
} from './restaurant/comparePeriodCrossMetrics';

// Pharmacie
//export { analyzeQueueAndStaffingEfficiency } from './pharmacie/analyzeQueueAndStaffingEfficiency';
export {
  analyzeQueueAndStaffingEfficiency,
  FUNCTION_ID as PHARMACIE_QUEUE_FUNCTION_ID,
} from './pharmacie/analyzeQueueAndStaffingEfficiency';
//export { detectStockoutImpact } from './pharmacie/detectStockoutImpact';
export {
  detectStockoutImpact,
  FUNCTION_ID as PHARMACIE_STOCKOUT_FUNCTION_ID,
} from './pharmacie/detectStockoutImpact';
//export { analyzeServiceSegmentation } from './pharmacie/analyzeServiceSegmentation';
export {
  analyzeServiceSegmentation,
  FUNCTION_ID as PHARMACIE_SEGMENTATION_FUNCTION_ID,
} from './pharmacie/analyzeServiceSegmentation';

// Entreprise
//export { analyzeGenericTrends } from './entreprise/analyzeGenericTrends';
export {
  analyzeGenericTrends,
  FUNCTION_ID as ENTREPRISE_GENERIC_TRENDS_FUNCTION_ID,
} from './entreprise/analyzeGenericTrends';

// Flexible
export * from './flexible/types';
export { aggregateByDimension } from './flexible/aggregateByDimension';
export { topNByDimension } from './flexible/topNByDimension';
//export { crossCorrelateColumns } from './flexible/crossCorrelateColumns';
//export { detectAnomaliesInColumn } from './flexible/detectAnomaliesInColumn';
export { compareDatasetSnapshots } from './flexible/compareDatasetSnapshots';
export * from './flexible/registry';

export {
  crossCorrelateColumns,
  FUNCTION_ID as CROSS_CORRELATE_FUNCTION_ID,
} from './flexible/crossCorrelateColumns';
export {
  detectAnomaliesInColumn,
  FUNCTION_ID as FLEXIBLE_DETECT_ANOMALIES_FUNCTION_ID,
} from './flexible/detectAnomaliesInColumn';

// Registry global
export * from './registry';