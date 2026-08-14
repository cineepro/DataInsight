//apps/client-dashboard/src/features/reports/pages/ClientReportsPage.tsx
import { useEffect, useState } from 'react';
import { getCurrentSession, logout } from '../../../api/auth';
import { listPublishedReports, listPublishedDatasetReports } from '../../../api/reports';
import type { WeeklyReport } from '@datainsight/shared';
import type { DatasetReport } from '../../../api/reports';
import ReportCard from '../components/ReportCard';
import DatasetReportCard from '../components/DatasetReportCard';
import Logo from '../../../components/Logo';
import Button from '../../../components/ui/Button';
import Tabs from '../../../components/ui/Tabs';
import PageNav from '../../../components/ui/PageNav';

type TabId = 'weekly' | 'datasets';

export default function ClientReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('weekly');
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [datasetReports, setDatasetReports] = useState<DatasetReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentSession().then((session) => {
      Promise.all([
        listPublishedReports(session.tenantSlug),
        listPublishedDatasetReports(session.tenantSlug),
      ]).then(([weekly, datasets]) => {
        setWeeklyReports(weekly);
        setDatasetReports(datasets);
        setLoading(false);
      });
    });
  }, []);

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  const tabs = [
    { id: 'weekly', label: `Rapports hebdo${weeklyReports.length > 0 ? ` (${weeklyReports.length})` : ''}` },
    { id: 'datasets', label: `Analyses spéciales${datasetReports.length > 0 ? ` (${datasetReports.length})` : ''}` },
  ];

  return (
    <div className="min-h-screen bg-statement">
      <header className="no-print flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Logo className="text-marigold-500" />
          <span className="font-display text-base font-medium text-ink">ASILLIA</span>
        </div>
        <Button variant="secondary" onClick={handleLogout}>
          Déconnexion
        </Button>
      </header>

      <PageNav />
      
      <div className="mx-auto max-w-xl px-6 pb-16">
        <div className="mb-6 text-center">
          <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Vos rapports</span>
          <h1 className="font-display text-3xl font-medium text-ink">Bulletin</h1>
        </div>

        {loading ? (
          <p className="text-center text-sm text-neutral-400">Chargement...</p>
        ) : (
          <>
            <Tabs tabs={tabs} activeId={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

            {activeTab === 'weekly' &&
              (weeklyReports.length === 0 ? (
                <EmptyState text="Aucun rapport hebdomadaire publié pour le moment. Votre premier bulletin apparaîtra ici dès qu'il sera prêt." />
              ) : (
                <div className="flex flex-col gap-6">
                  {weeklyReports.map((report) => (
                    <ReportCard key={report.$id} report={report} />
                  ))}
                </div>
              ))}

            {activeTab === 'datasets' &&
              (datasetReports.length === 0 ? (
                <EmptyState text="Aucune analyse spéciale publiée pour le moment. Si vous nous avez transmis des données, elles apparaîtront ici une fois analysées." />
              ) : (
                <div className="flex flex-col gap-6">
                  {datasetReports.map((report) => (
                    <DatasetReportCard key={report.$id} report={report} />
                  ))}
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-neutral-300 px-6 py-12 text-center">
      <p className="text-sm text-neutral-500">{text}</p>
    </div>
  );
}