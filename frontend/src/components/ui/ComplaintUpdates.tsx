import { useEffect, useState } from 'react';
import api from '../../api/client';
import Card from './Card';
import Badge from './Badge';

interface Update { id: number; title: string; status: string; note: string; points_change: number; created_at: string }
export default function ComplaintUpdates() {
  const [items, setItems] = useState<Update[]>([]);
  const [message, setMessage] = useState('Loading updates...');
  useEffect(() => {
    api.get('/users/updates').then(({ data }) => { setItems(data.data); setMessage('No updates yet.'); })
      .catch(() => setMessage('Could not load updates.'));
  }, []);
  return (
    <Card>
      <h2 className="text-lg font-semibold">Complaint Updates</h2>
      {items.length ? (
        <ul className="mt-3 divide-y divide-line">
          {items.map((item) => (
            <li key={item.id} className="space-y-1 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <strong>{item.title}</strong>
                <Badge text={item.status} />
              </div>
              {item.note && <p className="text-sm">{item.note}</p>}
              <div className="flex flex-wrap gap-x-4 text-sm text-muted">
                <span>{item.points_change > 0 ? '+' : ''}{item.points_change} points</span>
                <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
              </div>
            </li>
          ))}
        </ul>
      ) : <p role="status" className="mt-2 text-sm text-muted">{message}</p>}
    </Card>
  );
}
