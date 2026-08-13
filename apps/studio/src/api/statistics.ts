//apps/studio/src/api/statistics.ts
import { functions } from './appwrite';
import type { TenantStatistics } from '@datainsight/shared';

interface StatisticsResponse extends TenantStatistics {
  error?: string;
}

export async function getTenantStatistics(
  tenantSlug: string,
  blockStartYear: number,
  blockStartWeek: number
): Promise<TenantStatistics> {
  const functionId = import.meta.env.VITE_FUNCTION_GET_TENANT_STATISTICS;

  const execution = await functions.createExecution(
    functionId,
    JSON.stringify({
      tenant_slug: tenantSlug,
      block_start_year: blockStartYear,
      block_start_week: blockStartWeek,
    }),
    false
  );

  const parsed = JSON.parse(execution.responseBody) as StatisticsResponse;

  if (execution.responseStatusCode !== 200 || parsed.error) {
    throw new Error(parsed.error ?? 'Erreur lors du chargement des statistiques.');
  }

  return parsed;
}