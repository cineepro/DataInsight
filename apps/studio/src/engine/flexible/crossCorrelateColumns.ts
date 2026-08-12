//apps/studio/src/engine/flexible/crossCorrelateColumns.ts
import type { DatasetRow, DatasetColumnDef, AnalysisResult } from './types';
import { crossCorrelate } from '../common/crossCorrelate';

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Corrélation entre deux colonnes numériques — ne garde que les lignes où
 * les deux valeurs sont exploitables (paires complètes), à la manière
 * d'Excel qui ignore les cellules vides dans un calcul de corrélation.
 */
export function crossCorrelateColumns(
  rows: DatasetRow[],
  columnA: DatasetColumnDef,
  columnB: DatasetColumnDef,
  periodLabel: string
): AnalysisResult {
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

  const result = crossCorrelate(seriesA, seriesB);

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