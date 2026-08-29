//api-run-analysis/src/engine/restaurant/comparePeriodCrossMetrics.ts
import type { ScanRestaurant, AnalysisFunction } from '../types';
import { comparePeriods } from '../common/comparePeriods';

export const FUNCTION_ID = 'restaurant.compare_periods';

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

export const comparePeriodCrossMetrics: AnalysisFunction<ScanRestaurant> = (currentScans, context, t) => {
  const previousScans = context.previousPeriodScans ?? [];
  const currentMetrics = computeMetrics(currentScans);
  const previousMetrics = computeMetrics(previousScans);
  const comparison = comparePeriods(currentMetrics, previousMetrics);

  const degraded = comparison.filter(
    (c) => c.metric === 'avg_satisfaction' && c.deltaPercentage !== null && c.deltaPercentage < t.critical_decline_threshold
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