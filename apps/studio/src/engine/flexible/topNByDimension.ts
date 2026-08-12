//apps/studio/src/engine/flexible/topNByDimension.ts
import type { DatasetRow, DatasetColumnDef, AnalysisResult } from './types';
import { aggregateByDimension } from './aggregateByDimension';

/**
 * Classement décroissant — réutilise aggregateByDimension puis coupe au
 * top N. Séparée en fonction propre car c'est une lecture différente du
 * même calcul (l'utilisateur du Studio choisit "Top N" comme une action
 * distincte de "voir tous les groupes").
 */
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