import os
import io
import re
import pandas as pd
import numpy as np

def parse_arff(content: str) -> pd.DataFrame:
    """
    Native ARFF parser supporting attributes and @data records with quotes and commas.
    """
    lines = [line.strip() for line in content.splitlines() if line.strip() and not line.strip().startswith('%')]
    attributes = []
    data_lines = []
    is_data = False

    for line in lines:
        if is_data:
            data_lines.append(line)
        elif line.lower().startswith('@attribute'):
            # @attribute name type
            parts = line.split(maxsplit=2)
            if len(parts) >= 2:
                attr_name = parts[1].strip("'\"")
                attributes.append(attr_name)
        elif line.lower().startswith('@data'):
            is_data = True

    if not attributes or not data_lines:
        raise ValueError("Invalid ARFF file: missing attributes or data section.")

    parsed_rows = []
    for line in data_lines:
        # Regex to split on comma outside quotes
        tokens = re.split(r",(?=(?:[^']*'[^']*')*[^']*$)", line)
        cleaned_tokens = [tok.strip().strip("'\"") for tok in tokens]
        if len(cleaned_tokens) == len(attributes):
            parsed_rows.append(cleaned_tokens)

    df = pd.DataFrame(parsed_rows, columns=attributes)
    
    # Try converting numeric columns
    for col in df.columns:
        try:
            converted = pd.to_numeric(df[col])
            df[col] = converted
        except (ValueError, TypeError):
            pass

    return df

def load_dataset_file(file_path: str, file_format: str = "csv") -> pd.DataFrame:
    """
    Load dataset from CSV or ARFF file with error resilience.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = file_format.lower() if file_format else os.path.splitext(file_path)[1].lstrip('.').lower()

    if ext == "arff":
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        return parse_arff(content)
    else:
        # Try standard pandas read_csv
        try:
            return pd.read_csv(file_path)
        except Exception:
            return pd.read_csv(file_path, sep=None, engine="python")
