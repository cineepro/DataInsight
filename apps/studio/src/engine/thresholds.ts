// apps/studio/src/engine/thresholds.ts
import { getThresholdConfig } from '../api/thresholds';
import { defaultsFor } from './thresholdRegistry';

const cache = new Map<string, Record<string, number>>();

/**
 * Récupère les seuils effectifs d'une fonction : ceux configurés dans
 * Appwrite fusionnés par-dessus les valeurs par défaut du registre. Mis en
 * cache en mémoire pour la durée de la session — évite un aller-retour
 * réseau à chaque fonction lancée dans un même passage d'analyse.
 * Le cache se réinitialise à chaque rechargement de page, donc une
 * modification faite dans ThresholdsPage sera prise en compte à la
 * prochaine analyse après un rafraîchissement.
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
    // Toute erreur réseau ou de parsing retombe silencieusement sur les
    // défauts — une analyse ne doit jamais échouer à cause d'un problème
    // de configuration de seuils.
    cache.set(functionId, defaults);
    return defaults;
  }
}

export function clearThresholdsCache(): void {
  cache.clear();
}