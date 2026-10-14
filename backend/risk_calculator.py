"""
Multi-Factorial Clinical Risk Engine
Calculates explainable health risk scores (0-100), organ system attributions,
and stratified clinical risk tiers based on biometrics, symptoms, AQI, and lifestyle.
"""

from typing import Dict, List, Any


# Clinical Reference Ranges
NORMAL_RANGES = {
    "heart_rate": {"min": 60, "max": 100, "unit": "bpm"},
    "systolic_bp": {"min": 90, "max": 120, "unit": "mmHg"},
    "diastolic_bp": {"min": 60, "max": 80, "unit": "mmHg"},
    "spo2": {"min": 95, "max": 100, "unit": "%"},
    "temperature": {"min": 36.5, "max": 37.5, "unit": "°C"},
    "respiratory_rate": {"min": 12, "max": 20, "unit": "breaths/min"},
}

AQI_TIERS = [
    {"max": 50, "label": "Good", "risk_weight": 0},
    {"max": 100, "label": "Moderate", "risk_weight": 15},
    {"max": 150, "label": "Unhealthy for Sensitive Groups", "risk_weight": 40},
    {"max": 200, "label": "Unhealthy", "risk_weight": 70},
    {"max": 300, "label": "Very Unhealthy", "risk_weight": 90},
    {"max": 500, "label": "Hazardous", "risk_weight": 100},
]


def calculate_vital_risk(vitals: Dict[str, float]) -> Dict[str, Any]:
    """Evaluates vitals deviations from normal clinical thresholds."""
    points = 0.0
    flags = []

    hr = vitals.get("heart_rate", 75)
    if hr > 120:
        points += 30
        flags.append(f"Severe Tachycardia ({hr} bpm)")
    elif hr > 100:
        points += 18
        flags.append(f"Elevated Heart Rate ({hr} bpm)")
    elif hr < 50:
        points += 22
        flags.append(f"Bradycardia ({hr} bpm)")

    sbp = vitals.get("systolic_bp", 120)
    dbp = vitals.get("diastolic_bp", 80)
    if sbp >= 160 or dbp >= 100:
        points += 35
        flags.append(f"Stage 2 Hypertension ({sbp}/{dbp} mmHg)")
    elif sbp >= 130 or dbp >= 85:
        points += 20
        flags.append(f"Pre-Hypertensive Strain ({sbp}/{dbp} mmHg)")
    elif sbp < 90:
        points += 25
        flags.append(f"Hypotension ({sbp}/{dbp} mmHg)")

    spo2 = vitals.get("spo2", 98)
    if spo2 < 90:
        points += 40
        flags.append(f"Severe Hypoxemia ({spo2}%)")
    elif spo2 < 94:
        points += 25
        flags.append(f"Mild Hypoxemia ({spo2}%)")

    temp = vitals.get("temperature", 36.8)
    if temp >= 39.0:
        points += 25
        flags.append(f"High Fever ({temp}°C)")
    elif temp >= 38.0:
        points += 15
        flags.append(f"Pyrexia ({temp}°C)")

    resp = vitals.get("respiratory_rate", 16)
    if resp > 24:
        points += 25
        flags.append(f"Tachypnea ({resp} bpm)")
    elif resp < 10:
        points += 20
        flags.append(f"Bradypnea ({resp} bpm)")

    score = min(100.0, points)
    return {"score": score, "flags": flags}


def calculate_aqi_risk(aqi: float) -> Dict[str, Any]:
    """Calculates risk based on US EPA AQI brackets."""
    matched_tier = AQI_TIERS[-1]
    for tier in AQI_TIERS:
        if aqi <= tier["max"]:
            matched_tier = tier
            break

    score = float(matched_tier["risk_weight"])
    return {
        "score": score,
        "aqi_tier": matched_tier["label"],
        "aqi_value": aqi,
    }


def calculate_symptom_risk(symptoms: List[str]) -> Dict[str, Any]:
    """Evaluates multi-system symptom severity burden."""
    symptom_weights = {
        "chest_pain": 35,
        "shortness_of_breath": 30,
        "dizziness": 20,
        "severe_headache": 20,
        "persistent_cough": 18,
        "palpitations": 22,
        "fatigue": 12,
        "nausea": 12,
        "joint_pain": 10,
        "fever": 15,
        "wheezing": 25,
    }

    total_weight = 0
    active_symptoms = []
    for s in symptoms:
        clean = s.lower().strip().replace(" ", "_")
        weight = symptom_weights.get(clean, 15)
        total_weight += weight
        active_symptoms.append(s)

    score = min(100.0, total_weight)
    return {"score": score, "active": active_symptoms}


def calculate_lifestyle_risk(lifestyle: Dict[str, Any]) -> Dict[str, Any]:
    """Calculates lifestyle risk modifier."""
    score = 0.0

    if lifestyle.get("smoking", False):
        score += 45
    if lifestyle.get("sedentary", False):
        score += 25

    sleep = lifestyle.get("sleep_hours", 7.5)
    if sleep < 5.0 or sleep > 11.0:
        score += 20
    elif sleep < 6.5:
        score += 10

    water = lifestyle.get("water_liters", 2.5)
    if water < 1.2:
        score += 15

    return {"score": min(100.0, score)}


def evaluate_health_risk(
    vitals: Dict[str, float],
    symptoms: List[str],
    aqi: float = 45.0,
    lifestyle: Dict[str, Any] = None,
) -> Dict[str, Any]:
    """
    Computes overall multi-factorial risk with cross-synergy multipliers:
      - Vitals: 35% weight
      - Symptoms: 30% weight
      - Environmental AQI: 25% weight
      - Lifestyle: 10% weight
    """
    if lifestyle is None:
        lifestyle = {}

    vital_res = calculate_vital_risk(vitals)
    symptom_res = calculate_symptom_risk(symptoms)
    aqi_res = calculate_aqi_risk(aqi)
    lifestyle_res = calculate_lifestyle_risk(lifestyle)

    v_score = vital_res["score"]
    s_score = symptom_res["score"]
    e_score = aqi_res["score"]
    l_score = lifestyle_res["score"]

    raw_score = (v_score * 0.35) + (s_score * 0.30) + (e_score * 0.25) + (l_score * 0.10)

    # Synergy Multipliers
    synergy_factor = 1.0
    # AQI > 150 combined with respiratory symptoms amplifies pulmonary strain
    respiratory_keys = ["shortness_of_breath", "persistent_cough", "wheezing"]
    has_resp = any(k in [s.lower().replace(" ", "_") for s in symptoms] for k in respiratory_keys)

    if aqi > 150 and has_resp:
        synergy_factor += 0.20

    # Hypertension combined with chest pain or tachycardia
    sbp = vitals.get("systolic_bp", 120)
    hr = vitals.get("heart_rate", 75)
    if sbp >= 140 and (hr > 100 or "chest_pain" in [s.lower().replace(" ", "_") for s in symptoms]):
        synergy_factor += 0.25

    final_score = min(100.0, round(raw_score * synergy_factor, 1))

    # Stratified Tier
    if final_score < 25:
        tier = "Low Risk"
        color = "#10b981"
        urgency = "Routine / Maintenance"
    elif final_score < 50:
        tier = "Moderate Risk"
        color = "#f59e0b"
        urgency = "Proactive Monitoring"
    elif final_score < 75:
        tier = "High Risk"
        color = "#f97316"
        urgency = "Clinical Evaluation Advised"
    else:
        tier = "Urgent Alert"
        color = "#ef4444"
        urgency = "Immediate Medical Attention Recommended"

    # Multi-system attribution percentages
    total_raw = (v_score * 0.35) + (s_score * 0.30) + (e_score * 0.25) + (l_score * 0.10) or 1.0
    attribution = {
        "hemodynamics_vitals": round(((v_score * 0.35) / total_raw) * 100, 1),
        "symptom_burden": round(((s_score * 0.30) / total_raw) * 100, 1),
        "environmental_aqi": round(((e_score * 0.25) / total_raw) * 100, 1),
        "lifestyle_habits": round(((l_score * 0.10) / total_raw) * 100, 1),
    }

    # Generate Structured Paragraph Advisory
    advisory_p1 = (
        f"Your biometric assessment yielded an aggregated clinical risk score of {final_score}/100, "
        f"placing physiological status within the '{tier}' stratum. Primary contributors indicate {vital_res['flags'][0] if vital_res['flags'] else 'stable hemodynamic baselines'}, "
        f"with ambient air pollution measuring an AQI of {aqi} ({aqi_res['aqi_tier']})."
    )

    advisory_p2 = (
        f"Attribution modeling reveals that vital metrics contribute {attribution['hemodynamics_vitals']}% of overall risk, "
        f"while environmental atmospheric exposure accounts for {attribution['environmental_aqi']}%. "
        + ("Respiratory cross-synergy is detected between ambient particulates and pulmonary airway response. " if aqi > 100 and has_resp else "")
        + "Microvascular perfusion and organ oxygenation remain sensitive to ambient air pollution."
    )

    advisory_p3 = (
        f"Recommendation: {urgency}. Maintain optimal indoor filtration with HEPA air purifiers, "
        "ensure hydration exceeding 2.5 liters daily, and consult a qualified healthcare professional if vitals diverge from clinical baselines."
    )

    return {
        "risk_score": final_score,
        "risk_tier": tier,
        "color": color,
        "urgency": urgency,
        "synergy_multiplier": round(synergy_factor, 2),
        "attribution": attribution,
        "vital_flags": vital_res["flags"],
        "advisory": {
            "paragraph_1": advisory_p1,
            "paragraph_2": advisory_p2,
            "paragraph_3": advisory_p3,
            "full_prose": f"{advisory_p1}\n\n{advisory_p2}\n\n{advisory_p3}",
        },
    }
