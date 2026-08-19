//apps/studio/src/features/ai-lab/components/DocumentUploadForm.tsx
import { useState } from 'react';
import { uploadAndProcessDocument } from '../../../api/documents';
import { getCurrentSession } from '../../../api/auth';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

const SECTOR_OPTIONS = [
  { label: 'Général', value: 'GENERAL' },
  { label: 'Restauration', value: 'RESTAURATION' },
  { label: 'Hôtellerie', value: 'HOTELLERIE' },
  { label: 'Pharmacie', value: 'PHARMACIE' },
  { label: 'Commerce de détail', value: 'COMMERCE_DETAIL' },
];

interface DocumentUploadFormProps {
  onUploaded: () => void;
}

export default function DocumentUploadForm({ onUploaded }: DocumentUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sector, setSector] = useState('GENERAL');
  const [sourceLabel, setSourceLabel] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const session = await getCurrentSession();
      await uploadAndProcessDocument(file, sector, sourceLabel || undefined, session.userId);
      setFile(null);
      setSourceLabel('');
      onUploaded();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'import. Vérifiez que le fichier est bien un PDF exploitable.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <h3 className="mb-4 text-sm font-medium text-ink">Importer un document officiel (PDF)</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Fichier PDF</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-ink file:mr-3 file:rounded file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:text-white"
          />
        </div>

        <Select label="Secteur cible" value={sector} onChange={setSector} options={SECTOR_OPTIONS} />

        <Input
          label="Source (optionnel)"
          value={sourceLabel}
          onChange={(e) => setSourceLabel(e.target.value)}
          placeholder="Ex: INStaD — Rapport 2026"
        />

        {error && <p className="text-sm text-brick">{error}</p>}

        <Button type="submit" disabled={!file} loading={uploading}>
          Importer et lancer l'extraction
        </Button>

        <p className="text-xs text-neutral-400">
          Le traitement peut prendre 1 à 2 minutes selon la taille du document. Les entrées générées apparaîtront en
          brouillon dans l'onglet « À valider ».
        </p>
      </form>
    </Card>
  );
}