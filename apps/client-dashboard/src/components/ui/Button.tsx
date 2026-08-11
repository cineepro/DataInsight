// apps/client-dashboard/src/components/ui/Button.tsx
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export default function Button({ loading, children, disabled, className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${className}`}
    >
      {loading ? '...' : children}
    </button>
  );
}