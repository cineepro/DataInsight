//apps/studio/src/engine/pharmacie/detectStockoutImpact.ts
import type { ScanPharmacie } from '@datainsight/shared';
import type { AnalysisFunction } from '../types';

export const detectStockoutImpact: AnalysisFunction<ScanPharmacie> = (scans, context) => {
  const total = scans.length;
  const stockouts = scans.filter((s) => s.product_availability === 'RUPTURE');
  const partial = scans.filter((s) => s.product_availability === 'PARTIEL');

  const missingProductCounts = new Map<string, number>();
  for (const s of [...stockouts, ...partial]) {
    if (!s.missing_product) continue;
    missingProductCounts.set(s.missing_product, (missingProductCounts.get(s.missing_product) ?? 0) + 1);
  }

  const topMissing = [...missingProductCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([product, count]) => ({ product, count }));

  const stockoutRate = total > 0 ? stockouts.length / total : 0;

  return {
    metricName: 'Impact des ruptures de stock',
    period: `Semaine ${context.weekNumber} — ${context.year}`,
    status: stockoutRate > 0.15 ? 'CRITICAL' : stockoutRate > 0.05 ? 'WARNING' : 'OPTIMAL',
    dataPoints: { stockoutRate: Number((stockoutRate * 100).toFixed(1)), topMissing, totalScans: total },
    keyFindings: topMissing.map((p) => `"${p.product}" signalé en rupture/partiel ${p.count} fois cette semaine`),
  };
};