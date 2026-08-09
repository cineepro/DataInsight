//apps/studio/src/engine/common/detectAnomalies.ts
export interface AnomalyPoint<T> {
  item: T;
  value: number;
  deviation: number; // écart-type par rapport à la moyenne
}

/**
 * Brique générique : détecte les valeurs qui s'écartent de plus de
 * `stdDevThreshold` écarts-types de la moyenne (défaut: 2 = anomalie notable).
 */
export function detectAnomalies<T>(
  items: T[],
  getValue: (item: T) => number,
  stdDevThreshold = 2
): AnomalyPoint<T>[] {
  if (items.length === 0) return [];

  const values = items.map(getValue);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return [];

  const anomalies: AnomalyPoint<T>[] = [];

  items.forEach((item, i) => {
    const value = values[i];
    const deviation = (value - mean) / stdDev;
    if (Math.abs(deviation) >= stdDevThreshold) {
      anomalies.push({ item, value, deviation: Number(deviation.toFixed(2)) });
    }
  });

  return anomalies;
}