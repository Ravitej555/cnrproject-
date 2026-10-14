# Smart Health Advisory System — Backend Architecture

The backend powers the **AI Health Advisory Engine**, **Medical Document RAG Vector Search**, and **Clinical Risk Analytics** for the 3D Human Anatomy Simulator.

---

## 🚀 Quick Start

### Option 1: One-Click Launch (Windows)
Double-click `run_backend.bat` or run in PowerShell:
```powershell
.\backend\run_backend.ps1
```

### Option 2: Manual Terminal
```bash
# 1. Install dependencies
python -m pip install -r backend/requirements.txt

# 2. Run the server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

The server will start at:
- **API Base:** `http://127.0.0.1:8000`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`
- **Alternative ReDoc:** `http://127.0.0.1:8000/redoc`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Health check & system status. |
| `POST` | `/upload` | Multipart upload for medical/scientific PDF or TXT files. Chunks & indexes into the vector knowledge base. |
| `POST` | `/ask-stream` | Streaming NDJSON AI chatbot query with context retrieval and source page citations. |
| `POST` | `/api/health-risk` | Computes multi-factorial risk score (0–100), risk tier, organ attribution matrix, and paragraph advisory. |
| `POST` | `/api/symptom-analysis` | Analyzes cross-system symptom burden and identifies the primary organ at risk. |
| `GET` | `/api/anatomy/systems` | Metadata and normal clinical metrics across all 11 anatomical organ systems. |
| `GET` | `/api/aqi` | Environmental air pollution tier calculation and protective health recommendations. |

---

## 🧬 Architectural Components

1. **`main.py`**:
   - FastAPI REST and Streaming endpoints.
   - CORS middleware enabled for cross-origin frontend communication.

2. **`rag_engine.py`**:
   - Text extraction from medical PDFs using `pypdf` with fallback stream parsing.
   - Sliding window chunking (500 characters, 100 character overlap).
   - BM25 / TF-IDF scoring and top-k context retrieval.

3. **`risk_calculator.py`**:
   - Multi-factorial heuristic risk scoring:
     - **Vitals (35% weight):** Heart rate, SpO₂, blood pressure, temperature, respiratory rate.
     - **Symptoms (30% weight):** Cross-system symptom burden.
     - **Environmental AQI (25% weight):** US EPA AQI brackets.
     - **Lifestyle (10% weight):** Sleep, hydration, smoking, physical activity.
   - Cross-factor synergy multipliers (e.g., AQI > 150 + respiratory symptoms amplifies pulmonary strain by 20%).
