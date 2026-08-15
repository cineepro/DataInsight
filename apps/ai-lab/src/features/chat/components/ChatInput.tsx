// apps/ai-lab/src/features/chat/components/ChatInput.tsx
import { useState } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Posez votre question sur le commerce en Afrique de l'Ouest..."
        maxLength={500}
        disabled={disabled}
        className="flex-1 rounded-full border border-neutral-300 px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none disabled:bg-neutral-100"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-full bg-marigold-500 px-5 py-2.5 text-sm font-medium text-ink transition disabled:opacity-40"
      >
        {disabled ? '...' : 'Envoyer'}
      </button>
    </form>
  );
}