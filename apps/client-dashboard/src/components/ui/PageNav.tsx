//apps/client-dashboard/src/components/ui/PageNav.tsx
import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Bulletin', end: true },
  { to: '/statistics', label: 'Statistiques' },
];

export default function PageNav() {
  return (
    <nav className="no-print mb-2 flex justify-center gap-6">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            `pb-2 text-sm transition ${
              isActive ? 'border-b-2 border-ink font-medium text-ink' : 'text-neutral-400 hover:text-neutral-600'
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}