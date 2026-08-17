//packages/shared/src/types/threshold.ts
export interface AnalysisThresholdConfig {
  $id: string;
  function_id: string;
  label: string;
  config: string; // JSON.stringify d'un Record<string, number>
  updated_by?: string;
  updated_at: string;
}