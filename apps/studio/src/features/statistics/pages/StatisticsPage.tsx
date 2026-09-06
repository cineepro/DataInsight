//apps/studio/src/features/statistics/pages/StatisticsPage.tsx
import { useEffect, useState } from 'react';
import type { Tenant, TenantCategory, TenantStatistics } from '@datainsight/shared';
import { getISOYearWeek, isoWeeksInYear } from '@datainsight/shared';
import { listTenants } from '../../../api/tenants';
import { getTenantStatistics } from '../../../api/statistics';
import Select from '../../../components/ui/Select';
import { BlockSelector, StatisticsGrid } from '@datainsight/ui-statistics';

const CATEGORY_OPTIONS = [
  { label: 'Restauration', value: 'RESTAURANT' },
  { label: 'Fast-food', value: 'FASTFOOD' },
  { label: 'Pharmacie', value: 'PHARMACIE' },
  { label: 'Entreprise', value: 'ENTREPRISE' },
];

function shiftBlock(year: number, week: number, direction: 1 | -1): { year: number; week: number } {
  let newWeek = week + direction * 4;
  let newYear = year;
  if (newWeek < 1) {
    newYear -= 1;
    newWeek += isoWeeksInYear(newYear);
  } else if (newWeek > isoWeeksInYear(year)) {
    newWeek -= isoWeeksInYear(year);
    newYear += 1;
  }
  return { year: newYear, week: newWeek };
}

// Point de départ : le bloc de 4 semaines dont la semaine courante fait partie.
function currentBlockStart(): { year: number; week: number } {
  const { year, week_number } = getISOYearWeek();
  const blockIndex = Math.floor((week_number - 1) / 4);
  return { year, week: blockIndex * 4 + 1 };
}

export default function StatisticsPage() {
  const [category, setCategory] = useState<TenantCategory | ''>('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [block, setBlock] = useState(currentBlockStart());
  const [stats, setStats] = useState<TenantStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) {
      setTenants([]);
      return;
    }
    listTenants(category).then(setTenants);
  }, [category]);

  const selectedTenant = tenants.find((t) => t.$id === tenantId);

  async function loadStats() {
    if (!selectedTenant) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTenantStatistics(selectedTenant.slug, block.year, block.week);
      setStats(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement.');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedTenant) loadStats();
    else setStats(null);
  }, [selectedTenant, block]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <div className="mb-6">
        <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Statistiques</span>
        <h1 className="font-display text-2xl font-medium text-ink">Vue d'ensemble graphique</h1>
      </div>

      <div className="mb-6 flex gap-3">
        <div className="flex-1">
          <Select
            label="Catégorie"
            value={category}
            onChange={(v) => {
              setCategory(v as TenantCategory);
              setTenantId('');
              setStats(null);
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

      {selectedTenant && (
        <div className="mb-6">
          <BlockSelector
            blockLabel={stats?.block_label ?? `Semaines ${block.week}-${block.week + 3} — ${block.year}`}
            onPrevious={() => setBlock((b) => shiftBlock(b.year, b.week, -1))}
            onNext={() => setBlock((b) => shiftBlock(b.year, b.week, 1))}
            loading={loading}
          />
        </div>
      )}

      {!selectedTenant ? (
        <p className="text-sm text-neutral-400">Choisissez une structure pour voir ses statistiques.</p>
      ) : loading ? (
        <p className="text-sm text-neutral-400">Chargement des statistiques...</p>
      ) : error ? (
        <p className="text-sm text-brick">{error}</p>
      ) : stats && selectedTenant ? (
        <StatisticsGrid stats={stats} category={selectedTenant.category} />
      ) : null}
    </div>
  );
}