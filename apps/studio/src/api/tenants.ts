//apps/studio/src/api/tenants.ts
import { ID, Query } from 'appwrite';
import { databases } from './appwrite';
import { DATABASE_ID, COLLECTIONS } from '@datainsight/shared';
import type { Tenant, TenantCategory } from '@datainsight/shared';

export async function listTenants(category?: TenantCategory): Promise<Tenant[]> {
  const queries = category ? [Query.equal('category', category)] : [];
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TENANTS, queries);
  return response.documents as unknown as Tenant[];
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TENANTS, [
    Query.equal('slug', slug),
    Query.limit(1),
  ]);
  return (response.documents[0] as unknown as Tenant) ?? null;
}

export async function createTenant(input: Omit<Tenant, '$id' | 'created_at'>): Promise<Tenant> {
  const document = await databases.createDocument(DATABASE_ID, COLLECTIONS.TENANTS, ID.unique(), {
    ...input,
    created_at: new Date().toISOString(),
  });
  return document as unknown as Tenant;
}

export async function updateTenant(tenantDocId: string, updates: Partial<Tenant>): Promise<Tenant> {
  const document = await databases.updateDocument(DATABASE_ID, COLLECTIONS.TENANTS, tenantDocId, updates);
  return document as unknown as Tenant;
}

/**
 * Supprime uniquement le document tenant lui-même. Les scans déjà soumis
 * pour ce tenant (scans_restaurant/pharmacie/entreprise), ses rapports et
 * son historique de facturation ne sont PAS supprimés automatiquement —
 * volontairement, pour ne jamais perdre de données par accident. Pour un
 * tenant de test sans données réelles, ça n'a aucune importance ; pour un
 * vrai client qu'on retire, un nettoyage complet se ferait à la main dans
 * la console Appwrite si nécessaire.
 */
export async function deleteTenant(tenantDocId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.TENANTS, tenantDocId);
}