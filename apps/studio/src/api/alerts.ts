//apps/studio/src/api/alerts.ts
import { Query } from 'appwrite';
import { databases } from './appwrite';
import { DATABASE_ID, COLLECTIONS } from '@datainsight/shared';
import type { AlertLogEntry } from '@datainsight/shared';

export async function listRecentAlerts(limit = 50): Promise<AlertLogEntry[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ALERTS_LOG, [
    Query.orderDesc('triggered_at'),
    Query.limit(limit),
  ]);
  return response.documents as unknown as AlertLogEntry[];
}