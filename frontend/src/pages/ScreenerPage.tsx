import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, RefreshCw, ExternalLink } from 'lucide-react';
import apiClient from '@/api/client';
import { useQuery } from '@tanstack/react-query';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScreenerFilters {
  exchange: 'NSE' | 'BSE';
  min_market_cap?: number;
  max_market_cap?: number;
  min_pe?: number;
  max_pe?: number;
  min_pb?: number;
  max_pb?: number;
  min_roe?: number;
  max_roe?: number;
  min_net_margin?: number;
  max_net_margin?: number;
  min_revenue_growth?: number;
  max_revenue_growth?: number;
  min_earnings_growth?: number;
  max_earnings_growth?: number;
  max_debt_to_equity?: number;
  min_dividend_yield?: number;
  sector?: string;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  limit: number;
}

interface ScreenerResultItem {
  symbol: string;
  exchange: string;
  company_name: string;
  sector?: string;
  current_price?: number;
  change_percent?: number;
  market_cap?: number;
  pe_ratio?: number;
  pb_ratio?: number;
  roe?: number;
  net_margin?: number;
  revenue_growth?: number;
  earnings_growth?: number;
  debt_to_equity?: number;
  dividend_yield?: number;
}

interface ScreenerResponse {
  results: ScreenerResultItem[];
  total_screened: number;
  total_matched: number;
  exchange: string;
  timestamp: string;
}

// ─── Preset Strategies ────────────────────────────────────────────────────────

const PRESETS = [
  {
    id: 'quality_growth',
    label: 'Quality Growth',
    icon: '🚀',
    description: 'High ROE, strong revenue growth, low debt',
    filters: { min_roe: 15, min_revenue_growth: 10, max_debt_to_equity: 100, max_pe: 60 },
  },
  {
    id: 'value_picks',
    label: 'Value Picks',
    icon: '💎',
    description: 'Low P/E, low P/B, profitable companies',
    filters: { max_pe: 20, max_pb: 3, min_net_margin: 5 },
  },
  {
    id: 'dividend_fortress',
    label: 'Dividend Fortress',
    icon: '🏦',
    description: 'High dividend yield with financial strength',
    filters: { min_dividend_yield: 2, max_debt_to_equity: 80, min_roe: 10 },
  },
  {
    id: 'large_cap_leaders',
    label: 'Large Cap Leaders',
    icon: '🏆',
    description: 'Market cap > ₹50,000 Cr megacaps',
    filters: { min_market_cap: 50000 },
  },
  {
    id: 'high_margin',
    label: 'High Margin',
    icon: '📈',
    description: 'Companies with strong net margins > 15%',
    filters: { min_net_margin: 15 },
  },
];

const SECTORS = [
  'Energy', 'Technology', 'Financial Services', 'Healthcare',
  'Consumer Cyclical', 'Consumer Defensive', 'Industrials',
  'Basic Materials', 'Communication Services', 'Real Estate', 'Utilities',
];

const COLUMNS = [
  { key: 'company_name', label: 'Company', sortable: false },
  { key: 'current_price', label: 'Price (₹)', sortable: true },
  { key: 'change_percent', label: 'Change %', sortable: true },
  { key: 'market_cap', label: 'Mkt Cap (Cr)', sortable: true },
  { key: 'pe_ratio', label: 'P/E', sortable: true },
  { key: 'pb_ratio', label: 'P/B', sortable: true },
  { key: 'roe', label: 'ROE %', sortable: true },
  { key: 'net_margin', label: 'Net Margin %', sortable: true },
  { key: 'revenue_growth', label: 'Rev Growth %', sortable: true },
  { key: 'debt_to_equity', label: 'D/E', sortable: true },
];

// ─── Helper Components ────────────────────────────────────────────────────────

function FilterInput({
  label, hint, minKey, maxKey, filters, setFilters,
}: {
  label: string; hint?: string;
  minKey: keyof ScreenerFilters; maxKey: keyof ScreenerFilters;
  filters: ScreenerFilters; setFilters: (f: ScreenerFilters) => void;
}) {
  return (
    <div className="screener-filter-group">
      <label className="screener-filter-label">{label}</label>
      {hint && <span className="screener-filter-hint">{hint}</span>}
      <div className="screener-filter-inputs">
        <input
          type="number"
          placeholder="Min"
          className="screener-input"
          value={(filters[minKey] as number) ?? ''}
          onChange={e => setFilters({ ...filters, [minKey]: e.target.value ? +e.target.value : undefined })}
        />
        <span className="screener-filter-sep">—</span>
        <input
          type="number"
          placeholder="Max"
          className="screener-input"
          value={(filters[maxKey] as number) ?? ''}
          onChange={e => setFilters({ ...filters, [maxKey]: e.target.value ? +e.target.value : undefined })}
        />
      </div>
    </div>
  );
}

function SingleInput({
  label, hint, filterKey, filters, setFilters, placeholder,
}: {
  label: string; hint?: string; filterKey: keyof ScreenerFilters;
  filters: ScreenerFilters; setFilters: (f: ScreenerFilters) => void; placeholder?: string;
}) {
  return (
    <div className="screener-filter-group">
      <label className="screener-filter-label">{label}</label>
      {hint && <span className="screener-filter-hint">{hint}</span>}
      <input
        type="number"
        placeholder={placeholder ?? 'Max'}
        className="screener-input"
        value={(filters[filterKey] as number) ?? ''}
        onChange={e => setFilters({ ...filters, [filterKey]: e.target.value ? +e.target.value : undefined })}
      />
    </div>
  );
}

function CellValue({ value, type }: { value?: number | null; type?: string }) {
  if (value == null) return <span style={{ color: 'var(--text-muted)' }}>—</span>;

  if (type === 'change') {
    const color = value > 0 ? 'var(--positive)' : value < 0 ? 'var(--negative)' : 'var(--text-secondary)';
    return <span style={{ color, fontWeight: 600 }}>{value > 0 ? '+' : ''}{value.toFixed(2)}%</span>;
  }
  if (type === 'growth') {
    const color = value > 0 ? 'var(--positive)' : 'var(--negative)';
    return <span style={{ color, fontWeight: 600 }}>{value > 0 ? '+' : ''}{value.toFixed(1)}%</span>;
  }
  if (type === 'marketcap') {
    if (value >= 100000) return <span>{(value / 100000).toFixed(1)}L Cr</span>;
    if (value >= 1000) return <span>{(value / 1000).toFixed(1)}K Cr</span>;
    return <span>{value.toFixed(0)} Cr</span>;
  }
  return <span>{value.toFixed(2)}</span>;
}

const DEFAULT_FILTERS: ScreenerFilters = {
  exchange: 'NSE',
  sort_by: 'market_cap',
  sort_order: 'desc',
  limit: 25,
};

async function runScreener(filters: ScreenerFilters): Promise<ScreenerResponse> {
  // Strip undefined fields
  const body = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
  );
  const res = await apiClient.post<ScreenerResponse>('/stocks/screener', body);
  return res.data;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ScreenerPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ScreenerFilters>(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] = useState<ScreenerFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const { data, isFetching, error, refetch } = useQuery<ScreenerResponse>({
    queryKey: ['screener', filters],
    queryFn: () => runScreener(filters),
    enabled: hasRun,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const applyFilters = useCallback(() => {
    setFilters({ ...pendingFilters });
    setHasRun(true);
    setFiltersOpen(false);
  }, [pendingFilters]);

  const handlePreset = (preset: typeof PRESETS[0]) => {
    const next = { ...DEFAULT_FILTERS, ...preset.filters };
    setPendingFilters(next);
    setFilters(next);
    setActivePreset(preset.id);
    setHasRun(true);
  };

  const handleSort = (col: string) => {
    const next: ScreenerFilters = {
      ...filters,
      sort_by: col,
      sort_order: filters.sort_by === col && filters.sort_order === 'desc' ? 'asc' : 'desc',
    };
    setFilters(next);
    setPendingFilters(next);
  };

  const resetFilters = () => {
    setPendingFilters(DEFAULT_FILTERS);
    setActivePreset(null);
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (filters.sort_by !== col) return <ArrowUpDown size={12} style={{ opacity: 0.4 }} />;
    return filters.sort_order === 'asc'
      ? <ArrowUp size={12} style={{ color: 'var(--accent)' }} />
      : <ArrowDown size={12} style={{ color: 'var(--accent)' }} />;
  };

  return (
    <div className="screener-page">
      {/* ── Header ── */}
      <div className="screener-header">
        <div>
          <h1 className="screener-title">
            <Filter size={20} />
            Stock Screener
          </h1>
          <p className="screener-subtitle">Filter NSE &amp; BSE stocks using 10+ fundamental metrics</p>
        </div>
        <div className="screener-header-actions">
          <button
            className="btn-ghost"
            onClick={() => setFiltersOpen(o => !o)}
            id="toggle-filters-btn"
          >
            <SlidersHorizontal size={15} />
            {filtersOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
          {hasRun && (
            <button className="btn-ghost" onClick={() => refetch()} id="refresh-screener-btn">
              <RefreshCw size={15} className={isFetching ? 'spin' : ''} />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* ── Preset Strategies ── */}
      <div className="screener-presets">
        {PRESETS.map(p => (
          <button
            key={p.id}
            id={`preset-${p.id}`}
            onClick={() => handlePreset(p)}
            className={`screener-preset-btn ${activePreset === p.id ? 'active' : ''}`}
            title={p.description}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* ── Filter Panel ── */}
      {filtersOpen && (
        <div className="screener-filter-panel">
          {/* Exchange + Sector */}
          <div className="screener-filter-row">
            <div className="screener-filter-group">
              <label className="screener-filter-label">Exchange</label>
              <div className="exchange-toggle">
                {(['NSE', 'BSE'] as const).map(ex => (
                  <button
                    key={ex}
                    className={`exchange-btn ${pendingFilters.exchange === ex ? 'active' : ''}`}
                    onClick={() => setPendingFilters({ ...pendingFilters, exchange: ex })}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div className="screener-filter-group">
              <label className="screener-filter-label">Sector</label>
              <select
                className="screener-input screener-select"
                value={pendingFilters.sector ?? ''}
                onChange={e => setPendingFilters({ ...pendingFilters, sector: e.target.value || undefined })}
              >
                <option value="">All Sectors</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="screener-filter-group">
              <label className="screener-filter-label">Results</label>
              <select
                className="screener-input screener-select"
                value={pendingFilters.limit}
                onChange={e => setPendingFilters({ ...pendingFilters, limit: +e.target.value })}
              >
                {[10, 25, 50].map(n => <option key={n} value={n}>{n} stocks</option>)}
              </select>
            </div>
          </div>

          <div className="screener-filter-divider">
            <span>Valuation</span>
          </div>
          <div className="screener-filter-row">
            <FilterInput label="Market Cap (₹ Cr)" hint="e.g. 10000" minKey="min_market_cap" maxKey="max_market_cap" filters={pendingFilters} setFilters={setPendingFilters} />
            <FilterInput label="P/E Ratio" hint="e.g. 10–40" minKey="min_pe" maxKey="max_pe" filters={pendingFilters} setFilters={setPendingFilters} />
            <FilterInput label="P/B Ratio" minKey="min_pb" maxKey="max_pb" filters={pendingFilters} setFilters={setPendingFilters} />
          </div>

          <div className="screener-filter-divider">
            <span>Profitability</span>
          </div>
          <div className="screener-filter-row">
            <FilterInput label="ROE (%)" hint="e.g. min 15%" minKey="min_roe" maxKey="max_roe" filters={pendingFilters} setFilters={setPendingFilters} />
            <FilterInput label="Net Margin (%)" minKey="min_net_margin" maxKey="max_net_margin" filters={pendingFilters} setFilters={setPendingFilters} />
            <FilterInput label="Revenue Growth (%)" minKey="min_revenue_growth" maxKey="max_revenue_growth" filters={pendingFilters} setFilters={setPendingFilters} />
          </div>

          <div className="screener-filter-divider">
            <span>Financial Strength</span>
          </div>
          <div className="screener-filter-row">
            <SingleInput label="Max Debt/Equity" hint="e.g. 100" filterKey="max_debt_to_equity" filters={pendingFilters} setFilters={setPendingFilters} placeholder="Max" />
            <SingleInput label="Min Dividend Yield (%)" filterKey="min_dividend_yield" filters={pendingFilters} setFilters={setPendingFilters} placeholder="Min %" />
            <FilterInput label="Earnings Growth (%)" minKey="min_earnings_growth" maxKey="max_earnings_growth" filters={pendingFilters} setFilters={setPendingFilters} />
          </div>

          <div className="screener-filter-actions">
            <button className="btn-ghost" onClick={resetFilters} id="reset-filters-btn">
              Reset
            </button>
            <button className="btn-primary screener-run-btn" onClick={applyFilters} id="run-screener-btn">
              <Filter size={15} />
              {isFetching ? 'Screening…' : 'Run Screener'}
            </button>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {isFetching && (
        <div className="screener-loading">
          <div className="screener-loading-dots">
            <div className="dot" /><div className="dot" /><div className="dot" />
          </div>
          <p>Fetching live data from NSE… this takes 15–30 seconds</p>
        </div>
      )}

      {error && !isFetching && (
        <div className="screener-error">
          <p>Screener failed: {(error as Error).message}</p>
          <button className="btn-ghost" onClick={() => refetch()}>Try again</button>
        </div>
      )}

      {data && !isFetching && (
        <>
          <div className="screener-results-header">
            <div className="screener-results-meta">
              <TrendingUp size={15} />
              <span><strong>{data.total_matched}</strong> stocks matched · {data.total_screened} screened · {data.exchange}</span>
            </div>
            <span className="screener-timestamp">
              Updated {new Date(data.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
            </span>
          </div>

          {data.results.length === 0 ? (
            <div className="screener-empty">
              <Filter size={32} style={{ color: 'var(--text-muted)' }} />
              <p>No stocks matched your criteria. Try relaxing the filters.</p>
            </div>
          ) : (
            <div className="screener-table-wrapper">
              <table className="screener-table">
                <thead>
                  <tr>
                    <th className="screener-th">#</th>
                    {COLUMNS.map(col => (
                      <th
                        key={col.key}
                        className={`screener-th ${col.sortable ? 'sortable' : ''}`}
                        onClick={col.sortable ? () => handleSort(col.key) : undefined}
                      >
                        <div className="screener-th-inner">
                          {col.label}
                          {col.sortable && <SortIcon col={col.key} />}
                        </div>
                      </th>
                    ))}
                    <th className="screener-th">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((stock, i) => (
                    <tr
                      key={`${stock.symbol}-${stock.exchange}`}
                      className="screener-row"
                      onClick={() => navigate(`/stocks/${stock.symbol}?exchange=${stock.exchange}`)}
                    >
                      <td className="screener-td screener-rank">{i + 1}</td>
                      <td className="screener-td screener-company">
                        <div className="screener-company-badge">{stock.symbol.slice(0, 3)}</div>
                        <div>
                          <div className="screener-company-name">{stock.company_name}</div>
                          <div className="screener-company-meta">
                            <span className="screener-symbol-tag">{stock.symbol}</span>
                            {stock.sector && <span className="screener-sector-tag">{stock.sector}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="screener-td screener-num">
                        {stock.current_price ? `₹${stock.current_price.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="screener-td screener-num">
                        <CellValue value={stock.change_percent} type="change" />
                      </td>
                      <td className="screener-td screener-num">
                        <CellValue value={stock.market_cap} type="marketcap" />
                      </td>
                      <td className="screener-td screener-num">
                        <CellValue value={stock.pe_ratio} />
                      </td>
                      <td className="screener-td screener-num">
                        <CellValue value={stock.pb_ratio} />
                      </td>
                      <td className="screener-td screener-num">
                        <CellValue value={stock.roe} type="growth" />
                      </td>
                      <td className="screener-td screener-num">
                        <CellValue value={stock.net_margin} type="growth" />
                      </td>
                      <td className="screener-td screener-num">
                        <CellValue value={stock.revenue_growth} type="growth" />
                      </td>
                      <td className="screener-td screener-num">
                        <CellValue value={stock.debt_to_equity} />
                      </td>
                      <td className="screener-td" onClick={e => e.stopPropagation()}>
                        <button
                          className="screener-view-btn"
                          onClick={() => navigate(`/stocks/${stock.symbol}?exchange=${stock.exchange}`)}
                          title="View detail"
                        >
                          <ExternalLink size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!hasRun && !isFetching && (
        <div className="screener-cta">
          <div className="screener-cta-inner">
            <div className="screener-cta-icon">📊</div>
            <h2>Build Your Watchlist</h2>
            <p>Select a preset strategy above or configure custom filters, then hit <strong>Run Screener</strong> to scan {' '}
              <strong>50+ top Indian stocks</strong> using live fundamental data.</p>
            <button className="btn-primary" onClick={() => { setHasRun(true); refetch(); }} id="start-screener-btn">
              <Filter size={15} />
              Run with Current Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
