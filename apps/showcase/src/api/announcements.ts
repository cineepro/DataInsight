// apps/showcase/src/api/announcements.ts
import { Client, Databases, Query } from 'appwrite';
import type { Announcement } from '@datainsight/shared';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

export async function listPublishedAnnouncements(): Promise<Announcement[]> {
  const response = await databases.listDocuments(
    import.meta.env.VITE_APPWRITE_DATABASE_ID,
    import.meta.env.VITE_COLLECTION_ANNOUNCEMENTS,
    [Query.equal('status', 'PUBLISHED'), Query.orderDesc('published_at'), Query.limit(50)]
  );
  return response.documents as unknown as Announcement[];
}