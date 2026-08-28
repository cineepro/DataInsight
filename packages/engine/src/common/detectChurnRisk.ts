//packages/engine/src/common/detectChurnRisk.ts
import type { Customer } from '../types';

export interface ChurnAnalysisEntry {
  customerId: string;
  displayLabel: string;
  daysSinceLastVisit: number;
  averageIntervalDays: number | null;
  riskLevel: 'ACTIVE' | 'AT_RISK' | 'CHURNED';
}

const CHURNED_ABSOLUTE_DAYS = 60;

function daysBetween(a: Date, b: Date): number {
  return Math.round(Math.abs(a.getTime() - b.getTime()) / 86400000);
}

export function detectChurnRisk(
  customers: Customer[],
  thresholds: Record<string, number>,
  now: Date = new Date()
): ChurnAnalysisEntry[] {
  return customers.map((customer) => {
    const lastSeen = new Date(customer.last_seen);
    const firstSeen = new Date(customer.first_seen);
    const daysSinceLastVisit = daysBetween(now, lastSeen);

    const totalSpanDays = daysBetween(firstSeen, lastSeen);
    const averageIntervalDays =
      customer.visit_count >= 2 ? Math.max(1, Math.round(totalSpanDays / (customer.visit_count - 1))) : null;

    let riskLevel: ChurnAnalysisEntry['riskLevel'] = 'ACTIVE';

    if (averageIntervalDays !== null) {
      if (daysSinceLastVisit >= averageIntervalDays * thresholds.churned_multiplier) {
        riskLevel = 'CHURNED';
      } else if (daysSinceLastVisit >= averageIntervalDays * thresholds.at_risk_multiplier) {
        riskLevel = 'AT_RISK';
      }
    } else if (daysSinceLastVisit >= CHURNED_ABSOLUTE_DAYS) {
      riskLevel = 'CHURNED';
    }

    const displayLabel = customer.name?.trim() || customer.phone || `Client anonyme #${customer.$id.slice(-4)}`;

    return { customerId: customer.$id, displayLabel, daysSinceLastVisit, averageIntervalDays, riskLevel };
  });
}