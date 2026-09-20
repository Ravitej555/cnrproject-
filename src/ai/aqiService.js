/**
 * AQI City Search Service — Smart Health Advisory System
 *
 * Data Sources (NO API KEY REQUIRED):
 *   1. Open-Meteo Geocoding API — https://open-meteo.com/en/docs/geocoding-api
 *      Resolves city names to latitude/longitude.
 *
 *   2. Open-Meteo Air Quality API — https://open-meteo.com/en/docs/air-quality-api
 *      Powered by Copernicus CAMS (European Centre for Medium-Range Weather Forecasts).
 *      Provides hourly PM2.5, PM10, NO2, O3, SO2, CO, and US AQI.
 *
 * AQI Scale: US EPA (0–500), matching this project's categories:
 *   0–50 Good | 51–100 Moderate | 101–150 Unhealthy for Sensitive
 *   151–200 Unhealthy | 201–300 Very Unhealthy | 301+ Hazardous
 *
 * Free tier: completely free with no registration or API key.
 * Data freshness: hourly updates from CAMS global air quality forecast.
 */

const GEO_API = 'https://geocoding-api.open-meteo.com/v1/search';
const AQ_API  = 'https://air-quality-api.open-meteo.com/v1/air-quality';

/**
 * Fetch with a configurable timeout.
 * @param {string} url
 * @param {number} ms - timeout in milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, ms = 8000) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out. Please try again.');
    throw new Error('Network error. Please check your internet connection.');
  } finally {
    clearTimeout(tid);
  }
}

/**
 * Fetches the latest available air quality data for a named city.
 *
 * @param {string} cityName  User-entered city (e.g. "Bengaluru", "Delhi")
 * @returns {Promise<AqiResult>}
 * @throws {Error} User-friendly message on any failure
 */
export async function fetchCityAqi(cityName) {
  if (!cityName || !cityName.trim()) throw new Error('Please enter a city name.');
  const city = cityName.trim();

  // ── Step 1: Geocode city name → lat / lon ────────────────────────────────
  const geoUrl = `${GEO_API}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const geoRes = await fetchWithTimeout(geoUrl, 8000);
  if (!geoRes.ok) throw new Error(`Geocoding service error (${geoRes.status}). Please try again.`);

  let geoJson;
  try { geoJson = await geoRes.json(); }
  catch { throw new Error('Invalid response from geocoding service. Please try again.'); }

  if (!geoJson.results || geoJson.results.length === 0) {
    throw new Error(
      `City not found: "${city}". ` +
      `Try a different spelling or a nearby major city ` +
      `(e.g., Bengaluru, Delhi, Mumbai, Chennai, Hyderabad, Pune, Kolkata).`
    );
  }

  const place = geoJson.results[0];
  const lat   = place.latitude;
  const lon   = place.longitude;

  // Build a human-readable city label
  const parts = [place.name];
  if (place.admin1 && place.admin1 !== place.name) parts.push(place.admin1);
  if (place.country) parts.push(place.country);
  const cityLabel = parts.join(', ');

  // ── Step 2: Fetch air quality at the resolved coordinates ────────────────
  const aqParams = [
    `latitude=${lat}`, `longitude=${lon}`,
    'hourly=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide',
    'timezone=auto',
    'forecast_days=1',
  ].join('&');
  const aqUrl = `${AQ_API}?${aqParams}`;

  const aqRes = await fetchWithTimeout(aqUrl, 8000);
  if (!aqRes.ok) throw new Error(`Air quality service error (${aqRes.status}). Please try again.`);

  let aqJson;
  try { aqJson = await aqRes.json(); }
  catch { throw new Error('Invalid response from air quality service. Please try again.'); }

  const hourly = aqJson.hourly;
  if (!hourly || !Array.isArray(hourly.time) || hourly.time.length === 0) {
    throw new Error(`No air quality data available for "${city}". Please try another city.`);
  }

  // ── Step 3: Pick the most recent non-null hourly value ───────────────────
  // Open-Meteo returns forecast + past hours; the last non-null index is current.
  const getLatest = (arr) => {
    if (!Array.isArray(arr)) return null;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] != null && !isNaN(arr[i])) return parseFloat(Number(arr[i]).toFixed(1));
    }
    return null;
  };

  const aqi  = getLatest(hourly.us_aqi);
  if (aqi == null || aqi < 0) {
    throw new Error(`No current AQI reading for "${city}". Try a nearby major city.`);
  }

  // CO from Open-Meteo is in μg/m³ — convert to mg/m³ for display (÷1000)
  const coRaw = getLatest(hourly.carbon_monoxide);
  const co    = coRaw != null ? parseFloat((coRaw / 1000).toFixed(2)) : null;

  // Pick the timestamp of the latest valid us_aqi reading
  let lastUpdated = 'Unknown';
  try {
    const idx = hourly.us_aqi.reduce((best, v, i) =>
      (v != null && !isNaN(v)) ? i : best, -1);
    if (idx >= 0 && hourly.time[idx]) {
      // Open-Meteo times are ISO-like "2026-09-20T14:00" (local tz)
      const dt = new Date(hourly.time[idx]);
      if (!isNaN(dt)) {
        lastUpdated = dt.toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: true,
          timeZone: place.timezone || 'Asia/Kolkata'
        });
      }
    }
  } catch { /* keep 'Unknown' */ }

  return {
    cityRaw:           cityLabel,
    aqi:               Math.round(aqi),
    dominantPollutant: null,       // Open-Meteo doesn't report this; AQI already reflects it
    pm25:  getLatest(hourly.pm2_5),
    pm10:  getLatest(hourly.pm10),
    co,
    no2:   getLatest(hourly.nitrogen_dioxide),
    o3:    getLatest(hourly.ozone),
    so2:   getLatest(hourly.sulphur_dioxide),
    lastUpdated,
    source:    'Copernicus CAMS / Open-Meteo (Free, No API Key)',
    sourceUrl: `https://open-meteo.com/`,
    isLive:    true,
  };
}

/**
 * @typedef {Object} AqiResult
 * @property {string}      cityRaw           - Resolved city name + admin + country
 * @property {number}      aqi               - US EPA AQI (0–500)
 * @property {string|null} dominantPollutant - Key pollutant (null for Open-Meteo)
 * @property {number|null} pm25              - PM2.5 µg/m³
 * @property {number|null} pm10              - PM10 µg/m³
 * @property {number|null} co                - CO mg/m³
 * @property {number|null} no2               - NO2 µg/m³
 * @property {number|null} o3                - O3 µg/m³
 * @property {number|null} so2               - SO2 µg/m³
 * @property {string}      lastUpdated       - Human-readable timestamp
 * @property {string}      source            - Data source label
 * @property {string}      sourceUrl         - Reference URL
 * @property {boolean}     isLive            - Always true for API data
 */
