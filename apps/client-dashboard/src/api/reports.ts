// apps/client-dashboard/src/api/reports.ts
import { Query } from 'appwrite';
import { databases } from './appwrite';
import { DATABASE_ID, COLLECTIONS } from '@datainsight/shared';
import type { WeeklyReport } from '@datainsight/shared';

/**
 * Ne retourne QUE les rapports PUBLISHED — un brouillon (DRAFT) n'est
 * jamais visible côté client, même si les permissions de la Team le
 * permettaient techniquement pour un document déjà accordé.
 */
export async function listPublishedReports(tenantSlug: string): Promise<WeeklyReport[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WEEKLY_REPORTS, [
    Query.equal('tenant_id', tenantSlug),
    Query.equal('status', 'PUBLISHED'),
    Query.orderDesc('published_at'),
    Query.limit(50),
  ]);
  return response.documents as unknown as WeeklyReport[];
}