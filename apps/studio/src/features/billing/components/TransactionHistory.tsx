//apps/studio/src/features/billing/components/TransactionHistory.tsx
import type { PaymentTransaction } from '@datainsight/shared';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

const STATUS_TO_BADGE = {
  PENDING: 'WARNING',
  SUCCESS: 'OPTIMAL',
  FAILED: 'CRITICAL',
} as const;

export default function TransactionHistory({ transactions }: { transactions: PaymentTransaction[] }) {
  if (transactions.length === 0) {
    return <p className="text-sm text-neutral-400">Aucune transaction enregistrée.</p>;
  }

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold text-neutral-900">Historique des paiements</h3>
      <div className="flex flex-col gap-2">
        {transactions.map((tx) => (
          <div key={tx.$id} className="flex items-center justify-between border-b border-neutral-100 py-2 text-sm">
            <div>
              <div className="text-neutral-900">{tx.amount.toLocaleString('fr-FR')} FCFA</div>
              <div className="text-xs text-neutral-500">
                {new Date(tx.created_at).toLocaleDateString('fr-FR')} — {tx.provider}
              </div>
            </div>
            <Badge status={STATUS_TO_BADGE[tx.status]} />
          </div>
        ))}
      </div>
    </Card>
  );
}