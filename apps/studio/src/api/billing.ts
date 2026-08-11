//apps/studio/src/api/billing.ts
import { ID, Query } from 'appwrite';
import { databases } from './appwrite';
import { DATABASE_ID, COLLECTIONS } from '@datainsight/shared';
import type { Subscription, PaymentTransaction, PaymentStatus } from '@datainsight/shared';

export async function getSubscriptionForTenant(tenantId: string): Promise<Subscription | null> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SUBSCRIPTIONS, [
    Query.equal('tenant_id', tenantId),
    Query.limit(1),
  ]);
  return (response.documents[0] as unknown as Subscription) ?? null;
}

export async function createSubscription(
  input: Omit<Subscription, '$id'>
): Promise<Subscription> {
  const created = await databases.createDocument(DATABASE_ID, COLLECTIONS.SUBSCRIPTIONS, ID.unique(), input);
  return created as unknown as Subscription;
}

export async function updateSubscription(
  subscriptionDocId: string,
  updates: Partial<Subscription>
): Promise<Subscription> {
  const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.SUBSCRIPTIONS, subscriptionDocId, updates);
  return updated as unknown as Subscription;
}

export async function recordTransaction(
  input: Omit<PaymentTransaction, '$id'>
): Promise<PaymentTransaction> {
  const created = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.PAYMENT_TRANSACTIONS,
    ID.unique(),
    input
  );
  return created as unknown as PaymentTransaction;
}

export async function listTransactionsForTenant(tenantId: string): Promise<PaymentTransaction[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PAYMENT_TRANSACTIONS, [
    Query.equal('tenant_id', tenantId),
    Query.orderDesc('created_at'),
    Query.limit(50),
  ]);
  return response.documents as unknown as PaymentTransaction[];
}

/**
 * Marque manuellement un abonnement comme payé — utile tant que l'intégration
 * FedaPay/KKiaPay n'est pas branchée : tu confirmes le paiement toi-même
 * après avoir reçu le transfert (Mobile Money, virement...).
 */
export async function markSubscriptionPaid(
  subscriptionDocId: string,
  tenantId: string,
  amount: number
): Promise<void> {
  const now = new Date();
  const nextDue = new Date(now);
  nextDue.setMonth(nextDue.getMonth() + 1);

  await updateSubscription(subscriptionDocId, {
    payment_status: 'PAID' as PaymentStatus,
    last_payment_date: now.toISOString(),
    next_due_date: nextDue.toISOString(),
  });

  await recordTransaction({
    tenant_id: tenantId,
    subscription_id: subscriptionDocId,
    amount,
    provider: 'MANUAL',
    status: 'SUCCESS',
    created_at: now.toISOString(),
  });
}