//apps/collect/src/features/restaurant/submitRestaurantScan.ts
import { functions } from '../../api/client';
import type { ScanRestaurant } from '@datainsight/shared';

interface SubmitResult {
  success?: boolean;
  error?: string;
}

type ScanRestaurantInput = Omit<ScanRestaurant,
  'timestamp' | 'year' | 'week_number' | 'day_of_week' | 'customer_id' | 'tenant_id'
>;

export async function submitRestaurantScan(
  tenantSlug: string,
  input: ScanRestaurantInput,
  contact?: { phone?: string; name?: string }
): Promise<void> {
  const functionId = import.meta.env.VITE_FUNCTION_SUBMIT_SCAN;

  const execution = await functions.createExecution(
    functionId,
    JSON.stringify({
      tenant_slug: tenantSlug,
      category: 'RESTAURANT',
      data: input,
      phone: contact?.phone,
      name: contact?.name,
    }),
    false
  );

  const parsed = JSON.parse(execution.responseBody) as SubmitResult;

  if (execution.responseStatusCode !== 200 || !parsed.success) {
    throw new Error(parsed.error ?? "Erreur lors de l'envoi.");
  }
}