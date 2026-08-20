import { useState } from 'react';
import Logo from '../../../components/Logo';
import SectorPicker from '../components/SectorPicker';
import ChatBubble from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
import PageTabs from '../components/PageTabs';
import ContributionForm from '../../contribution/components/ContributionForm';
import { askQuestion } from '../../../api/chat';

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
  const [activeTab, setActiveTab] = useState<'chat' | 'contribute'>('chat');
  const [sector, setSector] = useState('GENERAL');
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(question: string) {
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const answer = await askQuestion(question, sector);
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-fog">
      <header className="flex items-center gap-2 border-b border-neutral-200 bg-white px-6 py-4">
        <Logo className="text-marigold-500" />
        <div>
          <span className="font-display text-base font-medium text-ink">Astra</span>
          <p className="text-xs text-neutral-400">Assistant IA — spécialisé en Afrique de l'Ouest</p>
        </div>
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
              Réponses basées sur des données agrégées et anonymisées — 5 questions par jour maximum.
            </p>
          </>
        ) : (
          <ContributionForm />
        )}
      </div>
    </div>
  );
}