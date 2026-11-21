import { useEffect, useState } from 'react';
import api from '../../api/client';
import Card from '../../components/ui/Card';

interface Update { id: number; title: string; status: string; note: string; points_change: number; created_at: string }
export default function UpdatesPage() {
  const [items, setItems] = useState<Update[]>([]);
  const [message, setMessage] = useState('Loading updates�');
  useEffect(() => {
    api.get('/users/updates').then(({ data }) => { setItems(data.data); setMessage('No updates yet.'); })
      .catch(() => setMessage('Could not load updates.'));
  }, []);
  return <Card><h2 className="text-2xl font-semibold">Updates</h2>
    {items.length ? <ul className="mt-4 divide-y divide-line">{items.map(item => <li key={item.id} className="py-3">
      <strong>{item.title}</strong> � {item.status}
      <p>{item.note}</p><p>{item.points_change > 0 ? '+' : ''}{item.points_change} points � {new Date(item.created_at).toLocaleString()}</p>
    </li>)}</ul> : <p>{message}</p>}
  </Card>;
}
