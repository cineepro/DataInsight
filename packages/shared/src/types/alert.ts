//packages/shared/src/types/alert.ts
export type AlertType = 'STOCKOUT_CRITICAL' | 'SATISFACTION_DROP' | 'LONG_WAIT_SPIKE' | 'DATASET_TRACKING_AT_RISK';

export interface AlertLogEntry {
  $id: string;
  tenant_id: string;
  alert_type: AlertType;
  details?: string; // JSON.stringify d'un objet de contexte
  triggered_at: string;
  notified: boolean;
}