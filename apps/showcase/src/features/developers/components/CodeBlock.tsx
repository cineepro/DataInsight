//apps/showcase/src/features/developers/components/CodeBlock.tsx
import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language = 'bash' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-ink">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">{language}</span>
        <button onClick={handleCopy} className="font-mono text-[10px] text-white/60 hover:text-white">
          {copied ? '✓ Copié' : 'Copier'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4">
        <code className="font-mono text-xs leading-relaxed text-white/90">{code}</code>
      </pre>
    </div>
  );
}