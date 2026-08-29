//apps/showcase/src/components/Footer.tsx
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { CONTACT, EXTERNAL_LINKS, mailtoLink } from '../config/contact';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-neutral-500">
            Solutions numériques pour l'Afrique de l'Ouest — Cotonou, Bénin.
          </p>
        </div>

        <div>
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-neutral-400">Produit</h3>
          <div className="flex flex-col gap-2 text-sm text-neutral-600">
            <Link to="/produit" className="hover:text-ink">DataInsight</Link>
            <Link to="/secteurs" className="hover:text-ink">Secteurs</Link>
            <Link to="/tarifs" className="hover:text-ink">Tarifs</Link>
            <a href={EXTERNAL_LINKS.aiLab} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
              AI Lab
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-neutral-400">Ressources</h3>
          <div className="flex flex-col gap-2 text-sm text-neutral-600">
            <Link to="/documentation" className="hover:text-ink">Documentation</Link>
            <Link to="/developpeurs" className="hover:text-ink">API pour développeurs</Link>
            <Link to="/actualites" className="hover:text-ink">Actualités</Link>
            <Link to="/a-propos" className="hover:text-ink">À propos</Link>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-neutral-400">Contact</h3>
          <div className="flex flex-col gap-2 text-sm text-neutral-600">
            <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
              WhatsApp
            </a>
            <a href={mailtoLink('Demande d\'information')} className="hover:text-ink">
              {CONTACT.email}
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200 px-5 py-4 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} ASILLIA. Tous droits réservés.
      </div>
    </footer>
  );
}