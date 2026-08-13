//apps/studio/src/features/statistics/components/PerformanceDonutChart.tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { PerformanceBreakdown } from '@datainsight/shared';

const COLORS = {
  optimal: '#1F6F5C',
  warning: '#E2A63B',
  critical: '#B23A3A',
};

interface PerformanceDonutChartProps {
  performance: PerformanceBreakdown;
}

/**
 * LE graphique de confiance : même sans comprendre le détail d'une
 * analyse, un coup d'œil suffit pour voir si "ça va bien" ou "il faut agir".
 */
export default function PerformanceDonutChart({ performance }: PerformanceDonutChartProps) {
  const total = performance.optimal + performance.warning + performance.critical;

  const data = [
    { name: 'Optimal', value: performance.optimal, color: COLORS.optimal },
    { name: 'Attention', value: performance.warning, color: COLORS.warning },
    { name: 'Critique', value: performance.critical, color: COLORS.critical },
  ].filter((d) => d.value > 0);

  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center border border-dashed border-neutral-300 text-sm text-neutral-400">
        Aucune analyse publiée sur cette période.
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 bg-white p-5">
      <h3 className="mb-1 text-sm font-medium text-ink">Performance globale</h3>
      <p className="mb-3 text-xs text-neutral-400">Répartition des résultats d'analyse sur la période</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [`${value}`, 'Résultats']} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}