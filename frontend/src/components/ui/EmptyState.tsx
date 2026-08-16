import { Inbox } from 'lucide-react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = 'No data found',
  message = 'There is nothing to display here yet.',
  action,
  className,
  icon,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-12 px-6 text-center',
        className
      )}
    >
      <div
        className="flex items-center justify-center w-12 h-12 rounded-full"
        style={{ backgroundColor: 'var(--bg-muted)' }}
      >
        {icon ?? (
          <Inbox size={20} style={{ color: 'var(--text-muted)' }} />
        )}
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
      {action && <div>{action}</div>}
    </div>
  );
}
