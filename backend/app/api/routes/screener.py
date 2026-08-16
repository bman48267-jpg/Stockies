"""
Stock Screener API route.

POST /api/v1/stocks/screener
"""

from __future__ import annotations

import logging
from typing import Annotated, Any

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.utils import screener as screener_engine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stocks", tags=["screener"])


# ─────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────

class ScreenerFilters(BaseModel):
    exchange: str = "NSE"
    # Market Cap (in ₹ Cr)
    min_market_cap: float | None = None
    max_market_cap: float | None = None
    # Valuation
    min_pe: float | None = None
    max_pe: float | None = None
    min_pb: float | None = None
    max_pb: float | None = None
    # Profitability
    min_roe: float | None = None
    max_roe: float | None = None
    min_net_margin: float | None = None
    max_net_margin: float | None = None
    # Growth
    min_revenue_growth: float | None = None
    max_revenue_growth: float | None = None
    min_earnings_growth: float | None = None
    max_earnings_growth: float | None = None
    # Strength
    max_debt_to_equity: float | None = None
    min_dividend_yield: float | None = None
    # Sector filter
    sector: str | None = None
    # Sorting
    sort_by: str = "market_cap"
    sort_order: str = "desc"
    limit: int = Field(default=25, ge=1, le=50)


class ScreenerResultItem(BaseModel):
    symbol: str
    exchange: str
    company_name: str
    sector: str | None = None
    industry: str | None = None
    current_price: float | None = None
    change_percent: float | None = None
    market_cap: float | None = None
    pe_ratio: float | None = None
    pb_ratio: float | None = None
    ev_ebitda: float | None = None
    dividend_yield: float | None = None
    roe: float | None = None
    net_margin: float | None = None
    operating_margin: float | None = None
    revenue_growth: float | None = None
    earnings_growth: float | None = None
    debt_to_equity: float | None = None
    current_ratio: float | None = None
    fifty_two_week_high: float | None = None
    fifty_two_week_low: float | None = None


class ScreenerResponse(BaseModel):
    results: list[ScreenerResultItem]
    total_screened: int
    total_matched: int
    exchange: str
    timestamp: str


# ─────────────────────────────────────────
# Endpoint
# ─────────────────────────────────────────

@router.post(
    "/screener",
    response_model=ScreenerResponse,
    summary="Screen stocks using fundamental filters",
)
def run_screener(filters: ScreenerFilters) -> ScreenerResponse:
    """
    Run the stock screener against the NSE/BSE universe.
    Applies fundamental filters and returns sorted, paginated results.

    Note: This call fetches live data from yfinance and may take 15–30s
    depending on the universe size.
    """
    raw = screener_engine.screen_stocks(
        exchange=filters.exchange,
        min_market_cap=filters.min_market_cap,
        max_market_cap=filters.max_market_cap,
        min_pe=filters.min_pe,
        max_pe=filters.max_pe,
        min_pb=filters.min_pb,
        max_pb=filters.max_pb,
        min_roe=filters.min_roe,
        max_roe=filters.max_roe,
        min_net_margin=filters.min_net_margin,
        max_net_margin=filters.max_net_margin,
        min_revenue_growth=filters.min_revenue_growth,
        max_revenue_growth=filters.max_revenue_growth,
        min_earnings_growth=filters.min_earnings_growth,
        max_earnings_growth=filters.max_earnings_growth,
        max_debt_to_equity=filters.max_debt_to_equity,
        min_dividend_yield=filters.min_dividend_yield,
        sector=filters.sector,
        sort_by=filters.sort_by,
        sort_order=filters.sort_order,
        limit=filters.limit,
    )

    items = [ScreenerResultItem(**r) for r in raw["results"]]
    return ScreenerResponse(
        results=items,
        total_screened=raw["total_screened"],
        total_matched=raw["total_matched"],
        exchange=raw["exchange"],
        timestamp=raw["timestamp"],
    )
