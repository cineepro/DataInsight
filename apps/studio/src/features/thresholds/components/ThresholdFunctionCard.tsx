//apps/studio/src/features/thresholds/components/ThresholdFunctionCard.tsx
import { useEffect, useState } from 'react';
import type { ThresholdFunctionEntry } from '../../../engine/thresholdRegistry';
import { getThresholdConfig, saveThresholdConfig, resetThresholdConfig } from '../../../api/thresholds';
import { clearThresholdsCache } from '../../../engine/thresholds';
import { getCurrentSession } from '../../../api/auth';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

interface ThresholdFunctionCardProps {
  entry: ThresholdFunctionEntry;
}

export default function ThresholdFunctionCard({ entry }: ThresholdFunctionCardProps) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(entry.fields.map((f) => [f.key, f.defaultValue]))
  );
  const [isCustomized, setIsCustomized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getThresholdConfig(entry.function_id).then((stored) => {
      if (stored) {
        const parsed = JSON.parse(stored.config) as Record<string, number>;
        setValues((prev) => ({ ...prev, ...parsed }));
        setIsCustomized(true);
      }
      setLoading(false);
    });
  }, [entry.function_id]);

  async function handleSave() {
    setSaving(true);
    try {
      const session = await getCurrentSession();
      await saveThresholdConfig(entry.function_id, entry.label, values, session.userId);
      clearThresholdsCache();
      setIsCustomized(true);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm('Revenir aux valeurs par défaut pour cette fonction ?')) return;
    setSaving(true);
    try {
      await resetThresholdConfig(entry.function_id);
      clearThresholdsCache();
      setValues(Object.fromEntries(entry.fields.map((f) => [f.key, f.defaultValue])));
      setIsCustomized(false);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la réinitialisation.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-ink">{entry.label}</h3>
        {isCustomized && (
          <span className="rounded-full bg-marigold-500/15 px-2 py-0.5 text-[11px] font-medium text-marigold-600">
            Personnalisé
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {entry.fields.map((field) => (
          <div key={field.key}>
            <Input
              label={field.label}
              type="number"
              step={field.step ?? 1}
              value={String(values[field.key])}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))}
            />
            {field.helpText && <p className="mt-1 text-xs text-neutral-400">{field.helpText}</p>}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button onClick={handleSave} loading={saving}>
          Enregistrer
        </Button>
        {isCustomized && (
          <Button variant="secondary" onClick={handleReset} disabled={saving}>
            Réinitialiser
          </Button>
        )}
      </div>
    </Card>
  );
}