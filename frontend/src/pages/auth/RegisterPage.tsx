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
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Create an account</h1>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="field-label">
            Full name
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="field-label">
            Email
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field-label">
            Password (6 characters minimum)
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink">
              <span className="mb-1 block text-xs font-semibold text-muted">Account Type</span>
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
              <label className="field-label">
                Community name
                <Input
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  required
                />
              </label>
            ) : (
              <label className="field-label">
                Community code
                <Input
                  required
                  value={communityCode}
                  onChange={(e) => setCommunityCode(e.target.value.toUpperCase())}
                />
              </label>
            )}
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <Button className="w-full" disabled={loading} type="submit">
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Already registered?{' '}
          <Link className="font-semibold text-leaf" to="/login">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default RegisterPage;
