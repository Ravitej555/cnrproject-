/**
 * Health & Environmental Rules Definition
 * Part of Smart Health Advisory System
 */

// --- AQI Scale & Multipliers ---
export const AQI_LEVELS = [
  { min: 0,   max: 50,  tier: 'Good',                 color: '#10b981', factor: 0.05, desc: 'Air quality is satisfactory and poses little or no health risk.' },
  { min: 51,  max: 100, tier: 'Moderate',             color: '#f59e0b', factor: 0.20, desc: 'Air quality is acceptable; sensitive individuals may experience minor symptoms.' },
  { min: 101, max: 150, tier: 'Unhealthy for Sensitive', color: '#f97316', factor: 0.45, desc: 'Members of sensitive groups (asthma, elderly, children) may experience health effects.' },
  { min: 151, max: 200, tier: 'Unhealthy',            color: '#ef4444', factor: 0.70, desc: 'Everyone may begin to experience adverse health effects; prolonged outdoor exposure should be limited.' },
  { min: 201, max: 300, tier: 'Very Unhealthy',       color: '#a855f7', factor: 0.85, desc: 'Health alert: increased likelihood of significant adverse respiratory and cardiovascular effects.' },
  { min: 301, max: 500, tier: 'Hazardous',            color: '#7f1d1d', factor: 1.00, desc: 'Health warning of emergency conditions. The entire population is likely to be affected.' }
];

export function getAqiCategory(aqi = 0) {
  const num = Math.max(0, Number(aqi) || 0);
  for (const lvl of AQI_LEVELS) {
    if (num >= lvl.min && num <= lvl.max) return lvl;
  }
  return AQI_LEVELS[AQI_LEVELS.length - 1];
}

// --- Standard Vitals Normal Ranges ---
export const VITALS_RANGES = {
  heartRate:       { minNorm: 60,  maxNorm: 100, unit: 'BPM',  criticalHigh: 125, criticalLow: 45, label: 'Heart Rate' },
  spo2:            { minNorm: 95,  maxNorm: 100, unit: '%',    criticalHigh: 100, criticalLow: 90, label: 'Blood Oxygen (SpO2)' },
  systolicBP:      { minNorm: 90,  maxNorm: 120, unit: 'mmHg', criticalHigh: 160, criticalLow: 85, label: 'Systolic BP' },
  diastolicBP:     { minNorm: 60,  maxNorm: 80,  unit: 'mmHg', criticalHigh: 100, criticalLow: 55, label: 'Diastolic BP' },
  respiratoryRate: { minNorm: 12,  maxNorm: 20,  unit: 'bpm',  criticalHigh: 28,  criticalLow: 8,  label: 'Respiratory Rate' },
  bodyTemp:        { minNorm: 36.5, maxNorm: 37.5, unit: '°C', criticalHigh: 39.5, criticalLow: 35.0, label: 'Body Temperature' }
};

// --- Symptom Library & Target System / Organ Mapping ---
export const SYMPTOM_DEFINITIONS = [
  // Respiratory
  { id: 'cough',               label: 'Persistent Cough',             system: 'respiratory', organ: 'lungs',   weight: 18, severity: 'moderate' },
  { id: 'shortness_of_breath', label: 'Shortness of Breath',          system: 'respiratory', organ: 'lungs',   weight: 30, severity: 'high' },
  { id: 'wheezing',            label: 'Wheezing / Breathing Difficulty', system: 'respiratory', organ: 'lungs', weight: 22, severity: 'moderate' },
  { id: 'throat_irritation',   label: 'Sore Throat / Irritation',     system: 'respiratory', organ: 'lungs',   weight: 12, severity: 'low' },
  // Cardiovascular
  { id: 'chest_pain',          label: 'Chest Discomfort / Pressure',  system: 'circulatory', organ: 'heart',   weight: 35, severity: 'urgent' },
  { id: 'palpitations',        label: 'Palpitations / Rapid Pulse',   system: 'circulatory', organ: 'heart',   weight: 22, severity: 'moderate' },
  // Neurological
  { id: 'headache',            label: 'Headache / Migraine',          system: 'nervous',     organ: 'brain',   weight: 16, severity: 'moderate' },
  { id: 'dizziness',           label: 'Dizziness / Lightheadedness',  system: 'nervous',     organ: 'brain',   weight: 18, severity: 'moderate' },
  { id: 'mental_fog',          label: 'Mental Fog / Fatigue',         system: 'nervous',     organ: 'brain',   weight: 14, severity: 'low' },
  { id: 'fever',               label: 'Fever / High Temperature',     system: 'nervous',     organ: 'brain',   weight: 20, severity: 'moderate' },
  // Digestive
  { id: 'stomach_pain',        label: 'Abdominal Pain / Cramping',    system: 'digestive',   organ: 'stomach', weight: 20, severity: 'moderate' },
  { id: 'nausea',              label: 'Nausea / Vomiting',            system: 'digestive',   organ: 'stomach', weight: 15, severity: 'low' },
  { id: 'acid_reflux',         label: 'Acid Reflux / Indigestion',    system: 'digestive',   organ: 'stomach', weight: 14, severity: 'low' },
  // Renal
  { id: 'flank_pain',          label: 'Flank / Lower Back Pain',      system: 'urinary',     organ: 'kidneys', weight: 22, severity: 'moderate' },
  // General
  { id: 'fatigue',             label: 'Severe Fatigue / Weakness',    system: 'nervous',     organ: 'brain',   weight: 15, severity: 'low' },
  { id: 'muscle_weakness',     label: 'Muscle Pain / Joint Pain',     system: 'muscular',    organ: 'skeleton',weight: 16, severity: 'low' },
];

export const SYSTEM_DISPLAY_META = {
  respiratory: { name: 'Respiratory System',       organ: 'lungs',    region: 'chest',   color: '#00bcd4', icon: '🫁', desc: 'Pulmonary gas exchange, bronchial airways & alveolar diffusion. Highly sensitive to airborne pollutants (PM2.5, AQI).' },
  circulatory: { name: 'Cardiovascular System',    organ: 'heart',    region: 'chest',   color: '#df4d64', icon: '🫀', desc: 'Systemic blood circulation, arterial pressure & cardiac telemetry. AQI and PM2.5 increase cardiac stress.' },
  nervous:     { name: 'Central Nervous System',   organ: 'brain',    region: 'head',    color: '#f1c40f', icon: '🧠', desc: 'Cranial innervation, cerebral perfusion & cognitive homeostasis. Sensitive to hypoxia and carbon monoxide.' },
  digestive:   { name: 'Gastrointestinal System',  organ: 'stomach',  region: 'abdomen', color: '#e67e22', icon: '🧬', desc: 'Gastric acid motility, nutrient absorption & hepatic filtration. Affected by dehydration and lifestyle.' },
  urinary:     { name: 'Renal / Excretory System', organ: 'kidneys',  region: 'abdomen', color: '#8e44ad', icon: '🩸', desc: 'Nephron fluid balance, creatinine excretion & electrolyte regulation. Sensitive to dehydration and toxins.' },
  muscular:    { name: 'Musculoskeletal System',   organ: 'skeleton', region: 'chest',   color: '#c0392b', icon: '🦴', desc: 'Axial biomechanics, kinetic articulation & skeletal support. Joint pain may indicate systemic inflammation.' },
};
