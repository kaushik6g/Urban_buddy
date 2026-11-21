import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-4 text-ink">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="text-muted">The page you are looking for does not exist.</p>
      <Link className="rounded-lg bg-leaf px-4 py-2 text-sm font-semibold text-white" to="/">
        Go Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
