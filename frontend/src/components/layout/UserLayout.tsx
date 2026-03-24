import { NavLink, Outlet } from 'react-router-dom';
import { Bell, Flag, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/report', label: 'Report Issue', icon: Flag },
  { to: '/complaints', label: 'Complaints', icon: Bell },
  { to: '/profile', label: 'Profile', icon: UserIcon },
];

const UserLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_5%_5%,_#ccfbf1_0%,_#f1f5f9_40%,_#ecfeff_100%)]">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-4 py-3 lg:px-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">UrbanBuddy</h1>
            <p className="text-xs text-slate-500">Citizen Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-right shadow-sm sm:block">
              <p className="text-xs text-slate-500">Signed in as</p>
              <p className="text-sm font-semibold text-slate-700">{user?.name}</p>
            </div>
            <button
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              onClick={logout}
              type="button"
            >
              <span className="inline-flex items-center gap-1">
                <LogOut size={16} /> Logout
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[240px_1fr] lg:px-6">
        <aside className="h-fit rounded-3xl border border-white/80 bg-white/85 p-3.5 shadow-lg shadow-cyan-100/60 backdrop-blur">
          <nav className="space-y-1.5">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-md shadow-sky-200'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="rounded-3xl border border-white/70 bg-white/50 p-3 shadow-inner shadow-cyan-50/60 backdrop-blur sm:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
