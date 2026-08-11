export type CustomerStatus = 'ACTIVE' | 'AT_RISK' | 'CHURNED';

export interface Customer {
  $id: string;
  tenant_id: string;
  phone?: string;
  name?: string;
  visitor_hash: string;
  first_seen: string;
  last_seen: string;
  visit_count: number;
  status: CustomerStatus;
}