//apps/collect/src/features/entreprise/EntrepriseForm.tsx
import { useState } from 'react';
import { useTenantFromSlug } from '../../hooks/useTenantFromSlug';
import TenantHeader from '../../components/TenantHeader';
import TicketCard from '../../components/TicketCard';
import TicketDivider from '../../components/TicketDivider';
import StarRating from '../../components/ui/StarRating';
import TextArea from '../../components/ui/TextArea';
import ContactFields from '../../components/ui/ContactFields';
import Button from '../../components/ui/Button';
import SubmittedScreen from '../../components/ui/SubmittedScreen';
import { submitEntrepriseScan } from './submitEntrepriseScan';

export default function EntrepriseForm() {
  const { tenant, loading, error, slug } = useTenantFromSlug();

  const [interactionType, setInteractionType] = useState('');
  const [satisfactionGlobal, setSatisfactionGlobal] = useState<number>();
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ticket text-sm text-neutral-400">
        Chargement...
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ticket p-6 text-center text-sm text-neutral-500">
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
    setSubmitError(null);
    try {
      await submitEntrepriseScan(
        slug,
        {
          interaction_type: interactionType.trim(),
          satisfaction_global: satisfactionGlobal,
          comment: comment || undefined,
        },
        { phone: phone || undefined, name: name || undefined }
      );
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setSubmitError(err instanceof Error ? err.message : 'Une erreur est survenue, merci de réessayer.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-ticket px-4 py-8">
      <TenantHeader tenant={tenant} />

      <TicketCard>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-ink">
              Type d'interaction <span className="text-marigold-600">*</span>
            </label>
            <input
              type="text"
              value={interactionType}
              onChange={(e) => setInteractionType(e.target.value)}
              placeholder="Ex: Achat, Support, Renseignement..."
              className="rounded-xl border border-neutral-200 p-3 text-sm text-ink focus:border-marigold-500 focus:outline-none"
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

          <TicketDivider label="Contact" />

          <ContactFields phone={phone} name={name} onPhoneChange={setPhone} onNameChange={setName} />

          {submitError && <p className="text-sm text-brick">{submitError}</p>}

          <Button onClick={handleSubmit} disabled={!canSubmit} loading={submitting}>
            Envoyer mon avis
          </Button>
        </div>
      </TicketCard>
    </div>
  );
}