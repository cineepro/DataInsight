//apps/studio/src/features/studio/reports/pages/ReportsHistoryPage.tsx
import { useEffect, useState } from 'react';
import type { Tenant, TenantCategory, WeeklyReport } from '@datainsight/shared';
import { listTenants } from '../../../../api/tenants';
import { listReportsForTenant } from '../../../../api/reports';
import Select from '../../../../components/ui/Select';
import ReportEditor from '../components/ReportEditor';

const CATEGORY_OPTIONS = [
  { label: 'Restauration', value: 'RESTAURANT' },
  { label: 'Fast-food', value: 'FASTFOOD' },
  { label: 'Pharmacie', value: 'PHARMACIE' },
  { label: 'Entreprise', value: 'ENTREPRISE' },
];

export default function ReportsHistoryPage() {
  const [category, setCategory] = useState<TenantCategory | ''>('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category) {
      setTenants([]);
      return;
    }
    listTenants(category).then(setTenants);
  }, [category]);

  useEffect(() => {
    if (!tenantId) {
      setReports([]);
      return;
    }
    const tenant = tenants.find((t) => t.$id === tenantId);
    if (!tenant) return;
    setLoading(true);
    listReportsForTenant(tenant.slug).then((data) => {
      setReports(data);
      setLoading(false);
    });
  }, [tenantId, tenants]);

  function handleUpdated(updated: WeeklyReport) {
    setReports((prev) => prev.map((r) => (r.$id === updated.$id ? updated : r)));
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-neutral-900">Historique des rapports</h1>

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

      <div className="flex flex-col gap-3">
        {reports.map((report) => (
          <ReportEditor key={report.$id} report={report} onUpdated={handleUpdated} />
        ))}
        {!loading && tenantId && reports.length === 0 && (
          <p className="text-sm text-neutral-400">Aucun rapport pour cette structure.</p>
        )}
      </div>
    </div>
  );
}