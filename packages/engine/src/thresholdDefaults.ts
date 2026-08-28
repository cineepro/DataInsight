//packages/engine/src/thresholdDefaults.ts
/**
 * Source unique de vérité pour les valeurs par défaut de chaque seuil,
 * indexées par function_id. Utilisée à deux endroits :
 * - ici, comme filet de sécurité si un appelant (API publique, par
 *   exemple) n'envoie aucun seuil personnalisé
 * - dans apps/studio/src/engine/thresholdRegistry.ts, pour que l'écran
 *   "Seuils" affiche les mêmes valeurs par défaut, sans les dupliquer
 */
export const DEFAULT_THRESHOLDS: Record<string, Record<string, number>> = {
  'restaurant.peak_hours_bottlenecks': {
    dissatisfaction_threshold: 0.3,
    min_sample_size: 3,
  },
  'restaurant.menu_satisfaction_matrix': {
    high_satisfaction_threshold: 3.5,
  },
  'restaurant.compare_periods': {
    critical_decline_threshold: -10,
  },
  'pharmacie.queue_staffing_efficiency': {
    critical_wait_rate: 0.3,
  },
  'pharmacie.stockout_impact': {
    critical_rate: 0.15,
    warning_rate: 0.05,
  },
  'pharmacie.service_segmentation': {
    penalized_wait_rate: 25,
  },
  'entreprise.generic_trends': {
    dissatisfaction_threshold: 0.3,
    min_sample_size: 3,
  },
  'flexible.cross_correlate': {
    strong_threshold: 0.6,
    moderate_threshold: 0.3,
  },
  'flexible.detect_anomalies': {
    std_dev_threshold: 2,
  },
  'common.churn_risk': {
    at_risk_multiplier: 2,
    churned_multiplier: 4,
  },
};

export function getDefaultThresholds(functionId: string): Record<string, number> {
  return DEFAULT_THRESHOLDS[functionId] ?? {};
}