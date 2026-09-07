// apps/studio/src/api/aiLab.ts
import { ID, Query } from 'appwrite';
import { databases } from './appwrite';
import { DATABASE_ID, COLLECTIONS } from '@datainsight/shared';

export interface KnowledgeBaseEntry {
  $id: string;
  title: string;
  sector: string;
  content: string;
  status: 'PUBLISHED' | 'DRAFT';
  origin?: 'MANUAL' | 'AI_SUGGESTED' | 'PUBLIC_CONTRIBUTION' | 'OFFICIAL_SOURCE';
  contributor_name?: string;
  contributor_contact?: string;
  source_question_count?: number;
  /** Renseigné pour les entrées issues d'un PDF importé ou d'une source officielle suivie. */
  source_document_name?: string;
  /** Lien vers la source officielle d'origine — c'est ce qui fait de chaque source sa propre "boîte" de connaissances. */
  official_source_id?: string;
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

export async function listKnowledgeBaseEntries(status?: 'PUBLISHED' | 'DRAFT'): Promise<KnowledgeBaseEntry[]> {
  const queries = [Query.orderDesc('created_at'), Query.limit(100)];
  if (status) queries.unshift(Query.equal('status', status));

  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.KNOWLEDGE_BASE, queries);
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
    status: 'PUBLISHED', // création manuelle directe par toi = publiée immédiatement
    created_at: new Date().toISOString(),
  });
  return created as unknown as KnowledgeBaseEntry;
}

export async function updateKnowledgeBaseEntry(
  id: string,
  updates: Partial<Pick<KnowledgeBaseEntry, 'title' | 'content' | 'sector' | 'status'>>
): Promise<KnowledgeBaseEntry> {
  const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.KNOWLEDGE_BASE, id, updates);
  return updated as unknown as KnowledgeBaseEntry;
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