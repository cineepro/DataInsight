//apps/collect/src/features/pharmacie/submitPharmacieScan.ts
import { functions } from '../../api/client';
import type { ScanPharmacie } from '@datainsight/shared';

interface SubmitResult {
  success?: boolean;
  error?: string;
}

type ScanPharmacieInput = Omit<ScanPharmacie,
  'timestamp' | 'year' | 'week_number' | 'day_of_week' | 'customer_id' | 'tenant_id'
>;

export async function submitPharmacieScan(
  tenantSlug: string,
  input: ScanPharmacieInput,
  contact?: { phone?: string; name?: string }
): Promise<void> {
  const functionId = import.meta.env.VITE_FUNCTION_SUBMIT_SCAN;

  const execution = await functions.createExecution(
    functionId,
    JSON.stringify({
      tenant_slug: tenantSlug,
      category: 'PHARMACIE',
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