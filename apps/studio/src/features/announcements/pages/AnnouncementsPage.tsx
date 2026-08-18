// apps/studio/src/features/announcements/pages/AnnouncementsPage.tsx
import { useEffect, useState } from 'react';
import type { Announcement } from '@datainsight/shared';
import {
  listAllAnnouncements,
  createAnnouncement,
  publishAnnouncement,
  unpublishAnnouncement,
  deleteAnnouncement,
} from '../../../api/announcements';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setItems(await listAllAnnouncements());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createAnnouncement(title, content);
      setTitle('');
      setContent('');
      await refresh();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6">
        <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Site vitrine</span>
        <h1 className="font-display text-2xl font-medium text-ink">Actualités</h1>
      </div>

      <Card className="mb-6">
        <h3 className="mb-4 text-sm font-medium text-ink">Nouvelle annonce</h3>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Contenu</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>
          <Button type="submit" loading={saving}>
            Créer en brouillon
          </Button>
        </form>
      </Card>

      {loading ? (
        <p className="text-sm text-neutral-400">Chargement...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item.$id}>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium text-ink">{item.title}</h4>
                <Badge status={item.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'} />
              </div>
              <p className="mb-3 text-sm text-neutral-600">{item.content}</p>
              <div className="flex gap-2">
                {item.status === 'DRAFT' ? (
                  <Button onClick={() => publishAnnouncement(item.$id).then(refresh)}>Publier</Button>
                ) : (
                  <Button variant="secondary" onClick={() => unpublishAnnouncement(item.$id).then(refresh)}>
                    Dépublier
                  </Button>
                )}
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm('Supprimer cette annonce ?')) deleteAnnouncement(item.$id).then(refresh);
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}