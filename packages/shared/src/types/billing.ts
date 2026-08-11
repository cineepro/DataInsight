//packages/shared/src/types/billing.ts
export type SubscriptionPlan = 'STANDARD' | 'PREMIUM';
export type PaymentStatus = 'TRIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentProvider = 'FEDAPAY' | 'KKIAPAY' | 'MANUAL';
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface Subscription {
  $id: string;
  tenant_id: string;
  plan: SubscriptionPlan;
  monthly_amount: number;
  trial_start_date: string;
  trial_end_date: string;
  payment_status: PaymentStatus;
  last_payment_date?: string;
  next_due_date?: string;
  payment_provider?: PaymentProvider;
}

export interface PaymentTransaction {
  $id: string;
  tenant_id: string;
  subscription_id: string;
  amount: number;
  provider: PaymentProvider;
  provider_transaction_id?: string;
  status: TransactionStatus;
  created_at: string;
}