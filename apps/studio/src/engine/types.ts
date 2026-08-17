// apps/studio/src/engine/types.ts
import type { AnalysisResult } from '@datainsight/shared';

export type { AnalysisResult };

export interface AnalysisFunctionContext<TScan = unknown> {
  tenantId: string;
  year: number;
  weekNumber: number;
  previousPeriodScans?: TScan[];
  operationalMetrics?: Array<{ metric_type: string; date: string; value: string }>;
}

// AVANT : AnalysisResult (synchrone) — APRÈS : Promise<AnalysisResult>
// Toutes les fonctions du moteur peuvent désormais lire leurs seuils
// depuis Appwrite avant de calculer leur résultat.
export type AnalysisFunction<TScan> = (
  scans: TScan[],
  context: AnalysisFunctionContext<TScan>
) => Promise<AnalysisResult>;

export interface AnalysisFunctionDescriptor<TScan> {
  id: string;
  label: string;
  description: string;
  run: AnalysisFunction<TScan>;
}