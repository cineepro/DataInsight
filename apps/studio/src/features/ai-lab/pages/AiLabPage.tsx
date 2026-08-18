// apps/studio/src/features/ai-lab/pages/AiLabPage.tsx
import { useEffect, useState } from 'react';
import { listKnowledgeBaseEntries, listRecentChatLogs, type KnowledgeBaseEntry, type AiChatLog } from '../../../api/aiLab';
import KnowledgeBaseForm from '../components/KnowledgeBaseForm';
import KnowledgeBaseList from '../components/KnowledgeBaseList';
import DraftReviewCard from '../components/DraftReviewCard';
import ChatLogItem from '../components/ChatLogItem';
import Tabs from '../../../components/ui/Tabs';
import Card from '../../../components/ui/Card';

type TabId = 'drafts' | 'knowledge' | 'logs';

export default function AiLabPage() {
  const [activeTab, setActiveTab] = useState<TabId>('drafts');
  const [drafts, setDrafts] = useState<KnowledgeBaseEntry[]>([]);
  const [published, setPublished] = useState<KnowledgeBaseEntry[]>([]);
  const [logs, setLogs] = useState<AiChatLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const [d, p, l] = await Promise.all([
      listKnowledgeBaseEntries('DRAFT'),
      listKnowledgeBaseEntries('PUBLISHED'),
      listRecentChatLogs(),
    ]);
    setDrafts(d);
    setPublished(p);
    setLogs(l);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const tabs = [
    { id: 'drafts', label: `À valider (${drafts.length})` },
    { id: 'knowledge', label: `Base de connaissances (${published.length})` },
    { id: 'logs', label: `Questions posées (${logs.length})` },
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6">
        <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">AI Lab</span>
        <h1 className="font-display text-2xl font-medium text-ink">Assistant IA public</h1>
      </div>

      <Tabs tabs={tabs} activeId={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

      {loading ? (
        <p className="text-sm text-neutral-400">Chargement...</p>
      ) : activeTab === 'drafts' ? (
        <div className="flex flex-col gap-4">
          {drafts.length === 0 ? (
            <p className="text-sm text-neutral-400">
              Aucune proposition en attente. La Function summarize-chat-logs s'exécute chaque lundi et propose de
              nouvelles entrées ici si des questions récurrentes sont détectées.
            </p>
          ) : (
            drafts.map((entry) => <DraftReviewCard key={entry.$id} entry={entry} onResolved={refresh} />)
          )}
        </div>
      ) : activeTab === 'knowledge' ? (
        <div className="flex flex-col gap-4">
          <KnowledgeBaseForm onCreated={refresh} />
          <KnowledgeBaseList entries={published} onDeleted={refresh} />
        </div>
      ) : (
        <Card>
          {logs.length === 0 ? (
            <p className="text-sm text-neutral-400">Aucune question posée pour l'instant.</p>
          ) : (
            logs.map((log) => <ChatLogItem key={log.$id} log={log} />)
          )}
        </Card>
      )}
    </div>
  );
}