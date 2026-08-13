// apps/collect/src/features/entreprise/submitEntrepriseScan.ts
import { functions } from '../../api/client';
import { getOrCreateVisitorToken } from '../../utils/visitorToken';
import type { ScanEntreprise } from '@datainsight/shared';

interface SubmitResult {
  success?: boolean;
  error?: string;
}

type ScanEntrepriseInput = Omit<ScanEntreprise,
  'timestamp' | 'year' | 'week_number' | 'day_of_week' | 'customer_id' | 'tenant_id'
>;

export async function submitEntrepriseScan(
  tenantSlug: string,
  input: ScanEntrepriseInput,
  contact?: { phone?: string; name?: string }
): Promise<void> {
  const functionId = import.meta.env.VITE_FUNCTION_SUBMIT_SCAN;

  const execution = await functions.createExecution(
    functionId,
    JSON.stringify({
      tenant_slug: tenantSlug,
      category: 'ENTREPRISE',
      data: input,
      phone: contact?.phone,
      name: contact?.name,
      visitor_token: getOrCreateVisitorToken(),
    }),
    false
  );

  const parsed = JSON.parse(execution.responseBody) as SubmitResult;

  if (execution.responseStatusCode !== 200 || !parsed.success) {
    throw new Error(parsed.error ?? "Erreur lors de l'envoi.");
  }
}