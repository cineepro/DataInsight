//packages/engine/src/flexible/aggregateByDimension.ts
import type { DatasetRow, DatasetColumnDef, AggregationType } from './types';
import type { AnalysisResult } from '../types';

interface AggregateGroup {
  dimensionValue: string;
  value: number;
  count: number;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function aggregateByDimension(
  rows: DatasetRow[],
  dimensionColumn: DatasetColumnDef,
  metricColumn: DatasetColumnDef | null,
  aggregation: AggregationType,
  periodLabel: string
): AnalysisResult {
  const groups = new Map<string, number[]>();

  for (const row of rows) {
    const dimRaw = row.payload[dimensionColumn.key];
    const dimValue = dimRaw === undefined || dimRaw === null || dimRaw === '' ? '(vide)' : String(dimRaw);

    if (!groups.has(dimValue)) groups.set(dimValue, []);

    if (aggregation === 'COUNT') {
      groups.get(dimValue)!.push(1);
    } else if (metricColumn) {
      const metricValue = toNumber(row.payload[metricColumn.key]);
      if (metricValue !== null) groups.get(dimValue)!.push(metricValue);
    }
  }

  const results: AggregateGroup[] = [...groups.entries()]
    .map(([dimensionValue, values]) => {
      let value: number;
      if (aggregation === 'SUM') value = values.reduce((a, b) => a + b, 0);
      else if (aggregation === 'AVERAGE') value = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      else value = values.length;

      return { dimensionValue, value: Number(value.toFixed(2)), count: values.length };
    })
    .sort((a, b) => b.value - a.value);

  const metricLabel = aggregation === 'COUNT' ? 'Nombre de lignes' : metricColumn?.name ?? 'Mesure';
  const top = results.slice(0, 5);

  return {
    metricName: `${metricLabel} par ${dimensionColumn.name}`,
    period: periodLabel,
    status: 'OPTIMAL',
    dataPoints: { groups: results },
    keyFindings: top.map((g) => `${dimensionColumn.name} "${g.dimensionValue}" : ${g.value} (${g.count} lignes)`),
  };
}