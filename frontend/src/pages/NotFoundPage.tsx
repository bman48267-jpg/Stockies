import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div
        className="text-7xl font-black"
        style={{
          background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        404
      </div>
      <div>
        <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Page not found
        </p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          The page you are looking for doesn&apos;t exist.
        </p>
      </div>
      <Link
        to="/"
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
      >
        <Home size={15} />
        Go Home
      </Link>
    </div>
  );
}
