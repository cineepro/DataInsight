//apps/client-dashboard/src/components/ui/Tabs.tsx
interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function Tabs({ tabs, activeId, onChange }: TabsProps) {
  return (
    <div className="no-print mb-6 flex gap-1 border-b border-neutral-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2.5 text-sm transition ${
            activeId === tab.id
              ? 'border-b-2 border-ink font-medium text-ink'
              : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}