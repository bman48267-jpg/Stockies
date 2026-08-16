import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layers, ShieldCheck } from 'lucide-react';
import { searchMutualFunds, getMFOverlap, type MFOverlapResult } from '@/api/mutualFunds';


export function MFOverlapPage() {
  const [codeA, setCodeA] = useState('122639');
  const [codeB, setCodeB] = useState('119063');

  const [inputA, setInputA] = useState('');
  const [inputB, setInputB] = useState('');

  // Autocomplete for A
  const { data: searchHitsA } = useQuery({
    queryKey: ['mf-overlap-search-a', inputA],
    queryFn: () => searchMutualFunds(inputA),
    enabled: inputA.trim().length > 1,
  });

  // Autocomplete for B
  const { data: searchHitsB } = useQuery({
    queryKey: ['mf-overlap-search-b', inputB],
    queryFn: () => searchMutualFunds(inputB),
    enabled: inputB.trim().length > 1,
  });

  // Fetch Overlap calculation
  const { data: overlapData, isLoading } = useQuery<MFOverlapResult>({
    queryKey: ['mf-overlap-calc', codeA, codeB],
    queryFn: () => getMFOverlap(codeA, codeB),
    enabled: !!codeA && !!codeB && codeA !== codeB,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          Portfolio Overlap Calculator <Layers size={22} className="text-emerald-400" />
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Analyze common holdings and portfolio duplication between two mutual fund schemes
        </p>
      </div>

      {/* Scheme Selectors Card */}
      <div
        className="p-6 rounded-xl space-y-4"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scheme A */}
          <div className="space-y-2 relative">
            <label className="text-xs font-semibold uppercase text-emerald-400">Scheme A</label>
            <input
              type="text"
              placeholder="Search Scheme A (e.g. Parag Parikh Flexi Cap)..."
              value={inputA || overlapData?.scheme_a.scheme_name || ''}
              onChange={(e) => setInputA(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              style={{
                backgroundColor: 'var(--bg-card-hover)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            />
            {inputA.trim().length > 1 && searchHitsA && searchHitsA.length > 0 && (
              <div
                className="absolute left-0 top-full mt-1 w-full max-h-60 overflow-y-auto rounded-lg shadow-xl z-50 p-2 space-y-1"
                style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
              >
                {searchHitsA.map((hit) => (
                  <div
                    key={hit.scheme_code}
                    onClick={() => {
                      setCodeA(hit.scheme_code);
                      setInputA('');
                    }}
                    className="p-2 hover:bg-white/5 rounded cursor-pointer text-xs"
                  >
                    <p className="font-medium text-zinc-100">{hit.scheme_name}</p>
                    <p className="text-[11px] text-zinc-400">{hit.amc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scheme B */}
          <div className="space-y-2 relative">
            <label className="text-xs font-semibold uppercase text-blue-400">Scheme B</label>
            <input
              type="text"
              placeholder="Search Scheme B (e.g. HDFC Top 100)..."
              value={inputB || overlapData?.scheme_b.scheme_name || ''}
              onChange={(e) => setInputB(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              style={{
                backgroundColor: 'var(--bg-card-hover)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            />
            {inputB.trim().length > 1 && searchHitsB && searchHitsB.length > 0 && (
              <div
                className="absolute left-0 top-full mt-1 w-full max-h-60 overflow-y-auto rounded-lg shadow-xl z-50 p-2 space-y-1"
                style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
              >
                {searchHitsB.map((hit) => (
                  <div
                    key={hit.scheme_code}
                    onClick={() => {
                      setCodeB(hit.scheme_code);
                      setInputB('');
                    }}
                    className="p-2 hover:bg-white/5 rounded cursor-pointer text-xs"
                  >
                    <p className="font-medium text-zinc-100">{hit.scheme_name}</p>
                    <p className="text-[11px] text-zinc-400">{hit.amc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlap Calculation Results */}
      {isLoading ? (
        <div className="p-16 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent mb-2"></div>
          <p>Calculating holdings overlap...</p>
        </div>
      ) : overlapData ? (
        <div className="space-y-6">
          {/* Overlap Meter Banner */}
          <div
            className="p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Portfolio Duplication Score
              </span>
              <div className="flex items-baseline gap-2 justify-center md:justify-start">
                <span className="text-4xl font-extrabold text-emerald-400">
                  {overlapData.overlap_percentage}%
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Common Holdings Overlap
                </span>
              </div>
              <p className="text-xs max-w-md" style={{ color: 'var(--text-secondary)' }}>
                {overlapData.overlap_percentage > 30
                  ? 'High overlap detected. Investing in both schemes may cause unwanted portfolio concentration.'
                  : 'Low to moderate overlap. These schemes provide good portfolio diversification.'}
              </p>
            </div>

            {/* Overlap Stats */}
            <div className="flex items-center gap-6 text-center">
              <div>
                <span className="text-2xl font-bold text-emerald-400">{overlapData.common_holdings_count}</span>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Common Stocks</p>
              </div>
              <div className="h-8 w-px bg-white/10"></div>
              <div>
                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{overlapData.unique_holdings_a_count}</span>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Unique in A</p>
              </div>
              <div className="h-8 w-px bg-white/10"></div>
              <div>
                <span className="text-2xl font-bold text-blue-400">{overlapData.unique_holdings_b_count}</span>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Unique in B</p>
              </div>
            </div>
          </div>

          {/* Common Holdings Table */}
          <div
            className="p-6 rounded-xl space-y-4"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <ShieldCheck size={18} className="text-emerald-400" /> Common Securities Breakdown
            </h2>

            {overlapData.common_holdings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      <th className="pb-3 font-medium">Security Name</th>
                      <th className="pb-3 font-medium">Sector</th>
                      <th className="pb-3 font-medium text-right">Weight in Scheme A</th>
                      <th className="pb-3 font-medium text-right">Weight in Scheme B</th>
                      <th className="pb-3 font-medium text-right">Overlap Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {overlapData.common_holdings.map((item, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                          {item.security_name}
                        </td>
                        <td className="py-3" style={{ color: 'var(--text-secondary)' }}>
                          {item.sector || 'N/A'}
                        </td>
                        <td className="py-3 text-right font-medium text-emerald-400">
                          {item.weight_in_a}%
                        </td>
                        <td className="py-3 text-right font-medium text-blue-400">
                          {item.weight_in_b}%
                        </td>
                        <td className="py-3 text-right font-bold text-amber-400">
                          {item.overlap_weight}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                No common stock holdings found between these two schemes.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
