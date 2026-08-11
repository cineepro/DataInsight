// apps/studio/src/features/tenants/components/ProvisionAccessButton.tsx
import { useState } from 'react';
import { functions } from '../../../api/appwrite';
import type { Tenant } from '@datainsight/shared';
import Button from '../../../components/ui/Button';

interface ProvisionAccessButtonProps {
  tenant: Tenant;
  onProvisioned: () => void;
}

interface ProvisionResult {
  success: boolean;
  email?: string;
  tempPassword?: string;
  alreadyProvisioned?: boolean;
  error?: string;
}

export default function ProvisionAccessButton({ tenant, onProvisioned }: ProvisionAccessButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleProvision() {
    setLoading(true);
    try {
      const functionId = import.meta.env.VITE_FUNCTION_PROVISION_TENANT_ACCESS;
      const execution = await functions.createExecution(
        functionId,
        JSON.stringify({ tenantDocId: tenant.$id }),
        false
      );
      const result = JSON.parse(execution.responseBody) as ProvisionResult;

      if (!result.success) {
        alert(result.error ?? 'Erreur lors du provisioning.');
        return;
      }

      if (result.alreadyProvisioned) {
        alert(`Accès déjà actif pour ${result.email}.`);
      } else if (result.tempPassword) {
        alert(
          `Accès créé !\n\nEmail : ${result.email}\nMot de passe temporaire : ${result.tempPassword}\n\nTransmets ces identifiants au gérant — ils ne seront plus jamais réaffichés.`
        );
      } else {
        alert(`Compte existant réutilisé et rattaché : ${result.email}`);
      }

      onProvisioned();
    } catch (err) {
      console.error(err);
      alert('Erreur lors du provisioning.');
    } finally {
      setLoading(false);
    }
  }

  if (!tenant.contact_email) {
    return <p className="text-xs text-neutral-400">Renseigne un email de contact pour activer l'accès client.</p>;
  }

  return (
    <Button variant="secondary" onClick={handleProvision} loading={loading}>
      {tenant.client_team_id ? "Accès client actif — voir identifiants" : "Provisionner l'accès client"}
    </Button>
  );
}