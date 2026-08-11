//apps/studio/src/features/billing/components/SubscriptionForm.tsx
import { useState } from 'react';
import type { Tenant, SubscriptionPlan } from '@datainsight/shared';
import { createSubscription } from '../../../api/billing';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

const PLAN_OPTIONS = [
  { label: 'Standard', value: 'STANDARD' },
  { label: 'Premium', value: 'PREMIUM' },
];

interface SubscriptionFormProps {
  tenant: Tenant;
  onCreated: () => void;
}

export default function SubscriptionForm({ tenant, onCreated }: SubscriptionFormProps) {
  const [plan, setPlan] = useState<SubscriptionPlan>('STANDARD');
  const [monthlyAmount, setMonthlyAmount] = useState('15000');
  const [trialDays, setTrialDays] = useState('30');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + Number(trialDays));

      await createSubscription({
        tenant_id: tenant.slug,
        plan,
        monthly_amount: Number(monthlyAmount),
        trial_start_date: trialStart.toISOString(),
        trial_end_date: trialEnd.toISOString(),
        payment_status: 'TRIAL',
      });

      onCreated();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de l'abonnement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h3 className="mb-4 text-base font-semibold text-neutral-900">Démarrer un abonnement</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select label="Formule" value={plan} onChange={(v) => setPlan(v as SubscriptionPlan)} options={PLAN_OPTIONS} />
        <Input
          label="Montant mensuel (FCFA)"
          type="number"
          value={monthlyAmount}
          onChange={(e) => setMonthlyAmount(e.target.value)}
        />
        <Input
          label="Durée de l'essai gratuit (jours)"
          type="number"
          value={trialDays}
          onChange={(e) => setTrialDays(e.target.value)}
        />
        <Button type="submit" loading={saving}>
          Démarrer la période d'essai
        </Button>
      </form>
    </Card>
  );
}