import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PasswordField from '../../components/ui/PasswordField';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';

type Mode = 'reset' | 'change' | 'backup';
export default function PasswordRecoveryPage({ account = false, embedded = false }: { account?: boolean; embedded?: boolean }) {
  const { user, logout } = useAuth();
  const [mode, setMode] = useState<Mode>(embedded ? 'backup' : account ? 'change' : 'reset');
  const [email,setEmail] = useState('');
  const [code,setCode] = useState('');
  const [current,setCurrent] = useState('');
  const [password,setPassword] = useState('');
  const [confirm,setConfirm] = useState('');
  const [codes,setCodes] = useState<string[]>([]);
  const [error,setError] = useState('');
  const [done,setDone] = useState(false);
  const [busy,setBusy] = useState(false);
  function switchMode(next: Mode) {
    setMode(next); setError(''); setCodes([]); setPassword(''); setConfirm(''); setCurrent('');
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    if (mode !== 'backup' && confirm !== password) { setError('The passwords do not match.'); return; }
    setBusy(true);
    try {
      if (mode === 'backup') {
        const {data} = await api.post('/auth/backup-codes', {currentPassword:current});
        setCodes(data.codes);
      } else {
        if (mode === 'change') await api.post('/auth/change-password', {currentPassword:current,password});
        else await api.post('/auth/reset-password', {email,code,password});
        setDone(true); setCode(''); setPassword(''); setConfirm('');
      }
      setCurrent('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not complete this request. Please try again.');
    } finally { setBusy(false); }
  }
  const Heading = embedded ? 'h2' : 'h1';
  const panel = <Card className={embedded ? "md:col-span-2" : "w-full max-w-md"}>
      <Heading className="text-2xl font-semibold">{account ? 'Account security' : 'Reset your password'}</Heading>
      {done ? <div className="my-4 space-y-3"><p role="status">Your password has changed. Sign in with your new password.</p>
        <Link to="/login" onClick={logout} className="font-semibold text-leaf">Sign in</Link></div> : <>
        {account && <div className="my-4 flex gap-2">{(['change','backup'] as const).map(item =>
          <Button key={item} disabled={busy} variant={item === mode ? 'primary' : 'ghost'} onClick={() => switchMode(item)}>
            {item === 'change' ? 'Change password' : 'Backup codes'}</Button>)}</div>}
        {codes.length > 0 ? <section className="my-4 space-y-3"><p role="status">Save these codes somewhere private. Each works once and this is the only time they are shown.</p>
          <ul className="font-mono text-sm">{codes.map(item => <li className="break-all py-1" key={item}>{item}</li>)}</ul>
          <Button onClick={() => setCodes([])}>I’ve saved my codes</Button></section> :
        <form className="my-4 space-y-4" onSubmit={submit}>
          {mode === 'reset' ? <>
            <p>Enter a backup code from Profile or a temporary code from your community admin. Temporary codes expire after 10 minutes.</p>
            <label className="field-label">Account email<Input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} /></label>
            <label className="field-label">Recovery code<Input required autoComplete="one-time-code" spellCheck={false} value={code} onChange={e=>setCode(e.target.value)} /></label>
          </> : <>
            {mode === 'backup' && <p>Generate five single-use codes. Generating a new set replaces your existing codes.
              {user?.role === 'user' && user.communityId && ' This also enables your current community admin to issue a temporary code if you lose them.'}</p>}
            <PasswordField required label="Current password" autoComplete="current-password" value={current} onChange={e=>setCurrent(e.target.value)} />
          </>}
          {mode !== 'backup' && <>
            <PasswordField required minLength={6} label="New password (6 characters minimum)" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} />
            <PasswordField required label="Confirm new password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} />
          </>}
          {error && <p role="alert" className="text-rose-700">{error}</p>}
          <Button type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'backup' ? 'Generate backup codes' : 'Save new password'}</Button>
        </form>}
        {!embedded && <Link className="text-sm font-semibold text-leaf" to={account ? user?.role === 'admin' ? '/admin' : '/profile' : '/login'}>{account ? 'Back to account' : 'Back to sign in'}</Link>}
      </>}
    </Card>;
  return embedded ? panel : <main className="flex min-h-screen items-center justify-center bg-paper p-4">{panel}</main>;
}
