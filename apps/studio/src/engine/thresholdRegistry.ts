// apps/studio/src/engine/thresholdRegistry.ts
export interface ThresholdField {
  key: string;
  label: string;
  defaultValue: number;
  step?: number; // pas d'incrémentation dans le formulaire (ex: 0.05 pour un taux)
  helpText?: string;
}

export interface ThresholdFunctionEntry {
  function_id: string;
  label: string;
  group: 'Restaurant' | 'Pharmacie' | 'Données brutes' | 'Commun';
  fields: ThresholdField[];
}

/**
 * Catalogue déclaratif de toutes les fonctions du moteur dont le
 * comportement peut être ajusté sans toucher au code. Ajouter une fonction
 * ici la fait automatiquement apparaître dans l'écran de pilotage du
 * Studio — c'est le seul endroit à modifier quand une nouvelle fonction
 * migre vers ce système de seuils configurables.
 */
export const THRESHOLD_REGISTRY: ThresholdFunctionEntry[] = [
  {
    function_id: 'restaurant.peak_hours_bottlenecks',
    label: "Pics d'affluence & goulets d'étranglement",
    group: 'Restaurant',
    fields: [
      {
        key: 'dissatisfaction_threshold',
        label: "Seuil d'insatisfaction déclenchant une alerte",
        defaultValue: 0.3,
        step: 0.05,
        helpText: 'Ex: 0.3 = 30% des avis insatisfaits sur un créneau',
      },
      {
        key: 'min_sample_size',
        label: "Nombre minimum d'avis pour être significatif",
        defaultValue: 3,
        step: 1,
      },
    ],
  },
  {
    function_id: 'restaurant.menu_satisfaction_matrix',
    label: 'Matrice de satisfaction du menu',
    group: 'Restaurant',
    fields: [
      {
        key: 'high_satisfaction_threshold',
        label: 'Note minimale pour être considéré "bien noté"',
        defaultValue: 3.5,
        step: 0.1,
      },
    ],
  },
  {
    function_id: 'restaurant.compare_periods',
    label: 'Comparaison avec la semaine précédente',
    group: 'Restaurant',
    fields: [
      {
        key: 'critical_decline_threshold',
        label: 'Baisse (%) de satisfaction déclenchant un statut critique',
        defaultValue: -10,
        step: 1,
      },
    ],
  },
  {
    function_id: 'pharmacie.queue_staffing_efficiency',
    label: 'Efficacité file / effectif',
    group: 'Pharmacie',
    fields: [
      {
        key: 'critical_wait_rate',
        label: "Taux d'attente longue déclenchant une alerte",
        defaultValue: 0.3,
        step: 0.05,
      },
    ],
  },
  {
    function_id: 'pharmacie.stockout_impact',
    label: 'Impact des ruptures de stock',
    group: 'Pharmacie',
    fields: [
      {
        key: 'critical_rate',
        label: 'Taux de rupture déclenchant un statut critique',
        defaultValue: 0.15,
        step: 0.01,
      },
      {
        key: 'warning_rate',
        label: 'Taux de rupture déclenchant un statut attention',
        defaultValue: 0.05,
        step: 0.01,
      },
    ],
  },
  {
    function_id: 'pharmacie.service_segmentation',
    label: 'Segmentation par motif de visite',
    group: 'Pharmacie',
    fields: [
      {
        key: 'penalized_wait_rate',
        label: 'Taux au-delà duquel un segment est jugé pénalisé',
        defaultValue: 25,
        step: 1,
        helpText: 'En pourcentage, ex: 25 = 25%',
      },
    ],
  },
  {
    function_id: 'entreprise.generic_trends',
    label: "Tendances générales d'interaction",
    group: 'Commun', // pas de groupe "Entreprise" dédié pour l'instant — rattachée à Commun
    fields: [
      {
        key: 'dissatisfaction_threshold',
        label: "Seuil d'insatisfaction déclenchant une alerte",
        defaultValue: 0.3,
        step: 0.05,
      },
      {
        key: 'min_sample_size',
        label: "Nombre minimum d'interactions pour être significatif",
        defaultValue: 3,
        step: 1,
      },
    ],
  },
  {
    function_id: 'flexible.cross_correlate',
    label: 'Corrélation entre deux colonnes (données brutes)',
    group: 'Données brutes',
    fields: [
      {
        key: 'strong_threshold',
        label: 'Seuil de corrélation "forte"',
        defaultValue: 0.6,
        step: 0.05,
      },
      {
        key: 'moderate_threshold',
        label: 'Seuil de corrélation "modérée"',
        defaultValue: 0.3,
        step: 0.05,
      },
    ],
  },
  {
    function_id: 'flexible.detect_anomalies',
    label: 'Détection d\'anomalies (données brutes)',
    group: 'Données brutes',
    fields: [
      {
        key: 'std_dev_threshold',
        label: "Nombre d'écarts-types pour signaler une anomalie",
        defaultValue: 2,
        step: 0.5,
      },
    ],
  },
  {
    function_id: 'common.churn_risk',
    label: 'Détection du risque de perte client',
    group: 'Commun',
    fields: [
      {
        key: 'at_risk_multiplier',
        label: "Multiplicateur de l'intervalle habituel pour le statut À risque",
        defaultValue: 2,
        step: 0.5,
      },
      {
        key: 'churned_multiplier',
        label: "Multiplicateur de l'intervalle habituel pour le statut Perdu",
        defaultValue: 4,
        step: 0.5,
      },
    ],
  },
];

export function getThresholdEntry(functionId: string): ThresholdFunctionEntry | undefined {
  return THRESHOLD_REGISTRY.find((e) => e.function_id === functionId);
}

export function defaultsFor(functionId: string): Record<string, number> {
  const entry = getThresholdEntry(functionId);
  if (!entry) return {};
  return Object.fromEntries(entry.fields.map((f) => [f.key, f.defaultValue]));
}