// apps/client-dashboard/src/features/reports/pages/ClientReportsPage.tsx
import { useEffect, useState } from 'react';
import { getCurrentSession, logout } from '../../../api/auth';
import { listPublishedReports } from '../../../api/reports';
import type { WeeklyReport } from '@datainsight/shared';
import ReportCard from '../components/ReportCard';
import Logo from '../../../components/Logo';
import Button from '../../../components/ui/Button';

export default function ClientReportsPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentSession().then((session) => {
      listPublishedReports(session.tenantSlug).then((data) => {
        setReports(data);
        setLoading(false);
      });
    });
  }, []);

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

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

      <div className="mx-auto max-w-xl px-6 pb-16">
        <div className="mb-8 text-center">
          <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Vos rapports</span>
          <h1 className="font-display text-3xl font-medium text-ink">Bulletin hebdomadaire</h1>
        </div>

        {loading ? (
          <p className="text-center text-sm text-neutral-400">Chargement...</p>
        ) : reports.length === 0 ? (
          <div className="border border-dashed border-neutral-300 px-6 py-12 text-center">
            <p className="text-sm text-neutral-500">
              Aucun rapport publié pour le moment. Votre premier bulletin apparaîtra ici dès qu'il sera prêt.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {reports.map((report) => (
              <ReportCard key={report.$id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}