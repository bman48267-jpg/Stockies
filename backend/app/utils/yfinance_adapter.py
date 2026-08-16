"""
yfinance adapter for Indian market data.

NSE tickers on yfinance use the suffix `.NS` (e.g. `RELIANCE.NS`).
BSE tickers use the suffix `.BO` (e.g. `500325.BO`).
"""

from __future__ import annotations

import logging
from functools import lru_cache
from datetime import datetime, timedelta
from typing import Any

import yfinance as yf

from app.utils.market import now_ist

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────

def _ticker(symbol: str, exchange: str = "NSE") -> yf.Ticker:
    """Return a yf.Ticker for the given symbol + exchange."""
    if exchange.upper() == "NSE":
        yf_symbol = f"{symbol.upper()}.NS"
    elif exchange.upper() == "BSE":
        yf_symbol = f"{symbol.upper()}.BO"
    else:
        yf_symbol = symbol.upper()
    return yf.Ticker(yf_symbol)


def _safe(info: dict[str, Any], *keys: str, default: Any = None) -> Any:
    """Try multiple key names and return the first non-None value."""
    for k in keys:
        v = info.get(k)
        if v is not None and v != "N/A" and v != "" and v != 0.0:
            return v
    return default


def _safe_float(info: dict[str, Any], *keys: str) -> float | None:
    v = _safe(info, *keys)
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None


# ─────────────────────────────────────────
# Public API
# ─────────────────────────────────────────

def get_quote(symbol: str, exchange: str = "NSE") -> dict[str, Any]:
    """
    Fetch a real-time quote for a given symbol.
    Returns a dict matching the StockQuoteResponse schema.
    """
    t = _ticker(symbol, exchange)
    try:
        info = t.fast_info
        full_info = t.info
    except Exception as exc:
        logger.warning("yfinance get_quote failed for %s: %s", symbol, exc)
        raise ValueError(f"Could not fetch quote for {symbol}") from exc

    current_price = float(info.last_price or 0)
    previous_close = float(info.previous_close or 0)
    change = current_price - previous_close
    change_pct = (change / previous_close * 100) if previous_close else 0.0

    return {
        "symbol": symbol.upper(),
        "exchange": exchange.upper(),
        "company_name": full_info.get("longName") or full_info.get("shortName") or symbol,
        "current_price": round(current_price, 2),
        "previous_close": round(previous_close, 2),
        "change": round(change, 2),
        "change_percent": round(change_pct, 2),
        "open": _safe_float(full_info, "open", "regularMarketOpen"),
        "high": round(float(info.day_high), 2) if info.day_high else None,
        "low": round(float(info.day_low), 2) if info.day_low else None,
        "volume": int(info.shares) if getattr(info, "shares", None) else full_info.get("volume"),
        "market_cap": float(info.market_cap) if getattr(info, "market_cap", None) else None,
        "fifty_two_week_high": round(float(info.year_high), 2) if getattr(info, "year_high", None) else None,
        "fifty_two_week_low": round(float(info.year_low), 2) if getattr(info, "year_low", None) else None,
        "timestamp": now_ist().isoformat(),
        "status": "live",
    }


def get_fundamentals(symbol: str, exchange: str = "NSE") -> dict[str, Any]:
    """
    Fetch fundamental data for a given symbol.
    Returns a dict matching the StockFundamentalsResponse schema.
    """
    t = _ticker(symbol, exchange)
    try:
        info = t.info
    except Exception as exc:
        logger.warning("yfinance get_fundamentals failed for %s: %s", symbol, exc)
        raise ValueError(f"Could not fetch fundamentals for {symbol}") from exc

    def sf(*keys: str) -> float | None:
        return _safe_float(info, *keys)

    return {
        "symbol": symbol.upper(),
        "exchange": exchange.upper(),
        "company_name": info.get("longName") or info.get("shortName") or symbol,
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        # Valuation
        "pe_ratio": sf("trailingPE", "forwardPE"),
        "pb_ratio": sf("priceToBook"),
        "peg_ratio": sf("trailingPegRatio"),
        "ev_ebitda": sf("enterpriseToEbitda"),
        "dividend_yield": round(sf("dividendYield") * 100, 2) if sf("dividendYield") else None,
        # Profitability
        "roe": round(sf("returnOnEquity") * 100, 2) if sf("returnOnEquity") else None,
        "net_margin": round(sf("profitMargins") * 100, 2) if sf("profitMargins") else None,
        "operating_margin": round(sf("operatingMargins") * 100, 2) if sf("operatingMargins") else None,
        # Growth
        "revenue_growth": round(sf("revenueGrowth") * 100, 2) if sf("revenueGrowth") else None,
        "earnings_growth": round(sf("earningsGrowth") * 100, 2) if sf("earningsGrowth") else None,
        # Financial Strength
        "debt_to_equity": sf("debtToEquity"),
        "current_ratio": sf("currentRatio"),
        "interest_coverage": None,  # not available in yfinance info
        # Raw financials
        "revenue": sf("totalRevenue"),
        "net_income": sf("netIncomeToCommon"),
        "eps": sf("trailingEps"),
        "book_value": sf("bookValue"),
        "face_value": None,  # NSE-specific, not in yfinance
        # Ownership — yfinance provides institutional / insider for US; limited for India
        "promoter_holding": None,
        "fii_holding": None,
        "dii_holding": None,
        "institutional_holding": round(sf("heldPercentInstitutions") * 100, 2)
        if sf("heldPercentInstitutions")
        else None,
        # Shares
        "shares_outstanding": sf("sharesOutstanding"),
        "float_shares": sf("floatShares"),
        # Beta
        "beta": sf("beta"),
        "updated_at": now_ist().isoformat(),
    }


def get_history(
    symbol: str,
    exchange: str = "NSE",
    period: str = "1y",
    interval: str = "1d",
) -> list[dict[str, Any]]:
    """
    Fetch OHLCV price history.
    Returns a list of dicts with date, open, high, low, close, volume.
    """
    t = _ticker(symbol, exchange)
    try:
        df = t.history(period=period, interval=interval, auto_adjust=True)
    except Exception as exc:
        logger.warning("yfinance get_history failed for %s: %s", symbol, exc)
        raise ValueError(f"Could not fetch price history for {symbol}") from exc

    if df.empty:
        return []

    records = []
    for idx, row in df.iterrows():
        date_str = idx.strftime("%Y-%m-%d") if hasattr(idx, "strftime") else str(idx)[:10]
        records.append({
            "date": date_str,
            "open": round(float(row["Open"]), 2) if row.get("Open") is not None else None,
            "high": round(float(row["High"]), 2) if row.get("High") is not None else None,
            "low": round(float(row["Low"]), 2) if row.get("Low") is not None else None,
            "close": round(float(row["Close"]), 2),
            "volume": int(row["Volume"]) if row.get("Volume") is not None else None,
        })

    return records


def search_stocks(query: str, exchange: str = "NSE", limit: int = 10) -> list[dict[str, Any]]:
    """
    Search for stocks by name or symbol using yfinance's search API.
    Returns a list of candidate results.
    """
    try:
        results = yf.Search(query, max_results=limit, enable_fuzzy_query=True)
        hits = results.quotes or []
    except Exception as exc:
        logger.warning("yfinance search failed for '%s': %s", query, exc)
        return []

    out = []
    for h in hits:
        type_disp = h.get("typeDisp", "")
        # Filter to Equity only
        if type_disp not in ("Equity", ""):
            continue

        symbol_raw: str = h.get("symbol", "")
        # Parse suffix
        if symbol_raw.endswith(".NS"):
            exch = "NSE"
            sym = symbol_raw[:-3]
        elif symbol_raw.endswith(".BO"):
            exch = "BSE"
            sym = symbol_raw[:-3]
        else:
            exch = exchange
            sym = symbol_raw

        out.append({
            "symbol": sym,
            "exchange": exch,
            "company_name": h.get("longname") or h.get("shortname") or sym,
            "sector": h.get("sector"),
            "industry": h.get("industry"),
            "market_cap": h.get("marketCap"),
            "current_price": h.get("regularMarketPrice"),
            "change_percent": h.get("regularMarketChangePercent"),
        })

    return out[:limit]
