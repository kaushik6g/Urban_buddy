import { useEffect, useState } from 'react';
import api from '../../api/client';
import Card from './Card';

interface Update { id: number; complaint_id: string; title: string; status: string; note: string; points_change: number; created_at: string }
const statusMessages: Record<string, string> = {
  Approved: 'was approved',
  Rejected: 'was rejected',
  'In Progress': 'is in progress',
  Resolved: 'was resolved',
  Deleted: 'was deleted',
};

const workflowOrder = ['Pending', 'Approved', 'In Progress', 'Resolved'];

function classifyUpdates(items: Update[]) {
  const previousStatusByComplaint = new Map<string, string>();
  const backward = new Set<number>();
  const corrections = new Set<number>();
  for (const item of [...items].reverse()) {
    const previous = previousStatusByComplaint.get(item.complaint_id);
    if (previous === 'Rejected' && item.status === 'Rejected' && item.points_change < 0) {
      corrections.add(item.id);
    }
    const currentRank = workflowOrder.indexOf(item.status);
    if (previous && currentRank >= 0 && currentRank < workflowOrder.indexOf(previous)) {
      backward.add(item.id);
    }
    previousStatusByComplaint.set(item.complaint_id, item.status);
  }
  return { backward, corrections };
}

export default function ComplaintUpdates() {
  const [visibleCount, setVisibleCount] = useState(3);
  const [items, setItems] = useState<Update[]>([]);
  const [message, setMessage] = useState('Loading updates...');
  useEffect(() => {
    api.get('/users/updates').then(({ data }) => { setItems(data.data); setMessage('No updates yet.'); })
      .catch(() => setMessage('Could not load updates.'));
  }, []);
  const { backward, corrections } = classifyUpdates(items);
  return (
    <Card>
      <h2 className="text-lg font-semibold">Updates</h2>
      {items.length ? (
        <ul className="mt-3 divide-y divide-line">
          {items.slice(0, visibleCount).map((item) => (
            <li key={item.id} className="space-y-1 py-3">
              {corrections.has(item.id) ? (
                <p>Your balance was corrected by {item.points_change} points for <strong>&ldquo;{item.title}&rdquo;</strong>.</p>
              ) : <p>
                Your report <strong>&ldquo;{item.title}&rdquo;</strong> {statusMessages[item.status] ?? 'was updated'}{backward.has(item.id) && ' again'}.
                {item.points_change > 0 && ` You earned ${item.points_change} points.`}
                {item.points_change < 0 && ` The ${Math.abs(item.points_change)} points you earned for it were removed.`}
              </p>}
              {!corrections.has(item.id) && item.note && <p className="text-sm">{item.note}</p>}
              <p className="text-sm text-muted">
                Updated on <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
              </p>
            </li>
          ))}
        </ul>
      ) : <p role="status" className="mt-2 text-sm text-muted">{message}</p>}
      {visibleCount < items.length && (
        <button type="button" className="mt-2 rounded border border-line px-3 py-2 text-sm font-semibold text-leaf"
          onClick={() => setVisibleCount((count) => count + 3)}>
          Show more
        </button>
      )}
    </Card>
  );
}
