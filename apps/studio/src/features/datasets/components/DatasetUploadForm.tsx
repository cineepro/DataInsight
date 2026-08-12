//apps/studio/src/features/datasets/components/DatasetUploadForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Tenant, TenantCategory } from '@datainsight/shared';
import { listTenants } from '../../../api/tenants';
import { createDataset } from '../../../api/datasets';
import { getCurrentSession } from '../../../api/auth';
import { parseSpreadsheet } from '../utils/parseSpreadsheet';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { useEffect } from 'react';

const CATEGORY_OPTIONS = [
  { label: 'Restauration', value: 'RESTAURANT' },
  { label: 'Fast-food', value: 'FASTFOOD' },
  { label: 'Pharmacie', value: 'PHARMACIE' },
  { label: 'Entreprise', value: 'ENTREPRISE' },
];

interface DatasetUploadFormProps {
  onCancel: () => void;
}

/**
 * Étape 1 du pipeline. Le fichier est lu immédiatement côté navigateur
 * (parseSpreadsheet) pour valider qu'il est exploitable et connaître son
 * nombre de lignes/colonnes AVANT même de créer le document `datasets` —
 * évite de créer des datasets fantômes pour des fichiers invalides.
 */
export default function DatasetUploadForm({ onCancel }: DatasetUploadFormProps) {
  const navigate = useNavigate();

  const [category, setCategory] = useState<TenantCategory | ''>('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [name, setName] = useState('');
  const [periodLabel, setPeriodLabel] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileSummary, setFileSummary] = useState<{ rowCount: number; columnCount: number } | null>(null);

  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) {
      setTenants([]);
      return;
    }
    listTenants(category).then(setTenants);
  }, [category]);

  async function handleFileChange(selectedFile: File | null) {
    setFile(selectedFile);
    setFileSummary(null);
    setError(null);

    if (!selectedFile) return;

    setParsing(true);
    try {
      const parsed = await parseSpreadsheet(selectedFile);
      setFileSummary({ rowCount: parsed.rows.length, columnCount: parsed.headers.length });
      if (!name) {
        // Pré-remplit le nom à partir du fichier, l'analyste peut ajuster.
        setName(selectedFile.name.replace(/\.(xlsx|xls|csv)$/i, ''));
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Fichier illisible.');
      setFile(null);
    } finally {
      setParsing(false);
    }
  }

  const selectedTenant = tenants.find((t) => t.$id === tenantId);
  const canSubmit = !!selectedTenant && !!file && name.trim().length > 0 && !parsing;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !file || !selectedTenant) return;

    setSubmitting(true);
    setError(null);
    try {
      const session = await getCurrentSession();

      const sourceType = file.name.toLowerCase().endsWith('.csv') ? 'CSV' : 'EXCEL';

      const dataset = await createDataset({
        tenant_id: selectedTenant.slug,
        name: name.trim(),
        description: description.trim() || undefined,
        source_type: sourceType,
        period_label: periodLabel.trim() || undefined,
        uploaded_by: session.userId,
      });

      // Le fichier lui-même n'est pas ré-uploadé ici — on passe directement
      // à l'écran de mapping avec le File en mémoire (état de navigation),
      // pour éviter un aller-retour réseau inutile.
      navigate(`/datasets/${dataset.$id}`, { state: { file } });
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la création du dataset.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-4 font-display text-lg font-medium text-ink">Importer un fichier de données</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Catégorie"
            value={category}
            onChange={(v) => {
              setCategory(v as TenantCategory);
              setTenantId('');
            }}
            options={CATEGORY_OPTIONS}
            placeholder="Choisir une catégorie"
          />
          <Select
            label="Structure"
            value={tenantId}
            onChange={setTenantId}
            options={tenants.map((t) => ({ label: t.name, value: t.$id }))}
            placeholder="Choisir une structure"
          />
        </div>

        <Input
          label="Nom du dataset"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Ventes Janvier 2026"
          required
        />

        <Input
          label="Période (libre, optionnel)"
          value={periodLabel}
          onChange={(e) => setPeriodLabel(e.target.value)}
          placeholder="Ex: Janvier 2026, T1 2026..."
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

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Fichier (.xlsx, .xls, .csv)</label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-ink file:mr-3 file:rounded file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:text-white"
          />
        </div>

        {parsing && <p className="text-xs text-neutral-400">Lecture du fichier...</p>}

        {fileSummary && (
          <p className="font-mono text-xs text-teal">
            {fileSummary.rowCount} lignes détectées — {fileSummary.columnCount} colonnes
          </p>
        )}

        {error && <p className="text-sm text-brick">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={!canSubmit} loading={submitting}>
            Continuer vers le mapping
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </form>
    </Card>
  );
}