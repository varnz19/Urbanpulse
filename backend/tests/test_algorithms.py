import pytest
import os
import pandas as pd
from app.data_processing.loader import load_dataset_file
from app.algorithms.clustering import run_kmeans_clustering
from app.algorithms.classification import run_classification
from app.algorithms.association import run_association_mining
from app.algorithms.anomaly import run_anomaly_detection
from app.schemas.ml_schemas import ClassifyRequest, AssociationRequest, AnomalyRequest

SAMPLE_CSV = os.path.join(os.path.dirname(__file__), "..", "app", "sample_data", "hyderabad_traffic_corridors.csv")

@pytest.fixture
def df():
    return load_dataset_file(SAMPLE_CSV, "csv")

def test_kmeans_clustering(df):
    res = run_kmeans_clustering(df, ["avg_speed_kmh", "vehicle_count"], k=3, scale=True)
    assert res.k == 3
    assert len(res.cluster_profiles) == 3
    assert res.silhouette_score > 0.0
    assert len(res.pca_projections) > 0

def test_decision_tree_classification(df):
    req = ClassifyRequest(
        model_type="decision_tree",
        target_column="congestion_level",
        feature_columns=["avg_speed_kmh", "vehicle_count", "hour"],
        test_size=0.2,
        max_depth=4
    )
    res = run_classification(df, req)
    assert res.accuracy > 0.70
    assert len(res.classes) >= 3
    assert len(res.confusion_matrix) == len(res.classes)
    assert len(res.decision_rules) > 0

def test_naive_bayes_classification(df):
    req = ClassifyRequest(
        model_type="naive_bayes",
        target_column="congestion_level",
        feature_columns=["avg_speed_kmh", "vehicle_count", "hour"]
    )
    res = run_classification(df, req)
    assert res.accuracy > 0.50

def test_oner_classification(df):
    req = ClassifyRequest(
        model_type="oner",
        target_column="congestion_level",
        feature_columns=["avg_speed_kmh", "vehicle_count", "hour"]
    )
    res = run_classification(df, req)
    assert res.accuracy > 0.50

def test_association_rules(df):
    req = AssociationRequest(
        min_support=0.03,
        min_confidence=0.3,
        min_lift=1.0
    )
    res = run_association_mining(df, req)
    assert res.total_rules_found > 0
    assert len(res.rules) > 0
    assert res.rules[0].lift >= 1.0

def test_anomaly_detection(df):
    req = AnomalyRequest(
        method="isolation_forest",
        contamination=0.04,
        metric_column="avg_speed_kmh"
    )
    res = run_anomaly_detection(df, req)
    assert res.anomalies_count > 0
    assert len(res.anomalies) > 0
    assert res.anomalies[0].anomaly_score > 0
