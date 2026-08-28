//packages/engine/src/restaurant/analyzePeakHoursAndBottlenecks.ts
import type { ScanRestaurant, AnalysisFunction } from '../types';
import { aggregateByTimeSlot } from '../common/aggregateByTimeSlot';

export const FUNCTION_ID = 'restaurant.peak_hours_bottlenecks';

export const analyzePeakHoursAndBottlenecks: AnalysisFunction<ScanRestaurant> = (scans, context, t) => {
  const slots = aggregateByTimeSlot(scans, {
    getSatisfaction: (s) => s.satisfaction_global,
    isDissatisfied: (s) => s.wait_time_bucket === 'GT30' || s.satisfaction_global <= 2,
  });

  const criticalSlots = slots.filter(
    (s) => s.dissatisfactionRate > t.dissatisfaction_threshold && s.count >= t.min_sample_size
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