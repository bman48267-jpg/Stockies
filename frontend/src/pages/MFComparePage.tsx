import { useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { GitCompare, X, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { searchMutualFunds, compareMutualFunds, getMFNAVHistory } from '@/api/mutualFunds';


const DEFAULT_CODES = ['122639', '119063'];
const LINE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'];
const TIMEFRAMES = ['1D', '1W', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'] as const;

export function MFComparePage() {
  const [selectedCodes, setSelectedCodes] = useState<string[]>(DEFAULT_CODES);
  const [searchInput, setSearchInput] = useState('');
  const [period, setPeriod] = useState<string>('1Y');

  // Search autocomplete
  const { data: searchHits } = useQuery({
    queryKey: ['mf-compare-search', searchInput],
    queryFn: () => searchMutualFunds(searchInput),
    enabled: searchInput.trim().length > 1,
  });

  // Fetch comparison data
  const { data: comparisonSchemes, isLoading } = useQuery({
    queryKey: ['mf-compare-data', selectedCodes],
    queryFn: () => compareMutualFunds(selectedCodes),
    enabled: selectedCodes.length >= 1,
  });

  // Map selection context
  const mapPeriodToApi = (p: string) => {
    const pl = p.toLowerCase();
    if (pl === '1d' || pl === '1w' || pl === '1m') return '1m';
    if (pl === '3m' || pl === '6m') return '6m';
    if (pl === '1y') return '1y';
    if (pl === '3y') return '3y';
    if (pl === '5y') return '5y';
    return 'max';
  };

  const getSlicePoints = (p: string) => {
    const pl = p.toLowerCase();
    if (pl === '1d') return 2;
    if (pl === '1w') return 7;
    if (pl === '3m') return 90;
    return undefined;
  };

  const apiPeriod = mapPeriodToApi(period);

  const historyQueries = useQueries({
    queries: selectedCodes.map((code) => ({
      queryKey: ['mf-compare-history', code, apiPeriod],
      queryFn: () => getMFNAVHistory(code, apiPeriod),
      enabled: selectedCodes.length > 0,
    })),
  });

  const isLoadingHistory = historyQueries.some((q) => q.isLoading);

  const primaryHistory = historyQueries[0]?.data || [];
  const sliceCount = getSlicePoints(period);
  const slicedPrimary = sliceCount ? primaryHistory.slice(-sliceCount) : primaryHistory;

  const chartData = slicedPrimary.map((pt, index) => {
    const baseNav0 = slicedPrimary[0]?.nav || 1;
    const return0 = ((pt.nav - baseNav0) / baseNav0) * 100;

    const dataPoint: any = {
      date: pt.date,
      label: new Date(pt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      [`fund_0`]: parseFloat(return0.toFixed(2)),
      [`fund_nav_0`]: pt.nav,
    };

    selectedCodes.forEach((_, i) => {
      if (i === 0) return;
      const otherHistory = historyQueries[i]?.data || [];
      const slicedOther = sliceCount ? otherHistory.slice(-sliceCount) : otherHistory;
      const ptOther = slicedOther[index] || slicedOther[slicedOther.length - 1];

      if (ptOther) {
        const baseNavOther = slicedOther[0]?.nav || 1;
        const returnOther = ((ptOther.nav - baseNavOther) / baseNavOther) * 100;
        dataPoint[`fund_${i}`] = parseFloat(returnOther.toFixed(2));
        dataPoint[`fund_nav_${i}`] = ptOther.nav;
      }
    });

    return dataPoint;
  });

  const handleAddScheme = (code: string) => {
    if (selectedCodes.includes(code)) return;
    if (selectedCodes.length >= 4) return;
    setSelectedCodes([...selectedCodes, code]);
    setSearchInput('');
  };

  const handleRemoveScheme = (code: string) => {
    if (selectedCodes.length <= 1) return;
    setSelectedCodes(selectedCodes.filter((c) => c !== code));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          Compare Mutual Funds <GitCompare size={22} className="text-emerald-400" />
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Compare 2 to 4 Indian mutual fund schemes side-by-side across returns, risk, expense ratio, and AUM
        </p>
      </div>

      {/* Add Scheme Search Input */}
      <div className="p-4 rounded-xl space-y-3 relative" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Selected Schemes ({selectedCodes.length}/4)
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {comparisonSchemes?.map((scheme) => (
            <div
              key={scheme.scheme_code}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border"
              style={{
                backgroundColor: 'var(--bg-card-hover)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <span>{scheme.scheme_name}</span>
              {selectedCodes.length > 1 && (
                <button onClick={() => handleRemoveScheme(scheme.scheme_code)} className="hover:text-rose-400">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}

          {selectedCodes.length < 4 && (
            <div className="relative">
              <input
                type="text"
                placeholder="+ Add another fund to compare..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500 min-w-[220px]"
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              />

              {/* Autocomplete Dropdown */}
              {searchInput.trim().length > 1 && searchHits && searchHits.length > 0 && (
                <div
                  className="absolute left-0 top-full mt-1 w-80 max-h-60 overflow-y-auto rounded-lg shadow-xl z-50 p-2 space-y-1"
                  style={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                  }}
                >
                  {searchHits.map((hit) => (
                    <div
                      key={hit.scheme_code}
                      onClick={() => handleAddScheme(hit.scheme_code)}
                      className="p-2 hover:bg-white/5 rounded cursor-pointer text-xs"
                    >
                      <p className="font-medium text-zinc-100">{hit.scheme_name}</p>
                      <p className="text-[11px] text-zinc-400">{hit.amc || 'Mutual Fund'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent mb-2"></div>
          <p>Loading comparative analytics...</p>
        </div>
      ) : !comparisonSchemes || comparisonSchemes.length === 0 ? (
        <div className="p-12 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          No schemes selected.
        </div>
      ) : (
        <>
          {/* Comparison Matrix Table */}
          <div
            className="rounded-xl overflow-x-auto"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="p-4 font-semibold w-48" style={{ color: 'var(--text-secondary)' }}>Metric</th>
                  {comparisonSchemes.map((scheme, i) => (
                    <th key={scheme.scheme_code} className="p-4 font-semibold min-w-[200px]" style={{ color: LINE_COLORS[i % LINE_COLORS.length] }}>
                      <div className="space-y-1">
                        <span className="text-xs px-2 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-400">
                          {scheme.amc}
                        </span>
                        <p className="text-sm font-bold block" style={{ color: 'var(--text-primary)' }}>
                          {scheme.scheme_name}
                        </p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                <tr>
                  <td className="p-4 font-medium" style={{ color: 'var(--text-secondary)' }}>Category</td>
                  {comparisonSchemes.map((s) => (
                    <td key={s.scheme_code} className="p-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {s.sub_category || s.category}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium" style={{ color: 'var(--text-secondary)' }}>Riskometer</td>
                  {comparisonSchemes.map((s) => (
                    <td key={s.scheme_code} className="p-4 text-amber-400 font-medium">
                      {s.risk_level || 'Very High'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium" style={{ color: 'var(--text-secondary)' }}>Current NAV</td>
                  {comparisonSchemes.map((s) => (
                    <td key={s.scheme_code} className="p-4 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      ₹{s.current_nav?.toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium" style={{ color: 'var(--text-secondary)' }}>1 Year CAGR</td>
                  {comparisonSchemes.map((s) => (
                    <td key={s.scheme_code} className="p-4 font-bold text-emerald-400">
                      {s.cagr_1y ? `+${s.cagr_1y}%` : 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium" style={{ color: 'var(--text-secondary)' }}>3 Year CAGR</td>
                  {comparisonSchemes.map((s) => (
                    <td key={s.scheme_code} className="p-4 font-bold text-emerald-400">
                      {s.cagr_3y ? `+${s.cagr_3y}%` : 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium" style={{ color: 'var(--text-secondary)' }}>5 Year CAGR</td>
                  {comparisonSchemes.map((s) => (
                    <td key={s.scheme_code} className="p-4 font-bold text-emerald-400">
                      {s.cagr_5y ? `+${s.cagr_5y}%` : 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium" style={{ color: 'var(--text-secondary)' }}>Expense Ratio</td>
                  {comparisonSchemes.map((s) => (
                    <td key={s.scheme_code} className="p-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {s.expense_ratio}%
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium" style={{ color: 'var(--text-secondary)' }}>Fund AUM</td>
                  {comparisonSchemes.map((s) => (
                    <td key={s.scheme_code} className="p-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                      ₹{(s.aum || 0).toLocaleString()} Cr
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium" style={{ color: 'var(--text-secondary)' }}>Benchmark</td>
                  {comparisonSchemes.map((s) => (
                    <td key={s.scheme_code} className="p-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {s.benchmark || 'NIFTY 500 TRI'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Historical NAV Comparative Chart */}
          <div className="p-6 rounded-xl space-y-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center sm:flex-nowrap flex-wrap gap-4">
              <div>
                <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <TrendingUp size={16} className="text-emerald-400" /> Historical NAV Comparison
                </h2>
                <p className="text-[11px] text-muted mt-0.5">Cumulative return percentage relative to start date</p>
              </div>

              {/* Segmented Timeline Buttons */}
              <div className="flex bg-zinc-800/80 p-0.5 rounded-xl border border-zinc-700/50">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setPeriod(tf)}
                    className={`px-3 py-1 font-semibold rounded-lg text-xs transition-all uppercase ${
                      period === tf
                        ? 'bg-emerald-500 text-black shadow-sm font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 w-full">
              {isLoadingHistory ? (
                <div className="h-full flex items-center justify-center text-xs text-muted">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent mr-2"></div>
                  Comparing performance trajectory...
                </div>
              ) : chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="label"
                      tick={false}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const dateStr = payload[0].payload.date;
                          const formattedDate = new Date(dateStr).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          });
                          return (
                            <div className="p-3.5 rounded-xl shadow-xl space-y-2 border" style={{ backgroundColor: '#18181b', borderColor: '#27272a' }}>
                              <p className="text-[10px] uppercase font-bold text-muted font-mono">{formattedDate}</p>
                              <div className="space-y-1.5">
                                {payload.map((p: any, idx: number) => {
                                  const matches = p.dataKey.match(/fund_(\d+)/);
                                  const fundIndex = matches ? parseInt(matches[1]) : 0;
                                  const scheme = comparisonSchemes[fundIndex];
                                  if (!scheme) return null;
                                  const val = p.value as number;
                                  const rawNav = p.payload[`fund_nav_${fundIndex}`];
                                  return (
                                    <div key={idx} className="flex justify-between gap-6 text-xs font-semibold">
                                      <span style={{ color: p.color }} className="truncate max-w-[200px]">
                                        {scheme.scheme_name}
                                      </span>
                                      <span className="font-mono text-zinc-100 flex items-center gap-1.5">
                                        <span className={val >= 0 ? 'text-positive font-bold' : 'text-negative font-bold'}>
                                          {val >= 0 ? '+' : ''}{val.toFixed(2)}%
                                        </span>
                                        <span className="text-zinc-400 text-[10px]">(₹{rawNav?.toFixed(2)})</span>
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {comparisonSchemes.map((scheme, i) => (
                      <Line
                        key={scheme.scheme_code}
                        type="monotone"
                        dataKey={`fund_${i}`}
                        name={scheme.scheme_name}
                        stroke={LINE_COLORS[i % LINE_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                  NAV comparison history chart ready.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
