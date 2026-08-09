// apps/collect/src/hooks/useTenantFromSlug.ts
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchTenantPublicInfo } from '../api/tenantPublicInfo';
import type { TenantPublicInfo } from '@datainsight/shared';

interface UseTenantFromSlugResult {
  tenant: TenantPublicInfo | null;
  loading: boolean;
  error: string | null;
  slug: string;
}

/**
 * Lit le :slug dans l'URL courante et résout les infos publiques du tenant.
 * Utilisé en haut de chaque formulaire (Restaurant, Pharmacie, Entreprise).
 */
export function useTenantFromSlug(): UseTenantFromSlugResult {
  const { slug } = useParams<{ slug: string }>();
  const [tenant, setTenant] = useState<TenantPublicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Lien invalide.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchTenantPublicInfo(slug).then((result) => {
      if (cancelled) return;
      if (!result) {
        setError('Établissement introuvable.');
      } else {
        setTenant(result);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { tenant, loading, error, slug: slug ?? '' };
}