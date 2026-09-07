// apps/studio/src/features/ai-lab/components/DraftReviewCard.tsx
import { useState } from 'react';
import type { KnowledgeBaseEntry } from '../../../api/aiLab';
import { updateKnowledgeBaseEntry, deleteKnowledgeBaseEntry } from '../../../api/aiLab';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

interface DraftReviewCardProps {
  entry: KnowledgeBaseEntry;
  onResolved: () => void;
}

/**
 * Écran de relecture humaine obligatoire — une proposition générée par
 * summarize-chat-logs n'a AUCUN effet sur le chat public tant qu'elle
 * reste ici. L'admin peut ajuster le texte avant de le publier, exactement
 * comme pour les directives IA des rapports hebdomadaires.
 */
export default function DraftReviewCard({ entry, onResolved }: DraftReviewCardProps) {
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [saving, setSaving] = useState(false);

  async function handleApprove() {
    setSaving(true);
    try {
      await updateKnowledgeBaseEntry(entry.$id, { title, content, status: 'PUBLISHED' });
      onResolved();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la publication.');
    } finally {
      setSaving(false);
    }
  }

  async function handleReject() {
    if (!confirm('Rejeter et supprimer cette proposition ?')) return;
    setSaving(true);
    try {
      await deleteKnowledgeBaseEntry(entry.$id);
      onResolved();
    } catch (err) {
      console.error(err);
      alert('Erreur lors du rejet.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
  <div className="flex items-center gap-2">
    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">{entry.sector}</span>
    {entry.origin === 'PUBLIC_CONTRIBUTION' && (
      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-600">
        Contribution publique{entry.contributor_name ? ` — ${entry.contributor_name}` : ''}
      </span>
    )}
    {entry.origin === 'AI_SUGGESTED' && (
      <span className="rounded-full bg-marigold-500/15 px-2 py-0.5 text-xs text-marigold-600">Proposé par l'IA</span>
    )}
    {entry.origin === 'OFFICIAL_SOURCE' && (
      <span className="rounded-full bg-teal/15 px-2 py-0.5 text-xs text-teal">
        Source officielle{entry.source_document_name ? ` — ${entry.source_document_name}` : ''}
      </span>
    )}
  </div>
  {entry.source_question_count && (
    <span className="text-xs text-neutral-400">
      Basé sur {entry.source_question_count} question{entry.source_question_count > 1 ? 's' : ''}
    </span>
  )}
</div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-2 w-full border-0 border-b border-neutral-200 bg-transparent px-0 py-1 text-sm font-medium text-ink focus:border-ink focus:outline-none"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        className="mb-3 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
      />

      <div className="flex gap-2">
        <Button onClick={handleApprove} loading={saving}>
          Approuver et publier
        </Button>
        <Button variant="danger" onClick={handleReject} disabled={saving}>
          Rejeter
        </Button>
      </div>
    </Card>
  );
}