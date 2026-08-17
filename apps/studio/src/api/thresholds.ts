//apps/studio/src/api/thresholds.ts
import { ID, Query } from 'appwrite';
import { databases } from './appwrite';
import { DATABASE_ID, COLLECTIONS } from '@datainsight/shared';
import type { AnalysisThresholdConfig } from '@datainsight/shared';

export async function listThresholdConfigs(): Promise<AnalysisThresholdConfig[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ANALYSIS_THRESHOLDS, [Query.limit(100)]);
  return response.documents as unknown as AnalysisThresholdConfig[];
}

export async function getThresholdConfig(functionId: string): Promise<AnalysisThresholdConfig | null> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ANALYSIS_THRESHOLDS, [
    Query.equal('function_id', functionId),
    Query.limit(1),
  ]);
  return (response.documents[0] as unknown as AnalysisThresholdConfig) ?? null;
}

/**
 * Crée ou met à jour la configuration d'une fonction — un seul document
 * par function_id, jamais de doublon (upsert manuel via recherche préalable).
 */
export async function saveThresholdConfig(
  functionId: string,
  label: string,
  config: Record<string, number>,
  updatedBy?: string
): Promise<AnalysisThresholdConfig> {
  const existing = await getThresholdConfig(functionId);

  const payload = {
    function_id: functionId,
    label,
    config: JSON.stringify(config),
    updated_by: updatedBy,
    updated_at: new Date().toISOString(),
  };

  if (existing?.$id) {
    const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.ANALYSIS_THRESHOLDS, existing.$id, payload);
    return updated as unknown as AnalysisThresholdConfig;
  }

  const created = await databases.createDocument(DATABASE_ID, COLLECTIONS.ANALYSIS_THRESHOLDS, ID.unique(), payload);
  return created as unknown as AnalysisThresholdConfig;
}

/**
 * Remet une fonction à ses valeurs par défaut en supprimant simplement
 * sa configuration — le loader retombera automatiquement sur les
 * defaults codés dans thresholdRegistry.ts.
 */
export async function resetThresholdConfig(functionId: string): Promise<void> {
  const existing = await getThresholdConfig(functionId);
  if (existing?.$id) {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.ANALYSIS_THRESHOLDS, existing.$id);
  }
}