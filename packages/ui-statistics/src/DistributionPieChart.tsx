//packages/ui-statistics/src/DistributionPieChart.tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DistributionPieChartProps {
  title: string;
  data: Array<{ label: string; value: number }>;
}

const PALETTE = ['#5B6BC0', '#E07856', '#7FA88A', '#E2A63B', '#1F6F5C', '#B23A3A'];

export default function DistributionPieChart({ title, data }: DistributionPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="border border-neutral-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-medium text-ink">{title}</h3>
        <div className="flex h-48 items-center justify-center text-sm text-neutral-400">
          Aucune donnée sur cette période.
        </div>
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-medium text-ink">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" outerRadius={80} paddingAngle={2}>
            {data.map((entry, i) => (
              <Cell key={entry.label} fill={PALETTE[i % PALETTE.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={48} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}