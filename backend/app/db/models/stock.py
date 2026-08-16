from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Float, BigInteger, Date, DateTime, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class Stock(Base):
    __tablename__ = "stocks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    symbol: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    exchange: Mapped[str] = mapped_column(String(10), nullable=False)  # NSE / BSE
    company_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    sector: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    isin: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    market_cap: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    current_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    previous_close: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    fundamentals: Mapped[Optional["StockFundamentals"]] = relationship(
        "StockFundamentals", back_populates="stock", uselist=False
    )
    price_history: Mapped[list["StockPriceHistory"]] = relationship(
        "StockPriceHistory", back_populates="stock"
    )

    __table_args__ = (
        Index("ix_stocks_symbol_exchange", "symbol", "exchange", unique=True),
    )

    def __repr__(self) -> str:
        return f"<Stock {self.symbol}:{self.exchange}>"


class StockFundamentals(Base):
    __tablename__ = "stock_fundamentals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    stock_id: Mapped[int] = mapped_column(
        ForeignKey("stocks.id", ondelete="CASCADE"), unique=True, index=True
    )

    # Valuation
    pe_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pb_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    peg_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ev_ebitda: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dividend_yield: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Profitability
    roe: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    roce: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    net_margin: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    operating_margin: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Growth
    revenue_growth: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    profit_growth: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    eps_growth: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Financial strength
    debt_to_equity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    current_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    interest_coverage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Ownership
    promoter_holding: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fii_holding: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dii_holding: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    public_holding: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Raw financials
    revenue: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    profit: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    eps: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    book_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    face_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    stock: Mapped["Stock"] = relationship("Stock", back_populates="fundamentals")

    def __repr__(self) -> str:
        return f"<StockFundamentals stock_id={self.stock_id}>"


class StockPriceHistory(Base):
    __tablename__ = "stock_price_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    stock_id: Mapped[int] = mapped_column(
        ForeignKey("stocks.id", ondelete="CASCADE"), index=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    open: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    high: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    low: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    close: Mapped[float] = mapped_column(Float, nullable=False)
    adjusted_close: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    volume: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)

    stock: Mapped["Stock"] = relationship("Stock", back_populates="price_history")

    __table_args__ = (
        Index("ix_price_history_stock_date", "stock_id", "date", unique=True),
    )

    def __repr__(self) -> str:
        return f"<StockPriceHistory stock_id={self.stock_id} date={self.date}>"
