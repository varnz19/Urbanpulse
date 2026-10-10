from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.schemas.experiment_schemas import ExperimentCreate, ExperimentResponse
from app.services import experiment_service

router = APIRouter(prefix="/experiments", tags=["Experiments"])

@router.get("", response_model=List[ExperimentResponse])
def get_experiments(dataset_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    return experiment_service.list_experiments(db, dataset_id)

@router.post("", response_model=ExperimentResponse)
def create_experiment(exp: ExperimentCreate, db: Session = Depends(get_db)):
    return experiment_service.record_experiment(db, exp)
