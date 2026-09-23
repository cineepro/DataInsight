//apps/studio/src/api/datasetTracking.ts
import { Query, ID } from 'appwrite';
import { databases } from './appwrite';
import { DATABASE_ID, COLLECTIONS } from '@datainsight/shared';
import type { TrackedIndividualResult, TrackingStatus } from '../engine/flexible/computeIndividualTracking';

export interface DatasetTrackingConfig {
  $id: string;
  dataset_id: string;
  tenant_id: string;
  identifier_column_key: string;
  label_column_key?: string;
  period_column_key: string;
  activity_column_key: string;
  inactivity_threshold: number;
  enabled: boolean;
}

export interface TrackedIndividual {
  $id: string;
  dataset_id: string;
  tenant_id: string;
  identifier_value: string;
  label: string;
  status: TrackingStatus;
  last_active_period: string | null;
  periods_since_active: number;
  updated_at: string;
}

export async function getTrackingConfig(datasetId: string): Promise<DatasetTrackingConfig | null> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.DATASET_TRACKING_CONFIGS, [
    Query.equal('dataset_id', datasetId),
    Query.limit(1),
  ]);
  return (response.documents[0] as unknown as DatasetTrackingConfig) ?? null;
}

export async function saveTrackingConfig(input: {
  dataset_id: string;
  tenant_id: string;
  identifier_column_key: string;
  label_column_key?: string;
  period_column_key: string;
  activity_column_key: string;
  inactivity_threshold: number;
}): Promise<DatasetTrackingConfig> {
  const existing = await getTrackingConfig(input.dataset_id);

  if (existing?.$id) {
    const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.DATASET_TRACKING_CONFIGS, existing.$id, {
      ...input,
      enabled: true,
    });
    return updated as unknown as DatasetTrackingConfig;
  }

  const created = await databases.createDocument(DATABASE_ID, COLLECTIONS.DATASET_TRACKING_CONFIGS, ID.unique(), {
    ...input,
    enabled: true,
  });
  return created as unknown as DatasetTrackingConfig;
}

export async function listTrackedIndividuals(datasetId: string): Promise<TrackedIndividual[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.DATASET_TRACKED_INDIVIDUALS, [
    Query.equal('dataset_id', datasetId),
    Query.orderAsc('label'),
    Query.limit(500),
  ]);
  return response.documents as unknown as TrackedIndividual[];
}

/**
 * Persiste le résultat du calcul de suivi : met à jour les fiches déjà
 * connues, crée les nouvelles. Séquentiel et espacé, comme
 * insertDatasetRows, pour rester sous la limite de requêtes d'Appwrite
 * côté navigateur.
 */
export async function saveTrackedIndividuals(
  datasetId: string,
  tenantId: string,
  results: TrackedIndividualResult[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const existing = await listTrackedIndividuals(datasetId);
  const existingByIdentifier = new Map(existing.map((e) => [e.identifier_value, e]));

  let done = 0;
  for (const result of results) {
    const match = existingByIdentifier.get(result.identifierValue);
    const payload = {
      dataset_id: datasetId,
      tenant_id: tenantId,
      identifier_value: result.identifierValue,
      label: result.label,
      status: result.status,
      last_active_period: result.lastActivePeriod,
      periods_since_active: result.periodsSinceActive,
      updated_at: new Date().toISOString(),
    };

    if (match) {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.DATASET_TRACKED_INDIVIDUALS, match.$id, payload);
    } else {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.DATASET_TRACKED_INDIVIDUALS, ID.unique(), payload);
    }

    done++;
    onProgress?.(done, results.length);
    if (done < results.length) await new Promise((resolve) => setTimeout(resolve, 250));
  }
}
