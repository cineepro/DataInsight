//packages/engine/src/flexible/topNByDimension.ts
import type { DatasetRow, DatasetColumnDef } from './types';
import type { AnalysisResult } from '../types';
import { aggregateByDimension } from './aggregateByDimension';

export function topNByDimension(
  rows: DatasetRow[],
  dimensionColumn: DatasetColumnDef,
  metricColumn: DatasetColumnDef | null,
  n: number,
  periodLabel: string
): AnalysisResult {
  const base = aggregateByDimension(rows, dimensionColumn, metricColumn, metricColumn ? 'SUM' : 'COUNT', periodLabel);
  const groups = (base.dataPoints.groups as Array<{ dimensionValue: string; value: number; count: number }>).slice(0, n);

  return {
    metricName: `Top ${n} — ${dimensionColumn.name}`,
    period: periodLabel,
    status: 'OPTIMAL',
    dataPoints: { groups },
    keyFindings: groups.map((g, i) => `#${i + 1} ${g.dimensionValue} — ${g.value}`),
  };
}