//apps/client-dashboard/src/api/reports.ts
import { Query } from 'appwrite';
import { databases } from './appwrite';
import { DATABASE_ID, COLLECTIONS } from '@datainsight/shared';
import type { WeeklyReport } from '@datainsight/shared';

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

export interface DatasetInfo {
  $id: string;
  name: string;
  period_label?: string;
}

export async function listPublishedReports(tenantSlug: string): Promise<WeeklyReport[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WEEKLY_REPORTS, [
    Query.equal('tenant_id', tenantSlug),
    Query.equal('status', 'PUBLISHED'),
    Query.orderDesc('published_at'),
    Query.limit(50),
  ]);
  return response.documents as unknown as WeeklyReport[];
}

/**
 * Rapports issus de fichiers Excel/CSV importés par l'équipe ASILLIA —
 * collection séparée de weekly_reports, filtrée de la même façon
 * (uniquement PUBLISHED) pour ne jamais exposer un brouillon au client.
 */
export async function listPublishedDatasetReports(tenantSlug: string): Promise<DatasetReport[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.DATASET_REPORTS, [
    Query.equal('tenant_id', tenantSlug),
    Query.equal('status', 'PUBLISHED'),
    Query.orderDesc('published_at'),
    Query.limit(50),
  ]);
  return response.documents as unknown as DatasetReport[];
}

/**
 * Le gérant ne voit jamais l'écran de mapping ni les données brutes —
 * juste le nom et la période du dataset, pour donner un minimum de
 * contexte au-dessus des directives (ex: "Ventes Janvier 2026").
 */
export async function getDatasetInfo(datasetId: string): Promise<DatasetInfo | null> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.DATASETS, datasetId);
    return { $id: doc.$id, name: (doc as any).name, period_label: (doc as any).period_label };
  } catch {
    return null;
  }
}