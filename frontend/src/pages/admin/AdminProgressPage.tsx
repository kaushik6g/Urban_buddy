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
    <Card className="border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100">
      <h2 className="text-2xl font-black tracking-tight text-white">Progress Updates</h2>
      <p className="mt-1 text-sm text-slate-400">Track complaints currently moving through operations.</p>

      <div className="mt-4 space-y-3">
        {actionable.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2.5">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">{item.category}</p>
                {item.progressNote && <p className="mt-1 text-xs text-cyan-300">Update: {item.progressNote}</p>}
              </div>
              <p className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{item.status}</p>
            </div>
          </div>
        ))}
        {!actionable.length && <p className="text-sm text-slate-400">No active operations right now.</p>}
      </div>
    </Card>
  );
};

export default AdminProgressPage;
