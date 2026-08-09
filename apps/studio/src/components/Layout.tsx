//apps/studio/src/components/Layout.tsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import Button from './ui/Button';

const NAV_LINKS = [
  { to: '/', label: 'Studio', end: true },
  { to: '/tenants', label: 'Structures' },
  { to: '/reports', label: 'Rapports' },
];

export default function Layout() {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-neutral-900">ASILLIA Studio</span>
          <nav className="flex gap-4">
            {NAV_LINKS.map((link) => (
              <NavLink
  key={link.to}
  to={link.to}
  end={link.end}
  className={({ isActive }: { isActive: boolean }) =>
    `text-sm ${isActive ? 'font-medium text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`
  }
>
  {link.label}
</NavLink>
            ))}
          </nav>
        </div>
        <Button variant="secondary" onClick={handleLogout}>
          Déconnexion
        </Button>
      </header>

      <Outlet />
    </div>
  );
}