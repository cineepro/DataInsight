//apps/showcase/src/features/sectors/components/SectorTabs.tsx
interface SectorTabsProps {
  sectors: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function SectorTabs({ sectors, activeId, onChange }: SectorTabsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {sectors.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeId === s.id ? 'bg-violet-gradient text-white' : 'border border-neutral-300 text-neutral-600 hover:border-violet-400'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}