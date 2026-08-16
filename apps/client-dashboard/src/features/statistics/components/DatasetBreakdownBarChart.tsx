//apps/client-dashboard/src/features/statistics/components/DatasetBreakdownBarChart.tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { DatasetBreakdownEntry } from '@datainsight/shared';

interface DatasetBreakdownBarChartProps {
  data: DatasetBreakdownEntry[];
}

const COLORS = {
  optimal: '#1F6F5C',
  warning: '#E2A63B',
  critical: '#B23A3A',
};

/**
 * Barres empilées : un dataset (fichier Excel/CSV importé) = une barre,
 * segmentée par statut de résultat. Permet de voir en un coup d'œil
 * quelles analyses de données brutes ont soulevé des points d'attention.
 */
export default function DatasetBreakdownBarChart({ data }: DatasetBreakdownBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="border border-neutral-200 bg-white p-5">
        <h3 className="mb-1 text-sm font-medium text-ink">Analyses de données brutes</h3>
        <p className="mb-3 text-xs text-neutral-400">Résultats par fichier importé sur la période</p>
        <div className="flex h-40 items-center justify-center border border-dashed border-neutral-300 text-sm text-neutral-400">
          Aucune analyse de données brutes publiée sur cette période.
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.period_label ? `${d.dataset_name} (${d.period_label})` : d.dataset_name,
    Optimal: d.optimal,
    Attention: d.warning,
    Critique: d.critical,
  }));

  return (
    <div className="border border-neutral-200 bg-white p-5">
      <h3 className="mb-1 text-sm font-medium text-ink">Analyses de données brutes</h3>
      <p className="mb-3 text-xs text-neutral-400">Résultats par fichier importé sur la période</p>
      <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 50)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#6B7280' }}
            axisLine={{ stroke: '#E5E7EB' }}
            width={160}
          />
          <Tooltip />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Optimal" stackId="a" fill={COLORS.optimal} radius={[0, 0, 0, 0]} />
          <Bar dataKey="Attention" stackId="a" fill={COLORS.warning} />
          <Bar dataKey="Critique" stackId="a" fill={COLORS.critical} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}