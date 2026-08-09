//packages/shared/src/types/report.ts
export type ReportStatus = 'DRAFT' | 'PUBLISHED';
export type AnalysisStatusLevel = 'OPTIMAL' | 'WARNING' | 'CRITICAL';

/**
 * Sortie standard produite par CHAQUE fonction du moteur d'analyse (engine/).
 */
export interface AnalysisResult {
  metricName: string;
  period: string;
  status: AnalysisStatusLevel;
  dataPoints: Record<string, unknown>;
  keyFindings: string[];
}

export interface WeeklyReport {
  $id?: string;
  tenant_id: string;
  year: number;
  week_number: number;
  analysis_result: string; // JSON.stringify(AnalysisResult[])
  ai_directives?: string;
  status: ReportStatus;
  analyst_id?: string;
  published_at?: string;
  created_at: string;
}