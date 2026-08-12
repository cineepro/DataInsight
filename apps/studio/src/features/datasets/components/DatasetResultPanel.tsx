//apps/studio/src/features/datasets/components/DatasetResultPanel.tsx
import type { AnalysisResult } from '../../../engine/flexible/types';
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
        {results.map((result) => (
          <Card key={result.metricName}>
            <div className="mb-3 flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="text-sm font-medium text-ink">{result.metricName}</h3>
              <Badge status={result.status} />
            </div>
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
        ))}
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