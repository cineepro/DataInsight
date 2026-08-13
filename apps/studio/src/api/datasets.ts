//apps/studio/src/api/datasets.ts
import { ID, Query } from 'appwrite';
import { databases } from './appwrite';
import { DATABASE_ID, COLLECTIONS } from '@datainsight/shared';
import type {
  DatasetColumnDef,
  DatasetRow,
  ColumnDataType,
  ColumnRole,
} from '../engine/flexible/types';

export interface Dataset {
  $id: string;
  tenant_id: string;
  name: string;
  description?: string;
  source_type: 'EXCEL' | 'CSV' | 'MANUAL';
  period_label?: string;
  status: 'DRAFT' | 'IMPORTED' | 'ANALYZED';
  row_count: number;
  column_count: number;
  uploaded_by?: string;
  created_at: string;
}

export interface DatasetReport {
  $id: string;
  dataset_id: string;
  tenant_id: string;
  analysis_result: string;
  ai_directives?: string;
  status: 'DRAFT' | 'PUBLISHED';
  analyst_id?: string;
  published_at?: string;
  created_at: string;
}

//const COLLECTION_ROW_BATCH_SIZE = 25; // évite de saturer le réseau avec des centaines d'appels simultanés

// ---------------- Datasets ----------------

export async function listDatasetsForTenant(tenantId: string): Promise<Dataset[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.DATASETS, [
    Query.equal('tenant_id', tenantId),
    Query.orderDesc('created_at'),
    Query.limit(100),
  ]);
  return response.documents as unknown as Dataset[];
}

export async function getDataset(datasetId: string): Promise<Dataset> {
  const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.DATASETS, datasetId);
  return doc as unknown as Dataset;
}

export async function createDataset(input: {
  tenant_id: string;
  name: string;
  description?: string;
  source_type: 'EXCEL' | 'CSV' | 'MANUAL';
  period_label?: string;
  uploaded_by?: string;
}): Promise<Dataset> {
  const created = await databases.createDocument(DATABASE_ID, COLLECTIONS.DATASETS, ID.unique(), {
    ...input,
    status: 'DRAFT',
    row_count: 0,
    column_count: 0,
    created_at: new Date().toISOString(),
  });
  return created as unknown as Dataset;
}

export async function updateDatasetStatus(
  datasetId: string,
  status: Dataset['status'],
  counts?: { row_count?: number; column_count?: number }
): Promise<void> {
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.DATASETS, datasetId, { status, ...counts });
}

export async function deleteDataset(datasetId: string): Promise<void> {
  // Supprime le dataset + ses colonnes + ses lignes + ses rapports.
  // Séquentiel volontairement simple (pas de transaction dans Appwrite) —
  // acceptable ici car ce sont des opérations d'administration, pas un flux critique.
  const [columns, rows, reports] = await Promise.all([
    listDatasetColumns(datasetId),
    listAllDatasetRows(datasetId),
    listDatasetReports(datasetId),
  ]);

  await Promise.all([
    ...columns.map((c) => databases.deleteDocument(DATABASE_ID, COLLECTIONS.DATASET_COLUMNS, c.$id)),
    ...rows.map((r) => databases.deleteDocument(DATABASE_ID, COLLECTIONS.DATASET_ROWS, r.$id)),
    ...reports.map((r) => databases.deleteDocument(DATABASE_ID, COLLECTIONS.DATASET_REPORTS, r.$id)),
  ]);

  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.DATASETS, datasetId);
}

// ---------------- Colonnes ----------------

export async function listDatasetColumns(datasetId: string): Promise<DatasetColumnDef[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.DATASET_COLUMNS, [
    Query.equal('dataset_id', datasetId),
    Query.orderAsc('order'),
    Query.limit(200),
  ]);
  return response.documents as unknown as DatasetColumnDef[];
}

export interface NewColumnInput {
  name: string;
  key: string;
  data_type: ColumnDataType;
  role: ColumnRole;
  order: number;
}

/**
 * Crée toutes les colonnes d'un dataset en une passe, appelée une seule
 * fois après validation du mapping par l'analyste (ColumnMappingTable).
 */
export async function saveDatasetColumns(datasetId: string, columns: NewColumnInput[]): Promise<DatasetColumnDef[]> {
  const created = await Promise.all(
    columns.map((col) =>
      databases.createDocument(DATABASE_ID, COLLECTIONS.DATASET_COLUMNS, ID.unique(), {
        dataset_id: datasetId,
        ...col,
      })
    )
  );
  return created as unknown as DatasetColumnDef[];
}

// ---------------- Lignes ----------------

async function listAllDatasetRows(datasetId: string): Promise<DatasetRow[]> {
  const documents: DatasetRow[] = [];
  let cursor: string | undefined;

  while (true) {
    const queries = [Query.equal('dataset_id', datasetId), Query.orderAsc('row_index'), Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.DATASET_ROWS, queries);
    const parsed = response.documents.map((doc: any) => ({
      $id: doc.$id,
      dataset_id: doc.dataset_id,
      row_index: doc.row_index,
      payload: JSON.parse(doc.payload) as Record<string, unknown>,
    }));
    documents.push(...parsed);

    if (response.documents.length < 100) break;
    cursor = response.documents[response.documents.length - 1].$id;
  }

  return documents;
}

export const listDatasetRows = listAllDatasetRows;

const COLLECTION_ROW_BATCH_SIZE = 8; // réduit — reste sous la limite Appwrite même en rafale
const DELAY_BETWEEN_BATCHES_MS = 600; // laisse le temps à la fenêtre de rate-limit de se libérer

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Insère les lignes par petits lots, avec une pause entre chaque, pour
 * rester sous la limite de requêtes d'Appwrite Cloud sur les endpoints de
 * création de documents (429 Too Many Requests au-delà). Plus lent qu'un
 * envoi massif en parallèle, mais fiable — pour un fichier de quelques
 * centaines de lignes, l'import prend quelques dizaines de secondes,
 * acceptable pour un usage d'analyste (pas un flux temps réel).
 */
export async function insertDatasetRows(
  datasetId: string,
  rows: Array<{ row_index: number; payload: Record<string, unknown> }>,
  onProgress?: (inserted: number, total: number) => void
): Promise<void> {
  let inserted = 0;

  for (let i = 0; i < rows.length; i += COLLECTION_ROW_BATCH_SIZE) {
    const batch = rows.slice(i, i + COLLECTION_ROW_BATCH_SIZE);

    // Séquentiel à l'intérieur du lot aussi (pas de Promise.all) — encore
    // plus prudent, quitte à être un peu plus lent, pour éviter tout 429
    // même sur des comptes avec des quotas plus stricts.
    for (const row of batch) {
      let attempt = 0;
      // Petite retry logic : si malgré tout on se prend un 429 isolé,
      // on attend et on réessaie une fois plutôt que de faire échouer
      // tout l'import pour une seule ligne.
      while (true) {
        try {
          await databases.createDocument(DATABASE_ID, COLLECTIONS.DATASET_ROWS, ID.unique(), {
            dataset_id: datasetId,
            row_index: row.row_index,
            payload: JSON.stringify(row.payload),
          });
          break;
        } catch (err: any) {
          attempt++;
          if (err?.code === 429 && attempt <= 2) {
            await delay(2000 * attempt);
            continue;
          }
          throw err;
        }
      }
      inserted++;
      onProgress?.(inserted, rows.length);
    }

    if (i + COLLECTION_ROW_BATCH_SIZE < rows.length) {
      await delay(DELAY_BETWEEN_BATCHES_MS);
    }
  }
}

// ---------------- Rapports ----------------

export async function getReportForDataset(datasetId: string): Promise<DatasetReport | null> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.DATASET_REPORTS, [
    Query.equal('dataset_id', datasetId),
    Query.limit(1),
  ]);
  return (response.documents[0] as unknown as DatasetReport) ?? null;
}

async function listDatasetReports(datasetId: string): Promise<DatasetReport[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.DATASET_REPORTS, [
    Query.equal('dataset_id', datasetId),
    Query.limit(50),
  ]);
  return response.documents as unknown as DatasetReport[];
}

export async function saveDraftDatasetReport(input: {
  dataset_id: string;
  tenant_id: string;
  analysis_result: string;
  ai_directives?: string;
}): Promise<DatasetReport> {
  const existing = await getReportForDataset(input.dataset_id);

  if (existing?.$id) {
    const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.DATASET_REPORTS, existing.$id, {
      ...input,
      status: 'DRAFT',
    });
    return updated as unknown as DatasetReport;
  }

  const created = await databases.createDocument(DATABASE_ID, COLLECTIONS.DATASET_REPORTS, ID.unique(), {
    ...input,
    status: 'DRAFT',
    created_at: new Date().toISOString(),
  });
  return created as unknown as DatasetReport;
}

export async function listReportsForTenant(tenantId: string): Promise<DatasetReport[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.DATASET_REPORTS, [
    Query.equal('tenant_id', tenantId),
    Query.orderDesc('created_at'),
    Query.limit(50),
  ]);
  return response.documents as unknown as DatasetReport[];
}

// ---------------- Ajout à api/datasets.ts : publication ----------------
import { Permission, Role } from 'appwrite';
import { getTenantBySlug } from './tenants';
import { TEAM_IDS } from '@datainsight/shared';

export async function publishDatasetReport(reportDocId: string, analystId: string, tenantSlug: string): Promise<DatasetReport> {
  const tenant = await getTenantBySlug(tenantSlug);

  const permissions = [
    Permission.read(Role.team(TEAM_IDS.ADMINS)),
    Permission.read(Role.team(TEAM_IDS.ANALYSTS)),
    Permission.update(Role.team(TEAM_IDS.ADMINS)),
    Permission.update(Role.team(TEAM_IDS.ANALYSTS)),
    Permission.delete(Role.team(TEAM_IDS.ADMINS)),
  ];

  if (tenant?.client_team_id) {
    permissions.push(Permission.read(Role.team(tenant.client_team_id)));
  }

  const updated = await databases.updateDocument(
    DATABASE_ID,
    COLLECTIONS.DATASET_REPORTS,
    reportDocId,
    {
      status: 'PUBLISHED',
      analyst_id: analystId,
      published_at: new Date().toISOString(),
    },
    permissions
  );

  return updated as unknown as DatasetReport;
}