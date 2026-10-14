"""
Smart Health Advisory System - FastAPI Backend
Provides:
  - Streaming AI Chatbot API (/ask-stream)
  - Medical / Scientific PDF Upload & RAG Vector Indexing (/upload)
  - Explainable Clinical Risk Engine (/api/health-risk)
  - Multi-System Anatomy & Symptom Analysis (/api/anatomy/systems, /api/symptom-analysis)
  - Environmental AQI Health Modeling (/api/aqi)
"""

import asyncio
import json
from typing import Dict, List, Any, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
try:
    from .rag_engine import rag_engine
    from .risk_calculator import evaluate_health_risk, NORMAL_RANGES, AQI_TIERS
except ImportError:
    from rag_engine import rag_engine
    from risk_calculator import evaluate_health_risk, NORMAL_RANGES, AQI_TIERS

app = FastAPI(
    title="Smart Health Advisory System API",
    description="Biomedical Informatics, 3D Anatomy & Environmental Risk Modeling Backend",
    version="1.0.0",
)

# Enable CORS for frontend applications (Vite, GitHub Pages, local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request Models ---
class QuestionRequest(BaseModel):
    question: str


class RiskEvaluationRequest(BaseModel):
    vitals: Dict[str, float]
    symptoms: List[str] = []
    aqi: float = 45.0
    lifestyle: Dict[str, Any] = {}


class SymptomAnalysisRequest(BaseModel):
    symptoms: List[str]


# --- Comprehensive Anatomical & Clinical Knowledge Base ---
ANATOMY_KNOWLEDGE = {
    "cardiovascular": {
        "title": "Cardiovascular System & Hemodynamics",
        "organs": ["Heart", "Aorta", "Microvascular Capillaries", "Vena Cava"],
        "summary": "Pumps approximately 5 liters of blood per minute through a 60,000-mile vascular network.",
        "metrics": "Resting HR: 60–100 bpm • Normal Arterial BP: 120/80 mmHg",
        "aqi_impact": "Ultrafine PM2.5 particulates penetrate alveolar-capillary membranes into blood, triggering endothelial inflammation, arterial stiffness, and elevated myocardial strain.",
    },
    "respiratory": {
        "title": "Respiratory Mechanics & Gas Exchange",
        "organs": ["Trachea", "Bronchi", "Lungs", "Alveoli (300M sacs)"],
        "summary": "Provides 70 m² of gas exchange surface area via microscopic alveolar-capillary barriers.",
        "metrics": "SpO₂: ≥95% • Respiratory Rate: 12–20 breaths/min",
        "aqi_impact": "AQI > 150 triggers acute airway hyperreactivity, bronchoconstriction, and systemic hypoxemia in vulnerable populations.",
    },
    "nervous": {
        "title": "Nervous System & Neuro-Autonomic Homeostasis",
        "organs": ["Brain (Cerebrum, Cerebellum, Brainstem)", "Spinal Cord", "Cranial Nerves"],
        "summary": "Electrochemical signaling core containing 86 billion interconnected neurons.",
        "metrics": "Cerebral Blood Flow: ~750 mL/min • Sleep Baseline: 7.5–9 hours",
        "aqi_impact": "Airborne nano-particulates can bypass the blood-brain barrier via olfactory pathways, exacerbating neuroinflammation and migraines.",
    },
    "musculoskeletal": {
        "title": "Musculoskeletal Frame & 206 Articulated Bones",
        "organs": ["Axial Skeleton (80 bones)", "Appendicular Skeleton (126 bones)", "600+ Muscles"],
        "summary": "Engineered for biomechanical leverage, vital organ protection, and calcium/phosphate mineral reservoir.",
        "metrics": "206 Articulated Bones • Femur load tolerance: >30× body weight",
        "aqi_impact": "Indoor confinement during high smog days contributes to sedentary posture loading and reduced bone mineral stimulation.",
    },
    "renal": {
        "title": "Renal & Excretory System",
        "organs": ["Kidneys (2M nephrons)", "Renal Arteries", "Ureters", "Bladder"],
        "summary": "Filters 180 liters of blood plasma daily, maintaining systemic fluid, electrolyte, and acid-base equilibrium.",
        "metrics": "Glomerular Filtration Rate (GFR): ≥90 mL/min",
        "aqi_impact": "Microvascular hypertensive strain from particulate exposure accelerates renal glomerulosclerosis.",
    },
    "digestive": {
        "title": "Digestive & Hepatic Metabolism",
        "organs": ["Stomach", "Liver", "Pancreas", "Intestines"],
        "summary": "Facilitates nutrient enzymatic hydrolysis, glycogen storage, and biochemical hepatic detoxification.",
        "metrics": "Hydration Goal: 2.5–3.2 Liters/day • Balanced Glycemic Index",
        "aqi_impact": "Systemic oxidative stress alters gut microbiome diversity and enteric barrier permeability.",
    },
}


# --- API Routes ---

@app.get("/")
def read_root():
    """Health check endpoint."""
    return {
        "status": "online",
        "system": "Smart Health Advisory System API",
        "version": "1.0.0",
        "rag_documents_indexed": len(rag_engine.documents),
        "rag_chunks_total": len(rag_engine.chunks),
        "endpoints": [
            "/ask-stream",
            "/upload",
            "/api/health-risk",
            "/api/anatomy/systems",
            "/api/symptom-analysis",
            "/api/aqi",
        ],
    }


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Uploads and indexes a medical/scientific PDF or TXT file into the RAG vector index.
    """
    if not file.filename.lower().endswith((".pdf", ".txt", ".md")):
        raise HTTPException(status_code=400, detail="Only PDF, TXT, or MD files are supported.")

    contents = await file.read()
    chunks_indexed = rag_engine.index_document(file.filename, contents)

    return {
        "success": True,
        "filename": file.filename,
        "chunks": chunks_indexed,
        "message": f"Successfully parsed and indexed {chunks_indexed} document chunks in vector knowledge base.",
    }


@app.post("/ask-stream")
async def ask_stream(payload: QuestionRequest):
    """
    Streams an explainable, structured AI response.
    If an uploaded document exists, retrieves relevant context chunks and cites sources.
    Otherwise, references the multi-system clinical knowledge base.
    """
    query = payload.question.strip()

    # Check for relevant context in uploaded documents
    rag_results = rag_engine.search(query, top_k=3)
    sources = []
    rag_context = ""

    if rag_results:
        sources = [{"source": r["source"], "page": r["page"]} for r in rag_results]
        rag_context = "\n\n".join([f"[From {r['source']}, Page {r['page']}]: {r['text']}" for r in rag_results])

    # Generate response content
    q_lower = query.lower()

    if rag_context:
        response_text = (
            f"### 📄 Document Intelligence Analysis\n\n"
            f"Based on your indexed document materials, here is the synthesized clinical context:\n\n"
            f"{rag_results[0]['text']}\n\n"
            f"**Key Document Findings:**\n"
            f"- **Context Alignment:** Correlated with {len(rag_results)} verified passages.\n"
            f"- **Primary Reference:** {rag_results[0]['source']} (Page {rag_results[0]['page']}).\n\n"
            f"💡 **Tip:** Ask follow-up questions to explore specific sections or therapeutic protocols within this document!"
        )
    elif any(k in q_lower for k in ["heart", "cardio", "bp", "blood pressure", "pulse", "palpitation"]):
        sys_info = ANATOMY_KNOWLEDGE["cardiovascular"]
        response_text = (
            f"### 🫀 {sys_info['title']}\n\n"
            f"{sys_info['summary']}\n\n"
            f"**Clinical Baseline & Key Metrics:**\n"
            f"- **Normative Metrics:** {sys_info['metrics']}\n"
            f"- **Major Organs:** {', '.join(sys_info['organs'])}\n"
            f"- **Environmental Vulnerability:** {sys_info['aqi_impact']}\n\n"
            f"💡 **Clinical Tip:** Open the **AI Health Advisor** in the top navigation to evaluate your cardiovascular risk score based on vitals and local AQI!"
        )
    elif any(k in q_lower for k in ["lung", "respiratory", "breath", "aqi", "pm2.5", "cough", "spo2", "asthma"]):
        sys_info = ANATOMY_KNOWLEDGE["respiratory"]
        response_text = (
            f"### 🫁 {sys_info['title']}\n\n"
            f"{sys_info['summary']}\n\n"
            f"**Pulmonary Function & Air Quality Impact:**\n"
            f"- **Normative Metrics:** {sys_info['metrics']}\n"
            f"- **Anatomical Highway:** {', '.join(sys_info['organs'])}\n"
            f"- **Atmospheric Smog Risk:** {sys_info['aqi_impact']}\n\n"
            f"💡 **Interactive 3D Tip:** Select the *Smog & Respiratory* preset in the AI Health Advisor to isolate bronchial and lung risk in 3D!"
        )
    elif any(k in q_lower for k in ["brain", "nerve", "headache", "migraine", "dizziness", "stress", "sleep"]):
        sys_info = ANATOMY_KNOWLEDGE["nervous"]
        response_text = (
            f"### 🧠 {sys_info['title']}\n\n"
            f"{sys_info['summary']}\n\n"
            f"**Neuro-Signaling & Autonomic Coordination:**\n"
            f"- **Key Metrics:** {sys_info['metrics']}\n"
            f"- **Central Structures:** {', '.join(sys_info['organs'])}\n"
            f"- **Air Pollution Stress:** {sys_info['aqi_impact']}\n\n"
            f"💡 **Interactive 3D Tip:** Toggle the **Nervous System** layer in the left sidebar to trace major cranial nerves and the spinal cord in 3D!"
        )
    elif any(k in q_lower for k in ["bone", "skeleton", "femur", "knee", "patella", "joint", "spine"]):
        sys_info = ANATOMY_KNOWLEDGE["musculoskeletal"]
        response_text = (
            f"### 🦴 {sys_info['title']}\n\n"
            f"{sys_info['summary']}\n\n"
            f"**Biomechanical Load Distribution:**\n"
            f"- **Articulated Framework:** {sys_info['metrics']}\n"
            f"- **Structural Scaffolding:** {', '.join(sys_info['organs'])}\n"
            f"- **Lifestyle Biomechanics:** {sys_info['aqi_impact']}\n\n"
            f"💡 **Interactive 3D Tip:** Click directly on any bone in the 3D viewport or turn off the **Skin** layer to inspect the 206 articulated bones!"
        )
    elif any(k in q_lower for k in ["risk", "score", "algorithm", "calculate", "heuristic", "multiplier", "formula"]):
        response_text = (
            "### 🧬 AI Health Risk Engine & Clinical Attribution Matrix\n\n"
            "Our multi-factorial risk engine computes a continuous 0–100 health risk score and stratified tier:\n\n"
            "- **Multi-Factorial Weighting:**\n"
            "  • **Physiological Vitals (35%):** Heart rate, SpO₂ hypoxemia, systolic/diastolic blood pressure, respiratory rate.\n"
            "  • **Symptom Presentation (30%):** Weighted cross-system symptom burden (chest pain, dyspnea, fatigue, dizziness).\n"
            "  • **Environmental AQI & PM2.5 (25%):** Atmospheric particulate tiers directly linked to pulmonary and cardiovascular strain.\n"
            "  • **Lifestyle & Habits (10%):** Tobacco use, physical activity, hydration index, and sleep duration.\n"
            "- **Cross-Factor Synergy Multipliers:** When ambient AQI exceeds 150 alongside respiratory symptoms, pulmonary risk is amplified by 25%.\n"
            "- **Multi-System Attribution:** Decomposes risk proportionally across Hemodynamics, Symptoms, Environment, and Lifestyle.\n\n"
            "💡 **Clinical Tip:** Open the **AI Health Advisor** from the top bar to run a personalized health risk assessment!"
        )
    else:
        response_text = (
            f"### 💡 Clinical Informatics Insights: '{query[:40]}...'\n\n"
            "Human physiology functions as an interconnected multi-system network where biometrics and external environmental pollutants interact dynamically:\n\n"
            "- **Cardiopulmonary Balance:** Heart rate and oxygen saturation (SpO₂) provide instantaneous feedback on cellular tissue perfusion.\n"
            "- **Environmental Vulnerability:** Fine airborne particulates (PM2.5) directly challenge alveolar capillary barriers and promote vascular inflammation.\n"
            "- **Holistic Health Management:** Regular cardiovascular exercise, adequate hydration (>2.5 L/day), and monitoring local AQI preserve organ vitality.\n\n"
            "💡 **Tip:** You can ask about any specific organ system (Heart, Lungs, Brain, Kidneys, Skeleton), or upload a medical PDF to ask cited questions!"
        )

    # Stream the response word by word in NDJSON format expected by ChatbotWidget
    async def stream_generator():
        words = response_text.split(" ")
        for i, word in enumerate(words):
            chunk = (word + " ") if i < len(words) - 1 else word
            payload_data = {"text": chunk}
            if i == 0 and sources:
                payload_data["sources"] = sources
            yield json.dumps(payload_data) + "\n"
            await asyncio.sleep(0.015)  # Smooth real-time streaming effect

    return StreamingResponse(stream_generator(), media_type="application/x-ndjson")


@app.post("/api/health-risk")
def api_health_risk(payload: RiskEvaluationRequest):
    """
    Evaluates multi-factorial health risk score (0-100), risk tier,
    attribution matrix, and generates a cohesive 3-paragraph clinical prose advisory.
    """
    return evaluate_health_risk(
        vitals=payload.vitals,
        symptoms=payload.symptoms,
        aqi=payload.aqi,
        lifestyle=payload.lifestyle,
    )


@app.get("/api/anatomy/systems")
def api_anatomy_systems():
    """Returns details and clinical metrics across all primary organ systems."""
    return {
        "systems": ANATOMY_KNOWLEDGE,
        "normal_ranges": NORMAL_RANGES,
        "aqi_tiers": AQI_TIERS,
    }


@app.post("/api/symptom-analysis")
def api_symptom_analysis(payload: SymptomAnalysisRequest):
    """Evaluates cross-system symptom burden and organ attribution."""
    symptoms = [s.lower().strip() for s in payload.symptoms]
    organ_impact = {
        "heart": 0,
        "lungs": 0,
        "brain": 0,
        "stomach": 0,
        "kidneys": 0,
    }

    if "chest_pain" in symptoms or "palpitations" in symptoms:
        organ_impact["heart"] += 45
    if "shortness_of_breath" in symptoms or "wheezing" in symptoms or "cough" in symptoms:
        organ_impact["lungs"] += 50
    if "dizziness" in symptoms or "headache" in symptoms or "fatigue" in symptoms:
        organ_impact["brain"] += 35
    if "nausea" in symptoms:
        organ_impact["stomach"] += 30

    primary_organ = max(organ_impact.items(), key=lambda x: x[1])

    return {
        "analyzed_symptoms": symptoms,
        "organ_impact_scores": organ_impact,
        "primary_organ_at_risk": primary_organ[0] if primary_organ[1] > 0 else "None",
        "total_symptom_count": len(symptoms),
    }


@app.get("/api/aqi")
def api_aqi(city: Optional[str] = "London", aqi: Optional[float] = 45.0):
    """Returns environmental air quality tier and health precautions."""
    tier = "Good"
    for t in AQI_TIERS:
        if aqi <= t["max"]:
            tier = t["label"]
            break

    return {
        "city": city,
        "aqi": aqi,
        "tier": tier,
        "sensitive_groups_advised": aqi > 100,
        "mask_recommended": aqi > 150,
        "indoor_air_purifier_recommended": aqi > 100,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
