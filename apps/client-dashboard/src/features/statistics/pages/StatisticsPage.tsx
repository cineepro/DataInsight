//apps/client-dashboard/src/features/statistics/pages/StatisticsPage.tsx
import { useEffect, useState } from 'react';
import type { TenantStatistics, TenantCategory } from '@datainsight/shared';
import { getISOYearWeek } from '@datainsight/shared';
import { getCurrentSession } from '../../../api/auth';
import { getTenantStatistics } from '../../../api/statistics';
import BlockSelector from '../components/BlockSelector';
import StatisticsGrid from '../components/StatisticsGrid';
import Logo from '../../../components/Logo';
import Button from '../../../components/ui/Button';

const WEEKS_PER_YEAR = 52;

function shiftBlock(year: number, week: number, direction: 1 | -1): { year: number; week: number } {
  let newWeek = week + direction * 4;
  let newYear = year;
  if (newWeek < 1) {
    newWeek += WEEKS_PER_YEAR;
    newYear -= 1;
  } else if (newWeek > WEEKS_PER_YEAR) {
    newWeek -= WEEKS_PER_YEAR;
    newYear += 1;
  }
  return { year: newYear, week: newWeek };
}

function currentBlockStart(): { year: number; week: number } {
  const { year, week_number } = getISOYearWeek();
  const blockIndex = Math.floor((week_number - 1) / 4);
  return { year, week: blockIndex * 4 + 1 };
}

export default function StatisticsPage() {
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [category, setCategory] = useState<TenantCategory | null>(null);
  const [block, setBlock] = useState(currentBlockStart());
  const [stats, setStats] = useState<TenantStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentSession().then((session) => {
      setTenantSlug(session.tenantSlug);
    });
  }, []);

  useEffect(() => {
    if (!tenantSlug) return;
    loadStats();
  }, [tenantSlug, block]);

  async function loadStats() {
  if (!tenantSlug) return;
  setLoading(true);
  setError(null);
  try {
    const data = await getTenantStatistics(tenantSlug, block.year, block.week);
    setStats(data);
    setCategory(data.category);
  } catch (err) {
    console.error(err);
    setError(err instanceof Error ? err.message : 'Erreur lors du chargement.');
    setStats(null);
  } finally {
    setLoading(false);
  }
}

  async function handleLogout() {
    const { logout } = await import('../../../api/auth');
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

      <div className="mx-auto max-w-3xl px-6 pb-16">
        <div className="mb-6 text-center">
          <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Statistiques</span>
          <h1 className="font-display text-3xl font-medium text-ink">Votre activité en un coup d'œil</h1>
        </div>

        <div className="mb-6">
          <BlockSelector
            blockLabel={stats?.block_label ?? `Semaines ${block.week}-${block.week + 3} — ${block.year}`}
            onPrevious={() => setBlock((b) => shiftBlock(b.year, b.week, -1))}
            onNext={() => setBlock((b) => shiftBlock(b.year, b.week, 1))}
            loading={loading}
          />
        </div>

        {loading ? (
          <p className="text-center text-sm text-neutral-400">Chargement...</p>
        ) : error ? (
          <p className="text-center text-sm text-brick">{error}</p>
        ) : stats && category ? (
          <StatisticsGrid stats={stats} category={category} />
        ) : null}
      </div>
    </div>
  );
}