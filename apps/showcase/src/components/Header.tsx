//apps/showcase/src/components/Header.tsx
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Logo from './Logo';
import { EXTERNAL_LINKS } from '../config/contact';

const NAV_LINKS = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/produit', label: 'DataInsight' },
  { to: '/secteurs', label: 'Secteurs' },
  { to: '/documentation', label: 'Documentation' },
  { to: '/actualites', label: 'Actualités' },
  { to: '/tarifs', label: 'Tarifs' },
  { to: '/a-propos', label: 'À propos' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <NavLink to="/">
          <Logo />
        </NavLink>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `text-sm transition ${isActive ? 'font-medium text-violet-600' : 'text-neutral-600 hover:text-ink'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          
           <a href={EXTERNAL_LINKS.aiLab}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-violet-500 px-4 py-2 text-sm font-medium text-violet-600 transition hover:bg-violet-100">
            Essayer l'IA gratuitement
          </a>
          <NavLink
            to="/contact"
            className="rounded-full bg-violet-gradient px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Demander une démo
          </NavLink>
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden" aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="#171A2B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-neutral-200 px-5 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `text-sm ${isActive ? 'font-medium text-violet-600' : 'text-neutral-600'}`}
              >
                {link.label}
              </NavLink>
            ))}
            <a href={EXTERNAL_LINKS.aiLab} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-violet-600">
              Essayer l'IA gratuitement
            </a>
            <NavLink to="/contact" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-ink">
              Demander une démo
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
}