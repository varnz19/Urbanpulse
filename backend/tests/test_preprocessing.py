import pytest
import pandas as pd
import numpy as np
from app.data_processing.preprocessor import preprocess_data
from app.schemas.dataset_schemas import PreprocessRequest

def test_preprocessing_pipeline():
    df = pd.DataFrame({
        "speed": [20.0, 30.0, np.nan, 40.0, 30.0, 100.0],
        "volume": [1000, 2000, 1500, 2500, 2000, 2200],
        "weather": ["Clear", "Rainy", "Clear", "Clear", "Rainy", "Overcast"]
    })

    req = PreprocessRequest(
        imputation_strategy="mean",
        drop_duplicates=True,
        scaling_method="standard",
        outlier_handling="clip_iqr",
        categorical_encoding="label"
    )

    processed, transformations = preprocess_data(df, req)
    assert len(transformations) >= 3
    # Missing value should be imputed
    assert processed["speed"].isna().sum() == 0
    # Duplicate (row index 1 and 4 are identical across all cols) should be dropped
    assert len(processed) == 5
