import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from mlxtend.frequent_patterns import apriori, association_rules
from app.schemas.ml_schemas import AssociationRequest, AssociationResponse, AssociationRuleItem

def run_association_mining(df: pd.DataFrame, req: AssociationRequest) -> AssociationResponse:
    """
    Run Apriori association rule discovery on discretized mobility attributes using mlxtend.
    """
    cat_df = pd.DataFrame(index=df.index)

    # Discretize continuous columns and build categorical attributes
    if "weather" in df.columns:
        cat_df["weather"] = "Weather=" + df["weather"].astype(str)
    if "road_type" in df.columns:
        cat_df["road_type"] = "Road=" + df["road_type"].astype(str)
    if "congestion_level" in df.columns:
        cat_df["congestion"] = "Congestion=" + df["congestion_level"].astype(str)

    # Discretize hour into temporal periods
    if "hour" in df.columns:
        def categorize_hour(h):
            try:
                h = int(h)
                if 8 <= h <= 11:
                    return "Period=MorningPeak"
                elif 17 <= h <= 21:
                    return "Period=EveningPeak"
                elif 0 <= h <= 6:
                    return "Period=NightFreeFlow"
                else:
                    return "Period=MiddayOffPeak"
            except Exception:
                return "Period=Other"

        cat_df["period"] = df["hour"].apply(categorize_hour)

    # Weekend vs Weekday
    if "is_weekend" in df.columns:
        cat_df["day_type"] = df["is_weekend"].apply(lambda w: "Day=Weekend" if w == 1 else "Day=Weekday")
    elif "day_of_week" in df.columns:
        cat_df["day_type"] = df["day_of_week"].apply(lambda d: "Day=Weekend" if str(d).lower() in ("saturday", "sunday") else "Day=Weekday")

    # Discretize speed if available
    if "avg_speed_kmh" in df.columns:
        def speed_bracket(s):
            try:
                s = float(s)
                if s < 20.0:
                    return "Speed=Bottleneck(<20km/h)"
                elif s < 38.0:
                    return "Speed=Moderate(20-38km/h)"
                else:
                    return "Speed=FreeFlow(>38km/h)"
            except Exception:
                return "Speed=Unknown"
        cat_df["speed"] = df["avg_speed_kmh"].apply(speed_bracket)

    # Generic fallback: ingest any categorical or discretizable numeric columns for any dataset
    if len(cat_df.columns) < 2:
        for col in df.columns:
            if col in cat_df.columns:
                continue
            if pd.api.types.is_object_dtype(df[col]) or isinstance(df[col].dtype, pd.CategoricalDtype):
                if 1 < df[col].nunique() <= 20:
                    cat_df[col] = f"{col}=" + df[col].astype(str)
            elif pd.api.types.is_numeric_dtype(df[col]):
                try:
                    if df[col].nunique() > 2:
                        binned = pd.qcut(df[col].dropna(), q=3, labels=["Low", "Med", "High"], duplicates="drop")
                        cat_df[col] = f"{col}=" + binned.astype(str)
                except Exception:
                    pass
            if len(cat_df.columns) >= 6:
                break

    if cat_df.empty or len(cat_df.columns) < 2:
        return AssociationResponse(
            total_rules_found=0,
            min_support_used=req.min_support,
            min_confidence_used=req.min_confidence,
            rules=[]
        )

    # One-hot expand to standard binary boolean matrix
    bool_df = pd.get_dummies(cat_df, prefix="", prefix_sep="").astype(bool)

    # Run Apriori
    try:
        frequent_itemsets = apriori(
            bool_df,
            min_support=req.min_support,
            use_colnames=True,
            max_len=req.max_len
        )
    except Exception as e:
        raise ValueError(f"Apriori mining failed: {str(e)}")

    if frequent_itemsets.empty:
        return AssociationResponse(
            total_rules_found=0,
            min_support_used=req.min_support,
            min_confidence_used=req.min_confidence,
            rules=[]
        )

    # Generate association rules
    try:
        rules_df = association_rules(
            frequent_itemsets,
            metric="confidence",
            min_threshold=req.min_confidence
        )
    except Exception:
        return AssociationResponse(
            total_rules_found=0,
            min_support_used=req.min_support,
            min_confidence_used=req.min_confidence,
            rules=[]
        )

    if rules_df.empty:
        return AssociationResponse(
            total_rules_found=0,
            min_support_used=req.min_support,
            min_confidence_used=req.min_confidence,
            rules=[]
        )

    # Filter by min_lift
    filtered_rules = rules_df[rules_df["lift"] >= req.min_lift].copy()
    filtered_rules = filtered_rules.sort_values(by="lift", ascending=False).head(50)

    rule_items = []
    for _, row in filtered_rules.iterrows():
        ant = list(row["antecedents"])
        con = list(row["consequents"])
        supp = float(round(row["support"], 3))
        conf = float(round(row["confidence"], 3))
        lift = float(round(row["lift"], 3))
        conviction = float(round(row["conviction"], 3)) if not np.isinf(row["conviction"]) else 999.0

        ant_str = " AND ".join(ant)
        con_str = " AND ".join(con)
        explanation = (
            f"When [{ant_str}], then [{con_str}] occurs in "
            f"{int(conf * 100)}% of observations ({lift:.2f}x above baseline probability)."
        )

        rule_items.append(AssociationRuleItem(
            antecedents=ant,
            consequents=con,
            support=supp,
            confidence=conf,
            lift=lift,
            conviction=conviction,
            human_explanation=explanation
        ))

    return AssociationResponse(
        total_rules_found=len(rule_items),
        min_support_used=req.min_support,
        min_confidence_used=req.min_confidence,
        rules=rule_items
    )
