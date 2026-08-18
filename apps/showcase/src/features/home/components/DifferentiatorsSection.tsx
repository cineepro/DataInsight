//apps/showcase/src/features/home/components/DifferentiatorsSection.tsx
const ITEMS = [
  {
    title: 'Comparaison sectorielle',
    description:
      "Vos indicateurs comparés aux moyennes anonymisées d'autres commerces similaires — impossible à obtenir seul.",
  },
  {
    title: 'IA entraînée sur le terrain',
    description: "Un assistant intelligent, spécialisé sur le commerce en Afrique de l'Ouest, accessible gratuitement.",
  },
  {
    title: 'Validation humaine',
    description: "Chaque rapport est relu par un analyste avant publication — jamais d'automatisation à l'aveugle.",
  },
];

export default function DifferentiatorsSection() {
  return (
    <section className="bg-ink px-5 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <span className="font-mono text-[11px] uppercase tracking-wider text-violet-400">Ce qui nous distingue</span>
          <h2 className="mt-2 font-display text-3xl font-medium text-white">
            Plus qu'un rapport, une vraie compréhension
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {ITEMS.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-base font-medium text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}