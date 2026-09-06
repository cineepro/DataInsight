//packages/engine/src/flexible/joinDatasets.ts
import type { DatasetColumnDef, DatasetRow } from './types';

export type JoinType = 'INNER' | 'LEFT';

/**
 * Un dataset "en mémoire" tel que consommé/produit par le module de
 * jointure — les mêmes formes que ce que Studio charge déjà depuis
 * Appwrite (listDatasetColumns / listDatasetRows), plus un libellé
 * lisible utilisé pour préfixer les colonnes en cas de collision de nom.
 */
export interface JoinableDataset {
  datasetId: string;
  datasetLabel: string;
  columns: DatasetColumnDef[];
  rows: DatasetRow[];
}

export interface DatasetJoinResult {
  columns: DatasetColumnDef[];
  rows: DatasetRow[];
  /** Nombre de lignes de `addition` qui n'ont trouvé aucune correspondance côté base (utile pour alerter l'utilisateur). */
  unmatchedAdditionCount: number;
  /** Nombre de lignes de `base` qui n'ont trouvé aucune correspondance côté addition (0 en LEFT join, potentiellement >0 en INNER). */
  unmatchedBaseCount: number;
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'dataset';
}

function keyValue(row: DatasetRow, columnKey: string): string {
  const raw = row.payload[columnKey];
  return raw === undefined || raw === null ? '' : String(raw);
}

/**
 * Fusionne deux listes de colonnes en évitant toute collision de `key` :
 * - la colonne clé de `addition` est exclue du résultat (elle devient
 *   redondante avec celle de `base` une fois la jointure faite) ;
 * - toute autre colonne de `addition` dont la `key` existe déjà côté
 *   `base` est préfixée par le slug du dataset ajouté.
 */
function mergeColumnDefs(
  base: JoinableDataset,
  addition: JoinableDataset,
  additionKeyColumnKey: string
): { columns: DatasetColumnDef[]; additionKeyRenames: Map<string, string> } {
  const baseKeys = new Set(base.columns.map((c) => c.key));
  const additionSlug = slugify(addition.datasetLabel);
  const additionKeyRenames = new Map<string, string>();

  const carriedOverAdditionColumns = addition.columns
    .filter((c) => c.key !== additionKeyColumnKey)
    .map((c, i) => {
      const collides = baseKeys.has(c.key);
      const newKey = collides ? `${additionSlug}__${c.key}` : c.key;
      if (collides) additionKeyRenames.set(c.key, newKey);
      return {
        ...c,
        $id: `merged_${additionSlug}_${c.key}`,
        dataset_id: 'merged',
        key: newKey,
        name: collides ? `${c.name} (${addition.datasetLabel})` : c.name,
        order: base.columns.length + i,
      };
    });

  return { columns: [...base.columns, ...carriedOverAdditionColumns], additionKeyRenames };
}

/**
 * Jointure entre deux datasets sur une paire de colonnes clés, façon
 * SQL JOIN classique : si une ligne de `base` correspond à plusieurs
 * lignes de `addition`, elle est dupliquée une fois par correspondance
 * (c'est volontaire — c'est exactement ce qui permet, par exemple, de
 * croiser un apprenant avec ses N semaines de présence).
 *
 * INNER : seules les lignes de `base` ayant au moins une correspondance
 * sont conservées.
 * LEFT  : toutes les lignes de `base` sont conservées ; les colonnes de
 * `addition` sont remplies à `null` si aucune correspondance n'existe.
 */
export function joinTwoDatasets(
  base: JoinableDataset,
  addition: JoinableDataset,
  baseKeyColumnKey: string,
  additionKeyColumnKey: string,
  joinType: JoinType = 'INNER'
): DatasetJoinResult {
  const { columns, additionKeyRenames } = mergeColumnDefs(base, addition, additionKeyColumnKey);

  const additionIndex = new Map<string, DatasetRow[]>();
  for (const row of addition.rows) {
    const k = keyValue(row, additionKeyColumnKey);
    if (!additionIndex.has(k)) additionIndex.set(k, []);
    additionIndex.get(k)!.push(row);
  }

  const matchedAdditionKeys = new Set<string>();
  const additionColumnKeysToCarry = addition.columns
    .filter((c) => c.key !== additionKeyColumnKey)
    .map((c) => c.key);

  const outRows: DatasetRow[] = [];
  let unmatchedBaseCount = 0;
  let rowIndex = 0;

  for (const baseRow of base.rows) {
    const k = keyValue(baseRow, baseKeyColumnKey);
    const matches = additionIndex.get(k);

    if (matches && matches.length > 0) {
      matchedAdditionKeys.add(k);
      for (const matchRow of matches) {
        const payload: Record<string, unknown> = { ...baseRow.payload };
        for (const addKey of additionColumnKeysToCarry) {
          const outKey = additionKeyRenames.get(addKey) ?? addKey;
          payload[outKey] = matchRow.payload[addKey] ?? null;
        }
        outRows.push({ $id: `merged_row_${rowIndex}`, dataset_id: 'merged', row_index: rowIndex, payload });
        rowIndex++;
      }
    } else {
      unmatchedBaseCount++;
      if (joinType === 'LEFT') {
        const payload: Record<string, unknown> = { ...baseRow.payload };
        for (const addKey of additionColumnKeysToCarry) {
          const outKey = additionKeyRenames.get(addKey) ?? addKey;
          payload[outKey] = null;
        }
        outRows.push({ $id: `merged_row_${rowIndex}`, dataset_id: 'merged', row_index: rowIndex, payload });
        rowIndex++;
      }
    }
  }

  const unmatchedAdditionCount = [...additionIndex.keys()].filter((k) => !matchedAdditionKeys.has(k)).length;

  return { columns, rows: outRows, unmatchedAdditionCount, unmatchedBaseCount };
}

/**
 * Étape d'une chaîne de jointures : ajoute `dataset` au résultat
 * accumulé jusque-là, en joignant sa colonne `keyColumnKey` sur la
 * colonne `previousKeyColumnKey` du résultat accumulé (souvent la même
 * clé logique, mais pas obligatoirement — ex: joindre `presences` sur
 * `id_inscription` alors que l'étape précédente utilisait `id_apprenant`).
 */
export interface JoinStep {
  dataset: JoinableDataset;
  keyColumnKey: string;
  previousKeyColumnKey: string;
  joinType?: JoinType;
}

/**
 * Applique une chaîne de jointures à partir d'un dataset de base.
 * Chaque étape se comporte comme un JOIN SQL supplémentaire appliqué
 * séquentiellement sur le résultat de l'étape précédente — c'est ce qui
 * permet de croiser plus de deux fichiers, chacun potentiellement relié
 * par une clé différente (ex: apprenants → inscriptions → présences).
 */
export function joinManyDatasets(base: JoinableDataset, steps: JoinStep[]): DatasetJoinResult {
  let acc: DatasetJoinResult = {
    columns: base.columns,
    rows: base.rows,
    unmatchedAdditionCount: 0,
    unmatchedBaseCount: 0,
  };

  for (const step of steps) {
    const accAsDataset: JoinableDataset = {
      datasetId: 'merged',
      datasetLabel: 'fusion',
      columns: acc.columns,
      rows: acc.rows,
    };
    // `step.previousKeyColumnKey` désigne la colonne du résultat accumulé
    // jusqu'ici sur laquelle joindre — ça peut être la clé de base
    // d'origine, ou une colonne apportée par une étape précédente
    // (ex: joindre `presences` sur `id_inscription`, une clé apportée
    // par l'étape précédente qui a joint `inscriptions`).
    const stepResult = joinTwoDatasets(accAsDataset, step.dataset, step.previousKeyColumnKey, step.keyColumnKey, step.joinType ?? 'INNER');
    acc = {
      columns: stepResult.columns,
      rows: stepResult.rows,
      unmatchedAdditionCount: acc.unmatchedAdditionCount + stepResult.unmatchedAdditionCount,
      unmatchedBaseCount: acc.unmatchedBaseCount + stepResult.unmatchedBaseCount,
    };
  }

  return acc;
}
