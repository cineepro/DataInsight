//apps/ai-lab/src/api/officialSources.ts
import { Query } from 'appwrite';
import { databases } from './client';
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_OFFICIAL_SOURCES = import.meta.env.VITE_COLLECTION_OFFICIAL_SOURCES;

export interface OfficialSource {
  $id: string;
  name: string;
  description?: string;
  status: 'NEGOTIATING' | 'ACTIVE' | 'PAUSED';
  sync_frequency?: string;
  last_synced_at?: string;
  sector: string;
}

export async function listPublicOfficialSources(): Promise<OfficialSource[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTION_OFFICIAL_SOURCES, [
    Query.orderAsc('name'),
    Query.limit(50),
  ]);
  return response.documents as unknown as OfficialSource[];
}