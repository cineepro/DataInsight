// apps/studio/src/features/customers/components/CustomerDetailCard.tsx
import type { Customer } from '@datainsight/shared';
import type { ChurnAnalysisEntry } from '../../../engine/common/detectChurnRisk';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

interface CustomerDetailCardProps {
  customer: Customer;
  analysis: ChurnAnalysisEntry;
}

const RISK_TO_BADGE = {
  ACTIVE: 'OPTIMAL',
  AT_RISK: 'WARNING',
  CHURNED: 'CRITICAL',
} as const;

export default function CustomerDetailCard({ customer, analysis }: CustomerDetailCardProps) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-neutral-900">{analysis.displayLabel}</h3>
        <Badge status={RISK_TO_BADGE[analysis.riskLevel]} />
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-neutral-500">Téléphone</dt>
          <dd className="text-neutral-900">{customer.phone ?? 'Non renseigné'}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Nombre de visites</dt>
          <dd className="text-neutral-900">{customer.visit_count}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Première visite</dt>
          <dd className="text-neutral-900">{new Date(customer.first_seen).toLocaleDateString('fr-FR')}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Dernière visite</dt>
          <dd className="text-neutral-900">{new Date(customer.last_seen).toLocaleDateString('fr-FR')}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Intervalle habituel</dt>
          <dd className="text-neutral-900">
            {analysis.averageIntervalDays !== null ? `${analysis.averageIntervalDays} jours` : 'Pas assez de visites'}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500">Silence actuel</dt>
          <dd className="text-neutral-900">{analysis.daysSinceLastVisit} jours</dd>
        </div>
      </dl>

      {!customer.phone && !customer.name && (
        <p className="mt-4 text-xs text-neutral-400">
          Client identifié uniquement par empreinte technique — aucune donnée personnelle fournie.
        </p>
      )}
    </Card>
  );
}