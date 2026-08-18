//apps/showcase/src/components/Logo.tsx
interface LogoProps {
  className?: string;
  withText?: boolean;
}

export default function Logo({ className = '', withText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src="/logo-asillia.png" alt="ASILLIA" className="h-9 w-9 object-contain" />
      {withText && <span className="font-display text-lg font-semibold text-ink">ASILLIA</span>}
    </div>
  );
}