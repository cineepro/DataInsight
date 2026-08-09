// apps/collect/src/features/entreprise/EntrepriseForm.tsx
import { useState } from 'react';
import { useTenantFromSlug } from '../../hooks/useTenantFromSlug';
import TenantHeader from '../../components/TenantHeader';
import StarRating from '../../components/ui/StarRating';
import TextArea from '../../components/ui/TextArea';
import Button from '../../components/ui/Button';
import SubmittedScreen from '../../components/ui/SubmittedScreen';
import { submitEntrepriseScan } from './submitEntrepriseScan';

// Formulaire générique : "interaction_type" est saisi en texte libre pour
// l'instant. En v2, on pourra le remplacer par une liste déroulante générée
// depuis une config JSON stockée par tenant (voir doc architecture, section categories).
export default function EntrepriseForm() {
  const { tenant, loading, error, slug } = useTenantFromSlug();

  const [interactionType, setInteractionType] = useState('');
  const [satisfactionGlobal, setSatisfactionGlobal] = useState<number>();
  const [comment, setComment] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-neutral-400">Chargement...</div>;
  }

  if (error || !tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-neutral-500">
        {error ?? 'Établissement introuvable.'}
      </div>
    );
  }

  if (submitted) {
    return <SubmittedScreen />;
  }

  const canSubmit = interactionType.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await submitEntrepriseScan({
        tenant_id: slug,
        interaction_type: interactionType.trim(),
        satisfaction_global: satisfactionGlobal,
        comment: comment || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue, merci de réessayer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10">
      <TenantHeader tenant={tenant} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-neutral-700">
            Type d'interaction <span className="text-brand-600">*</span>
          </label>
          <input
            type="text"
            value={interactionType}
            onChange={(e) => setInteractionType(e.target.value)}
            placeholder="Ex: Achat, Support, Renseignement..."
            className="rounded-lg border border-neutral-200 p-3 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        <StarRating
          label="Votre satisfaction globale"
          value={satisfactionGlobal}
          onChange={setSatisfactionGlobal}
        />

        <TextArea
          label="Une remarque particulière ? (optionnel)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <Button onClick={handleSubmit} disabled={!canSubmit} loading={submitting}>
          Envoyer mon avis
        </Button>
      </div>
    </div>
  );
}