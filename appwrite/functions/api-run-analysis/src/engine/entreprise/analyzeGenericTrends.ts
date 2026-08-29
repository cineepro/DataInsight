//api-run-analysis/src/engine/entreprise/analyzeGenericTrends.ts
import type { ScanEntreprise, AnalysisFunction } from '../types';
import { aggregateByTimeSlot } from '../common/aggregateByTimeSlot';

export const FUNCTION_ID = 'entreprise.generic_trends';

export const analyzeGenericTrends: AnalysisFunction<ScanEntreprise> = (scans, context, t) => {
  const byType = new Map<string, number>();
  for (const s of scans) {
    byType.set(s.interaction_type, (byType.get(s.interaction_type) ?? 0) + 1);
  }

  const slots = aggregateByTimeSlot(scans, {
    getSatisfaction: (s) => s.satisfaction_global,
    isDissatisfied: (s) => (s.satisfaction_global ?? 5) <= 2,
  });

  const criticalSlots = slots.filter((s) => s.dissatisfactionRate > t.dissatisfaction_threshold && s.count >= t.min_sample_size);

  return {
    metricName: "Tendances générales d'interaction",
    period: `Semaine ${context.weekNumber} — ${context.year}`,
    status: criticalSlots.length > 0 ? 'WARNING' : 'OPTIMAL',
    dataPoints: { interactionTypeCounts: Object.fromEntries(byType), slots },
    keyFindings: [
      ...criticalSlots.map((s) => `Pic d'insatisfaction à ${s.hour}h (${(s.dissatisfactionRate * 100).toFixed(0)}%)`),
      ...[...byType.entries()].map(([type, count]) => `${type} : ${count} interactions cette semaine`),
    ],
  };
};