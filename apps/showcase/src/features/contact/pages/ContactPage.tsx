//apps/showcase/src/features/contact/pages/ContactPage.tsx
import PageShell from '../../../components/PageShell';
import { CONTACT, mailtoLink } from '../../../config/contact';

export default function ContactPage() {
  return (
    <PageShell>
      <section className="px-5 py-16">
        <div className="mx-auto max-w-xl text-center">
          <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Contact</span>
          <h1 className="mt-2 font-display text-4xl font-medium text-ink">Parlons de votre activité</h1>
          <p className="mt-4 text-neutral-600">
            Que vous soyez prêt à démarrer votre mois d'essai ou simplement curieux, écrivez-nous par le canal de
            votre choix — nous répondons rapidement.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href={CONTACT.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-5 transition hover:border-teal"
            >
              <span className="text-2xl">💬</span>
              <div className="text-left">
                <p className="text-sm font-medium text-ink">WhatsApp</p>
                <p className="text-xs text-neutral-500">Réponse rapide</p>
              </div>
            </a>

            <a
              href={mailtoLink("Demande d'information — DataInsight")}
              className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-5 transition hover:border-violet-500"
            >
              <span className="text-2xl">✉️</span>
              <div className="text-left">
                <p className="text-sm font-medium text-ink">Email</p>
                <p className="text-xs text-neutral-500">{CONTACT.email}</p>
              </div>
            </a>
          </div>

          <p className="mt-10 text-xs text-neutral-400">
            Basés à Cotonou, Bénin — nous accompagnons des structures partout en Afrique de l'Ouest.
          </p>
        </div>
      </section>
    </PageShell>
  );
}