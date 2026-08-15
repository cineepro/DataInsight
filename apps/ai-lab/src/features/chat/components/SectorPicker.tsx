// apps/ai-lab/src/features/chat/components/SectorPicker.tsx
interface SectorOption {
  label: string;
  value: string;
}

const SECTORS: SectorOption[] = [
  { label: 'Général', value: 'GENERAL' },
  { label: 'Restauration', value: 'RESTAURATION' },
  { label: 'Hôtellerie', value: 'HOTELLERIE' },
  { label: 'Pharmacie', value: 'PHARMACIE' },
  { label: 'Commerce de détail', value: 'COMMERCE_DETAIL' },
];

interface SectorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SectorPicker({ value, onChange }: SectorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SECTORS.map((sector) => (
        <button
          key={sector.value}
          onClick={() => onChange(sector.value)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            value === sector.value
              ? 'border-ink bg-ink text-white'
              : 'border-neutral-300 text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          {sector.label}
        </button>
      ))}
    </div>
  );
}