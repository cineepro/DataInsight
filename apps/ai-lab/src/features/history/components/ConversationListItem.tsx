//apps/ai-lab/src/features/history/components/ConversationListItem.tsx
import type { Conversation } from '../../../api/history';

interface ConversationListItemProps {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
}

export default function ConversationListItem({ conversation, active, onSelect }: ConversationListItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
        active ? 'bg-ink text-white' : 'text-neutral-700 hover:bg-neutral-100'
      }`}
    >
      <p className="truncate">{conversation.title || 'Conversation sans titre'}</p>
      <p className={`mt-0.5 text-xs ${active ? 'text-white/60' : 'text-neutral-400'}`}>
        {new Date(conversation.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
      </p>
    </button>
  );
}