//apps/studio/src/features/datasets/components/DatasetResultPanel.tsx
import type { AnalysisResult } from '../../../engine/flexible/types';
import type { PivotTableResult } from '../../../engine/flexible/pivotTable';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';

interface DatasetResultPanelProps {
  results: AnalysisResult[];
  directives: string;
  onDirectivesChange: (text: string) => void;
  onPublish: () => void;
  publishing: boolean;
}

function isPivotResult(dataPoints: Record<string, unknown>): boolean {
  return Array.isArray((dataPoints as any).matrix);
}

function PivotTableView({ pivot }: { pivot: PivotTableResult }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border-b border-neutral-200 px-2 py-1.5 text-left font-mono uppercase tracking-wide text-neutral-400"> </th>
            {pivot.columnLabels.map((c) => (
              <th key={c} className="border-b border-neutral-200 px-2 py-1.5 text-right font-mono uppercase tracking-wide text-neutral-400">
                {c}
              </th>
            ))}
            <th className="border-b border-l border-neutral-200 px-2 py-1.5 text-right font-mono uppercase tracking-wide text-neutral-400">Total</th>
          </tr>
        </thead>
        <tbody>
          {pivot.rowLabels.map((r, i) => (
            <tr key={r} className="border-b border-neutral-100 last:border-0">
              <td className="px-2 py-1.5 font-medium text-ink">{r}</td>
              {pivot.matrix[i].map((v, j) => (
                <td key={j} className="px-2 py-1.5 text-right text-neutral-700">
                  {v === null ? '—' : v}
                </td>
              ))}
              <td className="border-l border-neutral-100 px-2 py-1.5 text-right font-medium text-ink">{pivot.rowTotals[i]}</td>
            </tr>
          ))}
          <tr>
            <td className="border-t border-neutral-200 px-2 py-1.5 font-medium text-ink">Total</td>
            {pivot.columnTotals.map((v, j) => (
              <td key={j} className="border-t border-neutral-200 px-2 py-1.5 text-right font-medium text-ink">
                {v}
              </td>
            ))}
            <td className="border-t border-l border-neutral-200 px-2 py-1.5 text-right font-semibold text-ink">{pivot.grandTotal}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function DatasetResultPanel({
  results,
  directives,
  onDirectivesChange,
  onPublish,
  publishing,
}: DatasetResultPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Résultats</span>

      <div className="grid gap-3 md:grid-cols-2">
        {results.map((result) => {
          const pivot = isPivotResult(result.dataPoints) ? (result.dataPoints as unknown as PivotTableResult) : null;
          return (
            <Card key={result.metricName} className={pivot ? 'md:col-span-2' : ''}>
              <div className="mb-3 flex items-center justify-between border-b border-neutral-100 pb-2">
                <h3 className="text-sm font-medium text-ink">{result.metricName}</h3>
                <Badge status={result.status} />
              </div>

              {pivot && <div className="mb-3">{<PivotTableView pivot={pivot} />}</div>}

              <ul className="flex flex-col gap-1.5">
                {result.keyFindings.length > 0 ? (
                  result.keyFindings.map((finding, i) => (
                    <li key={i} className="font-mono text-xs leading-relaxed text-neutral-600">
                      {finding}
                    </li>
                  ))
                ) : (
                  <li className="font-mono text-xs text-neutral-400">Aucun signal notable.</li>
                )}
              </ul>
            </Card>
          );
        })}
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-medium text-ink">Directives générées par l'IA</h3>
        <textarea
          value={directives}
          onChange={(e) => onDirectivesChange(e.target.value)}
          rows={8}
          className="w-full border border-neutral-200 p-3 text-sm text-ink focus:border-ink focus:outline-none"
        />
        <Button onClick={onPublish} loading={publishing} className="mt-3 w-full">
          Publier sur le Dashboard Client
        </Button>
      </Card>
    </div>
  );
}