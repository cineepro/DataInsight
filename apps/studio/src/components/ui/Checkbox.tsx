//apps/studio/src/components/ui/Checkbox.tsx
interface CheckboxProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function Checkbox({ label, description, checked, onChange }: CheckboxProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 p-3 hover:bg-neutral-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4"
      />
      <div>
        <div className="text-sm font-medium text-neutral-900">{label}</div>
        {description && <div className="text-xs text-neutral-500">{description}</div>}
      </div>
    </label>
  );
}