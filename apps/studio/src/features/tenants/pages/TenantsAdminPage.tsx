//apps/studio/src/features/tenants/pages/TenantsAdminPage.tsx
import { useEffect, useState } from 'react';
import type { Tenant } from '@datainsight/shared';
import { listTenants } from '../../../api/tenants';
import TenantList from '../components/TenantList';
import TenantForm from '../components/TenantForm';
import Button from '../../../components/ui/Button';

export default function TenantsAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTenant, setEditingTenant] = useState<Tenant | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);

  async function refresh() {
    setLoading(true);
    const data = await listTenants();
    setTenants(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleSaved(tenant: Tenant) {
    setShowForm(false);
    setEditingTenant(undefined);
    refresh();
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Structures partenaires</h1>
        <Button
          onClick={() => {
            setEditingTenant(undefined);
            setShowForm(true);
          }}
        >
          + Nouvelle structure
        </Button>
      </div>

      {showForm && (
        <div className="mb-6">
          <TenantForm existingTenant={editingTenant} onSaved={handleSaved} />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-400">Chargement...</p>
      ) : (
        <TenantList
          tenants={tenants}
          selectedId={editingTenant?.$id}
          onSelect={(tenant) => {
            setEditingTenant(tenant);
            setShowForm(true);
          }}
        />
      )}
    </div>
  );
}