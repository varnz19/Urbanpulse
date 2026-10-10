from typing import Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

class ExperimentCreate(BaseModel):
    dataset_id: str
    name: str
    task_type: str  # clustering, classification, association, anomaly
    parameters: Dict[str, Any]
    metrics: Dict[str, Any]
    results_summary: Optional[str] = ""

class ExperimentResponse(BaseModel):
    id: str
    dataset_id: str
    name: str
    task_type: str
    parameters: Dict[str, Any]
    metrics: Dict[str, Any]
    results_summary: str
    created_at: datetime
