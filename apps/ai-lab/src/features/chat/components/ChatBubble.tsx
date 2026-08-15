// apps/ai-lab/src/features/chat/components/ChatBubble.tsx
interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser ? 'bg-ink text-white' : 'border border-neutral-200 bg-white text-ink'
        }`}
      >
        {content}
      </div>
    </div>
  );
}