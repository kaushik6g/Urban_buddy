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
    <Card>
      <h2 className="text-2xl font-semibold tracking-tight text-ink">Users & Leaderboard</h2>
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
    </Card>
  );
};

export default AdminUsersPage;
