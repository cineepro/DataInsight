//apps/collect/src/components/ui/TextArea.tsx
import type { TextareaHTMLAttributes } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export default function TextArea({ label, ...props }: TextAreaProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-ink">{label}</label>
      <textarea
        {...props}
        rows={3}
        maxLength={500}
        className="rounded-xl border border-neutral-200 p-3 text-sm text-ink focus:border-marigold-500 focus:outline-none"
      />
    </div>
  );
}