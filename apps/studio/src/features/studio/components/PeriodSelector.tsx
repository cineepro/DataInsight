//apps/studio/src/features/studio/components/PeriodSelector.tsx
import { getISOYearWeek } from '@datainsight/shared';
import Select from '../../../components/ui/Select';

interface PeriodSelectorProps {
  year: number;
  weekNumber: number;
  onChange: (year: number, weekNumber: number) => void;
}

const currentYear = getISOYearWeek().year;
const YEAR_OPTIONS = [currentYear - 1, currentYear, currentYear + 1].map((y) => ({
  label: String(y),
  value: String(y),
}));
const WEEK_OPTIONS = Array.from({ length: 53 }, (_, i) => ({
  label: `Semaine ${i + 1}`,
  value: String(i + 1),
}));

// Étape 2 : une fois la structure connue, on isole une semaine précise.
// Combiné à l'étape 1, ça garantit qu'on ne travaille QUE sur le lot
// (tenant_id + year + week_number) sélectionné — pas de mélange possible.
export default function PeriodSelector({ year, weekNumber, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <Select
          label="2. Année"
          value={String(year)}
          onChange={(v) => onChange(Number(v), weekNumber)}
          options={YEAR_OPTIONS}
        />
      </div>
      <div className="flex-1">
        <Select
          label="2. Semaine"
          value={String(weekNumber)}
          onChange={(v) => onChange(year, Number(v))}
          options={WEEK_OPTIONS}
        />
      </div>
    </div>
  );
}