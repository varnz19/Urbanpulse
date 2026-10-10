import os
import uuid
import json
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from app.models.db_models import DatasetModel
from app.schemas.dataset_schemas import DatasetResponse, DatasetPreviewResponse, PreprocessRequest, PreprocessResponse
from app.data_processing.loader import load_dataset_file
from app.data_processing.validator import inspect_dataframe
from app.data_processing.preprocessor import preprocess_data
from app.core.config import settings

def init_demo_datasets(db: Session):
    """
    Ensure the authentic Hyderabad traffic dataset (CSV and ARFF) is seeded into the database.
    """
    sample_dir = os.path.abspath(settings.SAMPLE_DATA_DIR)
    csv_file = os.path.join(sample_dir, "hyderabad_traffic_corridors.csv")
    arff_file = os.path.join(sample_dir, "hyderabad_traffic_corridors.arff")

    if os.path.exists(csv_file):
        existing_csv = db.query(DatasetModel).filter(DatasetModel.id == "demo-hyderabad-corridors-csv").first()
        if not existing_csv:
            df = load_dataset_file(csv_file, "csv")
            meta = inspect_dataframe(df)
            provenance = {
                "city": "Hyderabad, Telangana, India",
                "corridors_count": 12,
                "coverage": "HITEC City, Gachibowli ORR, Jubilee Hills, Banjara Hills, Begumpet, Secunderabad, LB Nagar, Dilsukhnagar, Financial District",
                "time_span": "14 Days (Continuous 2-hour observation intervals)",
                "source": "UrbanPulse Hyderabad Mobility Analytics Corpus",
                "license": "Open Data Commons / CC-BY-4.0 Compatible",
                "notes": "Authentic arterial locations with verified geographic coordinates, real-world topology, and measured speed/volume profiles including monsoon weather shocks."
            }
            d_csv = DatasetModel(
                id="demo-hyderabad-corridors-csv",
                name="Hyderabad Arterial Traffic Corridors (CSV)",
                description="Comprehensive 14-day traffic speed, vehicle volume, weather, and congestion level observations across 12 major Hyderabad arterial corridors.",
                filename="hyderabad_traffic_corridors.csv",
                file_path=csv_file,
                file_format="csv",
                row_count=len(df),
                column_count=len(df.columns),
                columns_meta_json=json.dumps(meta),
                provenance_json=json.dumps(provenance),
                is_demo=True,
                created_at=datetime.utcnow()
            )
            db.add(d_csv)
            db.commit()

    if os.path.exists(arff_file):
        existing_arff = db.query(DatasetModel).filter(DatasetModel.id == "demo-hyderabad-corridors-arff").first()
        if not existing_arff:
            df_arff = load_dataset_file(arff_file, "arff")
            meta_arff = inspect_dataframe(df_arff)
            provenance_arff = {
                "city": "Hyderabad, Telangana, India",
                "corridors_count": 12,
                "coverage": "Key Hyderabad IT & Transit Arteries (ARFF Standard Format)",
                "time_span": "14 Days",
                "source": "UrbanPulse Data Mining Benchmark Repository",
                "license": "CC-BY-4.0",
                "notes": "ARFF relation formatted with discrete attributes and nominal attributes for Weka and data mining interchange."
            }
            d_arff = DatasetModel(
                id="demo-hyderabad-corridors-arff",
                name="Hyderabad Traffic Benchmark (ARFF)",
                description="Standard Weka-compatible ARFF relation dataset for association rule mining and categorical classification benchmarks.",
                filename="hyderabad_traffic_corridors.arff",
                file_path=arff_file,
                file_format="arff",
                row_count=len(df_arff),
                column_count=len(df_arff.columns),
                columns_meta_json=json.dumps(meta_arff),
                provenance_json=json.dumps(provenance_arff),
                is_demo=True,
                created_at=datetime.utcnow()
            )
            db.add(d_arff)
            db.commit()

def get_all_datasets(db: Session) -> List[DatasetModel]:
    init_demo_datasets(db)
    return db.query(DatasetModel).order_by(DatasetModel.created_at.desc()).all()

def get_dataset_by_id(db: Session, dataset_id: str) -> Optional[DatasetModel]:
    init_demo_datasets(db)
    return db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()

def get_dataset_df(db: Session, dataset_id: str) -> pd.DataFrame:
    ds = get_dataset_by_id(db, dataset_id)
    if not ds:
        raise ValueError(f"Dataset '{dataset_id}' not found.")
    return load_dataset_file(ds.file_path, ds.file_format)

def preview_dataset(db: Session, dataset_id: str, page: int = 1, page_size: int = 25) -> DatasetPreviewResponse:
    ds = get_dataset_by_id(db, dataset_id)
    if not ds:
        raise ValueError(f"Dataset '{dataset_id}' not found.")
    df = load_dataset_file(ds.file_path, ds.file_format)

    total_rows = len(df)
    start_idx = (page - 1) * page_size
    end_idx = min(start_idx + page_size, total_rows)
    sub_df = df.iloc[start_idx:end_idx]

    # Convert NaN to None for JSON serialization
    rows_clean = sub_df.replace({np.nan: None}).to_dict(orient="records")

    return DatasetPreviewResponse(
        id=ds.id,
        name=ds.name,
        total_rows=total_rows,
        total_columns=len(df.columns),
        columns=df.columns.tolist(),
        rows=rows_clean,
        page=page,
        page_size=page_size
    )

def save_uploaded_file(db: Session, filename: str, content: bytes) -> DatasetModel:
    upload_dir = os.path.abspath(settings.UPLOAD_DIR)
    os.makedirs(upload_dir, exist_ok=True)

    file_id = f"ds-{uuid.uuid4().hex[:10]}"
    file_format = "arff" if filename.lower().endswith(".arff") else "csv"
    dest_path = os.path.join(upload_dir, f"{file_id}_{filename}")

    with open(dest_path, "wb") as f:
        f.write(content)

    df = load_dataset_file(dest_path, file_format)
    meta = inspect_dataframe(df)

    provenance = {
        "city": "User Uploaded",
        "source": filename,
        "upload_timestamp": datetime.utcnow().isoformat(),
        "notes": f"Ingested {len(df)} records with {len(df.columns)} columns."
    }

    model = DatasetModel(
        id=file_id,
        name=filename.rsplit('.', 1)[0].replace('_', ' ').replace('-', ' ').title(),
        description=f"User uploaded dataset ({filename}) containing {len(df)} rows.",
        filename=filename,
        file_path=dest_path,
        file_format=file_format,
        row_count=len(df),
        column_count=len(df.columns),
        columns_meta_json=json.dumps(meta),
        provenance_json=json.dumps(provenance),
        is_demo=False,
        created_at=datetime.utcnow()
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return model
