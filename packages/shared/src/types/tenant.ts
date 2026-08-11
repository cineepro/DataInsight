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
  client_team_id?: string; // rempli une fois l'accès dashboard provisionné
  subscription_started_at?: string;
  created_at: string;
}

export interface TenantPublicInfo {
  name: string;
  logo_url?: string;
  category: TenantCategory;
}