import PasswordField from '../../components/ui/PasswordField';
import api from '../../api/client';
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

  const [linkToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('invite'));
  const [invite] = useState(readInvitation);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(invite?.email || '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const cutoffYear = Number(today.slice(0, 4)) - 18;
  // A leap-day signup can have a non-leap cutoff year.
  const cutoffDay = today.endsWith('-02-29') ? '-02-28' : today.slice(4);
  const latestBirthDate = String(cutoffYear) + cutoffDay;
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [communityName, setCommunityName] = useState('');
  const [communityCode, setCommunityCode] = useState(invite?.code || '');
  const [error, setError] = useState(invite && 'error' in invite ? invite.error || '' : '');

  useEffect(() => {
    if (linkToken) {
      let active = true;
      api.post('/auth/invite-details', {token:linkToken}).then(({data}) => {
        if (active) { setEmail(data.email); setCommunityCode(data.code); }
      }).catch(() => { if (active) setError('Invitation unavailable. Ask your admin for a new link.'); });
      return () => { active = false; };
    }
    if (!invite || !window.location.hash) return;
    window.history.replaceState(
      { ...window.history.state, urbanBuddyInvite: invite.email ? { email: invite.email, code: invite.code } : undefined },
      '', window.location.pathname + window.location.search
    );
  }, [invite, linkToken]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      if (linkToken) {
        await api.post('/auth/register', { name, email, password, dateOfBirth, role:'user', inviteToken:linkToken });
        navigate('/login', {replace:true});
        return;
      }
      const createdUser = await register(
        name,
        email,
        password,
        role,
        dateOfBirth,
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
              readOnly={Boolean(linkToken)} value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field-label">
            Date of birth
            <Input type="date" autoComplete="bday" required max={latestBirthDate}
              value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}
              aria-describedby="signup-age-note" />
          </label>
          <p id="signup-age-note" className="text-sm text-muted">You must be 18 or older to create an account.</p>
          <PasswordField label="Password (6 characters minimum)" autoComplete="new-password" required
            value={password} onChange={e => setPassword(e.target.value)} />

          <div className="grid gap-3 md:grid-cols-2">
            <label className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink">
              <span className="mb-1 block text-xs font-semibold text-muted">Account Type</span>
              <select
                className="w-full bg-transparent outline-none"
                disabled={Boolean(linkToken || invite)} value={role}
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
                  readOnly={Boolean(linkToken)} value={communityCode}
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
