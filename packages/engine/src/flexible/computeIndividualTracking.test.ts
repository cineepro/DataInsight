//packages/engine/src/flexible/computeIndividualTracking.test.ts
import { describe, it, expect } from 'vitest';
import { computeIndividualTracking } from './computeIndividualTracking';
import type { DatasetColumnDef, DatasetRow } from './types';

function col(key: string, name: string, order: number): DatasetColumnDef {
  return { $id: `col_${key}`, dataset_id: 'test', name, key, data_type: 'TEXT', role: 'DIMENSION', order };
}
function row(payload: Record<string, unknown>, i: number): DatasetRow {
  return { $id: `r${i}`, dataset_id: 'test', row_index: i, payload };
}

const idCol = col('id_apprenant', 'ID', 0);
const semaineCol = col('semaine', 'Semaine', 1);
const presentCol = col('present', 'Présent', 2);
const nomCol = col('nom', 'Nom', 3);

describe('computeIndividualTracking', () => {
  it('marque ACTIVE une personne présente récemment', () => {
    const rows: DatasetRow[] = [
      row({ id_apprenant: 'A1', semaine: 1, present: 1 }, 0),
      row({ id_apprenant: 'A1', semaine: 2, present: 1 }, 1),
      row({ id_apprenant: 'A1', semaine: 3, present: 1 }, 2),
    ];
    const result = computeIndividualTracking(rows, idCol, semaineCol, presentCol, 3);
    expect(result[0].status).toBe('ACTIVE');
    expect(result[0].periodsSinceActive).toBe(0);
  });

  it('marque AT_RISK une personne absente depuis le seuil configuré', () => {
    const rows: DatasetRow[] = [
      row({ id_apprenant: 'A1', semaine: 1, present: 1 }, 0),
      row({ id_apprenant: 'A1', semaine: 2, present: 0 }, 1),
      row({ id_apprenant: 'A1', semaine: 3, present: 0 }, 2),
      row({ id_apprenant: 'A1', semaine: 4, present: 0 }, 3),
    ];
    const result = computeIndividualTracking(rows, idCol, semaineCol, presentCol, 3);
    expect(result[0].status).toBe('AT_RISK');
    expect(result[0].periodsSinceActive).toBe(3);
    expect(result[0].lastActivePeriod).toBe('1');
  });

  it("ne compte JAMAIS une période sans aucune ligne comme de l'inactivité (parcours plus court, déjà terminé)", () => {
    // A1 : parcours long (8 semaines), décroche vraiment en semaine 2.
    // A2 : parcours court (4 semaines), actif jusqu'au bout — ne doit
    // jamais ressortir à risque juste parce que d'autres vont plus loin.
    const rows: DatasetRow[] = [
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((s, i) => row({ id_apprenant: 'A1', semaine: s, present: s <= 2 ? 1 : 0 }, i)),
      ...[1, 2, 3, 4].map((s, i) => row({ id_apprenant: 'A2', semaine: s, present: 1 }, 100 + i)),
    ];
    const result = computeIndividualTracking(rows, idCol, semaineCol, presentCol, 3);
    const a1 = result.find((r) => r.identifierValue === 'A1')!;
    const a2 = result.find((r) => r.identifierValue === 'A2')!;

    expect(a1.status).toBe('AT_RISK'); // vrai décrochage : 6 semaines sans activité après sa dernière présence
    expect(a2.status).toBe('ACTIVE'); // parcours court mais assidu jusqu'au bout — pas de fausse alerte
    expect(a2.periodsSinceActive).toBe(0);
  });

  it('reprend le libellé (ex: nom) depuis la colonne désignée, pas juste l\'identifiant brut', () => {
    const rows: DatasetRow[] = [
      row({ id_apprenant: 'A1', nom: 'Akpovi Jean', semaine: 1, present: 1 }, 0),
    ];
    const result = computeIndividualTracking(rows, idCol, semaineCol, presentCol, 3, nomCol);
    expect(result[0].label).toBe('Akpovi Jean');
  });

  it("sans colonne de libellé désignée, utilise l'identifiant brut comme libellé", () => {
    const rows: DatasetRow[] = [row({ id_apprenant: 'A1', semaine: 1, present: 1 }, 0)];
    const result = computeIndividualTracking(rows, idCol, semaineCol, presentCol, 3);
    expect(result[0].label).toBe('A1');
  });

  it('une personne jamais active est directement AT_RISK dès que le nombre de périodes atteint le seuil', () => {
    const rows: DatasetRow[] = [1, 2, 3].map((s, i) => row({ id_apprenant: 'A1', semaine: s, present: 0 }, i));
    const result = computeIndividualTracking(rows, idCol, semaineCol, presentCol, 3);
    expect(result[0].status).toBe('AT_RISK');
    expect(result[0].lastActivePeriod).toBeNull();
  });

  it('reconnaît les valeurs textuelles affirmatives (Oui/true/1) et négatives (Non/false/0) correctement', () => {
    const rows: DatasetRow[] = [
      row({ id_apprenant: 'A1', semaine: 1, present: 'Oui' }, 0),
      row({ id_apprenant: 'A2', semaine: 1, present: 'true' }, 1),
      row({ id_apprenant: 'A3', semaine: 1, present: 'Non' }, 2),
    ];
    const result = computeIndividualTracking(rows, idCol, semaineCol, presentCol, 3);
    expect(result.find((r) => r.identifierValue === 'A1')!.lastActivePeriod).toBe('1');
    expect(result.find((r) => r.identifierValue === 'A2')!.lastActivePeriod).toBe('1');
    expect(result.find((r) => r.identifierValue === 'A3')!.lastActivePeriod).toBeNull();
  });
});
