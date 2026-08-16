from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Float, BigInteger, Date, DateTime, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class MutualFundScheme(Base):
    __tablename__ = "mutual_fund_schemes"

    scheme_code: Mapped[str] = mapped_column(String(20), primary_key=True, index=True)
    scheme_name: Mapped[str] = mapped_column(String(512), nullable=False, index=True)
    amc: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    sub_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    plan: Mapped[str] = mapped_column(String(20), nullable=False)   # Direct / Regular
    option: Mapped[str] = mapped_column(String(20), nullable=False)  # Growth / IDCW
    benchmark: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    inception_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expense_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    aum: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    exit_load: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    risk_level: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    nav_history: Mapped[list["MFNAVHistory"]] = relationship(
        "MFNAVHistory", back_populates="scheme"
    )
    holdings: Mapped[list["MFHolding"]] = relationship(
        "MFHolding", back_populates="scheme"
    )

    def __repr__(self) -> str:
        return f"<MFScheme {self.scheme_code}: {self.scheme_name[:40]}>"


class MFNAVHistory(Base):
    __tablename__ = "mf_nav_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    scheme_code: Mapped[str] = mapped_column(
        ForeignKey("mutual_fund_schemes.scheme_code", ondelete="CASCADE"), index=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    nav: Mapped[float] = mapped_column(Float, nullable=False)

    scheme: Mapped["MutualFundScheme"] = relationship(
        "MutualFundScheme", back_populates="nav_history"
    )

    __table_args__ = (
        Index("ix_nav_history_scheme_date", "scheme_code", "date", unique=True),
    )

    def __repr__(self) -> str:
        return f"<MFNAVHistory {self.scheme_code} {self.date} nav={self.nav}>"


class MFHolding(Base):
    __tablename__ = "mf_holdings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    scheme_code: Mapped[str] = mapped_column(
        ForeignKey("mutual_fund_schemes.scheme_code", ondelete="CASCADE"), index=True
    )
    security_name: Mapped[str] = mapped_column(String(255), nullable=False)
    isin: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    sector: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    reporting_date: Mapped[date] = mapped_column(Date, nullable=False)

    scheme: Mapped["MutualFundScheme"] = relationship(
        "MutualFundScheme", back_populates="holdings"
    )

    __table_args__ = (
        Index("ix_mf_holdings_scheme_isin_date", "scheme_code", "isin", "reporting_date"),
    )

    def __repr__(self) -> str:
        return f"<MFHolding {self.scheme_code}: {self.security_name}>"
