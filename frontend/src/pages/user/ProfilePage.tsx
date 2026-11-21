import ComplaintPhoto from '../../components/ui/ComplaintPhoto';
import { useEffect, useState } from 'react';
import { complaintApi, userApi } from '../../api/services';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import type { Complaint } from '../../types';

const ProfilePage = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<{ id: string; title: string; deleted_at: string }[]>([]);
  const [archiveError, setArchiveError] = useState(false);
  const loadDeleted = () => {
    complaintApi.deleted().then(({ data }) => {
      setDeleted(data.data);
      setArchiveError(false);
    }).catch(() => setArchiveError(true));
  };
  const [deleteFeedback, setDeleteFeedback] = useState('');
  const deleteComplaint = async ({ id, title, earnedPoints }: Complaint) => {
    const pointsMessage = earnedPoints
      ? `Deleting this report removes its ${earnedPoints} points.`
      : 'This report has no approval points to remove.';
    if (deletingId || !window.confirm(`Delete “${title}”? ${pointsMessage} It will move to Deleted complaints.`)) return;
    setDeletingId(id);
    setDeleteFeedback('');
    try {
      await complaintApi.remove(id);
      setComplaints((current) => current.filter((complaint) => complaint.id !== id));
      loadDeleted();
      loadProfile();
      window.alert('Complaint deleted.');
    } catch {
      setDeleteFeedback('Could not delete the complaint. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const [detailsError, setDetailsError] = useState(false);
  const loadDetails = () => {
    setDetailsError(false);
    complaintApi.my().then(({ data }) => setComplaints(data.data)).catch(() => setDetailsError(true));
  };
  const [profile, setProfile] = useState<any>(null);
  const [showChange, setShowChange] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [joinError, setJoinError] = useState('');

  const loadProfile = () => {
    userApi
      .profile()
      .then((response) => setProfile(response.data.data))
      .catch(() => setProfile(null));
  };

  useEffect(() => {
    loadProfile();
    loadDetails();
    loadDeleted();
  }, []);

  const onJoinCommunity = async (event: React.FormEvent) => {
    event.preventDefault();
    setJoinError('');
    setJoinMessage('');
    if (joining || (profile.user.communityId && !confirmed)) return;
    setJoining(true);
    try {
      const response = await userApi.joinCommunity(joinCode, confirmed);
      setJoinMessage(response.data.message || 'Joined community');
      setJoinCode('');
      setShowChange(false);
      setConfirmed(false);
      loadProfile();
      loadDetails();
    } catch (err: any) {
      setJoinError(err?.response?.data?.message || 'Could not join community');
    } finally {
      setJoining(false);
    }
  };

  if (!profile) {
    return <Card>Loading profile...</Card>;
  }

  const activeComplaints = complaints.filter((item) => item.status !== 'Rejected');
  const rejectedComplaints = complaints.filter((item) => item.status === 'Rejected');

  const renderComplaint = (item: (typeof complaints)[number]) => (
            <article key={item.id} className="rounded-md border border-line bg-paper p-3">
              <details>
              <summary className="flex flex-wrap cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
              <div>
                <p className="font-medium text-ink">{item.title}</p>
                <p className="text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</p>
                {item.status === 'Rejected' && item.rejectNote && (
                  <p className="mt-1 text-xs font-medium text-rose-700">Rejected Reason: {item.rejectNote}</p>
                )}
                {item.status !== 'Rejected' && item.progressNote && (
                  <p className="mt-1 text-xs font-medium text-leaf">Latest Update: {item.progressNote}</p>
                )}
              </div>
              <span className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <Badge text={item.status} />
                <span className="text-sm font-semibold rounded-md border border-line bg-white px-2 py-1 text-leaf">Issue details</span>
              </span>
              </summary>

                <div className="mt-3 space-y-2 text-sm text-ink">
                  <p className="font-semibold">{item.category}</p>
                  <p className="whitespace-pre-wrap">{item.description}</p>
                  <a className="text-leaf underline" href={`https://www.google.com/maps?q=${item.location.latitude},${item.location.longitude}`}>
                    {item.location.address || 'View reported location'}
                  </a>
                  {(item.imageUrls?.length ? item.imageUrls : [item.imageUrl]).filter(Boolean).map((url, index) => (
                    <ComplaintPhoto key={index} url={url} alt={`Complaint photo ${index + 1}`} />
                  ))}
                </div>
              </details>
              <button type="button" className="mt-3 rounded-md border border-rose-200 px-2 py-1 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60" disabled={deletingId !== null || joining} onClick={() => void deleteComplaint(item)}>
                {deletingId === item.id ? 'Deleting�' : 'Delete complaint'}
              </button>
            </article>
  );

  return (
    <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
      <Card className="border-t-4 border-t-leaf">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Profile</h2>
        <div className="mt-4 space-y-2 text-sm text-ink">
          <p>
            <span className="font-semibold">Name:</span> {profile.user.name}
          </p>
          <p>
            <span className="font-semibold">Email:</span> {profile.user.email}
          </p>
          <p>
            <span className="font-semibold">Points:</span> {profile.user.points}
          </p>
          <p>
            <span className="font-semibold">Community:</span>{' '}
            {profile.user.community ? `${profile.user.community.name} (${profile.user.community.code})` : 'Not joined'}
          </p>
          <p>
            <span className="font-semibold">Joined:</span>{' '}
            {new Date(profile.user.createdAt).toLocaleDateString()}
          </p>
        </div>

        {joinMessage && <p role="status" className="mt-3 text-sm text-emerald-600">{joinMessage}</p>}
        {profile.user.role === 'user' && profile.user.communityId && !showChange && (
          <button type="button" className="mt-4 font-semibold text-leaf" onClick={() => setShowChange(true)}>
            Change community
          </button>
        )}
        {profile.user.role === 'user' && (!profile.user.communityId || showChange) && (
          <form className="mt-5 rounded-md border border-line bg-paper p-3 space-y-2" onSubmit={onJoinCommunity}>
            <label className="block text-sm font-semibold text-ink">{profile.user.communityId ? 'New community code' : 'Join Community with Code'}</label>
            {profile.user.communityId && (
              <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} required />
                I understand that changing communities permanently deletes the complaints I submitted in my previous community.
              </label>
            )}
            <div className="flex gap-2">
              <input
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-leaf"
                placeholder="Enter code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                required
              />
              <button
                className="rounded-lg bg-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink"
                type="submit"
                disabled={joining || Boolean(profile.user.communityId && !confirmed)}
              >
                {profile.user.communityId ? "Change community" : "Join"}
              </button>
            </div>
            {showChange && <button type="button" disabled={joining} onClick={() => { setShowChange(false); setConfirmed(false); setJoinCode(''); setJoinError(''); }}>Cancel</button>}
            {joinError && <p className="text-sm text-rose-600">{joinError}</p>}
          </form>
        )}
      </Card>

      <Card>
        <h3 className="text-xl font-semibold tracking-tight text-ink">Activity History</h3>
        <div className="mt-3 space-y-2">
          {deleteFeedback && <p role="status" className="text-sm">{deleteFeedback}</p>}
          {detailsError && <button type="button" onClick={loadDetails}>Retry loading complaints</button>}
      {activeComplaints.map(renderComplaint)}
          {!detailsError && !activeComplaints.length && <p className="text-sm text-muted">No activity yet.</p>}
        </div>
      </Card>
      <Card className="md:col-start-2">
        <h3 className="text-xl font-semibold">Rejected complaints</h3>
        <div className="mt-3 space-y-2">
          {rejectedComplaints.length ? rejectedComplaints.map(renderComplaint) : (
            !detailsError && <p className="text-sm text-muted">No rejected complaints yet.</p>
          )}
        </div>
      </Card>
      <Card className="md:col-start-2">
        <h3 className="text-xl font-semibold">Deleted complaints</h3>
        {archiveError ? <button type="button" onClick={loadDeleted}>Retry loading deleted complaints</button> : deleted.length ? (
          <ul className="mt-3 divide-y divide-line">
            {deleted.map((item) => <li key={item.id} className="py-2">{item.title} <time className="block text-sm text-muted" dateTime={item.deleted_at}>{new Date(item.deleted_at).toLocaleString()}</time></li>)}
          </ul>
        ) : <p className="mt-2 text-sm text-muted">No deleted complaints yet.</p>}
      </Card>
    </div>
  );
};

export default ProfilePage;
