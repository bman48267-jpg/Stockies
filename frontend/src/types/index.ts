// ─────────────────────────────────────────
// API Response Wrappers
// ─────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  status: 'ok' | 'error';
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ─────────────────────────────────────────
// Market Data
// ─────────────────────────────────────────

export type DataStatus = 'live' | 'delayed' | 'end_of_day' | 'cached' | 'unavailable';
export type MarketStatus = 'open' | 'closed' | 'pre_open' | 'after_market' | 'holiday' | 'weekend';
export type Exchange = 'NSE' | 'BSE';

export interface MarketDataPoint {
  value: number;
  timestamp: string;
  provider: string;
  status: DataStatus;
}

// ─────────────────────────────────────────
// Stock
// ─────────────────────────────────────────

export interface Stock {
  id: number;
  symbol: string;
  exchange: Exchange;
  company_name: string;
  sector: string | null;
  industry: string | null;
  isin: string | null;
  market_cap: number | null;
  current_price: number | null;
  previous_close: number | null;
  updated_at: string;
}

export interface StockQuote {
  symbol: string;
  exchange: Exchange;
  company_name: string;
  current_price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  market_cap: number | null;
  timestamp: string;
  status: DataStatus;
}

export interface PriceHistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close: number;
  volume: number;
}

export interface StockFundamentals {
  symbol: string;
  // Valuation
  pe_ratio: number | null;
  pb_ratio: number | null;
  peg_ratio: number | null;
  ev_ebitda: number | null;
  dividend_yield: number | null;
  // Profitability
  roe: number | null;
  roce: number | null;
  net_margin: number | null;
  operating_margin: number | null;
  // Growth
  revenue_growth: number | null;
  profit_growth: number | null;
  eps_growth: number | null;
  // Financial Strength
  debt_to_equity: number | null;
  current_ratio: number | null;
  interest_coverage: number | null;
  // Ownership
  promoter_holding: number | null;
  fii_holding: number | null;
  dii_holding: number | null;
  public_holding: number | null;
  // Raw financials
  revenue: number | null;
  profit: number | null;
  eps: number | null;
  book_value: number | null;
  face_value: number | null;
  updated_at: string;
}

export interface MetricStatus {
  value: number | null;
  unit: string;
  status: 'good' | 'moderate' | 'poor' | 'neutral' | 'unavailable';
  label: string;
  explanation: string;
}

// ─────────────────────────────────────────
// Mutual Fund
// ─────────────────────────────────────────

export type RiskLevel = 'Low' | 'Low to Moderate' | 'Moderate' | 'Moderately High' | 'High' | 'Very High';

export interface MutualFundScheme {
  scheme_code: string;
  scheme_name: string;
  amc: string;
  category: string;
  sub_category: string | null;
  plan: 'Direct' | 'Regular';
  option: 'Growth' | 'IDCW' | 'Dividend';
  benchmark: string | null;
  inception_date: string | null;
  expense_ratio: number | null;
  aum: number | null;
  exit_load: string | null;
  risk_level: RiskLevel | null;
}

export interface NAVPoint {
  date: string;
  nav: number;
}

export interface MFHolding {
  security_name: string;
  isin: string | null;
  sector: string | null;
  weight: number;
  reporting_date: string;
}

export interface MFPerformance {
  scheme_code: string;
  returns_1m: number | null;
  returns_3m: number | null;
  returns_6m: number | null;
  returns_1y: number | null;
  cagr_3y: number | null;
  cagr_5y: number | null;
  cagr_10y: number | null;
  since_inception: number | null;
}

// ─────────────────────────────────────────
// Portfolio
// ─────────────────────────────────────────

export type AssetType = 'stock' | 'mutual_fund';
export type TransactionType = 'BUY' | 'SELL' | 'SIP' | 'DIVIDEND' | 'BONUS' | 'SPLIT';

export interface PortfolioTransaction {
  id: number;
  user_id: number;
  asset_type: AssetType;
  symbol: string;
  name: string;
  transaction_type: TransactionType;
  transaction_date: string;
  quantity: number;
  price: number;
  amount: number;
  brokerage: number;
  taxes: number;
  notes: string | null;
  created_at: string;
}

export interface StockHolding {
  symbol: string;
  exchange: Exchange;
  company_name: string;
  sector: string | null;
  quantity: number;
  average_buy_price: number;
  invested_value: number;
  current_price: number | null;
  current_value: number | null;
  unrealized_pnl: number | null;
  unrealized_pnl_percent: number | null;
  realized_pnl: number;
  total_pnl: number | null;
  xirr: number | null;
}

export interface MFHoldingPortfolio {
  scheme_code: string;
  scheme_name: string;
  amc: string;
  category: string;
  units: number;
  average_nav: number;
  invested_amount: number;
  current_nav: number | null;
  current_value: number | null;
  unrealized_pnl: number | null;
  unrealized_pnl_percent: number | null;
  xirr: number | null;
}

export interface PortfolioSummary {
  total_invested: number;
  current_value: number;
  total_pnl: number;
  total_pnl_percent: number;
  todays_pnl: number;
  todays_pnl_percent: number;
  xirr: number | null;
  cagr: number | null;
  stock_value: number;
  mf_value: number;
  num_holdings: number;
}

// ─────────────────────────────────────────
// SIP Calculator
// ─────────────────────────────────────────

export interface SIPResult {
  total_invested: number;
  final_value: number;
  profit: number;
  estimated_fees: number;
  net_final_value: number;
  yearly_breakdown: SIPYearlyRow[];
}

export interface SIPYearlyRow {
  year: number;
  invested_so_far: number;
  value_at_year_end: number;
  monthly_sip: number;
}

// ─────────────────────────────────────────
// Screener
// ─────────────────────────────────────────

export type ScreenerOperator = 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'between';

export interface ScreenerFilter {
  id: string;
  metric: string;
  operator: ScreenerOperator;
  value: number;
  value2?: number; // for BETWEEN
}

export interface ScreenerQuery {
  filters: ScreenerFilter[];
  sorts?: { metric: string; direction: 'asc' | 'desc' }[];
  page?: number;
  page_size?: number;
}

// ─────────────────────────────────────────
// Misc
// ─────────────────────────────────────────

export interface HealthResponse {
  status: string;
  version: string;
  market_status: MarketStatus;
}
