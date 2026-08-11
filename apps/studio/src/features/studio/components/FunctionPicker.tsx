// apps/studio/src/features/studio/components/FunctionPicker.tsx
import type { TenantCategory } from '@datainsight/shared';
import { getFunctionsForCategory } from '../../../engine/registry';
import Checkbox from '../../../components/ui/Checkbox';

interface FunctionPickerProps {
  category: TenantCategory;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function FunctionPicker({ category, selectedIds, onChange }: FunctionPickerProps) {
  const availableFunctions = getFunctionsForCategory(category);

  function toggle(id: string, checked: boolean) {
    if (checked) {
      onChange([...selectedIds, id]);
    } else {
      onChange(selectedIds.filter((existingId) => existingId !== id));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
        3 — Fonctions d'analyse
      </span>
      <div className="flex flex-col divide-y divide-neutral-100 border border-neutral-200">
        {availableFunctions.map((fn) => (
          <Checkbox
            key={fn.id}
            label={fn.label}
            description={fn.description}
            checked={selectedIds.includes(fn.id)}
            onChange={(checked) => toggle(fn.id, checked)}
          />
        ))}
      </div>
    </div>
  );
}