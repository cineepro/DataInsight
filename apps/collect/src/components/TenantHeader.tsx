// apps/collect/src/components/TenantHeader.tsx
import type { TenantPublicInfo } from '@datainsight/shared';

interface TenantHeaderProps {
  tenant: TenantPublicInfo;
}

export default function TenantHeader({ tenant }: TenantHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-6">
      {tenant.logo_url ? (
        <img
          src={tenant.logo_url}
          alt={tenant.name}
          className="h-16 w-16 rounded-full object-cover shadow-sm"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-xl font-bold text-white">
          {tenant.name.charAt(0)}
        </div>
      )}
      <h1 className="text-lg font-semibold text-neutral-900">{tenant.name}</h1>
      <p className="text-sm text-neutral-500">Votre avis nous aide à mieux vous servir</p>
    </div>
  );
}