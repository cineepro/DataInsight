//apps/showcase/src/features/home/components/ProblemSection.tsx
const PAIN_POINTS = [
  "On sait que certains jours sont meilleurs, mais pas pourquoi",
  "Aucune vision claire de quels clients reviennent vraiment",
  "Impossible de savoir quels produits marchent, et à quel moment",
  "Les décisions se prennent à l'intuition, pas sur des faits",
];

export default function ProblemSection() {
  return (
    <section className="bg-white px-5 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Le constat</span>
          <h2 className="mt-2 font-display text-3xl font-medium text-ink">
            Beaucoup de commerces fonctionnent encore à l'intuition
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {PAIN_POINTS.map((point) => (
            <div key={point} className="flex items-start gap-3 rounded-xl border border-neutral-200 p-4">
              <span className="mt-0.5 text-brick">✕</span>
              <p className="text-sm text-neutral-700">{point}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}