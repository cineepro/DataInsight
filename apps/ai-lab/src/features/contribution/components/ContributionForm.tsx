//apps/ai-lab/src/features/contribution/components/ContributionForm.tsx
import { useState } from 'react';
import { submitContribution } from '../../../api/contribution';

const SECTOR_OPTIONS = [
  { label: 'Général', value: 'GENERAL' },
  { label: 'Restauration', value: 'RESTAURATION' },
  { label: 'Hôtellerie', value: 'HOTELLERIE' },
  { label: 'Pharmacie', value: 'PHARMACIE' },
  { label: 'Commerce de détail', value: 'COMMERCE_DETAIL' },
];

export default function ContributionForm() {
  const [title, setTitle] = useState('');
  const [sector, setSector] = useState('GENERAL');
  const [content, setContent] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [contributorContact, setContributorContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = title.trim().length > 0 && content.trim().length >= 50;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitContribution({
        title: title.trim(),
        sector,
        content: content.trim(),
        contributorName: contributorName.trim() || undefined,
        contributorContact: contributorContact.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-teal/30 bg-teal/5 p-6 text-center">
        <p className="text-sm font-medium text-teal">Merci pour votre contribution !</p>
        <p className="mt-2 text-xs text-neutral-500">
          Elle sera relue par notre équipe avant d'être intégrée à la base de connaissances de l'assistant.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setTitle('');
            setContent('');
          }}
          className="mt-4 text-xs text-ink underline"
        >
          Faire une autre contribution
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6">
      <div>
        <h3 className="font-display text-lg font-medium text-ink">Partagez votre expertise</h3>
        <p className="mt-1 text-xs text-neutral-500">
          Vous connaissez bien votre secteur ? Partagez une bonne pratique, une observation terrain, ou une
          information précise — elle sera relue avant d'enrichir l'assistant IA.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Secteur concerné</label>
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
        >
          {SECTOR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Titre</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={128}
          placeholder="Ex: Gestion des pics de commande le week-end"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Votre contenu ({content.length}/2000, 50 caractères minimum)
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Décrivez une observation concrète, une pratique qui fonctionne bien chez vous, un conseil précis..."
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Votre nom (optionnel)</label>
          <input
            type="text"
            value={contributorName}
            onChange={(e) => setContributorName(e.target.value)}
            placeholder="Pour être crédité"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Contact (optionnel)</label>
          <input
            type="text"
            value={contributorContact}
            onChange={(e) => setContributorContact(e.target.value)}
            placeholder="Email ou téléphone"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      {error && <p className="text-sm text-brick">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="rounded-full bg-marigold-500 py-2.5 text-sm font-medium text-ink transition disabled:opacity-40"
      >
        {submitting ? 'Envoi...' : 'Envoyer ma contribution'}
      </button>

      <p className="text-center text-xs text-neutral-400">3 contributions par jour maximum.</p>
    </form>
  );
}