//apps/ai-lab/src/features/chat/pages/ChatPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../../components/Logo';
import SectorPicker from '../components/SectorPicker';
import ChatBubble from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
import PageTabs from '../components/PageTabs';
import ContributionForm from '../../contribution/components/ContributionForm';
import { askQuestion } from '../../../api/chat';
import { getCurrentAiLabSession, logout, type AiLabSession } from '../../../api/auth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content:
    "Bonjour ! Je suis Astra, l'assistant IA d'ASILLIA DataInsight. Je réponds à vos questions sur le commerce en Afrique de l'Ouest — restauration, pharmacie, hôtellerie, commerce de détail — en m'appuyant sur des données réelles et anonymisées. Choisissez un secteur ci-dessous puis posez votre question.",
};

export default function ChatPage() {
  const [session, setSession] = useState<AiLabSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'contribute'>('chat');
  const [sector, setSector] = useState('GENERAL');
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();

  useEffect(() => {
    // Vérification silencieuse — n'affecte jamais l'accès au chat gratuit,
    // même en cas d'erreur réseau pendant cette vérification.
    getCurrentAiLabSession()
      .then(setSession)
      .finally(() => setCheckingSession(false));
  }, []);

  async function handleSend(question: string) {
  setError(null);
  setMessages((prev) => [...prev, { role: 'user', content: question }]);
  setLoading(true);

  try {
    const result = await askQuestion(question, sector, conversationId);
    setMessages((prev) => [...prev, { role: 'assistant', content: result.answer }]);
    if (result.conversationId) setConversationId(result.conversationId);
  } catch (err) {
    console.error(err);
    setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
  } finally {
    setLoading(false);
  }
}

  async function handleLogout() {
    await logout();
    setSession(null);
  }

  return (
    <div className="flex min-h-screen flex-col bg-fog">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <Logo className="text-marigold-500" />
          <div>
            <span className="font-display text-base font-medium text-ink">ASILLIA AI Lab</span>
            <p className="text-xs text-neutral-400">Astra — commerce en Afrique de l'Ouest</p>
          </div>
        </div>

        {checkingSession ? null : session ? (
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
              {session.account?.plan === 'PREMIUM' ? 'Premium' : 'Gratuit'}
            </span>
            <button onClick={handleLogout} className="text-xs text-neutral-500 underline">
              Déconnexion
            </button>
          </div>
        ) : (
          <Link to="/login" className="rounded-full border border-neutral-300 px-4 py-1.5 text-xs font-medium text-ink">
            Se connecter
          </Link>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
        <PageTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'chat' ? (
          <>
            <div className="mb-4">
              <SectorPicker value={sector} onChange={setSector} />
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-4">
              {messages.map((msg, i) => (
                <ChatBubble key={i} role={msg.role} content={msg.content} />
              ))}
              {loading && <ChatBubble role="assistant" content="..." />}
            </div>

            {error && <p className="mb-2 text-sm text-brick">{error}</p>}

            <ChatInput onSend={handleSend} disabled={loading} />

            <p className="mt-3 text-center text-xs text-neutral-400">
              {session?.account?.plan === 'PREMIUM'
                ? `${session.account.daily_question_limit} questions par jour — compte Premium`
                : 'Réponses basées sur des données agrégées et anonymisées — 5 questions par jour maximum.'}
              {!session && (
                <>
                  {' '}
                  <Link to="/signup" className="underline">
                    Créez un compte
                  </Link>{' '}
                  pour plus de fonctionnalités.
                </>
              )}
            </p>
          </>
        ) : (
          <ContributionForm />
        )}
      </div>
    </div>
  );
}