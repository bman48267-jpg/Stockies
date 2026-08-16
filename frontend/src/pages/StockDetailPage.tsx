import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useStockQuote, useStockFundamentals, useStockHistory } from '@/api/stocks';
import type { StockQuoteResponse, StockFundamentalsResponse } from '@/api/stocks';
import {
  formatPrice,
  formatMarketCap,
  formatCurrency,
} from '@/utils/format';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';



// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

function QuoteStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p
        className="text-sm font-semibold mt-0.5"
        style={{ color: color ?? 'var(--text-primary)' }}
      >
        {value}
      </p>
    </div>
  );
}

function FundRow({
  label,
  value,
  tooltip,
  color,
}: {
  label: string;
  value: string | null;
  tooltip?: string;
  color?: string;
}) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <span className="text-sm flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
        {label}
        {tooltip && (
          <span title={tooltip}>
            <Info size={11} style={{ color: 'var(--text-muted)' }} />
          </span>
        )}
      </span>
      <span className="text-sm font-semibold" style={{ color: color ?? 'var(--text-primary)' }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

// Simple sparkline using SVG (close prices as a path)
function MiniChart({ data }: { data: number[] }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 200;
  const H = 60;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  });

  const isPositive = data[data.length - 1] >= data[0];
  const color = isPositive ? 'var(--positive)' : 'var(--negative)';

  const areaPoints = [
    `0,${H}`,
    ...points,
    `${W},${H}`,
  ].join(' ');

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full h-full"
      aria-label="Price chart"
    >
      <defs>
        <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#chart-gradient)" />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────
// Quote header card
// ─────────────────────────────────────────

function QuoteCard({
  quote,
  symbol,
  exchange,
  chartData,
  isRefetching,
  onRefetch,
}: {
  quote: StockQuoteResponse;
  symbol: string;
  exchange: string;
  chartData: number[];
  isRefetching: boolean;
  onRefetch: () => void;
}) {
  const positive = quote.change >= 0;
  const changeColor = positive ? 'var(--positive)' : 'var(--negative)';

  return (
    <div
      className="rounded-2xl p-6"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {/* Company name + symbol */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: 'var(--accent)22', color: 'var(--accent)' }}
            aria-label={`${symbol} icon`}
          >
            {symbol.slice(0, 3)}
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {quote.company_name}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-xs font-mono px-2 py-0.5 rounded"
                style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              >
                {symbol}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {exchange}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onRefetch}
          disabled={isRefetching}
          className="p-2 rounded-lg transition-all"
          style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
          title="Refresh quote"
          aria-label="Refresh stock quote"
        >
          <RefreshCw size={15} className={isRefetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Price + change */}
      <div className="flex items-end gap-4 mb-6">
        <div>
          <p className="text-4xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {formatPrice(quote.current_price)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {positive ? (
              <TrendingUp size={16} style={{ color: changeColor }} />
            ) : (
              <TrendingDown size={16} style={{ color: changeColor }} />
            )}
            <span className="text-base font-semibold tabular-nums" style={{ color: changeColor }}>
              {positive ? '+' : ''}
              {formatPrice(quote.change).replace('₹', '')} ({positive ? '+' : ''}
              {quote.change_percent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Mini sparkline */}
        {chartData.length > 2 && (
          <div className="flex-1 h-14 ml-auto opacity-80">
            <MiniChart data={chartData} />
          </div>
        )}
      </div>

      {/* OHLCV stats */}
      <div
        className="grid grid-cols-3 sm:grid-cols-6 gap-4 pt-4"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <QuoteStat label="Open" value={quote.open != null ? formatPrice(quote.open) : '—'} />
        <QuoteStat label="High" value={quote.high != null ? formatPrice(quote.high) : '—'} />
        <QuoteStat label="Low" value={quote.low != null ? formatPrice(quote.low) : '—'} />
        <QuoteStat
          label="Prev Close"
          value={formatPrice(quote.previous_close)}
        />
        <QuoteStat
          label="52W High"
          value={
            quote.fifty_two_week_high != null ? formatPrice(quote.fifty_two_week_high) : '—'
          }
        />
        <QuoteStat
          label="52W Low"
          value={quote.fifty_two_week_low != null ? formatPrice(quote.fifty_two_week_low) : '—'}
        />
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Market Cap: {quote.market_cap != null ? formatMarketCap(quote.market_cap) : '—'}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Updated: {new Date(quote.timestamp).toLocaleTimeString('en-IN')} IST
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Fundamentals card
// ─────────────────────────────────────────

function FundamentalsCard({ fund }: { fund: StockFundamentalsResponse }) {
  const pct = (v: number | null) => (v != null ? `${v.toFixed(2)}%` : null);
  const num = (v: number | null, decimals = 2) => (v != null ? v.toFixed(decimals) : null);

  const sections = [
    {
      title: 'Valuation',
      rows: [
        { label: 'P/E Ratio', value: num(fund.pe_ratio), tooltip: 'Price to Earnings ratio' },
        { label: 'P/B Ratio', value: num(fund.pb_ratio), tooltip: 'Price to Book Value ratio' },
        { label: 'PEG Ratio', value: num(fund.peg_ratio), tooltip: 'Price/Earnings to Growth ratio' },
        { label: 'EV/EBITDA', value: num(fund.ev_ebitda) },
        { label: 'Dividend Yield', value: pct(fund.dividend_yield) },
      ],
    },
    {
      title: 'Profitability',
      rows: [
        {
          label: 'Return on Equity',
          value: pct(fund.roe),
          color:
            fund.roe != null
              ? fund.roe > 20
                ? 'var(--positive)'
                : fund.roe > 10
                ? 'var(--text-primary)'
                : 'var(--negative)'
              : undefined,
        },
        { label: 'Net Margin', value: pct(fund.net_margin) },
        { label: 'Operating Margin', value: pct(fund.operating_margin) },
      ],
    },
    {
      title: 'Growth',
      rows: [
        {
          label: 'Revenue Growth (YoY)',
          value: fund.revenue_growth != null ? `${fund.revenue_growth > 0 ? '+' : ''}${fund.revenue_growth.toFixed(2)}%` : null,
          color:
            fund.revenue_growth != null
              ? fund.revenue_growth > 0
                ? 'var(--positive)'
                : 'var(--negative)'
              : undefined,
        },
        {
          label: 'Earnings Growth (YoY)',
          value: fund.earnings_growth != null ? `${fund.earnings_growth > 0 ? '+' : ''}${fund.earnings_growth.toFixed(2)}%` : null,
          color:
            fund.earnings_growth != null
              ? fund.earnings_growth > 0
                ? 'var(--positive)'
                : 'var(--negative)'
              : undefined,
        },
      ],
    },
    {
      title: 'Financial Health',
      rows: [
        {
          label: 'Debt to Equity',
          value: num(fund.debt_to_equity),
          color:
            fund.debt_to_equity != null
              ? fund.debt_to_equity < 0.5
                ? 'var(--positive)'
                : fund.debt_to_equity < 1.5
                ? 'var(--text-primary)'
                : 'var(--negative)'
              : undefined,
          tooltip: 'Debt to equity leverage ratio. Lower is usually safer.',
        },
        { label: 'Current Ratio', value: num(fund.current_ratio) },
        { label: 'EPS (TTM)', value: fund.eps != null ? `₹${fund.eps.toFixed(2)}` : null },
        { label: 'Book Value/Share', value: fund.book_value != null ? `₹${fund.book_value.toFixed(2)}` : null },
        { label: 'Beta', value: num(fund.beta), tooltip: 'Volatility relative to market benchmark' },
      ],
    },
    {
      title: 'Ownership Pattern',
      rows: [
        { label: 'Promoter Shareholding', value: pct(fund.promoter_holding) },
        { label: 'FII Holding', value: pct(fund.fii_holding), tooltip: 'Foreign Institutional Investors' },
        { label: 'DII Holding', value: pct(fund.dii_holding), tooltip: 'Domestic Institutional Investors' },
        { label: 'Total Institutional Holding', value: pct(fund.institutional_holding) },
      ],
    },
    {
      title: 'Scale & Shares',
      rows: [
        { label: 'Revenue (TTM)', value: fund.revenue != null ? formatCurrency(fund.revenue, { compact: true }) : null },
        { label: 'Net Income (TTM)', value: fund.net_income != null ? formatCurrency(fund.net_income, { compact: true }) : null },
        { label: 'Shares Outstanding', value: fund.shares_outstanding != null ? formatCurrency(fund.shares_outstanding, { compact: true }).replace('₹', '') : null },
      ],
    },
  ];

  return (
    <div
      className="rounded-2xl p-6"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <h2 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
        Fundamentals & Ownership Metrics
      </h2>
      <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
        {fund.sector && `${fund.sector} · `}
        {fund.industry}
      </p>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: 'var(--text-muted)' }}
            >
              {section.title}
            </p>
            {section.rows.map((row) => (
              <FundRow
                key={row.label}
                label={row.label}
                value={row.value ?? null}
                tooltip={'tooltip' in row ? row.tooltip : undefined}
                color={'color' in row ? row.color : undefined}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Recommendation card
// ─────────────────────────────────────────

interface RecommendationCardProps {
  fund: StockFundamentalsResponse;
  quote: StockQuoteResponse;
}

function RecommendationCard({ fund, quote }: RecommendationCardProps) {
  const reasons: string[] = [];
  let score = 0;

  // 1. P/E checking
  if (fund.pe_ratio != null) {
    if (fund.pe_ratio < 16) {
      score += 2;
      reasons.push(`Low P/E Ratio (${fund.pe_ratio.toFixed(1)}x) suggests attractive entry valuation.`);
    } else if (fund.pe_ratio > 38) {
      score -= 2;
      reasons.push(`High P/E Ratio (${fund.pe_ratio.toFixed(1)}x) shows significant growth premium.`);
    } else {
      reasons.push(`Reasonable P/E Ratio (${fund.pe_ratio.toFixed(1)}x) indicates stable valuation.`);
    }
  }

  // 2. ROE checking
  if (fund.roe != null) {
    if (fund.roe > 18) {
      score += 2;
      reasons.push(`Excellent Return on Equity (${fund.roe.toFixed(1)}%) represents high profitability.`);
    } else if (fund.roe < 8) {
      score -= 2;
      reasons.push(`Subpar ROE of ${fund.roe.toFixed(1)}% shows weak capital return profile.`);
    }
  }

  // 3. Debt to Equity checking
  if (fund.debt_to_equity != null) {
    if (fund.debt_to_equity < 0.4) {
      score += 1;
      reasons.push(`Low leverage risk with Debt/Equity of ${fund.debt_to_equity.toFixed(2)}x.`);
    } else if (fund.debt_to_equity > 1.8) {
      score -= 2;
      reasons.push(`High leverage is risky with Debt/Equity at ${fund.debt_to_equity.toFixed(2)}x.`);
    }
  }

  // 4. Growth tracking
  if (fund.earnings_growth != null) {
    if (fund.earnings_growth > 12) {
      score += 1;
      reasons.push(`Solid YoY earnings expansion of +${fund.earnings_growth.toFixed(1)}%.`);
    } else if (fund.earnings_growth < -2) {
      score -= 1.5;
      reasons.push(`Earnings contraction YoY (${fund.earnings_growth.toFixed(1)}%) weighs on outlook.`);
    }
  }

  // 5. PEG ratio
  if (fund.peg_ratio != null) {
    if (fund.peg_ratio < 1.1 && fund.peg_ratio > 0) {
      score += 1.5;
      reasons.push(`PEG ratio under 1.0 (${fund.peg_ratio.toFixed(2)}x) means growth is undervalued.`);
    } else if (fund.peg_ratio > 2.2) {
      score -= 1.5;
      reasons.push(`High PEG ratio (${fund.peg_ratio.toFixed(2)}x) indicates growth features are overpriced.`);
    }
  }

  // 6. Ownership patterns
  if (fund.promoter_holding != null && fund.promoter_holding > 55) {
    score += 1;
    reasons.push(`Strong promoter ownership of ${fund.promoter_holding.toFixed(1)}% establishes skin in the game.`);
  }

  let suggestion: 'BUY' | 'HOLD' | 'SELL' = 'HOLD';
  let bannerClass = 'from-amber-600/20 to-amber-900/10 border-amber-600/30';
  let textBadgeColor = 'text-amber-400';

  if (score >= 2) {
    suggestion = 'BUY';
    bannerClass = 'from-emerald-600/20 to-emerald-900/10 border-emerald-600/30';
    textBadgeColor = 'text-emerald-400';
  } else if (score <= -1.5) {
    suggestion = 'SELL';
    bannerClass = 'from-rose-600/20 to-rose-900/10 border-rose-600/30';
    textBadgeColor = 'text-rose-400';
  }

  const currentPrice = quote.current_price;
  let targetMultiplier = 1.0;
  if (suggestion === 'BUY') targetMultiplier = 1.18;
  else if (suggestion === 'SELL') targetMultiplier = 0.85;
  else targetMultiplier = 1.03;
  const projectedTarget = currentPrice * targetMultiplier;

  return (
    <div
      className={`rounded-2xl p-5 border bg-gradient-to-br ${bannerClass}`}
    >
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted font-bold">
          Market Suggestion
        </span>
        <span
          className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-widest uppercase bg-black/40 ${textBadgeColor}`}
          style={{ border: `1.5px solid currentColor` }}
        >
          {suggestion}
        </span>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] uppercase font-bold text-muted tracking-wide">Metric Factors</p>
        <ul className="space-y-2 list-none pl-0">
          {reasons.length > 0 ? (
            reasons.map((r, idx) => (
              <li key={idx} className="text-xs text-secondary flex items-start gap-2 leading-relaxed">
                <span className="text-emerald-500 mt-1 select-none text-[10px]">•</span>
                <span className="opacity-90">{r}</span>
              </li>
            ))
          ) : (
            <li className="text-xs text-muted">Awaiting company financials to generate analysis logic.</li>
          )}
        </ul>
      </div>

      <div className="pt-4 mt-2 border-t border-token flex justify-between items-center text-xs">
        <div>
          <span className="text-muted block text-[10px] uppercase font-bold tracking-wide">6M Target Price</span>
          <span className="font-semibold text-primary font-mono text-sm">₹{projectedTarget.toFixed(2)}</span>
        </div>
        <div className="text-right">
          <span className="text-muted block text-[10px] uppercase font-bold tracking-wide">Potential</span>
          <span className={`font-mono font-bold ${suggestion === 'BUY' ? 'text-positive' : suggestion === 'SELL' ? 'text-negative' : 'text-amber-500'}`}>
            {suggestion === 'BUY' ? '+18%' : suggestion === 'SELL' ? '-15%' : '+3%'}
          </span>
        </div>
      </div>
    </div>
  );
}

interface StockInteractiveChartProps {
  symbol: string;
  exchange: string;
}

const PERIODS = [
  { label: '1D', value: '1d', apiPeriod: '1d', apiInterval: '5m' },
  { label: '1W', value: '1w', apiPeriod: '5d', apiInterval: '15m' },
  { label: '2W', value: '2w', apiPeriod: '1mo', apiInterval: '1d', slice: 14 },
  { label: '1M', value: '1m', apiPeriod: '1mo', apiInterval: '1d' },
  { label: '6M', value: '6m', apiPeriod: '6mo', apiInterval: '1d' },
  { label: '1Y', value: '1y', apiPeriod: '1y', apiInterval: '1d' },
  { label: '3Y', value: '3y', apiPeriod: '5y', apiInterval: '1wk', slice: 156 },
  { label: '5Y', value: '5y', apiPeriod: '5y', apiInterval: '1wk' },
  { label: 'MAX', value: 'max', apiPeriod: 'max', apiInterval: '1mo' },
];

export function StockInteractiveChart({ symbol, exchange }: StockInteractiveChartProps) {
  const [period, setPeriod] = useState('1y');
  const currentPeriodConfig = PERIODS.find((p) => p.value === period) || PERIODS[5];

  const { data, isLoading } = useStockHistory(
    symbol,
    exchange,
    currentPeriodConfig.apiPeriod,
    currentPeriodConfig.apiInterval
  );

  let chartPoints = data?.data || [];
  if (currentPeriodConfig.slice && chartPoints.length > currentPeriodConfig.slice) {
    chartPoints = chartPoints.slice(-currentPeriodConfig.slice);
  }

  const isPositive =
    chartPoints.length >= 2
      ? chartPoints[chartPoints.length - 1].close >= chartPoints[0].close
      : true;
  const strokeColor = isPositive ? 'var(--positive)' : 'var(--negative)';
  const areaGradientId = `stockGrad-${symbol}`;

  return (
    <div
      className="p-6 rounded-2xl space-y-4"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h3 className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
          <TrendingUp size={16} className={isPositive ? 'text-positive' : 'text-negative'} />
          Interactive Price History
        </h3>
        <div className="flex gap-1.5 overflow-x-auto selection-none">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all"
              style={{
                backgroundColor: period === p.value ? 'var(--accent)' : 'var(--bg-elevated)',
                color: period === p.value ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-muted animate-pulse">
            Loading historical data...
          </div>
        ) : chartPoints.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-muted)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${Math.round(v)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [`₹${Number(val || 0).toFixed(2)}`, 'Close Price']}
                labelFormatter={(label) => `Date/Time: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={strokeColor}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${areaGradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-muted">
            No history data available for selected period.
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────

export function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [searchParams] = useSearchParams();
  const exchange = (searchParams.get('exchange') ?? 'NSE').toUpperCase();

  const quoteQuery = useStockQuote(symbol, exchange);
  const fundQuery = useStockFundamentals(symbol, exchange);
  const historyQuery = useStockHistory(symbol, exchange, '1y', '1d');

  const chartData = (historyQuery.data?.data ?? []).map((p) => p.close);

  if (!symbol) {
    return (
      <div className="flex items-center gap-2" style={{ color: 'var(--negative)' }}>
        <AlertCircle size={18} />
        <p>Invalid stock symbol.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back nav */}
      <Link
        to="/stocks"
        className="inline-flex items-center gap-2 text-sm transition-colors hover:opacity-70"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeft size={16} />
        Back to Stocks
      </Link>

      {/* Quote card */}
      {quoteQuery.isLoading && (
        <div
          className="rounded-2xl p-8 flex items-center justify-center gap-3"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <Loader2 size={22} className="animate-spin" style={{ color: 'var(--accent)' }} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Fetching live quote…
          </span>
        </div>
      )}

      {quoteQuery.isError && (
        <div
          className="rounded-2xl p-6 flex items-center gap-3"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--negative)33',
          }}
          role="alert"
        >
          <AlertCircle size={20} style={{ color: 'var(--negative)' }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--negative)' }}>
              Could not load quote
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {symbol.toUpperCase()} may not be listed on {exchange} or the service is temporarily
              unavailable.
            </p>
          </div>
        </div>
      )}

      {quoteQuery.data && (
        <QuoteCard
          quote={quoteQuery.data}
          symbol={symbol.toUpperCase()}
          exchange={exchange}
          chartData={chartData}
          isRefetching={quoteQuery.isRefetching}
          onRefetch={() => quoteQuery.refetch()}
        />
      )}

      {/* Main Interactive Chart */}
      <StockInteractiveChart symbol={symbol} exchange={exchange} />

      {/* Exchange toggle */}
      <div className="flex gap-2">
        {(['NSE', 'BSE'] as const).map((ex) => (
          <Link
            key={ex}
            to={`/stocks/${symbol}?exchange=${ex}`}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor: exchange === ex ? 'var(--accent)' : 'var(--bg-card)',
              color: exchange === ex ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            {ex}
          </Link>
        ))}
      </div>

      {/* Two-column layout: fundamentals + extras */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fundamentals — 2 cols */}
        <div className="lg:col-span-2">
          {fundQuery.isLoading && (
            <div
              className="rounded-2xl p-8 flex items-center justify-center gap-3"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <Loader2 size={18} className="animate-spin" style={{ color: 'var(--accent)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Loading fundamentals…
              </span>
            </div>
          )}
          {fundQuery.data && <FundamentalsCard fund={fundQuery.data} />}
        </div>

        {/* Side panel */}
        {quoteQuery.data && (
          <div className="space-y-4">
            {fundQuery.data && (
              <RecommendationCard fund={fundQuery.data} quote={quoteQuery.data} />
            )}
            {/* 52W range card */}
            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
                52-Week Range
              </h3>
              {quoteQuery.data.fifty_two_week_low != null &&
              quoteQuery.data.fifty_two_week_high != null ? (
                (() => {
                  const lo = quoteQuery.data.fifty_two_week_low!;
                  const hi = quoteQuery.data.fifty_two_week_high!;
                  const cur = quoteQuery.data.current_price;
                  const pct = Math.min(100, Math.max(0, ((cur - lo) / (hi - lo)) * 100));
                  return (
                    <div>
                      <div
                        className="relative h-2 rounded-full mb-3"
                        style={{ backgroundColor: 'var(--bg-elevated)' }}
                      >
                        {/* Gradient track */}
                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, var(--negative), var(--positive))',
                          }}
                        />
                        {/* Thumb */}
                        <div
                          className="absolute w-3 h-3 rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2"
                          style={{
                            left: `${pct}%`,
                            backgroundColor: 'var(--text-primary)',
                            border: '2px solid var(--bg-card)',
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>{formatPrice(lo)}</span>
                        <span>{formatPrice(hi)}</span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Data unavailable
                </p>
              )}
            </div>

            {/* History chart card */}
            {chartData.length > 5 && (
              <div
                className="rounded-2xl p-5"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
                  1-Year Price Chart
                </h3>
                <div className="h-28">
                  <MiniChart data={chartData} />
                </div>
              </div>
            )}

            {/* Quick links */}
            <div
              className="rounded-2xl p-5 space-y-3"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                External Research
              </h3>
              {[
                {
                  label: 'NSE India',
                  url: `https://www.nseindia.com/get-quotes/equity?symbol=${symbol?.toUpperCase()}`,
                },
                {
                  label: 'BSE India',
                  url: `https://www.bseindia.com/stock-share-price/${symbol?.toLowerCase()}/`,
                },
                {
                  label: 'Screener.in',
                  url: `https://www.screener.in/company/${symbol?.toUpperCase()}/`,
                },
                {
                  label: 'Tickertape',
                  url: `https://www.tickertape.in/stocks/${symbol?.toUpperCase()}`,
                },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-sm py-1 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--accent)' }}
                  aria-label={`Open ${link.label}`}
                >
                  {link.label}
                  <ExternalLink size={12} />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
