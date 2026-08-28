//packages/engine/src/types.ts
// Types redéfinis localement (pas importés depuis @datainsight/shared) pour
// garder ce package totalement autonome — aucune dépendance, même
// type-only, vers un module qui pourrait un jour tirer du code lié à Vite
// ou au SDK client Appwrite. Ce package doit pouvoir tourner tel quel dans
// un navigateur ET dans une Appwrite Function Node, sans rien de spécifique
// à l'un ou l'autre environnement.

export interface AnalysisResult {
  metricName: string;
  period: string;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  dataPoints: Record<string, unknown>;
  keyFindings: string[];
}

export interface AnalysisFunctionContext<TScan = unknown> {
  tenantId: string;
  year: number;
  weekNumber: number;
  previousPeriodScans?: TScan[];
  operationalMetrics?: Array<{ metric_type: string; date: string; value: string }>;
}

/**
 * Signature centrale du refactor : `thresholds` est désormais un
 * paramètre explicite, fourni par l'appelant, plutôt qu'une valeur allée
 * chercher par la fonction elle-même. Les fonctions redeviennent
 * synchrones — plus besoin de Promise ni d'await pour les exécuter.
 */
export type AnalysisFunction<TScan> = (
  scans: TScan[],
  context: AnalysisFunctionContext<TScan>,
  thresholds: Record<string, number>
) => AnalysisResult;

export interface AnalysisFunctionDescriptor<TScan> {
  id: string;
  label: string;
  description: string;
  run: AnalysisFunction<TScan>;
}

// ---- Types de scans (copie locale, structurellement identique à
// @datainsight/shared — dupliquée volontairement pour la même raison
// d'autonomie totale du package) ----

export type ZoneRestaurant = 'TERRASSE' | 'VIP' | 'SALLE' | 'EMPORTER';
export type WaitTimeBucketRestaurant = 'LT15' | '15_30' | 'GT30';
export type VisitTypeRestaurant = 'SOLO' | 'DEJEUNER_PRO' | 'FAMILLE' | 'AMIS';
export type VisitFrequency = 'PREMIERE_FOIS' | 'OCCASIONNEL' | 'REGULIER';

export interface ScanRestaurant {
  $id?: string;
  tenant_id: string;
  customer_id?: string;
  timestamp: string;
  year: number;
  week_number: number;
  day_of_week: number;
  comment?: string;
  zone?: ZoneRestaurant;
  satisfaction_global: number;
  satisfaction_plat?: number;
  wait_time_bucket: WaitTimeBucketRestaurant;
  service_quality?: number;
  visit_type?: VisitTypeRestaurant;
  products?: string[];
  visit_frequency?: VisitFrequency;
}

export type WaitTimeBucketPharmacie = 'LT5' | '5_15' | 'GT15';
export type VisitReasonPharmacie = 'ORDONNANCE' | 'PARAPHARMACIE' | 'DEPANNAGE' | 'CONSEIL';
export type ProductAvailability = 'COMPLET' | 'PARTIEL' | 'RUPTURE';

export interface ScanPharmacie {
  $id?: string;
  tenant_id: string;
  customer_id?: string;
  timestamp: string;
  year: number;
  week_number: number;
  day_of_week: number;
  comment?: string;
  visit_reason: VisitReasonPharmacie;
  wait_time_bucket: WaitTimeBucketPharmacie;
  reception_quality?: number;
  product_availability: ProductAvailability;
  missing_product?: string;
}

export interface ScanEntreprise {
  $id?: string;
  tenant_id: string;
  customer_id?: string;
  timestamp: string;
  year: number;
  week_number: number;
  day_of_week: number;
  comment?: string;
  interaction_type: string;
  satisfaction_global?: number;
  payload?: string;
}

export interface Customer {
  $id: string;
  tenant_id: string;
  phone?: string;
  name?: string;
  visitor_hash: string;
  first_seen: string;
  last_seen: string;
  visit_count: number;
  status: 'ACTIVE' | 'AT_RISK' | 'CHURNED';
}