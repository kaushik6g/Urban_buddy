import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleRoute from './components/layout/RoleRoute';
import RootRedirect from './components/layout/RootRedirect';
import UserLayout from './components/layout/UserLayout';
import LoginPage from './pages/auth/LoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import DashboardPage from './pages/user/DashboardPage';

const PasswordRecoveryPage = lazy(() => import('./pages/auth/PasswordRecoveryPage'));

const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

const AdminProgressPage = lazy(() => import('./pages/admin/AdminProgressPage'));

const AdminReviewPage = lazy(() => import('./pages/admin/AdminReviewPage'));

const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));

const ComplaintsPage = lazy(() => import('./pages/user/ComplaintsPage'));

const ProfilePage = lazy(() => import('./pages/user/ProfilePage'));

const ReportIssuePage = lazy(() => import('./pages/user/ReportIssuePage'));

const loadingPage = <p role="status" className="p-4 text-sm text-muted">Loading page…</p>;

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<Suspense fallback={loadingPage}><PasswordRecoveryPage key="reset" /></Suspense>} />
      <Route path="/reset-password" element={<Navigate to="/forgot-password" replace />} />
      <Route path="/register" element={<Suspense fallback={loadingPage}><RegisterPage /></Suspense>} />

      <Route element={<ProtectedRoute />}>
        <Route path="/account/security" element={<Suspense fallback={loadingPage}><PasswordRecoveryPage key="account" account /></Suspense>} />
        <Route element={<RoleRoute role="user" />}>
          <Route element={<UserLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/report" element={<Suspense fallback={loadingPage}><ReportIssuePage /></Suspense>} />
            <Route path="/complaints" element={<Suspense fallback={loadingPage}><ComplaintsPage /></Suspense>} />
            <Route path="/updates" element={<Navigate to="/dashboard" replace />} />
            <Route path="/profile" element={<Suspense fallback={loadingPage}><ProfilePage /></Suspense>} />
          </Route>
        </Route>

        <Route element={<RoleRoute role="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<Suspense fallback={loadingPage}><AdminUsersPage /></Suspense>} />
            <Route path="/admin/review" element={<Suspense fallback={loadingPage}><AdminReviewPage /></Suspense>} />
            <Route path="/admin/progress" element={<Suspense fallback={loadingPage}><AdminProgressPage /></Suspense>} />
          </Route>
        </Route>
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
