//apps/studio/src/engine/types.ts
import type { AnalysisResult } from '@datainsight/shared';

export type { AnalysisResult };

/**
 * Contexte passé à chaque fonction d'analyse. previousPeriodScans et
 * operationalMetrics sont optionnels : seules certaines fonctions
 * (comparaison de périodes, croisement staffing) en ont besoin.
 */
export interface AnalysisFunctionContext<TScan = unknown> {
  tenantId: string;
  year: number;
  weekNumber: number;
  previousPeriodScans?: TScan[];
  operationalMetrics?: Array<{ metric_type: string; date: string; value: string }>;
}

export type AnalysisFunction<TScan> = (
  scans: TScan[],
  context: AnalysisFunctionContext<TScan>
) => AnalysisResult;

export interface AnalysisFunctionDescriptor<TScan> {
  id: string;
  label: string;
  description: string;
  run: AnalysisFunction<TScan>;
}