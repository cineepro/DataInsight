//apps/showcase/src/features/home/components/Hero.tsx
import { Link } from 'react-router-dom';
import { EXTERNAL_LINKS } from '../../../config/contact';

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-5 py-20 md:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <span className="mb-4 inline-block rounded-full bg-violet-100 px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-violet-600">
          ASILLIA DataInsight
        </span>
        <h1 className="font-display text-4xl font-medium leading-tight text-ink md:text-6xl">
          Comprenez enfin
          <br />
          <span className="bg-violet-gradient bg-clip-text text-transparent">ce qui se passe</span> dans votre activité
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-600">
          Restaurants, pharmacies, hôtels, commerces — transformez les avis de vos clients et vos données de vente en
          recommandations concrètes, chaque semaine.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/contact"
            className="rounded-full bg-violet-gradient px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Demander une démo gratuite
          </Link>
          <a
            href={EXTERNAL_LINKS.aiLab}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-ink transition hover:border-violet-500 hover:text-violet-600"
          >
            Discuter avec notre IA
          </a>
        </div>
        <p className="mt-4 font-mono text-xs text-neutral-400">
          1 mois d'essai gratuit — sans engagement
        </p>
      </div>
    </section>
  );
}