//apps/showcase/src/features/announcements/pages/AnnouncementsPage.tsx
import { useEffect, useState } from 'react';
import type { Announcement } from '@datainsight/shared';
import { listPublishedAnnouncements } from '../../../api/announcements';
import PageShell from '../../../components/PageShell';

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublishedAnnouncements()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <section className="px-5 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-10 text-center">
            <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Actualités</span>
            <h1 className="mt-2 font-display text-3xl font-medium text-ink">Les nouveautés ASILLIA</h1>
          </div>

          {loading ? (
            <p className="text-center text-sm text-neutral-400">Chargement...</p>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-neutral-400">Aucune annonce pour le moment.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {items.map((item) => (
                <article key={item.$id} className="border-b border-neutral-200 pb-6">
                  <span className="font-mono text-xs text-neutral-400">
                    {item.published_at &&
                      new Date(item.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <h2 className="mt-1 font-display text-xl font-medium text-ink">{item.title}</h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-600">{item.content}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}