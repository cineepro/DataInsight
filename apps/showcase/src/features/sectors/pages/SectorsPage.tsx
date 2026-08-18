//apps/showcase/src/features/sectors/pages/SectorsPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../../components/PageShell';
import SectorTabs from '../components/SectorTabs';
import { SECTORS_CONTENT } from '../data/sectorsContent';

export default function SectorsPage() {
  const [activeId, setActiveId] = useState(SECTORS_CONTENT[0].id);
  const active = SECTORS_CONTENT.find((s) => s.id === activeId)!;

  return (
    <PageShell>
      <section className="px-5 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Secteurs</span>
          <h1 className="mt-2 font-display text-4xl font-medium text-ink">Adapté à votre métier</h1>
          <p className="mt-4 text-neutral-600">
            Chaque secteur a ses propres enjeux. Nos formulaires de collecte et nos fonctions d'analyse sont pensés
            spécifiquement pour chacun.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <SectorTabs sectors={SECTORS_CONTENT.map((s) => ({ id: s.id, label: s.label }))} activeId={activeId} onChange={setActiveId} />
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <p className="text-center text-lg text-neutral-700">{active.tagline}</p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-neutral-400">Vos besoins réels</h3>
              <ul className="flex flex-col gap-2">
                {active.needs.map((need) => (
                  <li key={need} className="flex items-start gap-2 text-sm text-neutral-700">
                    <span className="mt-0.5 text-violet-500">→</span>
                    {need}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-neutral-400">Ce qu'on vous apporte</h3>
              <div className="flex flex-col gap-3">
                {active.offers.map((offer) => (
                  <div key={offer.title} className="rounded-xl border border-neutral-200 p-3">
                    <p className="text-sm font-medium text-ink">{offer.title}</p>
                    <p className="mt-1 text-xs text-neutral-500">{offer.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-2xl bg-violet-100 p-6 text-center">
            <p className="text-sm italic text-ink">« {active.pitch} »</p>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/contact"
              className="inline-block rounded-full bg-violet-gradient px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Démarrer mon essai gratuit — {active.label}
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}