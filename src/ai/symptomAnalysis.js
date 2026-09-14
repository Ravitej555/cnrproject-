/**
 * Symptom Analysis Engine
 * Maps user-reported symptoms to physiological organ systems and calculates baseline symptom burden
 */

import { SYMPTOM_DEFINITIONS, SYSTEM_DISPLAY_META } from './healthRules.js';

export function analyzeSymptoms(selectedSymptomIds = []) {
  if (!Array.isArray(selectedSymptomIds) || selectedSymptomIds.length === 0) {
    return {
      totalSymptomScore: 0,
      systemScores: {
        respiratory: 0,
        circulatory: 0,
        nervous: 0,
        digestive: 0,
        urinary: 0,
        muscular: 0
      },
      primarySystem: 'respiratory',
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
    muscular: 0
  };

  let rawTotal = 0;

  selectedSymptomIds.forEach(id => {
    const def = SYMPTOM_DEFINITIONS.find(s => s.id === id);
    if (def) {
      activeSymptoms.push(def);
      rawTotal += def.weight;
      if (systemScores[def.system] !== undefined) {
        systemScores[def.system] += def.weight;
      }
    }
  });

  // Cross-symptom synergy multipliers
  // e.g. shortness of breath + chest pain = high urgency cardio-pulmonary synergy
  if (selectedSymptomIds.includes('shortness_of_breath') && selectedSymptomIds.includes('chest_pain')) {
    systemScores.circulatory += 18;
    systemScores.respiratory += 15;
    rawTotal += 20;
  }
  if (selectedSymptomIds.includes('dizziness') && selectedSymptomIds.includes('palpitations')) {
    systemScores.circulatory += 12;
    systemScores.nervous += 10;
    rawTotal += 14;
  }

  // Find primary affected system
  let primarySystem = 'respiratory';
  let maxScore = -1;
  Object.entries(systemScores).forEach(([sys, score]) => {
    if (score > maxScore) {
      maxScore = score;
      primarySystem = sys;
    }
  });

  return {
    totalSymptomScore: Math.min(100, Math.round(rawTotal)),
    systemScores,
    primarySystem,
    symptomCount: activeSymptoms.length,
    activeSymptoms
  };
}
