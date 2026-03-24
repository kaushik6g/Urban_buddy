const statusStyleMap: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-rose-100 text-rose-700',
  'In Progress': 'bg-sky-100 text-sky-700',
  Resolved: 'bg-violet-100 text-violet-700',
};

const Badge = ({ text }: { text: string }) => (
  <span
    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyleMap[text] || 'bg-slate-100 text-slate-700'}`}
  >
    {text}
  </span>
);

export default Badge;
