//apps/studio/src/features/api-keys/components/ApiKeyList.tsx
import type { ApiKey, ApiKeyStatus } from '@datainsight/shared';
import { updateApiKeyStatus, deleteApiKey } from '../../../api/apiKeys';
import Badge from '../../../components/ui/Badge';

const STATUS_TO_BADGE: Record<ApiKeyStatus, 'OPTIMAL' | 'WARNING' | 'CRITICAL'> = {
  ACTIVE: 'OPTIMAL',
  SUSPENDED: 'WARNING',
  REVOKED: 'CRITICAL',
};

interface ApiKeyListProps {
  keys: ApiKey[];
  onChanged: () => void;
}

export default function ApiKeyList({ keys, onChanged }: ApiKeyListProps) {
  async function handleToggleSuspend(key: ApiKey) {
    const next = key.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await updateApiKeyStatus(key.$id, next);
    onChanged();
  }

  async function handleRevoke(id: string) {
    if (!confirm('Révoquer définitivement cette clé ? Cette action est irréversible.')) return;
    await updateApiKeyStatus(id, 'REVOKED');
    onChanged();
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette clé de la liste ?')) return;
    await deleteApiKey(id);
    onChanged();
  }

  if (keys.length === 0) {
    return <p className="text-sm text-neutral-400">Aucune clé générée.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-neutral-100 border border-neutral-200">
      {keys.map((key) => (
        <div key={key.$id} className="flex items-center justify-between p-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs text-neutral-500">{key.key_prefix}...</p>
              <Badge status={STATUS_TO_BADGE[key.status]} />
            </div>
            <p className="text-sm font-medium text-ink">{key.owner_name}</p>
            <p className="text-xs text-neutral-400">
              {key.owner_email} — {key.product_scope} — {key.tier} — {key.requests_used}/{key.monthly_quota} requêtes ce mois
            </p>
          </div>
          {key.status !== 'REVOKED' && (
            <div className="flex gap-2">
              <button onClick={() => handleToggleSuspend(key)} className="text-xs text-ink underline">
                {key.status === 'ACTIVE' ? 'Suspendre' : 'Réactiver'}
              </button>
              <button onClick={() => handleRevoke(key.$id)} className="text-xs text-brick underline">
                Révoquer
              </button>
            </div>
          )}
          {key.status === 'REVOKED' && (
            <button onClick={() => handleDelete(key.$id)} className="text-xs text-neutral-400 underline">
              Supprimer
            </button>
          )}
        </div>
      ))}
    </div>
  );
}