import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/services';
import Card from '../../components/ui/Card';
import type { Complaint } from '../../types';

const assetBase = import.meta.env.VITE_API_ASSET_URL || 'http://localhost:5000';

const resolveImageUrl = (imageUrl?: string) => {
  if (!imageUrl) return '';
  const clean = imageUrl.trim().replace(/^['\"]|['\"]$/g, '');
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  if (clean.startsWith('/')) return `${assetBase}${clean}`;
  return `${assetBase}/${clean}`;
};

const primaryImage = (item: Complaint) => item.imageUrls?.[0] || item.imageUrl;

const AdminDashboardPage = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [community, setCommunity] = useState<any>(null);
  const [communityName, setCommunityName] = useState('');
  const [communityMessage, setCommunityMessage] = useState('');

  useEffect(() => {
    Promise.all([adminApi.listComplaints(), adminApi.getCommunity()])
      .then(([complaintsResponse, communityResponse]) => {
        setComplaints(complaintsResponse.data.data);
        setCommunity(communityResponse.data.data);
        setCommunityName(communityResponse.data.data?.name || '');
      })
      .catch(() => {
        setComplaints([]);
        setCommunity(null);
      });
  }, []);

  const generateCode = async () => {
    const response = await adminApi.createOrRefreshCommunityCode(communityName || undefined);
    setCommunity(response.data.data);
    setCommunityName(response.data.data.name);
    setCommunityMessage(response.data.message || 'Community code updated');
  };

  const stats = useMemo(() => {
    const pending = complaints.filter((c) => c.status === 'Pending').length;
    const approved = complaints.filter((c) => c.status === 'Approved').length;
    const inProgress = complaints.filter((c) => c.status === 'In Progress').length;
    const resolved = complaints.filter((c) => c.status === 'Resolved').length;
    return { total: complaints.length, pending, approved, inProgress, resolved };
  }, [complaints]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-white">Admin Dashboard</h2>
        <p className="mt-1 text-sm text-slate-400">Operational snapshot, complaint activity, and community management.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 shadow-lg shadow-cyan-950/10">
          <p className="text-sm text-slate-300">Total</p>
          <p className="mt-2 text-3xl font-black text-white">{stats.total}</p>
        </Card>
        <Card className="border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 shadow-lg shadow-cyan-950/10">
          <p className="text-sm text-slate-300">Pending</p>
          <p className="mt-2 text-3xl font-black text-amber-400">{stats.pending}</p>
        </Card>
        <Card className="border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 shadow-lg shadow-cyan-950/10">
          <p className="text-sm text-slate-300">Approved</p>
          <p className="mt-2 text-3xl font-black text-emerald-400">{stats.approved}</p>
        </Card>
        <Card className="border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 shadow-lg shadow-cyan-950/10">
          <p className="text-sm text-slate-300">In Progress</p>
          <p className="mt-2 text-3xl font-black text-sky-400">{stats.inProgress}</p>
        </Card>
        <Card className="border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 shadow-lg shadow-cyan-950/10">
          <p className="text-sm text-slate-300">Resolved</p>
          <p className="mt-2 text-3xl font-black text-violet-400">{stats.resolved}</p>
        </Card>
      </section>

      <Card className="border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100">
        <h3 className="text-lg font-bold text-white">Latest Complaints</h3>
        <div className="mt-3 space-y-3">
          {complaints.slice(0, 8).map((item) => (
            <div
              className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-sm transition hover:border-slate-700 md:grid-cols-[72px_1fr_auto]"
              key={item.id}
            >
              <div className="overflow-hidden rounded-md border border-slate-700 bg-slate-900">
                {primaryImage(item) ? (
                  <img
                    alt={item.title}
                    className="h-[72px] w-[72px] object-cover"
                    src={resolveImageUrl(primaryImage(item))}
                  />
                ) : (
                  <div className="flex h-[72px] w-[72px] items-center justify-center text-[10px] text-slate-500">
                    No Photo
                  </div>
                )}
              </div>

              <div>
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-xs font-medium tracking-wide text-cyan-300/90">{item.category}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {item.location?.address || `Lat ${item.location?.latitude}, Lng ${item.location?.longitude}`}
                </p>
              </div>

              <p className="self-start rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-200">{item.status}</p>
            </div>
          ))}
          {!complaints.length && <p className="text-sm text-slate-400">No complaints yet.</p>}
        </div>
      </Card>

      <Card className="border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100">
        <h3 className="text-lg font-bold text-white">Community Invite Code</h3>
        <p className="mt-1 text-sm text-slate-400">
          Share this code with users so they can join your community.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
            placeholder="Community name"
            value={communityName}
            onChange={(e) => setCommunityName(e.target.value)}
          />
          <button
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110"
            onClick={generateCode}
            type="button"
          >
            Generate Unique Code
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-200">
          Current Code:{' '}
          <span className="rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-cyan-300">
            {community?.code || 'Not generated yet'}
          </span>
        </p>
        {communityMessage && <p className="mt-2 text-sm text-emerald-400">{communityMessage}</p>}
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
