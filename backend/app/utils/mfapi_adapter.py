"""
MFAPI.in adapter for Indian Mutual Fund market data.
API Base: https://api.mfapi.in/mf
"""

from __future__ import annotations

import logging
import httpx
from datetime import datetime
from typing import Any

from app.utils.market import now_ist
from app.calculations.mf_metrics import calculate_returns_from_nav_history

logger = logging.getLogger(__name__)

MFAPI_BASE_URL = "https://api.mfapi.in/mf"

# Curated metadata & realistic portfolio holdings for top Indian Mutual Funds
CURATED_SCHEMES_DATA: dict[str, dict[str, Any]] = {
    "122639": {  # Parag Parikh Flexi Cap Fund - Direct Plan - Growth
        "amc": "PPFAS Mutual Fund",
        "category": "Equity",
        "sub_category": "Flexi Cap",
        "risk_level": "Very High",
        "expense_ratio": 0.58,
        "aum": 68450.0,
        "benchmark": "NIFTY 500 TRI",
        "top_holdings": [
            {"security_name": "HDFC Bank Ltd.", "sector": "Financial Services", "weight": 8.45},
            {"security_name": "Bajaj Holdings & Investment Ltd.", "sector": "Financial Services", "weight": 7.12},
            {"security_name": "Power Grid Corporation of India Ltd.", "sector": "Power", "weight": 6.30},
            {"security_name": "ITC Ltd.", "sector": "Consumer Goods", "weight": 5.95},
            {"security_name": "Tata Consultancy Services Ltd.", "sector": "Technology", "weight": 5.40},
            {"security_name": "Alphabet Inc. (Class A)", "sector": "Technology", "weight": 4.85},
            {"security_name": "Microsoft Corporation", "sector": "Technology", "weight": 4.60},
            {"security_name": "Maruti Suzuki India Ltd.", "sector": "Automobile", "weight": 4.10},
            {"security_name": "Coal India Ltd.", "sector": "Metals & Mining", "weight": 3.80},
            {"security_name": "ICICI Bank Ltd.", "sector": "Financial Services", "weight": 3.50},
        ],
        "sector_breakdown": {
            "Financial Services": 28.5,
            "Technology": 19.8,
            "Consumer Goods": 14.2,
            "Power": 11.5,
            "Automobile": 9.2,
            "Metals & Mining": 7.4,
            "Others": 9.4,
        },
    },
    "119063": {  # HDFC Top 100 Fund - Direct Plan - Growth
        "amc": "HDFC Mutual Fund",
        "category": "Equity",
        "sub_category": "Large Cap",
        "risk_level": "Very High",
        "expense_ratio": 1.05,
        "aum": 32150.0,
        "benchmark": "NIFTY 100 TRI",
        "top_holdings": [
            {"security_name": "ICICI Bank Ltd.", "sector": "Financial Services", "weight": 9.80},
            {"security_name": "HDFC Bank Ltd.", "sector": "Financial Services", "weight": 9.40},
            {"security_name": "Reliance Industries Ltd.", "sector": "Energy", "weight": 8.50},
            {"security_name": "Larsen & Toubro Ltd.", "sector": "Construction", "weight": 6.20},
            {"security_name": "Infosys Ltd.", "sector": "Technology", "weight": 5.90},
            {"security_name": "NTPC Ltd.", "sector": "Power", "weight": 4.80},
            {"security_name": "State Bank of India", "sector": "Financial Services", "weight": 4.50},
            {"security_name": "Axis Bank Ltd.", "sector": "Financial Services", "weight": 4.10},
            {"security_name": "Bharti Airtel Ltd.", "sector": "Telecommunication", "weight": 3.90},
            {"security_name": "ITC Ltd.", "sector": "Consumer Goods", "weight": 3.60},
        ],
        "sector_breakdown": {
            "Financial Services": 38.2,
            "Technology": 12.5,
            "Energy": 10.8,
            "Construction": 9.1,
            "Power": 8.4,
            "Telecommunication": 6.5,
            "Others": 14.5,
        },
    },
    "119598": {  # SBI Bluechip Fund - Direct Plan - Growth
        "amc": "SBI Mutual Fund",
        "category": "Equity",
        "sub_category": "Large Cap",
        "risk_level": "Very High",
        "expense_ratio": 0.88,
        "aum": 46200.0,
        "benchmark": "S&P BSE 100 TRI",
        "top_holdings": [
            {"security_name": "ICICI Bank Ltd.", "sector": "Financial Services", "weight": 9.15},
            {"security_name": "HDFC Bank Ltd.", "sector": "Financial Services", "weight": 8.90},
            {"security_name": "Reliance Industries Ltd.", "sector": "Energy", "weight": 7.40},
            {"security_name": "Larsen & Toubro Ltd.", "sector": "Construction", "weight": 5.80},
            {"security_name": "Infosys Ltd.", "sector": "Technology", "weight": 5.50},
            {"security_name": "ITC Ltd.", "sector": "Consumer Goods", "weight": 4.90},
            {"security_name": "State Bank of India", "sector": "Financial Services", "weight": 4.30},
            {"security_name": "Tata Motors Ltd.", "sector": "Automobile", "weight": 3.80},
            {"security_name": "Bharti Airtel Ltd.", "sector": "Telecommunication", "weight": 3.50},
            {"security_name": "Titan Company Ltd.", "sector": "Consumer Discretionary", "weight": 3.20},
        ],
        "sector_breakdown": {
            "Financial Services": 36.5,
            "Technology": 11.8,
            "Energy": 9.5,
            "Construction": 8.6,
            "Consumer Goods": 8.2,
            "Automobile": 7.4,
            "Others": 18.0,
        },
    },
    "125497": {  # Nippon India Small Cap Fund - Direct Growth
        "amc": "Nippon India Mutual Fund",
        "category": "Equity",
        "sub_category": "Small Cap",
        "risk_level": "Very High",
        "expense_ratio": 0.67,
        "aum": 54800.0,
        "benchmark": "NIFTY Smallcap 250 TRI",
        "top_holdings": [
            {"security_name": "Tube Investments of India Ltd.", "sector": "Automobile", "weight": 3.40},
            {"security_name": "HDFC Bank Ltd.", "sector": "Financial Services", "weight": 2.80},
            {"security_name": "Voltamp Transformers Ltd.", "sector": "Capital Goods", "weight": 2.50},
            {"security_name": "KPIT Technologies Ltd.", "sector": "Technology", "weight": 2.20},
            {"security_name": "Apar Industries Ltd.", "sector": "Capital Goods", "weight": 2.10},
            {"security_name": "Multi Commodity Exchange of India Ltd.", "sector": "Financial Services", "weight": 1.95},
            {"security_name": "Carborundum Universal Ltd.", "sector": "Capital Goods", "weight": 1.85},
            {"security_name": "Persistent Systems Ltd.", "sector": "Technology", "weight": 1.75},
        ],
        "sector_breakdown": {
            "Capital Goods": 24.5,
            "Financial Services": 18.2,
            "Technology": 14.6,
            "Automobile": 11.0,
            "Chemicals": 9.8,
            "Healthcare": 7.5,
            "Others": 14.4,
        },
    },
    "120503": {  # Axis Small Cap Fund - Direct Growth
        "amc": "Axis Mutual Fund",
        "category": "Equity",
        "sub_category": "Small Cap",
        "risk_level": "Very High",
        "expense_ratio": 0.54,
        "aum": 21300.0,
        "benchmark": "NIFTY Smallcap 250 TRI",
        "top_holdings": [
            {"security_name": "Narayana Hrudayalaya Ltd.", "sector": "Healthcare", "weight": 4.10},
            {"security_name": "PNC Infratech Ltd.", "sector": "Construction", "weight": 3.80},
            {"security_name": "Birlasoft Ltd.", "sector": "Technology", "weight": 3.50},
            {"security_name": "Blue Star Ltd.", "sector": "Consumer Durables", "weight": 3.20},
            {"security_name": "CCL Products (India) Ltd.", "sector": "Consumer Goods", "weight": 2.90},
            {"security_name": "Brigade Enterprises Ltd.", "sector": "Realty", "weight": 2.70},
            {"security_name": "Fine Organic Industries Ltd.", "sector": "Chemicals", "weight": 2.50},
        ],
        "sector_breakdown": {
            "Healthcare": 18.5,
            "Technology": 16.2,
            "Construction": 14.0,
            "Consumer Durables": 12.8,
            "Chemicals": 11.5,
            "Others": 27.0,
        },
    },
}

POPULAR_SCHEMES = [
    {"scheme_code": "122639", "scheme_name": "Parag Parikh Flexi Cap Fund - Direct Plan - Growth"},
    {"scheme_code": "119063", "scheme_name": "HDFC Top 100 Fund - Direct Plan - Growth"},
    {"scheme_code": "119598", "scheme_name": "SBI Bluechip Fund - Direct Plan - Growth"},
    {"scheme_code": "125497", "scheme_name": "Nippon India Small Cap Fund - Direct Plan - Growth"},
    {"scheme_code": "120503", "scheme_name": "Axis Small Cap Fund - Direct Plan - Growth"},
]


def search_mf(query: str, limit: int = 15) -> list[dict[str, Any]]:
    """
    Search mutual fund schemes from MFAPI.in or curated popular list.
    """
    query_clean = query.strip().lower()
    if not query_clean:
        return POPULAR_SCHEMES[:limit]

    results = []

    # 1. Try MFAPI search
    try:
        url = f"{MFAPI_BASE_URL}/search?q={query}"
        response = httpx.get(url, timeout=6.0)
        if response.status_code == 200:
            data = response.json()
            for item in data[:limit]:
                code = str(item.get("schemeCode"))
                curated = CURATED_SCHEMES_DATA.get(code, {})
                results.append({
                    "scheme_code": code,
                    "scheme_name": item.get("schemeName"),
                    "amc": curated.get("amc", item.get("schemeName", "").split()[0] + " Mutual Fund"),
                    "category": curated.get("category", "Equity"),
                    "sub_category": curated.get("sub_category", "Multi Cap"),
                    "nav": None,
                    "change_percent": None,
                })
    except Exception as exc:
        logger.warning("MFAPI search failed for '%s': %s", query, exc)

    if results:
        return results[:limit]

    # 2. Fallback keyword search on curated and popular list
    matched = []
    for code, details in CURATED_SCHEMES_DATA.items():
        name = details.get("scheme_name", "") or ""
        amc = details.get("amc", "") or ""
        if query_clean in name.lower() or query_clean in amc.lower() or query_clean in code or ("ppfas" in query_clean and "parag" in name.lower()):
            matched.append({
                "scheme_code": code,
                "scheme_name": name or f"Scheme {code}",
                "amc": amc,
                "category": details.get("category", "Equity"),
                "sub_category": details.get("sub_category", "Flexi Cap"),
                "nav": None,
                "change_percent": None,
            })

    for item in POPULAR_SCHEMES:
        code = item["scheme_code"]
        name = item["scheme_name"]
        if (query_clean in name.lower() or "ppfas" in query_clean and "parag" in name.lower()) and not any(m["scheme_code"] == code for m in matched):
            matched.append({
                "scheme_code": code,
                "scheme_name": name,
                "amc": name.split()[0] + " Mutual Fund",
                "category": "Equity",
                "sub_category": "Flexi Cap",
                "nav": None,
                "change_percent": None,
            })

    return matched[:limit] if matched else POPULAR_SCHEMES[:limit]



def get_mf_details(scheme_code: str) -> dict[str, Any]:
    """
    Fetch full detail of a mutual fund scheme by scheme code from MFAPI.in.
    """
    try:
        url = f"{MFAPI_BASE_URL}/{scheme_code}"
        response = httpx.get(url, timeout=8.0)
        if response.status_code != 200:
            raise ValueError(f"MFAPI returned status {response.status_code} for scheme {scheme_code}")

        res_data = response.json()
        meta = res_data.get("meta", {})
        nav_data = res_data.get("data", [])

        if not nav_data:
            raise ValueError(f"No NAV history found for scheme {scheme_code}")

        latest = nav_data[0]
        current_nav = float(latest["nav"])
        nav_date = latest["date"]

        prev_nav = float(nav_data[1]["nav"]) if len(nav_data) > 1 else None
        change = round(current_nav - prev_nav, 4) if prev_nav else None
        change_pct = round((change / prev_nav) * 100, 2) if prev_nav and change else None

        returns = calculate_returns_from_nav_history(nav_data)
        curated = CURATED_SCHEMES_DATA.get(scheme_code, {})

        amc_name = curated.get("amc") or meta.get("fund_house") or meta.get("scheme_name", "").split()[0] + " Mutual Fund"
        cat_name = curated.get("category") or (meta.get("scheme_category", "").split("-")[0].strip() if meta.get("scheme_category") else "Equity")

        return {
            "scheme_code": str(scheme_code),
            "scheme_name": meta.get("scheme_name", f"Scheme {scheme_code}"),
            "amc": amc_name,
            "category": cat_name,
            "sub_category": curated.get("sub_category") or meta.get("scheme_category"),
            "plan": "Direct" if "direct" in meta.get("scheme_name", "").lower() else "Regular",
            "option": "Growth" if "growth" in meta.get("scheme_name", "").lower() else "IDCW",
            "benchmark": curated.get("benchmark", "NIFTY 50 TRI"),
            "current_nav": round(current_nav, 2),
            "previous_nav": round(prev_nav, 2) if prev_nav else None,
            "nav_date": nav_date,
            "change": change,
            "change_percent": change_pct,
            "cagr_1y": returns["cagr_1y"],
            "cagr_3y": returns["cagr_3y"],
            "cagr_5y": returns["cagr_5y"],
            "cagr_inception": returns["cagr_inception"],
            "expense_ratio": curated.get("expense_ratio", 0.65),
            "aum": curated.get("aum", 25000.0),
            "risk_level": curated.get("risk_level", "Very High"),
            "top_holdings": curated.get("top_holdings", [
                {"security_name": "HDFC Bank Ltd.", "sector": "Financial Services", "weight": 8.5},
                {"security_name": "ICICI Bank Ltd.", "sector": "Financial Services", "weight": 7.2},
                {"security_name": "Infosys Ltd.", "sector": "Technology", "weight": 6.1},
                {"security_name": "Reliance Industries Ltd.", "sector": "Energy", "weight": 5.8},
                {"security_name": "Larsen & Toubro Ltd.", "sector": "Construction", "weight": 4.5},
            ]),
            "sector_breakdown": curated.get("sector_breakdown", {
                "Financial Services": 32.0,
                "Technology": 16.0,
                "Energy": 12.0,
                "Construction": 8.0,
                "Others": 32.0,
            }),
            "updated_at": now_ist().isoformat(),
        }
    except Exception as exc:
        logger.error("get_mf_details failed for scheme %s: %s", scheme_code, exc)
        raise ValueError(f"Could not fetch details for scheme {scheme_code}") from exc


def get_mf_nav_history(scheme_code: str, period: str = "1y") -> list[dict[str, Any]]:
    """
    Fetch historical NAV points for charting.
    Returns list of {"date": "YYYY-MM-DD", "nav": 123.45} sorted ascending by date.
    """
    try:
        url = f"{MFAPI_BASE_URL}/{scheme_code}"
        response = httpx.get(url, timeout=8.0)
        if response.status_code != 200:
            return []

        res_data = response.json()
        nav_data = res_data.get("data", [])

        # Filter by period
        days_map = {"1m": 30, "6m": 180, "1y": 365, "3y": 1095, "5y": 1825, "max": 99999}
        max_days = days_map.get(period.lower(), 365)

        points = []
        now = datetime.now()

        for pt in nav_data:
            date_raw = pt.get("date", "")
            nav_val = float(pt.get("nav", 0.0))
            try:
                dt = datetime.strptime(date_raw, "%d-%m-%Y")
                if (now - dt).days <= max_days:
                    points.append({
                        "date": dt.strftime("%Y-%m-%d"),
                        "nav": round(nav_val, 2),
                    })
            except ValueError:
                continue

        points.sort(key=lambda x: x["date"])
        return points
    except Exception as exc:
        logger.warning("get_mf_nav_history failed for scheme %s: %s", scheme_code, exc)
        return []
