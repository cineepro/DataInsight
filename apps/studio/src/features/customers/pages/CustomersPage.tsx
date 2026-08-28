//apps/studio/src/features/customers/pages/CustomersPage.tsx
import { useEffect, useState, useCallback } from 'react';
import type { Tenant, TenantCategory, Customer } from '@datainsight/shared';
import { listTenants } from '../../../api/tenants';
import { listCustomersForTenant, updateCustomerStatus } from '../../../api/customers';
import { detectChurnRisk } from '../../../engine/common/detectChurnRisk';
import type { ChurnAnalysisEntry } from '../../../engine/common/detectChurnRisk';
import Select from '../../../components/ui/Select';
import CustomerList from '../components/CustomerList';
import CustomerDetailCard from '../components/CustomerDetailCard';
import Button from '../../../components/ui/Button';

import { getThresholds } from '../../../engine/thresholds';

const CATEGORY_OPTIONS = [
  { label: 'Restauration', value: 'RESTAURANT' },
  { label: 'Fast-food', value: 'FASTFOOD' },
  { label: 'Pharmacie', value: 'PHARMACIE' },
  { label: 'Entreprise', value: 'ENTREPRISE' },
];

export default function CustomersPage() {
  const [category, setCategory] = useState<TenantCategory | ''>('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [analysis, setAnalysis] = useState<ChurnAnalysisEntry[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!category) {
      setTenants([]);
      return;
    }
    listTenants(category).then(setTenants);
  }, [category]);

  const loadCustomers = useCallback(async () => {
    const tenant = tenants.find((t) => t.$id === tenantId);
    if (!tenant) return;
    setLoading(true);
    const data = await listCustomersForTenant(tenant.slug);
    setCustomers(data);
    const thresholds = await getThresholds('common.churn_risk');
    setAnalysis(detectChurnRisk(data, thresholds));
    setLoading(false);
  }, [tenantId, tenants]);

  useEffect(() => {
    if (tenantId) {
      loadCustomers();
    } else {
      setCustomers([]);
      setAnalysis([]);
    }
  }, [tenantId, loadCustomers]);

  async function handleSyncStatuses() {
    setSyncing(true);
    try {
      const thresholds = await getThresholds('common.churn_risk');
      const freshAnalysis = detectChurnRisk(customers, thresholds);
      await Promise.all(
        freshAnalysis.map((entry) => {
          const customer = customers.find((c) => c.$id === entry.customerId);
          if (customer && customer.status !== entry.riskLevel) {
            return updateCustomerStatus(entry.customerId, entry.riskLevel);
          }
          return Promise.resolve();
        })
      );
      setAnalysis(freshAnalysis);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour des statuts.');
    } finally {
      setSyncing(false);
    }
  }

  const selectedCustomer = customers.find((c) => c.$id === selectedCustomerId);
  const selectedAnalysis = analysis.find((a) => a.customerId === selectedCustomerId);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <div className="mb-6">
        <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Clients</span>
        <h1 className="font-display text-2xl font-medium text-ink">Fidélité clients</h1>
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

      {tenantId && (
        <div className="mb-4 flex justify-end">
          <Button variant="secondary" onClick={handleSyncStatuses} loading={syncing}>
            Recalculer les statuts
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-400">Chargement...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <CustomerList entries={analysis} selectedId={selectedCustomerId} onSelect={setSelectedCustomerId} />
          {selectedCustomer && selectedAnalysis && (
            <CustomerDetailCard customer={selectedCustomer} analysis={selectedAnalysis} />
          )}
        </div>
      )}
    </div>
  );
}