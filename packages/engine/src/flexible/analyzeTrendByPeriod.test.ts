//packages/engine/src/flexible/analyzeTrendByPeriod.test.ts
import { describe, it, expect } from 'vitest';
import { analyzeTrendByPeriod } from './analyzeTrendByPeriod';
import type { DatasetColumnDef, DatasetRow } from './types';

function col(key: string, name: string, order: number): DatasetColumnDef {
  return { $id: `col_${key}`, dataset_id: 'test', name, key, data_type: 'TEXT', role: 'DIMENSION', order };
}
function row(payload: Record<string, unknown>, i: number): DatasetRow {
  return { $id: `r${i}`, dataset_id: 'test', row_index: i, payload };
}

const semaine = col('semaine', 'Semaine', 0);
const categorie = col('categorie', 'Catégorie', 1);
const present = col('present', 'Présent', 2);

// Reproduit la forme du cas G.N. Consult : la catégorie LONG chute
// nettement entre la semaine 2 et 3, la catégorie SHORT reste stable.
function buildRows(): DatasetRow[] {
  const rows: DatasetRow[] = [];
  let i = 0;
  // LONG : 10 apprenants/semaine en S1-S2, seulement 4 dès S3 (chute nette)
  for (const [semaineVal, presentCount, total] of [
    [1, 10, 10], [2, 9, 10], [3, 4, 10], [4, 4, 10],
  ] as const) {
    for (let p = 0; p < total; p++) rows.push(row({ semaine: semaineVal, categorie: 'LONG', present: p < presentCount ? 1 : 0 }, i++));
  }
  // SHORT : stable à 9-10/10 sur toutes les semaines
  for (const [semaineVal, presentCount, total] of [
    [1, 10, 10], [2, 9, 10], [3, 9, 10], [4, 10, 10],
  ] as const) {
    for (let p = 0; p < total; p++) rows.push(row({ semaine: semaineVal, categorie: 'SHORT', present: p < presentCount ? 1 : 0 }, i++));
  }
  return rows;
}

describe('analyzeTrendByPeriod', () => {
  const rows = buildRows();

  it('construit une série ordonnée par période pour chaque groupe', () => {
    const result = analyzeTrendByPeriod(rows, semaine, categorie, present, 'AVERAGE', 'Test', {});
    const series = result.dataPoints.series as any[];
    const long = series.find((s) => s.groupValue === 'LONG');
    expect(long.points.map((p: any) => p.period)).toEqual(['1', '2', '3', '4']);
  });

  it('détecte le point de rupture au bon endroit (S2 -> S3) pour la catégorie LONG', () => {
    const result = analyzeTrendByPeriod(rows, semaine, categorie, present, 'AVERAGE', 'Test', {});
    const series = result.dataPoints.series as any[];
    const long = series.find((s) => s.groupValue === 'LONG');
    // index 2 = la 3e période ("3"), donc la transition S2->S3
    expect(long.ruptureIndex).toBe(2);
    expect(long.points[long.ruptureIndex].period).toBe('3');
  });

  it("ne signale PAS de rupture significative pour la catégorie SHORT (stable)", () => {
    const result = analyzeTrendByPeriod(rows, semaine, categorie, present, 'AVERAGE', 'Test', {});
    const findingsText = result.keyFindings.join(' ');
    expect(findingsText).not.toContain('SHORT');
  });

  it('le statut global passe à CRITICAL quand une rupture dépasse le seuil', () => {
    const result = analyzeTrendByPeriod(rows, semaine, categorie, present, 'AVERAGE', 'Test', {});
    expect(result.status).toBe('CRITICAL');
  });

  it('respecte un seuil de rupture personnalisé (plus strict = plus dur à déclencher)', () => {
    // Seuil à -90% : la chute LONG (~-56%) ne doit plus être considérée comme significative
    const result = analyzeTrendByPeriod(rows, semaine, categorie, present, 'AVERAGE', 'Test', { rupture_threshold_percentage: -90 });
    expect(result.status).toBe('OPTIMAL');
  });

  it('fonctionne sans colonne de groupe (série unique "(ensemble)")', () => {
    const result = analyzeTrendByPeriod(rows, semaine, null, present, 'AVERAGE', 'Test', {});
    const series = result.dataPoints.series as any[];
    expect(series).toHaveLength(1);
    expect(series[0].groupValue).toBe('(ensemble)');
  });

  it('trie les périodes numériquement, pas alphabétiquement (10 après 2, pas avant)', () => {
    const rowsWithTen: DatasetRow[] = [
      row({ semaine: 1, present: 1 }, 0),
      row({ semaine: 2, present: 1 }, 1),
      row({ semaine: 10, present: 1 }, 2),
    ];
    const result = analyzeTrendByPeriod(rowsWithTen, semaine, null, present, 'AVERAGE', 'Test', {});
    expect((result.dataPoints.orderedPeriods as string[])).toEqual(['1', '2', '10']);
  });
});
