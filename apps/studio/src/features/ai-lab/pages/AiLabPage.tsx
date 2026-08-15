// apps/studio/src/features/ai-lab/pages/AiLabPage.tsx
import { useEffect, useState } from 'react';
import { listKnowledgeBaseEntries, listRecentChatLogs, type KnowledgeBaseEntry, type AiChatLog } from '../../../api/aiLab';
import KnowledgeBaseForm from '../components/KnowledgeBaseForm';
import KnowledgeBaseList from '../components/KnowledgeBaseList';
import ChatLogItem from '../components/ChatLogItem';
import Tabs from '../../../components/ui/Tabs';
import Card from '../../../components/ui/Card';

type TabId = 'knowledge' | 'logs';

export default function AiLabPage() {
  const [activeTab, setActiveTab] = useState<TabId>('knowledge');
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [logs, setLogs] = useState<AiChatLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const [e, l] = await Promise.all([listKnowledgeBaseEntries(), listRecentChatLogs()]);
    setEntries(e);
    setLogs(l);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const tabs = [
    { id: 'knowledge', label: `Base de connaissances (${entries.length})` },
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
      ) : activeTab === 'knowledge' ? (
        <div className="flex flex-col gap-4">
          <KnowledgeBaseForm onCreated={refresh} />
          <KnowledgeBaseList entries={entries} onDeleted={refresh} />
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