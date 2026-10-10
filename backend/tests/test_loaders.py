import os
import pytest
from app.data_processing.loader import load_dataset_file, parse_arff
from app.data_processing.validator import inspect_dataframe

SAMPLE_DIR = os.path.join(os.path.dirname(__file__), "..", "app", "sample_data")

def test_load_csv_dataset():
    csv_path = os.path.join(SAMPLE_DIR, "hyderabad_traffic_corridors.csv")
    assert os.path.exists(csv_path), "Sample CSV file must exist"
    df = load_dataset_file(csv_path, "csv")
    assert len(df) == 2016
    assert "avg_speed_kmh" in df.columns
    assert "vehicle_count" in df.columns
    assert "congestion_level" in df.columns

def test_load_arff_dataset():
    arff_path = os.path.join(SAMPLE_DIR, "hyderabad_traffic_corridors.arff")
    assert os.path.exists(arff_path), "Sample ARFF file must exist"
    df = load_dataset_file(arff_path, "arff")
    assert len(df) == 2016
    assert "avg_speed_kmh" in df.columns
    assert "congestion_level" in df.columns

def test_inspect_dataframe():
    csv_path = os.path.join(SAMPLE_DIR, "hyderabad_traffic_corridors.csv")
    df = load_dataset_file(csv_path, "csv")
    meta = inspect_dataframe(df)
    assert len(meta) == len(df.columns)
    speed_meta = next(m for m in meta if m["name"] == "avg_speed_kmh")
    assert speed_meta["inferred_type"] == "numeric"
    assert speed_meta["min_val"] is not None
    assert speed_meta["max_val"] is not None
