import { Link } from 'react-router-dom';
import {
  TrendingUp,
  BarChart2,
  ArrowRight,
  Activity,
  Search,
  Filter,
  PieChart,
} from 'lucide-react';
import { getMarketStatusLabel } from '@/utils/format';

const features = [
  {
    icon: TrendingUp,
    title: 'Stock Research',
    description: 'Discover and analyse Indian stocks with real-time quotes, fundamentals, and interactive charts.',
    to: '/stocks',
    color: '#10b981',
  },
  {
    icon: Filter,
    title: 'Stock Screener',
    description: 'Filter thousands of stocks by PE, ROE, ROCE, debt ratios, growth metrics, and more.',
    to: '/stocks/screener',
    color: '#3b82f6',
  },
  {
    icon: BarChart2,
    title: 'Mutual Funds',
    description: 'Explore mutual fund schemes with NAV history, rolling returns, and detailed analytics.',
    to: '/mutual-funds',
    color: '#8b5cf6',
  },
  {
    icon: Search,
    title: 'Fund Comparison',
    description: 'Compare funds side-by-side on CAGR, expense ratio, AUM, and risk metrics.',
    to: '/mutual-funds/compare',
    color: '#f59e0b',
  },
  {
    icon: Activity,
    title: 'SIP Calculator',
    description: 'Model regular and step-up SIP returns with accurate monthly compounding.',
    to: '/mutual-funds/sip-calculator',
    color: '#06b6d4',
  },
  {
    icon: PieChart,
    title: 'Portfolio Tracker',
    description: 'Track your complete investment portfolio with XIRR, P&L, and allocation charts.',
    to: '/portfolio',
    color: '#ec4899',
  },
];

const stats = [
  { label: 'NSE Listed Stocks', value: '2,000+' },
  { label: 'Mutual Fund Schemes', value: '10,000+' },
  { label: 'AMCs Covered', value: '45+' },
  { label: 'Years of Data', value: '10+' },
];

export function HomePage() {
  const market = getMarketStatusLabel();

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center space-y-6 py-10">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-2"
          style={{
            backgroundColor: 'var(--bg-card)',
            color: market.isOpen ? 'var(--positive)' : 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
            style={{ backgroundColor: market.isOpen ? 'var(--positive)' : 'var(--neutral)' }}
          />
          {market.label} · NSE &amp; BSE
        </div>

        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Your Indian{' '}
          <span
            style={{
              background: 'linear-gradient(90deg, var(--accent), #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Investment
          </span>{' '}
          Research Hub
        </h1>

        <p
          className="text-base md:text-lg max-w-2xl mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          Research stocks, analyse mutual funds, screen investments, and track your
          complete portfolio — all in one professional platform built for Indian markets.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/stocks"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
              color: '#fff',
            }}
          >
            Explore Stocks <ArrowRight size={15} />
          </Link>
          <Link
            to="/portfolio"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          >
            My Portfolio
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-5 text-center"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <p
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {stat.value}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Feature grid */}
      <div>
        <h2
          className="text-xl font-semibold mb-6"
          style={{ color: 'var(--text-primary)' }}
        >
          Everything you need to invest smarter
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, description, to, color }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-xl p-5 transition-all hover:-translate-y-0.5"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg mb-4"
                style={{ backgroundColor: `${color}22` }}
              >
                <Icon size={20} style={{ color }} strokeWidth={2} />
              </div>
              <h3
                className="font-semibold text-sm mb-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                {title}
              </h3>
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {description}
              </p>
              <div
                className="flex items-center gap-1 mt-4 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--accent)' }}
              >
                Explore <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
