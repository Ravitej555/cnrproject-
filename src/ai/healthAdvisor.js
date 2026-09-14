/**
 * Health Advisor Main Controller & Preset Demonstration Scenarios
 */

import { calculateHealthRisk } from './riskEngine.js';

export const DEMO_SCENARIOS = [
  {
    id: 'healthy_baseline',
    name: 'Healthy Baseline',
    tag: 'Normal · AQI 28',
    icon: '🟢',
    description: 'Optimal cardiopulmonary biometrics, clean ambient air (AQI 28), active lifestyle.',
    payload: {
      demographics: { age: 24, gender: 'female', height: 168, weight: 60 },
      symptoms: [],
      vitals: { heartRate: 68, spo2: 99, systolicBP: 115, diastolicBP: 76, respiratoryRate: 14, bodyTemp: 36.6 },
      environmental: { aqi: 28, pm25: 8, pm10: 18, co: 0.3, no2: 12, so2: 3, o3: 20 },
      lifestyle: { smoking: 'never', exercise: 'frequent', sleep: 8.0, water: 2.8 }
    }
  },
  {
    id: 'air_pollution_respiratory',
    name: 'Smog & Respiratory',
    tag: 'Environmental · AQI 265',
    icon: '🌫️',
    description: 'Hazardous air quality (AQI 265, high PM2.5), persistent coughing & wheezing. Lungs highlighted in 3D.',
    payload: {
      demographics: { age: 34, gender: 'male', height: 178, weight: 75 },
      symptoms: ['cough', 'shortness_of_breath', 'wheezing', 'throat_irritation'],
      vitals: { heartRate: 88, spo2: 94, systolicBP: 126, diastolicBP: 82, respiratoryRate: 22, bodyTemp: 37.2 },
      environmental: { aqi: 265, pm25: 145, pm10: 210, co: 2.1, no2: 64, so2: 18, o3: 55 },
      lifestyle: { smoking: 'occasional', exercise: 'rare', sleep: 6.0, water: 1.8 }
    }
  },
  {
    id: 'cardiovascular_alert',
    name: 'Cardiovascular Alert',
    tag: 'Cardiac · HR 106',
    icon: '❤️',
    description: 'Elevated blood pressure (154/98), tachycardia (106 BPM), palpitations & chest tightness. Heart highlighted in 3D.',
    payload: {
      demographics: { age: 52, gender: 'male', height: 172, weight: 88 },
      symptoms: ['chest_pain', 'palpitations', 'dizziness'],
      vitals: { heartRate: 106, spo2: 96, systolicBP: 154, diastolicBP: 98, respiratoryRate: 18, bodyTemp: 36.7 },
      environmental: { aqi: 82, pm25: 28, pm10: 45, co: 0.8, no2: 25, so2: 6, o3: 30 },
      lifestyle: { smoking: 'regular', exercise: 'none', sleep: 5.5, water: 1.2 }
    }
  },
  {
    id: 'gastrointestinal_metabolic',
    name: 'GI & Metabolic',
    tag: 'Digestive · Acid Reflux',
    icon: '🫄',
    description: 'Abdominal cramping, acid reflux and nausea following irregular sleep and dehydration. Stomach highlighted in 3D.',
    payload: {
      demographics: { age: 29, gender: 'female', height: 165, weight: 58 },
      symptoms: ['stomach_pain', 'nausea', 'acid_reflux'],
      vitals: { heartRate: 78, spo2: 98, systolicBP: 118, diastolicBP: 74, respiratoryRate: 16, bodyTemp: 37.0 },
      environmental: { aqi: 62, pm25: 18, pm10: 32, co: 0.4, no2: 16, so2: 4, o3: 25 },
      lifestyle: { smoking: 'never', exercise: 'moderate', sleep: 5.0, water: 1.0 }
    }
  },
  {
    id: 'high_risk_multisystem',
    name: 'Multi-System Alert',
    tag: 'Urgent · SpO₂ 89%',
    icon: '🚨',
    description: 'Hypoxemia (SpO2 89%), febrile (39.1°C), tachypnea, severe smog exposure and chest distress.',
    payload: {
      demographics: { age: 64, gender: 'male', height: 170, weight: 82 },
      symptoms: ['shortness_of_breath', 'chest_pain', 'cough', 'dizziness', 'fatigue'],
      vitals: { heartRate: 118, spo2: 89, systolicBP: 162, diastolicBP: 102, respiratoryRate: 26, bodyTemp: 39.1 },
      environmental: { aqi: 310, pm25: 195, pm10: 280, co: 3.5, no2: 88, so2: 24, o3: 70 },
      lifestyle: { smoking: 'regular', exercise: 'none', sleep: 4.5, water: 1.0 }
    }
  }
];

export function runHealthAdvisor(inputPayload) {
  return calculateHealthRisk(inputPayload);
}
