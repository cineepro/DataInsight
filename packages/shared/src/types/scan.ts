//packages/shared/src/types/scan.ts
// ---------- Champs communs à tous les scans ----------
export interface ScanBase {
  $id?: string;
  tenant_id: string;
  customer_id?: string; // Rempli par la Function submit-scan, jamais par le client directement
  timestamp: string;
  year: number;
  week_number: number;
  day_of_week: number; // 1 = Lundi ... 7 = Dimanche
  comment?: string;
}

// ---------- Restaurant ----------
export type ZoneRestaurant = 'TERRASSE' | 'VIP' | 'SALLE' | 'EMPORTER';
export type WaitTimeBucketRestaurant = 'LT15' | '15_30' | 'GT30';
export type VisitTypeRestaurant = 'SOLO' | 'DEJEUNER_PRO' | 'FAMILLE' | 'AMIS';
export type VisitFrequency = 'PREMIERE_FOIS' | 'OCCASIONNEL' | 'REGULIER';

export interface ScanRestaurant extends ScanBase {
  zone?: ZoneRestaurant;
  satisfaction_global: number; // 1-5
  satisfaction_plat?: number; // 1-5
  wait_time_bucket: WaitTimeBucketRestaurant;
  service_quality?: number; // 1-5
  visit_type?: VisitTypeRestaurant;
  products?: string[];
  visit_frequency?: VisitFrequency;
}

// ---------- Pharmacie ----------
export type WaitTimeBucketPharmacie = 'LT5' | '5_15' | 'GT15';
export type VisitReasonPharmacie = 'ORDONNANCE' | 'PARAPHARMACIE' | 'DEPANNAGE' | 'CONSEIL';
export type ProductAvailability = 'COMPLET' | 'PARTIEL' | 'RUPTURE';

export interface ScanPharmacie extends ScanBase {
  visit_reason: VisitReasonPharmacie;
  wait_time_bucket: WaitTimeBucketPharmacie;
  reception_quality?: number; // 1-5
  product_availability: ProductAvailability;
  missing_product?: string;
}

// ---------- Entreprise (générique) ----------
export interface ScanEntreprise extends ScanBase {
  interaction_type: string;
  satisfaction_global?: number; // 1-5
  payload?: string;
}

export type ScanCategory = 'RESTAURANT' | 'PHARMACIE' | 'ENTREPRISE';
export type AnyScan = ScanRestaurant | ScanPharmacie | ScanEntreprise;