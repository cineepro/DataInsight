//apps/studio/src/features/api-keys/pages/ApiKeysPage.tsx
import { useEffect, useState } from 'react';
import { listApiKeys } from '../../../api/apiKeys';
import type { ApiKey } from '@datainsight/shared';
import ApiKeyForm from '../components/ApiKeyForm';
import ApiKeyList from '../components/ApiKeyList';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    setKeys(await listApiKeys());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6">
        <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">API</span>
        <h1 className="font-display text-2xl font-medium text-ink">Clés API</h1>
      </div>

      <div className="flex flex-col gap-4">
        <ApiKeyForm onCreated={refresh} />
        {loading ? <p className="text-sm text-neutral-400">Chargement...</p> : <ApiKeyList keys={keys} onChanged={refresh} />}
      </div>
    </div>
  );
}