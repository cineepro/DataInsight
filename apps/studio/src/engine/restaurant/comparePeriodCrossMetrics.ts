//apps/studio/src/engine/restaurant/comparePeriodCrossMetrics.ts
import type { ScanRestaurant } from '@datainsight/shared';
import { comparePeriods } from '../common/comparePeriods';
import type { AnalysisFunction } from '../types';

function computeMetrics(scans: ScanRestaurant[]): Record<string, number> {
  const total = scans.length;
  const avgSatisfaction = total > 0 ? scans.reduce((sum, s) => sum + s.satisfaction_global, 0) / total : 0;
  const longWaitCount = scans.filter((s) => s.wait_time_bucket === 'GT30').length;

  return {
    total_scans: total,
    avg_satisfaction: Number(avgSatisfaction.toFixed(2)),
    long_wait_rate: total > 0 ? Number(((longWaitCount / total) * 100).toFixed(1)) : 0,
  };
}

/**
 * Nécessite context.previousPeriodScans (scans de la semaine précédente,
 * à charger côté StudioPage via fetchRestaurantScans avant d'appeler cette fonction).
 */
export const comparePeriodCrossMetrics: AnalysisFunction<ScanRestaurant> = (currentScans, context) => {
  const previousScans = context.previousPeriodScans ?? [];
  const currentMetrics = computeMetrics(currentScans);
  const previousMetrics = computeMetrics(previousScans);
  const comparison = comparePeriods(currentMetrics, previousMetrics);

  const degraded = comparison.filter(
    (c) => c.metric === 'avg_satisfaction' && c.deltaPercentage !== null && c.deltaPercentage < -10
  );

  return {
    metricName: 'Comparaison avec la semaine précédente',
    period: `Semaine ${context.weekNumber} — ${context.year}`,
    status: degraded.length > 0 ? 'CRITICAL' : 'OPTIMAL',
    dataPoints: { comparison },
    keyFindings: comparison.map((c) => {
      const deltaLabel = c.deltaPercentage !== null ? `${c.deltaPercentage >= 0 ? '+' : ''}${c.deltaPercentage}%` : 'n/a';
      return `${c.metric} : ${c.currentValue} (${deltaLabel} vs semaine précédente)`;
    }),
  };
};