// apps/studio/src/api/customers.ts
import { Query } from 'appwrite';
import { databases } from './appwrite';
import { DATABASE_ID, COLLECTIONS } from '@datainsight/shared';
import type { Customer, CustomerStatus } from '@datainsight/shared';

export async function listCustomersForTenant(tenantId: string): Promise<Customer[]> {
  const documents: Customer[] = [];
  let cursor: string | undefined;

  while (true) {
    const queries = [Query.equal('tenant_id', tenantId), Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CUSTOMERS, queries);
    documents.push(...(response.documents as unknown as Customer[]));

    if (response.documents.length < 100) break;
    cursor = response.documents[response.documents.length - 1].$id;
  }

  return documents;
}

/**
 * Persiste le statut recalculé par detectChurnRisk() sur le document
 * customer correspondant. Appelé en boucle depuis CustomersPage après
 * chaque analyse de fidélité, pour que le statut reste visible même
 * sans relancer le calcul (ex: filtrage rapide par statut).
 */
export async function updateCustomerStatus(customerId: string, status: CustomerStatus): Promise<void> {
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.CUSTOMERS, customerId, { status });
}