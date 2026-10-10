from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.analytics_schemas import OverviewMetrics, HeatmapResponse, CorridorGeoItem
from app.services import dataset_service, analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/{dataset_id}/overview", response_model=OverviewMetrics)
def get_dataset_overview(dataset_id: str, db: Session = Depends(get_db)):
    try:
        df = dataset_service.get_dataset_df(db, dataset_id)
        return analytics_service.compute_overview_metrics(df)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{dataset_id}/heatmap", response_model=HeatmapResponse)
def get_dataset_heatmap(
    dataset_id: str,
    metric: str = Query("avg_speed_kmh", pattern="^(avg_speed_kmh|vehicle_count)$"),
    db: Session = Depends(get_db)
):
    try:
        df = dataset_service.get_dataset_df(db, dataset_id)
        return analytics_service.compute_heatmap(df, metric)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{dataset_id}/corridors", response_model=List[CorridorGeoItem])
def get_dataset_corridors_geo(dataset_id: str, db: Session = Depends(get_db)):
    try:
        df = dataset_service.get_dataset_df(db, dataset_id)
        return analytics_service.get_corridors_geo(df)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
