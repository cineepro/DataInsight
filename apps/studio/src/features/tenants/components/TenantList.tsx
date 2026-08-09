//apps/studio/src/features/tenants/components/TenantList.tsx
import type { Tenant } from '@datainsight/shared';
import Badge from '../../../components/ui/Badge';

interface TenantListProps {
  tenants: Tenant[];
  onSelect: (tenant: Tenant) => void;
  selectedId?: string;
}

export default function TenantList({ tenants, onSelect, selectedId }: TenantListProps) {
  if (tenants.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-400">Aucune structure enregistrée.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {tenants.map((tenant) => (
        <button
          key={tenant.$id}
          onClick={() => onSelect(tenant)}
          className={`flex items-center justify-between rounded-lg border p-3 text-left transition ${
            selectedId === tenant.$id ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          <div>
            <div className="text-sm font-medium text-neutral-900">{tenant.name}</div>
            <div className="text-xs text-neutral-500">{tenant.category} — {tenant.slug}</div>
          </div>
          <Badge status={tenant.status === 'ACTIVE' ? 'OPTIMAL' : tenant.status === 'PILOT' ? 'WARNING' : 'CRITICAL'} />
        </button>
      ))}
    </div>
  );
}