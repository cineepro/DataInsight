// apps/studio/src/features/ai-lab/components/ChatLogItem.tsx
import type { AiChatLog } from '../../../api/aiLab';

/**
 * C'est en relisant ces logs que tu identifies les questions mal
 * répondues (réponses vagues, hors sujet) — le signal qui te dit quelle
 * connaissance ajouter ensuite dans KnowledgeBaseForm.
 */
export default function ChatLogItem({ log }: { log: AiChatLog }) {
  return (
    <div className="border-b border-neutral-100 p-3 last:border-0">
      <div className="mb-1 flex items-center justify-between">
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">{log.sector}</span>
        <span className="text-xs text-neutral-400">{new Date(log.created_at).toLocaleString('fr-FR')}</span>
      </div>
      <p className="mb-1 text-sm font-medium text-ink">Q : {log.question}</p>
      <p className="text-xs text-neutral-600">R : {log.answer}</p>
    </div>
  );
}