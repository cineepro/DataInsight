// apps/studio/src/api/reports.ts
import { ID, Query } from 'appwrite';
import { databases } from './appwrite';
import { DATABASE_ID, COLLECTIONS } from '@datainsight/shared';
import type { WeeklyReport } from '@datainsight/shared';

export async function getReportForWeek(
  tenantId: string,
  year: number,
  weekNumber: number
): Promise<WeeklyReport | null> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WEEKLY_REPORTS, [
    Query.equal('tenant_id', tenantId),
    Query.equal('year', year),
    Query.equal('week_number', weekNumber),
    Query.limit(1),
  ]);
  return (response.documents[0] as unknown as WeeklyReport) ?? null;
}

/**
 * Crée ou met à jour le brouillon du rapport pour cette tenant+semaine.
 * S'appuie sur l'index unique tenant_id+year+week_number pour éviter les doublons.
 */
export async function saveDraftReport(
  input: Omit<WeeklyReport, '$id' | 'created_at' | 'status'>
): Promise<WeeklyReport> {
  const existing = await getReportForWeek(input.tenant_id, input.year, input.week_number);

  if (existing?.$id) {
    const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.WEEKLY_REPORTS, existing.$id, {
      ...input,
      status: 'DRAFT',
    });
    return updated as unknown as WeeklyReport;
  }

  const created = await databases.createDocument(DATABASE_ID, COLLECTIONS.WEEKLY_REPORTS, ID.unique(), {
    ...input,
    status: 'DRAFT',
    created_at: new Date().toISOString(),
  });
  return created as unknown as WeeklyReport;
}

export async function publishReport(reportDocId: string, analystId: string): Promise<WeeklyReport> {
  const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.WEEKLY_REPORTS, reportDocId, {
    status: 'PUBLISHED',
    analyst_id: analystId,
    published_at: new Date().toISOString(),
  });
  return updated as unknown as WeeklyReport;
}

export async function listReportsForTenant(tenantId: string): Promise<WeeklyReport[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WEEKLY_REPORTS, [
    Query.equal('tenant_id', tenantId),
    Query.orderDesc('created_at'),
    Query.limit(50),
  ]);
  return response.documents as unknown as WeeklyReport[];
}