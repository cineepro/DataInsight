//apps/studio/src/ai/generateDirectives.ts
import { functions } from '../api/appwrite';
import { buildAnalysisPrompt, buildDatasetAnalysisPrompt } from './promptTemplates';
import type { AnalysisResult, Tenant } from '@datainsight/shared';

async function callClaudeFunction(prompt: string): Promise<string> {
  const functionId = import.meta.env.VITE_FUNCTION_RUN_CLAUDE_ANALYSIS;
  const execution = await functions.createExecution(functionId, JSON.stringify({ prompt }), false);

  if (execution.responseStatusCode !== 200) {
    // On essaie de remonter le vrai message d'erreur renvoyé par la
    // fonction (ex: "Erreur lors de l'appel à l'IA.") plutôt qu'un
    // message générique — ça évite d'avoir à systématiquement aller
    // fouiller les logs Appwrite pour un diagnostic de premier niveau.
    let detail = '';
    try {
      const parsed = JSON.parse(execution.responseBody) as { error?: string };
      detail = parsed.error ?? '';
    } catch {
      detail = execution.responseBody?.slice(0, 200) ?? '';
    }
    throw new Error(
      `Erreur lors de la génération des directives par l'IA (code ${execution.responseStatusCode})${detail ? ` : ${detail}` : ''}.`
    );
  }

  const parsed = JSON.parse(execution.responseBody) as { directives: string };
  return parsed.directives;
}

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
  return callClaudeFunction(prompt);
}

export async function generateDatasetDirectives(
  tenant: Tenant,
  datasetName: string,
  period: string,
  results: AnalysisResult[]
): Promise<string> {
  const prompt = buildDatasetAnalysisPrompt({
    tenantName: tenant.name,
    category: tenant.category,
    datasetName,
    period,
    results,
  });
  return callClaudeFunction(prompt);
}