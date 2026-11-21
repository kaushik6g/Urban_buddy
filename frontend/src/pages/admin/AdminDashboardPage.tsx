import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/services';
import Card from '../../components/ui/Card';
import type { Complaint } from '../../types';

const assetBase = import.meta.env.DEV ? import.meta.env.VITE_API_ASSET_URL || 'http://localhost:5000' : '';

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
        <h2 className="text-3xl font-semibold tracking-tight text-ink">Admin Dashboard</h2>
      </div>

      <section aria-label="Summary" className="metric-strip">
        <div>
          <p className="text-sm text-muted">Total</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{stats.total}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Pending</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{stats.pending}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Approved</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{stats.approved}</p>
        </div>
        <div>
          <p className="text-sm text-muted">In Progress</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{stats.inProgress}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Resolved</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{stats.resolved}</p>
        </div>
      </section>

      <Card>
        <h3 className="text-lg font-bold text-ink">Latest Complaints</h3>
        <div className="mt-3 space-y-3">
          {complaints.slice(0, 8).map((item) => (
            <div
              className="grid gap-3 border-t border-line py-3 text-sm transition hover:border-line md:grid-cols-[72px_1fr_auto]"
              key={item.id}
            >
              <div className="overflow-hidden rounded-md border border-line bg-paper">
                {primaryImage(item) ? (
                  <img
                    alt={item.title}
                    className="h-[72px] w-[72px] object-cover"
                    src={resolveImageUrl(primaryImage(item))}
                  />
                ) : (
                  <div className="flex h-[72px] w-[72px] items-center justify-center text-[10px] text-muted">
                    No Photo
                  </div>
                )}
              </div>

              <div>
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-xs font-medium tracking-wide text-leaf">{item.category}</p>
                <p className="mt-1 text-xs text-muted">
                  {item.location?.address || `Lat ${item.location?.latitude}, Lng ${item.location?.longitude}`}
                </p>
              </div>

              <p className="self-start rounded-full bg-paper px-2 py-1 text-xs text-ink">{item.status}</p>
            </div>
          ))}
          {!complaints.length && <p className="text-sm text-muted">No complaints yet.</p>}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-ink">Community Invite Code</h3>
        <p className="mt-1 text-sm text-muted">
          Share this code with users so they can join your community.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted"
            placeholder="Community name"
            value={communityName}
            onChange={(e) => setCommunityName(e.target.value)}
          />
          <button
            className="rounded-md bg-leaf px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            onClick={generateCode}
            type="button"
          >
            Generate Unique Code
          </button>
        </div>

        <p className="mt-3 text-sm text-ink">
          Current Code:{' '}
          <span className="rounded border border-line bg-paper px-2 py-1 font-mono text-leaf">
            {community?.code || 'Not generated yet'}
          </span>
        </p>
        {communityMessage && <p className="mt-2 text-sm text-ink">{communityMessage}</p>}
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
