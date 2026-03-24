import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-950 px-4 text-slate-100">
      <h1 className="text-4xl font-black">404</h1>
      <p className="text-slate-400">The page you are looking for does not exist.</p>
      <Link className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950" to="/">
        Go Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
