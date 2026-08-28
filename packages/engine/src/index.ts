//packages/engine/src/index.ts
export * from './types';
export * from './thresholdDefaults';

export * from './common/aggregateByTimeSlot';
export * from './common/comparePeriods';
export * from './common/crossCorrelate';
export * from './common/detectAnomalies';
export * from './common/detectChurnRisk';

export * from './restaurant/analyzePeakHoursAndBottlenecks';
export * from './restaurant/calculateMenuSatisfactionMatrix';
export * from './restaurant/comparePeriodCrossMetrics';

export * from './pharmacie/analyzeQueueAndStaffingEfficiency';
export * from './pharmacie/detectStockoutImpact';
export * from './pharmacie/analyzeServiceSegmentation';

export * from './entreprise/analyzeGenericTrends';

export * from './flexible/types';
export * from './flexible/aggregateByDimension';
export * from './flexible/topNByDimension';
export * from './flexible/crossCorrelateColumns';
export * from './flexible/detectAnomaliesInColumn';
export * from './flexible/compareDatasetSnapshots';
export * from './flexible/registry';

export * from './registry';