// apps/studio/src/components/ui/Badge.tsx
type BadgeStatus = 'OPTIMAL' | 'WARNING' | 'CRITICAL' | 'DRAFT' | 'PUBLISHED';

const STATUS_CLASSES: Record<BadgeStatus, string> = {
  OPTIMAL: 'bg-teal/10 text-teal',
  WARNING: 'bg-marigold-500/15 text-marigold-600',
  CRITICAL: 'bg-brick/10 text-brick',
  DRAFT: 'bg-neutral-100 text-neutral-500',
  PUBLISHED: 'bg-ink/10 text-ink',
};

const STATUS_LABELS: Record<BadgeStatus, string> = {
  OPTIMAL: 'Optimal',
  WARNING: 'Attention',
  CRITICAL: 'Critique',
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
};

export default function Badge({ status }: { status: BadgeStatus }) {
  return (
    <span className={`rounded px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${STATUS_CLASSES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}