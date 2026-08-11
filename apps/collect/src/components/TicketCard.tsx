//apps/collect/src/components/TicketCard.tsx
import type { ReactNode } from 'react';

interface TicketCardProps {
  children: ReactNode;
}

// Le bord en dents de scie évoque le haut d'un ticket de caisse arraché.
// Le SVG est posé sur le fond "ticket paper" et la carte blanche commence juste en dessous.
export default function TicketCard({ children }: TicketCardProps) {
  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <svg
        className="block w-full text-white"
        viewBox="0 0 420 14"
        preserveAspectRatio="none"
        style={{ height: 14 }}
        aria-hidden="true"
      >
        <polygon
          fill="currentColor"
          points="0,14 0,4 15,14 30,4 45,14 60,4 75,14 90,4 105,14 120,4 135,14 150,4 165,14 180,4 195,14 210,4 225,14 240,4 255,14 270,4 285,14 300,4 315,14 330,4 345,14 360,4 375,14 390,4 405,14 420,4 420,14"
        />
      </svg>
      <div className="bg-white px-5 pb-8 pt-3 shadow-[0_2px_24px_rgba(23,26,43,0.08)]">{children}</div>
    </div>
  );
}