//apps/studio/src/ai/generateDirectives.ts
import { functions } from '../api/appwrite';
import { buildAnalysisPrompt, buildDatasetAnalysisPrompt } from './promptTemplates';
import type { AnalysisResult, Tenant } from '@datainsight/shared';

async function callClaudeFunction(prompt: string): Promise<string> {
  const functionId = import.meta.env.VITE_FUNCTION_RUN_CLAUDE_ANALYSIS;
  const execution = await functions.createExecution(functionId, JSON.stringify({ prompt }), false);

  if (execution.responseStatusCode !== 200) {
    throw new Error("Erreur lors de la génération des directives par l'IA.");
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