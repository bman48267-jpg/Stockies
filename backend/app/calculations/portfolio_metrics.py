"""
Portfolio Analytics & XIRR Return Calculations
"""

from datetime import date
from typing import List, Tuple, Dict, Any, Optional


def calculate_xirr(cashflows: List[Tuple[date, float]], max_iter: int = 100, tol: float = 1e-6) -> float:
    """
    Calculate Extended Internal Rate of Return (XIRR) using the Newton-Raphson method.

    Cashflows are represented as a list of tuples: (date, amount)
    - Investments / Purchases are negative amounts (e.g. -10000.0)
    - Sales / Dividends / Current Valuation are positive amounts (e.g. +12500.0)

    Returns: Annualized return percentage (e.g. 15.4 for 15.4%)
    """
    if len(cashflows) < 2:
        return 0.0

    # Sort cashflows chronologically
    sorted_cf = sorted(cashflows, key=lambda x: x[0])
    t0 = sorted_cf[0][0]

    # Check if there is at least one negative and one positive cashflow
    has_pos = any(amt > 0 for _, amt in sorted_cf)
    has_neg = any(amt < 0 for _, amt in sorted_cf)
    if not (has_pos and has_neg):
        return 0.0

    # Net present value function
    def npv(r: float) -> float:
        if r <= -0.9999:
            return float('inf')
        val = 0.0
        for d, amt in sorted_cf:
            days = (d - t0).days
            val += amt / ((1.0 + r) ** (days / 365.0))
        return val

    # Derivative of NPV w.r.t r
    def npv_prime(r: float) -> float:
        if r <= -0.9999:
            return float('inf')
        val = 0.0
        for d, amt in sorted_cf:
            days = (d - t0).days
            if days == 0:
                continue
            val -= (days / 365.0) * amt / ((1.0 + r) ** ((days / 365.0) + 1.0))
        return val

    # Newton-Raphson iteration
    r = 0.1  # initial guess 10%
    for _ in range(max_iter):
        f = npv(r)
        f_prime = npv_prime(r)
        if abs(f_prime) < 1e-12:
            break
        r_new = r - f / f_prime
        if abs(r_new - r) < tol:
            return round(r_new * 100.0, 2)
        r = r_new
        if r < -0.99 or r > 10.0:  # Bound check
            break

    # Fallback to bisection method if Newton-Raphson diverges
    low, high = -0.99, 5.0
    for _ in range(100):
        mid = (low + high) / 2.0
        f_mid = npv(mid)
        if abs(f_mid) < tol:
            return round(mid * 100.0, 2)
        f_low = npv(low)
        if (f_low > 0 and f_mid > 0) or (f_low < 0 and f_mid < 0):
            low = mid
        else:
            high = mid

    return round(((high + low) / 2.0) * 100.0, 2)


def aggregate_holdings_from_transactions(transactions: List[Any]) -> List[Dict[str, Any]]:
    """
    Aggregate raw transaction logs into active holdings per asset.
    Returns list of dicts with:
    {
      'symbol': str,
      'name': str,
      'asset_type': str,
      'quantity': float,
      'avg_price': float,
      'total_invested': float
    }
    """
    holdings_map: Dict[str, Dict[str, Any]] = {}

    # Sort transactions by date ascending
    sorted_txns = sorted(transactions, key=lambda t: t.transaction_date)

    for t in sorted_txns:
        key = f"{t.asset_type}:{t.symbol}"
        if key not in holdings_map:
            holdings_map[key] = {
                'symbol': t.symbol,
                'name': t.name,
                'asset_type': t.asset_type,
                'quantity': 0.0,
                'total_invested': 0.0,
                'avg_price': 0.0,
                'cashflows': [],  # list of (date, amount)
            }

        h = holdings_map[key]
        ttype = t.transaction_type.upper()

        if ttype in ('BUY', 'SIP'):
            cost = (t.quantity * t.price) + t.brokerage + t.taxes
            h['total_invested'] += cost
            h['quantity'] += t.quantity
            h['avg_price'] = h['total_invested'] / h['quantity'] if h['quantity'] > 0 else 0.0
            h['cashflows'].append((t.transaction_date, -cost))

        elif ttype == 'SELL':
            sell_amount = (t.quantity * t.price) - t.brokerage - t.taxes
            h['cashflows'].append((t.transaction_date, sell_amount))
            if h['quantity'] > 0:
                # Reduce invested proportionally to units sold
                fraction_sold = min(1.0, t.quantity / h['quantity'])
                h['total_invested'] -= (h['total_invested'] * fraction_sold)
                h['quantity'] -= t.quantity
                if h['quantity'] <= 0:
                    h['quantity'] = 0.0
                    h['total_invested'] = 0.0
                    h['avg_price'] = 0.0

        elif ttype == 'DIVIDEND':
            dividend_amount = (t.quantity * t.price) - t.taxes
            h['cashflows'].append((t.transaction_date, dividend_amount))
            # Dividends reduce effective net invested cost
            h['total_invested'] = max(0.0, h['total_invested'] - dividend_amount)
            if h['quantity'] > 0:
                h['avg_price'] = h['total_invested'] / h['quantity']

        elif ttype == 'BONUS':
            # Adds units with 0 additional cost
            h['quantity'] += t.quantity
            if h['quantity'] > 0:
                h['avg_price'] = h['total_invested'] / h['quantity']

        elif ttype == 'SPLIT':
            # e.g., 1:2 split doubles quantity, halves price
            split_ratio = t.quantity  # ratio factor
            if split_ratio > 0:
                h['quantity'] *= split_ratio
                if h['quantity'] > 0:
                    h['avg_price'] = h['total_invested'] / h['quantity']

    # Filter out holdings with 0 or negative quantity
    active_holdings = [h for h in holdings_map.values() if h['quantity'] > 0.0001]
    return active_holdings
