import { useEffect, useState } from 'react';
import api from '../../api/client';
import Card from './Card';

interface Update { id: number; title: string; status: string; note: string; points_change: number; created_at: string }
const statusMessages: Record<string, string> = {
  Approved: 'was approved',
  Rejected: 'was rejected',
  'In Progress': 'is in progress',
  Resolved: 'was resolved',
  Deleted: 'was deleted',
};

export default function ComplaintUpdates() {
  const [items, setItems] = useState<Update[]>([]);
  const [message, setMessage] = useState('Loading updates...');
  useEffect(() => {
    api.get('/users/updates').then(({ data }) => { setItems(data.data); setMessage('No updates yet.'); })
      .catch(() => setMessage('Could not load updates.'));
  }, []);
  return (
    <Card>
      <h2 className="text-lg font-semibold">Updates</h2>
      {items.length ? (
        <ul className="mt-3 divide-y divide-line">
          {items.map((item) => (
            <li key={item.id} className="space-y-1 py-3">
              <p>
                Your report <strong>&ldquo;{item.title}&rdquo;</strong> {statusMessages[item.status] ?? 'was updated'}.
                {item.points_change > 0 && ` You earned ${item.points_change} points.`}
                {item.points_change < 0 && ` The ${Math.abs(item.points_change)} points you earned for it were removed.`}
              </p>
              {item.note && <p className="text-sm">{item.note}</p>}
              <p className="text-sm text-muted">
                Updated on <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
              </p>
            </li>
          ))}
        </ul>
      ) : <p role="status" className="mt-2 text-sm text-muted">{message}</p>}
    </Card>
  );
}
