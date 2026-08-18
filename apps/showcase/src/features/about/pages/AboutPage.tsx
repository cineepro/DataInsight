//apps/showcase/src/features/about/pages/AboutPage.tsx
import PageShell from '../../../components/PageShell';

export default function AboutPage() {
  return (
    <PageShell>
      <section className="px-5 py-16">
        <div className="mx-auto max-w-2xl">
          <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">À propos</span>
          <h1 className="mt-2 font-display text-4xl font-medium text-ink">ASILLIA</h1>

          <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-neutral-700">
            <p>
              ASILLIA est une entreprise technologique basée à Cotonou, au Bénin, qui conçoit des solutions
              numériques pensées pour les réalités du terrain en Afrique de l'Ouest.
            </p>
            <p>
              Notre vision : devenir un acteur de référence dans la gestion et l'analyse de données pour les
              commerces et entreprises de la région — en commençant par construire des outils concrets, utiles dès
              le premier jour, plutôt que des promesses technologiques abstraites.
            </p>
            <p>
              DataInsight est notre solution de business intelligence pour les PME — restaurants, pharmacies,
              hôtels, commerces — qui n'ont ni le temps ni les ressources pour recruter un analyste de données à
              temps plein, mais qui méritent les mêmes outils de décision que les grandes structures.
            </p>
            <p>
              Nous croyons à la validation humaine : chaque analyse produite par nos algorithmes et notre
              intelligence artificielle est relue avant d'atteindre nos clients. La technologie nous aide à aller
              plus vite ; elle ne remplace jamais le jugement.
            </p>
          </div>

          <div className="mt-12 rounded-2xl bg-violet-gradient p-8 text-center text-white">
            <p className="font-display text-xl">
              « Vous avez déjà les données. Nous vous aidons à les comprendre. »
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}