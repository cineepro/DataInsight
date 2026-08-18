// apps/studio/src/api/announcements.ts
import { ID, Query } from 'appwrite';
import { databases } from './appwrite';
import { DATABASE_ID, COLLECTIONS } from '@datainsight/shared';
import type { Announcement } from '@datainsight/shared';

export async function listAllAnnouncements(): Promise<Announcement[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ANNOUNCEMENTS, [
    Query.orderDesc('created_at'),
    Query.limit(100),
  ]);
  return response.documents as unknown as Announcement[];
}

export async function createAnnouncement(title: string, content: string): Promise<Announcement> {
  const created = await databases.createDocument(DATABASE_ID, COLLECTIONS.ANNOUNCEMENTS, ID.unique(), {
    title,
    content,
    status: 'DRAFT',
    created_at: new Date().toISOString(),
  });
  return created as unknown as Announcement;
}

export async function publishAnnouncement(id: string): Promise<void> {
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.ANNOUNCEMENTS, id, {
    status: 'PUBLISHED',
    published_at: new Date().toISOString(),
  });
}

export async function unpublishAnnouncement(id: string): Promise<void> {
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.ANNOUNCEMENTS, id, { status: 'DRAFT' });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.ANNOUNCEMENTS, id);
}