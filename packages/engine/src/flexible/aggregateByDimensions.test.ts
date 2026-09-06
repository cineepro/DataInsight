//packages/engine/src/flexible/aggregateByDimensions.test.ts
import { describe, it, expect } from 'vitest';
import { aggregateByDimensions } from './aggregateByDimensions';
import type { DatasetColumnDef, DatasetRow } from './types';

function col(key: string, name: string, order: number): DatasetColumnDef {
  return { $id: `col_${key}`, dataset_id: 'test', name, key, data_type: 'TEXT', role: 'DIMENSION', order };
}
function row(payload: Record<string, unknown>, i: number): DatasetRow {
  return { $id: `r${i}`, dataset_id: 'test', row_index: i, payload };
}

// Reproduit le croisement catégorie × mode de paiement du cas G.N. Consult
const categorie = col('categorie', 'Catégorie', 0);
const paiement = col('mode_paiement', 'Mode de paiement', 1);
const finalise = col('a_finalise', 'Finalisé', 2);

const rows: DatasetRow[] = [
  row({ categorie: 'LONG', mode_paiement: 'Comptant', a_finalise: 1 }, 0),
  row({ categorie: 'LONG', mode_paiement: 'Comptant', a_finalise: 0 }, 1),
  row({ categorie: 'LONG', mode_paiement: 'Par tranches', a_finalise: 0 }, 2),
  row({ categorie: 'LONG', mode_paiement: 'Par tranches', a_finalise: 0 }, 3),
  row({ categorie: 'SHORT', mode_paiement: 'Comptant', a_finalise: 1 }, 4),
];

describe('aggregateByDimensions', () => {
  it('groupe sur la combinaison de 2 colonnes, pas juste la première', () => {
    const result = aggregateByDimensions(rows, [categorie, paiement], finalise, 'AVERAGE', 'Test');
    const groups = result.dataPoints.groups as Array<{ label: string; value: number; count: number }>;

    // 3 combinaisons distinctes attendues : LONG·Comptant, LONG·Par tranches, SHORT·Comptant
    expect(groups).toHaveLength(3);

    const longComptant = groups.find((g) => g.label === 'LONG · Comptant');
    expect(longComptant?.value).toBe(0.5); // moyenne de 1 et 0
    expect(longComptant?.count).toBe(2);

    const longTranches = groups.find((g) => g.label === 'LONG · Par tranches');
    expect(longTranches?.value).toBe(0);
    expect(longTranches?.count).toBe(2);
  });

  it("conserve dimensionValues indexé par clé de colonne, pour un usage programmatique au-delà du libellé", () => {
    const result = aggregateByDimensions(rows, [categorie, paiement], finalise, 'AVERAGE', 'Test');
    const groups = result.dataPoints.groups as Array<{ dimensionValues: Record<string, string> }>;
    const match = groups.find((g) => g.dimensionValues.categorie === 'SHORT');
    expect(match?.dimensionValues.mode_paiement).toBe('Comptant');
  });

  it('le nom de la métrique combine les libellés des colonnes avec ×', () => {
    const result = aggregateByDimensions(rows, [categorie, paiement], finalise, 'AVERAGE', 'Test');
    expect(result.metricName).toContain('Catégorie × Mode de paiement');
  });

  it('sans colonne de dimension, retourne un résultat vide explicite plutôt qu\'une erreur', () => {
    const result = aggregateByDimensions(rows, [], finalise, 'AVERAGE', 'Test');
    expect(result.dataPoints.groups).toEqual([]);
    expect(result.keyFindings[0]).toMatch(/Aucune colonne/);
  });
});
