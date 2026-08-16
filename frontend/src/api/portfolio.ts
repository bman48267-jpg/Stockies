import apiClient from './client';

export interface TransactionCreate {
  asset_type: 'stock' | 'mutual_fund' | 'emergency_fund' | 'fixed_deposit' | 'bond';
  symbol: string;
  name: string;
  transaction_type: 'BUY' | 'SELL' | 'SIP' | 'DIVIDEND' | 'BONUS' | 'SPLIT';
  transaction_date: string; // YYYY-MM-DD
  quantity: number;
  price: number;
  brokerage?: number;
  taxes?: number;
  notes?: string;
}

export interface TransactionResponse extends TransactionCreate {
  id: number;
  user_id: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface HoldingSummary {
  symbol: string;
  name: string;
  asset_type: 'stock' | 'mutual_fund' | 'emergency_fund' | 'fixed_deposit' | 'bond';
  quantity: number;
  avg_price: number;
  invested_amount: number;
  current_price: number;
  current_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  day_change?: number;
  day_change_percent?: number;
}

export interface AssetAllocation {
  stocks_value: number;
  stocks_invested: number;
  stocks_count: number;
  mf_value: number;
  mf_invested: number;
  mf_count: number;
  emergency_fund_value: number;
  emergency_fund_invested: number;
  emergency_fund_count: number;
  fixed_deposit_value: number;
  fixed_deposit_invested: number;
  fixed_deposit_count: number;
  bond_value: number;
  bond_invested: number;
  bond_count: number;
  stocks_percentage: number;
  mf_percentage: number;
  emergency_fund_percentage: number;
  fixed_deposit_percentage: number;
  bond_percentage: number;
}

export interface PortfolioSummary {
  total_invested: number;
  current_value: number;
  total_pnl: number;
  total_pnl_percent: number;
  day_change: number;
  day_change_percent: number;
  xirr?: number;
  allocation: AssetAllocation;
  holdings: HoldingSummary[];
}

export async function addTransaction(payload: TransactionCreate): Promise<TransactionResponse> {
  const response = await apiClient.post<TransactionResponse>('/portfolio/transactions', payload);
  return response.data;
}

export async function getTransactions(
  assetType?: 'stock' | 'mutual_fund' | 'emergency_fund' | 'fixed_deposit' | 'bond',
  symbol?: string
): Promise<TransactionResponse[]> {
  const response = await apiClient.get<TransactionResponse[]>('/portfolio/transactions', {
    params: { asset_type: assetType, symbol },
  });
  return response.data;
}

export async function deleteTransaction(txnId: number): Promise<void> {
  await apiClient.delete(`/portfolio/transactions/${txnId}`);
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const response = await apiClient.get<PortfolioSummary>('/portfolio/summary');
  return response.data;
}
