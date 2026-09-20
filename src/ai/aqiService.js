/**
 * AQI City Search Service — Smart Health Advisory System
 *
 * Data Source: WAQI (World Air Quality Index) API — https://aqicn.org/api/
 * WAQI aggregates official monitoring networks including:
 *   - India: CPCB (Central Pollution Control Board) & state PCBs
 *   - Global: US EPA, European EEA, WHO-partner networks
 *
 * AQI Scale used: US EPA (0–500), matching this project's categories:
 *   0–50 Good | 51–100 Moderate | 101–150 Unhealthy for Sensitive
 *   151–200 Unhealthy | 201–300 Very Unhealthy | 301+ Hazardous
 *
 * Data freshness: WAQI delivers the most recently reported measurement
 * from the nearest official monitoring station (typically 1–3 hours delay).
 *
 * SECURITY:
 *   Token is read from import.meta.env.VITE_AQI_TOKEN (.env at project root).
 *   Vite embeds VITE_* env vars in the client bundle at build time.
 *   For server-side key protection, use a serverless function proxy.
 *   WAQI free tokens carry no billing risk — rotation is easy.
 */

const WAQI_TOKEN = import.meta.env.VITE_AQI_TOKEN || 'demo';
const WAQI_BASE  = 'https://api.waqi.info';

/**
 * Fetches the latest available air quality data for a named city.
 * @param {string} cityName - User-entered city (e.g., "Bengaluru", "Delhi")
 * @returns {Promise<AqiResult>}
 * @throws {Error} User-friendly message on any failure
 */
export async function fetchCityAqi(cityName) {
  if (!cityName || !cityName.trim()) throw new Error('Please enter a city name.');

  const city    = cityName.trim();
  const encoded = encodeURIComponent(city);
  const url     = `${WAQI_BASE}/feed/${encoded}/?token=${WAQI_TOKEN}`;

  let response;
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 8000);
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(tid);
    if (err.name === 'AbortError') throw new Error('Request timed out. Please try again.');
    throw new Error('Network error. Please check your internet connection and try again.');
  }
  clearTimeout(tid);

  if (!response.ok) throw new Error(`Air quality service error (${response.status}). Please try again.`);

  let json;
  try { json = await response.json(); }
  catch { throw new Error('Invalid response from air quality service. Please try again.'); }

  if (json.status !== 'ok') {
    const msg = typeof json.data === 'string' ? json.data.toLowerCase() : '';
    if (msg.includes('unknown') || msg.includes('invalid') || msg.includes('not found')) {
      throw new Error(
        `City not found: "${city}". Try a different spelling or a nearby major city ` +
        `(e.g., Bengaluru, Delhi, Mumbai, Chennai, Hyderabad, Pune, Kolkata).`
      );
    }
    if (WAQI_TOKEN === 'demo' && (msg.includes('token') || msg.includes('quota'))) {
      throw new Error(
        'Demo token rate-limited. Register for a free personal token at https://aqicn.org/api/ ' +
        'and set VITE_AQI_TOKEN in your .env file.'
      );
    }
    throw new Error(`Air quality data unavailable for "${city}". Try another city or use manual AQI input.`);
  }

  const data = json.data;
  if (!data || typeof data.aqi !== 'number' || data.aqi < 0) {
    throw new Error(`No current AQI reading for "${city}". Try a nearby city or use manual AQI input.`);
  }

  const iaqi   = data.iaqi || {};
  const getVal = (key) => {
    const v = iaqi[key]?.v;
    return (v != null && !isNaN(Number(v))) ? parseFloat(Number(v).toFixed(1)) : null;
  };

  let lastUpdated = 'Unknown';
  try {
    const timeStr = data.time?.s || data.time?.iso;
    if (timeStr) {
      const iso = timeStr.includes('T') ? timeStr : timeStr.replace(' ', 'T') + 'Z';
      const dt  = new Date(iso);
      if (!isNaN(dt)) {
        lastUpdated = dt.toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
        }) + ' IST';
      }
    }
  } catch { /* keep Unknown */ }

  return {
    cityRaw:           data.city?.name || city,
    aqi:               Math.round(data.aqi),
    dominantPollutant: data.dominentpol || null,
    pm25:  getVal('pm25'),
    pm10:  getVal('pm10'),
    co:    getVal('co'),
    no2:   getVal('no2'),
    o3:    getVal('o3'),
    so2:   getVal('so2'),
    lastUpdated,
    source:    'WAQI / CPCB (Official Monitoring Stations)',
    sourceUrl: `https://aqicn.org/city/${encodeURIComponent(city.toLowerCase())}/`,
    isLive:    true,
  };
}
