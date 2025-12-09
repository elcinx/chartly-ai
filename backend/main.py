import os
import io
import uuid
import json
import pathlib
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import google.generativeai as genai
from PIL import Image

# CENTRALIZED CONFIG IMPORT
from config import GEMINI_API_KEY

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print("--- DEBUG: Gemini Client Configured Globally ---")
else:
    print("--- DEBUG: Gemini Client NOT Configured (Missing Key) ---")

app = FastAPI(title="Chartly Backend")

# CORS Setup
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store
SESSIONS: Dict[str, pd.DataFrame] = {}

# --- PYDANTIC MODELS ---

class ColumnInfo(BaseModel):
    name: str
    dtype: str
    unique_count: int

class SessionResponse(BaseModel):
    session_id: str
    columns: List[ColumnInfo]
    preview: List[Dict[str, Any]]

class Suggestion(BaseModel):
    chart_type: str
    reason: str
    recommended: bool

class SuggestionsResponse(BaseModel):
    suggestions: List[Suggestion]

class RenderRequest(BaseModel):
    session_id: str
    chart_type: str
    x: Optional[str] = None
    y: Optional[str] = None
    options: Optional[Dict[str, Any]] = None

class RenderResponse(BaseModel):
    chart_type: str
    plotly_json: str

class DebugEnvResponse(BaseModel):
    has_key: bool
    key_length: int
    demo_mode: bool

# --- CHART DETECTIVE MODELS ---

class ChartAnalysisResult(BaseModel):
    detected_chart_type: Optional[str] = None
    raw_label: Optional[str] = None
    confidence: float = 0.0
    explanation_tr: str
    is_compatible: bool
    compatibility_reason_tr: str
    error_code: Optional[str] = None

# --- HELPER FUNCTIONS ---

def get_dtype_str(series: pd.Series) -> str:
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    return "categorical"

def get_session_df(session_id: str) -> pd.DataFrame:
    if session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")
    return SESSIONS[session_id]

def describe_dataset_schema(df: pd.DataFrame) -> str:
    """Generates a natural language description of the dataset schema for the LLM."""
    description = []
    description.append(f"The dataset contains {len(df)} rows and {len(df.columns)} columns.")
    
    for col in df.columns:
        dtype = get_dtype_str(df[col])
        unique_count = df[col].nunique()
        example_values = df[col].dropna().head(3).tolist()
        description.append(f"- Column '{col}': Type is {dtype}. It has {unique_count} unique values. Examples: {example_values}.")
        
    return "\n".join(description)

def detect_chart_type_with_gemini(image: Image.Image, dataset_context: str) -> ChartAnalysisResult:
    """
    Robust Chart Detection using Gemini (inspired by AI-Chart-Detective).
    Uses the globally configured GEMINI_API_KEY.
    """
    if not GEMINI_API_KEY:
        return ChartAnalysisResult(
            detected_chart_type=None,
            explanation_tr="Gemini API anahtarı bulunamadı.",
            is_compatible=False,
            compatibility_reason_tr="API yapılandırması eksik.",
            error_code="NO_API_KEY"
        )

    # Using verified model
    model = genai.GenerativeModel("models/gemini-2.0-flash")
    
    # 1. ALLOWED TYPES (Normalized)
    ALLOWED_TYPES = [
        "bar", "line", "pie", "radar", "scatter", 
        "heatmap", "boxplot", "histogram", "area", "bubble"
    ]
    
    prompt = f"""
    You are an expert data visualization assistant (AI Chart Detective).
    
    Your Task:
    1. Analyze the provided image and identify the chart type.
    2. Check compatibility with the user's dataset schema provided below.
    
    User Dataset Schema:
    {dataset_context}
    
    ALLOWED CHART TYPES:
    {", ".join(ALLOWED_TYPES)}
    
    INSTRUCTIONS:
    - If the image is NOT a chart, set 'detected_chart_type' to "other".
    - 'confidence' must be a float between 0.0 and 1.0.
    - 'is_compatible' is boolean. true if the dataset has columns required for this chart (e.g. numeric+cat for bar).
    - Provide reasoning in Turkish for 'explanation_tr' and 'compatibility_reason_tr'.
    
    RESPONSE FORMAT (Strict JSON):
    {{
        "detected_chart_type": "one of allowed types or 'other'",
        "raw_label": "your descriptive label",
        "confidence": 0.95,
        "explanation_tr": "Grafik ne gösteriyor (Türkçe)",
        "is_compatible": true,
        "compatibility_reason_tr": "Neden uyumlu veya değil (Türkçe)"
    }}
    """
    
    safety_settings = [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
    ]
    
    try:
        response = model.generate_content([prompt, image], safety_settings=safety_settings)
        print(f"--- GEMINI RAW: {response.text} ---")
        
        # Clean JSON
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_text)
        
        # Normalize type
        detected = data.get("detected_chart_type", "other").lower()
        if detected not in ALLOWED_TYPES:
            detected = "other"
            
        return ChartAnalysisResult(
            detected_chart_type=detected,
            raw_label=data.get("raw_label", "Bilinmiyor"),
            confidence=float(data.get("confidence", 0)),
            explanation_tr=data.get("explanation_tr", "Açıklama yok."),
            is_compatible=data.get("is_compatible", False),
            compatibility_reason_tr=data.get("compatibility_reason_tr", "Sebep belirtilmedi."),
            error_code=None
        )
        
    except Exception as e:
        print(f"--- GEMINI EXCEPTION: {e} ---")
        err_str = str(e)
        code = "GEMINI_ERROR"
        msg = "Beklenmeyen hata."
        
        if "429" in err_str:
            code = "GEMINI_QUOTA"
            msg = "Google API Kotası aşıldı (429)."
        elif "401" in err_str:
            code = "GEMINI_AUTH"
            msg = "Yetkilendirme hatası (401)."
        elif "403" in err_str:
            code = "GEMINI_PERMISSION"
            msg = "Erişim reddedildi (403)."
        elif "404" in err_str:
            code = "GEMINI_MODEL_NOT_FOUND"
            msg = "Model bulunamadı."
            
        return ChartAnalysisResult(
            detected_chart_type=None,
            explanation_tr=msg,
            is_compatible=False,
            compatibility_reason_tr=f"Hata detayı: {err_str[:100]}",
            error_code=code
        )

# --- DEBUG ENDPOINTS ---

@app.get("/api/debug-gemini-env", response_model=DebugEnvResponse)
def debug_gemini_env():
    has_key = bool(GEMINI_API_KEY and len(GEMINI_API_KEY) > 0)
    return DebugEnvResponse(
        has_key=has_key,
        key_length=len(GEMINI_API_KEY) if has_key else 0,
        demo_mode=not has_key
    )

@app.get("/api/test-gemini-simple")
def debug_gemini_test_simple():
    print("--- HIT: /api/test-gemini-simple ---")
    if not GEMINI_API_KEY:
        return {"ok": False, "error_code": "NO_API_KEY"}
    
    try:
        # Config is already done globally, but safe to call again
        model = genai.GenerativeModel("models/gemini-2.0-flash") 
        response = model.generate_content("Return OK.")
        return {"ok": True, "model_response": response.text.strip()}
    except Exception as e:
        print(f"--- GEMINI ERROR: {e} ---")
        return {"ok": False, "error_code": "EXCEPTION", "error_message": str(e)}

# --- APPLICATION ENDPOINTS ---

@app.get("/")
def read_root():
    return {"message": "Chartly Backend is running!"}

@app.post("/api/upload-csv", response_model=SessionResponse)
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        df = df.dropna(how='all').dropna(axis=1, how='all')
        
        session_id = str(uuid.uuid4())
        SESSIONS[session_id] = df
        
        columns_info = []
        for col in df.columns:
            columns_info.append(ColumnInfo(
                name=col,
                dtype=get_dtype_str(df[col]),
                unique_count=int(df[col].nunique())
            ))
            
        preview = df.head(20).to_dict(orient='records')
        preview_clean = [{k: (None if pd.isna(v) else v) for k, v in row.items()} for row in preview]

        return SessionResponse(
            session_id=session_id,
            columns=columns_info,
            preview=preview_clean
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing CSV: {str(e)}")

@app.post("/api/suggest-charts", response_model=SuggestionsResponse)
async def suggest_charts(request: dict):
    # Expects {"session_id": "...", "x": "...", "y": "..."}
    session_id = request.get("session_id")
    x_col = request.get("x")
    y_col = request.get("y")
    
    df = get_session_df(session_id)
    
    # Auto-select columns
    if not x_col and not y_col:
        dtypes = {c: get_dtype_str(df[c]) for c in df.columns}
        nums = [c for c, t in dtypes.items() if t == "numeric"]
        cats = [c for c, t in dtypes.items() if t == "categorical"]
        dates = [c for c, t in dtypes.items() if t == "datetime"]
        
        if dates and nums: x_col, y_col = dates[0], nums[0]
        elif cats and nums: x_col, y_col = cats[0], nums[0]
        elif len(nums) >= 2: x_col, y_col = nums[0], nums[1]
        elif len(nums) == 1: x_col = nums[0]
        elif cats: x_col = cats[0]
    
    if not x_col:
         return SuggestionsResponse(suggestions=[])
    
    suggestions = []
    x_type = get_dtype_str(df[x_col])
    y_type = get_dtype_str(df[y_col]) if y_col else None
    
    if not y_col:
        if x_type == "numeric":
            suggestions.append(Suggestion(chart_type="histogram", reason="Tek sayısal değişken dağılımı.", recommended=True))
            suggestions.append(Suggestion(chart_type="box", reason="Sayısal özet.", recommended=False))
        elif x_type == "categorical":
            suggestions.append(Suggestion(chart_type="bar", reason="Kategori sayımları.", recommended=True))
            suggestions.append(Suggestion(chart_type="pie", reason="Oransal dağılım.", recommended=False))
    else:
        if x_type == "numeric" and y_type == "numeric":
            suggestions.append(Suggestion(chart_type="scatter", reason="Korelasyon analizi.", recommended=True))
            is_sorted = df[x_col].is_monotonic_increasing
            suggestions.append(Suggestion(chart_type="line", reason="Trend takibi.", recommended=is_sorted))
            suggestions.append(Suggestion(chart_type="heatmap", reason="Yoğunluk.", recommended=False))
        elif (x_type == "categorical" and y_type == "numeric") or (x_type == "numeric" and y_type == "categorical"):
            suggestions.append(Suggestion(chart_type="bar", reason="Kategorik karşılaştırma.", recommended=True))
            suggestions.append(Suggestion(chart_type="box", reason="Kategori içi dağılım.", recommended=False))
        elif "datetime" in [x_type, y_type] and "numeric" in [x_type, y_type]:
            suggestions.append(Suggestion(chart_type="line", reason="Zaman serisi.", recommended=True))
            suggestions.append(Suggestion(chart_type="scatter", reason="Veri noktaları.", recommended=False))
        elif x_type == "categorical" and y_type == "categorical":
            suggestions.append(Suggestion(chart_type="heatmap", reason="Kategori kesişimi.", recommended=True))
            
    return SuggestionsResponse(suggestions=suggestions[:3])

@app.post("/api/render-chart", response_model=RenderResponse)
async def render_chart(req: RenderRequest):
    df = get_session_df(req.session_id)
    fig = None
    try:
        t = req.chart_type
        if t == "bar": fig = px.bar(df, x=req.x, y=req.y, title=f"{req.x} vs {req.y}")
        elif t == "line": fig = px.line(df, x=req.x, y=req.y, title=f"{req.x} vs {req.y}")
        elif t == "scatter": fig = px.scatter(df, x=req.x, y=req.y, title=f"{req.x} vs {req.y}")
        elif t == "histogram":
            target = req.x if req.x else req.y
            fig = px.histogram(df, x=target, title=f"Dist of {target}")
        elif t == "box": fig = px.box(df, x=req.x, y=req.y, title=f"Box: {req.x}")
        elif t == "pie": fig = px.pie(df, names=req.x, values=req.y, title=f"Pie: {req.x}")
        elif t == "heatmap": fig = px.density_heatmap(df, x=req.x, y=req.y, title=f"Heatmap")
        else: fig = px.scatter(df, x=req.x, y=req.y, title="Chart")

        fig.update_layout(template="plotly_dark")
        return RenderResponse(chart_type=req.chart_type, plotly_json=fig.to_json())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Chart Error: {str(e)}")

@app.post("/api/analyze-chart-image", response_model=ChartAnalysisResult)
async def analyze_chart_image(
    session_id: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        # 1. Get Session Data
        df = get_session_df(session_id)
        dataset_context = describe_dataset_schema(df)
        
        # 2. Read Image
        content = await file.read()
        try:
            image = Image.open(io.BytesIO(content))
        except Exception:
             return ChartAnalysisResult(
                 detected_chart_type=None,
                 explanation_tr="Geçersiz resim dosyası.",
                 is_compatible=False,
                 compatibility_reason_tr="Dosya okunamadı.",
                 error_code="INVALID_IMAGE"
             )

        # 3. Delegate to Helper Logic
        return detect_chart_type_with_gemini(image, dataset_context)

    except HTTPException as h:
        raise h
    except Exception as e:
        print(f"--- SERVER ERROR: {e} ---")
        return ChartAnalysisResult(
            detected_chart_type=None,
            explanation_tr="Sunucu Hatası",
            is_compatible=False,
            compatibility_reason_tr=str(e),
            error_code="SERVER_ERROR"
        )
            
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
