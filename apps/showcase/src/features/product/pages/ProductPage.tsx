//apps/showcase/src/features/product/pages/ProductPage.tsx
import PageShell from '../../../components/PageShell';
import FeatureBlock from '../components/FeatureBlock';
import { Link } from 'react-router-dom';
import { EXTERNAL_LINKS } from '../../../config/contact';

export default function ProductPage() {
  return (
    <PageShell>
      <section className="px-5 py-16 text-center">
        <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Le produit</span>
        <h1 className="mx-auto mt-2 max-w-2xl font-display text-4xl font-medium text-ink">
          DataInsight, expliqué simplement
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-neutral-600">
          Un système en trois maillons : collecte terrain, traitement hybride algorithmes + IA, restitution
          actionnable.
        </p>
      </section>

      <section className="px-5 pb-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-20">
          <FeatureBlock
            eyebrow="Étape 1"
            title="Une collecte sans friction"
            description="Vos clients scannent un QR Code affiché sur place — chevalet de table, sticker de caisse, affiche à l'entrée."
            points={[
              'Aucune inscription requise côté client',
              'Formulaire adapté à votre secteur (restaurant, pharmacie...)',
              'Réponse en moins de 30 secondes',
              'Reconnaissance des clients fidèles, sans données intrusives',
            ]}
          />
          <FeatureBlock
            eyebrow="Étape 2"
            title="Un traitement hybride, humain et algorithmique"
            description="Vos données sont analysées par des algorithmes précis, interprétées par une intelligence artificielle, puis validées par un analyste."
            points={[
              'Détection des pics de satisfaction et des points faibles',
              "Croisement de vos données avec le contexte (météo, événements)",
              'Jamais de publication automatique sans relecture humaine',
            ]}
            reversed
          />
          <FeatureBlock
            eyebrow="Étape 3"
            title="Des recommandations qu'on peut vraiment appliquer"
            description="Chaque semaine, un espace personnel avec vos statistiques en graphiques et des directives concrètes."
            points={[
              'Espace dédié, accessible à tout moment',
              'Graphiques visuels de vos indicateurs clés',
              'Recommandations actionnables, pas juste des chiffres',
            ]}
          />
        </div>
      </section>

      <section className="bg-white px-5 py-16 text-center">
        <h2 className="font-display text-2xl font-medium text-ink">Vous avez déjà vos propres données ?</h2>
        <p className="mx-auto mt-3 max-w-xl text-neutral-600">
          Excel, CSV, exports de votre logiciel de caisse — transmettez-nous vos fichiers, nous les analysons pour
          vous comme un vrai service d'analyste de données.
        </p>
        <Link
          to="/contact"
          className="mt-6 inline-block rounded-full bg-violet-gradient px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          En discuter avec nous
        </Link>
      </section>

      <section className="px-5 py-16 text-center">
        <h2 className="font-display text-2xl font-medium text-ink">Curieux avant même de nous contacter ?</h2>
        <p className="mx-auto mt-3 max-w-xl text-neutral-600">
          Testez gratuitement notre assistant IA public, spécialisé dans le commerce en Afrique de l'Ouest.
        </p>
        <a
          href={EXTERNAL_LINKS.aiLab}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-full border border-violet-500 px-6 py-3 text-sm font-medium text-violet-600 transition hover:bg-violet-100"
        >
          Discuter avec l'IA
        </a>
      </section>
    </PageShell>
  );
}