"""
Portfolio Management API Router
"""

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.database import get_db
from app.db.models.portfolio import PortfolioTransaction
from app.schemas.portfolio import (
    TransactionCreate,
    TransactionResponse,
    PortfolioSummary,
    HoldingSummary,
    AssetAllocation,
)
from app.calculations.portfolio_metrics import (
    aggregate_holdings_from_transactions,
    calculate_xirr,
)
from app.utils.yfinance_adapter import get_quote
from app.utils.mfapi_adapter import get_mf_details

from app.core.logging import logger

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

# For development, default demo user ID = 1
DEFAULT_USER_ID = 1


@router.post(
    "/transactions",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a portfolio transaction",
)
def add_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
):
    # Ensure demo user exists
    from app.db.models.user import User
    user = db.get(User, DEFAULT_USER_ID)
    if not user:
        user = User(id=DEFAULT_USER_ID, name="Demo User", email="demo@stockies.com", password_hash="demo")
        db.add(user)
        db.commit()

    total_amount = (payload.quantity * payload.price) + payload.brokerage + payload.taxes

    txn = PortfolioTransaction(
        user_id=DEFAULT_USER_ID,

        asset_type=payload.asset_type.lower(),
        symbol=payload.symbol.upper(),
        name=payload.name,
        transaction_type=payload.transaction_type.upper(),
        transaction_date=payload.transaction_date,
        quantity=payload.quantity,
        price=payload.price,
        amount=total_amount,
        brokerage=payload.brokerage,
        taxes=payload.taxes,
        notes=payload.notes,
    )

    db.add(txn)
    db.commit()
    db.refresh(txn)

    logger.info(
        "Added transaction #%s: %s %s %s qty=%.2f @ %.2f",
        txn.id,
        txn.transaction_type,
        txn.asset_type,
        txn.symbol,
        txn.quantity,
        txn.price,
    )
    return txn


@router.get(
    "/transactions",
    response_model=List[TransactionResponse],
    summary="List portfolio transactions",
)
def get_transactions(
    asset_type: Optional[str] = Query(None, description="'stock' or 'mutual_fund'"),
    symbol: Optional[str] = Query(None, description="Filter by symbol"),
    db: Session = Depends(get_db),
):
    """
    Get user transaction history.
    """
    query = select(PortfolioTransaction).where(
        PortfolioTransaction.user_id == DEFAULT_USER_ID
    )

    if asset_type:
        query = query.where(PortfolioTransaction.asset_type == asset_type.lower())
    if symbol:
        query = query.where(PortfolioTransaction.symbol == symbol.upper())

    query = query.order_by(PortfolioTransaction.transaction_date.desc())
    results = db.scalars(query).all()
    return results


@router.delete(
    "/transactions/{txn_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a transaction",
)
def delete_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete a single transaction by ID.
    """
    txn = db.get(PortfolioTransaction, txn_id)
    if not txn or txn.user_id != DEFAULT_USER_ID:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID {txn_id} not found",
        )

    db.delete(txn)
    db.commit()
    logger.info("Deleted transaction #%s", txn_id)
    return None


@router.get(
    "/summary",
    response_model=PortfolioSummary,
    summary="Get aggregated portfolio metrics and holdings",
)
def get_portfolio_summary(
    db: Session = Depends(get_db),
):
    """
    Calculates live holdings, total invested, current market value, overall P&L,
    stocks vs mutual funds allocation, and overall XIRR return.
    """
    txns = db.scalars(
        select(PortfolioTransaction)
        .where(PortfolioTransaction.user_id == DEFAULT_USER_ID)
        .order_by(PortfolioTransaction.transaction_date.asc())
    ).all()

    if not txns:
        return PortfolioSummary(
            total_invested=0.0,
            current_value=0.0,
            total_pnl=0.0,
            total_pnl_percent=0.0,
            day_change=0.0,
            day_change_percent=0.0,
            xirr=0.0,
            allocation=AssetAllocation(),
            holdings=[],
        )

    # 1. Aggregate holdings from transactions
    aggregated = aggregate_holdings_from_transactions(txns)

    holdings_list: List[HoldingSummary] = []
    total_invested = 0.0
    total_current_value = 0.0
    total_day_change = 0.0

    stocks_invested = 0.0
    stocks_value = 0.0
    stocks_count = 0

    mf_invested = 0.0
    mf_value = 0.0
    mf_count = 0

    emergency_fund_invested = 0.0
    emergency_fund_value = 0.0
    emergency_fund_count = 0

    fixed_deposit_invested = 0.0
    fixed_deposit_value = 0.0
    fixed_deposit_count = 0

    bond_invested = 0.0
    bond_value = 0.0
    bond_count = 0

    all_cashflows: List[tuple[date, float]] = []

    # Add transaction cashflows for XIRR calculation
    for t in txns:
        if t.transaction_type.upper() in ('BUY', 'SIP'):
            all_cashflows.append((t.transaction_date, -t.amount))
        elif t.transaction_type.upper() in ('SELL', 'DIVIDEND'):
            all_cashflows.append((t.transaction_date, t.amount))

    # 2. Enrich holdings with live current prices
    today = date.today()

    for h in aggregated:
        symbol = h['symbol']
        asset_type = h['asset_type']
        qty = h['quantity']
        inv = h['total_invested']
        avg_p = h['avg_price']

        current_price = avg_p  # fallback if live fetch fails
        day_chg = 0.0
        day_chg_pct = 0.0

        if asset_type == 'stock':
            try:
                quote = get_quote(symbol)
                if quote:
                    current_price = quote['current_price']
                    day_chg = (quote.get('change') or 0.0) * qty
                    day_chg_pct = quote.get('change_percent') or 0.0
            except Exception as exc:
                logger.warning("Could not fetch live quote for stock %s: %s", symbol, exc)
            stocks_invested += inv
            stocks_count += 1
        elif asset_type == 'mutual_fund':
            try:
                mf_data = get_mf_details(symbol)
                if mf_data and mf_data.get('current_nav'):
                    current_price = mf_data['current_nav']
                    day_chg = (mf_data.get('change') or 0.0) * qty
                    day_chg_pct = mf_data.get('change_percent') or 0.0
            except Exception as exc:
                logger.warning("Could not fetch live NAV for scheme %s: %s", symbol, exc)
            mf_invested += inv
            mf_count += 1
        elif asset_type == 'emergency_fund':
            emergency_fund_invested += inv
            emergency_fund_count += 1
        elif asset_type == 'fixed_deposit':
            fixed_deposit_invested += inv
            fixed_deposit_count += 1
        elif asset_type == 'bond':
            bond_invested += inv
            bond_count += 1

        curr_val = qty * current_price
        pnl = curr_val - inv
        pnl_pct = (pnl / inv * 100.0) if inv > 0 else 0.0

        if asset_type == 'stock':
            stocks_value += curr_val
        elif asset_type == 'mutual_fund':
            mf_value += curr_val
        elif asset_type == 'emergency_fund':
            emergency_fund_value += curr_val
        elif asset_type == 'fixed_deposit':
            fixed_deposit_value += curr_val
        elif asset_type == 'bond':
            bond_value += curr_val

        total_invested += inv
        total_current_value += curr_val
        total_day_change += day_chg

        holdings_list.append(
            HoldingSummary(
                symbol=symbol,
                name=h['name'],
                asset_type=asset_type,
                quantity=round(qty, 4),
                avg_price=round(avg_p, 2),
                invested_amount=round(inv, 2),
                current_price=round(current_price, 2),
                current_value=round(curr_val, 2),
                unrealized_pnl=round(pnl, 2),
                unrealized_pnl_percent=round(pnl_pct, 2),
                day_change=round(day_chg, 2),
                day_change_percent=round(day_chg_pct, 2),
            )
        )

    # Add final current valuation cashflow for overall XIRR at today's date
    if total_current_value > 0:
        all_cashflows.append((today, total_current_value))

    total_pnl = total_current_value - total_invested
    total_pnl_pct = (total_pnl / total_invested * 100.0) if total_invested > 0 else 0.0
    day_change_pct = (total_day_change / (total_current_value - total_day_change) * 100.0) if (total_current_value - total_day_change) > 0 else 0.0

    xirr_val = calculate_xirr(all_cashflows)

    stocks_pct = (stocks_value / total_current_value * 100.0) if total_current_value > 0 else 0.0
    mf_pct = (mf_value / total_current_value * 100.0) if total_current_value > 0 else 0.0
    emergency_fund_pct = (emergency_fund_value / total_current_value * 100.0) if total_current_value > 0 else 0.0
    fixed_deposit_pct = (fixed_deposit_value / total_current_value * 100.0) if total_current_value > 0 else 0.0
    bond_pct = (bond_value / total_current_value * 100.0) if total_current_value > 0 else 0.0

    allocation = AssetAllocation(
        stocks_value=round(stocks_value, 2),
        stocks_invested=round(stocks_invested, 2),
        stocks_count=stocks_count,
        mf_value=round(mf_value, 2),
        mf_invested=round(mf_invested, 2),
        mf_count=mf_count,
        emergency_fund_value=round(emergency_fund_value, 2),
        emergency_fund_invested=round(emergency_fund_invested, 2),
        emergency_fund_count=emergency_fund_count,
        fixed_deposit_value=round(fixed_deposit_value, 2),
        fixed_deposit_invested=round(fixed_deposit_invested, 2),
        fixed_deposit_count=fixed_deposit_count,
        bond_value=round(bond_value, 2),
        bond_invested=round(bond_invested, 2),
        bond_count=bond_count,
        stocks_percentage=round(stocks_pct, 2),
        mf_percentage=round(mf_pct, 2),
        emergency_fund_percentage=round(emergency_fund_pct, 2),
        fixed_deposit_percentage=round(fixed_deposit_pct, 2),
        bond_percentage=round(bond_pct, 2),
    )

    return PortfolioSummary(
        total_invested=round(total_invested, 2),
        current_value=round(total_current_value, 2),
        total_pnl=round(total_pnl, 2),
        total_pnl_percent=round(total_pnl_pct, 2),
        day_change=round(total_day_change, 2),
        day_change_percent=round(day_change_pct, 2),
        xirr=xirr_val,
        allocation=allocation,
        holdings=holdings_list,
    )
