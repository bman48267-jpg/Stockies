from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Float, Date, DateTime, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base


class PortfolioTransaction(Base):
    """
    Each row is a single transaction event.
    Holdings are calculated in real-time from transaction history.
    Supports: BUY, SELL, SIP, DIVIDEND, BONUS, SPLIT
    Architecture supports future corporate actions.
    """

    __tablename__ = "portfolio_transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Asset identification
    asset_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # 'stock' | 'mutual_fund'
    symbol: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # NSE symbol or scheme_code
    name: Mapped[str] = mapped_column(String(512), nullable=False)

    # Transaction details
    transaction_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # BUY | SELL | SIP | DIVIDEND | BONUS | SPLIT
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)  # quantity * price

    # Charges
    brokerage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    taxes: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        Index(
            "ix_portfolio_txn_user_type_symbol",
            "user_id",
            "asset_type",
            "symbol",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<PortfolioTransaction user={self.user_id} "
            f"{self.transaction_type} {self.symbol} "
            f"qty={self.quantity} @ {self.price}>"
        )
