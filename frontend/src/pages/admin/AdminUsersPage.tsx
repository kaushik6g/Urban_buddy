import PasswordField from '../../components/ui/PasswordField';
import api from '../../api/client';
import { useEffect, useState } from 'react';
import { userApi } from '../../api/services';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const AdminUsersPage = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [resetMember, setResetMember] = useState<{id:string;name:string} | null>(null);
  const [currentPassword,setCurrentPassword] = useState('');
  const [temporary,setTemporary] = useState('');
  const [issuing,setIssuing] = useState(false);
  const [issueError,setIssueError] = useState('');
  function selectMember(member: typeof resetMember) {
    setResetMember(member); setTemporary(''); setCurrentPassword(''); setIssueError('');
  }
  async function issueCode(event: React.FormEvent) {
    event.preventDefault();
    if (!resetMember || issuing) return;
    setIssuing(true); setIssueError('');
    try {
      const {data} = await api.post('/auth/member-reset-code', {memberId:resetMember.id,currentPassword});
      setTemporary(data.code);
    } catch (err:any) { setIssueError(err.response?.data?.message || 'Could not generate a code.'); }
    finally { setCurrentPassword(''); setIssuing(false); }
  }
  const [email, setEmail] = useState('');
  const [link, setLink] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState<{email:string; expires_at:string}[]>([]);
  const [recipient, setRecipient] = useState('');
  const refreshInvites = () => {
    api.get('/admin/invitations').then(({data}) => setPending(data))
      .catch(() => setNotice('Could not load pending invitations.'));
  };
  useEffect(() => {
    refreshInvites();
    window.addEventListener('focus', refreshInvites);
    return () => window.removeEventListener('focus', refreshInvites);
  }, []);
  const revoke = async (address: string) => {
    try {
      await api.delete('/admin/invitations', {data:{email:address}});
      if (recipient === address) setLink('');
      refreshInvites();
      setNotice('Invitation revoked.');
    } catch { setNotice('Could not revoke the invitation.'); }
  };
  const load = () => {
    userApi
      .leaderboard()
      .then((response) => setLeaderboard(response.data.data))
      .catch(() => setLeaderboard([]));
  };
  useEffect(load, []);
  const manage = async (action: 'add' | 'remove', id?: string) => {
    if (action === 'remove' && !window.confirm('Remove this user from the community?')) return;
    try {
      const response = await api.post('/admin/members', {action, email, id});
      if (response.data?.token) {
        setRecipient(response.data.email);
        refreshInvites();
        setEmail('');
        setLink(window.location.origin + '/register#invite=' + response.data.token);
        setNotice('Share this link privately. It expires in seven days.');
        return;
      }
      setLink('');
      if (response.data?.message) window.alert(response.data.message);
      setEmail('');
      load();
    } catch (error: any) { window.alert(error.response?.data?.message || 'Could not update membership.'); }
  };

  return (
    <div className="space-y-5"><Card><h2 className="text-2xl font-semibold">Community users</h2>
      <form className="my-4 flex flex-wrap gap-2" onSubmit={event => { event.preventDefault(); void manage('add'); }}>
        <input required type="email" aria-label="Member email" placeholder="Member email address" value={email} onChange={event => setEmail(event.target.value)} className="min-w-0 flex-1 rounded-md border border-line px-3 py-2" />
        <Button type="submit">Add or invite</Button>
      </form>
      {notice && <p role="status" className="my-2 text-sm text-muted">{notice}</p>}
      {pending.length > 0 && <section className="my-5 rounded-lg border border-line bg-paper p-4">
        <h3 className="font-semibold">Pending invitations</h3>
        {pending.map(invite => <div key={invite.email} className="mt-3 border-t border-line pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="break-all font-medium">{invite.email}</p><p className="text-sm text-muted">Expires {new Date(invite.expires_at).toLocaleDateString()}</p></div>
            <Button variant="ghost" className="text-red-800" onClick={() => revoke(invite.email)}>Revoke link</Button>
          </div>
          {link && recipient === invite.email && <div className="mt-3 flex flex-wrap gap-2">
            <input className="min-w-0 flex-1 rounded-md border border-line bg-white px-3 text-sm" aria-label="Invitation link" readOnly value={link} onFocus={event => event.target.select()} />
            <Button onClick={async () => {
              try { await navigator.clipboard.writeText(link); setNotice('Link copied.'); }
              catch { setNotice('Select the link and copy it manually.'); }
            }}>Copy link</Button>
          </div>}
        </div>)}
      </section>}
      {leaderboard.map(member => <div key={member.id} className="border-t border-line py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-medium">{member.name}</p><p className="text-sm text-muted">Joined {new Date(member.joinedAt).toLocaleDateString()}</p></div>
        <Button variant="ghost" disabled={issuing} aria-expanded={resetMember?.id === member.id} onClick={() => selectMember(resetMember?.id === member.id ? null : member)}>Generate reset code</Button>
        <Button variant="ghost" className="text-red-800" onClick={() => manage('remove', member.id)}>Remove</Button>
        </div>
      {resetMember?.id === member.id && resetMember && <section className="my-4 rounded-md border border-line p-4">
        <h3 className="font-semibold">Password recovery for {resetMember.name}</h3>
        {temporary ? <p role="status">Share this code privately: <strong className="font-mono">{temporary}</strong>. It expires in 10 minutes.</p>
          : <form onSubmit={issueCode} className="my-3 space-y-3">
            <p>Verify the member’s identity before issuing a code. The member must first enable recovery by generating backup codes in Profile. A new temporary code replaces the previous one.</p>
            <PasswordField label="Your admin password" autoFocus required autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} />
            {issueError && <p role="alert">{issueError}</p>}
            <Button type="submit" disabled={issuing}>{issuing ? 'Generating…' : 'Issue temporary code'}</Button>
          </form>}
        <Button variant="ghost" disabled={issuing} onClick={() => selectMember(null)}>Close</Button>
      </section>}
      </div>)}
    </Card><Card>
      <h2 className="text-2xl font-semibold tracking-tight text-ink">Leaderboard</h2>
      <p className="mt-1 text-sm text-muted">Top contributors ranked by impact points.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="py-3">Rank</th>
              <th className="py-3">Name</th>
              <th className="py-3">Points</th>
              <th className="py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((item) => (
              <tr className="border-t border-line text-ink" key={item.id}>
                <td className="py-3 font-semibold text-leaf">#{item.rank}</td>
                <td className="py-3 font-medium text-ink">{item.name}</td>
                <td className="py-3 font-semibold text-ink">{item.points}</td>
                <td className="py-3 text-muted">{new Date(item.joinedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!leaderboard.length && <p className="py-4 text-sm text-muted">No users found.</p>}
      </div>
    </Card></div>
  );
};

export default AdminUsersPage;
