// apps/studio/src/features/ai-lab/components/KnowledgeBaseForm.tsx
import { useState } from 'react';
import { createKnowledgeBaseEntry } from '../../../api/aiLab';
import { getCurrentSession } from '../../../api/auth';
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

interface KnowledgeBaseFormProps {
  onCreated: () => void;
}

/**
 * C'est ici que se fait le vrai "entraînement" de l'IA — pas en modifiant
 * un modèle, mais en enrichissant le contenu que Claude reçoit en contexte
 * à chaque question. Plus cette base grandit, plus les réponses sont précises.
 */
export default function KnowledgeBaseForm({ onCreated }: KnowledgeBaseFormProps) {
  const [title, setTitle] = useState('');
  const [sector, setSector] = useState('GENERAL');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const session = await getCurrentSession();
      await createKnowledgeBaseEntry({ title, sector, content, created_by: session.userId });
      setTitle('');
      setContent('');
      onCreated();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h3 className="mb-4 text-sm font-medium text-ink">Ajouter une connaissance</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Select label="Secteur" value={sector} onChange={setSector} options={SECTOR_OPTIONS} />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Contenu</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            required
            placeholder="Ex: En saison des pluies, les pharmacies d'Afrique de l'Ouest observent généralement une hausse de la demande en antipaludéens..."
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
          />
        </div>
        <Button type="submit" loading={saving}>
          Ajouter à la base de connaissances
        </Button>
      </form>
    </Card>
  );
}