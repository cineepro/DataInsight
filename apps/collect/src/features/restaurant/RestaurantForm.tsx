// apps/collect/src/features/restaurant/RestaurantForm.tsx
import { useState } from 'react';
import { useTenantFromSlug } from '../../hooks/useTenantFromSlug';
import TenantHeader from '../../components/TenantHeader';
import RadioGroup from '../../components/ui/RadioGroup';
import StarRating from '../../components/ui/StarRating';
import TextArea from '../../components/ui/TextArea';
import Button from '../../components/ui/Button';
import SubmittedScreen from '../../components/ui/SubmittedScreen';
import { submitRestaurantScan } from './submitRestaurantScan';
import type {
  ZoneRestaurant,
  WaitTimeBucketRestaurant,
  VisitTypeRestaurant,
  VisitFrequency,
} from '@datainsight/shared';

const ZONE_OPTIONS = [
  { label: 'Terrasse', value: 'TERRASSE' },
  { label: 'VIP', value: 'VIP' },
  { label: 'Salle', value: 'SALLE' },
  { label: 'À emporter', value: 'EMPORTER' },
];

const WAIT_TIME_OPTIONS = [
  { label: '< 15 min', value: 'LT15' },
  { label: '15-30 min', value: '15_30' },
  { label: '> 30 min', value: 'GT30' },
];

const VISIT_TYPE_OPTIONS = [
  { label: 'Solo', value: 'SOLO' },
  { label: 'Déjeuner pro', value: 'DEJEUNER_PRO' },
  { label: 'En famille', value: 'FAMILLE' },
  { label: 'Entre amis', value: 'AMIS' },
];

const FREQUENCY_OPTIONS = [
  { label: 'Première fois', value: 'PREMIERE_FOIS' },
  { label: 'Occasionnel', value: 'OCCASIONNEL' },
  { label: 'Régulier', value: 'REGULIER' },
];

export default function RestaurantForm() {
  const { tenant, loading, error, slug } = useTenantFromSlug();

  const [zone, setZone] = useState<ZoneRestaurant>();
  const [satisfactionGlobal, setSatisfactionGlobal] = useState<number>();
  const [satisfactionPlat, setSatisfactionPlat] = useState<number>();
  const [waitTime, setWaitTime] = useState<WaitTimeBucketRestaurant>();
  const [serviceQuality, setServiceQuality] = useState<number>();
  const [visitType, setVisitType] = useState<VisitTypeRestaurant>();
  const [visitFrequency, setVisitFrequency] = useState<VisitFrequency>();
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

  const canSubmit = satisfactionGlobal !== undefined && waitTime !== undefined;

  async function handleSubmit() {
    if (!canSubmit || !waitTime) return;
    setSubmitting(true);
    try {
      await submitRestaurantScan({
        tenant_id: slug,
        zone,
        satisfaction_global: satisfactionGlobal!,
        satisfaction_plat: satisfactionPlat,
        wait_time_bucket: waitTime,
        service_quality: serviceQuality,
        visit_type: visitType,
        visit_frequency: visitFrequency,
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
        <StarRating
          label="Votre satisfaction globale"
          value={satisfactionGlobal}
          onChange={setSatisfactionGlobal}
          required
        />

        <StarRating
          label="Qualité du plat / boisson"
          value={satisfactionPlat}
          onChange={setSatisfactionPlat}
        />

        <RadioGroup
          label="Temps d'attente"
          name="wait_time"
          options={WAIT_TIME_OPTIONS}
          value={waitTime}
          onChange={(v) => setWaitTime(v as WaitTimeBucketRestaurant)}
          required
        />

        <RadioGroup
          label="Zone"
          name="zone"
          options={ZONE_OPTIONS}
          value={zone}
          onChange={(v) => setZone(v as ZoneRestaurant)}
        />

        <StarRating
          label="Qualité de l'accueil / service"
          value={serviceQuality}
          onChange={setServiceQuality}
        />

        <RadioGroup
          label="Type de visite"
          name="visit_type"
          options={VISIT_TYPE_OPTIONS}
          value={visitType}
          onChange={(v) => setVisitType(v as VisitTypeRestaurant)}
        />

        <RadioGroup
          label="Fréquence de venue"
          name="visit_frequency"
          options={FREQUENCY_OPTIONS}
          value={visitFrequency}
          onChange={(v) => setVisitFrequency(v as VisitFrequency)}
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