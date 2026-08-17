// apps/studio/src/engine/flexible/crossCorrelateColumns.ts
import type { DatasetRow, DatasetColumnDef, AnalysisResult } from './types';
import { crossCorrelate } from '../common/crossCorrelate';
import { getThresholds } from '../thresholds';

const FUNCTION_ID = 'flexible.cross_correlate';

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export async function crossCorrelateColumns(
  rows: DatasetRow[],
  columnA: DatasetColumnDef,
  columnB: DatasetColumnDef,
  periodLabel: string
): Promise<AnalysisResult> {
  const t = await getThresholds(FUNCTION_ID);

  const seriesA: number[] = [];
  const seriesB: number[] = [];

  for (const row of rows) {
    const a = toNumber(row.payload[columnA.key]);
    const b = toNumber(row.payload[columnB.key]);
    if (a !== null && b !== null) {
      seriesA.push(a);
      seriesB.push(b);
    }
  }

  // crossCorrelate() (engine/common) renvoie déjà une classification
  // FAIBLE/MODEREE/FORTE avec ses propres seuils internes fixes (0.3/0.6) —
  // on la recalcule ici manuellement avec les seuils configurables pour
  // que cette fonction précise reste ajustable indépendamment de
  // pharmacie.queue_staffing_efficiency qui utilise la même brique commune.
  const rawResult = crossCorrelate(seriesA, seriesB);
  const abs = Math.abs(rawResult.coefficient);
  const strength = abs >= t.strong_threshold ? 'FORTE' : abs >= t.moderate_threshold ? 'MODEREE' : 'FAIBLE';
  const result = { ...rawResult, strength };

  const status = result.strength === 'FORTE' ? 'WARNING' : 'OPTIMAL';
  const direction = result.coefficient >= 0 ? 'positive' : 'négative';

  return {
    metricName: `Corrélation ${columnA.name} / ${columnB.name}`,
    period: periodLabel,
    status,
    dataPoints: { ...result },
    keyFindings: [
      `Corrélation ${direction} ${result.strength.toLowerCase()} (coefficient : ${result.coefficient}) sur ${result.sampleSize} lignes exploitables`,
    ],
  };
}