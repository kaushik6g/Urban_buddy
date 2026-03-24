import { NavLink, Outlet } from 'react-router-dom';
import { ClipboardCheck, LayoutDashboard, LogOut, RefreshCcw, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const adminLinks = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/review', label: 'Complaint Review', icon: ClipboardCheck },
  { to: '/admin/progress', label: 'Progress Updates', icon: RefreshCcw },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,_#123055_0%,_#061326_32%,_#020617_62%,_#01030a_100%)] text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1320px] grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-cyan-950/60 bg-slate-950/70 p-5 backdrop-blur-xl">
          <div className="mb-7 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="text-2xl font-black tracking-tight text-white">UrbanBuddy Admin</h2>
            <p className="mt-1 text-sm text-slate-400">{user?.email}</p>
          </div>
          <nav className="space-y-1.5">
            {adminLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-lg shadow-cyan-900/35'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`
                  }
                >
                  <Icon size={16} className="transition-transform group-hover:scale-105" /> {item.label}
                </NavLink>
              );
            })}
          </nav>

          <button
            className="mt-8 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            onClick={logout}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <LogOut size={14} /> Logout
            </span>
          </button>
        </aside>

        <main className="p-5 lg:p-8">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/35 p-4 shadow-2xl shadow-cyan-950/20 backdrop-blur-sm lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
