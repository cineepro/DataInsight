//api-run-analysis/src/engine/pharmacie/analyzeQueueAndStaffingEfficiency.ts
import type { ScanPharmacie, AnalysisFunction } from '../types';
import { crossCorrelate } from '../common/crossCorrelate';

export const FUNCTION_ID = 'pharmacie.queue_staffing_efficiency';

function dissatisfactionRateByDay(scans: ScanPharmacie[]): Map<number, number> {
  const byDay = new Map<number, ScanPharmacie[]>();
  for (const s of scans) {
    if (!byDay.has(s.day_of_week)) byDay.set(s.day_of_week, []);
    byDay.get(s.day_of_week)!.push(s);
  }

  const rates = new Map<number, number>();
  for (const [day, group] of byDay.entries()) {
    const dissatisfied = group.filter((s) => s.wait_time_bucket === 'GT15').length;
    rates.set(day, group.length > 0 ? dissatisfied / group.length : 0);
  }
  return rates;
}

function staffCountByDay(metrics: Array<{ metric_type: string; date: string; value: string }>): Map<number, number> {
  const staffMetrics = metrics.filter((m) => m.metric_type === 'STAFF_COUNT');
  const byDay = new Map<number, number[]>();

  for (const m of staffMetrics) {
    const day = new Date(m.date).getDay() || 7;
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(Number(m.value));
  }

  const avg = new Map<number, number>();
  for (const [day, values] of byDay.entries()) {
    avg.set(day, values.reduce((a, b) => a + b, 0) / values.length);
  }
  return avg;
}

export const analyzeQueueAndStaffingEfficiency: AnalysisFunction<ScanPharmacie> = (scans, context, t) => {
  const metrics = context.operationalMetrics ?? [];
  const waitRates = dissatisfactionRateByDay(scans);
  const staffCounts = staffCountByDay(metrics);

  const commonDays = [...waitRates.keys()].filter((d) => staffCounts.has(d));
  const waitSeries = commonDays.map((d) => waitRates.get(d)!);
  const staffSeries = commonDays.map((d) => staffCounts.get(d)!);
  const correlation = crossCorrelate(staffSeries, waitSeries);

  const criticalDays = commonDays.filter((d) => (waitRates.get(d) ?? 0) > t.critical_wait_rate);

  return {
    metricName: "Efficacité file d'attente / effectif",
    period: `Semaine ${context.weekNumber} — ${context.year}`,
    status: criticalDays.length > 0 ? 'WARNING' : 'OPTIMAL',
    dataPoints: {
      waitRatesByDay: Object.fromEntries(waitRates),
      staffCountsByDay: Object.fromEntries(staffCounts),
      correlation,
    },
    keyFindings: criticalDays.map(
      (d) => `Jour ${d} : ${((waitRates.get(d) ?? 0) * 100).toFixed(0)}% des clients attendent plus de 15 min`
    ),
  };
};