"""
Tests for the health endpoint.
"""


def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "1.0.0"
    assert data["market_status"] in {
        "open", "closed", "pre_open", "after_market", "weekend"
    }
    assert "timestamp" in data


def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["service"] == "Stockies API"
