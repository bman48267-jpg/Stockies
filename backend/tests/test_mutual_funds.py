"""
Tests for Mutual Funds API endpoints and calculations.
"""

from app.calculations.mf_metrics import calculate_cagr, calculate_portfolio_overlap


def test_calculate_cagr():
    # 100 to 144 over 2 years = 20% CAGR
    res = calculate_cagr(100.0, 144.0, 2.0)
    assert res == 20.0

    # Invalid inputs
    assert calculate_cagr(-10, 100, 1) is None
    assert calculate_cagr(100, 150, 0) is None


def test_calculate_portfolio_overlap():
    holdings_a = [
        {"security_name": "HDFC Bank Ltd.", "sector": "Financials", "weight": 10.0},
        {"security_name": "Infosys Ltd.", "sector": "Tech", "weight": 8.0},
    ]
    holdings_b = [
        {"security_name": "HDFC Bank Ltd.", "sector": "Financials", "weight": 6.0},
        {"security_name": "TCS Ltd.", "sector": "Tech", "weight": 7.0},
    ]

    res = calculate_portfolio_overlap(holdings_a, holdings_b)
    # HDFC Bank overlap = min(10, 6) = 6.0
    assert res["overlap_percentage"] == 6.0
    assert res["common_holdings_count"] == 1
    assert res["unique_holdings_a_count"] == 1
    assert res["unique_holdings_b_count"] == 1


def test_mf_search_endpoint(client):
    response = client.get("/api/v1/mutual-funds/search?q=PPFAS")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert data["count"] >= 1


def test_mf_popular_endpoint(client):
    response = client.get("/api/v1/mutual-funds/popular")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "scheme_code" in data[0]
    assert "current_nav" in data[0]


def test_mf_details_endpoint(client):
    response = client.get("/api/v1/mutual-funds/122639/details")
    assert response.status_code == 200
    data = response.json()
    assert data["scheme_code"] == "122639"
    assert data["current_nav"] > 0
    assert "cagr_1y" in data
    assert len(data["top_holdings"]) > 0


def test_mf_nav_history_endpoint(client):
    response = client.get("/api/v1/mutual-funds/122639/nav-history?period=1y")
    assert response.status_code == 200
    data = response.json()
    assert data["scheme_code"] == "122639"
    assert len(data["data"]) > 0


def test_mf_compare_endpoint(client):
    payload = {"scheme_codes": ["122639", "119063"]}
    response = client.post("/api/v1/mutual-funds/compare", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["schemes"]) == 2


def test_mf_overlap_endpoint(client):
    payload = {"scheme_code_a": "122639", "scheme_code_b": "119063"}
    response = client.post("/api/v1/mutual-funds/overlap", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "overlap_percentage" in data
    assert "common_holdings" in data
