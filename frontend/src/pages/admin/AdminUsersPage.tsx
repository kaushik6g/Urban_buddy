import api from '../../api/client';
import { useEffect, useState } from 'react';
import { userApi } from '../../api/services';
import Card from '../../components/ui/Card';

const AdminUsersPage = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [email, setEmail] = useState('');
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
      await api.post('/admin/members', {action, email, id});
      setEmail('');
      load();
    } catch { window.alert('Could not update membership. Add an existing user who has no community.'); }
  };

  return (
    <div className="space-y-5"><Card><h2 className="text-2xl font-semibold">Community users</h2>
      <form className="my-4 flex flex-wrap gap-2" onSubmit={event => {event.preventDefault(); void manage("add");}}>
        <input required type="email" aria-label="Member email" placeholder="Existing user email" value={email} onChange={event => setEmail(event.target.value)} className="rounded border border-line px-3 py-2" /><button>Add user</button>
      </form>
      {leaderboard.map(member => <div key={member.id} className="flex justify-between border-t border-line py-2">{member.name}<button className="text-red-800" onClick={() => manage("remove", member.id)}>Remove</button></div>)}
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
