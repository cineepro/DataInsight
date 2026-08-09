// apps/studio/src/api/scans.ts
import { Query } from 'appwrite';
import { databases } from './appwrite';
import { DATABASE_ID, COLLECTIONS } from '@datainsight/shared';
import type { ScanRestaurant, ScanPharmacie, ScanEntreprise, TenantCategory } from '@datainsight/shared';

function collectionForCategory(category: TenantCategory): string {
  switch (category) {
    case 'RESTAURANT':
    case 'FASTFOOD':
      return COLLECTIONS.SCANS_RESTAURANT;
    case 'PHARMACIE':
      return COLLECTIONS.SCANS_PHARMACIE;
    case 'ENTREPRISE':
      return COLLECTIONS.SCANS_ENTREPRISE;
  }
}

/**
 * Récupère TOUS les scans d'un tenant pour une année/semaine donnée,
 * en s'appuyant sur l'index composite tenant_id + year + week_number.
 * Gère la pagination Appwrite (limite de 100 documents par requête).
 */
export async function fetchScansForWeek<T extends { $id: string }>(
  category: TenantCategory,
  tenantId: string,
  year: number,
  weekNumber: number
): Promise<T[]> {
  const collectionId = collectionForCategory(category);
  const documents: T[] = [];
  let cursor: string | undefined;

  while (true) {
    const queries = [
      Query.equal('tenant_id', tenantId),
      Query.equal('year', year),
      Query.equal('week_number', weekNumber),
      Query.limit(100),
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const response = await databases.listDocuments(DATABASE_ID, collectionId, queries);
    documents.push(...(response.documents as unknown as T[]));

    if (response.documents.length < 100) break;
    cursor = response.documents[response.documents.length - 1].$id;
  }

  return documents;
}

export function fetchRestaurantScans(tenantId: string, year: number, weekNumber: number) {
  return fetchScansForWeek<ScanRestaurant & { $id: string }>('RESTAURANT', tenantId, year, weekNumber);
}

export function fetchPharmacieScans(tenantId: string, year: number, weekNumber: number) {
  return fetchScansForWeek<ScanPharmacie & { $id: string }>('PHARMACIE', tenantId, year, weekNumber);
}

export function fetchEntrepriseScans(tenantId: string, year: number, weekNumber: number) {
  return fetchScansForWeek<ScanEntreprise & { $id: string }>('ENTREPRISE', tenantId, year, weekNumber);
}