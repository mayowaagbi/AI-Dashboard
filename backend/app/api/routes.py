from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
import pandas as pd
from pathlib import Path
import os
import io
from pydantic import BaseModel
from groq import Groq
import json
import re
import numpy as np
from typing import Dict, List, Optional
from enum import Enum

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
BASE_DIR = "storage/user_data"

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


# Data Cleaning Classes
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
            elif strategy == CleaningStrategy.FILL_MEAN and self.cleaned_df[
                col
            ].dtype in ["int64", "float64"]:
                self.cleaned_df[col].fillna(self.cleaned_df[col].mean(), inplace=True)
            elif strategy == CleaningStrategy.FILL_MEDIAN and self.cleaned_df[
                col
            ].dtype in ["int64", "float64"]:
                self.cleaned_df[col].fillna(self.cleaned_df[col].median(), inplace=True)
            elif strategy == CleaningStrategy.FILL_MODE:
                mode_val = self.cleaned_df[col].mode()
                fill_val = mode_val.iloc[0] if not mode_val.empty else "Unknown"
                self.cleaned_df[col].fillna(fill_val, inplace=True)
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


# Pydantic Models
class askRequest(BaseModel):
    filename: str
    question: str


class AnalysisResponse(BaseModel):
    analysis: dict
    sample_data: dict
    columns: dict
    metadata: dict


class CleaningRequest(BaseModel):
    filename: str
    operations: List[
        Dict
    ]  # [{"type": "missing_values", "strategy": "fill_mean", "columns": ["age"]}]


class CleaningPreviewRequest(BaseModel):
    filename: str


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal and other issues"""
    # Remove path separators and keep only the filename
    clean_name = os.path.basename(filename)
    # Remove any remaining dangerous characters
    clean_name = re.sub(r"[^\w\-_\.]", "", clean_name)
    return clean_name


def get_file_path(filename: str) -> str:
    """Get safe file path"""
    clean_filename = sanitize_filename(filename)
    if not clean_filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    return os.path.join(BASE_DIR, clean_filename)


@router.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail="wrong file type")

        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds maximum size of {MAX_FILE_SIZE/1024/1024}MB",
            )

        try:
            df = pd.read_csv(io.StringIO(file_content.decode("utf-8")))
            if df.empty:
                raise HTTPException(status_code=400, detail="file is empty")

            safename = sanitize_filename(file.filename)
            if not safename:
                raise HTTPException(status_code=400, detail="Invalid filename")

            os.makedirs(BASE_DIR, exist_ok=True)
            with open(f"storage/user_data/{safename}", "wb") as f:
                f.write(file_content)

            return JSONResponse(
                status_code=200,
                content={
                    "message": "File Successfully Uploaded",
                    "filename": safename,
                    "size": f"{len(file_content)/1024:.2f} KB",
                    "columns": list(df.columns),
                    "rows": len(df),
                },
            )

        except pd.errors.EmptyDataError:
            raise HTTPException(
                status_code=400, detail="The CSV file appears to be empty"
            )
        except pd.errors.ParserError:
            raise HTTPException(
                status_code=400, detail="Error parsing CSV file - may be corrupt"
            )
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400, detail="File encoding not supported - please use UTF-8"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

    finally:
        await file.close()


@router.post("/data/preview-cleaning")
async def preview_cleaning(data: CleaningPreviewRequest):
    """Preview data quality issues and suggested cleaning operations"""
    try:
        path = get_file_path(data.filename)
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="File does not exist")

        df = pd.read_csv(path)
        cleaner = DataCleaner(df)

        return {
            "summary": cleaner.get_data_summary(),
            "suggestions": cleaner.suggest_cleaning_operations(),
            "sample_data": df.head(5).to_dict(orient="records"),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing data: {str(e)}")


@router.post("/data/clean")
async def clean_data(data: CleaningRequest):
    """Apply cleaning operations to data"""
    try:
        path = get_file_path(data.filename)
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="File does not exist")

        df = pd.read_csv(path)
        cleaner = DataCleaner(df)

        # Apply cleaning operations
        for operation in data.operations:
            if operation["type"] == "missing_values":
                strategy = CleaningStrategy(operation["strategy"])
                columns = operation.get("columns")
                cleaner.handle_missing_values(strategy, columns)
            elif operation["type"] == "duplicates":
                cleaner.remove_duplicates()
            elif operation["type"] == "standardize_columns":
                cleaner.standardize_columns()

        # Save cleaned data
        cleaned_filename = f"cleaned_{data.filename}"
        cleaned_path = os.path.join(BASE_DIR, cleaned_filename)
        cleaner.cleaned_df.to_csv(cleaned_path, index=False)

        return {
            "message": "Data cleaned successfully",
            "cleaned_filename": cleaned_filename,
            "cleaning_log": cleaner.cleaning_log,
            "summary": {
                "original_rows": len(cleaner.original_df),
                "cleaned_rows": len(cleaner.cleaned_df),
                "original_columns": len(cleaner.original_df.columns),
                "cleaned_columns": len(cleaner.cleaned_df.columns),
            },
            "sample_data": cleaner.cleaned_df.head(5).to_dict(orient="records"),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cleaning data: {str(e)}")


@router.post("/ask")
async def post_question(data: askRequest):
    try:
        path = get_file_path(data.filename)
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="File does not exist")

        df = pd.read_csv(path)
        sample_rows = df.head(3).to_dict(orient="records")
        columns = df.columns.tolist()

        sample_rows_json = json.dumps(sample_rows)
        columns_json = json.dumps(columns)

        prompt = f"""
You are an expert business data analyst. Analyze this DataFrame and provide actionable business insights with Recharts.js configuration:

COLUMNS: {columns_json}
SAMPLE DATA: {sample_rows_json}
USER QUESTION: {data.question}

Return your response as STRICTLY VALID JSON parsable by `json.loads()`. Use this format:

{{
  "charts": [
    {{
      "pandas_code": "Pandas code that processes the data and ends with result variable",
      "recharts_config": {{
        "type": "BarChart|LineChart|PieChart",
        "dataKey": "value",
        "xAxisKey": "category",
        "yAxisKey": "value",
        "colors": ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"],
        "title": "Chart Title",
        "components": {{
          "XAxis": {{"dataKey": "category"}},
          "YAxis": {{}},
          "CartesianGrid": {{"strokeDasharray": "3 3"}},
          "Tooltip": {{}},
          "Legend": {{}},
          "Bar": {{"dataKey": "value", "fill": "#8884d8"}}
        }}
      }},
      "explanation": "Detailed business analysis with specific findings and implications",
      "insights": ["Actionable recommendation with specific numbers and next steps", "Strategic insight with clear business impact and suggested actions"]
    }}
  ]
}}

CRITICAL INSTRUCTIONS for pandas_code:
- Write pandas code that processes the data and ends with: result = final_dataframe
- The result must be a DataFrame with EXACTLY 2 columns: 'category' and 'value'
- 'category' contains labels (product names, dates, categories) - NOT indices
- 'value' contains numeric data for visualization
- Example: result = df.groupby('Product')['Revenue'].sum().reset_index(); result.columns = ['category', 'value']

RECHARTS CONFIG INSTRUCTIONS:
- Choose appropriate chart type: BarChart for comparisons, LineChart for trends, PieChart for proportions
- Set proper dataKey values that match your data structure
- For BarChart: include Bar component with dataKey and fill color
- For LineChart: include Line component with dataKey, stroke color, and strokeWidth
- For PieChart: include Pie component with dataKey, cx, cy, outerRadius, fill, and label
- Always include Tooltip and Legend components
- Use meaningful colors from the provided palette

RECHARTS COMPONENT EXAMPLES:

For BarChart:
{{
  "type": "BarChart",
  "components": {{
    "XAxis": {{"dataKey": "category"}},
    "YAxis": {{}},
    "CartesianGrid": {{"strokeDasharray": "3 3"}},
    "Tooltip": {{}},
    "Legend": {{}},
    "Bar": {{"dataKey": "value", "fill": "#8884d8"}}
  }}
}}

For LineChart:
{{
  "type": "LineChart",
  "components": {{
    "XAxis": {{"dataKey": "category"}},
    "YAxis": {{}},
    "CartesianGrid": {{"strokeDasharray": "3 3"}},
    "Tooltip": {{}},
    "Legend": {{}},
    "Line": {{"type": "monotone", "dataKey": "value", "stroke": "#8884d8", "strokeWidth": 2}}
  }}
}}

For PieChart:
{{
  "type": "PieChart",
  "components": {{
    "Tooltip": {{}},
    "Legend": {{}},
    "Pie": {{"dataKey": "value", "cx": "50%", "cy": "50%", "outerRadius": 80, "fill": "#8884d8", "label": true}}
  }}
}}

EXPLANATION REQUIREMENTS - Write like a business consultant:
- Start with the key finding: "Analysis reveals..." or "The data shows..."
- Include specific numbers, percentages, and comparisons
- Explain what this means for the business (revenue impact, efficiency, risks)
- Be detailed but focused on business implications
- Minimum 50 words, avoid generic statements

INSIGHTS REQUIREMENTS - Each insight must be a complete actionable recommendation:
- Start with a specific action: "Increase marketing spend for...", "Prioritize inventory for...", "Investigate the decline in..."
- Include the business rationale with numbers
- Suggest next steps or metrics to monitor
- Make each insight 30-50 words
- Focus on decisions executives can act on

CRITICAL: Do not wrap the JSON in markdown code blocks (```). Do not include any markdown, explanations, or extra text. Output ONLY the raw JSON object starting with {{ and ending with }}.
"""

        # Add retry logic for LLM calls
        max_retries = 3
        for attempt in range(max_retries):
            try:
                chat_completion = client.chat.completions.create(
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a JSON-only assistant. Return ONLY valid JSON without any markdown code blocks, explanations, or formatting. Do not use ``` or any other markdown.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.1,
                    model="llama-3.3-70b-versatile",
                )

                content = chat_completion.choices[0].message.content

                # Debug logging
                print(
                    f"LLM Response (attempt {attempt + 1}):",
                    content[:200] + "..." if len(content) > 200 else content,
                )

                if not content or content.strip() == "":
                    raise ValueError("Empty response from LLM")

                # Clean the content - handle markdown code blocks
                content = content.strip()

                # Remove opening markdown blocks
                if content.startswith("```json"):
                    content = content[7:]
                elif content.startswith("```"):
                    content = content[3:]

                # Remove closing markdown blocks
                if content.endswith("```"):
                    content = content[:-3]

                content = content.strip()

                try:
                    llm_response = json.loads(content)
                except json.JSONDecodeError as json_err:
                    print(f"JSON Parse Error: {json_err}")
                    print(f"Raw content: {repr(content)}")
                    if attempt == max_retries - 1:
                        raise HTTPException(
                            status_code=500,
                            detail=f"Invalid JSON from LLM after {max_retries} attempts: {json_err}",
                        )
                    continue

                break

            except Exception as e:
                print(f"LLM API Error (attempt {attempt + 1}): {e}")
                if attempt == max_retries - 1:
                    raise HTTPException(
                        status_code=500,
                        detail=f"LLM API failed after {max_retries} attempts: {str(e)}",
                    )
                continue

        # Validate response structure
        if not isinstance(llm_response, dict):
            raise HTTPException(
                status_code=500, detail="LLM response is not a JSON object"
            )

        if "charts" in llm_response and llm_response["charts"]:
            if (
                not isinstance(llm_response["charts"], list)
                or len(llm_response["charts"]) == 0
            ):
                raise HTTPException(
                    status_code=500, detail="LLM response charts field is invalid"
                )
            chart_data = llm_response["charts"][0]
        else:
            chart_data = llm_response

        # Validate required keys for new format
        required_keys = {"pandas_code", "recharts_config", "explanation", "insights"}
        missing_keys = required_keys - set(chart_data.keys())
        if missing_keys:
            raise HTTPException(
                status_code=422,
                detail=f"LLM response missing required fields: {missing_keys}",
            )

        # Execute pandas code to get data
        llm_code = chart_data["pandas_code"]
        safe_locals = {"df": df.copy()}

        try:
            exec(llm_code, {"pd": pd, "np": np}, safe_locals)
        except Exception as e:
            print(f"Code execution error: {e}")
            print(f"Generated code: {llm_code}")
            raise HTTPException(
                status_code=400, detail=f"Error executing AI code: {str(e)}"
            )

        result = safe_locals.get("result")
        if result is None:
            raise HTTPException(
                status_code=400, detail="No variable 'result' found in AI code output"
            )

        # Convert result to proper format
        if isinstance(result, pd.DataFrame):
            chart_data_records = result.to_dict(orient="records")
        elif isinstance(result, pd.Series):
            chart_data_records = result.reset_index().to_dict(orient="records")
        else:
            raise HTTPException(
                status_code=400, detail="Unsupported result format for charting"
            )

        if not chart_data_records:
            raise HTTPException(status_code=400, detail="Generated chart data is empty")

        # Save to history
        try:
            history_path = os.path.join(
                "storage/history", f"{sanitize_filename(data.filename)}.json"
            )
            entry = {
                "question": data.question,
                "pandas_code": chart_data["pandas_code"],
                "recharts_config": chart_data["recharts_config"],
                "explanation": chart_data["explanation"],
                "insights": chart_data["insights"],
            }
            os.makedirs(os.path.dirname(history_path), exist_ok=True)
            with open(history_path, "a") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception as e:
            print(f"History saving failed: {e}")

        # Prepare final response with Recharts config
        response_data = {
            "analysis": {
                "explanation": chart_data["explanation"],
                "insights": chart_data["insights"],
                "pandas_code": chart_data["pandas_code"],
            },
            "chart": {
                "type": chart_data["recharts_config"]["type"],
                "data": chart_data_records,
                "config": chart_data["recharts_config"],
            },
            "metadata": {
                "filename": os.path.basename(path),
                "size_kb": round(os.path.getsize(path) / 1024, 2),
                "shape": f"{len(df)} rows × {len(df.columns)} cols",
            },
            "sample_data": sample_rows,
            "columns": columns,
        }

        # Validate final response can be JSON serialized
        try:
            json.dumps(response_data)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Response data cannot be JSON serialized: {str(e)}",
            )

        print("Successful response:", json.dumps(response_data, indent=2)[:500] + "...")
        return response_data

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to handle question: {str(e)}"
        )


@router.get("/files")
async def get_files():
    try:
        if not os.path.exists(BASE_DIR):
            return {"files": []}

        files = Path(BASE_DIR).glob("*.csv")
        file_list = []
        for file in files:
            file_list.append(
                {"filename": file.name, "size_kb": round(file.stat().st_size / 1024, 2)}
            )
        return {"files": file_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")


@router.get("/history/{filename}")
async def get_history(filename: str):
    clean_filename = sanitize_filename(filename)
    if not clean_filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    history_path = os.path.join("storage/history", f"{clean_filename}.json")

    if not os.path.exists(history_path):
        return {"history": []}

    try:
        with open(history_path, "r") as f:
            history = f.read()
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading history: {str(e)}")
