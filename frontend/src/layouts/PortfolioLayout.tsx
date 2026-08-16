import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/utils/cn';

const tabs = [
  { to: '/portfolio', label: 'Overview' },
  { to: '/portfolio/stocks', label: 'Stocks' },
  { to: '/portfolio/mutual-funds', label: 'Mutual Funds' },
  { to: '/portfolio/emergency-funds', label: 'Emergency Funds' },
  { to: '/portfolio/fixed-deposits', label: 'Fixed Deposits' },
  { to: '/portfolio/bonds', label: 'Bonds' },
];

export function PortfolioLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          My Portfolio
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Track your investments, returns, and allocation
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {tabs.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                isActive ? 'shadow-sm' : 'hover:bg-muted'
              )
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--bg-surface)' : '',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            })}
          >
            {label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
