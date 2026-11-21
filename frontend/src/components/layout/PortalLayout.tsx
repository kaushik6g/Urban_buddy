import { NavLink, Outlet } from 'react-router-dom';
import { LogOut, type LucideIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  portal: string;
  links: { to: string; label: string; icon: LucideIcon }[];
}

export default function PortalLayout({ portal, links }: Props) {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen">
      <a href="#content" className="sr-only focus:not-sr-only">Skip to content</a>
      <header className="bg-[#18392e] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span className="text-xl font-bold tracking-tight">UrbanBuddy</span>
            <span className="text-sm text-[#c8dbd2]">{portal}</span>
          </div>
          <div className="flex shrink-0 items-center gap-4 text-sm">
            <span className="hidden text-[#c8dbd2] sm:inline">{user?.name}</span>
            <button onClick={logout} type="button" className="flex items-center gap-2 rounded-sm py-2 font-medium hover:underline">
              <LogOut size={15} aria-hidden="true" /> Sign out
            </button>
          </div>
        </div>
        <nav aria-label={portal} className="mx-auto flex max-w-6xl flex-wrap gap-x-4 px-4 sm:gap-x-7 sm:px-8">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end className={({ isActive }) =>
              'inline-flex items-center gap-2 border-b-2 py-3 text-sm font-medium ' +
              (isActive ? 'border-[#a6d7bc] text-white' : 'border-transparent text-[#c8dbd2] hover:text-white')
            }>
              <Icon size={15} aria-hidden="true" />{label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-9">
        <Outlet />
      </main>
    </div>
  );
}
