//apps/ai-lab/src/api/chat.ts
import { functions } from './client';
import { getOrCreateVisitorToken } from '../utils/visitorToken';

interface AskResponse {
  answer?: string;
  conversation_id?: string;
  error?: string;
}

export async function askQuestion(
  question: string,
  sector: string,
  conversationId?: string,
  officialSourceId?: string
): Promise<{ answer: string; conversationId?: string }> {
  const functionId = import.meta.env.VITE_FUNCTION_ASK_AI_LAB;

  const execution = await functions.createExecution(
    functionId,
    JSON.stringify({
      question,
      sector,
      visitor_token: getOrCreateVisitorToken(),
      conversation_id: conversationId,
      official_source_id: officialSourceId,
    }),
    false
  );

  const parsed = JSON.parse(execution.responseBody) as AskResponse;

  if (execution.responseStatusCode !== 200 || !parsed.answer) {
    throw new Error(parsed.error ?? "Erreur lors de la génération de la réponse.");
  }

  return { answer: parsed.answer, conversationId: parsed.conversation_id };
}