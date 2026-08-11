//apps/collect/src/components/TicketDivider.tsx
interface TicketDividerProps {
  label?: string;
}

// Sépare les grandes sections du formulaire (expérience / détails / contact),
// pas chaque champ individuel — évite l'effet "trop chargé".
export default function TicketDivider({ label }: TicketDividerProps) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 border-t border-dashed border-neutral-300" />
      {label && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">{label}</span>
      )}
      <div className="h-px flex-1 border-t border-dashed border-neutral-300" />
    </div>
  );
}