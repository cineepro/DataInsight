//apps/studio/src/features/studio/components/FunctionPicker.tsx
import type { TenantCategory } from '@datainsight/shared';
import { getFunctionsForCategory } from '../../../engine/registry';
import Checkbox from '../../../components/ui/Checkbox';

interface FunctionPickerProps {
  category: TenantCategory;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

// Étape 3 : on choisit quelles briques d'analyse appliquer, à la manière
// de LEGO. La liste dépend uniquement de la catégorie (registry.ts).
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
      <span className="text-sm font-medium text-neutral-700">3. Fonctions d'analyse</span>
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
  );
}