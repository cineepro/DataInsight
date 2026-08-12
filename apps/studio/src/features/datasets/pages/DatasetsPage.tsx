//apps/studio/src/features/datasets/pages/DatasetsPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Tenant, TenantCategory } from '@datainsight/shared';
import { listTenants } from '../../../api/tenants';
import { listDatasetsForTenant, type Dataset } from '../../../api/datasets';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import DatasetList from '../components/DatasetList';
import DatasetUploadForm from '../components/DatasetUploadForm';

const CATEGORY_OPTIONS = [
  { label: 'Restauration', value: 'RESTAURANT' },
  { label: 'Fast-food', value: 'FASTFOOD' },
  { label: 'Pharmacie', value: 'PHARMACIE' },
  { label: 'Entreprise', value: 'ENTREPRISE' },
];

export default function DatasetsPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<TenantCategory | ''>('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (!category) {
      setTenants([]);
      return;
    }
    listTenants(category).then(setTenants);
  }, [category]);

  const selectedTenant = tenants.find((t) => t.$id === tenantId);

  useEffect(() => {
    if (!selectedTenant) {
      setDatasets([]);
      return;
    }
    setLoading(true);
    listDatasetsForTenant(selectedTenant.slug).then((data) => {
      setDatasets(data);
      setLoading(false);
    });
  }, [selectedTenant]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Données brutes</span>
          <h1 className="font-display text-2xl font-medium text-ink">Datasets importés</h1>
        </div>
        <Button onClick={() => setShowUpload(true)}>+ Importer un fichier</Button>
      </div>

      {showUpload ? (
        <div className="mb-6">
          <DatasetUploadForm onCancel={() => setShowUpload(false)} />
        </div>
      ) : (
        <>
          <div className="mb-6 flex gap-3">
            <div className="flex-1">
              <Select
                label="Catégorie"
                value={category}
                onChange={(v) => {
                  setCategory(v as TenantCategory);
                  setTenantId('');
                }}
                options={CATEGORY_OPTIONS}
                placeholder="Choisir une catégorie"
              />
            </div>
            <div className="flex-1">
              <Select
                label="Structure"
                value={tenantId}
                onChange={setTenantId}
                options={tenants.map((t) => ({ label: t.name, value: t.$id }))}
                placeholder="Choisir une structure"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-neutral-400">Chargement...</p>
          ) : selectedTenant ? (
            <DatasetList datasets={datasets} onSelect={(d) => navigate(`/datasets/${d.$id}`)} />
          ) : (
            <p className="text-sm text-neutral-400">Choisissez une structure pour voir ses datasets.</p>
          )}
        </>
      )}
    </div>
  );
}