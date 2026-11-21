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
    return <Card className="bg-white/95">Loading profile...</Card>;
  }

  return (
    <div className="grid gap-4">
      <Card className="bg-white/95 shadow-sm">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Profile</h2>
        <div className="mt-4 space-y-2 text-sm text-slate-700">
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
          <button type="button" className="mt-4 font-semibold text-sky-700" onClick={() => setShowChange(true)}>
            Change community
          </button>
        )}
        {profile.user.role === 'user' && (!profile.user.communityId || showChange) && (
          <form className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 space-y-2" onSubmit={onJoinCommunity}>
            <label className="block text-sm font-semibold text-slate-700">{profile.user.communityId ? 'New community code' : 'Join Community with Code'}</label>
            {profile.user.communityId && (
              <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} required />
                I understand that changing communities permanently deletes the complaints I submitted in my previous community.
              </label>
            )}
            <div className="flex gap-2">
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Enter code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                required
              />
              <button
                className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
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

      <Card className="bg-white/95 shadow-sm">
        <h3 className="text-xl font-black tracking-tight text-slate-900">Activity History</h3>
        <div className="mt-3 space-y-2">
          {profile.activity.map((item: ProfileActivity) => (
            <details key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
              <div>
                <p className="font-medium text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                {item.status === 'Rejected' && item.rejectNote && (
                  <p className="mt-1 text-xs font-medium text-rose-700">Rejected Reason: {item.rejectNote}</p>
                )}
                {item.status !== 'Rejected' && item.progressNote && (
                  <p className="mt-1 text-xs font-medium text-sky-700">Latest Update: {item.progressNote}</p>
                )}
              </div>
              <span className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <Badge text={item.status} />
                <span className="text-sm font-semibold text-sky-700 underline">Issue details</span>
              </span>
              </summary>
              {complaints.filter((complaint) => complaint.id === item.id).map((complaint) => (
                <div key={complaint.id} className="mt-3 space-y-2 text-sm text-slate-700">
                  <p className="font-semibold">{complaint.category}</p>
                  <p className="whitespace-pre-wrap">{complaint.description}</p>
                  <a className="text-sky-700 underline" href={`https://www.google.com/maps?q=${complaint.location.latitude},${complaint.location.longitude}`}>
                    {complaint.location.address || 'View reported location'}
                  </a>
                  {(complaint.imageUrls?.length ? complaint.imageUrls : [complaint.imageUrl]).filter(Boolean).map((url, index) => (
                    <img key={index} className="max-h-64 rounded-lg object-contain" alt={`Complaint photo ${index + 1}`}
                      src={url!.startsWith('/') ? `${import.meta.env.VITE_API_ASSET_URL || 'http://localhost:5000'}${url}` : url!} />
                  ))}
                </div>
              ))}
              {detailsError && <button type="button" onClick={loadDetails}>Retry loading details</button>}
            </details>
          ))}
          {!profile.activity.length && <p className="text-sm text-slate-500">No activity yet.</p>}
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
