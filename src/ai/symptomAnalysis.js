/**
 * Symptom Analysis Engine
 * Maps user-reported symptoms to physiological organ systems and calculates baseline symptom burden.
 *
 * IMPORTANT: Symptom-to-system mappings represent possible educational associations,
 * NOT medical diagnoses. Do not claim diagnostic certainty.
 */

import { SYMPTOM_DEFINITIONS, SYSTEM_DISPLAY_META } from './healthRules.js';

export function analyzeSymptoms(selectedSymptomIds = []) {
  // When no symptoms are selected, return null primarySystem (do NOT default to respiratory).
  // The riskEngine will determine primarySystem from vitals/AQI if no symptoms exist.
  if (!Array.isArray(selectedSymptomIds) || selectedSymptomIds.length === 0) {
    return {
      totalSymptomScore: 0,
      systemScores: {
        respiratory: 0,
        circulatory: 0,
        nervous: 0,
        digestive: 0,
        urinary: 0,
        muscular: 0,
        general: 0,
      },
      primarySystem: null,   // null = no symptom-driven system detected
      symptomCount: 0,
      activeSymptoms: []
    };
  }

  const activeSymptoms = [];
  const systemScores = {
    respiratory: 0,
    circulatory: 0,
    nervous: 0,
    digestive: 0,
    urinary: 0,
    muscular: 0,
    general: 0,   // catches fever, systemic fatigue, etc.
  };

  let rawTotal = 0;

  selectedSymptomIds.forEach(id => {
    const def = SYMPTOM_DEFINITIONS.find(s => s.id === id);
    if (def) {
      activeSymptoms.push(def);
      rawTotal += def.weight;
      // Accumulate into the matching system bucket (ignore 'general' in primary determination below)
      if (systemScores[def.system] !== undefined) {
        systemScores[def.system] += def.weight;
      }
    }
  });

  // Cross-symptom synergy multipliers
  // Shortness of breath + chest pain = high-urgency cardiopulmonary synergy
  if (selectedSymptomIds.includes('shortness_of_breath') && selectedSymptomIds.includes('chest_pain')) {
    systemScores.circulatory += 18;
    systemScores.respiratory += 15;
    rawTotal += 20;
  }
  // Dizziness + palpitations = circulatory/neurological synergy
  if (selectedSymptomIds.includes('dizziness') && selectedSymptomIds.includes('palpitations')) {
    systemScores.circulatory += 12;
    systemScores.nervous += 10;
    rawTotal += 14;
  }
  // Cough + wheezing reinforces respiratory
  if (selectedSymptomIds.includes('cough') && selectedSymptomIds.includes('wheezing')) {
    systemScores.respiratory += 10;
    rawTotal += 8;
  }
  // Abdominal pain + nausea reinforces digestive
  if (selectedSymptomIds.includes('stomach_pain') && selectedSymptomIds.includes('nausea')) {
    systemScores.digestive += 8;
    rawTotal += 6;
  }

  // Find primary affected system — pick the highest scoring non-zero system.
  // 'general' only wins if it's the ONLY system with score (i.e., fever/fatigue alone).
  let primarySystem = null;
  let maxScore = 0;

  // First pass: check specific systems (exclude 'general')
  const specificSystems = ['respiratory', 'circulatory', 'nervous', 'digestive', 'urinary', 'muscular'];
  specificSystems.forEach(sys => {
    if (systemScores[sys] > maxScore) {
      maxScore = systemScores[sys];
      primarySystem = sys;
    }
  });

  // If no specific system scored, fall back to 'general' if it has any score
  if (!primarySystem && systemScores.general > 0) {
    primarySystem = 'general';
    maxScore = systemScores.general;
  }

  // If still null (shouldn't happen given we have symptoms), default to highest of all
  if (!primarySystem) {
    Object.entries(systemScores).forEach(([sys, score]) => {
      if (score > maxScore) { maxScore = score; primarySystem = sys; }
    });
  }

  return {
    totalSymptomScore: Math.min(100, Math.round(rawTotal)),
    systemScores,
    primarySystem,   // The system with the highest symptom-weighted score
    symptomCount: activeSymptoms.length,
    activeSymptoms
  };
}
