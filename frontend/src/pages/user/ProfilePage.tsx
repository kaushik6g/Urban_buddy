import ComplaintPhoto from '../../components/ui/ComplaintPhoto';
import { useEffect, useState } from 'react';
import { complaintApi, userApi } from '../../api/services';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import type { Complaint, ProfileActivity } from '../../types';

const ProfilePage = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
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

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[2fr_3fr]">
      <Card>
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
          {profile.activity.map((item: ProfileActivity) => (
            <details key={item.id} className="rounded-md border border-line bg-paper p-3">
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
                <span className="text-sm font-semibold text-leaf underline">Issue details</span>
              </span>
              </summary>
              {complaints.filter((complaint) => complaint.id === item.id).map((complaint) => (
                <div key={complaint.id} className="mt-3 space-y-2 text-sm text-ink">
                  <p className="font-semibold">{complaint.category}</p>
                  <p className="whitespace-pre-wrap">{complaint.description}</p>
                  <a className="text-leaf underline" href={`https://www.google.com/maps?q=${complaint.location.latitude},${complaint.location.longitude}`}>
                    {complaint.location.address || 'View reported location'}
                  </a>
                  {(complaint.imageUrls?.length ? complaint.imageUrls : [complaint.imageUrl]).filter(Boolean).map((url, index) => (
                    <ComplaintPhoto key={index} url={url} alt={`Complaint photo ${index + 1}`} />
                  ))}
                </div>
              ))}
              {detailsError && <button type="button" onClick={loadDetails}>Retry loading details</button>}
            </details>
          ))}
          {!profile.activity.length && <p className="text-sm text-muted">No activity yet.</p>}
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
