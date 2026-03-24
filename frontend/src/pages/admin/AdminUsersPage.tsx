import { useEffect, useState } from 'react';
import { userApi } from '../../api/services';
import Card from '../../components/ui/Card';

const AdminUsersPage = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    userApi
      .leaderboard()
      .then((response) => setLeaderboard(response.data.data))
      .catch(() => setLeaderboard([]));
  }, []);

  return (
    <Card className="border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100">
      <h2 className="text-2xl font-black tracking-tight text-white">Users & Leaderboard</h2>
      <p className="mt-1 text-sm text-slate-400">Top contributors ranked by impact points.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
              <th className="py-3">Rank</th>
              <th className="py-3">Name</th>
              <th className="py-3">Points</th>
              <th className="py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((item) => (
              <tr className="border-t border-slate-800/90 text-slate-200" key={item.id}>
                <td className="py-3 font-semibold text-cyan-300">#{item.rank}</td>
                <td className="py-3 font-medium text-white">{item.name}</td>
                <td className="py-3 font-semibold text-emerald-300">{item.points}</td>
                <td className="py-3 text-slate-400">{new Date(item.joinedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!leaderboard.length && <p className="py-4 text-sm text-slate-400">No users found.</p>}
      </div>
    </Card>
  );
};

export default AdminUsersPage;
