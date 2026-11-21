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

  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [complaintError, setComplaintError] = useState(false);

  useEffect(() => {
    let active = true;
    let requestInProgress = false;
    const refreshComplaints = () => {
      if (requestInProgress) return;
      requestInProgress = true;
      complaintApi.my().then(({ data }) => {
        if (active) {
          setMyComplaints(data.data);
          setComplaintError(false);
        }
      }).catch(() => {
        if (active) setComplaintError(true);
      }).finally(() => {
        requestInProgress = false;
        if (active) setComplaintsLoading(false);
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
      <section className="pb-1">
        <h2 className="text-3xl font-semibold tracking-tight text-ink">Your dashboard</h2>
      </section>

      <section aria-label="Summary" className="metric-strip">
        <div>
          <p className="text-sm text-muted">Points</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{user?.points ?? 0}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Complaints Submitted</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{complaintsLoading ? '—' : stats.total}</p>
        </div>
        <div>
          <p className="text-sm text-muted">In Progress</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{complaintsLoading ? '—' : stats.inProgress}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Resolved</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{complaintsLoading ? '—' : stats.resolved}</p>
        </div>
      </section>

      <section className="grid items-start gap-5 lg:grid-cols-[3fr_2fr]">
        <Card>
          <h3 className="text-lg font-semibold tracking-tight text-ink">Recent Complaints</h3>
          <div className="mt-4 space-y-3">
            {myComplaints.slice(0, 5).map((complaint) => (
              <div key={complaint.id} className="border-t border-line py-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="font-semibold text-ink">{complaint.title}</p>
                  <Badge text={complaint.status} />
                </div>
                <p className="text-xs text-muted">{complaint.category}</p>
                <p className="mt-1 text-xs text-muted">{new Date(complaint.createdAt).toLocaleString()}</p>
                {complaint.status === 'Rejected' && complaint.rejectNote && (
                  <p className="mt-2 rounded-lg border border-rose-100 bg-rose-50 px-2 py-1 text-xs text-rose-700">
                    Rejected Reason: {complaint.rejectNote}
                  </p>
                )}
                {complaint.status !== 'Rejected' && complaint.progressNote && (
                  <p className="mt-2 rounded-lg border border-sky-100 bg-sky-50 px-2 py-1 text-xs text-leaf">
                    Latest Update: {complaint.progressNote}
                  </p>
                )}
              </div>
            ))}
            {complaintError && <p role="alert">Could not refresh complaints.</p>}
            {complaintsLoading && <p role="status">Loading complaints…</p>}
            {!complaintsLoading && !complaintError && !myComplaints.length && <p className="text-sm text-muted">No complaints yet.</p>}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold tracking-tight text-ink">Top Contributors</h3>
          <div className="mt-4 space-y-2">
            {leaderboard.map((item) => (
              <div
                className="flex items-center justify-between border-t border-line py-2"
                key={item.id}
              >
                <p className="text-sm font-medium text-ink">
                  #{item.rank} {item.name}
                </p>
                <p className="text-sm font-bold text-leaf">{item.points} pts</p>
              </div>
            ))}
            {!leaderboard.length && <p className="text-sm text-muted">Leaderboard unavailable.</p>}
          </div>
        </Card>
      </section>
    </div>
  );
};

export default DashboardPage;
