"""
SQLAlchemy ORM models for Stockies.
Import all models here so Alembic autogenerate can detect them.
"""

from app.db.models.user import User  # noqa: F401
from app.db.models.stock import Stock, StockFundamentals, StockPriceHistory  # noqa: F401
from app.db.models.mutual_fund import MutualFundScheme, MFNAVHistory, MFHolding  # noqa: F401
from app.db.models.portfolio import PortfolioTransaction  # noqa: F401

__all__ = [
    "User",
    "Stock",
    "StockFundamentals",
    "StockPriceHistory",
    "MutualFundScheme",
    "MFNAVHistory",
    "MFHolding",
    "PortfolioTransaction",
]
