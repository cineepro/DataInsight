//apps/studio/src/components/ui/Badge.tsx
type BadgeStatus = 'OPTIMAL' | 'WARNING' | 'CRITICAL' | 'DRAFT' | 'PUBLISHED';

const STATUS_CLASSES: Record<BadgeStatus, string> = {
  OPTIMAL: 'bg-green-100 text-green-700',
  WARNING: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-red-100 text-red-700',
  DRAFT: 'bg-neutral-100 text-neutral-600',
  PUBLISHED: 'bg-blue-100 text-blue-700',
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
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}