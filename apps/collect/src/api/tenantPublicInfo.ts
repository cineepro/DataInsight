// apps/collect/src/api/tenantPublicInfo.ts
import { functions } from './client';
import type { TenantPublicInfo } from '@datainsight/shared';

/**
 * Appelle la Appwrite Function get-tenant-public-info.
 * Ne fait JAMAIS de lecture directe sur la collection `tenants` :
 * la Function tourne côté serveur avec une clé API et ne renvoie
 * que {name, logo_url, category} — jamais l'email, l'adresse ou le statut.
 */
export async function fetchTenantPublicInfo(slug: string): Promise<TenantPublicInfo | null> {
  try {
    const functionId = import.meta.env.VITE_FUNCTION_GET_TENANT_PUBLIC_INFO;
    const execution = await functions.createExecution(
      functionId,
      JSON.stringify({ slug }),
      false // synchrone : on attend le résultat
    );

    if (execution.responseStatusCode !== 200) {
      return null;
    }

    return JSON.parse(execution.responseBody) as TenantPublicInfo;
  } catch (error) {
    console.error('Erreur récupération tenant:', error);
    return null;
  }
}