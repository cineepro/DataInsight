//packages/ui-statistics/src/BlockSelector.tsx
interface BlockSelectorProps {
  blockLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  loading: boolean;
}

export default function BlockSelector({ blockLabel, onPrevious, onNext, loading }: BlockSelectorProps) {
  return (
    <div className="flex items-center justify-between border border-neutral-200 bg-white px-4 py-3">
      <button
        onClick={onPrevious}
        disabled={loading}
        className="rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
      >
        ← Bloc précédent
      </button>
      <span className="font-mono text-xs uppercase tracking-wide text-ink">{blockLabel}</span>
      <button
        onClick={onNext}
        disabled={loading}
        className="rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
      >
        Bloc suivant →
      </button>
    </div>
  );
}