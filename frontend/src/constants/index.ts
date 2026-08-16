export const APP_NAME = 'Stockies';
export const APP_VERSION = '1.0.0';

export const API_BASE_URL = '/api/v1';

export const MARKET_TIMEZONE = 'Asia/Kolkata';

// Indian market hours (IST)
export const MARKET_OPEN_HOUR = 9;
export const MARKET_OPEN_MINUTE = 15;
export const MARKET_CLOSE_HOUR = 15;
export const MARKET_CLOSE_MINUTE = 30;
export const PREOPEN_OPEN_HOUR = 9;
export const PREOPEN_OPEN_MINUTE = 0;

export const EXCHANGES = ['NSE', 'BSE'] as const;

export const MF_CATEGORIES = [
  'Equity',
  'Debt',
  'Hybrid',
  'Solution Oriented',
  'Other',
] as const;

export const MF_RISK_LEVELS = [
  'Low',
  'Low to Moderate',
  'Moderate',
  'Moderately High',
  'High',
  'Very High',
] as const;

export const TRANSACTION_TYPES = ['BUY', 'SELL', 'SIP', 'DIVIDEND', 'BONUS', 'SPLIT'] as const;

export const CHART_PERIODS = ['1D', '1W', '1M', '6M', '1Y', '3Y', '5Y', 'MAX'] as const;

export const INDIAN_SECTORS = [
  'Automobile & Ancillaries',
  'Banking & Finance',
  'Capital Goods',
  'Chemicals',
  'Consumer Durables',
  'Consumer Staples',
  'Energy',
  'Healthcare',
  'IT & Technology',
  'Infrastructure',
  'Insurance',
  'Media & Entertainment',
  'Metals & Mining',
  'Pharma',
  'Real Estate',
  'Retail',
  'Telecom',
  'Textiles',
  'Others',
] as const;

export const SCREENER_METRICS = [
  { key: 'market_cap', label: 'Market Cap (Cr)', unit: '₹ Cr' },
  { key: 'current_price', label: 'Price', unit: '₹' },
  { key: 'pe_ratio', label: 'PE Ratio', unit: 'x' },
  { key: 'pb_ratio', label: 'PB Ratio', unit: 'x' },
  { key: 'roe', label: 'ROE', unit: '%' },
  { key: 'roce', label: 'ROCE', unit: '%' },
  { key: 'debt_to_equity', label: 'Debt/Equity', unit: 'x' },
  { key: 'dividend_yield', label: 'Dividend Yield', unit: '%' },
  { key: 'revenue_growth', label: 'Revenue Growth', unit: '%' },
  { key: 'profit_growth', label: 'Profit Growth', unit: '%' },
  { key: 'net_margin', label: 'Net Margin', unit: '%' },
  { key: 'operating_margin', label: 'Operating Margin', unit: '%' },
  { key: 'promoter_holding', label: 'Promoter Holding', unit: '%' },
  { key: 'fii_holding', label: 'FII Holding', unit: '%' },
  { key: 'dii_holding', label: 'DII Holding', unit: '%' },
] as const;

export const DISCLAIMER =
  'Stockies provides financial data and analytical tools for informational purposes only. It is not investment advice.';
