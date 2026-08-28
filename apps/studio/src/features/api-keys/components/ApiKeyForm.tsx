//apps/studio/src/features/api-keys/components/ApiKeyForm.tsx
import { useState } from 'react';
import { createApiKey } from '../../../api/apiKeys';
import type { ApiProductScope, ApiTier } from '@datainsight/shared';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

const SCOPE_OPTIONS = [
  { label: 'Astra API (assistant IA)', value: 'ASTRA_API' },
  { label: 'Analysis Engine API (moteur d\'analyse)', value: 'ANALYSIS_ENGINE_API' },
  { label: 'Les deux', value: 'BOTH' },
];

const TIER_OPTIONS = [
  { label: 'Trial (100/mois)', value: 'TRIAL' },
  { label: 'Starter (2000/mois)', value: 'STARTER' },
  { label: 'Pro (20000/mois)', value: 'PRO' },
];

interface ApiKeyFormProps {
  onCreated: () => void;
}

export default function ApiKeyForm({ onCreated }: ApiKeyFormProps) {
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [scope, setScope] = useState<ApiProductScope>('ASTRA_API');
  const [tier, setTier] = useState<ApiTier>('TRIAL');
  const [saving, setSaving] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { plainTextKey } = await createApiKey({ owner_name: ownerName, owner_email: ownerEmail, product_scope: scope, tier });
      setGeneratedKey(plainTextKey);
      setOwnerName('');
      setOwnerEmail('');
      onCreated();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération.');
    } finally {
      setSaving(false);
    }
  }

  if (generatedKey) {
    return (
      <Card className="border-marigold-500 bg-marigold-500/5">
        <h3 className="mb-2 text-sm font-medium text-ink">Clé générée — copiez-la maintenant</h3>
        <p className="mb-3 text-xs text-brick">
          Cette clé ne sera plus jamais affichée. Transmettez-la au client immédiatement.
        </p>
        <div className="mb-4 break-all rounded-md bg-ink px-3 py-2 font-mono text-xs text-white">{generatedKey}</div>
        <Button onClick={() => setGeneratedKey(null)}>J'ai copié la clé — fermer</Button>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="mb-4 text-sm font-medium text-ink">Générer une nouvelle clé API</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Nom du client" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
        <Input label="Email du client" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} required />
        <Select label="Produit(s) accessible(s)" value={scope} onChange={(v) => setScope(v as ApiProductScope)} options={SCOPE_OPTIONS} />
        <Select label="Palier" value={tier} onChange={(v) => setTier(v as ApiTier)} options={TIER_OPTIONS} />
        <Button type="submit" loading={saving}>
          Générer la clé
        </Button>
      </form>
    </Card>
  );
}