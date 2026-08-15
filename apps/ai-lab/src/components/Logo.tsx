// apps/ai-lab/src/components/Logo.tsx
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="none" className={className} aria-hidden="true">
      <rect x="0" y="9" width="4" height="7" rx="1" fill="currentColor" />
      <rect x="8" y="5" width="4" height="11" rx="1" fill="currentColor" />
      <rect x="16" y="0" width="4" height="16" rx="1" fill="currentColor" />
    </svg>
  );
}