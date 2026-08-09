// apps/collect/src/components/ui/RadioGroup.tsx
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
      <legend className="mb-1 text-sm font-medium text-neutral-700">
        {label} {required && <span className="text-brand-600">*</span>}
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              value === opt.value
                ? 'border-brand-600 bg-brand-50 text-brand-600 font-medium'
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