"""
Mutual Fund calculation helpers for CAGR, returns, and portfolio overlap.
"""

from datetime import datetime, timedelta
from typing import Any


def calculate_cagr(start_nav: float, end_nav: float, years: float) -> float | None:
    """
    Calculate Compound Annual Growth Rate (CAGR).
    formula: (end_nav / start_nav) ** (1 / years) - 1
    Returns percentage rounded to 2 decimal places.
    """
    if start_nav <= 0 or end_nav <= 0 or years <= 0:
        return None
    try:
        cagr = ((end_nav / start_nav) ** (1.0 / years) - 1.0) * 100.0
        return round(cagr, 2)
    except (ZeroDivisionError, OverflowError, ValueError):
        return None


def calculate_returns_from_nav_history(nav_history: list[dict[str, Any]]) -> dict[str, float | None]:
    """
    Given nav_history sorted newest first (date, nav),
    compute 1D, 1M, 6M, 1Y, 3Y, 5Y CAGR returns.
    """
    if not nav_history:
        return {"cagr_1y": None, "cagr_3y": None, "cagr_5y": None, "cagr_inception": None}

    # Ensure list is sorted by date ascending for calculations
    parsed_pts = []
    for pt in nav_history:
        try:
            d = datetime.strptime(pt["date"], "%d-%m-%Y") if "-" in pt["date"] and len(pt["date"].split("-")[0]) == 2 else datetime.strptime(pt["date"], "%Y-%m-%d")
            parsed_pts.append((d, float(pt["nav"])))
        except (ValueError, TypeError):
            continue

    if not parsed_pts:
        return {"cagr_1y": None, "cagr_3y": None, "cagr_5y": None, "cagr_inception": None}

    parsed_pts.sort(key=lambda x: x[0])  # Oldest to newest
    latest_date, latest_nav = parsed_pts[-1]
    inception_date, inception_nav = parsed_pts[0]

    def _find_nav_years_ago(years: float) -> float | None:
        target_date = latest_date - timedelta(days=int(years * 365.25))
        # Find closest date on or before target_date
        best_nav = None
        min_diff = timedelta(days=99999)
        for d, nav in parsed_pts:
            diff = abs(d - target_date)
            if diff < min_diff:
                min_diff = diff
                best_nav = nav
        # Only return if date is within 30 days of target
        if min_diff.days <= 35:
            return best_nav
        return None

    cagr_1y = None
    nav_1y = _find_nav_years_ago(1.0)
    if nav_1y:
        cagr_1y = calculate_cagr(nav_1y, latest_nav, 1.0)

    cagr_3y = None
    nav_3y = _find_nav_years_ago(3.0)
    if nav_3y:
        cagr_3y = calculate_cagr(nav_3y, latest_nav, 3.0)

    cagr_5y = None
    nav_5y = _find_nav_years_ago(5.0)
    if nav_5y:
        cagr_5y = calculate_cagr(nav_5y, latest_nav, 5.0)

    inception_years = (latest_date - inception_date).days / 365.25
    cagr_inception = None
    if inception_years >= 0.5:
        cagr_inception = calculate_cagr(inception_nav, latest_nav, inception_years)

    return {
        "cagr_1y": cagr_1y,
        "cagr_3y": cagr_3y,
        "cagr_5y": cagr_5y,
        "cagr_inception": cagr_inception,
    }


def calculate_portfolio_overlap(
    holdings_a: list[dict[str, Any]],
    holdings_b: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Calculate portfolio holdings overlap between two schemes.
    Formula: Overlap % = sum(min(weight_in_A, weight_in_B)) for all common securities.
    """
    map_a = {h["security_name"].strip().lower(): h for h in holdings_a}
    map_b = {h["security_name"].strip().lower(): h for h in holdings_b}

    common_items = []
    total_overlap_weight = 0.0

    all_keys = set(map_a.keys()).union(set(map_b.keys()))

    unique_a = 0
    unique_b = 0

    for key in all_keys:
        in_a = key in map_a
        in_b = key in map_b

        if in_a and in_b:
            item_a = map_a[key]
            item_b = map_b[key]
            w_a = float(item_a.get("weight", 0.0))
            w_b = float(item_b.get("weight", 0.0))
            overlap_w = min(w_a, w_b)
            total_overlap_weight += overlap_w

            common_items.append({
                "security_name": item_a["security_name"],
                "sector": item_a.get("sector") or item_b.get("sector"),
                "weight_in_a": round(w_a, 2),
                "weight_in_b": round(w_b, 2),
                "overlap_weight": round(overlap_w, 2),
            })
        elif in_a:
            unique_a += 1
        else:
            unique_b += 1

    common_items.sort(key=lambda x: x["overlap_weight"], reverse=True)

    return {
        "overlap_percentage": round(total_overlap_weight, 2),
        "common_holdings_count": len(common_items),
        "common_holdings": common_items,
        "unique_holdings_a_count": unique_a,
        "unique_holdings_b_count": unique_b,
    }
