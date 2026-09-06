//packages/ui-statistics/src/StatisticsGrid.tsx
import type { TenantStatistics, TenantCategory } from '@datainsight/shared';
import PerformanceDonutChart from './PerformanceDonutChart';
import WeeklyBarChart from './WeeklyBarChart';
import DistributionPieChart from './DistributionPieChart';
import DatasetBreakdownBarChart from './DatasetBreakdownBarChart';

interface StatisticsGridProps {
  stats: TenantStatistics;
  category: TenantCategory;
}

export default function StatisticsGrid({ stats, category }: StatisticsGridProps) {
  const categorySpecific = stats.category_specific;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <PerformanceDonutChart
          performance={stats.performance}
          title="Performance — rapports hebdo"
          subtitle="Résultats des avis collectés via QR Code"
        />
        <WeeklyBarChart
          title="Volume d'avis par semaine"
          subtitle="Nombre total de retours collectés"
          data={stats.volume_by_week.map((d) => ({ week: d.week, value: d.count }))}
          color="#5B6BC0"
        />
      </div>

      {(category === 'RESTAURANT' || category === 'FASTFOOD' || category === 'ENTREPRISE') && (
        <WeeklyBarChart
          title="Satisfaction moyenne par semaine"
          subtitle="Note moyenne sur 5"
          data={stats.avg_satisfaction_by_week}
          color="#1F6F5C"
          unit="/5"
        />
      )}

      {(category === 'RESTAURANT' || category === 'FASTFOOD') && (
        <div className="grid gap-4 md:grid-cols-2">
          <DistributionPieChart
            title="Temps d'attente"
            data={(categorySpecific.wait_time_distribution as any) ?? []}
          />
          <DistributionPieChart
            title="Type de visite"
            data={(categorySpecific.visit_type_distribution as any) ?? []}
          />
        </div>
      )}

      {category === 'PHARMACIE' && (
        <>
          <WeeklyBarChart
            title="Taux de rupture de stock par semaine"
            subtitle="Pourcentage des visites signalant une rupture"
            data={(categorySpecific.stockout_rate_by_week as any[])?.map((d) => ({ week: d.week, value: d.rate })) ?? []}
            color="#B23A3A"
            unit="%"
          />
          <DistributionPieChart
            title="Motif de visite"
            data={(categorySpecific.visit_reason_distribution as any) ?? []}
          />
        </>
      )}

      {category === 'ENTREPRISE' && (
        <DistributionPieChart
          title="Type d'interaction"
          data={(categorySpecific.interaction_type_distribution as any) ?? []}
        />
      )}

      {/* --- NOUVEAU : section dédiée aux données brutes importées --- */}
      <div className="mt-2 border-t border-neutral-200 pt-4">
        <span className="mb-3 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">
          Données brutes importées
        </span>
        <div className="grid gap-4 md:grid-cols-2">
          <PerformanceDonutChart
            performance={stats.dataset_performance}
            title="Performance — données brutes"
            subtitle="Résultats des fichiers Excel/CSV importés"
          />
          <DatasetBreakdownBarChart data={stats.datasets_breakdown} />
        </div>
      </div>
    </div>
  );
}