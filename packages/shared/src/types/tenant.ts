//packages/shared/src/types/tenant.ts
export type TenantCategory = 'RESTAURANT' | 'FASTFOOD' | 'PHARMACIE' | 'ENTREPRISE';
export type TenantStatus = 'PILOT' | 'ACTIVE' | 'SUSPENDED';

export interface Tenant {
  $id: string;
  slug: string;
  name: string;
  category: TenantCategory;
  logo_url?: string;
  address?: string;
  phone?: string;
  contact_email?: string;
  status: TenantStatus;
  subscription_started_at?: string;
  created_at: string;
}

/**
 * Sous-ensemble renvoyé par la Function get-tenant-public-info
 * à l'app collect. Ne contient jamais les infos sensibles du tenant.
 */
export interface TenantPublicInfo {
  name: string;
  logo_url?: string;
  category: TenantCategory;
}