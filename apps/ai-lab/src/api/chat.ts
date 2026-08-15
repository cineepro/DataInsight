// apps/ai-lab/src/api/chat.ts
import { functions } from './client';
import { getOrCreateVisitorToken } from '../utils/visitorToken';

interface AskResponse {
  answer?: string;
  error?: string;
}

export async function askQuestion(question: string, sector: string): Promise<string> {
  const functionId = import.meta.env.VITE_FUNCTION_ASK_AI_LAB;

  const execution = await functions.createExecution(
    functionId,
    JSON.stringify({
      question,
      sector,
      visitor_token: getOrCreateVisitorToken(),
    }),
    false
  );

  const parsed = JSON.parse(execution.responseBody) as AskResponse;

  if (execution.responseStatusCode !== 200 || !parsed.answer) {
    throw new Error(parsed.error ?? "Erreur lors de la génération de la réponse.");
  }

  return parsed.answer;
}