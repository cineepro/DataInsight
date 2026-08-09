// apps/studio/src/engine/common/crossCorrelate.ts
export interface CorrelationResult {
  coefficient: number; // -1 à 1 (Pearson)
  sampleSize: number;
  strength: 'FAIBLE' | 'MODEREE' | 'FORTE';
}

/**
 * Brique générique : calcule la corrélation de Pearson entre deux séries
 * numériques de même longueur (ex: temps d'attente vs satisfaction).
 */
export function crossCorrelate(seriesA: number[], seriesB: number[]): CorrelationResult {
  const n = Math.min(seriesA.length, seriesB.length);
  if (n < 2) return { coefficient: 0, sampleSize: n, strength: 'FAIBLE' };

  const a = seriesA.slice(0, n);
  const b = seriesB.slice(0, n);
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;

  let numerator = 0;
  let denomA = 0;
  let denomB = 0;

  for (let i = 0; i < n; i++) {
    const diffA = a[i] - meanA;
    const diffB = b[i] - meanB;
    numerator += diffA * diffB;
    denomA += diffA * diffA;
    denomB += diffB * diffB;
  }

  const coefficient = denomA === 0 || denomB === 0 ? 0 : numerator / Math.sqrt(denomA * denomB);
  const abs = Math.abs(coefficient);
  const strength: CorrelationResult['strength'] = abs >= 0.6 ? 'FORTE' : abs >= 0.3 ? 'MODEREE' : 'FAIBLE';

  return { coefficient: Number(coefficient.toFixed(2)), sampleSize: n, strength };
}