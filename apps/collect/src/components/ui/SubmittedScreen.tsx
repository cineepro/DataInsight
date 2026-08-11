//apps/collect/src/components/ui/SubmittedScreen.tsx
export default function SubmittedScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ticket p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-teal text-teal">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="font-display text-xl font-medium text-ink">Merci pour votre retour !</h2>
      <p className="text-sm text-neutral-500">Votre avis a bien été enregistré.</p>
    </div>
  );
}