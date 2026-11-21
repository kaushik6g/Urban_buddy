import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [communityName, setCommunityName] = useState('');
  const [communityCode, setCommunityCode] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      const createdUser = await register(
        name,
        email,
        password,
        role,
        communityName || undefined,
        communityCode || undefined
      );
      navigate(createdUser.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not create account');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(140deg,#ecfeff_10%,#f8fafc_45%,#cffafe_100%)] p-4">
      <Card className="w-full max-w-md border-white/70 bg-white/80 shadow-xl">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Create Account</h1>
        <p className="mt-1 text-sm text-slate-600">Start improving your city with UrbanBuddy.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            placeholder="Password (min 6 chars)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="grid gap-3 md:grid-cols-2">
            <label className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Account Type</span>
              <select
                className="w-full bg-transparent outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            {role === 'admin' ? (
              <Input
                placeholder="Community name"
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                required
              />
            ) : (
              <Input
                placeholder="Community code" required
                value={communityCode}
                onChange={(e) => setCommunityCode(e.target.value.toUpperCase())}
              />
            )}
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <Button className="w-full" disabled={loading} type="submit">
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link className="font-semibold text-sky-700" to="/login">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default RegisterPage;
