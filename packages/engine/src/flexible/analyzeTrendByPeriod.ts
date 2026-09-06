//packages/engine/src/flexible/analyzeTrendByPeriod.ts
import type { DatasetRow, DatasetColumnDef, AggregationType } from './types';
import type { AnalysisResult } from '../types';

export interface PeriodSeriesPoint {
  period: string;
  value: number;
  count: number;
}

export interface PeriodSeries {
  /** Valeur du groupe (ex: "LONG"), ou '(ensemble)' si aucune colonne de groupe fournie. */
  groupValue: string;
  points: PeriodSeriesPoint[];
  /** Index dans `points` où la plus forte baisse d'une période à l'autre a été détectée (null si aucune baisse). */
  ruptureIndex: number | null;
  ruptureDeltaAbsolute: number | null;
  ruptureDeltaPercentage: number | null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function rawValue(row: DatasetRow, columnKey: string): string {
  const raw = row.payload[columnKey];
  return raw === undefined || raw === null || raw === '' ? '(vide)' : String(raw);
}

/** Trie numériquement si toutes les valeurs le permettent, sinon alphabétiquement. */
function sortPeriods(periods: string[]): string[] {
  const allNumeric = periods.every((p) => !Number.isNaN(Number(p)));
  if (allNumeric) return [...periods].sort((a, b) => Number(a) - Number(b));
  return [...periods].sort((a, b) => a.localeCompare(b));
}

/**
 * Calcule, pour chaque groupe (optionnel), la série de valeurs d'une
 * mesure période par période, puis détecte automatiquement le point où
 * la plus forte baisse d'une période à l'autre se produit — le "point
 * de rupture". Reproduit ce qu'on a fait à la main pour identifier la
 * semaine 3 comme moment de décrochage dans le cas G.N. Consult.
 */
export function analyzeTrendByPeriod(
  rows: DatasetRow[],
  periodColumn: DatasetColumnDef,
  groupColumn: DatasetColumnDef | null,
  metricColumn: DatasetColumnDef | null,
  aggregation: AggregationType,
  periodLabel: string,
  thresholds: Record<string, number>
): AnalysisResult {
  // clé composite groupe||période -> valeurs à agréger
  const buckets = new Map<string, { group: string; period: string; values: number[] }>();
  const allPeriods = new Set<string>();
  const allGroups = new Set<string>();

  for (const row of rows) {
    const period = rawValue(row, periodColumn.key);
    const group = groupColumn ? rawValue(row, groupColumn.key) : '(ensemble)';
    allPeriods.add(period);
    allGroups.add(group);

    const bucketKey = `${group}||${period}`;
    if (!buckets.has(bucketKey)) buckets.set(bucketKey, { group, period, values: [] });

    if (aggregation === 'COUNT') {
      buckets.get(bucketKey)!.values.push(1);
    } else if (metricColumn) {
      const v = toNumber(row.payload[metricColumn.key]);
      if (v !== null) buckets.get(bucketKey)!.values.push(v);
    }
  }

  const orderedPeriods = sortPeriods([...allPeriods]);
  const ruptureThresholdPct = thresholds.rupture_threshold_percentage ?? -15;

  const series: PeriodSeries[] = [...allGroups].sort().map((group) => {
    const points: PeriodSeriesPoint[] = orderedPeriods.map((period) => {
      const bucket = buckets.get(`${group}||${period}`);
      const values = bucket?.values ?? [];
      let value: number;
      if (aggregation === 'SUM') value = values.reduce((a, b) => a + b, 0);
      else if (aggregation === 'AVERAGE') value = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      else value = values.length;
      return { period, value: Number(value.toFixed(2)), count: values.length };
    });

    // Repère la plus forte baisse d'un point au suivant.
    let ruptureIndex: number | null = null;
    let worstDelta = 0;
    for (let i = 1; i < points.length; i++) {
      const delta = points[i].value - points[i - 1].value;
      if (delta < worstDelta) {
        worstDelta = delta;
        ruptureIndex = i;
      }
    }

    let ruptureDeltaAbsolute: number | null = null;
    let ruptureDeltaPercentage: number | null = null;
    if (ruptureIndex !== null) {
      const prevValue = points[ruptureIndex - 1].value;
      ruptureDeltaAbsolute = Number(worstDelta.toFixed(2));
      ruptureDeltaPercentage = prevValue !== 0 ? Number(((worstDelta / prevValue) * 100).toFixed(1)) : null;
    }

    return { groupValue: group, points, ruptureIndex, ruptureDeltaAbsolute, ruptureDeltaPercentage };
  });

  const significantRuptures = series.filter(
    (s) => s.ruptureDeltaPercentage !== null && s.ruptureDeltaPercentage <= ruptureThresholdPct
  );

  const metricLabel = aggregation === 'COUNT' ? 'Nombre de lignes' : metricColumn?.name ?? 'Mesure';
  const keyFindings = significantRuptures.map((s) => {
    const p = s.points[s.ruptureIndex!];
    const prevP = s.points[s.ruptureIndex! - 1];
    const groupPrefix = s.groupValue === '(ensemble)' ? '' : `${s.groupValue} : `;
    return `${groupPrefix}chute de ${s.ruptureDeltaPercentage}% entre "${prevP.period}" et "${p.period}" (${prevP.value} → ${p.value}) — point de rupture`;
  });

  return {
    metricName: `${metricLabel} par ${periodColumn.name}${groupColumn ? ` × ${groupColumn.name}` : ''} — évolution`,
    period: periodLabel,
    status: significantRuptures.length > 0 ? 'CRITICAL' : 'OPTIMAL',
    dataPoints: { series, orderedPeriods },
    keyFindings: keyFindings.length > 0 ? keyFindings : ['Aucune chute significative détectée entre les périodes.'],
  };
}
