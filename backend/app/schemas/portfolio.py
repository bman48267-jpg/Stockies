"""
Portfolio Pydantic Schemas
"""

from datetime import date, datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, ConfigDict


class TransactionBase(BaseModel):
    asset_type: str = Field(..., description="'stock' or 'mutual_fund'")
    symbol: str = Field(..., description="Stock symbol (e.g. RELIANCE) or MF scheme code (e.g. 122639)")
    name: str = Field(..., description="Display name of the asset")
    transaction_type: str = Field(..., description="BUY | SELL | SIP | DIVIDEND | BONUS | SPLIT")
    transaction_date: date = Field(..., description="Date of transaction")
    quantity: float = Field(..., gt=0, description="Quantity or units")
    price: float = Field(..., ge=0, description="Price per share or NAV per unit")
    brokerage: float = Field(0.0, ge=0, description="Brokerage charges")
    taxes: float = Field(0.0, ge=0, description="STT / Taxes")
    notes: Optional[str] = Field(None, max_length=1000)


class TransactionCreate(TransactionBase):
    pass


class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    amount: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HoldingSummary(BaseModel):
    symbol: str
    name: str
    asset_type: str  # 'stock' | 'mutual_fund'
    quantity: float
    avg_price: float
    invested_amount: float
    current_price: float
    current_value: float
    unrealized_pnl: float
    unrealized_pnl_percent: float
    day_change: Optional[float] = 0.0
    day_change_percent: Optional[float] = 0.0


class AssetAllocation(BaseModel):
    stocks_value: float = 0.0
    stocks_invested: float = 0.0
    stocks_count: int = 0
    mf_value: float = 0.0
    mf_invested: float = 0.0
    mf_count: int = 0
    emergency_fund_value: float = 0.0
    emergency_fund_invested: float = 0.0
    emergency_fund_count: int = 0
    fixed_deposit_value: float = 0.0
    fixed_deposit_invested: float = 0.0
    fixed_deposit_count: int = 0
    bond_value: float = 0.0
    bond_invested: float = 0.0
    bond_count: int = 0
    stocks_percentage: float = 0.0
    mf_percentage: float = 0.0
    emergency_fund_percentage: float = 0.0
    fixed_deposit_percentage: float = 0.0
    bond_percentage: float = 0.0


class PortfolioSummary(BaseModel):
    total_invested: float = 0.0
    current_value: float = 0.0
    total_pnl: float = 0.0
    total_pnl_percent: float = 0.0
    day_change: float = 0.0
    day_change_percent: float = 0.0
    xirr: Optional[float] = 0.0
    allocation: AssetAllocation
    holdings: List[HoldingSummary] = []
