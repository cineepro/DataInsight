//apps/ai-lab/src/components/ui/Button.tsx
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

export default function Button({ variant = 'primary', loading, children, disabled, className = '', ...props }: ButtonProps) {
  const base =
    variant === 'primary'
      ? 'bg-marigold-500 text-ink'
      : 'bg-white text-ink border border-neutral-300';

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`rounded-full px-4 py-2.5 text-sm font-medium transition disabled:opacity-40 ${base} ${className}`}
    >
      {loading ? '...' : children}
    </button>
  );
}