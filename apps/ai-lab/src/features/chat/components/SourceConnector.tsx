// apps/ai-lab/src/features/chat/components/SourceConnector.tsx
import { useEffect, useState } from 'react';
import { listActiveOfficialSources, type OfficialSource } from '../../../api/officialSources';

interface SourceConnectorProps {
  connectedSourceId: string | undefined;
  onChange: (sourceId: string | undefined) => void;
}

/**
 * Permet à un compte Premium d'associer sa question à une source
 * officielle précise — Astra répond alors uniquement à partir de la
 * boîte de connaissances de cette source, comme un connecteur MCP.
 * N'apparaît que s'il existe au moins une source ACTIVE à connecter.
 */
export default function SourceConnector({ connectedSourceId, onChange }: SourceConnectorProps) {
  const [sources, setSources] = useState<OfficialSource[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listActiveOfficialSources()
      .then(setSources)
      .finally(() => setLoading(false));
  }, []);

  if (loading || sources.length === 0) return null;

  const connected = sources.find((s) => s.$id === connectedSourceId);

  return (
    <div className="relative mb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
          connected ? 'border-teal bg-teal/10 text-teal' : 'border-neutral-300 text-neutral-600 hover:bg-neutral-100'
        }`}
      >
        <span className="text-sm">🔗</span>
        {connected ? `Connecté : ${connected.name}` : 'Connecter une source officielle'}
        {connected && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange(undefined);
            }}
            className="ml-1 text-neutral-400 hover:text-brick"
          >
            ✕
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-72 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg">
          <p className="px-2 py-1 text-xs text-neutral-400">
            Astra répondra uniquement à partir des connaissances de la source choisie.
          </p>
          {sources.map((source) => (
            <button
              key={source.$id}
              onClick={() => {
                onChange(source.$id);
                setOpen(false);
              }}
              className={`block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-neutral-100 ${
                source.$id === connectedSourceId ? 'font-medium text-teal' : 'text-ink'
              }`}
            >
              {source.name}
              {source.description && <span className="block text-xs text-neutral-400">{source.description}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
