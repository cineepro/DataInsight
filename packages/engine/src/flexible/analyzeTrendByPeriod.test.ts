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

  // Reproduit le bug réel trouvé en pratique sur le cas G.N. Consult :
  // un module court (4 semaines) n'a structurellement AUCUNE ligne de
  // présence en semaine 5+, puisque la formation est déjà terminée. Ça
  // ne doit jamais ressortir comme une chute à -100%.
  describe('périodes sans aucune donnée (formation déjà terminée)', () => {
    function buildMixedDurationRows(): DatasetRow[] {
      const rows: DatasetRow[] = [];
      let i = 0;
      // Module "Informatique" (court, 4 semaines) : stable et complet sur ses 4 semaines, puis plus rien.
      for (const semaineVal of [1, 2, 3, 4]) {
        for (let p = 0; p < 10; p++) {
          rows.push(row({ semaine: semaineVal, module: 'Informatique', present: 1 }, i++));
        }
      }
      // Module "RH" (long, 8 semaines pour ce test) : chute réelle et significative en semaine 3.
      for (const [semaineVal, presentCount] of [[1, 10], [2, 9], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4]] as const) {
        for (let p = 0; p < 10; p++) {
          rows.push(row({ semaine: semaineVal, module: 'RH', present: p < presentCount ? 1 : 0 }, i++));
        }
      }
      return rows;
    }

    const rows = buildMixedDurationRows();
    const module = col('module', 'Module', 1);

    it("une période sans aucune ligne vaut null, pas 0", () => {
      const result = analyzeTrendByPeriod(rows, semaine, module, present, 'AVERAGE', 'Test', {});
      const series = result.dataPoints.series as any[];
      const info = series.find((s) => s.groupValue === 'Informatique');
      const semaine5 = info.points.find((p: any) => p.period === '5');
      expect(semaine5.value).toBeNull();
      expect(semaine5.count).toBe(0);
    });

    it("le module court (Informatique) n'a AUCUN point de rupture détecté", () => {
      const result = analyzeTrendByPeriod(rows, semaine, module, present, 'AVERAGE', 'Test', {});
      const series = result.dataPoints.series as any[];
      const info = series.find((s) => s.groupValue === 'Informatique');
      expect(info.ruptureIndex).toBeNull();
    });

    it('la vraie rupture (module RH, semaine 2->3) est bien détectée, elle', () => {
      const result = analyzeTrendByPeriod(rows, semaine, module, present, 'AVERAGE', 'Test', {});
      const series = result.dataPoints.series as any[];
      const rh = series.find((s) => s.groupValue === 'RH');
      expect(rh.points[rh.ruptureIndex].period).toBe('3');
    });

    it("le résumé ne mentionne QUE la vraie rupture, jamais Informatique", () => {
      const result = analyzeTrendByPeriod(rows, semaine, module, present, 'AVERAGE', 'Test', {});
      expect(result.keyFindings.some((f) => f.includes('RH'))).toBe(true);
      expect(result.keyFindings.some((f) => f.includes('Informatique'))).toBe(false);
    });
  });
});
