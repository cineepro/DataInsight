// apps/studio/src/engine/pharmacie/analyzeServiceSegmentation.ts
import type { ScanPharmacie } from '@datainsight/shared';
import { getThresholds } from '../thresholds';
import type { AnalysisFunction } from '../types';

const FUNCTION_ID = 'pharmacie.service_segmentation';

export const analyzeServiceSegmentation: AnalysisFunction<ScanPharmacie> = async (scans, context) => {
  const t = await getThresholds(FUNCTION_ID);

  const byReason = new Map<string, ScanPharmacie[]>();
  for (const s of scans) {
    if (!byReason.has(s.visit_reason)) byReason.set(s.visit_reason, []);
    byReason.get(s.visit_reason)!.push(s);
  }

  const segments = [...byReason.entries()].map(([reason, group]) => {
    const longWaitCount = group.filter((s) => s.wait_time_bucket === 'GT15').length;
    return {
      reason,
      count: group.length,
      longWaitRate: group.length > 0 ? Number(((longWaitCount / group.length) * 100).toFixed(1)) : 0,
    };
  });

  const parapharmacie = segments.find((s) => s.reason === 'PARAPHARMACIE');
  const penalized = !!parapharmacie && parapharmacie.longWaitRate > t.penalized_wait_rate;

  return {
    metricName: 'Segmentation par motif de visite',
    period: `Semaine ${context.weekNumber} — ${context.year}`,
    status: penalized ? 'WARNING' : 'OPTIMAL',
    dataPoints: { segments },
    keyFindings: penalized
      ? [`Les clients "Parapharmacie" subissent ${parapharmacie!.longWaitRate}% d'attente longue — envisager une caisse dédiée`]
      : segments.map((s) => `${s.reason} : ${s.count} visites, ${s.longWaitRate}% d'attente longue`),
  };
};