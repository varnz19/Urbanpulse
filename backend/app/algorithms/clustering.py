import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from sklearn.decomposition import PCA
from app.schemas.ml_schemas import ClusterResponse, ClusterProfile, ClusterPcaPoint

def run_kmeans_clustering(df: pd.DataFrame, features: List[str], k: int = 3, scale: bool = True) -> ClusterResponse:
    """
    Execute K-Means clustering, silhouette validation, cluster profiling, and PCA 2D projections.
    """
    valid_features = [f for f in features if f in df.columns and pd.api.types.is_numeric_dtype(df[f])]
    if len(valid_features) < 1:
        # Automatic fallback: select available numeric columns
        valid_features = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c]) and c not in ('Unnamed: 0', 'id', 'ID')]
        if len(valid_features) < 1:
            raise ValueError("At least one numeric feature is required for clustering.")
        valid_features = valid_features[:4]

    clean_df = df.dropna(subset=valid_features).copy()
    for f in valid_features:
        clean_df[f] = pd.to_numeric(clean_df[f], errors="coerce")
    clean_df = clean_df.dropna(subset=valid_features).copy()
    if len(clean_df) < k:
        raise ValueError(f"Insufficient samples ({len(clean_df)}) for {k} clusters.")

    X = np.ascontiguousarray(clean_df[valid_features].to_numpy(dtype=np.float64))

    if scale:
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
    else:
        X_scaled = X

    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(X_scaled)
    clean_df['cluster'] = cluster_labels

    # Calculate Silhouette score (efficient sampling for datasets > 1500 samples)
    sil_score = 0.0
    if len(clean_df) > k and k > 1:
        try:
            sample_sz = min(1500, len(clean_df))
            sil_score = float(round(silhouette_score(X_scaled, cluster_labels, sample_size=sample_sz, random_state=42), 3))
        except Exception:
            sil_score = 0.0

    inertia = float(round(kmeans.inertia_, 2))

    # Cluster Profiles
    profiles = []
    total_count = len(clean_df)
    for c_id in range(k):
        sub = clean_df[clean_df['cluster'] == c_id]
        member_count = len(sub)
        pct = round((member_count / total_count * 100), 1)

        means = {}
        for f in valid_features:
            means[f] = float(round(sub[f].mean(), 2))

        # Human descriptive summary based on measurable speed & volume
        desc_parts = []
        if "avg_speed_kmh" in means:
            spd = means["avg_speed_kmh"]
            if spd < 20:
                desc_parts.append("Low-speed bottleneck corridor")
            elif spd < 35:
                desc_parts.append("Moderate-speed urban flow")
            else:
                desc_parts.append("High-speed free-flow corridor")

        if "vehicle_count" in means:
            vol = means["vehicle_count"]
            if vol > 3500:
                desc_parts.append("Heavy traffic volume")
            elif vol > 2500:
                desc_parts.append("Moderate volume")
            else:
                desc_parts.append("Light traffic load")

        label = f"Cluster {c_id + 1}"
        desc = " & ".join(desc_parts) if desc_parts else f"Cluster exhibiting distinct profile across {len(valid_features)} features"

        profiles.append(ClusterProfile(
            cluster_id=c_id,
            cluster_label=label,
            member_count=member_count,
            member_percentage=pct,
            feature_means=means,
            description=desc
        ))

    # 2D PCA Projections
    if X_scaled.shape[1] >= 2:
        pca = PCA(n_components=2)
        pca_coords = pca.fit_transform(X_scaled)
        var_ratio = pca.explained_variance_ratio_
        pca_importance = {
            "PC1_variance_ratio": float(round(var_ratio[0], 3)),
            "PC2_variance_ratio": float(round(var_ratio[1], 3)) if len(var_ratio) > 1 else 0.0
        }
    else:
        pca_coords = np.column_stack([X_scaled[:, 0], np.zeros(len(X_scaled))])
        pca_importance = {"PC1_variance_ratio": 1.0, "PC2_variance_ratio": 0.0}

    # Sample up to 250 points for responsive frontend charting
    sample_size = min(len(clean_df), 250)
    sample_indices = np.random.choice(len(clean_df), sample_size, replace=False)

    pca_points = []
    for idx in sample_indices:
        row = clean_df.iloc[idx]
        seg_name = str(row.get("segment_name", row.get("segment_id", f"Record {idx}")))
        spd = float(row.get("avg_speed_kmh", row.get("speed", 0.0)))
        vol = float(row.get("vehicle_count", row.get("traffic_volume", row.get("value", 0.0))))

        pca_points.append(ClusterPcaPoint(
            id=int(idx),
            x=float(round(pca_coords[idx, 0], 2)),
            y=float(round(pca_coords[idx, 1], 2)),
            cluster=int(cluster_labels[idx]),
            segment_name=seg_name,
            avg_speed=spd,
            avg_volume=vol
        ))

    return ClusterResponse(
        k=k,
        silhouette_score=sil_score,
        inertia=inertia,
        features_used=valid_features,
        cluster_profiles=profiles,
        pca_projections=pca_points,
        feature_importance_pca=pca_importance
    )
