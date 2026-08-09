//apps/studio/src/features/studio/components/ResultReviewPanel.tsx
import type { AnalysisResult } from '@datainsight/shared';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';

interface ResultReviewPanelProps {
  results: AnalysisResult[];
  directives: string;
  onDirectivesChange: (text: string) => void;
  onPublish: () => void;
  publishing: boolean;
}

// Étape 5 : l'analyste voit les chiffres bruts d'un côté et le texte
// généré par l'IA de l'autre, peut ajuster le texte, puis publie.
export default function ResultReviewPanel({
  results,
  directives,
  onDirectivesChange,
  onPublish,
  publishing,
}: ResultReviewPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        {results.map((result) => (
          <Card key={result.metricName}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900">{result.metricName}</h3>
              <Badge status={result.status} />
            </div>
            <ul className="flex flex-col gap-1">
              {result.keyFindings.length > 0 ? (
                result.keyFindings.map((finding, i) => (
                  <li key={i} className="text-xs text-neutral-600">
                    • {finding}
                  </li>
                ))
              ) : (
                <li className="text-xs text-neutral-400">Aucun signal notable.</li>
              )}
            </ul>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="mb-2 text-sm font-semibold text-neutral-900">Directives générées par l'IA</h3>
        <textarea
          value={directives}
          onChange={(e) => onDirectivesChange(e.target.value)}
          rows={8}
          className="w-full rounded-lg border border-neutral-300 p-3 text-sm focus:border-neutral-900 focus:outline-none"
          placeholder="Les directives générées par Claude apparaîtront ici — modifiables avant publication."
        />
        <Button onClick={onPublish} loading={publishing} className="mt-3 w-full">
          Publier sur le Dashboard Client
        </Button>
      </Card>
    </div>
  );
}