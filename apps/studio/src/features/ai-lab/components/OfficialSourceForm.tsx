//apps/studio/src/features/ai-lab/components/OfficialSourceForm.tsx
import { useState } from 'react';
import { createOfficialSource } from '../../../api/officialSources';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

const SECTOR_OPTIONS = [
  { label: 'Général', value: 'GENERAL' },
  { label: 'Restauration', value: 'RESTAURATION' },
  { label: 'Hôtellerie', value: 'HOTELLERIE' },
  { label: 'Pharmacie', value: 'PHARMACIE' },
  { label: 'Commerce de détail', value: 'COMMERCE_DETAIL' },
];

interface OfficialSourceFormProps {
  onCreated: () => void;
}

export default function OfficialSourceForm({ onCreated }: OfficialSourceFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sector, setSector] = useState('GENERAL');
  const [syncFrequency, setSyncFrequency] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createOfficialSource({ name, description: description || undefined, sector, sync_frequency: syncFrequency || undefined });
      setName('');
      setDescription('');
      setSyncFrequency('');
      onCreated();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h3 className="mb-4 text-sm font-medium text-ink">Nouveau partenariat</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Nom de la source" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: INStaD" required />
        <Select label="Secteur concerné" value={sector} onChange={setSector} options={SECTOR_OPTIONS} />
        <Input
          label="Fréquence de synchronisation (optionnel)"
          value={syncFrequency}
          onChange={(e) => setSyncFrequency(e.target.value)}
          placeholder="Ex: Hebdomadaire"
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Description (optionnel)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
          />
        </div>
        <Button type="submit" loading={saving}>
          Ajouter (statut : En négociation)
        </Button>
      </form>
    </Card>
  );
}