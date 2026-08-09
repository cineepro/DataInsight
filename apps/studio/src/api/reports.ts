//apps/studio/src/api/reports.ts
import { ID, Query } from 'appwrite';
import { databases, functions } from './appwrite';
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
 * Reste en appel direct SDK client : c'est une opération de brouillon
 * fréquente, sans notification, pas besoin de passer par une Function.
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

interface PublishFunctionResponse {
  success: boolean;
  report?: WeeklyReport;
  error?: string;
}

/**
 * Publication centralisée via la Appwrite Function publish-weekly-report :
 * la Function marque le rapport PUBLISHED ET envoie la notification email
 * au tenant en une seule opération atomique côté serveur. Remplace l'ancien
 * appel direct databases.updateDocument().
 */
export async function publishReport(reportDocId: string, analystId: string): Promise<WeeklyReport> {
  const functionId = import.meta.env.VITE_FUNCTION_PUBLISH_WEEKLY_REPORT;

  const execution = await functions.createExecution(
    functionId,
    JSON.stringify({ reportId: reportDocId, analystId }),
    false // synchrone : on attend le résultat avant de continuer
  );

  if (execution.responseStatusCode !== 200) {
    throw new Error('Erreur lors de la publication du rapport.');
  }

  const parsed = JSON.parse(execution.responseBody) as PublishFunctionResponse;

  if (!parsed.success || !parsed.report) {
    throw new Error(parsed.error ?? 'Publication échouée.');
  }

  return parsed.report;
}

export async function listReportsForTenant(tenantId: string): Promise<WeeklyReport[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WEEKLY_REPORTS, [
    Query.equal('tenant_id', tenantId),
    Query.orderDesc('created_at'),
    Query.limit(50),
  ]);
  return response.documents as unknown as WeeklyReport[];
}