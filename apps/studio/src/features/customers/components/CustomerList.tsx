// apps/studio/src/features/customers/components/CustomerList.tsx
import type { ChurnAnalysisEntry } from '../../../engine/common/detectChurnRisk';
import Badge from '../../../components/ui/Badge';

interface CustomerListProps {
  entries: ChurnAnalysisEntry[];
  onSelect: (customerId: string) => void;
  selectedId?: string;
}

const RISK_TO_BADGE = {
  ACTIVE: 'OPTIMAL',
  AT_RISK: 'WARNING',
  CHURNED: 'CRITICAL',
} as const;

const RISK_LABEL = {
  ACTIVE: 'Actif',
  AT_RISK: 'À risque',
  CHURNED: 'Perdu',
} as const;

export default function CustomerList({ entries, onSelect, selectedId }: CustomerListProps) {
  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-400">Aucun client identifié pour cette structure.</p>;
  }

  // Les clients à risque ou perdus remontent en premier — ce sont ceux qui nécessitent une action.
  const sorted = [...entries].sort((a, b) => {
    const priority = { CHURNED: 0, AT_RISK: 1, ACTIVE: 2 };
    return priority[a.riskLevel] - priority[b.riskLevel];
  });

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((entry) => (
        <button
          key={entry.customerId}
          onClick={() => onSelect(entry.customerId)}
          className={`flex items-center justify-between rounded-lg border p-3 text-left transition ${
            selectedId === entry.customerId ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          <div>
            <div className="text-sm font-medium text-neutral-900">{entry.displayLabel}</div>
            <div className="text-xs text-neutral-500">
              Vu il y a {entry.daysSinceLastVisit} jour{entry.daysSinceLastVisit > 1 ? 's' : ''}
              {entry.averageIntervalDays !== null && ` — revient tous les ${entry.averageIntervalDays}j habituellement`}
            </div>
          </div>
          <Badge status={RISK_TO_BADGE[entry.riskLevel]} />
        </button>
      ))}
    </div>
  );
}