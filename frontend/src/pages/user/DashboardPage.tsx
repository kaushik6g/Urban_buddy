import { useEffect, useMemo, useState } from 'react';
import { complaintApi, userApi } from '../../api/services';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import type { Complaint } from '../../types';

const DashboardPage = () => {
  const { user } = useAuth();
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [complaintError, setComplaintError] = useState(false);

  useEffect(() => {
    let active = true;
    const refreshComplaints = () => {
      complaintApi.my().then(({ data }) => {
        if (active) {
          setMyComplaints(data.data);
          setComplaintError(false);
        }
      }).catch(() => {
        if (active) setComplaintError(true);
      });
    };
    refreshComplaints();
    window.addEventListener('focus', refreshComplaints);
    const timer = window.setInterval(refreshComplaints, 15000);
    userApi.leaderboard().then(({ data }) => {
      if (active) setLeaderboard(data.data);
    }).catch(() => {
      if (active) setLeaderboard([]);
    });
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshComplaints);
    };
  }, [user?.id]);

  const stats = useMemo(() => {
    const total = myComplaints.length;
    const resolved = myComplaints.filter((c) => c.status === 'Resolved').length;
    const inProgress = myComplaints.filter((c) => c.status === 'In Progress').length;
    return { total, resolved, inProgress };
  }, [myComplaints]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Hello, {user?.name}</h2>
        <p className="mt-1 text-sm text-slate-600">Track reports, earn points, and make your city better.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="border-sky-100 bg-gradient-to-b from-white to-sky-50">
          <p className="text-sm text-slate-500">Points</p>
          <p className="mt-2 text-3xl font-black text-sky-700">{user?.points ?? 0}</p>
        </Card>
        <Card className="border-cyan-100 bg-gradient-to-b from-white to-cyan-50">
          <p className="text-sm text-slate-500">Complaints Submitted</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{stats.total}</p>
        </Card>
        <Card className="border-amber-100 bg-gradient-to-b from-white to-amber-50">
          <p className="text-sm text-slate-500">In Progress</p>
          <p className="mt-2 text-3xl font-black text-amber-700">{stats.inProgress}</p>
        </Card>
        <Card className="border-emerald-100 bg-gradient-to-b from-white to-emerald-50">
          <p className="text-sm text-slate-500">Resolved</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">{stats.resolved}</p>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white/95 shadow-md shadow-slate-100">
          <h3 className="text-lg font-black tracking-tight text-slate-900">Recent Complaints</h3>
          <div className="mt-4 space-y-3">
            {myComplaints.slice(0, 5).map((complaint) => (
              <div key={complaint.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-800">{complaint.title}</p>
                  <Badge text={complaint.status} />
                </div>
                <p className="text-xs text-slate-500">{complaint.category}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(complaint.createdAt).toLocaleString()}</p>
                {complaint.status === 'Rejected' && complaint.rejectNote && (
                  <p className="mt-2 rounded-lg border border-rose-100 bg-rose-50 px-2 py-1 text-xs text-rose-700">
                    Rejected Reason: {complaint.rejectNote}
                  </p>
                )}
                {complaint.status !== 'Rejected' && complaint.progressNote && (
                  <p className="mt-2 rounded-lg border border-sky-100 bg-sky-50 px-2 py-1 text-xs text-sky-700">
                    Latest Update: {complaint.progressNote}
                  </p>
                )}
              </div>
            ))}
            {complaintError && <p role="alert">Could not refresh complaints.</p>}
            {!complaintError && !myComplaints.length && <p className="text-sm text-slate-500">No complaints yet.</p>}
          </div>
        </Card>

        <Card className="bg-white/95 shadow-md shadow-slate-100">
          <h3 className="text-lg font-black tracking-tight text-slate-900">Top Contributors</h3>
          <div className="mt-4 space-y-2">
            {leaderboard.map((item) => (
              <div
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2"
                key={item.id}
              >
                <p className="text-sm font-medium text-slate-700">
                  #{item.rank} {item.name}
                </p>
                <p className="text-sm font-bold text-sky-700">{item.points} pts</p>
              </div>
            ))}
            {!leaderboard.length && <p className="text-sm text-slate-500">Leaderboard unavailable.</p>}
          </div>
        </Card>
      </section>
    </div>
  );
};

export default DashboardPage;
