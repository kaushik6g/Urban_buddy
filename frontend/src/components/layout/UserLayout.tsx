import PortalLayout from './PortalLayout';
import { Bell, Flag, LayoutDashboard, User as UserIcon } from 'lucide-react';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/report', label: 'Report Issue', icon: Flag },
  { to: '/complaints', label: 'Complaints', icon: Bell },
  { to: '/updates', label: 'Updates', icon: Bell },
  { to: '/profile', label: 'Profile', icon: UserIcon },
];

export default function UserLayout() {
  return <PortalLayout portal="Citizen portal" links={links} />;
}
