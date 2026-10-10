from typing import List, Optional, Any, Dict
from pydantic import BaseModel
from datetime import datetime

class ColumnMeta(BaseModel):
    name: str
    inferred_type: str  # numeric, categorical, datetime, text
    missing_count: int
    missing_pct: float
    unique_count: int
    sample_values: List[Any]
    min_val: Optional[float] = None
    max_val: Optional[float] = None
    mean_val: Optional[float] = None
    std_val: Optional[float] = None

class DatasetResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    filename: str
    file_format: str
    row_count: int
    column_count: int
    columns: List[ColumnMeta]
    is_demo: bool
    created_at: datetime
    provenance: Optional[Dict[str, Any]] = None

class DatasetPreviewResponse(BaseModel):
    id: str
    name: str
    total_rows: int
    total_columns: int
    columns: List[str]
    rows: List[Dict[str, Any]]
    page: int
    page_size: int

class PreprocessRequest(BaseModel):
    imputation_strategy: str = "mean"  # "mean", "median", "mode", "drop"
    drop_duplicates: bool = True
    scaling_method: Optional[str] = "none"  # "none", "standard", "minmax", "robust"
    target_columns: Optional[List[str]] = None
    categorical_encoding: Optional[str] = "onehot"  # "onehot", "label", "none"
    outlier_handling: Optional[str] = "none"  # "none", "clip_iqr", "drop_zscore"
    feature_selection: Optional[List[str]] = None

class PreprocessResponse(BaseModel):
    original_rows: int
    processed_rows: int
    original_cols: int
    processed_cols: int
    transformations_applied: List[str]
    sample_preview: List[Dict[str, Any]]
    columns: List[str]
