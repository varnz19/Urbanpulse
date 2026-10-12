import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from app.schemas.analytics_schemas import (
    OverviewMetrics, HourlyTrendItem, DayComparisonItem,
    PrioritySegmentItem, HeatmapResponse, HeatmapCell, CorridorGeoItem
)

def _find_column(df: pd.DataFrame, candidates: List[str]) -> Optional[str]:
    cols_lower = {str(c).lower(): c for c in df.columns}
    for cand in candidates:
        if cand.lower() in cols_lower:
            return cols_lower[cand.lower()]
    return None

def compute_overview_metrics(df: pd.DataFrame) -> OverviewMetrics:
    total_obs = len(df)
    unique_segs = int(df["segment_id"].nunique()) if "segment_id" in df.columns else (
        int(df["segment_name"].nunique()) if "segment_name" in df.columns else 1
    )

    # Date coverage and temporal derivations
    date_start, date_end = None, None
    work_df = df.copy()

    ts_col = _find_column(work_df, ["timestamp", "datetime", "date_time", "date"])
    if ts_col:
        valid_ts = pd.to_datetime(work_df[ts_col], errors="coerce")
        non_null_ts = valid_ts.dropna()
        if not non_null_ts.empty:
            date_start = non_null_ts.min().strftime("%Y-%m-%d %H:%M")
            date_end = non_null_ts.max().strftime("%Y-%m-%d %H:%M")
        if "hour" not in work_df.columns:
            work_df["hour"] = valid_ts.dt.hour
        if "day_of_week" not in work_df.columns:
            work_df["day_of_week"] = valid_ts.dt.day_name()

    # Completeness %
    total_cells = df.size
    missing_cells = df.isna().sum().sum()
    completeness = round(((total_cells - missing_cells) / max(1, total_cells)) * 100, 1)

    # Speed & Volume column detection
    speed_col = _find_column(work_df, ["avg_speed_kmh", "speed", "velocity", "avg_speed", "spd"])
    vol_col = _find_column(work_df, ["vehicle_count", "volume", "traffic_volume", "count", "value", "total_volume"])

    avg_speed = float(round(work_df[speed_col].mean(), 1)) if speed_col and pd.api.types.is_numeric_dtype(work_df[speed_col]) else None
    avg_volume = float(round(work_df[vol_col].mean(), 0)) if vol_col and pd.api.types.is_numeric_dtype(work_df[vol_col]) else None

    # Congestion breakdown
    congestion_breakdown = {}
    cong_col = _find_column(work_df, ["congestion_level", "congestion", "traffic_state", "status"])
    if cong_col:
        counts = work_df[cong_col].value_counts().to_dict()
        for k, v in counts.items():
            congestion_breakdown[str(k)] = int(v)
    elif speed_col and pd.api.types.is_numeric_dtype(work_df[speed_col]):
        def speed_to_cong(s):
            if pd.isna(s): return "Unknown"
            if s < 18: return "Severe"
            if s < 28: return "High"
            if s < 40: return "Moderate"
            return "Low"
        counts = work_df[speed_col].apply(speed_to_cong).value_counts().to_dict()
        for k, v in counts.items():
            congestion_breakdown[str(k)] = int(v)
    elif vol_col and pd.api.types.is_numeric_dtype(work_df[vol_col]):
        # Partition volume into quantiles if no speed exists
        s = work_df[vol_col].dropna()
        if not s.empty:
            q25, q50, q75 = s.quantile(0.25), s.quantile(0.50), s.quantile(0.75)
            def vol_to_cong(v):
                if pd.isna(v): return "Unknown"
                if v >= q75: return "Severe"
                if v >= q50: return "High"
                if v >= q25: return "Moderate"
                return "Low"
            counts = s.apply(vol_to_cong).value_counts().to_dict()
            for k, v in counts.items():
                congestion_breakdown[str(k)] = int(v)

    # Hourly trend
    hourly_trend = []
    if "hour" in work_df.columns:
        valid_hour_df = work_df.dropna(subset=["hour"])
        if not valid_hour_df.empty:
            agg_spec = {}
            if speed_col and pd.api.types.is_numeric_dtype(valid_hour_df[speed_col]):
                agg_spec[speed_col] = "mean"
            if vol_col and pd.api.types.is_numeric_dtype(valid_hour_df[vol_col]):
                agg_spec[vol_col] = "mean"

            if agg_spec:
                grouped = valid_hour_df.groupby("hour").agg(agg_spec).reset_index()
            else:
                grouped = valid_hour_df.groupby("hour").size().reset_index(name="_count_")

            for _, row in grouped.iterrows():
                try:
                    h = int(row["hour"])
                except Exception:
                    continue
                spd = float(round(row[speed_col], 1)) if speed_col and speed_col in row and pd.notna(row[speed_col]) else 35.0
                vol = float(round(row[vol_col], 0)) if vol_col and vol_col in row and pd.notna(row[vol_col]) else 0.0
                cong_idx = float(round(max(0, 60.0 - spd), 1))
                hourly_trend.append(HourlyTrendItem(
                    hour=h,
                    avg_speed=spd,
                    avg_volume=vol,
                    congestion_index=cong_idx
                ))
            hourly_trend.sort(key=lambda x: x.hour)

    # Weekday vs Weekend
    day_comparison = []
    if "is_weekend" not in work_df.columns and "day_of_week" in work_df.columns:
        work_df["is_weekend"] = work_df["day_of_week"].apply(lambda d: 1 if str(d).lower() in ("saturday", "sunday") else 0)

    if "is_weekend" in work_df.columns:
        for w_val, label in [(0, "Weekday"), (1, "Weekend")]:
            sub = work_df[work_df["is_weekend"] == w_val]
            if not sub.empty:
                spd = float(round(sub[speed_col].mean(), 1)) if speed_col and speed_col in sub.columns and pd.api.types.is_numeric_dtype(sub[speed_col]) else 35.0
                vol = float(round(sub[vol_col].mean(), 0)) if vol_col and vol_col in sub.columns and pd.api.types.is_numeric_dtype(sub[vol_col]) else 0.0
                sev_pct = 0.0
                if cong_col and cong_col in sub.columns:
                    sev_count = (sub[cong_col].isin(["High", "Severe"])).sum()
                    sev_pct = round((sev_count / len(sub)) * 100, 1)
                day_comparison.append(DayComparisonItem(
                    day_type=label,
                    avg_speed=spd,
                    avg_volume=vol,
                    severe_congestion_pct=sev_pct
                ))

    # Top priority corridors
    priority_corridors = []
    seg_col = _find_column(work_df, ["segment_name", "segment_id", "street", "corridor", "roadway"])
    if seg_col:
        seg_groups = work_df.groupby(seg_col)
        for name, grp in seg_groups:
            spd = float(round(grp[speed_col].mean(), 1)) if speed_col and speed_col in grp.columns and pd.api.types.is_numeric_dtype(grp[speed_col]) else 35.0
            vol = float(round(grp[vol_col].mean(), 0)) if vol_col and vol_col in grp.columns and pd.api.types.is_numeric_dtype(grp[vol_col]) else 0.0
            lat = float(grp["latitude"].iloc[0]) if "latitude" in grp.columns and pd.notna(grp["latitude"].iloc[0]) else None
            lon = float(grp["longitude"].iloc[0]) if "longitude" in grp.columns and pd.notna(grp["longitude"].iloc[0]) else None
            seg_id = str(grp["segment_id"].iloc[0]) if "segment_id" in grp.columns else str(name)

            cong_rate = 0.0
            dom_cong = "Moderate"
            if cong_col and cong_col in grp.columns:
                cong_count = grp[cong_col].isin(["High", "Severe"]).sum()
                cong_rate = round((cong_count / len(grp)) * 100, 1)
                dom_cong = str(grp[cong_col].mode().iloc[0]) if not grp[cong_col].mode().empty else "Moderate"

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

    work_df = df.copy()
    ts_col = _find_column(work_df, ["timestamp", "datetime", "date_time", "date"])
    if "hour" not in work_df.columns and ts_col:
        ts = pd.to_datetime(work_df[ts_col], errors="coerce")
        work_df["hour"] = ts.dt.hour
        work_df["day_of_week"] = ts.dt.day_name()

    speed_col = _find_column(work_df, ["avg_speed_kmh", "speed", "velocity", "avg_speed", "spd"])
    vol_col = _find_column(work_df, ["vehicle_count", "volume", "traffic_volume", "count", "value", "total_volume"])

    if "hour" in work_df.columns and "day_of_week" in work_df.columns:
        valid_df = work_df.dropna(subset=["hour", "day_of_week"]).copy()
        agg_spec = {}
        if speed_col and pd.api.types.is_numeric_dtype(valid_df[speed_col]):
            agg_spec[speed_col] = "mean"
        if vol_col and pd.api.types.is_numeric_dtype(valid_df[vol_col]):
            agg_spec[vol_col] = "mean"

        if agg_spec:
            grouped = valid_df.groupby(["day_of_week", "hour"]).agg(agg_spec).reset_index()
        else:
            grouped = valid_df.groupby(["day_of_week", "hour"]).size().reset_index(name="_count_")

        grouped_dict = {}
        for _, row in grouped.iterrows():
            d_name = str(row["day_of_week"]).capitalize()
            try:
                h = int(row["hour"])
            except Exception:
                continue
            spd = float(round(row[speed_col], 1)) if speed_col and speed_col in row and pd.notna(row[speed_col]) else 35.0
            vol = float(round(row[vol_col], 0)) if vol_col and vol_col in row and pd.notna(row[vol_col]) else 2500.0
            cong = float(round(max(0, 60.0 - spd), 1))
            grouped_dict[(d_name, h)] = (spd, vol, cong)

        for d_idx, d_full in enumerate(days):
            for h in range(24):
                if (d_full, h) in grouped_dict:
                    spd, vol, cong = grouped_dict[(d_full, h)]
                else:
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
