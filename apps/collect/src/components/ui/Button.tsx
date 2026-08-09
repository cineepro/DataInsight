// apps/collect/src/components/ui/Button.tsx
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export default function Button({ loading, children, disabled, className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`w-full rounded-xl bg-brand-600 py-3 text-base font-medium text-white transition active:scale-[0.98] disabled:opacity-50 ${className}`}
    >
      {loading ? 'Envoi en cours...' : children}
    </button>
  );
}