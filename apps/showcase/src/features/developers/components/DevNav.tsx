//apps/showcase/src/features/developers/components/DevNav.tsx
const SECTIONS = [
  { id: 'intro', label: "Vue d'ensemble" },
  { id: 'obtenir-cle', label: 'Obtenir une clé' },
  { id: 'astra-api', label: 'Astra API' },
  { id: 'analysis-api', label: 'Analysis Engine API' },
  { id: 'join-api', label: 'Data Join & Analysis' },
  { id: 'erreurs', label: "Codes d'erreur" },
  { id: 'quotas', label: 'Quotas et tarifs' },
];

export default function DevNav() {
  return (
    <nav className="sticky top-20 hidden w-48 shrink-0 flex-col gap-1 lg:flex">
      {SECTIONS.map((s) => (
        <a key={s.id} href={`#${s.id}`} className="rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-violet-100 hover:text-violet-600">
          {s.label}
        </a>
      ))}
    </nav>
  );
}