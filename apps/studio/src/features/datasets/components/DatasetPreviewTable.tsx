//apps/studio/src/features/datasets/components/DatasetPreviewTable.tsx
interface DatasetPreviewTableProps {
  headers: string[];
  rows: Record<string, unknown>[];
  maxRows?: number;
}

/**
 * Aperçu brut des premières lignes, avant tout mapping — permet à
 * l'analyste de vérifier visuellement que le fichier a été lu correctement
 * (bonnes colonnes, pas de décalage) avant de passer du temps sur le mapping.
 */
export default function DatasetPreviewTable({ headers, rows, maxRows = 8 }: DatasetPreviewTableProps) {
  const displayedRows = rows.slice(0, maxRows);

  return (
    <div className="overflow-x-auto border border-neutral-200">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2 font-mono uppercase tracking-wide text-neutral-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayedRows.map((row, i) => (
            <tr key={i} className="border-b border-neutral-100 last:border-0">
              {headers.map((h) => (
                <td key={h} className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {String(row[h] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > maxRows && (
        <p className="border-t border-neutral-100 px-3 py-2 font-mono text-[11px] text-neutral-400">
          + {rows.length - maxRows} autres lignes
        </p>
      )}
    </div>
  );
}