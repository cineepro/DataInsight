// apps/client-dashboard/src/components/ui/Card.tsx
import type { ReactNode } from 'react';

export default function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border border-neutral-200/80 bg-white px-6 py-7 shadow-[0_1px_2px_rgba(23,26,43,0.04)] ${className}`}>
      {children}
    </div>
  );
}