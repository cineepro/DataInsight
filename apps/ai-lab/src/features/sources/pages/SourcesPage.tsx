//apps/ai-lab/src/features/sources/pages/SourcesPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../../components/Logo';
import { listPublicOfficialSources, type OfficialSource } from '../../../api/officialSources';

const STATUS_LABEL: Record<OfficialSource['status'], string> = {
  ACTIVE: 'Synchronisée',
  NEGOTIATING: 'En négociation',
  PAUSED: 'En pause',
};

const STATUS_COLOR: Record<OfficialSource['status'], string> = {
  ACTIVE: 'bg-teal/10 text-teal',
  NEGOTIATING: 'bg-marigold-500/15 text-marigold-600',
  PAUSED: 'bg-neutral-100 text-neutral-500',
};

/**
 * Page de transparence publique — montre les partenariats institutionnels
 * en cours, actifs ou en négociation. Sert d'argument de confiance : les
 * connaissances issues de ces sources sont déjà automatiquement intégrées
 * aux réponses d'Astra dès qu'elles sont validées (statut ACTIVE), sans
 * qu'aucune action supplémentaire ne soit nécessaire côté visiteur.
 */
export default function SourcesPage() {
  const [sources, setSources] = useState<OfficialSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicOfficialSources()
      .then(setSources)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-fog">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <Logo className="text-marigold-500" />
          <span className="font-display text-base font-medium text-ink">Sources officielles</span>
        </div>
        <Link to="/" className="text-xs text-neutral-500 underline">
          Retour au chat
        </Link>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <p className="mb-6 text-sm text-neutral-600">
          Astra s'appuie sur des partenariats avec des institutions officielles d'Afrique de l'Ouest pour enrichir
          ses réponses avec des données fiables et à jour. Voici l'état actuel de ces partenariats.
        </p>

        {loading ? (
          <p className="text-sm text-neutral-400">Chargement...</p>
        ) : sources.length === 0 ? (
          <p className="text-sm text-neutral-400">
            Aucun partenariat public pour le moment — Astra s'appuie actuellement sur sa base de connaissances interne.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {sources.map((source) => (
              <div key={source.$id} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">{source.name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[source.status]}`}>
                    {STATUS_LABEL[source.status]}
                  </span>
                </div>
                {source.description && <p className="text-xs text-neutral-500">{source.description}</p>}
                {source.status === 'ACTIVE' && source.sync_frequency && (
                  <p className="mt-1 text-xs text-neutral-400">Mise à jour : {source.sync_frequency}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}