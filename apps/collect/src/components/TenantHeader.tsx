//apps/collect/src/components/TenantHeader.tsx
import type { TenantPublicInfo } from '@datainsight/shared';

interface TenantHeaderProps {
  tenant: TenantPublicInfo;
}

export default function TenantHeader({ tenant }: TenantHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-3 pb-5 pt-2 text-center">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-marigold-600">Votre avis</span>

      {tenant.logo_url ? (
        <img src={tenant.logo_url} alt={tenant.name} className="h-14 w-14 rounded-full object-cover" />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-lg font-semibold text-white">
          {tenant.name.charAt(0)}
        </div>
      )}

      <h1 className="font-display text-2xl font-medium text-ink">{tenant.name}</h1>
      <p className="text-sm text-neutral-500">Ça prend 30 secondes, ça nous aide beaucoup.</p>
    </div>
  );
}