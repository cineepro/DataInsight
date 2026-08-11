//apps/studio/src/features/tenants/components/TenantForm.tsx
import { useState } from 'react';
import type { Tenant, TenantCategory, TenantStatus } from '@datainsight/shared';
import { createTenant, updateTenant } from '../../../api/tenants';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import ProvisionAccessButton from './ProvisionAccessButton';

const CATEGORY_OPTIONS = [
  { label: 'Restaurant', value: 'RESTAURANT' },
  { label: 'Fast-food', value: 'FASTFOOD' },
  { label: 'Pharmacie', value: 'PHARMACIE' },
  { label: 'Entreprise', value: 'ENTREPRISE' },
];

const STATUS_OPTIONS = [
  { label: 'Pilote (test gratuit)', value: 'PILOT' },
  { label: 'Actif (abonné)', value: 'ACTIVE' },
  { label: 'Suspendu', value: 'SUSPENDED' },
];

// Préfixe du slug par catégorie -> détermine aussi la route du formulaire collect (/r, /p, /e)
const CATEGORY_PREFIX: Record<TenantCategory, string> = {
  RESTAURANT: 'rest',
  FASTFOOD: 'rest',
  PHARMACIE: 'pharma',
  ENTREPRISE: 'ent',
};

const CATEGORY_COLLECT_PATH: Record<TenantCategory, string> = {
  RESTAURANT: 'r',
  FASTFOOD: 'r',
  PHARMACIE: 'p',
  ENTREPRISE: 'e',
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function generateSlug(name: string, category: TenantCategory): string {
  const prefix = CATEGORY_PREFIX[category];
  const base = slugify(name).slice(0, 20);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${base}_${suffix}`;
}

interface TenantFormProps {
  existingTenant?: Tenant;
  onSaved: (tenant: Tenant) => void;
}

export default function TenantForm({ existingTenant, onSaved }: TenantFormProps) {
  const [name, setName] = useState(existingTenant?.name ?? '');
  const [category, setCategory] = useState<TenantCategory>(existingTenant?.category ?? 'RESTAURANT');
  const [address, setAddress] = useState(existingTenant?.address ?? '');
  const [phone, setPhone] = useState(existingTenant?.phone ?? '');
  const [contactEmail, setContactEmail] = useState(existingTenant?.contact_email ?? '');
  const [status, setStatus] = useState<TenantStatus>(existingTenant?.status ?? 'PILOT');
  const [saving, setSaving] = useState(false);

  const slug = existingTenant?.slug ?? generateSlug(name || 'structure', category);
  const collectPath = CATEGORY_COLLECT_PATH[category];
  const collectBaseUrl = import.meta.env.VITE_COLLECT_APP_URL ?? 'https://collect.asillia.com';
  const collectUrl = `${collectBaseUrl}/${collectPath}/${slug}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(collectUrl)}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (existingTenant) {
        const updated = await updateTenant(existingTenant.$id, {
          name,
          category,
          address: address || undefined,
          phone: phone || undefined,
          contact_email: contactEmail || undefined,
          status,
        });
        onSaved(updated);
      } else {
        const created = await createTenant({
          slug,
          name,
          category,
          address: address || undefined,
          phone: phone || undefined,
          contact_email: contactEmail || undefined,
          status,
        });
        onSaved(created);
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-neutral-900">
        {existingTenant ? 'Modifier la structure' : 'Nouvelle structure'}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Nom de la structure" value={name} onChange={(e) => setName(e.target.value)} required />

        <Select
          label="Catégorie"
          value={category}
          onChange={(v) => setCategory(v as TenantCategory)}
          options={CATEGORY_OPTIONS}
        />

        <Input label="Adresse" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input label="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input
          label="Email du gérant"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />

        <Select
          label="Statut"
          value={status}
          onChange={(v) => setStatus(v as TenantStatus)}
          options={STATUS_OPTIONS}
        />

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="mb-2 text-xs font-medium text-neutral-500">
            Lien de collecte {existingTenant ? '' : '(généré à la sauvegarde)'}
          </div>
          <div className="mb-3 break-all text-xs text-neutral-700">{collectUrl}</div>
          <img src={qrImageUrl} alt="QR Code" className="h-24 w-24" />
        </div>

        <Button type="submit" loading={saving}>
          {existingTenant ? 'Enregistrer' : 'Créer la structure'}
        </Button>

        {existingTenant && (
  <ProvisionAccessButton tenant={existingTenant} onProvisioned={() => onSaved(existingTenant)} />
)}
      </form>
    </Card>
  );
}