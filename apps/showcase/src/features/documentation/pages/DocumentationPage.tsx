//apps/showcase/src/features/documentation/pages/DocumentationPage.tsx
import { DOC_SECTIONS } from '../data/docSections';
import PageShell from '../../../components/PageShell';
import { mailtoLink } from '../../../config/contact';

export default function DocumentationPage() {
  return (
    <PageShell>
      <section className="px-5 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Documentation</span>
            <h1 className="mt-2 font-display text-4xl font-medium text-ink">Comment fonctionne DataInsight</h1>
          </div>

          <nav className="mb-12 flex flex-wrap justify-center gap-3 border-b border-neutral-200 pb-6">
            {DOC_SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="text-sm text-violet-600 hover:underline">
                {s.title}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-14">
            {DOC_SECTIONS.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="mb-4 font-display text-2xl font-medium text-ink">{section.title}</h2>
                <div className="flex flex-col gap-3">
                  {section.content.map((paragraph, i) => (
                    <p key={i} className="text-sm leading-relaxed text-neutral-600">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
            <h3 className="font-display text-xl font-medium text-ink">Une question précise ?</h3>
            <p className="mt-2 text-sm text-neutral-600">Écrivez-nous directement, nous répondons rapidement.</p>
            <a
              href={mailtoLink('Question sur DataInsight')}
              className="mt-4 inline-block rounded-full bg-violet-gradient px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Nous écrire
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}