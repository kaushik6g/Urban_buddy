import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import PasswordField from '../../components/ui/PasswordField';

export default function PasswordRecoveryPage({ reset = false }: { reset?: boolean }) {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const validLink = /^[a-f0-9]{64}$/.test(token);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    if (reset && password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      if (reset) await api.post('/auth/reset-password', { token, password });
      else await api.post('/auth/forgot-password', { email });
      if (reset) window.history.replaceState(window.history.state, '', window.location.pathname);
      setPassword('');
      setConfirmation('');
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not complete this request. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-semibold">{reset ? 'Set a new password' : 'Forgot password?'}</h1>
        {done ? <p role="status" className="my-4">{reset ? 'Password changed. Sign in with your new password.'
          : 'If an account uses this email, check your inbox for a reset link. The link expires in 15 minutes.'}</p>
        : reset && !validLink ? <p role="alert" className="my-4">Open the link from your email or request a new one.</p>
        : <form onSubmit={submit} className="my-4 space-y-4">
            {reset ? <>
              <PasswordField label="New password (6 characters minimum)" autoComplete="new-password" required
                minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
              <PasswordField label="Confirm new password" autoComplete="new-password" required
                value={confirmation} onChange={e => setConfirmation(e.target.value)} />
            </> : <label className="field-label">Account email
              <Input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </label>}
            {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
            <Button type="submit" disabled={busy}>{busy ? 'Please wait…' : reset ? 'Save password' : 'Send reset link'}</Button>
          </form>}
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-leaf">
          <Link to="/login">Back to sign in</Link>
          {reset && !done && <Link to="/forgot-password">Request a new link</Link>}
        </div>
      </Card>
    </main>
  );
}
