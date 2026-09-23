//apps/studio/src/features/alerts/components/AlertFeedItem.tsx
import type { AlertLogEntry } from '@datainsight/shared';
import Badge from '../../../components/ui/Badge';

const ALERT_LABELS: Record<string, string> = {
  STOCKOUT_CRITICAL: 'Ruptures de stock répétées',
  SATISFACTION_DROP: 'Chute de satisfaction',
  LONG_WAIT_SPIKE: "Pic de temps d'attente",
  DATASET_TRACKING_AT_RISK: 'Suivi individuel — personne à risque',
};

export default function AlertFeedItem({ alert }: { alert: AlertLogEntry }) {
  let details: Record<string, unknown> = {};
  try {
    details = alert.details ? JSON.parse(alert.details) : {};
  } catch {
    details = {};
  }

  return (
    <div className="flex items-start justify-between border-b border-neutral-100 py-3">
      <div>
        <div className="text-sm font-medium text-neutral-900">
          {ALERT_LABELS[alert.alert_type] ?? alert.alert_type}
        </div>
        <div className="text-xs text-neutral-500">{alert.tenant_id}</div>
        <div className="mt-1 text-xs text-neutral-400">{JSON.stringify(details)}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Badge status="CRITICAL" />
        <span className="text-xs text-neutral-400">
          {new Date(alert.triggered_at).toLocaleString('fr-FR')}
        </span>
      </div>
    </div>
  );
}