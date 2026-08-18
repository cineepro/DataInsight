//apps/showcase/src/features/home/components/HowItWorks.tsx
const STEPS = [
  {
    number: '01',
    title: 'Collecte',
    description:
      "Vos clients scannent un QR Code affiché sur place et donnent leur avis en 30 secondes, sans créer de compte.",
  },
  {
    number: '02',
    title: 'Analyse',
    description:
      "Chaque semaine, nos algorithmes et notre IA analysent les données pour identifier tendances, points forts et signaux d'alerte.",
  },
  {
    number: '03',
    title: 'Recommandation',
    description:
      "Vous recevez des directives concrètes et actionnables — pas juste des chiffres, mais quoi faire avec.",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Comment ça marche</span>
          <h2 className="mt-2 font-display text-3xl font-medium text-ink">Trois étapes, chaque semaine</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative rounded-2xl border border-neutral-200 bg-white p-6">
              <span className="font-display text-4xl font-medium text-violet-100">{step.number}</span>
              <h3 className="mt-2 text-lg font-medium text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{step.description}</p>
              {i < STEPS.length - 1 && (
                <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-2xl text-violet-300 md:block">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}