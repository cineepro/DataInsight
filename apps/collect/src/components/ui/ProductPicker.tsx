//apps/collect/src/components/ui/ProductPicker.tsx
interface ProductPickerProps {
  menuItems: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

// Cases à cocher multi-sélection — le client peut cocher plusieurs plats.
// N'apparaît que si la structure a renseigné un menu dans le Studio.
export default function ProductPicker({ menuItems, selected, onChange }: ProductPickerProps) {
  function toggle(item: string) {
    if (selected.includes(item)) {
      onChange(selected.filter((i) => i !== item));
    } else {
      onChange([...selected, item]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink">Qu'avez-vous commandé ?</span>
      <div className="grid grid-cols-2 gap-2">
        {menuItems.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => toggle(item)}
            className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
              selected.includes(item)
                ? 'border-marigold-500 bg-marigold-500/10 font-medium text-ink'
                : 'border-neutral-200 text-neutral-600'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}