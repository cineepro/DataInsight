// apps/studio/src/components/ui/Card.tsx
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

// Bords nets, hairline plutôt qu'ombre — cohérent avec l'esprit "instrument".
export default function Card({ children, className = '' }: CardProps) {
  return <div className={`border border-neutral-200 bg-white p-5 ${className}`}>{children}</div>;
}