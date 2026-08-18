//apps/ai-lab/src/api/contribution.ts
import { functions } from './client';
import { getOrCreateVisitorToken } from '../utils/visitorToken';

interface ContributionResponse {
  success?: boolean;
  error?: string;
}

export async function submitContribution(input: {
  title: string;
  sector: string;
  content: string;
  contributorName?: string;
  contributorContact?: string;
}): Promise<void> {
  const functionId = import.meta.env.VITE_FUNCTION_SUBMIT_KNOWLEDGE_CONTRIBUTION;

  const execution = await functions.createExecution(
    functionId,
    JSON.stringify({
      title: input.title,
      sector: input.sector,
      content: input.content,
      contributor_name: input.contributorName || undefined,
      contributor_contact: input.contributorContact || undefined,
      visitor_token: getOrCreateVisitorToken(),
    }),
    false
  );

  const parsed = JSON.parse(execution.responseBody) as ContributionResponse;

  if (execution.responseStatusCode !== 200 || !parsed.success) {
    throw new Error(parsed.error ?? "Erreur lors de l'envoi de votre contribution.");
  }
}