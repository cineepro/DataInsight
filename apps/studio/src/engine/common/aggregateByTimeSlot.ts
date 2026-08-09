// apps/studio/src/engine/common/aggregateByTimeSlot.ts
export interface TimeSlotStat {
  hour: number; // 0-23
  count: number;
  avgSatisfaction: number | null;
  dissatisfactionRate: number; // 0 à 1
}

/**
 * Brique générique : regroupe n'importe quel tableau de scans par heure
 * (extraite de `timestamp`), calcule la satisfaction moyenne et le taux
 * d'insatisfaction selon les règles fournies par l'appelant.
 */
export function aggregateByTimeSlot<T extends { timestamp: string }>(
  scans: T[],
  options: {
    getSatisfaction: (scan: T) => number | undefined;
    isDissatisfied: (scan: T) => boolean;
  }
): TimeSlotStat[] {
  const buckets = new Map<number, T[]>();

  for (const scan of scans) {
    const hour = new Date(scan.timestamp).getHours();
    if (!buckets.has(hour)) buckets.set(hour, []);
    buckets.get(hour)!.push(scan);
  }

  const result: TimeSlotStat[] = [];

  for (const [hour, group] of buckets.entries()) {
    const satisfactions = group.map(options.getSatisfaction).filter((v): v is number => v !== undefined);
    const avgSatisfaction =
      satisfactions.length > 0 ? satisfactions.reduce((a, b) => a + b, 0) / satisfactions.length : null;
    const dissatisfiedCount = group.filter(options.isDissatisfied).length;

    result.push({
      hour,
      count: group.length,
      avgSatisfaction: avgSatisfaction !== null ? Number(avgSatisfaction.toFixed(2)) : null,
      dissatisfactionRate: group.length > 0 ? dissatisfiedCount / group.length : 0,
    });
  }

  return result.sort((a, b) => a.hour - b.hour);
}