//apps/studio/src/features/studio/components/StructureSelector.tsx
import { useEffect, useState } from 'react';
import type { Tenant, TenantCategory } from '@datainsight/shared';
import { listTenants } from '../../../api/tenants';
import Select from '../../../components/ui/Select';

const CATEGORY_OPTIONS = [
  { label: 'Restauration', value: 'RESTAURANT' },
  { label: 'Fast-food', value: 'FASTFOOD' },
  { label: 'Pharmacie', value: 'PHARMACIE' },
  { label: 'Entreprise', value: 'ENTREPRISE' },
];

interface StructureSelectorProps {
  category: TenantCategory | '';
  tenantId: string;
  onCategoryChange: (category: TenantCategory) => void;
  onTenantChange: (tenant: Tenant) => void;
}

// Étape 1 : on choisit d'abord la catégorie, puis la structure précise.
// Cette sélection détermine ensuite quelle collection scans_* interroger
// et quelles fonctions d'analyse proposer (voir engine/registry.ts).
export default function StructureSelector({
  category,
  tenantId,
  onCategoryChange,
  onTenantChange,
}: StructureSelectorProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category) {
      setTenants([]);
      return;
    }
    setLoading(true);
    listTenants(category).then((data) => {
      setTenants(data);
      setLoading(false);
    });
  }, [category]);

  return (
    <div className="flex flex-col gap-3">
      <Select
        label="1. Catégorie"
        value={category}
        onChange={(v) => onCategoryChange(v as TenantCategory)}
        options={CATEGORY_OPTIONS}
        placeholder="Choisir une catégorie"
      />

      <Select
        label="1. Structure"
        value={tenantId}
        onChange={(v) => {
          const tenant = tenants.find((t) => t.$id === v);
          if (tenant) onTenantChange(tenant);
        }}
        options={tenants.map((t) => ({ label: t.name, value: t.$id }))}
        placeholder={loading ? 'Chargement...' : 'Choisir une structure'}
      />
    </div>
  );
}