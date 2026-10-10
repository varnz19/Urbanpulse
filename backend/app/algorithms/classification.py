import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
from sklearn.preprocessing import LabelEncoder
from app.schemas.ml_schemas import ClassifyRequest, ClassifyResponse, ClassMetrics

def run_classification(df: pd.DataFrame, req: ClassifyRequest) -> ClassifyResponse:
    """
    Run machine learning classification with stratified evaluation, confusion matrix, and explainable rules.
    """
    if req.target_column not in df.columns:
        raise ValueError(f"Target column '{req.target_column}' does not exist in dataset.")

    # Drop rows where target is missing
    clean_df = df.dropna(subset=[req.target_column]).copy()
    if len(clean_df) < 20:
        raise ValueError("Insufficient data rows for reliable classification.")

    # Target encoding
    y_raw = clean_df[req.target_column].astype(str)
    le_target = LabelEncoder()
    y = le_target.fit_transform(y_raw)
    class_names = [str(c) for c in le_target.classes_]

    # Verify target distribution has at least 2 classes
    if len(class_names) < 2:
        raise ValueError("Target column must contain at least 2 unique classes.")

    # Feature selection & preparation
    feature_candidates = [c for c in req.feature_columns if c in clean_df.columns and c != req.target_column]
    if not feature_candidates:
        raise ValueError("No valid feature columns provided.")

    X_df = clean_df[feature_candidates].copy()

    # Preprocess features: encode categoricals & impute numerics
    processed_cols = []
    X_parts = []
    feature_mapping_names = []

    for col in feature_candidates:
        if pd.api.types.is_numeric_dtype(X_df[col]):
            val = pd.to_numeric(X_df[col], errors='coerce').fillna(X_df[col].mean())
            X_parts.append(val.values.reshape(-1, 1))
            feature_mapping_names.append(col)
        else:
            # Categorical: one-hot encode
            dummies = pd.get_dummies(X_df[col].astype(str), prefix=col, drop_first=True)
            if not dummies.empty:
                X_parts.append(dummies.values)
                feature_mapping_names.extend(dummies.columns.tolist())

    if not X_parts:
        raise ValueError("Failed to extract valid features.")

    X = np.hstack(X_parts)

    # Train / Test split
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=req.test_size, random_state=req.random_state, stratify=y
        )
    except ValueError:
        # Fallback if classes are too small for stratified split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=req.test_size, random_state=req.random_state
        )

    # Model instantiation
    model_name = "Decision Tree Classifier"
    decision_rules = []
    feature_importances = None

    if req.model_type == "naive_bayes":
        clf = GaussianNB()
        model_name = "Gaussian Naive Bayes"
    elif req.model_type == "oner":
        # OneR baseline: Single-attribute decision stump (max_depth=1)
        clf = DecisionTreeClassifier(max_depth=1, random_state=req.random_state)
        model_name = "OneR Baseline (Single-Attribute Decision Stump)"
    elif req.model_type == "rules":
        # Rule-based classifier: shallow interpretable tree extracted as IF-THEN rules
        clf = DecisionTreeClassifier(max_depth=3, random_state=req.random_state)
        model_name = "Interpretable Rule-Based Decision List"
    else:
        # Default Decision Tree
        depth = req.max_depth or 4
        clf = DecisionTreeClassifier(max_depth=depth, random_state=req.random_state)
        model_name = f"Decision Tree (Max Depth: {depth})"

    # Train model
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)

    # Extract rules / importance if tree-based
    if hasattr(clf, "feature_importances_"):
        fi_vals = clf.feature_importances_
        feature_importances = {}
        for fname, val in zip(feature_mapping_names, fi_vals):
            if val > 0.001:
                feature_importances[fname] = float(round(val, 3))
        # Sort by importance
        feature_importances = dict(sorted(feature_importances.items(), key=lambda item: item[1], reverse=True))

        try:
            tree_text = export_text(clf, feature_names=feature_mapping_names, class_names=class_names)
            decision_rules = [line for line in tree_text.splitlines() if line.strip()]
        except Exception:
            decision_rules = []

    # Calculate metrics
    accuracy = float(round(accuracy_score(y_test, y_pred), 3))
    prec, rec, f1, supp = precision_recall_fscore_support(y_test, y_pred, average=None, labels=range(len(class_names)), zero_division=0)
    macro_f1 = float(round(np.mean(f1), 3))
    weighted_f1 = float(round(np.sum(f1 * supp) / max(1, np.sum(supp)), 3))

    cm = confusion_matrix(y_test, y_pred, labels=range(len(class_names))).tolist()

    per_class = {}
    for i, cname in enumerate(class_names):
        per_class[cname] = ClassMetrics(
            precision=float(round(prec[i], 3)),
            recall=float(round(rec[i], 3)),
            f1_score=float(round(f1[i], 3)),
            support=int(supp[i])
        )

    # Cross-validation
    cv_mean = None
    cv_std = None
    try:
        cv = StratifiedKFold(n_splits=min(5, len(np.unique(y_train))), shuffle=True, random_state=req.random_state)
        scores = cross_val_score(clf, X_train, y_train, cv=cv, scoring="accuracy")
        cv_mean = float(round(np.mean(scores), 3))
        cv_std = float(round(np.std(scores), 3))
    except Exception:
        pass

    return ClassifyResponse(
        model_type=req.model_type,
        model_name=model_name,
        accuracy=accuracy,
        macro_f1=macro_f1,
        weighted_f1=weighted_f1,
        classes=class_names,
        confusion_matrix=cm,
        per_class=per_class,
        feature_importance=feature_importances,
        decision_rules=decision_rules,
        cv_mean_accuracy=cv_mean,
        cv_std=cv_std,
        total_train_samples=len(X_train),
        total_test_samples=len(X_test)
    )
