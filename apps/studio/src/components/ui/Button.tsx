//apps/studio/src/components/ui/Button.tsx
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-neutral-900 text-white hover:bg-neutral-800',
  secondary: 'bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

export default function Button({
  variant = 'primary',
  loading,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {loading ? 'Chargement...' : children}
    </button>
  );
}