import uuid
import json
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.db_models import ExperimentModel
from app.schemas.experiment_schemas import ExperimentCreate, ExperimentResponse

def record_experiment(db: Session, exp: ExperimentCreate) -> ExperimentResponse:
    exp_id = f"exp-{uuid.uuid4().hex[:8]}"
    model = ExperimentModel(
        id=exp_id,
        dataset_id=exp.dataset_id,
        name=exp.name,
        task_type=exp.task_type,
        parameters_json=json.dumps(exp.parameters),
        metrics_json=json.dumps(exp.metrics),
        results_summary=exp.results_summary or "",
        created_at=datetime.utcnow()
    )
    db.add(model)
    db.commit()
    db.refresh(model)

    return ExperimentResponse(
        id=model.id,
        dataset_id=model.dataset_id,
        name=model.name,
        task_type=model.task_type,
        parameters=model.parameters,
        metrics=model.metrics,
        results_summary=model.results_summary,
        created_at=model.created_at
    )

def list_experiments(db: Session, dataset_id: Optional[str] = None) -> List[ExperimentResponse]:
    query = db.query(ExperimentModel)
    if dataset_id:
        query = query.filter(ExperimentModel.dataset_id == dataset_id)
    models = query.order_by(ExperimentModel.created_at.desc()).all()

    return [
        ExperimentResponse(
            id=m.id,
            dataset_id=m.dataset_id,
            name=m.name,
            task_type=m.task_type,
            parameters=m.parameters,
            metrics=m.metrics,
            results_summary=m.results_summary,
            created_at=m.created_at
        )
        for m in models
    ]
