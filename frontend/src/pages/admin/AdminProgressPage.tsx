import { useEffect, useState } from 'react';
import { adminApi } from '../../api/services';
import Card from '../../components/ui/Card';

const AdminProgressPage = () => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    adminApi
      .listComplaints()
      .then((response) => setItems(response.data.data))
      .catch(() => setItems([]));
  }, []);

  const actionable = items.filter((item) => ['Approved', 'In Progress'].includes(item.status));

  return (
    <Card>
      <h2 className="text-2xl font-semibold tracking-tight text-ink">Progress Updates</h2>
      <p className="mt-1 text-sm text-muted">Track complaints currently moving through operations.</p>

      <div className="mt-4 space-y-3">
        {actionable.map((item) => (
          <div key={item.id} className="rounded-md border border-line bg-paper px-3 py-2.5">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted">{item.category}</p>
                {item.progressNote && <p className="mt-1 text-xs text-leaf">Update: {item.progressNote}</p>}
              </div>
              <p className="rounded-full bg-paper px-2 py-1 text-xs text-muted">{item.status}</p>
            </div>
          </div>
        ))}
        {!actionable.length && <p className="text-sm text-muted">No active operations right now.</p>}
      </div>
    </Card>
  );
};

export default AdminProgressPage;
