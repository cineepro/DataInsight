// apps/studio/src/engine/common/comparePeriods.ts
export interface PeriodComparisonMetric {
  metric: string;
  currentValue: number;
  previousValue: number;
  deltaAbsolute: number;
  deltaPercentage: number | null; // null si previousValue = 0 (division impossible)
}

/**
 * Brique générique : compare deux jeux de métriques déjà agrégées
 * (ex: { avg_satisfaction: 4.2, total_scans: 87 }) et calcule les deltas.
 */
export function comparePeriods(
  currentMetrics: Record<string, number>,
  previousMetrics: Record<string, number>
): PeriodComparisonMetric[] {
  const keys = new Set([...Object.keys(currentMetrics), ...Object.keys(previousMetrics)]);
  const results: PeriodComparisonMetric[] = [];

  for (const key of keys) {
    const current = currentMetrics[key] ?? 0;
    const previous = previousMetrics[key] ?? 0;
    const deltaAbsolute = Number((current - previous).toFixed(2));
    const deltaPercentage = previous !== 0 ? Number(((deltaAbsolute / previous) * 100).toFixed(1)) : null;

    results.push({ metric: key, currentValue: current, previousValue: previous, deltaAbsolute, deltaPercentage });
  }

  return results;
}