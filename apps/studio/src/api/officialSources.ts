//apps/studio/src/api/officialSources.ts
import { ID, Query } from 'appwrite';
import { databases } from './appwrite';
import { DATABASE_ID, COLLECTIONS } from '@datainsight/shared';
import type { OfficialSource, OfficialSourceStatus } from '@datainsight/shared';

export async function listOfficialSources(): Promise<OfficialSource[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.OFFICIAL_SOURCES, [
    Query.orderDesc('$createdAt'),
    Query.limit(50),
  ]);
  return response.documents as unknown as OfficialSource[];
}

export async function createOfficialSource(input: {
  name: string;
  description?: string;
  sector: string;
  sync_frequency?: string;
}): Promise<OfficialSource> {
  const created = await databases.createDocument(DATABASE_ID, COLLECTIONS.OFFICIAL_SOURCES, ID.unique(), {
    ...input,
    status: 'NEGOTIATING',
  });
  return created as unknown as OfficialSource;
}

export async function updateOfficialSourceStatus(id: string, status: OfficialSourceStatus): Promise<void> {
  const updates: Record<string, unknown> = { status };
  if (status === 'ACTIVE') updates.last_synced_at = new Date().toISOString();
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.OFFICIAL_SOURCES, id, updates);
}

export async function deleteOfficialSource(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.OFFICIAL_SOURCES, id);
}