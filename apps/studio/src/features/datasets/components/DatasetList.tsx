//apps/studio/src/features/datasets/components/DatasetList.tsx
import type { Dataset } from '../../../api/datasets';
import Badge from '../../../components/ui/Badge';

interface DatasetListProps {
  datasets: Dataset[];
  onSelect: (dataset: Dataset) => void;
}

const STATUS_TO_BADGE = {
  DRAFT: 'DRAFT',
  IMPORTED: 'WARNING',
  ANALYZED: 'OPTIMAL',
} as const;

export default function DatasetList({ datasets, onSelect }: DatasetListProps) {
  if (datasets.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-400">Aucun dataset importé pour cette structure.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {datasets.map((d) => (
        <button
          key={d.$id}
          onClick={() => onSelect(d)}
          className="flex items-center justify-between border border-neutral-200 p-3 text-left transition hover:bg-neutral-50"
        >
          <div>
            <div className="text-sm font-medium text-ink">{d.name}</div>
            <div className="text-xs text-neutral-500">
              {d.period_label ?? 'Sans période'} — {d.row_count} lignes, {d.column_count} colonnes
            </div>
          </div>
          <Badge status={STATUS_TO_BADGE[d.status]} />
        </button>
      ))}
    </div>
  );
}