from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services import dataset_service, analytics_service

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/{dataset_id}/summary")
def get_analytical_report(dataset_id: str, db: Session = Depends(get_db)):
    try:
        ds = dataset_service.get_dataset_by_id(db, dataset_id)
        if not ds:
            raise HTTPException(status_code=404, detail="Dataset not found")

        df = dataset_service.get_dataset_df(db, dataset_id)
        overview = analytics_service.compute_overview_metrics(df)

        report = {
            "title": f"Urban Mobility Intelligence Report — {ds.name}",
            "generated_at": ds.created_at.isoformat() if ds.created_at else "",
            "dataset_meta": {
                "dataset_id": ds.id,
                "name": ds.name,
                "format": ds.file_format,
                "total_records": overview.total_observations,
                "unique_corridors": overview.unique_segments,
                "date_coverage": f"{overview.date_start or 'N/A'} to {overview.date_end or 'N/A'}",
                "data_completeness": f"{overview.completeness_pct}%"
            },
            "network_performance": {
                "average_speed_kmh": overview.avg_speed_kmh,
                "average_volume_veh_hr": overview.avg_vehicle_volume,
                "congestion_distribution": overview.congestion_breakdown
            },
            "temporal_dynamics": {
                "weekday_vs_weekend": [d.dict() for d in overview.weekday_vs_weekend],
                "hourly_trend": [h.dict() for h in overview.hourly_trend]
            },
            "priority_corridors": [p.dict() for p in overview.top_priority_corridors],
            "provenance": ds.provenance
        }
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{dataset_id}/export-markdown", response_class=PlainTextResponse)
def export_markdown_report(dataset_id: str, db: Session = Depends(get_db)):
    try:
        ds = dataset_service.get_dataset_by_id(db, dataset_id)
        if not ds:
            raise HTTPException(status_code=404, detail="Dataset not found")

        df = dataset_service.get_dataset_df(db, dataset_id)
        overview = analytics_service.compute_overview_metrics(df)

        lines = [
            f"# UrbanPulse — Urban Mobility Intelligence Report",
            f"**Dataset:** {ds.name}  ",
            f"**File Format:** {ds.file_format.upper()} | **Observations:** {overview.total_observations} | **Corridors:** {overview.unique_segments}  ",
            f"**Observation Period:** {overview.date_start or 'N/A'} — {overview.date_end or 'N/A'}  ",
            f"**Data Completeness:** {overview.completeness_pct}%  \n",
            f"## 1. Executive Network Performance",
            f"- **System Average Speed:** {overview.avg_speed_kmh or 'N/A'} km/h",
            f"- **System Average Volume:** {overview.avg_vehicle_volume or 'N/A'} vehicles/hour",
            f"- **Congestion Breakdown:** {', '.join(f'{k}: {v}' for k, v in overview.congestion_breakdown.items())}\n",
            f"## 2. Priority Bottleneck Corridors",
            "| Corridor Name | Avg Speed (km/h) | Avg Volume | Severe Congestion % | Risk Score |",
            "|---|---|---|---|---|"
        ]

        for p in overview.top_priority_corridors:
            lines.append(f"| {p.segment_name} | {p.avg_speed} | {int(p.avg_volume)} | {p.congestion_rate}% | {p.risk_score} |")

        lines.extend([
            f"\n## 3. Temporal Dynamics & Commute Peaks",
        ])
        for d in overview.weekday_vs_weekend:
            lines.append(f"- **{d.day_type}:** Mean Speed = {d.avg_speed} km/h, Volume = {int(d.avg_volume)}, Severe Rate = {d.severe_congestion_pct}%")

        lines.extend([
            f"\n## 4. Provenance & Methodological Notes",
            f"- **Source:** {ds.provenance.get('source', 'UrbanPulse Analytics Corpus')}",
            f"- **Coverage:** {ds.provenance.get('coverage', 'Urban Arterial Corridors')}",
            f"- **Notes:** {ds.provenance.get('notes', 'Calculated from historical sensor observations.')}",
            f"\n*Report compiled deterministically by UrbanPulse Analytics Engine.*"
        ])

        return "\n".join(lines)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
