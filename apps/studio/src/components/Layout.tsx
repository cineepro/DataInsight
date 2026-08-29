//apps/studio/src/components/Layout.tsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import Logo from './Logo';

const NAV_LINKS = [
  { to: '/', label: 'Studio', end: true },
  { to: '/tenants', label: 'Structures' },
  { to: '/customers', label: 'Clients' },
  { to: '/reports', label: 'Rapports' },
  { to: '/billing', label: 'Facturation' },
  { to: '/alerts', label: 'Alertes' },
  { to: '/datasets', label: 'Données brutes' },
  { to: '/statistics', label: 'Statistiques' },
  { to: '/ai-lab', label: 'AI Lab' },
  { to: '/thresholds', label: 'Seuils' },
  { to: '/announcements', label: 'Actualités' },
  { to: '/api-keys', label: 'Clés API' },
];

export default function Layout() {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-fog">
      {/* --- Sidebar desktop : fixe, ne défile jamais avec le contenu --- */}
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col overflow-y-auto border-r border-neutral-200 bg-white md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <Logo className="text-marigold-500" />
          <span className="font-display text-base font-medium text-ink">ASILLIA</span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm transition ${
                  isActive ? 'bg-ink text-white' : 'text-neutral-600 hover:bg-neutral-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mx-3 mb-5 rounded-md border border-neutral-200 px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-50"
        >
          Déconnexion
        </button>
      </aside>

      {/* --- Header mobile (inchangé) --- */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <Logo className="text-marigold-500" />
          <span className="font-display text-base font-medium text-ink">ASILLIA</span>
        </div>
        <button onClick={handleLogout} className="text-xs text-neutral-500">
          Déconnexion
        </button>
      </header>

      {/* --- Contenu : décalé de la largeur de la sidebar sur desktop,
          décalé vers le bas du header sur mobile, lui seul défile --- */}
      <main className="flex-1 pt-14 md:ml-56 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}