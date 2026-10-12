from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.db_models import DatasetModel
from app.schemas.dataset_schemas import DatasetResponse, DatasetPreviewResponse, PreprocessRequest, PreprocessResponse
from app.services import dataset_service
from app.data_processing.preprocessor import preprocess_data

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.get("", response_model=List[DatasetResponse])
def get_datasets(db: Session = Depends(get_db)):
    models = dataset_service.get_all_datasets(db)
    return [
        DatasetResponse(
            id=m.id,
            name=m.name,
            description=m.description,
            filename=m.filename,
            file_format=m.file_format,
            row_count=m.row_count,
            column_count=m.column_count,
            columns=m.columns_meta,
            is_demo=m.is_demo,
            created_at=m.created_at,
            provenance=m.provenance
        )
        for m in models
    ]

@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(dataset_id: str, db: Session = Depends(get_db)):
    m = dataset_service.get_dataset_by_id(db, dataset_id)
    if not m:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return DatasetResponse(
        id=m.id,
        name=m.name,
        description=m.description,
        filename=m.filename,
        file_format=m.file_format,
        row_count=m.row_count,
        column_count=m.column_count,
        columns=m.columns_meta,
        is_demo=m.is_demo,
        created_at=m.created_at,
        provenance=m.provenance
    )

@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not (file.filename.lower().endswith('.csv') or file.filename.lower().endswith('.arff')):
        raise HTTPException(status_code=400, detail="Only .csv and .arff files are supported.")

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds maximum size of 50MB.")

    try:
        model = dataset_service.save_uploaded_file(db, file.filename, content)
        return DatasetResponse(
            id=model.id,
            name=model.name,
            description=model.description,
            filename=model.filename,
            file_format=model.file_format,
            row_count=model.row_count,
            column_count=model.column_count,
            columns=model.columns_meta,
            is_demo=model.is_demo,
            created_at=model.created_at,
            provenance=model.provenance
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse dataset: {str(e)}")

@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: str, db: Session = Depends(get_db)):
    success = dataset_service.delete_dataset(db, dataset_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot delete this dataset (may be a built-in benchmark dataset or not found).")
    return {"status": "success", "message": f"Dataset {dataset_id} deleted."}

@router.get("/{dataset_id}/preview", response_model=DatasetPreviewResponse)
def get_dataset_preview(
    dataset_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=5, le=100),
    db: Session = Depends(get_db)
):
    try:
        return dataset_service.preview_dataset(db, dataset_id, page, page_size)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{dataset_id}/preprocess", response_model=PreprocessResponse)
def preprocess_dataset_endpoint(
    dataset_id: str,
    req: PreprocessRequest,
    db: Session = Depends(get_db)
):
    try:
        df = dataset_service.get_dataset_df(db, dataset_id)
        orig_rows, orig_cols = len(df), len(df.columns)
        processed_df, trans = preprocess_data(df, req)
        sample = processed_df.head(10).replace({float('nan'): None}).to_dict(orient="records")

        return PreprocessResponse(
            original_rows=orig_rows,
            processed_rows=len(processed_df),
            original_cols=orig_cols,
            processed_cols=len(processed_df.columns),
            transformations_applied=trans,
            sample_preview=sample,
            columns=processed_df.columns.tolist()
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing error: {str(e)}")
