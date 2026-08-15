// apps/studio/src/features/ai-lab/components/KnowledgeBaseList.tsx
import type { KnowledgeBaseEntry } from '../../../api/aiLab';
import { deleteKnowledgeBaseEntry } from '../../../api/aiLab';

interface KnowledgeBaseListProps {
  entries: KnowledgeBaseEntry[];
  onDeleted: () => void;
}

export default function KnowledgeBaseList({ entries, onDeleted }: KnowledgeBaseListProps) {
  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette entrée ?')) return;
    await deleteKnowledgeBaseEntry(id);
    onDeleted();
  }

  if (entries.length === 0) {
    return <p className="text-sm text-neutral-400">Aucune connaissance enregistrée pour l'instant.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-neutral-100 border border-neutral-200">
      {entries.map((entry) => (
        <div key={entry.$id} className="p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">{entry.title}</span>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">{entry.sector}</span>
              <button onClick={() => handleDelete(entry.$id)} className="text-xs text-brick underline">
                Supprimer
              </button>
            </div>
          </div>
          <p className="text-xs text-neutral-500 line-clamp-2">{entry.content}</p>
        </div>
      ))}
    </div>
  );
}