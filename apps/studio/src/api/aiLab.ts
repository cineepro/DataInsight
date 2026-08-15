// apps/studio/src/api/aiLab.ts
import { ID, Query } from 'appwrite';
import { databases } from './appwrite';
import { DATABASE_ID, COLLECTIONS } from '@datainsight/shared';

export interface KnowledgeBaseEntry {
  $id: string;
  title: string;
  sector: string;
  content: string;
  created_by?: string;
  created_at: string;
}

export interface AiChatLog {
  $id: string;
  visitor_hash: string;
  sector: string;
  question: string;
  answer: string;
  created_at: string;
}

export async function listKnowledgeBaseEntries(): Promise<KnowledgeBaseEntry[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.KNOWLEDGE_BASE, [
    Query.orderDesc('created_at'),
    Query.limit(100),
  ]);
  return response.documents as unknown as KnowledgeBaseEntry[];
}

export async function createKnowledgeBaseEntry(input: {
  title: string;
  sector: string;
  content: string;
  created_by?: string;
}): Promise<KnowledgeBaseEntry> {
  const created = await databases.createDocument(DATABASE_ID, COLLECTIONS.KNOWLEDGE_BASE, ID.unique(), {
    ...input,
    created_at: new Date().toISOString(),
  });
  return created as unknown as KnowledgeBaseEntry;
}

export async function deleteKnowledgeBaseEntry(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.KNOWLEDGE_BASE, id);
}

export async function listRecentChatLogs(limit = 50): Promise<AiChatLog[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.AI_CHAT_LOGS, [
    Query.orderDesc('created_at'),
    Query.limit(limit),
  ]);
  return response.documents as unknown as AiChatLog[];
}