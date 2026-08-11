//apps/studio/src/features/billing/components/SubscriptionCard.tsx
import type { Subscription } from '@datainsight/shared';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';

interface SubscriptionCardProps {
  subscription: Subscription;
  onMarkPaid: () => void;
  markingPaid: boolean;
}

const STATUS_TO_BADGE = {
  TRIAL: 'WARNING',
  PAID: 'OPTIMAL',
  OVERDUE: 'CRITICAL',
  CANCELLED: 'DRAFT',
} as const;

export default function SubscriptionCard({ subscription, onMarkPaid, markingPaid }: SubscriptionCardProps) {
  const trialEnd = new Date(subscription.trial_end_date);
  const daysLeftInTrial = Math.ceil((trialEnd.getTime() - Date.now()) / 86400000);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-neutral-900">Abonnement — {subscription.plan}</h3>
        <Badge status={STATUS_TO_BADGE[subscription.payment_status]} />
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-neutral-500">Montant mensuel</dt>
          <dd className="text-neutral-900">{subscription.monthly_amount.toLocaleString('fr-FR')} FCFA</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Fin de la période d'essai</dt>
          <dd className="text-neutral-900">
            {trialEnd.toLocaleDateString('fr-FR')}
            {subscription.payment_status === 'TRIAL' && daysLeftInTrial >= 0 && ` (dans ${daysLeftInTrial}j)`}
          </dd>
        </div>
        {subscription.last_payment_date && (
          <div>
            <dt className="text-neutral-500">Dernier paiement</dt>
            <dd className="text-neutral-900">{new Date(subscription.last_payment_date).toLocaleDateString('fr-FR')}</dd>
          </div>
        )}
        {subscription.next_due_date && (
          <div>
            <dt className="text-neutral-500">Prochaine échéance</dt>
            <dd className="text-neutral-900">{new Date(subscription.next_due_date).toLocaleDateString('fr-FR')}</dd>
          </div>
        )}
      </dl>

      {subscription.payment_status !== 'PAID' && subscription.payment_status !== 'CANCELLED' && (
        <Button onClick={onMarkPaid} loading={markingPaid} className="mt-4">
          Marquer comme payé (manuel)
        </Button>
      )}
    </Card>
  );
}