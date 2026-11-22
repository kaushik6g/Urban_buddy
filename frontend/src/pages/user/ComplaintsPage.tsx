import ComplaintPhoto from '../../components/ui/ComplaintPhoto';
import { useEffect, useState } from 'react';
import { complaintApi } from '../../api/services';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import type { Complaint } from '../../types';

const categories = ['', 'Pothole', 'Garbage', 'Streetlight', 'Water Leakage', 'Road Damage', 'Other'];
const statuses = ['', 'Approved', 'In Progress', 'Resolved'];

const firstImage = (item: Complaint) => item.imageUrls?.[0] || item.imageUrl;

const ComplaintsPage = () => {
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async (targetPage = page) => {
    setLoading(true);
    try {
      const response = await complaintApi.list({
        page: targetPage,
        limit: 6,
        category: category || undefined,
        status: status || undefined,
      });
      setItems(response.data.data);
      setTotalPages(response.data.pagination.totalPages || 1);
      setPage(targetPage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1).catch(() => {
      setItems([]);
      setLoading(false);
    });
  }, [category, status]);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Public Complaints</h2>
        <p className="mt-1 text-sm text-muted">Explore approved community issues with filters.</p>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
          <select
            className="rounded-md border border-line bg-white px-3 py-2 text-sm"
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((item) => (
              <option key={item || 'all'} value={item}>
                {item || 'All Categories'}
              </option>
            ))}
          </select>

          <select
            className="rounded-md border border-line bg-white px-3 py-2 text-sm"
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {statuses.map((item) => (
              <option key={item || 'all'} value={item}>
                {item || 'All Statuses'}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {loading ? (
        <Card>Loading complaints...</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              {firstImage(item) && (
                <div className="mb-3"><ComplaintPhoto alt={item.title} url={firstImage(item)} /></div>
              )}
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-bold text-ink">{item.title}</h3>
                <Badge text={item.status} />
              </div>
              <p className="text-sm text-muted">{item.description}</p>
              <p className="mt-2 inline-flex rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-leaf">
                {item.category}
              </p>
              <a
                className="mt-3 inline-block text-xs font-semibold text-leaf"
                href={`https://www.google.com/maps?q=${item.location.latitude},${item.location.longitude}`}
                rel="noreferrer"
                target="_blank"
              >
                View on map
              </a>
            </Card>
          ))}
          {!items.length && <Card>No complaints found for selected filters.</Card>}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => load(Math.max(1, page - 1))} disabled={page === 1}>
          Previous
        </Button>
        <Button variant="ghost" onClick={() => load(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
          Next
        </Button>
        <p className="ml-2 self-center text-xs text-muted">
          Page {page} of {Math.max(1, totalPages)}
        </p>
      </div>
    </div>
  );
};

export default ComplaintsPage;
