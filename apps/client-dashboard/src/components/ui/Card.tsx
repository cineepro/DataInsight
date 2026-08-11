//apps/client-dashboard/src/components/ui/Card.tsx
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export default function Card({ children, className = '', id }: CardProps) {
  return (
    <div id={id} className={`rounded-xl border border-neutral-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}