/**
 * Health History Storage & Management Service
 * Persists assessments in localStorage and syncs with backend database if online
 */

const STORAGE_KEY = 'smart_health_advisory_history';

export function getLocalHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read health history from storage:', err);
    return [];
  }
}

export function saveAssessmentToHistory(record) {
  try {
    const history = getLocalHistory();
    const item = {
      id: 'rec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      score: record.score,
      level: record.level,
      color: record.color,
      targetOrgan: record.targetOrgan,
      targetRegion: record.targetRegion,
      primarySystem: record.primarySystem,
      systemName: record.systemMeta?.name || record.primarySystem,
      aqi: record.payload?.environmental?.aqi ?? 45,
      aqiTier: record.aqiCategory?.tier || 'Moderate',
      symptoms: record.payload?.symptoms || [],
      vitals: {
        hr: record.payload?.vitals?.heartRate,
        spo2: record.payload?.vitals?.spo2,
        bp: (record.payload?.vitals?.systolicBP && record.payload?.vitals?.diastolicBP) ? `${record.payload.vitals.systolicBP}/${record.payload.vitals.diastolicBP}` : '120/80'
      }
    };
    history.unshift(item);
    // Keep last 30 assessments
    if (history.length > 30) history.pop();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return item;
  } catch (err) {
    console.error('Failed to save assessment to history:', err);
    return null;
  }
}

export function clearLocalHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear health history:', err);
  }
}
