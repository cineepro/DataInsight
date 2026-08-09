// apps/collect/src/components/ui/StarRating.tsx
interface StarRatingProps {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  required?: boolean;
}

export default function StarRating({ label, value, onChange, required }: StarRatingProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-neutral-700">
        {label} {required && <span className="text-brand-600">*</span>}
      </span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="text-3xl leading-none"
            aria-label={`${star} étoiles`}
          >
            <span className={star <= (value ?? 0) ? 'text-brand-500' : 'text-neutral-200'}>★</span>
          </button>
        ))}
      </div>
    </div>
  );
}