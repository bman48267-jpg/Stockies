import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Unable to load data. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-12 px-6 text-center',
        className
      )}
    >
      <div
        className="flex items-center justify-center w-12 h-12 rounded-full"
        style={{ backgroundColor: 'var(--negative-subtle)' }}
      >
        <AlertTriangle
          size={20}
          style={{ color: 'var(--negative)' }}
          strokeWidth={2}
        />
      </div>
      <div>
        <p
          className="font-semibold text-sm mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: 'var(--bg-muted)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  );
}
