//apps/ai-lab/src/features/chat/components/PageTabs.tsx
interface PageTabsProps {
  activeTab: 'chat' | 'contribute';
  onChange: (tab: 'chat' | 'contribute') => void;
}

export default function PageTabs({ activeTab, onChange }: PageTabsProps) {
  return (
    <div className="mb-4 flex gap-1 border-b border-neutral-200">
      <button
        onClick={() => onChange('chat')}
        className={`px-4 py-2.5 text-sm transition ${
          activeTab === 'chat' ? 'border-b-2 border-ink font-medium text-ink' : 'text-neutral-400 hover:text-neutral-600'
        }`}
      >
        Poser une question
      </button>
      <button
        onClick={() => onChange('contribute')}
        className={`px-4 py-2.5 text-sm transition ${
          activeTab === 'contribute' ? 'border-b-2 border-ink font-medium text-ink' : 'text-neutral-400 hover:text-neutral-600'
        }`}
      >
        Contribuer
      </button>
    </div>
  );
}