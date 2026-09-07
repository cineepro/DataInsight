//appwrite/functions/api-ask-astra/src/apiAuth.ts
import { createHash } from 'crypto';
import { Databases, Query } from 'node-appwrite';
import type { ApiKey, ApiProductScope } from '@datainsight/shared';

export type AuthResult =
  | { ok: true; apiKey: ApiKey }
  | { ok: false; status: number; error: string };

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Vérifie une clé API reçue dans l'en-tête x-api-key : hash, recherche,
 * statut, scope produit, et quota mensuel. Incrémente requests_used si
 * tout est bon — c'est donc cette fonction qui "consomme" une unité de
 * quota, à appeler une seule fois par requête entrante.
 */
export async function verifyApiKey(
  databases: Databases,
  databaseId: string,
  apiKeysCollectionId: string,
  rawKey: string | undefined,
  requiredScope: ApiProductScope
): Promise<AuthResult> {
  if (!rawKey) {
    return { ok: false, status: 401, error: 'Clé API manquante (en-tête x-api-key requis).' };
  }

  const keyHash = sha256Hex(rawKey);

  const result = await databases.listDocuments(databaseId, apiKeysCollectionId, [
    Query.equal('key_hash', keyHash),
    Query.limit(1),
  ]);

  const apiKey = result.documents[0] as unknown as ApiKey | undefined;

  if (!apiKey) {
    return { ok: false, status: 401, error: 'Clé API invalide.' };
  }

  if (apiKey.status !== 'ACTIVE') {
    return { ok: false, status: 403, error: `Clé API ${apiKey.status.toLowerCase()}.` };
  }

  if (apiKey.product_scope !== 'BOTH' && apiKey.product_scope !== requiredScope) {
    return { ok: false, status: 403, error: "Cette clé n'a pas accès à ce produit." };
  }

  if (apiKey.requests_used >= apiKey.monthly_quota) {
    return { ok: false, status: 429, error: 'Quota mensuel atteint.' };
  }

  await databases.updateDocument(databaseId, apiKeysCollectionId, apiKey.$id, {
    requests_used: apiKey.requests_used + 1,
  });

  return { ok: true, apiKey };
}

export async function logApiUsage(
  databases: Databases,
  databaseId: string,
  usageLogsCollectionId: string,
  keyId: string,
  product: ApiProductScope,
  endpoint: string,
  statusCode: number
): Promise<void> {
  const { ID } = await import('node-appwrite');
  await databases.createDocument(databaseId, usageLogsCollectionId, ID.unique(), {
    key_id: keyId,
    product,
    endpoint,
    status_code: statusCode,
    created_at: new Date().toISOString(),
  });
}