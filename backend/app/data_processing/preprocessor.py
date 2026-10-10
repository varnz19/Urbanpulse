import pandas as pd
import numpy as np
from typing import Tuple, List, Optional
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, LabelEncoder
from app.schemas.dataset_schemas import PreprocessRequest

def preprocess_data(df: pd.DataFrame, req: PreprocessRequest) -> Tuple[pd.DataFrame, List[str]]:
    """
    Apply a deterministic, leak-free preprocessing pipeline to a DataFrame.
    """
    processed = df.copy()
    transformations = []

    # 1. Duplicate Handling
    if req.drop_duplicates:
        initial_count = len(processed)
        processed = processed.drop_duplicates().reset_index(drop=True)
        dropped_dups = initial_count - len(processed)
        if dropped_dups > 0:
            transformations.append(f"Removed {dropped_dups} duplicate records")

    # 2. Feature Selection (filter columns early if specified)
    if req.feature_selection and len(req.feature_selection) > 0:
        valid_cols = [c for c in req.feature_selection if c in processed.columns]
        if valid_cols:
            processed = processed[valid_cols]
            transformations.append(f"Selected {len(valid_cols)} features: {', '.join(valid_cols)}")

    # 3. Missing Value Imputation
    if req.imputation_strategy == "drop":
        initial_len = len(processed)
        processed = processed.dropna().reset_index(drop=True)
        transformations.append(f"Dropped {initial_len - len(processed)} rows with missing values")
    else:
        for col in processed.columns:
            if processed[col].isna().sum() > 0:
                if pd.api.types.is_numeric_dtype(processed[col]):
                    if req.imputation_strategy == "mean":
                        fill_val = processed[col].mean()
                        processed[col] = processed[col].fillna(fill_val)
                    elif req.imputation_strategy == "median":
                        fill_val = processed[col].median()
                        processed[col] = processed[col].fillna(fill_val)
                    elif req.imputation_strategy == "mode":
                        mode_vals = processed[col].mode()
                        fill_val = mode_vals[0] if len(mode_vals) > 0 else 0
                        processed[col] = processed[col].fillna(fill_val)
                else:
                    mode_vals = processed[col].mode()
                    fill_val = mode_vals[0] if len(mode_vals) > 0 else "Unknown"
                    processed[col] = processed[col].fillna(fill_val)
        transformations.append(f"Imputed missing values using strategy '{req.imputation_strategy}'")

    # 4. Outlier Handling
    if req.outlier_handling == "clip_iqr":
        numeric_cols = processed.select_dtypes(include=[np.number]).columns
        clipped_count = 0
        for col in numeric_cols:
            q25 = processed[col].quantile(0.25)
            q75 = processed[col].quantile(0.75)
            iqr = q75 - q25
            lower = q25 - 1.5 * iqr
            upper = q75 + 1.5 * iqr
            clipped_count += int(((processed[col] < lower) | (processed[col] > upper)).sum())
            processed[col] = processed[col].clip(lower=lower, upper=upper)
        transformations.append(f"Clipped {clipped_count} outlier values using 1.5x IQR boundaries")
    elif req.outlier_handling == "drop_zscore":
        numeric_cols = processed.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            z_scores = np.abs((processed[numeric_cols] - processed[numeric_cols].mean()) / processed[numeric_cols].std())
            mask = (z_scores < 3).all(axis=1)
            dropped = len(processed) - mask.sum()
            processed = processed[mask].reset_index(drop=True)
            transformations.append(f"Dropped {dropped} observations with |Z-score| >= 3")

    # 5. Categorical Encoding
    target_cols = req.target_columns or []
    cat_cols = [c for c in processed.select_dtypes(include=['object', 'category']).columns if c not in target_cols]
    
    if req.categorical_encoding == "onehot" and cat_cols:
        # Don't one-hot encode timestamps or unique strings
        low_cardinality = [c for c in cat_cols if processed[c].nunique() <= 20 and not ('time' in c.lower() or 'date' in c.lower())]
        if low_cardinality:
            processed = pd.get_dummies(processed, columns=low_cardinality, drop_first=True)
            transformations.append(f"One-hot encoded categorical columns: {', '.join(low_cardinality)}")
    elif req.categorical_encoding == "label" and cat_cols:
        le = LabelEncoder()
        for col in cat_cols:
            if processed[col].nunique() <= 50 and not ('time' in col.lower() or 'date' in col.lower()):
                processed[col] = le.fit_transform(processed[col].astype(str))
        transformations.append(f"Label encoded categorical columns: {', '.join(cat_cols)}")

    # 6. Numeric Scaling
    if req.scaling_method and req.scaling_method != "none":
        num_cols = [c for c in processed.select_dtypes(include=[np.number]).columns if c not in target_cols]
        if num_cols:
            scaler = None
            if req.scaling_method == "standard":
                scaler = StandardScaler()
            elif req.scaling_method == "minmax":
                scaler = MinMaxScaler()
            elif req.scaling_method == "robust":
                scaler = RobustScaler()
            
            if scaler:
                processed[num_cols] = scaler.fit_transform(processed[num_cols])
                transformations.append(f"Scaled numeric features using {req.scaling_method} scaler")

    return processed, transformations
