//apps/client-dashboard/src/api/statistics.ts
import { functions } from './appwrite';
import type { TenantStatistics } from '@datainsight/shared';

interface StatisticsResponse extends TenantStatistics {
  error?: string;
}

/**
 * Identique à la version studio — la Function elle-même vérifie que ce
 * compte (gérant) a bien le droit de voir CE tenant précis. Le front-end
 * n'a rien de spécial à faire pour prouver son identité, juste être connecté.
 */
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