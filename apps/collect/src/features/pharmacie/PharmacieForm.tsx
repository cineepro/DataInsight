//apps/collect/src/features/pharmacie/PharmacieForm.tsx
import { useState } from 'react';
import { useTenantFromSlug } from '../../hooks/useTenantFromSlug';
import TenantHeader from '../../components/TenantHeader';
import TicketCard from '../../components/TicketCard';
import TicketDivider from '../../components/TicketDivider';
import RadioGroup from '../../components/ui/RadioGroup';
import StarRating from '../../components/ui/StarRating';
import TextArea from '../../components/ui/TextArea';
import ContactFields from '../../components/ui/ContactFields';
import Button from '../../components/ui/Button';
import SubmittedScreen from '../../components/ui/SubmittedScreen';
import { submitPharmacieScan } from './submitPharmacieScan';
import type {
  VisitReasonPharmacie,
  WaitTimeBucketPharmacie,
  ProductAvailability,
} from '@datainsight/shared';

const VISIT_REASON_OPTIONS = [
  { label: 'Ordonnance / Soins', value: 'ORDONNANCE' },
  { label: 'Parapharmacie', value: 'PARAPHARMACIE' },
  { label: 'Dépannage', value: 'DEPANNAGE' },
  { label: 'Conseil', value: 'CONSEIL' },
];

const WAIT_TIME_OPTIONS = [
  { label: '< 5 min', value: 'LT5' },
  { label: '5-15 min', value: '5_15' },
  { label: '> 15 min', value: 'GT15' },
];

const AVAILABILITY_OPTIONS = [
  { label: 'Tout trouvé', value: 'COMPLET' },
  { label: 'Partiellement', value: 'PARTIEL' },
  { label: 'Rupture', value: 'RUPTURE' },
];

export default function PharmacieForm() {
  const { tenant, loading, error, slug } = useTenantFromSlug();

  const [visitReason, setVisitReason] = useState<VisitReasonPharmacie>();
  const [waitTime, setWaitTime] = useState<WaitTimeBucketPharmacie>();
  const [receptionQuality, setReceptionQuality] = useState<number>();
  const [availability, setAvailability] = useState<ProductAvailability>();
  const [missingProduct, setMissingProduct] = useState('');
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

  const canSubmit = visitReason !== undefined && waitTime !== undefined && availability !== undefined;
  const showMissingProductField = availability === 'PARTIEL' || availability === 'RUPTURE';

  async function handleSubmit() {
    if (!canSubmit || !visitReason || !waitTime || !availability) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitPharmacieScan(
        slug,
        {
          visit_reason: visitReason,
          wait_time_bucket: waitTime,
          reception_quality: receptionQuality,
          product_availability: availability,
          missing_product: showMissingProductField ? missingProduct || undefined : undefined,
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
          <RadioGroup
            label="Motif de votre visite"
            name="visit_reason"
            options={VISIT_REASON_OPTIONS}
            value={visitReason}
            onChange={(v) => setVisitReason(v as VisitReasonPharmacie)}
            required
          />

          <RadioGroup
            label="Temps d'attente"
            name="wait_time"
            options={WAIT_TIME_OPTIONS}
            value={waitTime}
            onChange={(v) => setWaitTime(v as WaitTimeBucketPharmacie)}
            required
          />

          <TicketDivider label="Détails" />

          <RadioGroup
            label="Avez-vous trouvé tous vos produits ?"
            name="availability"
            options={AVAILABILITY_OPTIONS}
            value={availability}
            onChange={(v) => setAvailability(v as ProductAvailability)}
            required
          />

          {showMissingProductField && (
            <TextArea
              label="Quel produit manquait ?"
              value={missingProduct}
              onChange={(e) => setMissingProduct(e.target.value)}
            />
          )}

          <StarRating
            label="Qualité de l'accueil et du conseil"
            value={receptionQuality}
            onChange={setReceptionQuality}
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