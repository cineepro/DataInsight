//apps/collect/src/components/ui/RadioGroup.tsx
interface Option {
  label: string;
  value: string;
}

interface RadioGroupProps {
  label: string;
  name: string;
  options: Option[];
  value: string | undefined;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function RadioGroup({ label, options, value, onChange, required }: RadioGroupProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium text-ink">
        {label} {required && <span className="text-marigold-600">*</span>}
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-xl border px-3 py-2.5 text-sm transition ${
              value === opt.value
                ? 'border-marigold-500 bg-marigold-500/10 font-medium text-ink'
                : 'border-neutral-200 text-neutral-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}