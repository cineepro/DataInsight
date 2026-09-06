//packages/engine/src/flexible/pivotTable.ts
import type { DatasetRow, DatasetColumnDef, AggregationType } from './types';
import type { AnalysisResult } from '../types';

export interface PivotTableResult {
  rowLabels: string[];
  columnLabels: string[];
  /** matrix[i][j] = valeur agrégée pour rowLabels[i] × columnLabels[j], null si aucune donnée. */
  matrix: (number | null)[][];
  rowTotals: number[];
  columnTotals: number[];
  grandTotal: number;
}

const SINGLE_COLUMN_KEY = '__single__';
const SINGLE_COLUMN_LABEL = 'Valeur';

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
function sortLabels(labels: string[]): string[] {
  const allNumeric = labels.every((p) => !Number.isNaN(Number(p)));
  if (allNumeric) return [...labels].sort((a, b) => Number(a) - Number(b));
  return [...labels].sort((a, b) => a.localeCompare(b));
}

function computeAgg(values: number[], aggregation: AggregationType): number {
  if (aggregation === 'SUM') return values.reduce((a, b) => a + b, 0);
  if (aggregation === 'AVERAGE') return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  return values.length; // COUNT
}

/**
 * Tableau croisé dynamique généraliste : une ou plusieurs colonnes en
 * lignes (composite si plusieurs), une colonne optionnelle pivotée en
 * colonnes du tableau, et une mesure agrégée à l'intersection — le
 * mécanisme central qui permet de "croiser comme on veut" plutôt que de
 * rester limité aux fonctions prédéfinies.
 */
export function pivotTable(
  rows: DatasetRow[],
  rowDimensions: DatasetColumnDef[],
  columnDimension: DatasetColumnDef | null,
  metricColumn: DatasetColumnDef | null,
  aggregation: AggregationType,
  periodLabel: string
): AnalysisResult {
  if (rowDimensions.length === 0) {
    return {
      metricName: 'Tableau croisé',
      period: periodLabel,
      status: 'OPTIMAL',
      dataPoints: { rowLabels: [], columnLabels: [], matrix: [], rowTotals: [], columnTotals: [], grandTotal: 0 },
      keyFindings: ['Aucune colonne de ligne sélectionnée.'],
    };
  }

  const cellValues = new Map<string, Map<string, number[]>>(); // rowKey -> colKey -> values
  const rowValues = new Map<string, number[]>(); // rowKey -> toutes les valeurs de la ligne, tous croisements confondus
  const colValues = new Map<string, number[]>(); // colKey -> toutes les valeurs de la colonne, toutes lignes confondues
  const allValues: number[] = [];
  const rowKeyToLabel = new Map<string, string>();
  const colKeyToLabel = new Map<string, string>();

  for (const row of rows) {
    const rowParts = rowDimensions.map((c) => rawValue(row, c.key));
    const rowKey = rowParts.join('||');
    rowKeyToLabel.set(rowKey, rowParts.join(' · '));

    const colKey = columnDimension ? rawValue(row, columnDimension.key) : SINGLE_COLUMN_KEY;
    colKeyToLabel.set(colKey, columnDimension ? colKey : SINGLE_COLUMN_LABEL);

    let value: number | null;
    if (aggregation === 'COUNT') {
      value = 1;
    } else if (metricColumn) {
      value = toNumber(row.payload[metricColumn.key]);
    } else {
      value = null;
    }
    if (value === null) continue;

    if (!cellValues.has(rowKey)) cellValues.set(rowKey, new Map());
    const rowMap = cellValues.get(rowKey)!;
    if (!rowMap.has(colKey)) rowMap.set(colKey, []);
    rowMap.get(colKey)!.push(value);

    if (!rowValues.has(rowKey)) rowValues.set(rowKey, []);
    rowValues.get(rowKey)!.push(value);

    if (!colValues.has(colKey)) colValues.set(colKey, []);
    colValues.get(colKey)!.push(value);

    allValues.push(value);
  }

  const rowKeys = [...rowKeyToLabel.keys()];
  const rowLabels = rowKeys.map((k) => rowKeyToLabel.get(k)!);
  const sortedRowLabelsForOutput = rowDimensions.length === 1 ? sortLabels(rowLabels) : rowLabels;
  // Pour ré-ordonner rowKeys dans le même ordre que les labels triés :
  const labelToKey = new Map(rowKeys.map((k) => [rowKeyToLabel.get(k)!, k]));
  const orderedRowKeys = sortedRowLabelsForOutput.map((l) => labelToKey.get(l)!);

  const colKeysRaw = [...colKeyToLabel.keys()];
  const orderedColKeys = columnDimension ? sortLabels(colKeysRaw) : colKeysRaw;
  const columnLabels = orderedColKeys.map((k) => colKeyToLabel.get(k)!);

  const matrix: (number | null)[][] = orderedRowKeys.map((rowKey) => {
    const rowMap = cellValues.get(rowKey);
    return orderedColKeys.map((colKey) => {
      const values = rowMap?.get(colKey);
      return values && values.length > 0 ? Number(computeAgg(values, aggregation).toFixed(2)) : null;
    });
  });

  const rowTotals = orderedRowKeys.map((k) => Number(computeAgg(rowValues.get(k) ?? [], aggregation).toFixed(2)));
  const columnTotals = orderedColKeys.map((k) => Number(computeAgg(colValues.get(k) ?? [], aggregation).toFixed(2)));
  const grandTotal = Number(computeAgg(allValues, aggregation).toFixed(2));

  const metricLabel = aggregation === 'COUNT' ? 'Nombre de lignes' : metricColumn?.name ?? 'Mesure';
  const rowDimLabel = rowDimensions.map((c) => c.name).join(' × ');
  const metricName = columnDimension
    ? `${metricLabel} — ${rowDimLabel} × ${columnDimension.name}`
    : `${metricLabel} par ${rowDimLabel}`;

  const rowLabelsWithTotals = sortedRowLabelsForOutput
    .map((label, i) => ({ label, total: rowTotals[i] }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return {
    metricName,
    period: periodLabel,
    status: 'OPTIMAL',
    dataPoints: {
      rowLabels: sortedRowLabelsForOutput,
      columnLabels,
      matrix,
      rowTotals,
      columnTotals,
      grandTotal,
    },
    keyFindings: rowLabelsWithTotals.map((r) => `${r.label} : ${r.total} au total`),
  };
}
