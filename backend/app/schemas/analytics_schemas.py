from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class HourlyTrendItem(BaseModel):
    hour: int
    avg_speed: float
    avg_volume: float
    congestion_index: float

class DayComparisonItem(BaseModel):
    day_type: str  # "Weekday" vs "Weekend"
    avg_speed: float
    avg_volume: float
    severe_congestion_pct: float

class PrioritySegmentItem(BaseModel):
    segment_id: str
    segment_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    avg_speed: float
    avg_volume: float
    congestion_rate: float
    dominant_congestion: str
    risk_score: float

class OverviewMetrics(BaseModel):
    total_observations: int
    unique_segments: int
    date_start: Optional[str] = None
    date_end: Optional[str] = None
    completeness_pct: float
    avg_speed_kmh: Optional[float] = None
    avg_vehicle_volume: Optional[float] = None
    congestion_breakdown: Dict[str, int]
    hourly_trend: List[HourlyTrendItem]
    weekday_vs_weekend: List[DayComparisonItem]
    top_priority_corridors: List[PrioritySegmentItem]

class HeatmapCell(BaseModel):
    day: str  # "Mon", "Tue", ...
    day_idx: int  # 0..6
    hour: int  # 0..23
    avg_speed: float
    avg_volume: float
    congestion_score: float

class HeatmapResponse(BaseModel):
    metric: str
    cells: List[HeatmapCell]

class CorridorGeoItem(BaseModel):
    segment_id: str
    segment_name: str
    latitude: float
    longitude: float
    road_type: Optional[str] = None
    avg_speed: float
    avg_volume: float
    dominant_congestion: str
    observation_count: int
