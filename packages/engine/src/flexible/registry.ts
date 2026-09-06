//packages/engine/src/flexible/registry.ts
import type { DatasetColumnDef, ColumnRole } from './types';

export type FlexibleFunctionId =
  | 'aggregate_by_dimension'
  | 'aggregate_by_dimensions'
  | 'top_n_by_dimension'
  | 'cross_correlate_columns'
  | 'detect_anomalies'
  | 'analyze_trend_by_period'
  | 'compare_snapshots';

export interface FlexibleFunctionDescriptor {
  id: FlexibleFunctionId;
  label: string;
  description: string;
  requiredRoles: ColumnRole[];
  minColumnsNeeded: number;
}

export const FLEXIBLE_FUNCTIONS: FlexibleFunctionDescriptor[] = [
  {
    id: 'aggregate_by_dimension',
    label: 'Agréger par dimension',
    description: "Somme, moyenne ou compte d'une mesure, groupée par une dimension (ex: ventes par ville).",
    requiredRoles: ['DIMENSION'],
    minColumnsNeeded: 1,
  },
  {
    id: 'aggregate_by_dimensions',
    label: 'Agréger par plusieurs dimensions',
    description: "Comme ci-dessus, mais en croisant 2 dimensions ou plus (ex: catégorie de formation × mode de paiement).",
    requiredRoles: ['DIMENSION'],
    minColumnsNeeded: 2,
  },
  {
    id: 'top_n_by_dimension',
    label: 'Classement (Top N)',
    description: "Classe les valeurs d'une dimension par ordre décroissant sur une mesure.",
    requiredRoles: ['DIMENSION'],
    minColumnsNeeded: 1,
  },
  {
    id: 'cross_correlate_columns',
    label: 'Corrélation entre deux mesures',
    description: 'Mesure si deux colonnes numériques évoluent ensemble.',
    requiredRoles: ['METRIC'],
    minColumnsNeeded: 2,
  },
  {
    id: 'detect_anomalies',
    label: "Détection d'anomalies",
    description: 'Repère les valeurs statistiquement aberrantes dans une mesure.',
    requiredRoles: ['METRIC'],
    minColumnsNeeded: 1,
  },
  {
    id: 'analyze_trend_by_period',
    label: 'Évolution & point de rupture',
    description: "Suit une mesure période par période (ex: semaine) et détecte automatiquement la plus forte chute — utile pour repérer un décrochage.",
    requiredRoles: ['DATE'],
    minColumnsNeeded: 1,
  },
  {
    id: 'compare_snapshots',
    label: 'Comparer avec un autre dataset',
    description: 'Compare les mesures avec un autre dataset déjà importé (ex: mois précédent).',
    requiredRoles: ['METRIC'],
    minColumnsNeeded: 1,
  },
];

export function columnsWithRole(columns: DatasetColumnDef[], role: ColumnRole): DatasetColumnDef[] {
  return columns.filter((c) => c.role === role);
}

export function getAvailableFlexibleFunctions(columns: DatasetColumnDef[]): FlexibleFunctionDescriptor[] {
  return FLEXIBLE_FUNCTIONS.filter((fn) =>
    fn.requiredRoles.every((role) => columnsWithRole(columns, role).length >= fn.minColumnsNeeded)
  );
}