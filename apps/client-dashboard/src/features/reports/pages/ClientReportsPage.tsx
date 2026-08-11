// apps/client-dashboard/src/features/reports/pages/ClientReportsPage.tsx
import { useEffect, useState } from 'react';
import { getCurrentSession, logout } from '../../../api/auth';
import { listPublishedReports } from '../../../api/reports';
import type { WeeklyReport } from '@datainsight/shared';
import ReportCard from '../components/ReportCard';
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
    <div className="min-h-screen bg-neutral-100">
      <header className="no-print flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
        <span className="text-sm font-semibold text-neutral-900">Mon espace ASILLIA</span>
        <Button onClick={handleLogout} className="bg-white text-neutral-900 border border-neutral-300">
          Déconnexion
        </Button>
      </header>

      <div className="mx-auto max-w-2xl p-6">
        <h1 className="mb-6 text-xl font-semibold text-neutral-900">Vos rapports</h1>

        {loading ? (
          <p className="text-sm text-neutral-400">Chargement...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-neutral-400">Aucun rapport publié pour le moment.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {reports.map((report) => (
              <ReportCard key={report.$id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}