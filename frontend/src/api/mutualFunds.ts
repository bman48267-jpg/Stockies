import apiClient from './client';

export interface MFSearchResult {
  scheme_code: string;
  scheme_name: string;
  amc?: string;
  category?: string;
  sub_category?: string;
  nav?: number;
  change_percent?: number;
}

export interface MFHoldingItem {
  security_name: string;
  isin?: string;
  sector?: string;
  weight: number;
}

export interface MFSchemeDetail {
  scheme_code: string;
  scheme_name: string;
  amc: string;
  category: string;
  sub_category?: string;
  plan: string;
  option: string;
  benchmark?: string;
  current_nav: number;
  previous_nav?: number;
  nav_date: string;
  change?: number;
  change_percent?: number;
  cagr_1y?: number;
  cagr_3y?: number;
  cagr_5y?: number;
  cagr_inception?: number;
  expense_ratio?: number;
  aum?: number;
  risk_level?: string;
  top_holdings: MFHoldingItem[];
  sector_breakdown: Record<string, number>;
  updated_at: string;
}

export interface NAVPoint {
  date: string;
  nav: number;
}

export interface CommonHoldingItem {
  security_name: string;
  sector?: string;
  weight_in_a: number;
  weight_in_b: number;
  overlap_weight: number;
}

export interface MFOverlapResult {
  scheme_a: MFSchemeDetail;
  scheme_b: MFSchemeDetail;
  overlap_percentage: number;
  common_holdings_count: number;
  common_holdings: CommonHoldingItem[];
  unique_holdings_a_count: number;
  unique_holdings_b_count: number;
  timestamp: string;
}

export async function searchMutualFunds(query: string, limit: number = 15): Promise<MFSearchResult[]> {
  const response = await apiClient.get<{ query: string; results: MFSearchResult[]; count: number }>(
    '/mutual-funds/search',
    { params: { q: query, limit } }
  );
  return response.data.results;
}

export async function getPopularMutualFunds(): Promise<MFSchemeDetail[]> {
  const response = await apiClient.get<MFSchemeDetail[]>('/mutual-funds/popular');
  return response.data;
}

export async function getMFSchemeDetails(schemeCode: string): Promise<MFSchemeDetail> {
  const response = await apiClient.get<MFSchemeDetail>(`/mutual-funds/${schemeCode}/details`);
  return response.data;
}

export async function getMFNAVHistory(schemeCode: string, period: string = '1y'): Promise<NAVPoint[]> {
  const response = await apiClient.get<{ data: NAVPoint[] }>(`/mutual-funds/${schemeCode}/nav-history`, {
    params: { period },
  });
  return response.data.data;
}

export async function compareMutualFunds(schemeCodes: string[]): Promise<MFSchemeDetail[]> {
  const response = await apiClient.post<{ schemes: MFSchemeDetail[] }>('/mutual-funds/compare', {
    scheme_codes: schemeCodes,
  });
  return response.data.schemes;
}

export async function getMFOverlap(schemeCodeA: string, schemeCodeB: string): Promise<MFOverlapResult> {
  const response = await apiClient.post<MFOverlapResult>('/mutual-funds/overlap', {
    scheme_code_a: schemeCodeA,
    scheme_code_b: schemeCodeB,
  });
  return response.data;
}
