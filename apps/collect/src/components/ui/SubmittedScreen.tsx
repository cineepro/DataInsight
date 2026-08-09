// apps/collect/src/components/ui/SubmittedScreen.tsx
export default function SubmittedScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="text-4xl">✅</div>
      <h2 className="text-lg font-semibold text-neutral-900">Merci pour votre retour !</h2>
      <p className="text-sm text-neutral-500">Votre avis a bien été enregistré.</p>
    </div>
  );
}