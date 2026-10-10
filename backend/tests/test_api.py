import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_list_datasets(client):
    response = client.get("/api/datasets")
    assert response.status_code == 200
    datasets = response.json()
    assert len(datasets) >= 2
    ids = [d["id"] for d in datasets]
    assert "demo-hyderabad-corridors-csv" in ids

def test_dataset_overview_analytics(client):
    response = client.get("/api/analytics/demo-hyderabad-corridors-csv/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["total_observations"] == 2016
    assert data["unique_segments"] == 12
    assert "Low" in data["congestion_breakdown"]
    assert len(data["hourly_trend"]) > 0

def test_clustering_api(client):
    payload = {
        "features": ["avg_speed_kmh", "vehicle_count"],
        "k": 3,
        "scale_features": True
    }
    response = client.post("/api/ml/demo-hyderabad-corridors-csv/clustering", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["k"] == 3
    assert len(data["cluster_profiles"]) == 3
