//packages/engine/src/flexible/compareDatasetSnapshots.ts
import type { DatasetRow, DatasetColumnDef } from './types';
import type { AnalysisResult } from '../types';
import { comparePeriods } from '../common/comparePeriods';

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function computeMetrics(rows: DatasetRow[], metricColumns: DatasetColumnDef[]): Record<string, number> {
  const metrics: Record<string, number> = {};
  for (const col of metricColumns) {
    const values = rows.map((r) => toNumber(r.payload[col.key])).filter((v): v is number => v !== null);
    metrics[col.name] = values.length > 0 ? Number(values.reduce((a, b) => a + b, 0).toFixed(2)) : 0;
  }
  return metrics;
}

export function compareDatasetSnapshots(
  currentRows: DatasetRow[],
  previousRows: DatasetRow[],
  metricColumns: DatasetColumnDef[],
  currentLabel: string,
  previousLabel: string
): AnalysisResult {
  const currentMetrics = computeMetrics(currentRows, metricColumns);
  const previousMetrics = computeMetrics(previousRows, metricColumns);
  const comparison = comparePeriods(currentMetrics, previousMetrics);

  const declines = comparison.filter((c) => c.deltaPercentage !== null && c.deltaPercentage < -10);

  return {
    metricName: `Comparaison — ${currentLabel} vs ${previousLabel}`,
    period: `${currentLabel} vs ${previousLabel}`,
    status: declines.length > 0 ? 'WARNING' : 'OPTIMAL',
    dataPoints: { comparison },
    keyFindings: comparison.map((c) => {
      const deltaLabel = c.deltaPercentage !== null ? `${c.deltaPercentage >= 0 ? '+' : ''}${c.deltaPercentage}%` : 'n/a';
      return `${c.metric} : ${c.currentValue} (${deltaLabel})`;
    }),
  };
}