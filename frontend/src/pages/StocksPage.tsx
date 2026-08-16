import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Filter,
  Search,
  X,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { useStockSearch } from '@/api/stocks';
import type { StockSearchResult } from '@/api/stocks';
import { formatPrice, formatMarketCap, debounce } from '@/utils/format';


// ─────────────────────────────────────────
// Popular Indian stocks for quick access
// ─────────────────────────────────────────

const POPULAR_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking' },
  { symbol: 'INFY', name: 'Infosys', sector: 'IT' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking' },
  { symbol: 'WIPRO', name: 'Wipro', sector: 'IT' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Finance' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', sector: 'Diversified' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharma', sector: 'Pharma' },
];

// ─────────────────────────────────────────
// Change badge component
// ─────────────────────────────────────────

function ChangeBadge({ value }: { value: number | null }) {
  if (value == null) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const positive = value > 0;
  const zero = value === 0;
  const color = zero ? 'var(--text-muted)' : positive ? 'var(--positive)' : 'var(--negative)';
  const Icon = zero ? Minus : positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="flex items-center gap-0.5 font-medium text-sm" style={{ color }}>
      <Icon size={13} />
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

// ─────────────────────────────────────────
// Search result row
// ─────────────────────────────────────────

function SearchResultRow({ result }: { result: StockSearchResult }) {
  return (
    <Link
      to={`/stocks/${result.symbol}?exchange=${result.exchange}`}
      className="flex items-center justify-between p-4 rounded-xl transition-all hover:-translate-y-0.5 group"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Symbol badge */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: 'var(--accent)22', color: 'var(--accent)' }}
          aria-label={`${result.symbol} logo`}
        >
          {result.symbol.slice(0, 3)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {result.company_name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
              }}
            >
              {result.symbol}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {result.exchange}
            </span>
            {result.sector && (
              <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                · {result.sector}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {result.current_price != null ? formatPrice(result.current_price) : '—'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {result.market_cap != null ? formatMarketCap(result.market_cap) : ''}
          </p>
        </div>
        <ChangeBadge value={result.change_percent} />
        <ArrowUpRight
          size={14}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--accent)' }}
        />
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────
// Popular stock chip
// ─────────────────────────────────────────

function PopularChip({
  symbol,
  name,
  sector,
  onSelect,
}: {
  symbol: string;
  name: string;
  sector: string;
  onSelect: (s: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(symbol)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:-translate-y-0.5"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        color: 'var(--text-secondary)',
      }}
      aria-label={`Search ${name}`}
    >
      <span className="font-semibold text-xs" style={{ color: 'var(--accent)' }}>
        {symbol}
      </span>
      <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
        {sector}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────

export function StocksPage() {
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [exchange, setExchange] = useState<'NSE' | 'BSE'>('NSE');

  const { data, isLoading, isError, error } = useStockSearch(query, exchange);

  // Debounce the actual API query
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetQuery = useCallback(
    debounce((val: string) => setQuery(val), 400),
    []
  );

  const handleInput = (val: string) => {
    setInputValue(val);
    debouncedSetQuery(val);
  };

  const clearSearch = () => {
    setInputValue('');
    setQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Stocks
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Research NSE and BSE listed Indian companies
          </p>
        </div>
        <Link
          to="/stocks/screener"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--bg-card)',
            color: 'var(--accent)',
            border: '1px solid var(--border)',
          }}
          aria-label="Open stock screener"
        >
          <Filter size={15} />
          Screener
        </Link>
      </div>

      {/* Search bar */}
      <div
        className="rounded-xl p-4 space-y-4"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex gap-3">
          {/* Exchange toggle */}
          <div
            className="flex rounded-lg overflow-hidden flex-shrink-0"
            style={{ border: '1px solid var(--border)' }}
            role="group"
            aria-label="Exchange selector"
          >
            {(['NSE', 'BSE'] as const).map((ex) => (
              <button
                key={ex}
                id={`exchange-${ex.toLowerCase()}`}
                onClick={() => setExchange(ex)}
                className="px-3 py-2 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: exchange === ex ? 'var(--accent)' : 'transparent',
                  color: exchange === ex ? '#fff' : 'var(--text-secondary)',
                }}
                aria-pressed={exchange === ex}
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              id="stock-search-input"
              type="text"
              value={inputValue}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="Search by symbol or company name (e.g. RELIANCE, Infosys)"
              className="w-full pl-10 pr-10 py-2 rounded-lg text-sm outline-none transition-all"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              autoComplete="off"
              spellCheck={false}
              aria-label="Stock search"
            />
            {inputValue && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label="Clear search"
              >
                <X size={14} style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>
        </div>

        {/* Popular chips */}
        {!query && (
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              Popular stocks:
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_STOCKS.map((s) => (
                <PopularChip
                  key={s.symbol}
                  symbol={s.symbol}
                  name={s.name}
                  sector={s.sector}
                  onSelect={(sym) => {
                    setInputValue(sym);
                    setQuery(sym);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading && query.length >= 2 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
          <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Searching stocks…
          </span>
        </div>
      )}

      {isError && (
        <div
          className="flex items-center gap-3 rounded-xl p-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--negative)33',
            color: 'var(--negative)',
          }}
          role="alert"
        >
          <AlertCircle size={18} />
          <div>
            <p className="text-sm font-medium">Search failed</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {error instanceof Error ? error.message : 'Could not connect to Stockies server.'}
            </p>
          </div>
        </div>
      )}

      {data && data.results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {data.count} result{data.count !== 1 ? 's' : ''} for "{data.query}"
          </p>
          {data.results.map((result) => (
            <SearchResultRow key={`${result.symbol}-${result.exchange}`} result={result} />
          ))}
        </div>
      )}

      {data && data.results.length === 0 && query.length >= 2 && (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-xl"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <TrendingUp size={22} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            No results found
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Try a different symbol or company name
          </p>
        </div>
      )}
    </div>
  );
}
