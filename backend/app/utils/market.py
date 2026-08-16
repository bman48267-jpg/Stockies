"""
Market utilities — timezone handling and market status.
"""

from datetime import datetime, time
import zoneinfo

KOLKATA = zoneinfo.ZoneInfo("Asia/Kolkata")

# NSE / BSE market hours IST
_PREOPEN_START = time(9, 0)
_MARKET_OPEN = time(9, 15)
_MARKET_CLOSE = time(15, 30)


def now_ist() -> datetime:
    """Return current datetime in IST."""
    return datetime.now(tz=KOLKATA)


def get_market_status() -> str:
    """
    Return a human-readable market status string based on current IST time.
    Returns one of: 'open', 'closed', 'pre_open', 'after_market', 'weekend'
    """
    now = now_ist()
    weekday = now.weekday()  # 0=Monday … 6=Sunday
    current_time = now.time()

    # Saturday or Sunday
    if weekday >= 5:
        return "weekend"

    if _PREOPEN_START <= current_time < _MARKET_OPEN:
        return "pre_open"

    if _MARKET_OPEN <= current_time <= _MARKET_CLOSE:
        return "open"

    return "closed"
