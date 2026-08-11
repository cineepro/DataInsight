// apps/studio/src/engine/common/detectChurnRisk.ts
import type { Customer } from '@datainsight/shared';

export interface ChurnAnalysisEntry {
  customerId: string;
  displayLabel: string; // nom si connu, sinon "Client anonyme #xxxx"
  daysSinceLastVisit: number;
  averageIntervalDays: number | null; // intervalle moyen habituel entre 2 visites de ce client
  riskLevel: 'ACTIVE' | 'AT_RISK' | 'CHURNED';
}

const AT_RISK_MULTIPLIER = 2; // silence > 2x son intervalle habituel = à risque
const CHURNED_MULTIPLIER = 4; // silence > 4x son intervalle habituel = perdu
const CHURNED_ABSOLUTE_DAYS = 60; // filet de sécurité pour les clients vus une seule fois

function daysBetween(a: Date, b: Date): number {
  return Math.round(Math.abs(a.getTime() - b.getTime()) / 86400000);
}

/**
 * Calcule le statut de fidélité de chaque client d'un tenant à partir de
 * son historique (first_seen, last_seen, visit_count). Ne modifie rien en
 * base — l'appelant (StudioPage ou CustomersPage) décide s'il faut
 * persister le nouveau statut via updateCustomerStatus().
 */
export function detectChurnRisk(customers: Customer[], now: Date = new Date()): ChurnAnalysisEntry[] {
  return customers.map((customer) => {
    const lastSeen = new Date(customer.last_seen);
    const firstSeen = new Date(customer.first_seen);
    const daysSinceLastVisit = daysBetween(now, lastSeen);

    // Intervalle moyen habituel = durée totale connue / nombre d'intervalles entre visites.
    // Nécessite au moins 2 visites pour être significatif.
    const totalSpanDays = daysBetween(firstSeen, lastSeen);
    const averageIntervalDays =
      customer.visit_count >= 2 ? Math.max(1, Math.round(totalSpanDays / (customer.visit_count - 1))) : null;

    let riskLevel: ChurnAnalysisEntry['riskLevel'] = 'ACTIVE';

    if (averageIntervalDays !== null) {
      if (daysSinceLastVisit >= averageIntervalDays * CHURNED_MULTIPLIER) {
        riskLevel = 'CHURNED';
      } else if (daysSinceLastVisit >= averageIntervalDays * AT_RISK_MULTIPLIER) {
        riskLevel = 'AT_RISK';
      }
    } else if (daysSinceLastVisit >= CHURNED_ABSOLUTE_DAYS) {
      // Client vu une seule fois, jamais revenu depuis longtemps
      riskLevel = 'CHURNED';
    }

    const displayLabel = customer.name?.trim() || customer.phone || `Client anonyme #${customer.$id.slice(-4)}`;

    return {
      customerId: customer.$id,
      displayLabel,
      daysSinceLastVisit,
      averageIntervalDays,
      riskLevel,
    };
  });
}