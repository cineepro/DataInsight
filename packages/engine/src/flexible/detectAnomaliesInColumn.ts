//packages/engine/src/flexible/detectAnomaliesInColumn.ts
import type { DatasetRow, DatasetColumnDef } from './types';
import type { AnalysisResult } from '../types';
import { detectAnomalies } from '../common/detectAnomalies';

export const FUNCTION_ID = 'flexible.detect_anomalies';

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function detectAnomaliesInColumn(
  rows: DatasetRow[],
  metricColumn: DatasetColumnDef,
  identifierColumn: DatasetColumnDef | null,
  periodLabel: string,
  t: Record<string, number>
): AnalysisResult {
  const validRows = rows.filter((r) => toNumber(r.payload[metricColumn.key]) !== null);
  const anomalies = detectAnomalies(validRows, (row) => toNumber(row.payload[metricColumn.key])!, t.std_dev_threshold);

  const labelFor = (row: DatasetRow) =>
    identifierColumn ? String(row.payload[identifierColumn.key] ?? `ligne ${row.row_index}`) : `ligne ${row.row_index}`;

  return {
    metricName: `Anomalies — ${metricColumn.name}`,
    period: periodLabel,
    status: anomalies.length > 0 ? 'WARNING' : 'OPTIMAL',
    dataPoints: {
      anomalies: anomalies.map((a) => ({ label: labelFor(a.item), value: a.value, deviation: a.deviation })),
    },
    keyFindings: anomalies.map(
      (a) => `${labelFor(a.item)} : valeur ${a.value} (écart de ${a.deviation} par rapport à la moyenne)`
    ),
  };
}