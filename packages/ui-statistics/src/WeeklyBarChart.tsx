//packages/ui-statistics/src/WeeklyBarChart.tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface WeeklyBarChartProps {
  title: string;
  subtitle?: string;
  data: Array<{ week: number; value: number | null }>;
  color?: string;
  unit?: string;
}

/**
 * Générique — sert pour "volume d'avis par semaine", "satisfaction
 * moyenne par semaine", "taux de rupture par semaine"... n'importe quelle
 * série à 4 points (une par semaine du bloc).
 */
export default function WeeklyBarChart({ title, subtitle, data, color = '#5B6BC0', unit = '' }: WeeklyBarChartProps) {
  const chartData = data.map((d) => ({ semaine: `S${d.week}`, valeur: d.value ?? 0 }));
  const hasData = data.some((d) => d.value !== null && d.value > 0);

  return (
    <div className="border border-neutral-200 bg-white p-5">
      <h3 className="mb-1 text-sm font-medium text-ink">{title}</h3>
      {subtitle && <p className="mb-3 text-xs text-neutral-400">{subtitle}</p>}

      {!hasData ? (
        <div className="flex h-48 items-center justify-center text-sm text-neutral-400">
          Aucune donnée sur cette période.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
            <XAxis dataKey="semaine" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: number) => [`${value}${unit}`, title]} />
            <Bar dataKey="valeur" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}