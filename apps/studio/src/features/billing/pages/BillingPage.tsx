// apps/studio/src/features/billing/pages/BillingPage.tsx
import { useEffect, useState } from 'react';
import type { Tenant, TenantCategory, Subscription, PaymentTransaction } from '@datainsight/shared';
import { listTenants } from '../../../api/tenants';
import { getSubscriptionForTenant, listTransactionsForTenant, markSubscriptionPaid } from '../../../api/billing';
import Select from '../../../components/ui/Select';
import SubscriptionCard from '../components/SubscriptionCard';
import SubscriptionForm from '../components/SubscriptionForm';
import TransactionHistory from '../components/TransactionHistory';

const CATEGORY_OPTIONS = [
  { label: 'Restauration', value: 'RESTAURANT' },
  { label: 'Fast-food', value: 'FASTFOOD' },
  { label: 'Pharmacie', value: 'PHARMACIE' },
  { label: 'Entreprise', value: 'ENTREPRISE' },
];

export default function BillingPage() {
  const [category, setCategory] = useState<TenantCategory | ''>('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(() => {
    if (!category) {
      setTenants([]);
      return;
    }
    listTenants(category).then(setTenants);
  }, [category]);

  const selectedTenant = tenants.find((t) => t.$id === tenantId);

  async function refresh() {
    if (!selectedTenant) return;
    setLoading(true);
    const [sub, txs] = await Promise.all([
      getSubscriptionForTenant(selectedTenant.slug),
      listTransactionsForTenant(selectedTenant.slug),
    ]);
    setSubscription(sub);
    setTransactions(txs);
    setLoading(false);
  }

  useEffect(() => {
    if (tenantId) refresh();
    else {
      setSubscription(null);
      setTransactions([]);
    }
  }, [tenantId, tenants]);

  async function handleMarkPaid() {
    if (!subscription || !selectedTenant) return;
    setMarkingPaid(true);
    try {
      await markSubscriptionPaid(subscription.$id, selectedTenant.slug, subscription.monthly_amount);
      await refresh();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour.');
    } finally {
      setMarkingPaid(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6">
        <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Facturation</span>
        <h1 className="font-display text-2xl font-medium text-ink">Facturation</h1>
      </div>

      <div className="mb-6 flex gap-3">
        <div className="flex-1">
          <Select
            label="Catégorie"
            value={category}
            onChange={(v) => {
              setCategory(v as TenantCategory);
              setTenantId('');
            }}
            options={CATEGORY_OPTIONS}
            placeholder="Choisir une catégorie"
          />
        </div>
        <div className="flex-1">
          <Select
            label="Structure"
            value={tenantId}
            onChange={setTenantId}
            options={tenants.map((t) => ({ label: t.name, value: t.$id }))}
            placeholder="Choisir une structure"
          />
        </div>
      </div>

      {loading && <p className="text-sm text-neutral-400">Chargement...</p>}

      {!loading && selectedTenant && !subscription && (
        <SubscriptionForm tenant={selectedTenant} onCreated={refresh} />
      )}

      {!loading && subscription && (
        <div className="flex flex-col gap-4">
          <SubscriptionCard subscription={subscription} onMarkPaid={handleMarkPaid} markingPaid={markingPaid} />
          <TransactionHistory transactions={transactions} />
        </div>
      )}
    </div>
  );
}