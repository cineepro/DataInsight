//apps/studio/src/engine/registry.ts
import type { ScanRestaurant, ScanPharmacie, ScanEntreprise, TenantCategory } from '@datainsight/shared';
import type { AnalysisFunctionDescriptor } from './types';

import { analyzePeakHoursAndBottlenecks } from './restaurant/analyzePeakHoursAndBottlenecks';
import { calculateMenuSatisfactionMatrix } from './restaurant/calculateMenuSatisfactionMatrix';
import { comparePeriodCrossMetrics } from './restaurant/comparePeriodCrossMetrics';

import { analyzeQueueAndStaffingEfficiency } from './pharmacie/analyzeQueueAndStaffingEfficiency';
import { detectStockoutImpact } from './pharmacie/detectStockoutImpact';
import { analyzeServiceSegmentation } from './pharmacie/analyzeServiceSegmentation';

import { analyzeGenericTrends } from './entreprise/analyzeGenericTrends';

export const RESTAURANT_FUNCTIONS: AnalysisFunctionDescriptor<ScanRestaurant>[] = [
  {
    id: 'peak_hours_bottlenecks',
    label: "Pics d'affluence & goulets d'étranglement",
    description: "Détecte les créneaux horaires où le temps d'attente fait chuter la satisfaction.",
    run: analyzePeakHoursAndBottlenecks,
  },
  {
    id: 'menu_satisfaction_matrix',
    label: 'Matrice de satisfaction du menu',
    description: 'Classe les plats en Gagnants / Étoiles filantes / À corriger / Plats morts.',
    run: calculateMenuSatisfactionMatrix,
  },
  {
    id: 'compare_periods',
    label: 'Comparaison avec la semaine précédente',
    description: "Calcule l'évolution des indicateurs clés vs la période précédente.",
    run: comparePeriodCrossMetrics,
  },
];

export const PHARMACIE_FUNCTIONS: AnalysisFunctionDescriptor<ScanPharmacie>[] = [
  {
    id: 'queue_staffing_efficiency',
    label: 'Efficacité file / effectif',
    description: "Croise le temps d'attente perçu avec l'effectif en poste.",
    run: analyzeQueueAndStaffingEfficiency,
  },
  {
    id: 'stockout_impact',
    label: 'Impact des ruptures de stock',
    description: 'Identifie les produits les plus souvent signalés en rupture.',
    run: detectStockoutImpact,
  },
  {
    id: 'service_segmentation',
    label: 'Segmentation par motif de visite',
    description: 'Compare Ordonnance / Parapharmacie / Dépannage / Conseil.',
    run: analyzeServiceSegmentation,
  },
];

export const ENTREPRISE_FUNCTIONS: AnalysisFunctionDescriptor<ScanEntreprise>[] = [
  {
    id: 'generic_trends',
    label: 'Tendances générales',
    description: "Analyse les types d'interactions et les créneaux critiques.",
    run: analyzeGenericTrends,
  },
];

/**
 * Point d'entrée unique utilisé par le FunctionPicker (Étape 3 du studio)
 * pour afficher les cases à cocher disponibles selon la catégorie du tenant.
 */
export function getFunctionsForCategory(category: TenantCategory) {
  switch (category) {
    case 'RESTAURANT':
    case 'FASTFOOD':
      return RESTAURANT_FUNCTIONS;
    case 'PHARMACIE':
      return PHARMACIE_FUNCTIONS;
    case 'ENTREPRISE':
      return ENTREPRISE_FUNCTIONS;
  }
}