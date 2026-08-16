"""
Pydantic v2 schemas for the Stocks API.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class StockSearchResult(BaseModel):
    symbol: str
    exchange: str
    company_name: str
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[float] = None
    current_price: Optional[float] = None
    change_percent: Optional[float] = None


class StockSearchResponse(BaseModel):
    query: str
    results: list[StockSearchResult]
    count: int


class StockQuoteResponse(BaseModel):
    symbol: str
    exchange: str
    company_name: str
    current_price: float
    previous_close: float
    change: float
    change_percent: float
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    volume: Optional[int] = None
    market_cap: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    timestamp: str
    status: str = "live"


class StockFundamentalsResponse(BaseModel):
    symbol: str
    exchange: str
    company_name: str
    sector: Optional[str] = None
    industry: Optional[str] = None
    # Valuation
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    peg_ratio: Optional[float] = None
    ev_ebitda: Optional[float] = None
    dividend_yield: Optional[float] = None
    # Profitability
    roe: Optional[float] = None
    net_margin: Optional[float] = None
    operating_margin: Optional[float] = None
    # Growth
    revenue_growth: Optional[float] = None
    earnings_growth: Optional[float] = None
    # Financial Strength
    debt_to_equity: Optional[float] = None
    current_ratio: Optional[float] = None
    interest_coverage: Optional[float] = None
    # Raw financials
    revenue: Optional[float] = None
    net_income: Optional[float] = None
    eps: Optional[float] = None
    book_value: Optional[float] = None
    face_value: Optional[float] = None
    # Ownership
    promoter_holding: Optional[float] = None
    fii_holding: Optional[float] = None
    dii_holding: Optional[float] = None
    institutional_holding: Optional[float] = None
    # Shares
    shares_outstanding: Optional[float] = None
    float_shares: Optional[float] = None
    beta: Optional[float] = None
    updated_at: str


class PriceHistoryPoint(BaseModel):
    date: str
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: float
    volume: Optional[int] = None


class StockHistoryResponse(BaseModel):
    symbol: str
    exchange: str
    period: str
    interval: str
    data: list[PriceHistoryPoint]
    count: int
