//apps/studio/src/features/statistics/components/StatisticsGrid.tsx
import type { TenantStatistics, TenantCategory } from '@datainsight/shared';
import PerformanceDonutChart from './PerformanceDonutChart';
import WeeklyBarChart from './WeeklyBarChart';
import DistributionPieChart from './DistributionPieChart';

interface StatisticsGridProps {
  stats: TenantStatistics;
  category: TenantCategory;
}

/**
 * Assemble les graphiques génériques + ceux spécifiques à la catégorie,
 * exactement selon ce que la Function a renvoyé dans category_specific.
 * Identique dans studio et client-dashboard — c'est ce composant qui
 * garantit que l'admin et le gérant voient la même chose.
 */
export default function StatisticsGrid({ stats, category }: StatisticsGridProps) {
  const categorySpecific = stats.category_specific;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <PerformanceDonutChart performance={stats.performance} />
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
    </div>
  );
}