//apps/studio/src/engine/restaurant/analyzePeakHoursAndBottlenecks.ts
import type { ScanRestaurant } from '@datainsight/shared';
import { aggregateByTimeSlot } from '../common/aggregateByTimeSlot';
import type { AnalysisFunction } from '../types';

const DISSATISFACTION_THRESHOLD = 0.3; // 30% d'insatisfaction déclenche une alerte
const MIN_SAMPLE_SIZE = 3; // ignore les créneaux avec trop peu d'avis pour être significatifs

export const analyzePeakHoursAndBottlenecks: AnalysisFunction<ScanRestaurant> = (scans, context) => {
  const slots = aggregateByTimeSlot(scans, {
    getSatisfaction: (s) => s.satisfaction_global,
    isDissatisfied: (s) => s.wait_time_bucket === 'GT30' || s.satisfaction_global <= 2,
  });

  const criticalSlots = slots.filter(
    (s) => s.dissatisfactionRate > DISSATISFACTION_THRESHOLD && s.count >= MIN_SAMPLE_SIZE
  );

  return {
    metricName: "Pics d'affluence et goulets d'étranglement",
    period: `Semaine ${context.weekNumber} — ${context.year}`,
    status: criticalSlots.length > 0 ? 'WARNING' : 'OPTIMAL',
    dataPoints: { slots, criticalSlots },
    keyFindings: criticalSlots.map(
      (s) =>
        `Pic critique à ${s.hour}h : ${(s.dissatisfactionRate * 100).toFixed(0)}% d'insatisfaction sur ${s.count} avis`
    ),
  };
};