//apps/showcase/src/features/product/components/FeatureBlock.tsx
interface FeatureBlockProps {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  reversed?: boolean;
  accentColor?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export default function FeatureBlock({
  eyebrow,
  title,
  description,
  points,
  reversed,
  accentColor = 'violet',
  imageSrc,
  imageAlt = '',
}: FeatureBlockProps) {
  return (
    <div className={`flex flex-col gap-8 md:flex-row ${reversed ? 'md:flex-row-reverse' : ''} md:items-center`}>
      <div className="flex-1">
        <span className={`font-mono text-[11px] uppercase tracking-wider text-${accentColor}-500`}>{eyebrow}</span>
        <h2 className="mt-2 font-display text-2xl font-medium text-ink md:text-3xl">{title}</h2>
        <p className="mt-3 text-neutral-600">{description}</p>
        <ul className="mt-5 flex flex-col gap-2">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-neutral-700">
              <span className="mt-0.5 text-teal">✓</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1">
        {imageSrc ? (
          <div className="overflow-hidden rounded-2xl border border-neutral-200 shadow-[0_8px_30px_rgba(23,26,43,0.08)]">
            <img src={imageSrc} alt={imageAlt} className="w-full object-cover object-top" />
          </div>
        ) : (
          <div className="aspect-[4/3] rounded-2xl bg-violet-gradient opacity-90" />
        )}
      </div>
    </div>
  );
}