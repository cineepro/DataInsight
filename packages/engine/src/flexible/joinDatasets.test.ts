//packages/engine/src/flexible/joinDatasets.test.ts
import { describe, it, expect } from 'vitest';
import { joinTwoDatasets, joinManyDatasets, datasetFromPlainRows, joinResultToPlainRows, type JoinableDataset } from './joinDatasets';
import type { DatasetColumnDef, DatasetRow } from './types';

function col(key: string, name: string, order: number): DatasetColumnDef {
  return { $id: `col_${key}`, dataset_id: 'test', name, key, data_type: 'TEXT', role: 'DIMENSION', order };
}
function row(id: string, payload: Record<string, unknown>, i: number): DatasetRow {
  return { $id: id, dataset_id: 'test', row_index: i, payload };
}

// Mini scénario reproduisant la structure réelle du cas G.N. Consult :
// des apprenants, leurs inscriptions (parfois plusieurs par apprenant),
// et des lignes de présence hebdomadaire (plusieurs par inscription).
const apprenants: JoinableDataset = {
  datasetId: 'ds_apprenants',
  datasetLabel: 'Apprenants',
  columns: [col('id_apprenant', 'ID apprenant', 0), col('zone', 'Zone', 1)],
  rows: [
    row('a1', { id_apprenant: 'APP0001', zone: 'Cotonou' }, 0),
    row('a2', { id_apprenant: 'APP0002', zone: 'Calavi' }, 1),
  ],
};

const inscriptions: JoinableDataset = {
  datasetId: 'ds_inscriptions',
  datasetLabel: 'Inscriptions',
  columns: [
    col('id_inscription', 'ID inscription', 0),
    col('id_apprenant', 'ID apprenant', 1),
    col('module', 'Module', 2),
  ],
  rows: [
    row('i1', { id_inscription: 'INS0001', id_apprenant: 'APP0001', module: 'Comptabilité' }, 0),
    row('i2', { id_inscription: 'INS0002', id_apprenant: 'APP0001', module: 'RH' }, 1),
    row('i3', { id_inscription: 'INS0003', id_apprenant: 'APP0002', module: 'Informatique' }, 2),
  ],
};

const presences: JoinableDataset = {
  datasetId: 'ds_presences',
  datasetLabel: 'Présences',
  columns: [col('id_inscription', 'ID inscription', 0), col('semaine', 'Semaine', 1), col('present', 'Présent', 2)],
  rows: [
    row('p1', { id_inscription: 'INS0001', semaine: 1, present: 1 }, 0),
    row('p2', { id_inscription: 'INS0001', semaine: 2, present: 0 }, 1),
    row('p3', { id_inscription: 'INS0002', semaine: 1, present: 1 }, 2),
    row('p4', { id_inscription: 'INS0003', semaine: 1, present: 1 }, 3),
  ],
};

describe('joinTwoDatasets', () => {
  it('duplique la ligne de base pour chaque correspondance (relation 1-à-N)', () => {
    const result = joinTwoDatasets(apprenants, inscriptions, 'id_apprenant', 'id_apprenant', 'INNER');
    expect(result.rows).toHaveLength(3); // APP0001 (x2 inscriptions) + APP0002 (x1)
  });

  it('fusionne les colonnes sans dupliquer la clé de jointure', () => {
    const result = joinTwoDatasets(apprenants, inscriptions, 'id_apprenant', 'id_apprenant', 'INNER');
    expect(result.columns.map((c) => c.key).sort()).toEqual(
      ['id_apprenant', 'id_inscription', 'module', 'zone'].sort()
    );
  });

  it('reporte correctement les colonnes de base sur chaque ligne dupliquée', () => {
    const result = joinTwoDatasets(apprenants, inscriptions, 'id_apprenant', 'id_apprenant', 'INNER');
    const app0001Rows = result.rows.filter((r) => r.payload.id_apprenant === 'APP0001');
    expect(app0001Rows.every((r) => r.payload.zone === 'Cotonou')).toBe(true);
  });

  it('préfixe automatiquement une colonne en collision de nom', () => {
    const a: JoinableDataset = {
      datasetId: 'ds_a', datasetLabel: 'Base',
      columns: [col('id', 'ID', 0), col('commentaire', 'Commentaire', 1)],
      rows: [row('x1', { id: '1', commentaire: 'base' }, 0)],
    };
    const b: JoinableDataset = {
      datasetId: 'ds_b', datasetLabel: 'Retours Client',
      columns: [col('id', 'ID', 0), col('commentaire', 'Commentaire', 1)],
      rows: [row('y1', { id: '1', commentaire: 'ajouté' }, 0)],
    };
    const result = joinTwoDatasets(a, b, 'id', 'id', 'INNER');
    expect(result.columns.some((c) => c.key === 'retours_client__commentaire')).toBe(true);
    expect(result.rows[0].payload.commentaire).toBe('base');
    expect(result.rows[0].payload['retours_client__commentaire']).toBe('ajouté');
  });

  it('LEFT join conserve les lignes de base sans correspondance, colonnes ajoutées à null', () => {
    const sansCorrespondance: JoinableDataset = {
      datasetId: 'ds_x', datasetLabel: 'Inscriptions2',
      columns: [col('id_inscription', 'ID inscription', 0), col('id_apprenant', 'ID apprenant', 1)],
      rows: [row('z1', { id_inscription: 'INS9999', id_apprenant: 'APP9999_INCONNU' }, 0)],
    };
    const left = joinTwoDatasets(apprenants, sansCorrespondance, 'id_apprenant', 'id_apprenant', 'LEFT');
    expect(left.rows).toHaveLength(apprenants.rows.length);
    expect(left.rows[0].payload.id_inscription).toBeNull();
  });

  it('INNER join (même cas) ne conserve aucune ligne sans correspondance', () => {
    const sansCorrespondance: JoinableDataset = {
      datasetId: 'ds_x', datasetLabel: 'Inscriptions2',
      columns: [col('id_inscription', 'ID inscription', 0), col('id_apprenant', 'ID apprenant', 1)],
      rows: [row('z1', { id_inscription: 'INS9999', id_apprenant: 'APP9999_INCONNU' }, 0)],
    };
    const inner = joinTwoDatasets(apprenants, sansCorrespondance, 'id_apprenant', 'id_apprenant', 'INNER');
    expect(inner.rows).toHaveLength(0);
  });
});

describe('joinManyDatasets', () => {
  it('enchaîne des jointures sur des clés différentes (scénario G.N. Consult : apprenants -> inscriptions -> présences)', () => {
    const result = joinManyDatasets(apprenants, [
      { dataset: inscriptions, keyColumnKey: 'id_apprenant', previousKeyColumnKey: 'id_apprenant', joinType: 'INNER' },
      { dataset: presences, keyColumnKey: 'id_inscription', previousKeyColumnKey: 'id_inscription', joinType: 'INNER' },
    ]);

    // 4 lignes de présence au total, toutes rattachables -> 4 lignes finales
    expect(result.rows).toHaveLength(4);

    const ins0001Weeks = result.rows
      .filter((r) => r.payload.id_inscription === 'INS0001')
      .map((r) => r.payload.semaine)
      .sort();
    expect(ins0001Weeks).toEqual([1, 2]);

    expect(result.columns.map((c) => c.key).sort()).toEqual(
      ['id_apprenant', 'id_inscription', 'module', 'present', 'semaine', 'zone'].sort()
    );
  });
});

describe('datasetFromPlainRows / joinResultToPlainRows (adaptateurs API)', () => {
  it('construit un JoinableDataset exploitable à partir de simples objets JSON', () => {
    const ds = datasetFromPlainRows('apprenants', [
      { id_apprenant: 'APP0001', zone: 'Cotonou' },
      { id_apprenant: 'APP0002', zone: 'Calavi' },
    ]);
    expect(ds.columns.map((c) => c.key).sort()).toEqual(['id_apprenant', 'zone']);
    expect(ds.rows).toHaveLength(2);
    expect(ds.rows[0].payload).toEqual({ id_apprenant: 'APP0001', zone: 'Cotonou' });
  });

  it('round-trip complet : objets bruts -> jointure -> objets bruts, identique au chemin Studio', () => {
    const dsApprenants = datasetFromPlainRows('apprenants', [
      { id_apprenant: 'APP0001', zone: 'Cotonou' },
      { id_apprenant: 'APP0002', zone: 'Calavi' },
    ]);
    const dsInscriptions = datasetFromPlainRows('inscriptions', [
      { id_inscription: 'INS0001', id_apprenant: 'APP0001', module: 'Comptabilité' },
      { id_inscription: 'INS0002', id_apprenant: 'APP0001', module: 'RH' },
      { id_inscription: 'INS0003', id_apprenant: 'APP0002', module: 'Informatique' },
    ]);

    const result = joinManyDatasets(dsApprenants, [
      { dataset: dsInscriptions, keyColumnKey: 'id_apprenant', previousKeyColumnKey: 'id_apprenant', joinType: 'INNER' },
    ]);
    const plain = joinResultToPlainRows(result);

    expect(plain).toHaveLength(3);
    expect(plain.every((r) => 'zone' in r && 'module' in r)).toBe(true);
    expect(plain.find((r) => r.id_inscription === 'INS0002')?.zone).toBe('Cotonou');
  });
});
