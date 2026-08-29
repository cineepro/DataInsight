//api-run-analysis/src/engine/restaurant/calculateMenuSatisfactionMatrix.ts
import type { ScanRestaurant, AnalysisFunction } from '../types';

export const FUNCTION_ID = 'restaurant.menu_satisfaction_matrix';

interface ProductStat {
  product: string;
  orderCount: number;
  avgSatisfaction: number;
  category: 'GAGNANT' | 'ETOILE_FILANTE' | 'A_CORRIGER' | 'PLAT_MORT';
}

export const calculateMenuSatisfactionMatrix: AnalysisFunction<ScanRestaurant> = (scans, context, t) => {
  const productMap = new Map<string, { count: number; satisfactionSum: number }>();

  for (const scan of scans) {
    if (!scan.products) continue;
    for (const product of scan.products) {
      const entry = productMap.get(product) ?? { count: 0, satisfactionSum: 0 };
      entry.count += 1;
      entry.satisfactionSum += scan.satisfaction_plat ?? scan.satisfaction_global;
      productMap.set(product, entry);
    }
  }

  const counts = [...productMap.values()].map((v) => v.count).sort((a, b) => a - b);
  const medianCount = counts.length > 0 ? counts[Math.floor(counts.length / 2)] : 0;

  const stats: ProductStat[] = [];

  for (const [product, entry] of productMap.entries()) {
    const avgSatisfaction = entry.satisfactionSum / entry.count;
    const highVolume = entry.count >= medianCount;
    const highSatisfaction = avgSatisfaction >= t.high_satisfaction_threshold;

    let category: ProductStat['category'];
    if (highVolume && highSatisfaction) category = 'GAGNANT';
    else if (!highVolume && highSatisfaction) category = 'ETOILE_FILANTE';
    else if (highVolume && !highSatisfaction) category = 'A_CORRIGER';
    else category = 'PLAT_MORT';

    stats.push({ product, orderCount: entry.count, avgSatisfaction: Number(avgSatisfaction.toFixed(2)), category });
  }

  const toFix = stats.filter((s) => s.category === 'A_CORRIGER');

  return {
    metricName: 'Matrice de satisfaction du menu',
    period: `Semaine ${context.weekNumber} — ${context.year}`,
    status: toFix.length > 0 ? 'WARNING' : 'OPTIMAL',
    dataPoints: { stats },
    keyFindings: toFix.map(
      (s) => `"${s.product}" : très commandé (${s.orderCount}x) mais mal noté (${s.avgSatisfaction}/5) — à corriger`
    ),
  };
};