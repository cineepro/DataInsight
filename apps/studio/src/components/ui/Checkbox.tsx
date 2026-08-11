// apps/studio/src/components/ui/Checkbox.tsx
interface CheckboxProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function Checkbox({ label, description, checked, onChange }: CheckboxProps) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 border px-3 py-2.5 transition ${
        checked ? 'border-ink bg-ink/[0.03]' : 'border-neutral-200 hover:bg-neutral-50'
      }`}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-ink" />
      <div>
        <div className="text-sm font-medium text-ink">{label}</div>
        {description && <div className="text-xs text-neutral-500">{description}</div>}
      </div>
    </label>
  );
}