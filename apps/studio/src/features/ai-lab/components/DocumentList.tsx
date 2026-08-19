//apps/studio/src/features/ai-lab/components/DocumentList.tsx
import type { ImportedDocument } from '../../../api/documents';

const STATUS_LABEL = { PENDING: 'En cours...', PROCESSED: 'Traité', FAILED: 'Échec' };
const STATUS_COLOR = { PENDING: 'text-marigold-600', PROCESSED: 'text-teal', FAILED: 'text-brick' };

export default function DocumentList({ documents }: { documents: ImportedDocument[] }) {
  if (documents.length === 0) {
    return <p className="text-sm text-neutral-400">Aucun document importé pour l'instant.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-neutral-100 border border-neutral-200">
      {documents.map((doc) => (
        <div key={doc.$id} className="flex items-center justify-between p-3">
          <div>
            <p className="text-sm font-medium text-ink">{doc.file_name}</p>
            <p className="text-xs text-neutral-500">
              {doc.source_label && `${doc.source_label} — `}
              {doc.sector}
              {doc.entries_generated !== undefined && doc.status === 'PROCESSED' && ` — ${doc.entries_generated} entrée(s) générée(s)`}
            </p>
          </div>
          <span className={`text-xs font-medium ${STATUS_COLOR[doc.status]}`}>{STATUS_LABEL[doc.status]}</span>
        </div>
      ))}
    </div>
  );
}