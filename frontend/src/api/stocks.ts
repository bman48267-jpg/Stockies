/**
 * Stocks API — React Query hooks for stock search, quotes, fundamentals, and price history.
 */

import { useQuery } from '@tanstack/react-query';
import apiClient from './client';


// ─────────────────────────────────────────
// Response types matching backend schemas
// ─────────────────────────────────────────

export interface StockSearchResult {
  symbol: string;
  exchange: string;
  company_name: string;
  sector: string | null;
  industry: string | null;
  market_cap: number | null;
  current_price: number | null;
  change_percent: number | null;
}

export interface StockSearchResponse {
  query: string;
  results: StockSearchResult[];
  count: number;
}

export interface StockQuoteResponse {
  symbol: string;
  exchange: string;
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
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
  timestamp: string;
  status: string;
}

export interface StockFundamentalsResponse {
  symbol: string;
  exchange: string;
  company_name: string;
  sector: string | null;
  industry: string | null;
  pe_ratio: number | null;
  pb_ratio: number | null;
  peg_ratio: number | null;
  ev_ebitda: number | null;
  dividend_yield: number | null;
  roe: number | null;
  net_margin: number | null;
  operating_margin: number | null;
  revenue_growth: number | null;
  earnings_growth: number | null;
  debt_to_equity: number | null;
  current_ratio: number | null;
  interest_coverage: number | null;
  revenue: number | null;
  net_income: number | null;
  eps: number | null;
  book_value: number | null;
  face_value: number | null;
  promoter_holding: number | null;
  fii_holding: number | null;
  dii_holding: number | null;
  institutional_holding: number | null;
  shares_outstanding: number | null;
  float_shares: number | null;
  beta: number | null;
  updated_at: string;
}

export interface StockHistoryResponse {
  symbol: string;
  exchange: string;
  period: string;
  interval: string;
  data: Array<{
    date: string;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number;
    volume: number | null;
  }>;
  count: number;
}

// ─────────────────────────────────────────
// API functions
// ─────────────────────────────────────────

export const stocksApi = {
  search: async (query: string, exchange = 'NSE', limit = 10): Promise<StockSearchResponse> => {
    const res = await apiClient.get<StockSearchResponse>('/stocks/search', {
      params: { q: query, exchange, limit },
    });
    return res.data;
  },

  getQuote: async (symbol: string, exchange = 'NSE'): Promise<StockQuoteResponse> => {
    const res = await apiClient.get<StockQuoteResponse>(`/stocks/${symbol}/quote`, {
      params: { exchange },
    });
    return res.data;
  },

  getFundamentals: async (symbol: string, exchange = 'NSE'): Promise<StockFundamentalsResponse> => {
    const res = await apiClient.get<StockFundamentalsResponse>(`/stocks/${symbol}/fundamentals`, {
      params: { exchange },
    });
    return res.data;
  },

  getHistory: async (
    symbol: string,
    exchange = 'NSE',
    period = '1y',
    interval = '1d'
  ): Promise<StockHistoryResponse> => {
    const res = await apiClient.get<StockHistoryResponse>(`/stocks/${symbol}/history`, {
      params: { exchange, period, interval },
    });
    return res.data;
  },
};

// ─────────────────────────────────────────
// React Query hooks
// ─────────────────────────────────────────

export const STOCKS_KEYS = {
  search: (q: string, exchange: string) => ['stocks', 'search', q, exchange] as const,
  quote: (symbol: string, exchange: string) => ['stocks', 'quote', symbol, exchange] as const,
  fundamentals: (symbol: string, exchange: string) =>
    ['stocks', 'fundamentals', symbol, exchange] as const,
  history: (symbol: string, exchange: string, period: string, interval: string) =>
    ['stocks', 'history', symbol, exchange, period, interval] as const,
};

/** Search stocks — only fires when query >= 2 chars */
export function useStockSearch(query: string, exchange = 'NSE') {
  return useQuery({
    queryKey: STOCKS_KEYS.search(query, exchange),
    queryFn: () => stocksApi.search(query, exchange, 15),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}

/** Get live quote for a symbol */
export function useStockQuote(symbol: string | undefined, exchange = 'NSE') {
  return useQuery({
    queryKey: STOCKS_KEYS.quote(symbol ?? '', exchange),
    queryFn: () => stocksApi.getQuote(symbol!, exchange),
    enabled: Boolean(symbol),
    staleTime: 60_000,       // 1 minute
    refetchInterval: 60_000, // auto-refresh every minute
  });
}

/** Get fundamentals for a symbol */
export function useStockFundamentals(symbol: string | undefined, exchange = 'NSE') {
  return useQuery({
    queryKey: STOCKS_KEYS.fundamentals(symbol ?? '', exchange),
    queryFn: () => stocksApi.getFundamentals(symbol!, exchange),
    enabled: Boolean(symbol),
    staleTime: 30 * 60_000, // 30 minutes
  });
}

/** Get price history for charting */
export function useStockHistory(
  symbol: string | undefined,
  exchange = 'NSE',
  period = '1y',
  interval = '1d'
) {
  return useQuery({
    queryKey: STOCKS_KEYS.history(symbol ?? '', exchange, period, interval),
    queryFn: () => stocksApi.getHistory(symbol!, exchange, period, interval),
    enabled: Boolean(symbol),
    staleTime: 60 * 60_000, // 1 hour
  });
}
