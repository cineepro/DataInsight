//apps/ai-lab/src/features/history/pages/HistoryPage.tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../../components/Logo';
import ChatBubble from '../../chat/components/ChatBubble';
import ConversationListItem from '../components/ConversationListItem';
import { getCurrentAiLabSession, type AiLabSession } from '../../../api/auth';
import { listConversations, listMessagesForConversation, type Conversation, type ConversationMessage } from '../../../api/history';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<AiLabSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    getCurrentAiLabSession().then((s) => {
      setSession(s);
      setChecking(false);
      if (!s) {
        navigate('/login');
        return;
      }
      if (s.account?.plan !== 'PREMIUM') {
        return; // affichera le message d'upgrade plutôt que de charger quoi que ce soit
      }
      listConversations(s.userId).then((convs) => {
        setConversations(convs);
        if (convs.length > 0) handleSelect(convs[0].$id);
      });
    });
  }, []);

  async function handleSelect(conversationId: string) {
    setSelectedId(conversationId);
    setLoadingMessages(true);
    const msgs = await listMessagesForConversation(conversationId);
    setMessages(msgs);
    setLoadingMessages(false);
  }

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-neutral-400">Chargement...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-fog">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <Logo className="text-marigold-500" />
          <span className="font-display text-base font-medium text-ink">Mes conversations</span>
        </div>
        <Link to="/" className="text-xs text-neutral-500 underline">
          Retour au chat
        </Link>
      </header>

      {session?.account?.plan !== 'PREMIUM' ? (
        <div className="mx-auto mt-16 max-w-md px-4 text-center">
          <p className="text-sm text-neutral-600">
            L'historique de conversation est réservé aux comptes Premium. Contactez ASILLIA pour activer cette
            fonctionnalité sur votre compte.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm font-medium text-ink underline">
            Retour au chat
          </Link>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-4xl flex-1 gap-4 px-4 py-6">
          <aside className="w-64 shrink-0 rounded-xl border border-neutral-200 bg-white p-2">
            {conversations.length === 0 ? (
              <p className="p-3 text-xs text-neutral-400">Aucune conversation pour l'instant.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {conversations.map((conv) => (
                  <ConversationListItem
                    key={conv.$id}
                    conversation={conv}
                    active={conv.$id === selectedId}
                    onSelect={() => handleSelect(conv.$id)}
                  />
                ))}
              </div>
            )}
          </aside>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-4">
            {loadingMessages ? (
              <p className="text-sm text-neutral-400">Chargement...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-neutral-400">Sélectionnez une conversation.</p>
            ) : (
              messages.map((msg) => (
                <ChatBubble key={msg.$id} role={msg.role === 'USER' ? 'user' : 'assistant'} content={msg.content} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}