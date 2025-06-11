# Create a new file: data_cleaner.py
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from enum import Enum


class CleaningStrategy(Enum):
    DROP = "drop"
    FILL_MEAN = "fill_mean"
    FILL_MEDIAN = "fill_median"
    FILL_MODE = "fill_mode"
    FILL_FORWARD = "fill_forward"
    FILL_BACKWARD = "fill_backward"
    FILL_ZERO = "fill_zero"


class DataCleaner:
    def __init__(self, df: pd.DataFrame):
        self.original_df = df.copy()
        self.cleaned_df = df.copy()
        self.cleaning_log = []

    def get_data_summary(self) -> Dict:
        """Analyze data quality issues"""
        summary = {
            "total_rows": len(self.cleaned_df),
            "total_columns": len(self.cleaned_df.columns),
            "missing_values": self.cleaned_df.isnull().sum().to_dict(),
            "duplicates": self.cleaned_df.duplicated().sum(),
            "data_types": self.cleaned_df.dtypes.astype(str).to_dict(),
            "memory_usage": self.cleaned_df.memory_usage(deep=True).sum(),
        }
        return summary

    def suggest_cleaning_operations(self) -> List[Dict]:
        """Suggest cleaning operations based on data analysis"""
        suggestions = []

        # Missing values suggestions
        missing = self.cleaned_df.isnull().sum()
        for col, count in missing.items():
            if count > 0:
                suggestions.append(
                    {
                        "type": "missing_values",
                        "column": col,
                        "issue_count": int(count),
                        "percentage": round((count / len(self.cleaned_df)) * 100, 2),
                        "suggested_strategy": self._suggest_missing_strategy(col),
                    }
                )

        # Duplicates suggestion
        dup_count = self.cleaned_df.duplicated().sum()
        if dup_count > 0:
            suggestions.append(
                {
                    "type": "duplicates",
                    "issue_count": int(dup_count),
                    "percentage": round((dup_count / len(self.cleaned_df)) * 100, 2),
                }
            )

        return suggestions


def handle_missing_values(
    self, strategy: CleaningStrategy, columns: Optional[List[str]] = None
) -> "DataCleaner":
    """Handle missing values with specified strategy"""
    if columns is None:
        columns = self.cleaned_df.columns.tolist()

    original_nulls = self.cleaned_df[columns].isnull().sum().sum()

    for col in columns:
        if col not in self.cleaned_df.columns:
            continue

        if strategy == CleaningStrategy.DROP:
            self.cleaned_df = self.cleaned_df.dropna(subset=[col])
        elif strategy == CleaningStrategy.FILL_MEAN and self.cleaned_df[col].dtype in [
            "int64",
            "float64",
        ]:
            self.cleaned_df[col].fillna(self.cleaned_df[col].mean(), inplace=True)
        elif strategy == CleaningStrategy.FILL_MEDIAN and self.cleaned_df[
            col
        ].dtype in ["int64", "float64"]:
            self.cleaned_df[col].fillna(self.cleaned_df[col].median(), inplace=True)
        elif strategy == CleaningStrategy.FILL_MODE:
            self.cleaned_df[col].fillna(
                (
                    self.cleaned_df[col].mode().iloc[0]
                    if not self.cleaned_df[col].mode().empty
                    else "Unknown"
                ),
                inplace=True,
            )
        elif strategy == CleaningStrategy.FILL_FORWARD:
            self.cleaned_df[col].fillna(method="ffill", inplace=True)
        elif strategy == CleaningStrategy.FILL_BACKWARD:
            self.cleaned_df[col].fillna(method="bfill", inplace=True)
        elif strategy == CleaningStrategy.FILL_ZERO:
            self.cleaned_df[col].fillna(0, inplace=True)

    final_nulls = self.cleaned_df[columns].isnull().sum().sum()

    self.cleaning_log.append(
        {
            "operation": "handle_missing_values",
            "strategy": strategy.value,
            "columns": columns,
            "nulls_before": int(original_nulls),
            "nulls_after": int(final_nulls),
        }
    )

    return self


def remove_duplicates(
    self, subset: Optional[List[str]] = None, keep: str = "first"
) -> "DataCleaner":
    """Remove duplicate rows"""
    original_count = len(self.cleaned_df)
    self.cleaned_df = self.cleaned_df.drop_duplicates(subset=subset, keep=keep)
    final_count = len(self.cleaned_df)

    self.cleaning_log.append(
        {
            "operation": "remove_duplicates",
            "rows_before": original_count,
            "rows_after": final_count,
            "removed": original_count - final_count,
        }
    )

    return self


def standardize_columns(self) -> "DataCleaner":
    """Standardize column names"""
    original_columns = self.cleaned_df.columns.tolist()

    # Convert to lowercase, replace spaces with underscores, remove special chars
    new_columns = []
    for col in self.cleaned_df.columns:
        new_col = col.lower().replace(" ", "_").replace("-", "_")
        new_col = "".join(c for c in new_col if c.isalnum() or c == "_")
        new_columns.append(new_col)

    self.cleaned_df.columns = new_columns

    self.cleaning_log.append(
        {
            "operation": "standardize_columns",
            "original_columns": original_columns,
            "new_columns": new_columns,
        }
    )

    return self


def _suggest_missing_strategy(self, column: str) -> str:
    """Suggest best strategy for handling missing values in a column"""
    col_data = self.cleaned_df[column]

    if col_data.dtype in ["int64", "float64"]:
        return CleaningStrategy.FILL_MEDIAN.value
    elif col_data.dtype == "object":
        return CleaningStrategy.FILL_MODE.value
    else:
        return CleaningStrategy.DROP.value
