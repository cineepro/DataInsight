//apps/studio/src/components/ui/ProgressBar.tsx
interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export default function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="font-mono text-xs text-neutral-500">
          {label} — {current}/{total}
        </span>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
        <div className="h-full bg-marigold-500 transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}