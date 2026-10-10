import pandas as pd
import numpy as np
from typing import List, Dict, Any

def inspect_dataframe(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Generate comprehensive column metadata, data types, missing statistics, and summary metrics.
    """
    columns_meta = []
    total_rows = len(df)

    for col in df.columns:
        series = df[col]
        missing_count = int(series.isna().sum())
        missing_pct = round((missing_count / total_rows * 100), 2) if total_rows > 0 else 0.0
        unique_count = int(series.nunique(dropna=True))

        # Check inferred type
        is_num = pd.api.types.is_numeric_dtype(series)
        is_dt = pd.api.types.is_datetime64_any_dtype(series) or (
            series.dtype == 'object' and ('time' in col.lower() or 'date' in col.lower())
        )

        inferred_type = "numeric" if is_num else ("datetime" if is_dt else "categorical")
        if not is_num and not is_dt and unique_count > total_rows * 0.9 and total_rows > 50:
            inferred_type = "text"

        sample_vals = series.dropna().head(5).tolist()

        min_val, max_val, mean_val, std_val = None, None, None, None
        if is_num:
            clean_num = pd.to_numeric(series.dropna(), errors='coerce').dropna()
            if len(clean_num) > 0:
                min_val = float(clean_num.min())
                max_val = float(clean_num.max())
                mean_val = round(float(clean_num.mean()), 2)
                std_val = round(float(clean_num.std()), 2) if len(clean_num) > 1 else 0.0

        columns_meta.append({
            "name": col,
            "inferred_type": inferred_type,
            "missing_count": missing_count,
            "missing_pct": missing_pct,
            "unique_count": unique_count,
            "sample_values": sample_vals,
            "min_val": min_val,
            "max_val": max_val,
            "mean_val": mean_val,
            "std_val": std_val
        })

    return columns_meta
