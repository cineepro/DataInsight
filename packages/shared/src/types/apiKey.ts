//packages/shared/src/types/apiKey.ts
export type ApiProductScope = 'ASTRA_API' | 'ANALYSIS_ENGINE_API' | 'BOTH';
export type ApiTier = 'TRIAL' | 'STARTER' | 'PRO';
export type ApiKeyStatus = 'ACTIVE' | 'SUSPENDED' | 'REVOKED';

export interface ApiKey {
  $id: string;
  key_prefix: string;
  key_hash: string;
  owner_name: string;
  owner_email: string;
  product_scope: ApiProductScope;
  tier: ApiTier;
  monthly_quota: number;
  requests_used: number;
  period_reset_at: string;
  status: ApiKeyStatus;
  created_at: string;
}