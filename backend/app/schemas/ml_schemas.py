from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Clustering
class ClusterRequest(BaseModel):
    features: List[str] = Field(default_factory=lambda: ["avg_speed_kmh", "vehicle_count"])
    k: int = Field(default=3, ge=2, le=10)
    scale_features: bool = True

class ClusterProfile(BaseModel):
    cluster_id: int
    cluster_label: str
    member_count: int
    member_percentage: float
    feature_means: Dict[str, float]
    description: str

class ClusterPcaPoint(BaseModel):
    id: int
    x: float
    y: float
    cluster: int
    segment_name: str
    avg_speed: float
    avg_volume: float

class ClusterResponse(BaseModel):
    k: int
    silhouette_score: float
    inertia: float
    features_used: List[str]
    cluster_profiles: List[ClusterProfile]
    pca_projections: List[ClusterPcaPoint]
    feature_importance_pca: Dict[str, float]

# Classification
class ClassifyRequest(BaseModel):
    model_type: str = "decision_tree"  # "decision_tree", "naive_bayes", "oner", "rules"
    target_column: str = "congestion_level"
    feature_columns: List[str] = Field(default_factory=lambda: ["avg_speed_kmh", "vehicle_count", "hour", "weather", "road_type"])
    test_size: float = 0.2
    max_depth: Optional[int] = 4
    random_state: int = 42

class ClassMetrics(BaseModel):
    precision: float
    recall: float
    f1_score: float
    support: int

class ClassifyResponse(BaseModel):
    model_type: str
    model_name: str
    accuracy: float
    macro_f1: float
    weighted_f1: float
    classes: List[str]
    confusion_matrix: List[List[int]]
    per_class: Dict[str, ClassMetrics]
    feature_importance: Optional[Dict[str, float]] = None
    decision_rules: Optional[List[str]] = None
    cv_mean_accuracy: Optional[float] = None
    cv_std: Optional[float] = None
    total_train_samples: int
    total_test_samples: int

# Association Rules
class AssociationRequest(BaseModel):
    categorical_columns: Optional[List[str]] = None
    min_support: float = Field(default=0.04, ge=0.01, le=1.0)
    min_confidence: float = Field(default=0.3, ge=0.05, le=1.0)
    min_lift: float = Field(default=1.0, ge=0.0)
    max_len: int = Field(default=3, ge=2, le=5)

class AssociationRuleItem(BaseModel):
    antecedents: List[str]
    consequents: List[str]
    support: float
    confidence: float
    lift: float
    conviction: float
    human_explanation: str

class AssociationResponse(BaseModel):
    total_rules_found: int
    min_support_used: float
    min_confidence_used: float
    rules: List[AssociationRuleItem]

# Anomaly Detection
class AnomalyRequest(BaseModel):
    method: str = "isolation_forest"  # "isolation_forest", "zscore", "ensemble"
    contamination: float = Field(default=0.04, ge=0.01, le=0.2)
    metric_column: str = "avg_speed_kmh"
    segment_filter: Optional[str] = None

class AnomalyItem(BaseModel):
    index: int
    timestamp: str
    segment_id: str
    segment_name: str
    observed_value: float
    baseline_value: float
    deviation_pct: float
    anomaly_score: float
    severity: str  # "Moderate", "High", "Critical"
    supporting_evidence: str

class AnomalyResponse(BaseModel):
    method_used: str
    metric_analyzed: str
    total_records: int
    anomalies_count: int
    anomaly_rate_pct: float
    anomalies: List[AnomalyItem]
