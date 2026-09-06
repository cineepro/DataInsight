//packages/engine/src/flexible/pivotTable.test.ts
import { describe, it, expect } from 'vitest';
import { pivotTable, type PivotTableResult } from './pivotTable';
import type { DatasetColumnDef, DatasetRow } from './types';

function col(key: string, name: string, order: number): DatasetColumnDef {
  return { $id: `col_${key}`, dataset_id: 'test', name, key, data_type: 'TEXT', role: 'DIMENSION', order };
}
function row(payload: Record<string, unknown>, i: number): DatasetRow {
  return { $id: `r${i}`, dataset_id: 'test', row_index: i, payload };
}

const canal = col('canal', 'Canal', 0);
const annee = col('annee', 'Année', 1);
const leads = col('nombre_leads', 'Leads', 2);

// Reproduit exactement le tableau communication.csv de G.N. Consult :
// canal en lignes, année en colonnes, somme des leads à l'intersection.
const rows: DatasetRow[] = [
  row({ canal: 'Réseaux sociaux', annee: 2023, nombre_leads: 250 }, 0),
  row({ canal: 'Réseaux sociaux', annee: 2024, nombre_leads: 172 }, 1),
  row({ canal: 'Réseaux sociaux', annee: 2025, nombre_leads: 73 }, 2),
  row({ canal: 'Bouche-à-oreille', annee: 2023, nombre_leads: 274 }, 3),
  row({ canal: 'Bouche-à-oreille', annee: 2024, nombre_leads: 390 }, 4),
  row({ canal: 'Bouche-à-oreille', annee: 2025, nombre_leads: 490 }, 5),
];

describe('pivotTable', () => {
  it('construit une matrice lignes × colonnes correcte', () => {
    const result = pivotTable(rows, [canal], annee, leads, 'SUM', 'Test');
    const pt = result.dataPoints as unknown as PivotTableResult;

    expect(pt.columnLabels).toEqual(['2023', '2024', '2025']);
    expect(pt.rowLabels.sort()).toEqual(['Bouche-à-oreille', 'Réseaux sociaux'].sort());

    const rsIndex = pt.rowLabels.indexOf('Réseaux sociaux');
    expect(pt.matrix[rsIndex]).toEqual([250, 172, 73]);

    const baoIndex = pt.rowLabels.indexOf('Bouche-à-oreille');
    expect(pt.matrix[baoIndex]).toEqual([274, 390, 490]);
  });

  it('calcule des totaux de ligne, de colonne et un total général corrects', () => {
    const result = pivotTable(rows, [canal], annee, leads, 'SUM', 'Test');
    const pt = result.dataPoints as unknown as PivotTableResult;

    const rsIndex = pt.rowLabels.indexOf('Réseaux sociaux');
    expect(pt.rowTotals[rsIndex]).toBe(250 + 172 + 73);

    const col2023Index = pt.columnLabels.indexOf('2023');
    expect(pt.columnTotals[col2023Index]).toBe(250 + 274);

    expect(pt.grandTotal).toBe(250 + 172 + 73 + 274 + 390 + 490);
  });

  it('sans dimension de colonne, produit une seule colonne "Valeur"', () => {
    const result = pivotTable(rows, [canal], null, leads, 'SUM', 'Test');
    const pt = result.dataPoints as unknown as PivotTableResult;
    expect(pt.columnLabels).toEqual(['Valeur']);
    expect(pt.matrix.every((r) => r.length === 1)).toBe(true);
  });

  it('gère plusieurs dimensions en ligne (composite)', () => {
    const withExtra: DatasetRow[] = [
      ...rows,
      row({ canal: 'Réseaux sociaux', annee: 2023, nombre_leads: 10 }, 6), // même ligne que la 1ère
    ];
    const result = pivotTable(withExtra, [canal], annee, leads, 'SUM', 'Test');
    const pt = result.dataPoints as unknown as PivotTableResult;
    const rsIndex = pt.rowLabels.indexOf('Réseaux sociaux');
    const col2023Index = pt.columnLabels.indexOf('2023');
    expect(pt.matrix[rsIndex][col2023Index]).toBe(260); // 250 + 10 cumulés
  });

  it('trie les colonnes numériquement (2023 avant 2024 avant 2025)', () => {
    const shuffled: DatasetRow[] = [rows[2], rows[0], rows[1], rows[3], rows[5], rows[4]];
    const result = pivotTable(shuffled, [canal], annee, leads, 'SUM', 'Test');
    const pt = result.dataPoints as unknown as PivotTableResult;
    expect(pt.columnLabels).toEqual(['2023', '2024', '2025']);
  });

  it('sans colonne de ligne, retourne un résultat vide explicite', () => {
    const result = pivotTable(rows, [], annee, leads, 'SUM', 'Test');
    expect((result.dataPoints as any).rowLabels).toEqual([]);
    expect(result.keyFindings[0]).toMatch(/Aucune colonne/);
  });
});
