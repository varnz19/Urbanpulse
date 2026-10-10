import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from app.schemas.analytics_schemas import (
    OverviewMetrics, HourlyTrendItem, DayComparisonItem,
    PrioritySegmentItem, HeatmapResponse, HeatmapCell, CorridorGeoItem
)

def compute_overview_metrics(df: pd.DataFrame) -> OverviewMetrics:
    total_obs = len(df)
    unique_segs = int(df["segment_id"].nunique()) if "segment_id" in df.columns else (
        int(df["segment_name"].nunique()) if "segment_name" in df.columns else 1
    )

    # Date coverage
    date_start, date_end = None, None
    if "timestamp" in df.columns:
        valid_ts = pd.to_datetime(df["timestamp"], errors="coerce").dropna()
        if not valid_ts.empty:
            date_start = valid_ts.min().strftime("%Y-%m-%d %H:%M")
            date_end = valid_ts.max().strftime("%Y-%m-%d %H:%M")

    # Completeness %
    total_cells = df.size
    missing_cells = df.isna().sum().sum()
    completeness = round(((total_cells - missing_cells) / max(1, total_cells)) * 100, 1)

    # Speed & Volume
    avg_speed = float(round(df["avg_speed_kmh"].mean(), 1)) if "avg_speed_kmh" in df.columns else None
    avg_volume = float(round(df["vehicle_count"].mean(), 0)) if "vehicle_count" in df.columns else None

    # Congestion breakdown
    congestion_breakdown = {}
    if "congestion_level" in df.columns:
        counts = df["congestion_level"].value_counts().to_dict()
        for k, v in counts.items():
            congestion_breakdown[str(k)] = int(v)
    elif "avg_speed_kmh" in df.columns:
        # Derive if column absent
        def speed_to_cong(s):
            if pd.isna(s): return "Unknown"
            if s < 18: return "Severe"
            if s < 28: return "High"
            if s < 40: return "Moderate"
            return "Low"
        counts = df["avg_speed_kmh"].apply(speed_to_cong).value_counts().to_dict()
        for k, v in counts.items():
            congestion_breakdown[str(k)] = int(v)

    # Hourly trend
    hourly_trend = []
    if "hour" in df.columns and "avg_speed_kmh" in df.columns:
        grouped = df.groupby("hour").agg({
            "avg_speed_kmh": "mean",
            "vehicle_count": "mean" if "vehicle_count" in df.columns else "count"
        }).reset_index()
        for _, row in grouped.iterrows():
            h = int(row["hour"])
            spd = float(round(row["avg_speed_kmh"], 1))
            vol = float(round(row["vehicle_count"], 0)) if "vehicle_count" in df.columns else 0.0
            # Higher index = more congested (inversely related to speed)
            cong_idx = float(round(max(0, 60.0 - spd), 1))
            hourly_trend.append(HourlyTrendItem(
                hour=h,
                avg_speed=spd,
                avg_volume=vol,
                congestion_index=cong_idx
            ))

    # Weekday vs Weekend
    day_comparison = []
    if "is_weekend" in df.columns or "day_of_week" in df.columns:
        temp_df = df.copy()
        if "is_weekend" not in temp_df.columns:
            temp_df["is_weekend"] = temp_df["day_of_week"].apply(lambda d: 1 if str(d).lower() in ("saturday", "sunday") else 0)

        for w_val, label in [(0, "Weekday"), (1, "Weekend")]:
            sub = temp_df[temp_df["is_weekend"] == w_val]
            if not sub.empty:
                spd = float(round(sub["avg_speed_kmh"].mean(), 1)) if "avg_speed_kmh" in sub.columns else 0.0
                vol = float(round(sub["vehicle_count"].mean(), 0)) if "vehicle_count" in sub.columns else 0.0
                sev_pct = 0.0
                if "congestion_level" in sub.columns:
                    sev_count = (sub["congestion_level"].isin(["High", "Severe"])).sum()
                    sev_pct = round((sev_count / len(sub)) * 100, 1)
                day_comparison.append(DayComparisonItem(
                    day_type=label,
                    avg_speed=spd,
                    avg_volume=vol,
                    severe_congestion_pct=sev_pct
                ))

    # Top priority corridors
    priority_corridors = []
    if "segment_name" in df.columns or "segment_id" in df.columns:
        seg_col = "segment_name" if "segment_name" in df.columns else "segment_id"
        seg_groups = df.groupby(seg_col)
        for name, grp in seg_groups:
            spd = float(round(grp["avg_speed_kmh"].mean(), 1)) if "avg_speed_kmh" in grp.columns else 0.0
            vol = float(round(grp["vehicle_count"].mean(), 0)) if "vehicle_count" in grp.columns else 0.0
            lat = float(grp["latitude"].iloc[0]) if "latitude" in grp.columns and pd.notna(grp["latitude"].iloc[0]) else None
            lon = float(grp["longitude"].iloc[0]) if "longitude" in grp.columns and pd.notna(grp["longitude"].iloc[0]) else None
            seg_id = str(grp["segment_id"].iloc[0]) if "segment_id" in grp.columns else str(name)

            cong_rate = 0.0
            dom_cong = "Moderate"
            if "congestion_level" in grp.columns:
                cong_count = grp["congestion_level"].isin(["High", "Severe"]).sum()
                cong_rate = round((cong_count / len(grp)) * 100, 1)
                dom_cong = str(grp["congestion_level"].mode().iloc[0]) if not grp["congestion_level"].mode().empty else "Moderate"

            # Risk score composite: 60% severe rate + 40% speed deficit
            speed_deficit = max(0, 50.0 - spd)
            risk = round((cong_rate * 0.6) + (speed_deficit * 0.8), 1)

            priority_corridors.append(PrioritySegmentItem(
                segment_id=seg_id,
                segment_name=str(name),
                latitude=lat,
                longitude=lon,
                avg_speed=spd,
                avg_volume=vol,
                congestion_rate=cong_rate,
                dominant_congestion=dom_cong,
                risk_score=risk
            ))

        priority_corridors = sorted(priority_corridors, key=lambda x: x.risk_score, reverse=True)[:8]

    return OverviewMetrics(
        total_observations=total_obs,
        unique_segments=unique_segs,
        date_start=date_start,
        date_end=date_end,
        completeness_pct=completeness,
        avg_speed_kmh=avg_speed,
        avg_vehicle_volume=avg_volume,
        congestion_breakdown=congestion_breakdown,
        hourly_trend=hourly_trend,
        weekday_vs_weekend=day_comparison,
        top_priority_corridors=priority_corridors
    )

def compute_heatmap(df: pd.DataFrame, metric: str = "avg_speed_kmh") -> HeatmapResponse:
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    day_abbrev = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    cells = []

    # Ensure hour & day_of_week
    work_df = df.copy()
    if "hour" not in work_df.columns and "timestamp" in work_df.columns:
        ts = pd.to_datetime(work_df["timestamp"], errors="coerce")
        work_df["hour"] = ts.dt.hour
        work_df["day_of_week"] = ts.dt.day_name()

    if "hour" in work_df.columns and "day_of_week" in work_df.columns:
        grouped = work_df.groupby(["day_of_week", "hour"]).agg({
            "avg_speed_kmh": "mean" if "avg_speed_kmh" in work_df.columns else "count",
            "vehicle_count": "mean" if "vehicle_count" in work_df.columns else "count"
        }).reset_index()

        grouped_dict = {}
        for _, row in grouped.iterrows():
            d_name = str(row["day_of_week"]).capitalize()
            h = int(row["hour"])
            spd = float(round(row["avg_speed_kmh"], 1)) if "avg_speed_kmh" in work_df.columns else 35.0
            vol = float(round(row["vehicle_count"], 0)) if "vehicle_count" in work_df.columns else 2500.0
            cong = float(round(max(0, 60.0 - spd), 1))
            grouped_dict[(d_name, h)] = (spd, vol, cong)

        for d_idx, d_full in enumerate(days):
            for h in range(24):
                if (d_full, h) in grouped_dict:
                    spd, vol, cong = grouped_dict[(d_full, h)]
                else:
                    # Interpolate from adjacent hour if data exists in 2-hour increments
                    prev_h = (h - 1) % 24
                    next_h = (h + 1) % 24
                    if (d_full, prev_h) in grouped_dict:
                        spd, vol, cong = grouped_dict[(d_full, prev_h)]
                    elif (d_full, next_h) in grouped_dict:
                        spd, vol, cong = grouped_dict[(d_full, next_h)]
                    else:
                        spd, vol, cong = 38.0, 2200.0, 22.0

                cells.append(HeatmapCell(
                    day=day_abbrev[d_idx],
                    day_idx=d_idx,
                    hour=h,
                    avg_speed=spd,
                    avg_volume=vol,
                    congestion_score=cong
                ))

    return HeatmapResponse(metric=metric, cells=cells)

def get_corridors_geo(df: pd.DataFrame) -> List[CorridorGeoItem]:
    items = []
    if "latitude" not in df.columns or "longitude" not in df.columns:
        return items

    seg_col = "segment_name" if "segment_name" in df.columns else ("segment_id" if "segment_id" in df.columns else None)
    if not seg_col:
        return items

    groups = df.groupby(seg_col)
    for name, grp in groups:
        lat = grp["latitude"].dropna()
        lon = grp["longitude"].dropna()
        if lat.empty or lon.empty:
            continue

        seg_id = str(grp["segment_id"].iloc[0]) if "segment_id" in grp.columns else str(name)
        road_type = str(grp["road_type"].iloc[0]) if "road_type" in grp.columns else "Arterial"
        spd = float(round(grp["avg_speed_kmh"].mean(), 1)) if "avg_speed_kmh" in grp.columns else 0.0
        vol = float(round(grp["vehicle_count"].mean(), 0)) if "vehicle_count" in grp.columns else 0.0
        dom_cong = "Moderate"
        if "congestion_level" in grp.columns and not grp["congestion_level"].dropna().empty:
            dom_cong = str(grp["congestion_level"].mode().iloc[0])

        items.append(CorridorGeoItem(
            segment_id=seg_id,
            segment_name=str(name),
            latitude=float(lat.iloc[0]),
            longitude=float(lon.iloc[0]),
            road_type=road_type,
            avg_speed=spd,
            avg_volume=vol,
            dominant_congestion=dom_cong,
            observation_count=len(grp)
        ))

    return items
