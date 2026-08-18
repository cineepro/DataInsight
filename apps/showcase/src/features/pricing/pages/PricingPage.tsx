//apps/showcase/src/features/pricing/pages/PricingPage.tsx
import { Link } from 'react-router-dom';
import PageShell from '../../../components/PageShell';

const STEPS = [
  {
    title: 'Mois 1 — Essai gratuit',
    price: '0 FCFA',
    features: [
      'Mise en place complète de la collecte (QR Code, supports)',
      '4 rapports hebdomadaires complets',
      'Accès à votre espace personnel',
      'Aucun engagement',
    ],
    highlight: false,
  },
  {
    title: 'Abonnement mensuel',
    price: 'Sur devis',
    features: [
      'Collecte continue et illimitée',
      'Rapports hebdomadaires + espace Statistiques',
      'Analyses de vos données brutes sur demande',
      'Accompagnement stratégique continu',
    ],
    highlight: true,
  },
];

export default function PricingPage() {
  return (
    <PageShell>
      <section className="px-5 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Tarifs</span>
          <h1 className="mt-2 font-display text-4xl font-medium text-ink">Testez avant de vous engager</h1>
          <p className="mt-4 text-neutral-600">
            Le tarif final dépend de la taille de votre structure et de la complexité des analyses souhaitées — établi
            après votre mois d'essai, sur la base de la valeur réellement observée.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
          {STEPS.map((step) => (
            <div
              key={step.title}
              className={`rounded-2xl border p-6 ${step.highlight ? 'border-violet-500 bg-violet-100' : 'border-neutral-200 bg-white'}`}
            >
              <h3 className="font-display text-xl font-medium text-ink">{step.title}</h3>
              <p className="mt-2 text-2xl font-medium text-violet-600">{step.price}</p>
              <ul className="mt-5 flex flex-col gap-2">
                {step.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-neutral-700">
                    <span className="mt-0.5 text-teal">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/contact"
            className="inline-block rounded-full bg-violet-gradient px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Démarrer mon essai gratuit
          </Link>
        </div>
      </section>
    </PageShell>
  );
}