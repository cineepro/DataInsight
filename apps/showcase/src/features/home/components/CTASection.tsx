//apps/showcase/src/features/home/components/CTASection.tsx
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-2xl rounded-3xl bg-violet-gradient p-10 text-center text-white">
        <h2 className="font-display text-3xl font-medium">Un mois d'essai, entièrement gratuit</h2>
        <p className="mt-3 text-white/85">
          Nous mettons en place la collecte, réalisons les analyses, et vous envoyons les recommandations. Vous
          jugez ensuite si ça vous apporte quelque chose de concret.
        </p>
        <Link
          to="/contact"
          className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-medium text-violet-600 transition hover:bg-white/90"
        >
          Démarrer mon essai gratuit
        </Link>
      </div>
    </section>
  );
}