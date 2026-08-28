//apps/studio/src/api/apiKeys.ts
import { ID, Query } from 'appwrite';
import { databases } from './appwrite';
import { DATABASE_ID, COLLECTIONS } from '@datainsight/shared';
import type { ApiKey, ApiProductScope, ApiTier, ApiKeyStatus } from '@datainsight/shared';

const TIER_DEFAULT_QUOTAS: Record<ApiTier, number> = {
  TRIAL: 100,
  STARTER: 2000,
  PRO: 20000,
};

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateRandomKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const random = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `di_live_${random}`;
}

function nextMonthDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export async function listApiKeys(): Promise<ApiKey[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.API_KEYS, [
    Query.orderDesc('created_at'),
    Query.limit(100),
  ]);
  return response.documents as unknown as ApiKey[];
}

/**
 * Retourne la clé complète UNE SEULE FOIS — elle n'est jamais stockée en
 * clair, seul son hash l'est. L'appelant (le composant Studio) doit
 * l'afficher immédiatement à l'écran et prévenir que ça ne se reproduira
 * plus, exactement comme la console Anthropic le fait pour ses propres clés.
 */
export async function createApiKey(input: {
  owner_name: string;
  owner_email: string;
  product_scope: ApiProductScope;
  tier: ApiTier;
}): Promise<{ apiKey: ApiKey; plainTextKey: string }> {
  const plainTextKey = generateRandomKey();
  const keyHash = await sha256Hex(plainTextKey);
  const keyPrefix = plainTextKey.slice(0, 16);

  const created = await databases.createDocument(DATABASE_ID, COLLECTIONS.API_KEYS, ID.unique(), {
    key_prefix: keyPrefix,
    key_hash: keyHash,
    owner_name: input.owner_name,
    owner_email: input.owner_email,
    product_scope: input.product_scope,
    tier: input.tier,
    monthly_quota: TIER_DEFAULT_QUOTAS[input.tier],
    requests_used: 0,
    period_reset_at: nextMonthDate(),
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
  });

  return { apiKey: created as unknown as ApiKey, plainTextKey };
}

export async function updateApiKeyStatus(id: string, status: ApiKeyStatus): Promise<void> {
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.API_KEYS, id, { status });
}

export async function deleteApiKey(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.API_KEYS, id);
}