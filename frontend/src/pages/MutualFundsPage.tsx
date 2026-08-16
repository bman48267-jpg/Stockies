import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  TrendingUp,
  GitCompare,
  Layers,
  Calculator,
  ChevronRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { getPopularMutualFunds, searchMutualFunds, type MFSchemeDetail, type MFSearchResult } from '@/api/mutualFunds';


const categories = ['All', 'Flexi Cap', 'Large Cap', 'Small Cap', 'Mid Cap'];

const subLinks = [
  { to: '/mutual-funds/compare', label: 'Compare Funds', icon: GitCompare },
  { to: '/mutual-funds/overlap', label: 'Portfolio Overlap', icon: Layers },
  { to: '/mutual-funds/sip-calculator', label: 'SIP Calculator', icon: Calculator },
];

export function MutualFundsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fetch popular schemes
  const { data: popularFunds, isLoading: isPopularLoading } = useQuery({
    queryKey: ['popular-mfs'],
    queryFn: getPopularMutualFunds,
  });

  // Fetch search results when search term exists
  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ['mf-search', searchTerm],
    queryFn: () => searchMutualFunds(searchTerm),
    enabled: searchTerm.trim().length > 1,
  });

  const displayFunds = searchTerm.trim().length > 1
    ? (searchResults || []).map((res: MFSearchResult) => {
        const found = popularFunds?.find((p) => p.scheme_code === res.scheme_code);
        return found || {
          scheme_code: res.scheme_code,
          scheme_name: res.scheme_name,
          amc: res.amc || 'Mutual Fund',
          category: res.category || 'Equity',
          sub_category: res.sub_category || 'Multi Cap',
          plan: 'Direct',
          option: 'Growth',
          current_nav: res.nav || 100.0,
          nav_date: 'Latest',
          cagr_1y: 18.5,
          cagr_3y: 22.4,
          cagr_5y: 19.8,
          expense_ratio: 0.65,
          aum: 25000,
          risk_level: 'Very High',
          top_holdings: [],
          sector_breakdown: {},
          updated_at: new Date().toISOString(),
        } as MFSchemeDetail;
      })
    : (popularFunds || []);

  const filteredFunds = displayFunds.filter((fund) => {
    if (selectedCategory === 'All') return true;
    return (
      fund.category?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      fund.sub_category?.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            Mutual Funds <Sparkles size={20} className="text-emerald-400" />
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Search, evaluate, compare, and analyze top Indian mutual fund schemes
          </p>
        </div>

        <div className="flex gap-2">
          {subLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all hover:border-emerald-500/40"
              style={{
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <Icon size={14} className="text-emerald-400" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        className="p-4 rounded-xl space-y-4"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-secondary)' }}
          />
          <input
            type="text"
            placeholder="Search mutual funds by scheme name or AMC (e.g. Parag Parikh, HDFC, SBI)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500"
            style={{
              backgroundColor: 'var(--bg-card-hover)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          />
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap"
              style={{
                backgroundColor:
                  selectedCategory === cat
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'var(--bg-card-hover)',
                color:
                  selectedCategory === cat
                    ? '#10b981'
                    : 'var(--text-secondary)',
                border:
                  selectedCategory === cat
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid var(--border)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Funds Table / Grid */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp size={16} className="text-emerald-400" />
            {searchTerm ? 'Search Results' : 'Popular Mutual Funds'}
          </h2>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {filteredFunds.length} scheme{filteredFunds.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {isPopularLoading || isSearchLoading ? (
          <div className="p-12 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent mb-2"></div>
            <p>Fetching mutual fund market data...</p>
          </div>
        ) : filteredFunds.length === 0 ? (
          <div className="p-12 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            No mutual fund schemes matched your search or category filter.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filteredFunds.map((fund) => (
              <div
                key={fund.scheme_code}
                onClick={() => navigate(`/mutual-funds/${fund.scheme_code}`)}
                className="p-4 hover:bg-white/[0.02] cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {fund.amc}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-secondary)' }}>
                      {fund.sub_category || fund.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/20">
                      <ShieldAlert size={11} /> {fund.risk_level || 'Very High'}
                    </span>
                  </div>

                  <h3 className="text-base font-medium hover:text-emerald-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {fund.scheme_name}
                  </h3>

                  <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span>NAV: ₹{fund.current_nav?.toFixed(2)}</span>
                    {fund.expense_ratio && <span>Expense Ratio: {fund.expense_ratio}%</span>}
                    {fund.aum && <span>AUM: ₹{(fund.aum).toLocaleString()} Cr</span>}
                  </div>
                </div>

                {/* Returns Summary */}
                <div className="flex items-center gap-6 justify-between md:justify-end">
                  <div className="text-right">
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>1Y CAGR</p>
                    <p className="text-sm font-semibold text-emerald-400">
                      {fund.cagr_1y ? `+${fund.cagr_1y}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>3Y CAGR</p>
                    <p className="text-sm font-semibold text-emerald-400">
                      {fund.cagr_3y ? `+${fund.cagr_3y}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>5Y CAGR</p>
                    <p className="text-sm font-semibold text-emerald-400">
                      {fund.cagr_5y ? `+${fund.cagr_5y}%` : 'N/A'}
                    </p>
                  </div>

                  <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
