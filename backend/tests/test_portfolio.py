"""
Portfolio Unit & API Tests
"""

from datetime import date
from fastapi.testclient import TestClient
from app.calculations.portfolio_metrics import (
    calculate_xirr,
    aggregate_holdings_from_transactions,
)


def test_calculate_xirr_positive_return():
    """
    Test XIRR calculation with positive gain over 1 year.
    Buy 100,000 on 2025-01-01, worth 115,000 on 2026-01-01 -> ~15% return.
    """
    cashflows = [
        (date(2025, 1, 1), -100000.0),
        (date(2026, 1, 1), 115000.0),
    ]
    xirr = calculate_xirr(cashflows)
    assert 14.5 <= xirr <= 15.5


def test_aggregate_holdings():
    """
    Test aggregation of BUY, SIP, and SELL transactions.
    """
    class MockTxn:
        def __init__(self, asset_type, symbol, name, ttype, tdate, qty, price):
            self.asset_type = asset_type
            self.symbol = symbol
            self.name = name
            self.transaction_type = ttype
            self.transaction_date = tdate
            self.quantity = qty
            self.price = price
            self.brokerage = 0.0
            self.taxes = 0.0

    txns = [
        MockTxn('stock', 'RELIANCE', 'Reliance Industries', 'BUY', date(2025, 1, 1), 10, 2000.0),
        MockTxn('stock', 'RELIANCE', 'Reliance Industries', 'BUY', date(2025, 2, 1), 10, 3000.0),
        MockTxn('stock', 'RELIANCE', 'Reliance Industries', 'SELL', date(2025, 3, 1), 5, 2500.0),
    ]

    holdings = aggregate_holdings_from_transactions(txns)
    assert len(holdings) == 1
    h = holdings[0]
    assert h['symbol'] == 'RELIANCE'
    assert h['quantity'] == 15  # 10 + 10 - 5
    assert round(h['avg_price'], 2) == 2500.0


def test_portfolio_api_flow(client: TestClient, db_session):
    """
    Test recording a transaction, getting summary, and deleting transaction.
    """
    from app.db.models.user import User
    demo_user = User(id=1, name="Demo User", email="demo@stockies.com", password_hash="dummy")
    db_session.add(demo_user)
    db_session.commit()

    # 1. Add BUY stock transaction

    txn_data = {
        "asset_type": "stock",
        "symbol": "TCS",
        "name": "Tata Consultancy Services",
        "transaction_type": "BUY",
        "transaction_date": "2025-01-15",
        "quantity": 10,
        "price": 3500.0,
        "brokerage": 20.0,
        "taxes": 10.0,
        "notes": "Initial purchase",
    }
    response = client.post("/api/v1/portfolio/transactions", json=txn_data)
    assert response.status_code == 201
    res_json = response.json()
    assert res_json["symbol"] == "TCS"
    assert res_json["amount"] == 35030.0
    txn_id = res_json["id"]

    # 2. Get Portfolio Summary
    sum_res = client.get("/api/v1/portfolio/summary")
    assert sum_res.status_code == 200
    sum_json = sum_res.json()
    assert sum_json["total_invested"] > 0
    assert len(sum_json["holdings"]) >= 1

    # 3. List Transactions
    list_res = client.get("/api/v1/portfolio/transactions")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 4. Delete Transaction
    del_res = client.delete(f"/api/v1/portfolio/transactions/{txn_id}")
    assert del_res.status_code == 204
