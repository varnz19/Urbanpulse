from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.ml_schemas import (
    ClusterRequest, ClusterResponse,
    ClassifyRequest, ClassifyResponse,
    AssociationRequest, AssociationResponse,
    AnomalyRequest, AnomalyResponse
)
from app.services import dataset_service
from app.algorithms.clustering import run_kmeans_clustering
from app.algorithms.classification import run_classification
from app.algorithms.association import run_association_mining
from app.algorithms.anomaly import run_anomaly_detection

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.post("/{dataset_id}/clustering", response_model=ClusterResponse)
def execute_clustering(dataset_id: str, req: ClusterRequest, db: Session = Depends(get_db)):
    try:
        df = dataset_service.get_dataset_df(db, dataset_id)
        return run_kmeans_clustering(df, req.features, req.k, req.scale_features)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clustering execution failed: {str(e)}")

@router.post("/{dataset_id}/classify", response_model=ClassifyResponse)
def execute_classification(dataset_id: str, req: ClassifyRequest, db: Session = Depends(get_db)):
    try:
        df = dataset_service.get_dataset_df(db, dataset_id)
        return run_classification(df, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification execution failed: {str(e)}")

@router.post("/{dataset_id}/association", response_model=AssociationResponse)
def execute_association(dataset_id: str, req: AssociationRequest, db: Session = Depends(get_db)):
    try:
        df = dataset_service.get_dataset_df(db, dataset_id)
        return run_association_mining(df, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Association mining failed: {str(e)}")

@router.post("/{dataset_id}/anomalies", response_model=AnomalyResponse)
def execute_anomalies(dataset_id: str, req: AnomalyRequest, db: Session = Depends(get_db)):
    try:
        df = dataset_service.get_dataset_df(db, dataset_id)
        return run_anomaly_detection(df, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")
