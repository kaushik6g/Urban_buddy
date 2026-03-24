import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types';

const RoleRoute = ({ role }: { role: UserRole }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return user.role === role ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export default RoleRoute;
