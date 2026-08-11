// apps/studio/src/components/ui/Input.tsx
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</label>}
      <input
        {...props}
        className={`rounded-md border border-neutral-300 px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none ${className}`}
      />
    </div>
  );
}