import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
};

export default RootRedirect;
