//apps/studio/src/features/alerts/pages/AlertsPage.tsx
import { useEffect, useState } from 'react';
import type { AlertLogEntry } from '@datainsight/shared';
import { listRecentAlerts } from '../../../api/alerts';
import AlertFeedItem from '../components/AlertFeedItem';
import Card from '../../../components/ui/Card';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listRecentAlerts().then((data) => {
      setAlerts(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-neutral-900">Alertes récentes</h1>

      {loading ? (
        <p className="text-sm text-neutral-400">Chargement...</p>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-neutral-400">Aucune alerte déclenchée récemment.</p>
      ) : (
        <Card>
          {alerts.map((alert) => (
            <AlertFeedItem key={alert.$id} alert={alert} />
          ))}
        </Card>
      )}
    </div>
  );
}