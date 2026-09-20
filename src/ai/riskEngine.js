/**
 * AI Health Risk Assessment Engine — Smart Health Advisory System
 *
 * Implementation: Rule-based weighted scoring system (NOT a trained ML model).
 * This engine deterministically maps user inputs to a risk score using
 * clinically-inspired heuristics and transparent weighting rules.
 *
 * Score Range:  0–100
 * Risk Tiers:   LOW (0–24) | MODERATE (25–49) | HIGH (50–74) | URGENT (75–100)
 *
 * MEDICAL DISCLAIMER: This system provides educational health-risk guidance
 * based on the entered information. It is not a medical diagnosis and does
 * not replace professional medical advice.
 */

import { getAqiCategory, VITALS_RANGES, SYSTEM_DISPLAY_META } from './healthRules.js';
import { analyzeSymptoms } from './symptomAnalysis.js';

// ─── Weight Configuration ─────────────────────────────────────────────────────
// These weights define how much each domain contributes to the aggregate score.
// They sum to 1.0 (100%).
const WEIGHTS = {
  vitals:    0.35,  // Physiological vitals (HR, BP, SpO2, RR, Temp)
  symptoms:  0.30,  // User-reported symptom burden
  env:       0.20,  // Environmental air quality (AQI + pollutants)
  lifestyle: 0.15,  // Lifestyle & body measurement factors (BMI, smoking, etc.)
};

// ─── Main Exported Function ───────────────────────────────────────────────────
export function calculateHealthRisk({
  demographics = { age: 30, gender: 'male', height: 175, weight: 70 },
  symptoms = [],
  vitals = { heartRate: 75, spo2: 98, systolicBP: 120, diastolicBP: 80, respiratoryRate: 16, bodyTemp: 36.8 },
  environmental = { aqi: 45, pm25: 12, pm10: 25, co: 0.5, no2: 18, so2: 5, o3: 22 },
  lifestyle = { smoking: 'never', exercise: 'moderate', sleep: 7.5, water: 2.5 }
}) {

  // ── 1. BMI Calculation ─────────────────────────────────────────────────────
  const hM = Math.max(1, (demographics.height || 170) / 100);
  const wKg = demographics.weight || 70;
  const bmi = parseFloat((wKg / (hM * hM)).toFixed(1));

  // ── 2. Vitals Risk Score (0–100) ───────────────────────────────────────────
  let vitalsScore = 0;
  const vitalDeviations = [];

  // Heart Rate (BPM)
  const hr = Number(vitals.heartRate) || 75;
  if (hr > VITALS_RANGES.heartRate.criticalHigh || hr < VITALS_RANGES.heartRate.criticalLow) {
    vitalsScore += 35;
    vitalDeviations.push(`Atypical Heart Rate (${hr} BPM)`);
  } else if (hr > VITALS_RANGES.heartRate.maxNorm || hr < VITALS_RANGES.heartRate.minNorm) {
    vitalsScore += 18;
    vitalDeviations.push(`Borderline Heart Rate (${hr} BPM)`);
  }

  // Blood Oxygen Saturation (SpO2)
  const spo2 = Number(vitals.spo2) || 98;
  if (spo2 < VITALS_RANGES.spo2.criticalLow) {
    vitalsScore += 45;
    vitalDeviations.push(`Hypoxemic Blood Oxygen (${spo2}%)`);
  } else if (spo2 < VITALS_RANGES.spo2.minNorm) {
    vitalsScore += 24;
    vitalDeviations.push(`Sub-optimal Oxygen Saturation (${spo2}%)`);
  }

  // Blood Pressure (mmHg)
  const sys = Number(vitals.systolicBP) || 120;
  const dia = Number(vitals.diastolicBP) || 80;
  if (sys >= 160 || dia >= 100) {
    vitalsScore += 35;
    vitalDeviations.push(`Hypertensive Crisis BP (${sys}/${dia} mmHg)`);
  } else if (sys >= 140 || dia >= 90) {
    vitalsScore += 25;
    vitalDeviations.push(`Elevated Blood Pressure (${sys}/${dia} mmHg)`);
  } else if (sys < 90 || dia < 60) {
    vitalsScore += 15;
    vitalDeviations.push(`Hypotensive Blood Pressure (${sys}/${dia} mmHg)`);
  }

  // Respiratory Rate (breaths/min)
  const rr = Number(vitals.respiratoryRate) || 16;
  if (rr > 24 || rr < 10) {
    vitalsScore += 25;
    vitalDeviations.push(`Abnormal Respiratory Rate (${rr} bpm)`);
  } else if (rr > 20 || rr < 12) {
    vitalsScore += 12;
    vitalDeviations.push(`Borderline Respiratory Rate (${rr} bpm)`);
  }

  // Body Temperature (°C)
  const temp = Number(vitals.bodyTemp) || 36.8;
  if (temp >= 39.5) {
    vitalsScore += 35;
    vitalDeviations.push(`High Fever (${temp}°C)`);
  } else if (temp >= 38.5) {
    vitalsScore += 25;
    vitalDeviations.push(`Febrile Hyperthermia (${temp}°C)`);
  } else if (temp >= 37.8) {
    vitalsScore += 12;
    vitalDeviations.push(`Low-grade Fever (${temp}°C)`);
  } else if (temp < 36.0) {
    vitalsScore += 15;
    vitalDeviations.push(`Hypothermic Temperature (${temp}°C)`);
  }

  vitalsScore = Math.min(100, vitalsScore);

  // ── 3. Symptom Analysis (0–100) ────────────────────────────────────────────
  const symptomData = analyzeSymptoms(symptoms);
  const symptomScore = symptomData.totalSymptomScore;

  // ── 4. Environmental Risk Score (0–100) ────────────────────────────────────
  // Use the AQI category's defined 'factor' (0.05 for Good → 1.0 for Hazardous)
  // instead of a raw linear formula. This ensures Good AQI contributes minimally.
  const aqiVal = Number(environmental.aqi) || 0;
  const aqiCat = getAqiCategory(aqiVal);

  // Base environmental score from AQI category factor (0–100 scale)
  let envScore = Math.round(aqiCat.factor * 100);

  // Additional pollutant penalties (only add when genuinely elevated)
  const pm25 = Number(environmental.pm25) || 0;
  const pm10 = Number(environmental.pm10) || 0;
  const co   = Number(environmental.co)   || 0;
  const no2  = Number(environmental.no2)  || 0;

  // PM2.5 >35 µg/m³ = WHO 24h guideline exceeded (moderate concern)
  // PM2.5 >60 = significant; >150 = severe
  if (pm25 > 150) envScore += 20;
  else if (pm25 > 60)  envScore += 12;
  else if (pm25 > 35)  envScore += 5;

  // PM10 >100 µg/m³ indicates significant coarse particulate exposure
  if (pm10 > 150) envScore += 10;
  else if (pm10 > 100) envScore += 5;

  // CO >9 ppm (WHO 8h guideline) is a concern
  if (co > 9) envScore += 15;
  else if (co > 4) envScore += 5;

  // NO2 >53 ppb (EPA annual) — elevated urban exposure
  if (no2 > 100) envScore += 10;
  else if (no2 > 53) envScore += 5;

  envScore = Math.min(100, envScore);

  // ── 5. Lifestyle & Body Measurement Risk (0–100) ──────────────────────────
  // BMI contribution (obesity increases cardiovascular and metabolic load)
  let lifestyleRisk = 0;

  if (bmi >= 40) lifestyleRisk += 35;      // Severe obesity
  else if (bmi >= 35) lifestyleRisk += 25; // Obesity Class II
  else if (bmi >= 30) lifestyleRisk += 18; // Obesity Class I
  else if (bmi >= 25) lifestyleRisk += 8;  // Overweight
  else if (bmi < 18.5) lifestyleRisk += 10; // Underweight

  // Smoking status
  if (lifestyle.smoking === 'regular')    lifestyleRisk += 30;
  else if (lifestyle.smoking === 'occasional') lifestyleRisk += 12;

  // Physical activity level
  if (lifestyle.exercise === 'none')      lifestyleRisk += 18;
  else if (lifestyle.exercise === 'rare') lifestyleRisk += 10;
  // 'moderate' = 0 penalty; 'frequent' = 0 penalty (protective but not scored here)

  // Sleep duration
  if (lifestyle.sleep < 5 || lifestyle.sleep > 10) lifestyleRisk += 15;
  else if (lifestyle.sleep < 6 || lifestyle.sleep > 9) lifestyleRisk += 8;

  // Hydration
  if (lifestyle.water < 1.0) lifestyleRisk += 12;
  else if (lifestyle.water < 1.5) lifestyleRisk += 6;

  lifestyleRisk = Math.min(100, lifestyleRisk);

  // ── 6. Cross-Domain Synergy Amplifiers ────────────────────────────────────
  // When multiple high-risk domains align, the combined effect is amplified.
  let synergyMultiplier = 1.0;

  // High AQI + respiratory symptoms + low SpO2 = compounding pulmonary risk
  if (aqiVal > 150 && (symptoms.includes('cough') || symptoms.includes('shortness_of_breath') || spo2 < 95)) {
    synergyMultiplier += 0.20;
  }

  // Cardiac symptoms + abnormal vitals = compounding cardiovascular risk
  if ((symptoms.includes('chest_pain') || symptoms.includes('palpitations')) && (hr > 100 || sys > 140)) {
    synergyMultiplier += 0.15;
  }

  // Fever + systemic symptoms = infection/illness amplifier
  if (symptoms.includes('fever') && (symptoms.includes('fatigue') || symptoms.includes('cough'))) {
    synergyMultiplier += 0.10;
  }

  synergyMultiplier = Math.min(1.5, synergyMultiplier); // Cap at 50% amplification

  // ── 7. Weighted Aggregate Risk Score ──────────────────────────────────────
  const weightedComponents = {
    vitals:    vitalsScore    * WEIGHTS.vitals,
    symptoms:  symptomScore   * WEIGHTS.symptoms,
    env:       envScore       * WEIGHTS.env,
    lifestyle: lifestyleRisk  * WEIGHTS.lifestyle,
  };
  const baseScore = Object.values(weightedComponents).reduce((a, b) => a + b, 0);
  const totalScore = Math.min(100, Math.round(baseScore * synergyMultiplier));

  // ── 8. Risk Tier Classification ───────────────────────────────────────────
  let riskLevel, riskColor;

  // Override for critical single-vital conditions
  if (spo2 < 88 || hr > 140 || sys > 180) {
    riskLevel = 'URGENT';
    riskColor = '#ef4444';
  } else if (totalScore >= 75) {
    riskLevel = 'URGENT';
    riskColor = '#ef4444';
  } else if (totalScore >= 50) {
    riskLevel = 'HIGH';
    riskColor = '#f97316';
  } else if (totalScore >= 25) {
    riskLevel = 'MODERATE';
    riskColor = '#f59e0b';
  } else {
    riskLevel = 'LOW';
    riskColor = '#10b981';
  }

  // ── 9. Primary System Determination ──────────────────────────────────────
  // Priority order: symptom scores → vital sign pattern → AQI → general wellness
  let primarySystem = symptomData.primarySystem; // null if no symptoms

  if (!primarySystem) {
    // No symptoms: derive from vital sign deviations
    if (vitalsScore > 10) {
      const hasCardiacVitalDeviation = hr > 100 || hr < 55 || sys > 135 || sys < 90;
      const hasRespiratoryVitalDeviation = spo2 < 95 || rr > 20 || rr < 12;

      if (hasCardiacVitalDeviation && !hasRespiratoryVitalDeviation) {
        primarySystem = 'circulatory';
      } else if (hasRespiratoryVitalDeviation && !hasCardiacVitalDeviation) {
        primarySystem = 'respiratory';
      } else if (hasCardiacVitalDeviation && hasRespiratoryVitalDeviation) {
        // Both: pick based on severity
        primarySystem = spo2 < 95 ? 'respiratory' : 'circulatory';
      } else {
        // Other vital deviations (temp, etc.) — general
        primarySystem = 'general';
      }
    } else if (aqiVal > 150) {
      // High AQI with no symptoms → flag respiratory as at-risk exposure zone
      primarySystem = 'respiratory';
    } else if (aqiVal > 100) {
      // Moderately poor AQI, no symptoms → respiratory exposure advisory
      primarySystem = 'respiratory';
    } else {
      // No symptoms, normal vitals, Good/Moderate AQI → no specific system risk
      primarySystem = 'general';
    }
  }

  const systemMeta = SYSTEM_DISPLAY_META[primarySystem] || SYSTEM_DISPLAY_META.general;

  // Resolve organ — use symptom-specific organ if available, else system default
  let targetOrgan = systemMeta.organ;
  if (symptomData.activeSymptoms.length > 0) {
    // Find the organ from the highest-weight active symptom in the primary system
    const primarySymptoms = symptomData.activeSymptoms
      .filter(s => s.system === primarySystem && s.organ)
      .sort((a, b) => b.weight - a.weight);
    if (primarySymptoms.length > 0) targetOrgan = primarySymptoms[0].organ;
  }
  // Ensure targetOrgan is a valid 3D model organ name
  const VALID_ORGANS = ['brain', 'heart', 'lungs', 'liver', 'stomach', 'kidneys', 'intestines', 'skeleton'];
  if (!VALID_ORGANS.includes(targetOrgan)) targetOrgan = systemMeta.organ;
  if (!VALID_ORGANS.includes(targetOrgan)) targetOrgan = 'heart'; // final fallback

  const targetRegion = systemMeta.region;

  // ── 10. System Matrix (all 6 systems scored transparently) ────────────────
  // Each system score is computed from real inputs, NOT randomized.
  const systemMatrix = computeSystemMatrix({
    symptomSystemScores: symptomData.systemScores,
    vitalsScore, envScore, lifestyleRisk,
    hr, sys, dia, spo2, rr, temp, aqiVal,
    symptoms, primarySystem
  });

  // ── 11. Factor Attribution ────────────────────────────────────────────────
  // Show the proportion of each domain's weighted contribution to the final score.
  // This tells the user WHY the risk score is what it is.
  const totalWeighted = weightedComponents.vitals + weightedComponents.symptoms +
                        weightedComponents.env + weightedComponents.lifestyle || 1;

  const contributingFactors = [
    {
      name: 'Vitals & Hemodynamics',
      weight: Math.round((weightedComponents.vitals    / totalWeighted) * 100),
      rawScore: vitalsScore,
      color: '#df4d64',
      note: vitalDeviations.length > 0 ? vitalDeviations.join('; ') : 'Parameters within acceptable range'
    },
    {
      name: 'Symptom Presentation',
      weight: Math.round((weightedComponents.symptoms  / totalWeighted) * 100),
      rawScore: symptomScore,
      color: '#f59e0b',
      note: symptomData.symptomCount > 0 ? `${symptomData.symptomCount} symptom(s) reported` : 'No symptoms reported'
    },
    {
      name: 'Air Quality (AQI / Pollutants)',
      weight: Math.round((weightedComponents.env       / totalWeighted) * 100),
      rawScore: envScore,
      color: '#00bcd4',
      note: `AQI ${aqiVal} — ${aqiCat.tier}`
    },
    {
      name: 'Lifestyle & Body Metrics',
      weight: Math.round((weightedComponents.lifestyle / totalWeighted) * 100),
      rawScore: lifestyleRisk,
      color: '#a855f7',
      note: buildLifestyleNote(bmi, lifestyle)
    },
  ];

  // ── 12. Recommendations & Warning Signs ───────────────────────────────────
  const { recommendations, warningSigns } = buildRecommendations({
    primarySystem, aqiVal, aqiCat, spo2, symptoms, lifestyle, hr, sys, riskLevel, bmi
  });

  // ── 13. Personalized Advisory Text ────────────────────────────────────────
  const advisoryText = generateAdvisoryParagraph({
    score: totalScore, level: riskLevel, primarySystem, systemMeta,
    vitals: { heartRate: hr, spo2, systolicBP: sys, diastolicBP: dia, respiratoryRate: rr, bodyTemp: temp },
    environmental: { aqi: aqiVal, pm25, aqiCat },
    lifestyle, demographics, bmi, vitalDeviations, symptoms, aqiCat
  });

  // ── 14. Explainability Summary ────────────────────────────────────────────
  const explainability = buildExplainability({
    primarySystem, systemMeta, riskLevel, totalScore,
    vitalDeviations, symptomData, aqiVal, aqiCat, bmi, lifestyle
  });

  return {
    score:       totalScore,
    level:       riskLevel,
    color:       riskColor,
    primarySystem,
    systemMeta,
    targetOrgan,
    targetRegion,
    bmi,
    aqiCategory:  aqiCat,
    systemMatrix,
    contributingFactors,
    vitalDeviations,
    recommendations,
    warningSigns,
    advisoryText,
    explainability,
    aqiSource: inputPayload?.aqiSource || null,
    disclaimer: 'This assessment is generated by a rule-based educational heuristic for wellness exploration only. It does not constitute medical diagnosis, clinical judgment, or emergency guidance. Consult a licensed healthcare provider for any health concerns.'
  };
}

// ─── System Matrix Builder ────────────────────────────────────────────────────
/**
 * Computes a score (0–100) for each body system from actual inputs.
 * No randomness. All values are deterministic and reflect user inputs.
 */
function computeSystemMatrix({ symptomSystemScores, vitalsScore, envScore, lifestyleRisk,
  hr, sys, dia, spo2, rr, temp, aqiVal, symptoms, primarySystem }) {

  // Base each system score on its symptom contribution (normalized to 0–100)
  // plus relevant vital sign and environmental contributions.

  const MAX_SYMPTOM_WEIGHT = 100; // symptomScores are already 0–100 scale

  // Respiratory: symptoms + AQI impact + SpO2 + RR
  const respSymptom = Math.min(100, (symptomSystemScores.respiratory || 0));
  const respVital   = (spo2 < 95 ? 30 : spo2 < 98 ? 10 : 0) + (rr > 20 ? 15 : rr < 12 ? 10 : 0);
  const respEnv     = Math.round(envScore * 0.6); // AQI affects lungs most directly
  const respiratory = Math.min(100, Math.round(respSymptom * 0.55 + respVital * 0.25 + respEnv * 0.20));

  // Cardiovascular: symptoms + HR + BP + AQI vascular effect
  const cardSymptom = Math.min(100, (symptomSystemScores.circulatory || 0));
  const cardVital   = (hr > 100 || hr < 55 ? 25 : 0) + (sys >= 140 || dia >= 90 ? 25 : sys >= 130 ? 10 : 0) +
                      (spo2 < 95 ? 10 : 0);
  const cardEnv     = Math.round(envScore * 0.3); // PM2.5 increases vascular inflammation
  const cardiovascular = Math.min(100, Math.round(cardSymptom * 0.50 + cardVital * 0.35 + cardEnv * 0.15));

  // Neurological: symptoms + SpO2 (brain hypoxia) + CO/AQI
  const neuroSymptom = Math.min(100, (symptomSystemScores.nervous || 0));
  const neuroVital   = (spo2 < 90 ? 30 : spo2 < 95 ? 10 : 0) + (temp >= 38.5 ? 15 : 0);
  const neuroEnv     = Math.round(envScore * 0.25); // CO competes for O2 binding
  const neurological = Math.min(100, Math.round(neuroSymptom * 0.60 + neuroVital * 0.25 + neuroEnv * 0.15));

  // Digestive: symptoms + lifestyle (dehydration, poor sleep)
  const digestSymptom   = Math.min(100, (symptomSystemScores.digestive || 0));
  const digestLifestyle = Math.round(lifestyleRisk * 0.5); // hydration/sleep strongly GI-relevant
  const digestive = Math.min(100, Math.round(digestSymptom * 0.65 + digestLifestyle * 0.35));

  // Musculoskeletal: symptoms + lifestyle (inactivity, BMI)
  const muscSymptom   = Math.min(100, (symptomSystemScores.muscular || 0));
  const muscLifestyle = Math.round(lifestyleRisk * 0.45);
  const musculoskeletal = Math.min(100, Math.round(muscSymptom * 0.60 + muscLifestyle * 0.40));

  // Renal/Urinary: symptoms + hydration
  const renalSymptom   = Math.min(100, (symptomSystemScores.urinary || 0));
  const renalLifestyle = Math.round(lifestyleRisk * 0.35);
  const renal = Math.min(100, Math.round(renalSymptom * 0.65 + renalLifestyle * 0.35));

  return {
    respiratory,
    circulatory: cardiovascular,
    nervous: neurological,
    digestive,
    muscular: musculoskeletal,
    urinary: renal,
  };
}

// ─── Lifestyle Note Builder ───────────────────────────────────────────────────
function buildLifestyleNote(bmi, lifestyle) {
  const notes = [];
  if (bmi >= 30) notes.push(`BMI ${bmi} (obese range)`);
  else if (bmi >= 25) notes.push(`BMI ${bmi} (overweight range)`);
  else notes.push(`BMI ${bmi} (healthy range)`);

  if (lifestyle.smoking === 'regular') notes.push('regular smoker');
  else if (lifestyle.smoking === 'occasional') notes.push('occasional smoker');

  if (lifestyle.exercise === 'none' || lifestyle.exercise === 'rare') notes.push('low physical activity');

  return notes.join(' · ');
}

// ─── Recommendations Builder ──────────────────────────────────────────────────
function buildRecommendations({ primarySystem, aqiVal, aqiCat, spo2, symptoms, lifestyle, hr, sys, riskLevel, bmi }) {
  const recommendations = [];
  const warningSigns = [];

  // AQI-based recommendations
  if (aqiVal > 200) {
    recommendations.push(`⚠ Very Unhealthy air quality (AQI ${aqiVal}): Avoid all outdoor activity. Use N95/KN95 respirators if going outside. Run indoor HEPA air filtration.`);
  } else if (aqiVal > 150) {
    recommendations.push(`Air quality is Unhealthy (AQI ${aqiVal}): Limit prolonged outdoor exertion. Sensitive individuals should stay indoors. Wear an N95 respirator if outdoors.`);
  } else if (aqiVal > 100) {
    recommendations.push(`Air quality is ${aqiCat.tier} (AQI ${aqiVal}): People with asthma, COPD, or cardiovascular conditions should reduce prolonged outdoor exposure.`);
  }

  // Respiratory symptoms
  if (symptoms.includes('shortness_of_breath') || symptoms.includes('wheezing')) {
    warningSigns.push('Shortness of breath or wheezing warrants clinical evaluation, especially if progressive or accompanied by chest discomfort.');
  }
  if (symptoms.includes('cough') && aqiVal > 100) {
    recommendations.push('Persistent cough in poor air quality may indicate airway irritation. Monitor symptom progression and reduce outdoor exposure.');
  }

  // Cardiovascular
  if (symptoms.includes('chest_pain')) {
    warningSigns.push('Chest discomfort or pressure is a clinically significant symptom. Seek immediate medical evaluation if severe, persistent, or radiating to arm/jaw.');
  }
  if (symptoms.includes('palpitations')) {
    recommendations.push('Palpitations may have many causes including anxiety, caffeine, or arrhythmia. Monitor frequency; seek evaluation if persistent.');
  }
  if (sys >= 140 || (hr > 100 && sys > 130)) {
    recommendations.push('Elevated blood pressure or heart rate detected in vitals. Reduce sodium, caffeine, and stress. Monitor daily and consult a provider.');
  }

  // Neurological
  if (symptoms.includes('headache') && symptoms.includes('dizziness')) {
    recommendations.push('Combined headache and dizziness may indicate circulatory or vestibular issues. Maintain hydration and rest. Seek evaluation if severe.');
  }
  if (symptoms.includes('headache') && !symptoms.includes('dizziness')) {
    recommendations.push('Headache may be related to tension, dehydration, or posture. Ensure adequate hydration, rest, and proper ergonomics.');
  }

  // Digestive
  if (symptoms.includes('acid_reflux') || symptoms.includes('nausea')) {
    recommendations.push('Digestive symptoms may be aggravated by dietary habits, stress, or irregular sleep. Maintain regular mealtimes and adequate hydration.');
  }

  // SpO2
  if (spo2 < 90) {
    warningSigns.push(`Critical: Blood oxygen saturation ${spo2}% indicates significant hypoxemia. Seek emergency medical evaluation immediately.`);
  } else if (spo2 < 95) {
    warningSigns.push(`SpO₂ at ${spo2}% is below optimal range. Monitor closely with a pulse oximeter and seek evaluation if declining.`);
  }

  // BMI
  if (bmi >= 30) {
    recommendations.push(`BMI of ${bmi} is in the obese range. Even modest weight reduction (5–10%) significantly reduces cardiovascular and metabolic risk.`);
  }

  // Smoking
  if (lifestyle.smoking === 'regular') {
    recommendations.push('Regular tobacco use significantly compounds both respiratory and cardiovascular risk. Cessation support resources are available and highly effective.');
  }

  // Sleep
  if (lifestyle.sleep < 6) {
    recommendations.push(`Sleep duration of ${lifestyle.sleep}h is below recommended minimum (7–9h). Chronic sleep deprivation impairs immune function and metabolic regulation.`);
  }

  // Default wellness recommendations if nothing specific
  if (recommendations.length === 0 && warningSigns.length === 0) {
    recommendations.push('Maintain consistent hydration (2–3 litres daily), 7–9 hours of quality sleep, and regular aerobic exercise.');
    recommendations.push('Monitor your regional AQI forecast before planning high-intensity outdoor exercise.');
  }

  return { recommendations, warningSigns };
}

// ─── Advisory Paragraph Generator ────────────────────────────────────────────
/**
 * Generates a personalized, multi-paragraph advisory based on actual computed results.
 * Each paragraph is driven by the real inputs — no hardcoded generic text.
 */
function generateAdvisoryParagraph({ score, level, primarySystem, systemMeta, vitals, environmental, lifestyle, demographics, bmi, vitalDeviations, symptoms, aqiCat }) {
  const { heartRate: hr, spo2, systolicBP: sys, diastolicBP: dia, respiratoryRate: rr, bodyTemp: temp } = vitals;
  const { aqi, pm25 } = environmental;
  const age = demographics.age || 30;

  // ── Paragraph 1: Risk Level & Overview ───────────────────────────────────
  let p1 = '';
  if (level === 'LOW') {
    p1 = `Based on the comprehensive analysis of your submitted health parameters, the assessment engine has determined that your current overall risk index is ${score}/100, placing you in the Low Risk tier. Your vital signs are within acceptable physiological ranges — heart rate ${hr} BPM, oxygen saturation ${spo2}%, blood pressure ${sys}/${dia} mmHg — all indicative of a well-regulated baseline for someone aged ${age} years.${symptoms.length === 0 ? ' No symptoms have been reported, which further supports a low-concern profile at this time.' : ''}`;
  } else if (level === 'MODERATE') {
    p1 = `The assessment has assigned a current health risk score of ${score}/100, corresponding to a Moderate Risk classification. ${vitalDeviations.length > 0 ? `Your vital measurements reveal some parameter deviations — specifically ${vitalDeviations.slice(0, 2).join(' and ')} — which in combination with` : 'Your'} reported symptoms and environmental exposure collectively elevate your risk index above baseline norms for a ${age}-year-old individual. Monitoring trends and addressing modifiable factors is recommended.`;
  } else if (level === 'HIGH') {
    p1 = `Following a detailed multi-factor risk analysis, a risk score of ${score}/100 has been generated, categorizing your current physiological state as High Risk. Multiple abnormal indicators have been identified — heart rate ${hr} BPM, blood oxygen ${spo2}%, blood pressure ${sys}/${dia} mmHg — alongside the reported symptom burden${aqi > 100 ? ` and current environmental exposure (AQI ${aqi})` : ''}. Prompt corrective action and professional clinical evaluation are recommended.`;
  } else {
    p1 = `The assessment has classified your current health state as URGENT, with a risk score of ${score}/100. This classification is driven by severely abnormal physiological parameters — oxygen saturation ${spo2}%${spo2 < 90 ? ' (indicating clinically significant hypoxemia)' : ''}, heart rate ${hr} BPM, blood pressure ${sys}/${dia} mmHg${aqi > 200 ? `, and hazardous air quality (AQI ${aqi})` : ''}. These measurements represent a critical multi-system concern. Please seek immediate medical evaluation — do not delay.`;
  }

  // ── Paragraph 2: Primary System Context (input-driven, not hardcoded) ─────
  let p2 = '';
  const aqiGood = aqiVal => aqiVal <= 50;
  const aqiMod  = aqiVal => aqiVal > 50 && aqiVal <= 100;

  if (primarySystem === 'respiratory') {
    if (aqiGood(aqi)) {
      p2 = `The respiratory system has been identified as the primary system of concern, primarily due to the reported respiratory symptoms (${symptoms.filter(s => ['cough','shortness_of_breath','wheezing','throat_irritation'].includes(s)).join(', ').replace(/_/g,' ') || 'respiratory symptoms'}). Your current ambient air quality is Good (AQI ${aqi}), which means environmental factors are not a significant contributor to this assessment — the primary driver is the symptom pattern itself. Monitor symptom progression and seek evaluation if symptoms worsen.`;
    } else {
      p2 = `The respiratory system has been flagged as the primary system of concern. Your current atmospheric exposure registers an AQI of ${aqi} (${aqiCat.tier}), with estimated PM2.5 around ${pm25} µg/m³. Fine particulate matter at this concentration can penetrate deep into bronchiolar airways and alveolar membranes, triggering airway inflammation and reducing gas exchange capacity. ${aqi > 150 ? 'At these pollution levels, even healthy individuals face respiratory risk. Remain indoors with HEPA filtration when possible.' : 'Monitoring local AQI before outdoor activity is advisable.'}`;
    }
  } else if (primarySystem === 'circulatory') {
    p2 = `The cardiovascular system has been flagged as the primary system of concern. ${sys >= 140 ? `Blood pressure ${sys}/${dia} mmHg places your reading in the elevated/hypertensive range, increasing acute cardiac and cerebrovascular risk over both near and long term.` : `Your blood pressure ${sys}/${dia} mmHg${sys >= 130 ? ' is approaching elevated territory and should be monitored.' : ' is within acceptable range.'}`} ${hr > 100 ? `Heart rate of ${hr} BPM indicates tachycardia, which in combination with reported symptoms warrants clinical evaluation.` : ''} ${aqi > 100 ? `Additionally, ambient AQI of ${aqi} introduces fine particulates into systemic circulation, promoting vascular inflammation and arterial stiffness.` : ''}`;
  } else if (primarySystem === 'nervous') {
    p2 = `The central nervous system has been identified as the primary system associated with the reported symptoms. Neurological symptoms such as headache, dizziness, and mental fog are associated with cerebral perfusion, vestibular function, and autonomic signaling. ${spo2 < 97 ? `Your SpO₂ of ${spo2}% may be reducing optimal cerebral oxygen delivery.` : ''} ${aqi > 100 ? `Elevated CO and NO₂ from poor air quality (AQI ${aqi}) can compete with hemoglobin's oxygen binding, compounding neurological vulnerability.` : `Current air quality (AQI ${aqi} — ${aqiCat.tier}) is not a significant environmental contributor to this assessment.`} These symptoms represent possible associations with the neurological system — not a diagnosis of neurological disease.`;
  } else if (primarySystem === 'digestive') {
    p2 = `The gastrointestinal system has been identified as the primary system associated with the reported symptoms. Digestive symptoms such as abdominal discomfort, nausea, and acid reflux may be related to gastric motility, mucosal irritation, or lifestyle factors. Your daily water intake of ${lifestyle.water}L and sleep duration of ${lifestyle.sleep}h are relevant — chronic dehydration increases gastric acid concentration, while irregular sleep disrupts circadian rhythms governing digestive enzyme secretion. ${aqi <= 100 ? `Air quality (AQI ${aqi} — ${aqiCat.tier}) is not a primary contributor to this assessment.` : ''}`;
  } else if (primarySystem === 'urinary') {
    p2 = `The renal/urinary system has been associated with the reported flank or lower back symptoms. Kidney function is sensitive to hydration levels, systemic blood pressure, and toxin exposure. Your daily water intake of ${lifestyle.water}L is an important factor — adequate hydration (≥2L/day) supports nephron filtration efficiency. ${sys >= 140 ? `Elevated blood pressure (${sys}/${dia} mmHg) also places mechanical stress on renal glomeruli over time.` : ''}`;
  } else if (primarySystem === 'muscular') {
    p2 = `The musculoskeletal system has been associated with the reported joint or muscle pain symptoms. Musculoskeletal discomfort may be related to activity levels, posture, BMI, or systemic inflammation. ${bmi >= 30 ? `A BMI of ${bmi} increases mechanical load on weight-bearing joints.` : ''} ${lifestyle.exercise === 'none' || lifestyle.exercise === 'rare' ? 'Low physical activity can contribute to muscle atrophy, joint stiffness, and poor biomechanical support.' : ''}`;
  } else {
    // 'general' — no dominant system
    p2 = `No single body system has emerged as a dominant risk focus from the current inputs. ${vitalDeviations.length > 0 ? `However, the following vital sign observations were noted: ${vitalDeviations.join('; ')}.` : 'Your vital signs appear within broadly acceptable ranges.'} ${aqi <= 50 ? `Air quality is Good (AQI ${aqi}), contributing minimal environmental risk at this time.` : `Air quality is ${aqiCat.tier} (AQI ${aqi}), which may warrant monitoring.`} This is an encouraging baseline — continue maintaining healthy lifestyle habits.`;
  }

  // ── Paragraph 3: Lifestyle, BMI, Actionable Summary ───────────────────────
  const smokingNote = lifestyle.smoking === 'regular'
    ? 'Regular tobacco use is one of the most significant compounding risk factors — it substantially increases airway inflammation, vascular rigidity, and the combined toxic burden on both the cardiovascular and respiratory systems.'
    : lifestyle.smoking === 'occasional'
    ? 'Even occasional tobacco exposure amplifies the risk from environmental particulates by impairing the bronchial cilia responsible for clearing inhaled debris.'
    : 'Your non-smoking status is a meaningful protective factor that measurably reduces baseline respiratory and cardiovascular risk.';

  const exerciseNote = lifestyle.exercise === 'none' || lifestyle.exercise === 'rare'
    ? 'Physical inactivity is a major modifiable risk factor — regular aerobic conditioning reduces resting heart rate, improves cardiac output efficiency, lowers blood pressure, and enhances pulmonary reserve capacity.'
    : 'Continuing your current level of physical activity is protective — it supports vascular elasticity, cardiac efficiency, and metabolic regulation.';

  const bmiNote = bmi >= 30
    ? `Your calculated BMI of ${bmi} falls in the obese range. Even a modest 5–10% reduction in body weight meaningfully reduces cardiovascular load, systemic inflammation, and the risk of hypertension, sleep apnoea, and metabolic syndrome.`
    : bmi >= 25
    ? `Your BMI of ${bmi} is in the overweight range. Modest weight reduction alongside dietary and activity improvements can reduce cardiovascular and metabolic risk.`
    : `Your BMI of ${bmi} is within a healthy range, which is a significant protective factor across cardiovascular, metabolic, and musculoskeletal systems.`;

  const p3 = `${smokingNote} ${exerciseNote} ${bmiNote} Maintaining adequate daily hydration of at least 2–3 litres, optimising nightly sleep to 7–9 hours, and monitoring local air quality before outdoor exercise are the most impactful lifestyle measures supported by this profile.`;

  return [p1, p2, p3].join('\n\n');
}

// ─── Explainability Builder ───────────────────────────────────────────────────
/**
 * Constructs a transparent explanation of WHY the engine reached its conclusion.
 * This is shown to the user as "Why this result?"
 */
function buildExplainability({ primarySystem, systemMeta, riskLevel, totalScore, vitalDeviations, symptomData, aqiVal, aqiCat, bmi, lifestyle }) {
  const reasons = [];

  if (symptomData.symptomCount > 0) {
    reasons.push(`${symptomData.symptomCount} symptom(s) reported — highest association: ${primarySystem} system`);
  } else {
    reasons.push('No symptoms reported');
  }

  if (vitalDeviations.length > 0) {
    reasons.push(`Vital sign deviations: ${vitalDeviations.join('; ')}`);
  } else {
    reasons.push('Vital signs: within acceptable ranges');
  }

  reasons.push(`Air quality: AQI ${aqiVal} — ${aqiCat.tier} (${aqiCat.factor * 100}% impact factor)`);

  if (bmi >= 30) reasons.push(`BMI ${bmi} (obese range) — elevated lifestyle risk`);
  if (lifestyle.smoking === 'regular') reasons.push('Regular smoking — significant risk modifier');
  if (lifestyle.exercise === 'none' || lifestyle.exercise === 'rare') reasons.push('Low physical activity — modifiable risk factor');

  return {
    primarySystem: systemMeta.name,
    riskScore: totalScore,
    riskLevel,
    reasons
  };
}
