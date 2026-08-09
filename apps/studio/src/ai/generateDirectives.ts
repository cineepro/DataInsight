//apps/studio/src/ai/generateDirectives.ts
import { functions } from '../api/appwrite';
import { buildAnalysisPrompt } from './promptTemplates';
import type { AnalysisResult, Tenant } from '@datainsight/shared';

/**
 * Appelle la Appwrite Function run-claude-analysis (qui détient la clé API
 * Claude côté serveur). Le studio ne parle jamais directement à l'API
 * Anthropic depuis le navigateur.
 */
export async function generateDirectives(
  tenant: Tenant,
  period: string,
  results: AnalysisResult[]
): Promise<string> {
  const prompt = buildAnalysisPrompt({
    tenantName: tenant.name,
    category: tenant.category,
    period,
    results,
  });

  const functionId = import.meta.env.VITE_FUNCTION_RUN_CLAUDE_ANALYSIS;
  const execution = await functions.createExecution(functionId, JSON.stringify({ prompt }), false);

  if (execution.responseStatusCode !== 200) {
    throw new Error("Erreur lors de la génération des directives par l'IA.");
  }

  const parsed = JSON.parse(execution.responseBody) as { directives: string };
  return parsed.directives;
}