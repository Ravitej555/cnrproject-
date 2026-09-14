/**
 * AI Health Risk Assessment Engine
 * Transparent, multi-factorial algorithm integrating Environmental AQI, Physiological Vitals,
 * User-reported Symptoms, and Lifestyle Factors into a clinical risk score & tiered recommendations.
 */

import { AQI_LEVELS, getAqiCategory, VITALS_RANGES, SYSTEM_DISPLAY_META } from './healthRules.js';
import { analyzeSymptoms } from './symptomAnalysis.js';

export function calculateHealthRisk({
  demographics = { age: 30, gender: 'male', height: 175, weight: 70 },
  symptoms = [],
  vitals = { heartRate: 75, spo2: 98, systolicBP: 120, diastolicBP: 80, respiratoryRate: 16, bodyTemp: 36.8 },
  environmental = { aqi: 45, pm25: 12, pm10: 25, co: 0.5, no2: 18, so2: 5, o3: 22 },
  lifestyle = { smoking: 'never', exercise: 'moderate', sleep: 7.5, water: 2.5 }
}) {
  // 1. BMI Calculation
  const hM = (demographics.height || 170) / 100;
  const bmi = demographics.weight && hM > 0 ? (demographics.weight / (hM * hM)).toFixed(1) : 22.5;

  // 2. Environmental AQI Risk (Weight: 25%)
  const aqiVal = Number(environmental.aqi) || 0;
  const aqiCat = getAqiCategory(aqiVal);
  let envScore = Math.min(100, Math.round((aqiVal / 350) * 100));
  if (environmental.pm25 > 60) envScore += 15;
  if (environmental.pm10 > 100) envScore += 10;
  envScore = Math.min(100, envScore);

  // 3. Vitals Risk Assessment (Weight: 35%)
  let vitalsScore = 0;
  const vitalDeviations = [];

  // Heart Rate
  const hr = Number(vitals.heartRate) || 75;
  if (hr > VITALS_RANGES.heartRate.criticalHigh || hr < VITALS_RANGES.heartRate.criticalLow) {
    vitalsScore += 35;
    vitalDeviations.push(`Atypical Heart Rate (${hr} BPM)`);
  } else if (hr > VITALS_RANGES.heartRate.maxNorm || hr < VITALS_RANGES.heartRate.minNorm) {
    vitalsScore += 18;
    vitalDeviations.push(`Borderline Heart Rate (${hr} BPM)`);
  }

  // SpO2
  const spo2 = Number(vitals.spo2) || 98;
  if (spo2 < VITALS_RANGES.spo2.criticalLow) {
    vitalsScore += 45;
    vitalDeviations.push(`Hypoxemic Blood Oxygen (${spo2}%)`);
  } else if (spo2 < VITALS_RANGES.spo2.minNorm) {
    vitalsScore += 24;
    vitalDeviations.push(`Sub-optimal Oxygen Saturation (${spo2}%)`);
  }

  // Blood Pressure
  const sys = Number(vitals.systolicBP) || 120;
  const dia = Number(vitals.diastolicBP) || 80;
  if (sys >= 140 || dia >= 90) {
    vitalsScore += 25;
    vitalDeviations.push(`Elevated Blood Pressure (${sys}/${dia} mmHg)`);
  } else if (sys < 90 || dia < 60) {
    vitalsScore += 15;
    vitalDeviations.push(`Hypotensive Blood Pressure (${sys}/${dia} mmHg)`);
  }

  // Respiratory Rate
  const rr = Number(vitals.respiratoryRate) || 16;
  if (rr > 22 || rr < 10) {
    vitalsScore += 20;
    vitalDeviations.push(`Tachypnea / Abnormal Respiratory Rate (${rr} bpm)`);
  }

  // Body Temperature
  const temp = Number(vitals.bodyTemp) || 36.8;
  if (temp >= 38.5) {
    vitalsScore += 30;
    vitalDeviations.push(`Febrile Hyperthermia (${temp}°C)`);
  } else if (temp >= 37.8) {
    vitalsScore += 15;
    vitalDeviations.push(`Low-grade Fever (${temp}°C)`);
  }
  vitalsScore = Math.min(100, vitalsScore);

  // 4. Symptoms Analysis (Weight: 30%)
  const symptomData = analyzeSymptoms(symptoms);
  const symptomScore = symptomData.totalSymptomScore;

  // 5. Lifestyle Factor (Weight: 10%)
  let lifestyleRisk = 0;
  if (lifestyle.smoking === 'regular') lifestyleRisk += 45;
  else if (lifestyle.smoking === 'occasional') lifestyleRisk += 20;
  if (lifestyle.exercise === 'none') lifestyleRisk += 25;
  if (lifestyle.sleep < 6 || lifestyle.sleep > 10) lifestyleRisk += 20;
  if (lifestyle.water < 1.5) lifestyleRisk += 15;
  lifestyleRisk = Math.min(100, lifestyleRisk);

  // Cross Factor Amplifier: High AQI + Respiratory Symptoms / Hypoxemia
  let synergyMultiplier = 1.0;
  if (aqiVal > 150 && (symptoms.includes('cough') || symptoms.includes('shortness_of_breath') || spo2 < 95)) {
    synergyMultiplier += 0.25; // 25% risk amplification for toxic air + pulmonary vulnerability
  }

  // Weighted Aggregate Risk Score (0 - 100)
  const baseWeightedScore = (
    envScore * 0.25 +
    vitalsScore * 0.35 +
    symptomScore * 0.30 +
    lifestyleRisk * 0.10
  );
  const totalScore = Math.min(100, Math.round(baseWeightedScore * synergyMultiplier));

  // Determine Risk Tier
  let riskLevel = 'LOW';
  let riskColor = '#10b981';
  if (totalScore >= 75 || spo2 < 90 || vitals.heartRate > 130) {
    riskLevel = 'URGENT';
    riskColor = '#ef4444';
  } else if (totalScore >= 50) {
    riskLevel = 'HIGH';
    riskColor = '#f97316';
  } else if (totalScore >= 25) {
    riskLevel = 'MODERATE';
    riskColor = '#f59e0b';
  }

  // Determine Primary Affected Organ & System
  let primarySystem = symptomData.primarySystem || 'respiratory';
  // If no symptoms, check if AQI is high (respiratory) or vitals point to heart
  if (symptomData.symptomCount === 0) {
    if (vitalsScore > 20 && (hr > 100 || hr < 55 || sys > 135)) {
      primarySystem = 'circulatory';
    } else if (aqiVal > 100) {
      primarySystem = 'respiratory';
    } else {
      primarySystem = 'respiratory';
    }
  }

  const systemMeta = SYSTEM_DISPLAY_META[primarySystem] || SYSTEM_DISPLAY_META.respiratory;
  const targetOrgan = systemMeta.organ;
  const targetRegion = systemMeta.region;

  // Contributing Factors Percent Breakdown
  const factorSum = (envScore * 0.25) + (vitalsScore * 0.35) + (symptomScore * 0.30) + (lifestyleRisk * 0.10) || 1;
  const contributingFactors = [
    { name: 'Vitals & Hemodynamics', weight: Math.round(((vitalsScore * 0.35) / factorSum) * 100), rawScore: vitalsScore, color: '#df4d64' },
    { name: 'Symptom Presentation', weight: Math.round(((symptomScore * 0.30) / factorSum) * 100), rawScore: symptomScore, color: '#f59e0b' },
    { name: 'Air Quality (AQI / PM2.5)', weight: Math.round(((envScore * 0.25) / factorSum) * 100), rawScore: envScore, color: '#00bcd4' },
    { name: 'Lifestyle & Habits', weight: Math.round(((lifestyleRisk * 0.10) / factorSum) * 100), rawScore: lifestyleRisk, color: '#a855f7' },
  ];

  // Specific Actionable Recommendations
  const recommendations = [];
  const warningSigns = [];

  if (aqiVal > 150) {
    recommendations.push('High particulate density detected: Wear an N95 respirator mask outdoors and operate indoor HEPA filtration.');
    recommendations.push('Postpone strenuous outdoor exercise until atmospheric dispersion improves.');
  }
  if (spo2 < 95) {
    warningSigns.push('Sub-optimal SpO2 indicates reduced arterial oxygen saturation. Monitor closely with a medical pulse oximeter.');
  }
  if (symptoms.includes('chest_pain')) {
    warningSigns.push('Precordial or radiating chest discomfort warrants urgent clinical evaluation.');
  }
  if (lifestyle.smoking === 'regular') {
    recommendations.push('Active tobacco inhalation severely compounds particulate air pollution hazards and decreases airway ciliary clearance.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Maintain consistent hydration (2–3 liters daily) and balanced aerobic cardiovascular conditioning.');
    recommendations.push('Continue monitoring regional AQI forecasts before planning high-intensity endurance routines.');
  }

  // Generate paragraph-based AI advisory
  const advisoryText = generateAdvisoryParagraph({
    score: totalScore, level: riskLevel, primarySystem, systemMeta,
    vitals: { heartRate: hr, spo2, systolicBP: sys, diastolicBP: dia, respiratoryRate: rr, bodyTemp: temp },
    environmental: { aqi: aqiVal, pm25: environmental.pm25 },
    lifestyle, demographics, bmi: Number(bmi), vitalDeviations, symptoms, aqiCat
  });

  return {
    score: totalScore,
    level: riskLevel,
    color: riskColor,
    primarySystem,
    systemMeta,
    targetOrgan,
    targetRegion,
    bmi,
    aqiCategory: aqiCat,
    contributingFactors,
    vitalDeviations,
    recommendations,
    warningSigns,
    advisoryText,
    disclaimer: 'This assessment is generated by an AI-assisted heuristic model for educational and wellness exploration only. It does not replace clinical judgment, diagnosis, or emergency care.'
  };
}

/**
 * Generates a rich, paragraph-based AI health advisory.
 */
function generateAdvisoryParagraph({ score, level, primarySystem, systemMeta, vitals, environmental, lifestyle, demographics, bmi, vitalDeviations, symptoms, aqiCat }) {
  const { heartRate, spo2, systolicBP, diastolicBP, respiratoryRate, bodyTemp } = vitals;
  const { aqi, pm25 } = environmental;
  const age = demographics.age || 30;

  // Paragraph 1: Overall risk summary + primary system
  let p1 = '';
  if (level === 'LOW') {
    p1 = `Based on the comprehensive analysis of your submitted health parameters, the AI Health Advisory System has determined that your current overall risk index is ${score} out of 100, placing you in the Low Risk tier. Your vital signs are within acceptable physiological ranges, with a heart rate of ${heartRate} BPM, an oxygen saturation of ${spo2}%, and a blood pressure reading of ${systolicBP}/${diastolicBP} mmHg — all indicative of a well-regulated cardiovascular and respiratory baseline for your age group of ${age} years.`;
  } else if (level === 'MODERATE') {
    p1 = `The AI Health Advisory System has completed a multi-factorial risk analysis and has assigned a current health risk score of ${score} out of 100, corresponding to a Moderate Risk classification. Your vital measurements reveal some parameter deviations that warrant attention — specifically, a heart rate of ${heartRate} BPM, blood oxygen at ${spo2}%, and blood pressure at ${systolicBP}/${diastolicBP} mmHg — which in combination with your reported symptoms and environmental exposure collectively elevate your near-term health concern index above baseline norms for a ${age}-year-old individual.`;
  } else if (level === 'HIGH') {
    p1 = `Following a detailed cross-system risk analysis, the AI Health Advisory System has generated a risk score of ${score} out of 100, categorizing your current physiological state as High Risk. Multiple abnormal indicators have been identified across your health profile. Your heart rate is ${heartRate} BPM, your blood oxygen saturation stands at ${spo2}%, and your blood pressure reads ${systolicBP}/${diastolicBP} mmHg — a constellation of measurements that, alongside your symptom report and current environmental exposure at AQI ${aqi}, signals meaningful physiological stress requiring prompt corrective action.`;
  } else {
    p1 = `The AI Health Advisory System has classified your current health state as URGENT, with a risk score of ${score} out of 100. This classification is driven by severely abnormal vital parameters including an oxygen saturation of ${spo2}% — indicating hypoxemia — a heart rate of ${heartRate} BPM, and a blood pressure of ${systolicBP}/${diastolicBP} mmHg. These measurements combined with an ambient Air Quality Index of ${aqi} and your reported symptom burden represent a critical multi-system physiological emergency requiring immediate medical evaluation. Please do not delay seeking clinical care.`;
  }

  // Paragraph 2: Primary system + AQI + environmental context
  let p2 = '';
  if (primarySystem === 'respiratory') {
    p2 = `The primary organ system identified as most vulnerable in this assessment is the ${systemMeta.name}. Your current atmospheric exposure registers an AQI of ${aqi}, corresponding to the "${aqiCat.tier}" category with estimated PM2.5 concentration around ${pm25} µg/m³. Fine particulate matter at this concentration can penetrate deep into the bronchiolar airways and alveolar membranes, triggering localized inflammation, reduced mucociliary clearance, and decreased effective gas exchange capacity. ${aqi > 150 ? 'At these hazardous pollution levels, even healthy individuals are at risk of respiratory compromise, and high-risk individuals — including those with asthma, COPD, or reduced cardiopulmonary reserve — should remain indoors with HEPA filtration.' : 'Monitoring your local AQI forecast before outdoor activity is recommended as a standard precaution.'}`;
  } else if (primarySystem === 'circulatory') {
    p2 = `The cardiovascular system has been flagged as the primary system of concern in your risk analysis. Your current blood pressure of ${systolicBP}/${diastolicBP} mmHg ${systolicBP >= 140 ? 'places you in the Stage 2 Hypertension category, which significantly elevates the risk of acute cardiac events, including myocardial infarction and hypertensive stroke, over both the short and long term' : 'is approaching elevated territory and should be monitored closely'}. Furthermore, the ambient Air Quality Index of ${aqi} introduces fine particulate matter into systemic circulation, promoting vascular endothelial inflammation, platelet aggregation, and arterial stiffness — all of which amplify the mechanical load placed on the cardiac muscle and may exacerbate hypertensive damage over time.`;
  } else if (primarySystem === 'nervous') {
    p2 = `The central nervous system has been identified as the primary system under stress based on your symptom profile. The brain and associated neural pathways are acutely sensitive to changes in arterial oxygen availability, blood glucose homeostasis, and systemic circulatory pressure. Your reported symptoms of neurological nature — combined with physiological readings including a body temperature of ${bodyTemp}°C and an oxygen saturation of ${spo2}% — collectively signal that cerebral perfusion or autonomic signaling may be suboptimal. Environmental exposure to carbon monoxide and nitrogen dioxide at elevated AQI levels further compounds neurological vulnerability by competing with hemoglobin for oxygen binding sites.`;
  } else if (primarySystem === 'digestive') {
    p2 = `The gastrointestinal system has been identified as the primary affected organ system in this assessment. Your reported symptoms suggest active disruption of gastric motility or mucosal homeostasis. Lifestyle factors including a daily water intake of ${lifestyle.water} liters and a sleep duration of ${lifestyle.sleep} hours are significant contributors to gastrointestinal health, as chronic dehydration increases gastric acid concentration and impairs intestinal motility, while sleep deprivation disrupts the circadian rhythms that govern digestive enzyme secretion and gut flora balance.`;
  } else {
    p2 = `The primary system flagged in this assessment is the ${systemMeta.name}. The combination of your reported parameters — including a BMI of ${bmi}, an AQI of ${aqi}, and the symptom set you have indicated — collectively points to physiological strain in this system. Addressing both the environmental exposure and the lifestyle parameters simultaneously will produce the most effective improvement in this risk domain.`;
  }

  // Paragraph 3: Lifestyle, BMI, actionable recommendations
  const smokingNote = lifestyle.smoking === 'regular'
    ? 'Regular tobacco use is one of the most significant compounding risk multipliers in this assessment, as smoking dramatically increases airway inflammation, vascular rigidity, and the toxic burden placed on the cardiovascular and respiratory systems simultaneously.'
    : lifestyle.smoking === 'occasional'
    ? 'Even occasional tobacco exposure amplifies the risk from environmental particulate pollution by impairing the bronchial cilia responsible for clearing inhaled debris.'
    : 'Your non-smoking status is a positive protective factor that meaningfully reduces baseline respiratory and cardiovascular risk.';

  const exerciseNote = lifestyle.exercise === 'none' || lifestyle.exercise === 'rare'
    ? 'Physical inactivity is a major modifiable risk factor — regular aerobic conditioning reduces resting heart rate, improves cardiac output efficiency, lowers blood pressure, and enhances pulmonary reserve capacity.'
    : 'Continuing your current level of physical activity is a strong protective behavior that supports vascular elasticity, cardiac efficiency, and metabolic regulation.';

  const bmiNote = bmi > 30
    ? `Your calculated BMI of ${bmi} falls in the obese range, which increases mechanical cardiac load, promotes systemic low-grade inflammation, and is associated with higher risk of hypertension, sleep apnea, and metabolic syndrome.`
    : bmi > 25
    ? `Your BMI of ${bmi} is in the overweight range. Even modest weight reduction of five to ten percent can meaningfully reduce cardiovascular and metabolic risk.`
    : `Your BMI of ${bmi} is within a healthy range, which is a significant protective factor across cardiovascular, metabolic, and musculoskeletal systems.`;

  const p3 = `${smokingNote} ${exerciseNote} ${bmiNote} ${vitalDeviations.length > 0 ? `Key physiological observations flagged by the system include: ${vitalDeviations.join('; ')}. These deviations should be discussed with a qualified healthcare provider for proper clinical contextualisation.` : 'Your vital sign parameters appear within broadly acceptable ranges at this time.'} Maintaining adequate daily hydration of at least two to three liters, optimizing nightly sleep to seven to nine hours, and avoiding prolonged outdoor exposure during periods of elevated particulate density are the three most impactful lifestyle interventions currently supported by your profile data.`;

  return [p1, p2, p3].join('\n\n');
}
