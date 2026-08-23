//apps/ai-lab/src/api/history.ts
import { Query } from 'appwrite';
import { databases } from './client';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_CONVERSATIONS = import.meta.env.VITE_COLLECTION_AI_LAB_CONVERSATIONS;
const COLLECTION_MESSAGES = import.meta.env.VITE_COLLECTION_AI_LAB_MESSAGES;

export interface Conversation {
  $id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  $id: string;
  conversation_id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  created_at: string;
}

export async function listConversations(userId: string): Promise<Conversation[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTION_CONVERSATIONS, [
    Query.equal('user_id', userId),
    Query.orderDesc('updated_at'),
    Query.limit(50),
  ]);
  return response.documents as unknown as Conversation[];
}

export async function listMessagesForConversation(conversationId: string): Promise<ConversationMessage[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTION_MESSAGES, [
    Query.equal('conversation_id', conversationId),
    Query.orderAsc('created_at'),
    Query.limit(200),
  ]);
  return response.documents as unknown as ConversationMessage[];
}