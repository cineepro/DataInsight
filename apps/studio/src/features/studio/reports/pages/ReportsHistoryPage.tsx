//apps/studio/src/features/studio/reports/pages/ReportsHistoryPage.tsx
import { useEffect, useState } from 'react';
import type { Tenant, TenantCategory, WeeklyReport } from '@datainsight/shared';
import { listTenants } from '../../../../api/tenants';
import { listReportsForTenant as listWeeklyReportsForTenant } from '../../../../api/reports';
import { listReportsForTenant as listDatasetReportsForTenant, type DatasetReport } from '../../../../api/datasets';
import Select from '../../../../components/ui/Select';
import Tabs from '../../../../components/ui/Tabs';
import ReportEditor from '../components/ReportEditor';
import DatasetReportEditor from '../components/DatasetReportEditor';

const CATEGORY_OPTIONS = [
  { label: 'Restauration', value: 'RESTAURANT' },
  { label: 'Fast-food', value: 'FASTFOOD' },
  { label: 'Pharmacie', value: 'PHARMACIE' },
  { label: 'Entreprise', value: 'ENTREPRISE' },
];

type TabId = 'weekly' | 'datasets';

export default function ReportsHistoryPage() {
  const [activeTab, setActiveTab] = useState<TabId>('weekly');
  const [category, setCategory] = useState<TenantCategory | ''>('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [datasetReports, setDatasetReports] = useState<DatasetReport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category) {
      setTenants([]);
      return;
    }
    listTenants(category).then(setTenants);
  }, [category]);

  const selectedTenant = tenants.find((t) => t.$id === tenantId);

  useEffect(() => {
    if (!selectedTenant) {
      setWeeklyReports([]);
      setDatasetReports([]);
      return;
    }
    setLoading(true);
    Promise.all([
      listWeeklyReportsForTenant(selectedTenant.slug),
      listDatasetReportsForTenant(selectedTenant.slug),
    ]).then(([weekly, datasets]) => {
      setWeeklyReports(weekly);
      setDatasetReports(datasets);
      setLoading(false);
    });
  }, [selectedTenant]);

  function handleWeeklyUpdated(updated: WeeklyReport) {
    setWeeklyReports((prev) => prev.map((r) => (r.$id === updated.$id ? updated : r)));
  }

  function handleDatasetUpdated(updated: DatasetReport) {
    setDatasetReports((prev) => prev.map((r) => (r.$id === updated.$id ? updated : r)));
  }

  const tabs = [
    { id: 'weekly', label: `Rapports hebdo${weeklyReports.length > 0 ? ` (${weeklyReports.length})` : ''}` },
    { id: 'datasets', label: `Données brutes${datasetReports.length > 0 ? ` (${datasetReports.length})` : ''}` },
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6">
        <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Rapports</span>
        <h1 className="font-display text-2xl font-medium text-ink">Historique des rapports</h1>
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

      {!selectedTenant ? (
        <p className="text-sm text-neutral-400">Choisissez une structure pour voir ses rapports.</p>
      ) : (
        <>
          <Tabs tabs={tabs} activeId={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

          {loading ? (
            <p className="text-sm text-neutral-400">Chargement...</p>
          ) : activeTab === 'weekly' ? (
            <div className="flex flex-col gap-3">
              {weeklyReports.map((report) => (
                <ReportEditor key={report.$id} report={report} onUpdated={handleWeeklyUpdated} />
              ))}
              {weeklyReports.length === 0 && (
                <p className="text-sm text-neutral-400">Aucun rapport hebdomadaire pour cette structure.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {datasetReports.map((report) => (
                <DatasetReportEditor key={report.$id} report={report} onUpdated={handleDatasetUpdated} />
              ))}
              {datasetReports.length === 0 && (
                <p className="text-sm text-neutral-400">Aucune analyse de données brutes pour cette structure.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}