"""
Stocks API routes.

Endpoints:
  GET /api/v1/stocks/search?q=RELIANCE&exchange=NSE&limit=10
  GET /api/v1/stocks/{symbol}/quote?exchange=NSE
  GET /api/v1/stocks/{symbol}/fundamentals?exchange=NSE
  GET /api/v1/stocks/{symbol}/history?exchange=NSE&period=1y&interval=1d
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from app.utils import yfinance_adapter as yf_adapter
from app.schemas.stock import (
    StockSearchResponse,
    StockSearchResult,
    StockQuoteResponse,
    StockFundamentalsResponse,
    StockHistoryResponse,
    PriceHistoryPoint,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stocks", tags=["stocks"])


# ─────────────────────────────────────────
# Search
# ─────────────────────────────────────────

@router.get(
    "/search",
    response_model=StockSearchResponse,
    summary="Search stocks by name or symbol",
)
def search_stocks(
    q: Annotated[str, Query(min_length=1, max_length=100, description="Search query")],
    exchange: Annotated[str, Query(description="Exchange filter: NSE or BSE")] = "NSE",
    limit: Annotated[int, Query(ge=1, le=30)] = 10,
) -> StockSearchResponse:
    """
    Search for Indian stocks by ticker symbol or company name.
    Uses yfinance's search API behind the scenes.
    """
    try:
        raw = yf_adapter.search_stocks(q, exchange=exchange, limit=limit)
    except Exception as exc:
        logger.error("Stock search error for query '%s': %s", q, exc)
        raise HTTPException(status_code=502, detail="Stock search service unavailable") from exc

    results = [StockSearchResult(**r) for r in raw]
    return StockSearchResponse(query=q, results=results, count=len(results))


# ─────────────────────────────────────────
# Quote
# ─────────────────────────────────────────

@router.get(
    "/{symbol}/quote",
    response_model=StockQuoteResponse,
    summary="Get live quote for a stock",
)
def get_quote(
    symbol: str,
    exchange: Annotated[str, Query(description="NSE or BSE")] = "NSE",
) -> StockQuoteResponse:
    """
    Fetch a real-time quote for the given NSE/BSE symbol.
    Example: /stocks/RELIANCE/quote?exchange=NSE
    """
    symbol = symbol.upper()
    try:
        data = yf_adapter.get_quote(symbol, exchange=exchange)
    except ValueError as exc:
        logger.warning("Quote not found for %s: %s", symbol, exc)
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Quote fetch error for %s: %s", symbol, exc)
        raise HTTPException(status_code=502, detail="Market data service unavailable") from exc

    return StockQuoteResponse(**data)


# ─────────────────────────────────────────
# Fundamentals
# ─────────────────────────────────────────

@router.get(
    "/{symbol}/fundamentals",
    response_model=StockFundamentalsResponse,
    summary="Get fundamental data for a stock",
)
def get_fundamentals(
    symbol: str,
    exchange: Annotated[str, Query(description="NSE or BSE")] = "NSE",
) -> StockFundamentalsResponse:
    """
    Fetch fundamental / financial data for the given symbol.
    Example: /stocks/RELIANCE/fundamentals?exchange=NSE
    """
    symbol = symbol.upper()
    try:
        data = yf_adapter.get_fundamentals(symbol, exchange=exchange)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Fundamentals fetch error for %s: %s", symbol, exc)
        raise HTTPException(status_code=502, detail="Market data service unavailable") from exc

    return StockFundamentalsResponse(**data)


# ─────────────────────────────────────────
# Price History
# ─────────────────────────────────────────

_VALID_PERIODS = {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"}
_VALID_INTERVALS = {"1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo"}


@router.get(
    "/{symbol}/history",
    response_model=StockHistoryResponse,
    summary="Get OHLCV price history",
)
def get_history(
    symbol: str,
    exchange: Annotated[str, Query(description="NSE or BSE")] = "NSE",
    period: Annotated[str, Query(description="yfinance period string")] = "1y",
    interval: Annotated[str, Query(description="yfinance interval string")] = "1d",
) -> StockHistoryResponse:
    """
    Fetch OHLCV price history for charting.
    Example: /stocks/RELIANCE/history?exchange=NSE&period=1y&interval=1d
    """
    symbol = symbol.upper()

    if period not in _VALID_PERIODS:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid period. Must be one of: {sorted(_VALID_PERIODS)}",
        )
    if interval not in _VALID_INTERVALS:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid interval. Must be one of: {sorted(_VALID_INTERVALS)}",
        )

    try:
        raw = yf_adapter.get_history(symbol, exchange=exchange, period=period, interval=interval)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("History fetch error for %s: %s", symbol, exc)
        raise HTTPException(status_code=502, detail="Market data service unavailable") from exc

    points = [PriceHistoryPoint(**r) for r in raw]
    return StockHistoryResponse(
        symbol=symbol,
        exchange=exchange.upper(),
        period=period,
        interval=interval,
        data=points,
        count=len(points),
    )
