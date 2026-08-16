"""
Stock Screener backend logic.

Screens a curated list of popular NSE/BSE stocks against user-defined
fundamental filters using yfinance data.
"""

from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

import yfinance as yf

from app.utils.market import now_ist

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────
# Screener universe — top NSE/BSE stocks
# ─────────────────────────────────────────

NSE_UNIVERSE = [
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
    "HINDUNILVR", "WIPRO", "SBIN", "BAJFINANCE", "ADANIENT",
    "KOTAKBANK", "LTIM", "AXISBANK", "MARUTI", "SUNPHARMA",
    "TITAN", "NESTLEIND", "ULTRACEMCO", "POWERGRID", "NTPC",
    "ONGC", "COALINDIA", "BAJAJFINSV", "ASIANPAINT", "HCLTECH",
    "TECHM", "M&M", "INDUSINDBK", "TATASTEEL", "JSWSTEEL",
    "GRASIM", "HEROMOTOCO", "BRITANNIA", "CIPLA", "DRREDDY",
    "DIVISLAB", "BPCL", "IOC", "HAVELS", "DABUR",
    "GODREJCP", "PIDILITIND", "BERGEPAINT", "MARICO", "COLPAL",
    "EICHERMOT", "TATACONSUM", "HINDALCO", "VEDL", "SBILIFE",
]

BSE_UNIVERSE = [
    "500325", "532540", "500180", "500209", "532174",
    "500696", "507685", "500112", "532978", "512599",
]

SUFFIX_MAP = {"NSE": ".NS", "BSE": ".BO"}


def _safe_float(info: dict, *keys: str) -> float | None:
    for k in keys:
        v = info.get(k)
        if v is not None and v != "N/A" and v != "":
            try:
                f = float(v)
                if f != 0.0:
                    return f
            except (TypeError, ValueError):
                pass
    return None


def _fetch_one(symbol: str, exchange: str) -> dict[str, Any] | None:
    """Fetch fundamental snapshot for a single symbol. Returns None on failure."""
    suffix = SUFFIX_MAP.get(exchange.upper(), ".NS")
    yf_symbol = f"{symbol}{suffix}"
    try:
        t = yf.Ticker(yf_symbol)
        info = t.info
        fast = t.fast_info

        if not info or not info.get("regularMarketPrice"):
            return None

        current_price = float(fast.last_price or 0)
        prev_close = float(fast.previous_close or 0)
        change_pct = ((current_price - prev_close) / prev_close * 100) if prev_close else 0.0

        sf = lambda *keys: _safe_float(info, *keys)  # noqa

        market_cap_raw = sf("marketCap")
        market_cap_cr = round(market_cap_raw / 1e7, 2) if market_cap_raw else None

        roe_raw = sf("returnOnEquity")
        net_margin_raw = sf("profitMargins")
        op_margin_raw = sf("operatingMargins")
        rev_growth_raw = sf("revenueGrowth")
        earn_growth_raw = sf("earningsGrowth")
        div_yield_raw = sf("dividendYield")

        return {
            "symbol": symbol,
            "exchange": exchange.upper(),
            "company_name": info.get("longName") or info.get("shortName") or symbol,
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            # Price
            "current_price": round(current_price, 2),
            "change_percent": round(change_pct, 2),
            "market_cap": market_cap_cr,
            # Valuation
            "pe_ratio": sf("trailingPE", "forwardPE"),
            "pb_ratio": sf("priceToBook"),
            "ev_ebitda": sf("enterpriseToEbitda"),
            "dividend_yield": round(div_yield_raw * 100, 2) if div_yield_raw else None,
            # Profitability
            "roe": round(roe_raw * 100, 2) if roe_raw else None,
            "net_margin": round(net_margin_raw * 100, 2) if net_margin_raw else None,
            "operating_margin": round(op_margin_raw * 100, 2) if op_margin_raw else None,
            # Growth
            "revenue_growth": round(rev_growth_raw * 100, 2) if rev_growth_raw else None,
            "earnings_growth": round(earn_growth_raw * 100, 2) if earn_growth_raw else None,
            # Strength
            "debt_to_equity": sf("debtToEquity"),
            "current_ratio": sf("currentRatio"),
            # 52W
            "fifty_two_week_high": round(float(fast.year_high), 2) if getattr(fast, "year_high", None) else None,
            "fifty_two_week_low": round(float(fast.year_low), 2) if getattr(fast, "year_low", None) else None,
        }
    except Exception as exc:
        logger.debug("Screener fetch failed for %s: %s", yf_symbol, exc)
        return None


def screen_stocks(
    exchange: str = "NSE",
    symbols: list[str] | None = None,
    min_market_cap: float | None = None,
    max_market_cap: float | None = None,
    min_pe: float | None = None,
    max_pe: float | None = None,
    min_pb: float | None = None,
    max_pb: float | None = None,
    min_roe: float | None = None,
    max_roe: float | None = None,
    min_net_margin: float | None = None,
    max_net_margin: float | None = None,
    min_revenue_growth: float | None = None,
    max_revenue_growth: float | None = None,
    min_earnings_growth: float | None = None,
    max_earnings_growth: float | None = None,
    max_debt_to_equity: float | None = None,
    min_dividend_yield: float | None = None,
    sector: str | None = None,
    sort_by: str = "market_cap",
    sort_order: str = "desc",
    limit: int = 25,
) -> dict[str, Any]:
    """Run the screener across the universe and return filtered/sorted results."""
    universe = symbols or (NSE_UNIVERSE if exchange.upper() == "NSE" else BSE_UNIVERSE)

    results: list[dict] = []
    # Fetch in parallel — max 8 workers to avoid rate-limiting
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(_fetch_one, sym, exchange): sym for sym in universe}
        for future in as_completed(futures):
            row = future.result()
            if row:
                results.append(row)

    # ── Apply filters ─────────────────────────────────────────────────
    def _passes(r: dict) -> bool:
        def _check(val, mn, mx):
            if val is None:
                return True  # missing data: don't filter out
            if mn is not None and val < mn:
                return False
            if mx is not None and val > mx:
                return False
            return True

        if not _check(r.get("market_cap"), min_market_cap, max_market_cap):
            return False
        if not _check(r.get("pe_ratio"), min_pe, max_pe):
            return False
        if not _check(r.get("pb_ratio"), min_pb, max_pb):
            return False
        if not _check(r.get("roe"), min_roe, max_roe):
            return False
        if not _check(r.get("net_margin"), min_net_margin, max_net_margin):
            return False
        if not _check(r.get("revenue_growth"), min_revenue_growth, max_revenue_growth):
            return False
        if not _check(r.get("earnings_growth"), min_earnings_growth, max_earnings_growth):
            return False
        if max_debt_to_equity is not None and r.get("debt_to_equity") is not None:
            if r["debt_to_equity"] > max_debt_to_equity:
                return False
        if min_dividend_yield is not None and r.get("dividend_yield") is not None:
            if r["dividend_yield"] < min_dividend_yield:
                return False
        if sector and r.get("sector") and sector.lower() not in r["sector"].lower():
            return False
        return True

    filtered = [r for r in results if _passes(r)]

    # ── Sort ──────────────────────────────────────────────────────────
    reverse = sort_order.lower() != "asc"
    if reverse:
        filtered.sort(
            key=lambda r: (r.get(sort_by) is not None, r.get(sort_by) if r.get(sort_by) is not None else -float('inf')),
            reverse=True,
        )
    else:
        filtered.sort(
            key=lambda r: (r.get(sort_by) is None, r.get(sort_by) if r.get(sort_by) is not None else float('inf')),
            reverse=False,
        )

    return {
        "results": filtered[:limit],
        "total_screened": len(results),
        "total_matched": len(filtered),
        "exchange": exchange.upper(),
        "timestamp": now_ist().isoformat(),
    }
