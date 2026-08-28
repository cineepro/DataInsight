//apps/studio/src/engine/thresholds.ts
import { getThresholdConfig } from '../api/thresholds';
import { defaultsFor } from './thresholdRegistry';

const cache = new Map<string, Record<string, number>>();

/**
 * Reste dans apps/studio (pas dans @datainsight/engine) car cette fonction
 * est précisément celle qui dépend du SDK Appwrite client — c'est le point
 * de séparation voulu par le refactor. Le résultat qu'elle produit est un
 * simple Record<string, number>, ensuite transmis en paramètre aux
 * fonctions pures du package partagé.
 */
export async function getThresholds(functionId: string): Promise<Record<string, number>> {
  if (cache.has(functionId)) {
    return cache.get(functionId)!;
  }

  const defaults = defaultsFor(functionId);

  try {
    const stored = await getThresholdConfig(functionId);
    if (!stored) {
      cache.set(functionId, defaults);
      return defaults;
    }

    const parsed = JSON.parse(stored.config) as Record<string, number>;
    const merged = { ...defaults, ...parsed };
    cache.set(functionId, merged);
    return merged;
  } catch {
    cache.set(functionId, defaults);
    return defaults;
  }
}

export function clearThresholdsCache(): void {
  cache.clear();
}