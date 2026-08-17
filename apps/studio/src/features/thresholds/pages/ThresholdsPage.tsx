//apps/studio/src/features/thresholds/pages/ThresholdsPage.tsx
import { THRESHOLD_REGISTRY, type ThresholdFunctionEntry } from '../../../engine/thresholdRegistry';
import ThresholdFunctionCard from '../components/ThresholdFunctionCard';

const GROUP_ORDER: ThresholdFunctionEntry['group'][] = ['Restaurant', 'Pharmacie', 'Données brutes', 'Commun'];

export default function ThresholdsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6">
        <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Configuration</span>
        <h1 className="font-display text-2xl font-medium text-ink">Seuils d'analyse</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Ajustez ici le comportement des fonctions d'analyse — aucune modification de code ni redéploiement nécessaire.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {GROUP_ORDER.map((group) => {
          const entries = THRESHOLD_REGISTRY.filter((e) => e.group === group);
          if (entries.length === 0) return null;

          return (
            <div key={group}>
              <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-neutral-400">{group}</h2>
              <div className="flex flex-col gap-3">
                {entries.map((entry) => (
                  <ThresholdFunctionCard key={entry.function_id} entry={entry} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}