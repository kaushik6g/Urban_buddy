import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminLogin, setAdminLogin] = useState(false);
  const [communityCode, setCommunityCode] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      const loggedInUser = await login(email, password, adminLogin ? undefined : communityCode.trim().toUpperCase());
      navigate(loggedInUser.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(140deg,#ecfeff_10%,#f8fafc_45%,#cffafe_100%)] p-4">
      <Card className="w-full max-w-md border-white/70 bg-white/80 shadow-xl">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Welcome Back</h1>
        <p className="mt-1 text-sm text-slate-600">Sign in to report and track civic issues.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {!adminLogin && (
            <Input aria-label="Community code" placeholder="Community code" value={communityCode}
              onChange={(e) => setCommunityCode(e.target.value.toUpperCase())} required />
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <Button className="w-full" disabled={loading} type="submit">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={adminLogin} onChange={(e) => setAdminLogin(e.target.checked)} />
            Sign in as an admin
          </label>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          New here?{' '}
          <Link className="font-semibold text-sky-700" to="/register">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default LoginPage;
