// apps/client-dashboard/src/components/ui/Card.tsx
import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  // Hérite automatiquement de `id`, `className`, `children`, etc.
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`border border-neutral-200/80 bg-white px-6 py-7 shadow-[0_1px_2px_rgba(23,26,43,0.04)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}