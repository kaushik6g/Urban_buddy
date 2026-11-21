import PortalLayout from './PortalLayout';
import { ClipboardCheck, LayoutDashboard, RefreshCcw, Users } from 'lucide-react';

const adminLinks = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/review', label: 'Complaint Review', icon: ClipboardCheck },
  { to: '/admin/progress', label: 'Progress Updates', icon: RefreshCcw },
];

export default function AdminLayout() {
  return <PortalLayout portal="Administration" links={adminLinks} />;
}
