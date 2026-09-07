//apps/studio/src/features/ai-lab/components/OfficialSourceList.tsx
import type { OfficialSource, OfficialSourceStatus } from '@datainsight/shared';
import { updateOfficialSourceStatus, deleteOfficialSource } from '../../../api/officialSources';
import Badge from '../../../components/ui/Badge';

const STATUS_TO_BADGE: Record<OfficialSourceStatus, 'OPTIMAL' | 'WARNING' | 'DRAFT'> = {
  ACTIVE: 'OPTIMAL',
  NEGOTIATING: 'WARNING',
  PAUSED: 'DRAFT',
};

const STATUS_OPTIONS: OfficialSourceStatus[] = ['NEGOTIATING', 'ACTIVE', 'PAUSED'];
const STATUS_LABEL: Record<OfficialSourceStatus, string> = {
  NEGOTIATING: 'En négociation',
  ACTIVE: 'Actif',
  PAUSED: 'En pause',
};

interface OfficialSourceListProps {
  sources: OfficialSource[];
  onChanged: () => void;
}

export default function OfficialSourceList({ sources, onChanged }: OfficialSourceListProps) {
  async function handleStatusChange(id: string, status: OfficialSourceStatus) {
    await updateOfficialSourceStatus(id, status);
    onChanged();
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce partenariat ?')) return;
    await deleteOfficialSource(id);
    onChanged();
  }

  if (sources.length === 0) {
    return <p className="text-sm text-neutral-400">Aucun partenariat enregistré.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-neutral-100 border border-neutral-200">
      {sources.map((source) => (
        <div key={source.$id} className="flex items-center justify-between p-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-ink">{source.name}</p>
              <Badge status={STATUS_TO_BADGE[source.status]} />
            </div>
            <p className="text-xs text-neutral-500">
              {source.sector}
              {source.source_type && ` — ${source.source_type}`}
              {source.sync_frequency && ` — ${source.sync_frequency}`}
              {source.last_synced_at && ` — dernier contenu ajouté : ${new Date(source.last_synced_at).toLocaleDateString('fr-FR')}`}
              {source.last_checked_at && ` — dernière vérification : ${new Date(source.last_checked_at).toLocaleDateString('fr-FR')}`}
            </p>
            {source.source_url && <p className="mt-0.5 text-xs text-neutral-400">{source.source_url}</p>}
            {source.description && <p className="mt-1 text-xs text-neutral-400">{source.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={source.status}
              onChange={(e) => handleStatusChange(source.$id, e.target.value as OfficialSourceStatus)}
              className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-ink"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <button onClick={() => handleDelete(source.$id)} className="text-xs text-brick underline">
              Supprimer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}