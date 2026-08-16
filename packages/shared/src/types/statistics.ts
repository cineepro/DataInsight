//packages/shared/src/types/statistics.ts
import type { TenantCategory } from './tenant';

export interface PerformanceBreakdown {
  optimal: number;
  warning: number;
  critical: number;
}

export interface WeeklyCount {
  week: number;
  count: number;
}

export interface WeeklyValue {
  week: number;
  value: number | null;
}

export interface WeeklyRate {
  week: number;
  rate: number;
}

export interface DistributionEntry {
  label: string;
  value: number;
}

export interface DatasetBreakdownEntry {
  dataset_name: string;
  period_label: string;
  optimal: number;
  warning: number;
  critical: number;
}

export interface TenantStatistics {
  category: TenantCategory;
  block_label: string;
  weeks: number[];
  performance: PerformanceBreakdown;
  volume_by_week: WeeklyCount[];
  avg_satisfaction_by_week: WeeklyValue[];
  category_specific: Record<string, DistributionEntry[] | WeeklyRate[]>;
  // NOUVEAU — issu des analyses de données brutes (dataset_reports)
  // publiées dans la fenêtre de dates du bloc affiché.
  dataset_performance: PerformanceBreakdown;
  datasets_breakdown: DatasetBreakdownEntry[];
}