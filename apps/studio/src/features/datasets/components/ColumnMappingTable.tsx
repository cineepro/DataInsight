//apps/studio/src/features/datasets/components/ColumnMappingTable.tsx
import type { ColumnDataType, ColumnRole } from '../../../engine/flexible/types';
import type { NewColumnInput } from '../../../api/datasets';

const DATA_TYPE_OPTIONS: { label: string; value: ColumnDataType }[] = [
  { label: 'Texte', value: 'TEXT' },
  { label: 'Nombre', value: 'NUMBER' },
  { label: 'Date', value: 'DATE' },
  { label: 'Catégorie', value: 'CATEGORY' },
  { label: 'Oui/Non', value: 'BOOLEAN' },
];

const ROLE_OPTIONS: { label: string; value: ColumnRole; hint: string }[] = [
  { label: 'Dimension', value: 'DIMENSION', hint: 'Axe de regroupement (ville, produit...)' },
  { label: 'Mesure', value: 'METRIC', hint: 'Valeur à calculer (ventes, quantité...)' },
  { label: 'Date', value: 'DATE', hint: 'Axe temporel' },
  { label: 'Identifiant', value: 'IDENTIFIER', hint: 'Jamais agrégé (nom, référence...)' },
  { label: 'Ignorer', value: 'IGNORE', hint: 'Colonne exclue de l\'analyse' },
];

export interface ColumnMappingRow extends NewColumnInput {
  sampleValues: string[]; // 3 exemples pour aider l'analyste à valider visuellement
}

interface ColumnMappingTableProps {
  columns: ColumnMappingRow[];
  onChange: (columns: ColumnMappingRow[]) => void;
}

/**
 * Étape 2 du pipeline — coeur du "travail d'analyste" : chaque colonne du
 * fichier arrive avec une suggestion de type/rôle déjà calculée
 * (inferColumnType), mais rien n'est appliqué tant que l'analyste n'a pas
 * validé ou corrigé chaque ligne de ce tableau.
 */
export default function ColumnMappingTable({ columns, onChange }: ColumnMappingTableProps) {
  function updateColumn(index: number, updates: Partial<ColumnMappingRow>) {
    const next = [...columns];
    next[index] = { ...next[index], ...updates };
    onChange(next);
  }

  return (
    <div className="overflow-x-auto border border-neutral-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">
            <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-neutral-500">Colonne source</th>
            <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-neutral-500">Exemples</th>
            <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-neutral-500">Type</th>
            <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-neutral-500">Rôle</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((col, i) => (
            <tr key={col.key} className="border-b border-neutral-100 last:border-0">
              <td className="px-3 py-2.5 font-medium text-ink">{col.name}</td>
              <td className="px-3 py-2.5 text-xs text-neutral-500">
                {col.sampleValues.filter(Boolean).slice(0, 3).join(', ') || '—'}
              </td>
              <td className="px-3 py-2.5">
                <select
                  value={col.data_type}
                  onChange={(e) => updateColumn(i, { data_type: e.target.value as ColumnDataType })}
                  className="rounded-md border border-neutral-300 px-2 py-1.5 text-xs text-ink focus:border-ink focus:outline-none"
                >
                  {DATA_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2.5">
                <select
                  value={col.role}
                  onChange={(e) => updateColumn(i, { role: e.target.value as ColumnRole })}
                  title={ROLE_OPTIONS.find((r) => r.value === col.role)?.hint}
                  className="rounded-md border border-neutral-300 px-2 py-1.5 text-xs text-ink focus:border-ink focus:outline-none"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}