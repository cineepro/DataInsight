//packages/engine/src/flexible/registry.ts
import type { DatasetColumnDef, ColumnRole } from './types';

export type FlexibleFunctionId =
  | 'aggregate_by_dimension'
  | 'top_n_by_dimension'
  | 'cross_correlate_columns'
  | 'detect_anomalies'
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