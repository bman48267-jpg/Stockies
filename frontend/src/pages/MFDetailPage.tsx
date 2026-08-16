import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  GitCompare,
  Layers,
  Calculator,
  PieChart as PieIcon,
  Briefcase,
  FileText,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getMFSchemeDetails, getMFNAVHistory } from '@/api/mutualFunds';
import { TransactionModal } from '@/components/portfolio/TransactionModal';


const periods = ['1m', '6m', '1y', '3y', '5y', 'max'];

export function MFDetailPage() {
  const { schemeCode = '122639' } = useParams<{ schemeCode: string }>();
  const [selectedPeriod, setSelectedPeriod] = useState('1y');
  const [isSipOpen, setIsSipOpen] = useState(false);

  // Fetch Scheme Detail
  const { data: scheme, isLoading, isError } = useQuery({
    queryKey: ['mf-detail', schemeCode],
    queryFn: () => getMFSchemeDetails(schemeCode),
  });

  // Fetch NAV History
  const { data: navHistory, isLoading: isNavLoading } = useQuery({
    queryKey: ['mf-nav-history', schemeCode, selectedPeriod],
    queryFn: () => getMFNAVHistory(schemeCode, selectedPeriod),
    enabled: !!schemeCode,
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading mutual fund analytics...</p>
      </div>
    );
  }

  if (isError || !scheme) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-semibold text-rose-400">Scheme Not Found</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Could not fetch mutual fund scheme details for code: {schemeCode}
        </p>
        <Link
          to="/mutual-funds"
          className="inline-block px-4 py-2 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
        >
          Back to Mutual Funds
        </Link>
      </div>
    );
  }

  const isPositive = (scheme.change || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="p-6 rounded-xl space-y-4"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2.5 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {scheme.amc}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-secondary)' }}>
                {scheme.sub_category || scheme.category}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 flex items-center gap-1">
                <ShieldAlert size={12} /> {scheme.risk_level || 'Very High'} Risk
              </span>
            </div>

            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {scheme.scheme_name}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Scheme Code: {scheme.scheme_code} | Benchmark: {scheme.benchmark || 'NIFTY 500 TRI'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsSipOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow active:scale-95"
            >
              <TrendingUp size={13} /> Setup SIP
            </button>
            <Link
              to="/mutual-funds/compare"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:border-emerald-500/40"
              style={{ backgroundColor: 'var(--bg-card-hover)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <GitCompare size={13} className="text-emerald-400" /> Compare
            </Link>
            <Link
              to="/mutual-funds/overlap"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:border-emerald-500/40"
              style={{ backgroundColor: 'var(--bg-card-hover)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <Layers size={13} className="text-emerald-400" /> Overlap
            </Link>
            <Link
              to="/mutual-funds/sip-calculator"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:border-emerald-500/40"
              style={{ backgroundColor: 'var(--bg-card-hover)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <Calculator size={13} className="text-emerald-400" /> SIP Calculator
            </Link>
          </div>
        </div>

        {/* Current NAV Banner */}
        <div className="flex items-baseline gap-4 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <div>
            <span className="text-xs block mb-0.5" style={{ color: 'var(--text-secondary)' }}>Latest NAV ({scheme.nav_date})</span>
            <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              ₹{scheme.current_nav?.toFixed(2)}
            </span>
          </div>

          {scheme.change !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
              <span>
                {isPositive ? '+' : ''}{scheme.change?.toFixed(2)} ({isPositive ? '+' : ''}{scheme.change_percent?.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CAGR Return Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl space-y-1" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>1 Year CAGR</p>
          <p className="text-xl font-bold text-emerald-400">
            {scheme.cagr_1y ? `+${scheme.cagr_1y}%` : 'N/A'}
          </p>
        </div>
        <div className="p-4 rounded-xl space-y-1" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>3 Year CAGR</p>
          <p className="text-xl font-bold text-emerald-400">
            {scheme.cagr_3y ? `+${scheme.cagr_3y}%` : 'N/A'}
          </p>
        </div>
        <div className="p-4 rounded-xl space-y-1" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>5 Year CAGR</p>
          <p className="text-xl font-bold text-emerald-400">
            {scheme.cagr_5y ? `+${scheme.cagr_5y}%` : 'N/A'}
          </p>
        </div>
        <div className="p-4 rounded-xl space-y-1" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Since Inception</p>
          <p className="text-xl font-bold text-emerald-400">
            {scheme.cagr_inception ? `+${scheme.cagr_inception}%` : 'N/A'}
          </p>
        </div>
      </div>

      {/* NAV History Chart */}
      <div className="p-6 rounded-xl space-y-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp size={16} className="text-emerald-400" /> NAV Performance Chart
          </h2>

          <div className="flex gap-1">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className="px-2.5 py-1 rounded text-xs font-medium uppercase transition-all"
                style={{
                  backgroundColor: selectedPeriod === p ? '#10b981' : 'var(--bg-card-hover)',
                  color: selectedPeriod === p ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 w-full">
          {isNavLoading ? (
            <div className="h-full flex items-center justify-center text-xs" style={{ color: 'var(--text-secondary)' }}>
              Loading NAV chart...
            </div>
          ) : navHistory && navHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={navHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    color: '#f4f4f5',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`₹${Number(val || 0).toFixed(2)}`, 'NAV']}

                />
                <Area type="monotone" dataKey="nav" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#navGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs" style={{ color: 'var(--text-secondary)' }}>
              No NAV history available for selected period.
            </div>
          )}
        </div>
      </div>

      {/* Two-Column Grid: Top Holdings & Sector Distribution + Key Facts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Holdings (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-xl space-y-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Briefcase size={16} className="text-emerald-400" /> Top Portfolio Holdings
            </h2>

            {scheme.top_holdings && scheme.top_holdings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      <th className="pb-2 font-medium">Company / Security</th>
                      <th className="pb-2 font-medium">Sector</th>
                      <th className="pb-2 font-medium text-right">Portfolio Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {scheme.top_holdings.map((h, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                          {h.security_name}
                        </td>
                        <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                          {h.sector || 'N/A'}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-emerald-400">
                          {h.weight}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Holdings data not available.</p>
            )}
          </div>
        </div>

        {/* Key Facts & Sector Breakdown (1 Col) */}
        <div className="space-y-6">
          {/* Key Scheme Info */}
          <div className="p-6 rounded-xl space-y-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FileText size={16} className="text-emerald-400" /> Key Facts
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Expense Ratio</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{scheme.expense_ratio}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Fund Size (AUM)</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>₹{(scheme.aum || 0).toLocaleString()} Cr</span>
              </div>
              <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Plan Type</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{scheme.plan} - {scheme.option}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span style={{ color: 'var(--text-secondary)' }}>Benchmark Index</span>
                <span className="font-semibold text-right" style={{ color: 'var(--text-primary)' }}>{scheme.benchmark || 'NIFTY 500 TRI'}</span>
              </div>
            </div>
          </div>

          {/* Sector Breakdown */}
          <div className="p-6 rounded-xl space-y-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <PieIcon size={16} className="text-emerald-400" /> Sector Distribution
            </h2>

            {Object.keys(scheme.sector_breakdown || {}).length > 0 ? (
              <div className="space-y-3 text-xs">
                {Object.entries(scheme.sector_breakdown).map(([sec, weight]) => (
                  <div key={sec} className="space-y-1">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>{sec}</span>
                      <span className="font-semibold text-emerald-400">{weight}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(weight, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sector data not available.</p>
            )}
          </div>
        </div>
      </div>
      <TransactionModal
        isOpen={isSipOpen}
        onClose={() => setIsSipOpen(false)}
        onSuccess={() => {
          setIsSipOpen(false);
        }}
        defaultAssetType="mutual_fund"
        defaultSymbol={scheme.scheme_code}
        defaultName={scheme.scheme_name}
        defaultTxnType="SIP"
      />
    </div>
  );
}
