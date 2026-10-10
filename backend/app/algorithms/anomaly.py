import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from sklearn.ensemble import IsolationForest
from app.schemas.ml_schemas import AnomalyRequest, AnomalyResponse, AnomalyItem

def run_anomaly_detection(df: pd.DataFrame, req: AnomalyRequest) -> AnomalyResponse:
    """
    Detect statistical traffic anomalies using Isolation Forest and historical deviation scores.
    """
    clean_df = df.copy()

    if req.segment_filter:
        clean_df = clean_df[
            (clean_df.get("segment_id") == req.segment_filter) |
            (clean_df.get("segment_name") == req.segment_filter)
        ]

    metric_col = req.metric_column
    if metric_col not in clean_df.columns:
        # Fallback to speed if available
        if "avg_speed_kmh" in clean_df.columns:
            metric_col = "avg_speed_kmh"
        else:
            raise ValueError(f"Metric column '{req.metric_column}' not found.")

    clean_df = clean_df.dropna(subset=[metric_col]).reset_index(drop=True)
    if len(clean_df) < 10:
        raise ValueError("Insufficient data rows for anomaly detection.")

    # Calculate historical baseline per segment and hour
    group_cols = []
    if "segment_id" in clean_df.columns:
        group_cols.append("segment_id")
    if "hour" in clean_df.columns:
        group_cols.append("hour")

    if group_cols:
        baselines = clean_df.groupby(group_cols)[metric_col].transform("mean")
        stds = clean_df.groupby(group_cols)[metric_col].transform("std").fillna(1.0)
    else:
        baselines = clean_df[metric_col].mean()
        stds = clean_df[metric_col].std()

    clean_df["baseline"] = baselines
    clean_df["std"] = stds
    clean_df["deviation_score"] = np.abs((clean_df[metric_col] - clean_df["baseline"]) / (clean_df["std"] + 1e-5))

    anomalies_list = []

    if req.method == "zscore":
        # Pure statistical Z-score (> 2.5 std)
        clean_df["is_anomaly"] = clean_df["deviation_score"] >= 2.5
        anomaly_scores = clean_df["deviation_score"] / 3.0
    else:
        # Isolation Forest
        feature_cols = [metric_col]
        if "vehicle_count" in clean_df.columns and "vehicle_count" != metric_col:
            feature_cols.append("vehicle_count")
        if "hour" in clean_df.columns and "hour" != metric_col:
            feature_cols.append("hour")

        X = clean_df[feature_cols].values
        iso = IsolationForest(contamination=req.contamination, random_state=42)
        preds = iso.fit_predict(X)
        clean_df["is_anomaly"] = (preds == -1)
        raw_scores = -iso.score_samples(X)  # Higher is more anomalous
        # Normalize scores to 0..1
        min_s, max_s = raw_scores.min(), raw_scores.max()
        if max_s > min_s:
            anomaly_scores = (raw_scores - min_s) / (max_s - min_s)
        else:
            anomaly_scores = np.zeros(len(raw_scores))

    clean_df["anomaly_score"] = np.round(anomaly_scores, 2)
    anomaly_rows = clean_df[clean_df["is_anomaly"]].copy()

    # Sort by anomaly score descending
    anomaly_rows = anomaly_rows.sort_values(by="anomaly_score", ascending=False).head(100)

    for idx, row in anomaly_rows.iterrows():
        obs = float(round(row[metric_col], 1))
        base = float(round(row["baseline"], 1))
        diff_pct = round(((obs - base) / max(0.1, base)) * 100, 1)
        score = float(row["anomaly_score"])

        # Determine severity
        if score >= 0.75 or abs(diff_pct) >= 60:
            severity = "Critical"
        elif score >= 0.50 or abs(diff_pct) >= 35:
            severity = "High"
        else:
            severity = "Moderate"

        seg_name = str(row.get("segment_name", row.get("segment_id", "Corridor")))
        seg_id = str(row.get("segment_id", f"SEG-{idx}"))
        tstamp = str(row.get("timestamp", f"Record #{idx}"))

        direction = "below" if obs < base else "above"
        evidence = (
            f"Observed {metric_col} is {abs(diff_pct)}% {direction} typical historical baseline "
            f"({obs} vs expected {base}). Statistical deviation score: {score:.2f}."
        )

        anomalies_list.append(AnomalyItem(
            index=int(idx),
            timestamp=tstamp,
            segment_id=seg_id,
            segment_name=seg_name,
            observed_value=obs,
            baseline_value=base,
            deviation_pct=diff_pct,
            anomaly_score=score,
            severity=severity,
            supporting_evidence=evidence
        ))

    total_records = len(clean_df)
    anom_count = len(anomalies_list)
    rate = round((anom_count / total_records * 100), 2) if total_records > 0 else 0.0

    return AnomalyResponse(
        method_used=req.method,
        metric_analyzed=metric_col,
        total_records=total_records,
        anomalies_count=anom_count,
        anomaly_rate_pct=rate,
        anomalies=anomalies_list
    )
