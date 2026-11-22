import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';

// These values only prefill the form. Registration validates the community code on the server.
function readInvitation(): { email?: string; code?: string; error?: string } | undefined {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const error = 'This invitation is invalid or has expired. Ask your admin for a fresh invitation.';
  if (params.has('error') || params.has('error_code')) return { error };
  const token = params.get('access_token');
  if (!token) return window.history.state?.urbanBuddyInvite as { email: string; code: string } | undefined;
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(payload), c => c.charCodeAt(0))));
    const code = claims.user_metadata?.communityCode;
    if (claims.exp <= Date.now() / 1000 || typeof claims.email !== 'string' || typeof code !== 'string' || !code.trim()) return { error };
    return { email: claims.email as string, code: code.trim() };
  } catch {
    return { error };
  }
}

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [invite] = useState(readInvitation);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(invite?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [communityName, setCommunityName] = useState('');
  const [communityCode, setCommunityCode] = useState(invite?.code || '');
  const [error, setError] = useState(invite && 'error' in invite ? invite.error || '' : '');

  useEffect(() => {
    if (!invite || !window.location.hash) return;
    window.history.replaceState(
      { ...window.history.state, urbanBuddyInvite: invite.email ? { email: invite.email, code: invite.code } : undefined },
      '', window.location.pathname + window.location.search
    );
  }, [invite]);

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
                onChange={(e) => { setRole(e.target.value as 'user' | 'admin'); setCommunityCode(''); }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            {role === 'admin' ? (
              <>
              <label className="field-label">
                Community name
                <Input
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  required
                />
              </label>
              <label className="field-label">Permanent invite code
                <Input placeholder="Leave blank to generate a unique code" value={communityCode} minLength={4} maxLength={12} onChange={(event) => setCommunityCode(event.target.value.toUpperCase())} />
                <small>Choose a custom code or leave blank. The code cannot be changed after registration.</small>
              </label></>
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
