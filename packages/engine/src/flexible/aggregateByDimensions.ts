//packages/engine/src/flexible/aggregateByDimensions.ts
import type { DatasetRow, DatasetColumnDef, AggregationType } from './types';
import type { AnalysisResult } from '../types';

export interface MultiDimensionGroup {
  /** Valeur de chaque colonne de regroupement, indexée par la `key` de la colonne. */
  dimensionValues: Record<string, string>;
  /** Libellé lisible combiné, ex: "Longue · Par tranches" — pour affichage direct. */
  label: string;
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

function groupValue(row: DatasetRow, columnKey: string): string {
  const raw = row.payload[columnKey];
  return raw === undefined || raw === null || raw === '' ? '(vide)' : String(raw);
}

/**
 * Comme `aggregateByDimension`, mais permet de grouper sur la
 * COMBINAISON de plusieurs colonnes à la fois (ex: catégorie de
 * formation × mode de paiement), plutôt qu'une seule. Fonction
 * indépendante plutôt qu'une extension de `aggregateByDimension` —
 * pour ne rien changer au comportement de l'existant, déjà utilisé
 * ailleurs avec une forme de sortie différente (`dimensionValue`
 * singulier).
 */
export function aggregateByDimensions(
  rows: DatasetRow[],
  dimensionColumns: DatasetColumnDef[],
  metricColumn: DatasetColumnDef | null,
  aggregation: AggregationType,
  periodLabel: string
): AnalysisResult {
  if (dimensionColumns.length === 0) {
    return {
      metricName: 'Agrégation multi-dimensions',
      period: periodLabel,
      status: 'OPTIMAL',
      dataPoints: { groups: [] },
      keyFindings: ['Aucune colonne de regroupement sélectionnée.'],
    };
  }

  const groups = new Map<string, { dimensionValues: Record<string, string>; values: number[] }>();

  for (const row of rows) {
    const dimensionValues: Record<string, string> = {};
    for (const col of dimensionColumns) dimensionValues[col.key] = groupValue(row, col.key);
    const compositeKey = dimensionColumns.map((c) => dimensionValues[c.key]).join('||');

    if (!groups.has(compositeKey)) groups.set(compositeKey, { dimensionValues, values: [] });

    if (aggregation === 'COUNT') {
      groups.get(compositeKey)!.values.push(1);
    } else if (metricColumn) {
      const metricValue = toNumber(row.payload[metricColumn.key]);
      if (metricValue !== null) groups.get(compositeKey)!.values.push(metricValue);
    }
  }

  const results: MultiDimensionGroup[] = [...groups.values()]
    .map(({ dimensionValues, values }) => {
      let value: number;
      if (aggregation === 'SUM') value = values.reduce((a, b) => a + b, 0);
      else if (aggregation === 'AVERAGE') value = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      else value = values.length;

      const label = dimensionColumns.map((c) => dimensionValues[c.key]).join(' · ');
      return { dimensionValues, label, value: Number(value.toFixed(2)), count: values.length };
    })
    .sort((a, b) => b.value - a.value);

  const metricLabel = aggregation === 'COUNT' ? 'Nombre de lignes' : metricColumn?.name ?? 'Mesure';
  const dimensionLabel = dimensionColumns.map((c) => c.name).join(' × ');
  const top = results.slice(0, 8);

  return {
    metricName: `${metricLabel} par ${dimensionLabel}`,
    period: periodLabel,
    status: 'OPTIMAL',
    dataPoints: { groups: results, dimensionKeys: dimensionColumns.map((c) => c.key) },
    keyFindings: top.map((g) => `${g.label} : ${g.value} (${g.count} lignes)`),
  };
}
