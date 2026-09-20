/**
 * AI Health Intelligence Dashboard – Compact Edition
 */
import { DEMO_SCENARIOS, runHealthAdvisor } from './healthAdvisor.js';
import { SYMPTOM_DEFINITIONS, getAqiCategory } from './healthRules.js';
import { saveAssessmentToHistory } from './historyService.js';
import { fetchCityAqi } from './aqiService.js';

export function renderHealthAdvisorDialog() {
  const presetButtons = DEMO_SCENARIOS.map(s => `
    <button class="dash-preset-btn" data-preset-id="${s.id}" title="${s.tag}">
      <span>${s.icon || '⚡'}</span><span>${s.name}</span>
    </button>
  `).join('');

  const symptomButtons = SYMPTOM_DEFINITIONS.map(sym => `
    <button type="button" class="dash-sym-btn" data-symptom-id="${sym.id}">${sym.label}</button>
  `).join('');

  return `
    <dialog id="advisor-dialog" class="atlas-dialog advisor-dialog-custom dash-dialog">
      <!-- Close Button Pinned Top-Right -->
      <button type="button" class="dialog-close dash-close-btn icon-button" data-close-dialog="advisor-dialog" aria-label="Close">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2.5"><path d="m6 6 12 12M18 6 6 18"/></svg>
      </button>

      <!-- Header -->
      <div class="dash-header">
        <div class="dash-header-left">
          <span class="dash-header-label">⚡ AI HEALTH ADVISOR</span>
          <div class="dash-live-badge"><span class="dash-live-dot"></span><span id="dash-live-text">READY</span></div>
        </div>
        <div class="dash-header-right">
          <div class="dash-sum-strip">
            <span class="dash-chip" id="chip-bmi">BMI <b id="sum-bmi-val">22.9</b></span>
            <span class="dash-chip" id="chip-hr">HR <b id="sum-hr-val">75</b></span>
            <span class="dash-chip" id="chip-bp">BP <b id="sum-bp-val">120/80</b></span>
            <span class="dash-chip" id="chip-spo2">SpO₂ <b id="sum-spo2-val">98%</b></span>
            <span class="dash-chip" id="chip-aqi">AQI <b id="sum-aqi-val">45</b></span>
            <span class="dash-chip dash-chip-risk" id="chip-risk">Risk <b id="sum-risk-val">—</b></span>
          </div>
        </div>
      </div>

      <!-- Presets -->
      <div class="dash-presets-bar">
        <span class="dash-presets-label">PRESETS:</span>
        ${presetButtons}
      </div>

      <!-- Two-Column Workspace -->
      <div class="dash-workspace">

        <!-- LEFT: Compact Input Form -->
        <div class="dash-inputs-col">

          <!-- Profile + Vitals combined -->
          <div class="dash-card">
            <div class="dash-card-head"><span class="dash-card-icon cyan">👤</span><span class="dash-card-title">Profile & Vitals</span>
              <div class="dash-bmi-chip">BMI <span id="dash-bmi-text" style="font-weight:700;color:#00e5ff">22.9</span></div>
            </div>
            <div class="dash-compact-grid">
              <label class="dash-field"><span>Age</span><input type="number" id="adv-age" value="30" min="1" max="120" class="dash-input"></label>
              <label class="dash-field"><span>Gender</span>
                <select id="adv-gender" class="dash-input">
                  <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                </select>
              </label>
              <label class="dash-field"><span>Height cm</span><input type="number" id="adv-height" value="175" min="100" max="250" class="dash-input"></label>
              <label class="dash-field"><span>Weight kg</span><input type="number" id="adv-weight" value="70" min="20" max="300" class="dash-input"></label>
              <label class="dash-field"><span>Heart Rate</span><input type="number" id="adv-hr" value="75" min="30" max="220" class="dash-input"></label>
              <label class="dash-field"><span>SpO₂ %</span><input type="number" id="adv-spo2" value="98" min="70" max="100" class="dash-input"></label>
              <label class="dash-field"><span>Systolic BP</span><input type="number" id="adv-sys" value="120" min="60" max="240" class="dash-input"></label>
              <label class="dash-field"><span>Diastolic BP</span><input type="number" id="adv-dia" value="80" min="40" max="140" class="dash-input"></label>
              <label class="dash-field"><span>Resp. Rate</span><input type="number" id="adv-rr" value="16" min="6" max="45" class="dash-input"></label>
              <label class="dash-field"><span>Temp °C</span><input type="number" step="0.1" id="adv-temp" value="36.8" min="34" max="43" class="dash-input"></label>
            </div>
          </div>

          <!-- Environment / AQI with City Search -->
          <div class="dash-card" id="adv-aqi-card">
            <div class="dash-card-head">
              <span class="dash-card-icon green">&#127757;</span>
              <span class="dash-card-title">Air Quality (AQI)</span>
              <span id="adv-aqi-badge" class="aqi-badge" style="margin-left:auto;background:rgba(16,185,129,.15);color:#10b981;border-color:#10b981">AQI 45 &#183; Good</span>
            </div>

            <!-- City Search Row -->
            <div style="display:flex;gap:6px;margin-bottom:8px;align-items:center">
              <input type="text" id="adv-city-input"
                placeholder="&#128269; Search city (e.g. Bengaluru, Delhi...)"
                autocomplete="off" spellcheck="false"
                style="flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:#e2e8f0;font-size:11px;padding:6px 10px;outline:none;font-family:inherit"
              >
              <button type="button" id="adv-city-search-btn"
                style="padding:6px 12px;background:linear-gradient(135deg,#0ea5e9,#6366f1);border:none;border-radius:6px;color:#fff;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap;letter-spacing:.4px"
              >Fetch AQI</button>
            </div>

            <!-- City Status Panel (hidden by default) -->
            <div id="adv-city-status" style="display:none;margin-bottom:8px;border-radius:7px;padding:8px 10px;font-size:9.5px;line-height:1.55"></div>

            <!-- AQI Display + Slider -->
            <div class="dash-aqi-row-compact">
              <div class="dash-aqi-num-block">
                <span class="dash-aqi-big" id="adv-aqi-num">45</span>
                <small>AQI</small>
              </div>
              <div style="flex:1">
                <div id="adv-aqi-mode-tag" style="font-size:8px;color:#475569;margin-bottom:3px">&#9999;&#65039; Manual — or search a city above for live data</div>
                <input type="range" id="adv-aqi-slider" min="10" max="450" value="45" step="5" class="adv-range-slider" style="width:100%;accent-color:#00e5ff">
                <div class="dash-pollutants-compact">
                  <span>PM2.5 <b id="adv-pm25-val">12</b></span>
                  <span>PM10 <b id="adv-pm10-val">25</b></span>
                  <span>CO <b id="adv-co-val">0.5</b></span>
                  <span>NO&#8322; <b id="adv-no2-val">18</b></span>
                  <span>O&#8323; <b id="adv-o3-val">22</b></span>
                  <span>SO&#8322; <b id="adv-so2-val">5</b></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Lifestyle -->
          <div class="dash-card">
            <div class="dash-card-head"><span class="dash-card-icon purple">🧬</span><span class="dash-card-title">Lifestyle</span></div>
            <div class="dash-compact-grid">
              <label class="dash-field"><span>Smoking</span>
                <select id="adv-smoking" class="dash-input">
                  <option value="never">Non-smoker</option><option value="occasional">Occasional</option><option value="regular">Regular</option>
                </select>
              </label>
              <label class="dash-field"><span>Activity</span>
                <select id="adv-exercise" class="dash-input">
                  <option value="frequent">Active</option><option value="moderate" selected>Moderate</option>
                  <option value="rare">Sedentary</option><option value="none">Inactive</option>
                </select>
              </label>
              <label class="dash-field"><span>Sleep hrs</span><input type="number" step="0.5" id="adv-sleep" value="7.5" min="2" max="14" class="dash-input"></label>
              <label class="dash-field"><span>Water L/day</span><input type="number" step="0.2" id="adv-water" value="2.5" min="0.5" max="8" class="dash-input"></label>
            </div>
          </div>

          <!-- Symptoms -->
          <div class="dash-card">
            <div class="dash-card-head">
              <span class="dash-card-icon orange">🩺</span>
              <span class="dash-card-title">Symptoms</span>
              <span class="dash-sym-count-badge" id="dash-sym-count">0 selected</span>
            </div>
            <div class="dash-sym-cloud" id="adv-symptoms-container">${symptomButtons}</div>
          </div>

          <!-- Run Button -->
          <button id="adv-run-assessment-btn" class="dash-run-btn">⚡ Run AI Assessment</button>
        </div>

        <!-- RIGHT: Analysis Output -->
        <div class="dash-analysis-col" id="adv-results-box">
          <div class="dash-placeholder">
            <div class="dash-pulse-core" style="font-size:40px;margin-bottom:14px">🫀</div>
            <h3>AI Analysis Ready</h3>
            <p>Fill in the form and click <strong>Run AI Assessment</strong> to see your personalized risk analysis with 3D anatomy correlation.</p>
          </div>
        </div>

      </div>
    </dialog>
  `;
}

export function renderAssessmentResults(assessment) {
  const { score, level, color, primarySystem, systemMeta, targetOrgan, targetRegion,
    aqiCategory, contributingFactors, vitalDeviations, recommendations, warningSigns,
    advisoryText, disclaimer, systemMatrix, explainability, bmi, aqiSource } = assessment;

  const circum = 2 * Math.PI * 32;
  const offset = circum * (1 - score / 100);
  const donutSvg = `
    <svg viewBox="0 0 80 80" width="72" height="72">
      <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="9"/>
      <circle cx="40" cy="40" r="32" fill="none" stroke="${color}" stroke-width="9"
        stroke-dasharray="${circum.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"
        stroke-linecap="round" transform="rotate(-90 40 40)" style="transition:stroke-dashoffset 0.8s ease;"/>
      <text x="40" y="37" text-anchor="middle" fill="${color}" font-size="16" font-weight="700">${score}</text>
      <text x="40" y="50" text-anchor="middle" fill="rgba(255,255,255,.4)" font-size="8">/100</text>
    </svg>`;

  const factorsHtml = contributingFactors.map((f, i) => `
    <div class="dash-factor-row">
      <div class="dash-factor-header"><span class="dash-factor-name">${f.name}</span><span class="dash-factor-pct" style="color:${f.color}">${f.weight}%</span></div>
      <div class="dash-factor-track"><div class="dash-factor-fill" style="width:${f.weight}%;background:${f.color};animation-delay:${i*0.07}s"></div></div>
      ${f.note ? `<div style="font-size:8.5px;color:#64748b;margin-top:2px;line-height:1.3">${f.note}</div>` : ''}
    </div>`).join('');

  const obsHtml = vitalDeviations.length ? `<div class="dash-obs-tags">${vitalDeviations.map(o=>`<span class="dash-obs-tag">${o}</span>`).join('')}</div>` : '';

  const warnHtml = warningSigns.length ? `
    <div class="dash-result-section dash-warn-section">
      <div class="dash-sec-label" style="color:#f87171">🚨 Alert</div>
      <p style="font-size:10px;color:#fca5a5;line-height:1.55;margin:0">${warningSigns.join(' ')}</p>
    </div>` : '';

  // System matrix — keyed to match engine output (circulatory, nervous, muscular)
  // Display labels are user-friendly names; keys must match what riskEngine returns.
  const systems = [
    { key: 'circulatory', label: 'Cardiovascular', icon: '❤️' },
    { key: 'respiratory', label: 'Respiratory',    icon: '🫁' },
    { key: 'nervous',     label: 'Neurological',   icon: '🧠' },
    { key: 'muscular',    label: 'Musculoskeletal',icon: '🦴' },
    { key: 'digestive',   label: 'Digestive',      icon: '🫄' },
    { key: 'urinary',     label: 'Renal',          icon: '🩸' },
  ];
  const matrixHtml = systems.map(sys => {
    // Use the computed systemMatrix score — zero randomness.
    const s = (systemMatrix && systemMatrix[sys.key] != null) ? Math.round(systemMatrix[sys.key]) : 0;
    const c = s >= 70 ? '#ef4444' : s >= 45 ? '#f59e0b' : '#10b981';
    const p = sys.key === primarySystem;
    return `<div class="dash-matrix-row${p ? ' dash-matrix-primary' : ''}">
      <span>${sys.icon}</span><span class="dash-matrix-label">${sys.label}</span>
      <div class="dash-matrix-track"><div class="dash-matrix-fill" style="width:${s}%;background:${c}"></div></div>
      <span class="dash-matrix-score" style="color:${c}">${s}%</span>
    </div>`;
  }).join('');

  // Format advisory paragraphs
  const advisoryParas = advisoryText
    ? advisoryText.split('\n\n').map(p => p.trim()).filter(Boolean).map(p =>
        `<p style="font-size:10.5px;line-height:1.65;color:#cbd5e1;margin:0 0 10px 0;last-child:margin-bottom:0">${p}</p>`
      ).join('')
    : '';

  return `
    <div class="dash-results">
      <!-- Score + System -->
      <div class="dash-score-header" style="border-color:${color}44;background:${color}08">
        <div class="dash-score-left">
          <span class="dash-risk-pill" style="background:${color}22;color:${color};border:1px solid ${color}55">${level} RISK</span>
          <div style="font-size:12px;font-weight:600;color:#f1f5f9;margin-top:4px">AI Health Assessment</div>
          <div style="font-size:11px;color:${systemMeta.color}">${systemMeta.icon} ${systemMeta.name}</div>
        </div>
        <div>${donutSvg}</div>
      </div>

      <!-- 3D Focus -->
      <div class="dash-anatomy-card" style="border-color:${systemMeta.color}44;background:${systemMeta.color}08">
        <div style="display:flex;gap:10px;align-items:center">
          <span style="font-size:22px">${systemMeta.icon}</span>
          <div style="flex:1">
            <div style="font-size:9px;font-weight:700;letter-spacing:.08em;color:${systemMeta.color}">PRIMARY: ${systemMeta.name.toUpperCase()}</div>
            <div style="font-size:11.5px;color:#f1f5f9;font-weight:600">Target: ${systemMeta.organ} <span class="dash-region-chip">${targetRegion.toUpperCase()}</span></div>
            <p style="font-size:9.5px;color:#64748b;margin:3px 0 0;line-height:1.4">${systemMeta.desc}</p>
          </div>
        </div>
        <button class="dash-highlight-btn" id="adv-highlight-3d-btn" data-organ="${targetOrgan}" data-region="${targetRegion}"
          style="border-color:${systemMeta.color}55;color:${systemMeta.color}">
          🔍 Focus on ${systemMeta.organ} in 3D Anatomy →
        </button>
      </div>

      <!-- Factors -->
      <div class="dash-result-section">
        <div class="dash-sec-label">&#129504; Factor Attribution</div>
        <div class="dash-factors-list">${factorsHtml}</div>
      </div>

      ${obsHtml ? `<div class="dash-result-section"><div class="dash-sec-label">&#9888; Observations</div>${obsHtml}</div>` : ''}

      <!-- Explainability: Why this result? -->
      ${explainability ? `
      <div class="dash-result-section" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:10px">
        <div class="dash-sec-label" style="margin-bottom:6px">&#128161; Why This Result?</div>
        <ul style="margin:0;padding:0 0 0 14px;list-style:disc;">
          ${explainability.reasons.map(r => `<li style="font-size:9.5px;color:#94a3b8;margin-bottom:3px;line-height:1.45">${r}</li>`).join('')}
        </ul>
      </div>` : ''}

      <!-- Env + Matrix side by side -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="dash-result-section">
          <div class="dash-sec-label">&#127757; Environment</div>
          <span class="dash-env-badge" style="background:${aqiCategory.color}22;color:${aqiCategory.color};border-color:${aqiCategory.color}55">AQI: ${aqiCategory.tier}</span>
          ${aqiSource && aqiSource.city ? `<div style="font-size:9.5px;font-weight:600;color:#38bdf8;margin-top:5px">&#127757; ${aqiSource.city}</div>` : ''}
          <p style="font-size:9.5px;color:#94a3b8;margin:6px 0 0;line-height:1.4">${aqiCategory.desc}</p>
        </div>
        <div class="dash-result-section">
          <div class="dash-sec-label">&#128300; System Matrix</div>
          <p style="font-size:8px;color:#475569;margin:0 0 5px 0">Computed from inputs — no randomness</p>
          <div class="dash-risk-matrix">${matrixHtml}</div>
        </div>
      </div>

      <!-- AI Advisory (Paragraph Form) -->
      ${advisoryParas ? `
      <div class="dash-result-section" style="border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;background:rgba(255,255,255,0.03)">
        <div class="dash-sec-label" style="margin-bottom:8px">&#129302; AI Health Advisory</div>
        <div style="border-left:2px solid ${color}66;padding-left:10px">
          ${advisoryParas}
        </div>
      </div>` : ''}

      ${warnHtml}

      <div class="dash-disclaimer">&#9888;&#65039; ${disclaimer}</div>
    </div>
  `;
}

// ─── Interactions ─────────────────────────────────────────────────────────

export function setupAdvisorInteractions(root, onHighlightOrgan) {
  const dialog = root.querySelector('#advisor-dialog');
  if (!dialog) return;

  // ── Robust close handler ──────────────────────────────────────────
  function closeAdvisorDialog() {
    try {
      if (typeof dialog.close === 'function') dialog.close();
    } catch {}
    dialog.removeAttribute('open');
    dialog.classList.remove('active');
  }

  const closeBtns = root.querySelectorAll('.dash-close-btn, [data-close-dialog="advisor-dialog"]');
  closeBtns.forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      closeAdvisorDialog();
    };
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      closeAdvisorDialog();
    }
  });

  const aqiSlider = root.querySelector('#adv-aqi-slider');
  const aqiNum    = root.querySelector('#adv-aqi-num');
  const aqiBadge  = root.querySelector('#adv-aqi-badge');
  const pm25Val   = root.querySelector('#adv-pm25-val');
  const pm10Val   = root.querySelector('#adv-pm10-val');
  const coVal     = root.querySelector('#adv-co-val');
  const no2Val    = root.querySelector('#adv-no2-val');
  const o3Val     = root.querySelector('#adv-o3-val');
  const so2Val    = root.querySelector('#adv-so2-val');
  const symptomBtns    = root.querySelectorAll('.dash-sym-btn');
  const runBtn         = root.querySelector('#adv-run-assessment-btn');
  const resultsBox     = root.querySelector('#adv-results-box');
  const presetBtns     = root.querySelectorAll('.dash-preset-btn');
  const symCountBadge  = root.querySelector('#dash-sym-count');
  const cityInput      = root.querySelector('#adv-city-input');
  const citySearchBtn  = root.querySelector('#adv-city-search-btn');
  const cityStatus     = root.querySelector('#adv-city-status');
  const aqiModeTag     = root.querySelector('#adv-aqi-mode-tag');
  let selectedSymptoms = new Set();

  // ── Live AQI data from city search ────────────────────────────────
  // When set, the slider still moves but pollutant values are locked to API data.
  // Manually dragging the slider clears this and reverts to estimated values.
  let liveAqiData = null;

  // ── Live chip updaters ────────────────────────────────────────────
  function updateChips() {
    const h = +root.querySelector('#adv-height')?.value || 175;
    const w = +root.querySelector('#adv-weight')?.value || 70;
    const hr = +root.querySelector('#adv-hr')?.value || 75;
    const spo2 = +root.querySelector('#adv-spo2')?.value || 98;
    const sys = +root.querySelector('#adv-sys')?.value || 120;
    const dia = +root.querySelector('#adv-dia')?.value || 80;
    const aqiVal = +aqiSlider?.value || 45;

    const bmi = (w / ((h / 100) ** 2)).toFixed(1);
    let bmiColor = bmi < 18.5 ? '#60a5fa' : bmi < 25 ? '#10b981' : bmi < 30 ? '#f59e0b' : '#ef4444';
    let hrColor = hr < 60 || hr > 100 ? '#ef4444' : '#10b981';
    let bpColor = sys >= 140 || dia >= 90 ? '#ef4444' : sys >= 120 ? '#f59e0b' : '#10b981';
    let spo2Color = spo2 < 90 ? '#ef4444' : spo2 < 95 ? '#f59e0b' : '#10b981';
    const aqiCat = getAqiCategory(aqiVal);

    const setChip = (id, val, color) => {
      const el = root.querySelector(id);
      if (el) { el.style.borderColor = color + '55'; el.style.color = '#e2e8f0'; }
      const b = root.querySelector(id + ' b, ' + id.replace('#chip-',`#sum-`) + '-val');
      if (b) { b.style.color = color; b.textContent = val; }
    };

    // simpler direct set
    const sv = (id, val) => { const el = root.querySelector(id); if (el) el.textContent = val; };
    sv('#sum-bmi-val', bmi); sv('#sum-hr-val', hr); sv('#sum-bp-val', `${sys}/${dia}`);
    sv('#sum-spo2-val', spo2 + '%'); sv('#sum-aqi-val', aqiVal);

    // Color border on chips
    const chipColor = (id, color) => { const el = root.querySelector(id); if (el) el.style.borderColor = color + '66'; };
    chipColor('#chip-bmi', bmiColor); chipColor('#chip-hr', hrColor);
    chipColor('#chip-bp', bpColor); chipColor('#chip-spo2', spo2Color);
    chipColor('#chip-aqi', aqiCat.color);

    // BMI chip inline
    const bmiT = root.querySelector('#dash-bmi-text');
    if (bmiT) { bmiT.textContent = bmi; bmiT.style.color = bmiColor; }
  }

  ['#adv-height','#adv-weight','#adv-hr','#adv-spo2','#adv-sys','#adv-dia','#adv-sleep','#adv-water'].forEach(sel => {
    root.querySelector(sel)?.addEventListener('input', updateChips);
  });
  updateChips();

  // ── AQI slider ────────────────────────────────────────────────────
  // Dragging the slider manually clears live city data (user is overriding).
  aqiSlider?.addEventListener('input', () => {
    const val = +aqiSlider.value;
    if (aqiNum) aqiNum.textContent = val;
    const cat = getAqiCategory(val);
    if (aqiBadge) {
      aqiBadge.textContent = `AQI ${val} \u00b7 ${cat.tier}`;
      aqiBadge.style.background = cat.color + '22';
      aqiBadge.style.color = cat.color;
      aqiBadge.style.borderColor = cat.color + '66';
    }
    // Only recalculate estimated pollutant values when NOT locked to live data.
    // If liveAqiData is set, the slider still moves (AQI overridden) but
    // pollutant fields keep the real API values until the user manually changes them.
    if (!liveAqiData) {
      if (pm25Val) pm25Val.textContent = Math.round(val * 0.55);
      if (pm10Val) pm10Val.textContent = Math.round(val * 0.85);
      if (coVal)   coVal.textContent   = (val * 0.008).toFixed(1);
      if (no2Val)  no2Val.textContent  = Math.round(val * 0.22);
      if (o3Val)   o3Val.textContent   = Math.round(val * 0.18);
      if (so2Val)  so2Val.textContent  = Math.round(val * 0.05) || 5;
    } else {
      // User is manually overriding AQI while city data exists — show override notice
      if (aqiModeTag) {
        aqiModeTag.textContent = `\u26A0\uFE0F Manual override \u2014 AQI ${val}. City data still active for other pollutants.`;
        aqiModeTag.style.color = '#f59e0b';
      }
    }
    updateChips();
  });

  // ── City AQI Search ───────────────────────────────────────────────
  function setStatusLoading() {
    if (!cityStatus) return;
    cityStatus.style.display = 'block';
    cityStatus.style.background = 'rgba(99,102,241,0.1)';
    cityStatus.style.border = '1px solid rgba(99,102,241,0.3)';
    cityStatus.style.color = '#a5b4fc';
    cityStatus.innerHTML = '&#9203; Fetching air quality data\u2026';
  }

  function setStatusError(msg) {
    if (!cityStatus) return;
    cityStatus.style.display = 'block';
    cityStatus.style.background = 'rgba(239,68,68,0.08)';
    cityStatus.style.border = '1px solid rgba(239,68,68,0.25)';
    cityStatus.style.color = '#fca5a5';
    cityStatus.innerHTML = `&#10060; ${msg}`;
  }

  function setStatusSuccess(data) {
    if (!cityStatus) return;
    const cat = getAqiCategory(data.aqi);
    const so2row = data.so2 != null
      ? `<span>SO&#8322; <b>${data.so2}</b> <small style="opacity:.6">µg/m³</small></span>` : '';
    cityStatus.style.display = 'block';
    cityStatus.style.background = `${cat.color}11`;
    cityStatus.style.border = `1px solid ${cat.color}33`;
    cityStatus.style.color = '#e2e8f0';
    cityStatus.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
        <span style="font-size:14px">&#127757;</span>
        <span style="font-weight:700;color:${cat.color};font-size:11px">${data.cityRaw}</span>
        <span style="margin-left:auto;background:${cat.color}22;color:${cat.color};border:1px solid ${cat.color}55;border-radius:4px;padding:2px 8px;font-size:10px;font-weight:700">${data.aqi} &middot; ${cat.tier}</span>
      </div>
      <div style="font-size:9px;color:#64748b;margin-bottom:6px">
        Data Source: <a href="${data.sourceUrl}" target="_blank" rel="noopener" style="color:#6366f1;text-decoration:none">${data.source}</a>
      </div>
      <div style="font-size:9px;color:#64748b;margin-bottom:5px">
        Last updated: <b style="color:#94a3b8">${data.lastUpdated}</b>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:9px;color:#94a3b8">
        ${data.pm25 != null ? `<span>PM2.5 <b>${data.pm25}</b> <small style="opacity:.6">µg/m³</small></span>` : ''}
        ${data.pm10 != null ? `<span>PM10 <b>${data.pm10}</b> <small style="opacity:.6">µg/m³</small></span>` : ''}
        ${data.co   != null ? `<span>CO <b>${data.co}</b> <small style="opacity:.6">mg/m³</small></span>` : ''}
        ${data.no2  != null ? `<span>NO&#8322; <b>${data.no2}</b> <small style="opacity:.6">µg/m³</small></span>` : ''}
        ${data.o3   != null ? `<span>O&#8323; <b>${data.o3}</b> <small style="opacity:.6">µg/m³</small></span>` : ''}
        ${so2row}
      </div>`;
  }

  function applyLiveAqiData(data) {
    liveAqiData = data;
    const cat = getAqiCategory(data.aqi);

    // Update slider position
    if (aqiSlider) {
      const clamped = Math.min(450, Math.max(10, data.aqi));
      aqiSlider.value = clamped;
    }
    // Update AQI number and badge
    if (aqiNum) aqiNum.textContent = data.aqi;
    if (aqiBadge) {
      aqiBadge.textContent = `AQI ${data.aqi} \u00b7 ${cat.tier}`;
      aqiBadge.style.background = cat.color + '22';
      aqiBadge.style.color      = cat.color;
      aqiBadge.style.borderColor = cat.color + '55';
    }
    // Update pollutant values from API (real values, not estimates)
    // Any null value falls back to an estimate from the AQI
    const aqi = data.aqi;
    if (pm25Val) pm25Val.textContent = data.pm25 ?? Math.round(aqi * 0.55);
    if (pm10Val) pm10Val.textContent = data.pm10 ?? Math.round(aqi * 0.85);
    if (coVal)   coVal.textContent   = data.co   ?? (aqi * 0.008).toFixed(1);
    if (no2Val)  no2Val.textContent  = data.no2  ?? Math.round(aqi * 0.22);
    if (o3Val)   o3Val.textContent   = data.o3   ?? Math.round(aqi * 0.18);
    if (so2Val)  so2Val.textContent  = (data.so2  ?? Math.round(aqi * 0.05)) || 5;

    // Update the AQI chip in header
    const sumAqi = root.querySelector('#sum-aqi-val');
    if (sumAqi) sumAqi.textContent = data.aqi;
    const chipAqi = root.querySelector('#chip-aqi');
    if (chipAqi) chipAqi.style.borderColor = cat.color + '66';

    // Mode label
    if (aqiModeTag) {
      aqiModeTag.style.color = '#10b981';
      aqiModeTag.innerHTML =
        `&#9679; Live city data \u2014 ${data.cityRaw} &middot; Move slider to override`;
    }
  }

  async function doSearch() {
    const query = cityInput?.value?.trim();
    if (!query) { setStatusError('Please enter a city name.'); return; }

    if (citySearchBtn) {
      citySearchBtn.disabled = true;
      citySearchBtn.textContent = '\u23F3 Fetching\u2026';
    }
    setStatusLoading();

    try {
      const data = await fetchCityAqi(query);
      applyLiveAqiData(data);
      setStatusSuccess(data);
    } catch (err) {
      liveAqiData = null;
      if (aqiModeTag) {
        aqiModeTag.textContent = '\u270F\uFE0F Manual \u2014 or search a city above for live data';
        aqiModeTag.style.color = '#475569';
      }
      setStatusError(err.message || 'Failed to fetch air quality data.');
    } finally {
      if (citySearchBtn) {
        citySearchBtn.disabled = false;
        citySearchBtn.textContent = 'Fetch AQI';
      }
    }
  }

  citySearchBtn?.addEventListener('click', doSearch);
  cityInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  // When user types in city input again, clear error state
  cityInput?.addEventListener('input', () => {
    if (cityStatus && cityStatus.style.color === 'rgb(252, 165, 165)') {
      cityStatus.style.display = 'none';
    }
  });

  // ── Symptoms ──────────────────────────────────────────────────────
  symptomBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.symptomId;
      if (selectedSymptoms.has(id)) { selectedSymptoms.delete(id); btn.classList.remove('active'); }
      else { selectedSymptoms.add(id); btn.classList.add('active'); }
      if (symCountBadge) {
        symCountBadge.textContent = `${selectedSymptoms.size} selected`;
        symCountBadge.style.background = selectedSymptoms.size ? 'rgba(239,68,68,.2)' : '';
        symCountBadge.style.color = selectedSymptoms.size ? '#fca5a5' : '';
      }
    });
  });

  // Preset loading clears live city data so slider re-takes control
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const scenario = DEMO_SCENARIOS.find(s => s.id === btn.dataset.presetId);
      if (!scenario) return;
      presetBtns.forEach(b => b.classList.toggle('active', b === btn));
      const { demographics: d, vitals: v, environmental: e, lifestyle: l, symptoms } = scenario.payload;
      root.querySelector('#adv-age').value = d.age;
      root.querySelector('#adv-gender').value = d.gender;
      root.querySelector('#adv-height').value = d.height || 170;
      root.querySelector('#adv-weight').value = d.weight || 70;
      root.querySelector('#adv-hr').value = v.heartRate;
      root.querySelector('#adv-spo2').value = v.spo2;
      root.querySelector('#adv-sys').value = v.systolicBP;
      root.querySelector('#adv-dia').value = v.diastolicBP;
      root.querySelector('#adv-rr').value = v.respiratoryRate;
      root.querySelector('#adv-temp').value = v.bodyTemp;
      // Clear live city data when loading a preset
      liveAqiData = null;
      if (aqiModeTag) { aqiModeTag.textContent = '\u270F\uFE0F Manual \u2014 preset loaded'; aqiModeTag.style.color = '#475569'; }
      if (cityStatus) cityStatus.style.display = 'none';
      if (aqiSlider) { aqiSlider.value = e.aqi; aqiSlider.dispatchEvent(new Event('input')); }
      root.querySelector('#adv-smoking').value = l.smoking;
      root.querySelector('#adv-exercise').value = l.exercise;
      root.querySelector('#adv-sleep').value = l.sleep;
      root.querySelector('#adv-water').value = l.water;
      selectedSymptoms.clear();
      symptomBtns.forEach(b => {
        const has = symptoms.includes(b.dataset.symptomId);
        if (has) selectedSymptoms.add(b.dataset.symptomId);
        b.classList.toggle('active', has);
      });
      if (symCountBadge) symCountBadge.textContent = `${selectedSymptoms.size} selected`;
      updateChips();
      runAssessment();
    });
  });

  // ── Run Assessment ─────────────────────────────────────────────────
  function runAssessment() {
    // Use live AQI pollutant values when available;
    // otherwise read from DOM (estimated from slider or preset)
    const so2Live = (liveAqiData?.so2 ?? +so2Val?.textContent) || 5;

    const payload = {
      demographics: { age: +root.querySelector('#adv-age').value||30, gender: root.querySelector('#adv-gender').value,
        height: +root.querySelector('#adv-height')?.value||175, weight: +root.querySelector('#adv-weight')?.value||70 },
      vitals: { heartRate: +root.querySelector('#adv-hr').value||75, spo2: +root.querySelector('#adv-spo2').value||98,
        systolicBP: +root.querySelector('#adv-sys').value||120, diastolicBP: +root.querySelector('#adv-dia').value||80,
        respiratoryRate: +root.querySelector('#adv-rr').value||16, bodyTemp: +root.querySelector('#adv-temp').value||36.8 },
      environmental: {
        aqi:  +aqiSlider.value||45,
        pm25: +pm25Val?.textContent||12,
        pm10: +pm10Val?.textContent||25,
        co:   +coVal?.textContent||0.5,
        no2:  +no2Val?.textContent||18,
        so2:  so2Live,
        o3:   +o3Val?.textContent||22
      },
      lifestyle: { smoking: root.querySelector('#adv-smoking').value,
        exercise: root.querySelector('#adv-exercise').value,
        sleep: +root.querySelector('#adv-sleep').value||7.5, water: +root.querySelector('#adv-water').value||2.5 },
      symptoms: Array.from(selectedSymptoms)
    };
    // Attach data-source label to payload for display
    payload.aqiSource = liveAqiData
      ? { city: liveAqiData.cityRaw, source: liveAqiData.source, lastUpdated: liveAqiData.lastUpdated, isLive: true }
      : { city: null, source: 'Manual input', lastUpdated: null, isLive: false };

    if (runBtn) { runBtn.disabled = true; runBtn.textContent = '⏳ Analyzing…'; }

    setTimeout(() => {
      const result = runHealthAdvisor(payload);
      if (resultsBox) resultsBox.innerHTML = renderAssessmentResults(result);
      saveAssessmentToHistory({ ...result, payload });

      // Update risk chip
      const riskVal = root.querySelector('#sum-risk-val');
      if (riskVal) { riskVal.textContent = result.score; riskVal.style.color = result.color; }
      const riskChip = root.querySelector('#chip-risk');
      if (riskChip) riskChip.style.borderColor = result.color + '66';

      // Update live badge
      const liveText = root.querySelector('#dash-live-text');
      const liveDot = root.querySelector('.dash-live-dot');
      if (liveText) { liveText.textContent = result.level; liveText.style.color = result.color; }
      if (liveDot) { liveDot.style.background = result.color; liveDot.style.boxShadow = `0 0 6px ${result.color}`; }

      if (runBtn) { runBtn.disabled = false; runBtn.textContent = '⚡ Run Again'; }

      const hlBtn = resultsBox?.querySelector('#adv-highlight-3d-btn');
      if (hlBtn) {
        hlBtn.addEventListener('click', () => {
          dialog.close();
          onHighlightOrgan?.({ organ: result.targetOrgan, region: result.targetRegion,
            system: result.primarySystem, score: result.score, level: result.level,
            systemName: result.systemMeta.name });
        });
      }
    }, 500);
  }

  runBtn?.addEventListener('click', runAssessment);
}
