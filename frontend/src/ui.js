import { DISCLAIMER, ORGAN_INFO, SYSTEMS, REGION_INFO, defaultLayerOpacity } from './data/anatomy.js';
import { displayAnatomyName, filterStructures, searchableStructures } from './anatomy/skeletonNodes.js';
import { renderHealthAdvisorDialog, setupAdvisorInteractions } from './ai/AdvisorModal.js';
import { getLocalHistory, clearLocalHistory } from './ai/historyService.js';
export const escapeHtml=value=>String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

const icon=(name)=>({menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',search:'<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',pause:'<path d="M9 5v14M15 5v14"/>',play:'<path d="m8 5 11 7-11 7Z"/>',rotate:'<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>',layers:'<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',label:'<path d="M4 5h10l6 7-6 7H4V5Z"/><circle cx="8" cy="12" r="1"/>',reset:'<path d="M4 12a8 8 0 1 0 2.3-5.7L4 9M4 4v5h5"/>',eye:'<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',hide:'<path d="m3 3 18 18M10.6 6.2A11 11 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-2 2.5M6.3 6.3C3.7 8 2 12 2 12s4 6 10 6c1 0 2-.2 2.8-.5"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>',history:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',advisor:'<path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/><circle cx="12" cy="12" r="4"/>'}[name]||'');
export const svg=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icon(name)}</svg>`;

// Core 4 systems for left panel layer controls
const CORE_SYSTEMS = ['skin','skeleton','organs','circulatory'];
export const renderLayerControls = () => CORE_SYSTEMS.map(id=>{const s=SYSTEMS[id];return `<div class="system-row"><button class="layer-toggle active" data-system-toggle="${id}" aria-pressed="true" title="Toggle ${s.short}"><span class="swatch" style="--c:${s.color}"></span><span><b>${s.short}</b><small>${s.name}</small></span>${svg('eye')}</button><label><span class="sr-only">${s.short} opacity</span><input type="range" data-system="${id}" min="0" max="1" step=".05" value="${defaultLayerOpacity(id)}"></label></div>`;}).join('');

// Region buttons bar
const REGIONS = Object.entries(REGION_INFO);
export const renderRegionBar = () => `<div class="region-bar" id="movable-region-bar" role="toolbar" aria-label="Body regions"><div class="region-bar-drag-handle" title="Drag to move toolbar anywhere (Double-click to reset)" aria-label="Drag handle"><div class="region-bar-drag-handle-inner"><svg viewBox="0 0 16 16"><circle cx="5" cy="3.5" r="1.5"/><circle cx="11" cy="3.5" r="1.5"/><circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/><circle cx="5" cy="12.5" r="1.5"/><circle cx="11" cy="12.5" r="1.5"/></svg><span class="drag-hint">Move</span></div><button type="button" id="toggle-region-orientation-btn" class="region-orientation-btn" title="Switch to horizontal layout" aria-label="Toggle orientation">↔</button></div><div class="region-buttons-scroller">${REGIONS.map(([id,r])=>`<button class="region-btn" data-region="${id}" title="${r.label}" aria-pressed="false"><span class="region-emoji">${r.emoji}</span><span class="region-label">${r.label}</span></button>`).join('')}</div></div>`;

// Extended system chips (the extra 6)
const EXT_SYSTEMS = ['muscular','nervous','respiratory','digestive','urinary','endocrine'];
export const renderSystemChips = () => `<div class="system-chips">${EXT_SYSTEMS.map(id=>{const s=SYSTEMS[id];return `<button class="sys-chip" data-sys-filter="${id}" aria-pressed="false" style="--chip-c:${s.color}" title="${s.name}"><span class="chip-dot"></span>${s.short}</button>`;}).join('')}</div>`;

export function renderApp(root) {
  root.innerHTML=`<main class="app-shell">
    <header class="topbar"><div class="brand"><button class="mobile-menu icon-button" data-drawer="browser" aria-label="Open anatomy browser">${svg('menu')}</button><span class="brand-mark" aria-hidden="true"><i></i></span><div><h1>AI Advisor</h1><p>Smart Health Advisory &bull; 3D Human Visualization</p></div></div><div class="top-actions"><button class="text-button topbar-nav-btn pulse-glow" id="advisor-button">${svg('advisor')} <span>AI Health Advisor</span></button><button class="text-button topbar-nav-btn" id="history-button">${svg('history')} <span>History</span></button></div></header>

    <section class="workspace"><aside class="panel anatomy-panel" aria-label="Anatomy browser"><div class="panel-head"><div><p class="eyebrow">ANATOMY</p><h2>Structures</h2></div><button class="mobile-close icon-button" data-close-drawer aria-label="Close anatomy browser">${svg('close')}</button></div>
      <label class="search">${svg('search')}<input id="search" type="search" placeholder="Search bones and organs" autocomplete="off"><kbd>/</kbd></label>
      <div class="browser-scroll"><section><div class="section-heading"><span>Layers</span><button id="restore-all" class="quiet-button">Restore all</button></div><div class="system-list">${renderLayerControls()}</div>
      <div class="section-heading" style="margin-top:14px"><span>Systems</span></div>${renderSystemChips()}</section>
      <section><div class="section-heading"><span>Named anatomy</span><small id="result-count">7</small></div><div id="structure-list" class="structure-list"></div></section></div>
      <footer><p>${DISCLAIMER}</p><button id="credits-button" class="link-button">Credits &amp; licensing</button></footer></aside>
      <div class="viewport-wrap"><div id="loading" class="loading" role="status"><div class="load-mark">${svg('layers')}</div><strong>Loading detailed anatomy</strong><span id="loading-detail">Preparing skeleton, scanned skin, and organs…</span><div class="progress"><i id="progress-bar"></i></div></div><div id="canvas-host" role="application" tabindex="0" aria-label="Interactive 3D human anatomy model" aria-describedby="canvas-instructions"></div><p id="canvas-instructions" class="sr-only">Use arrow keys to orbit, plus and minus to zoom, number keys 1 through 4 for standard views, and R to reset.</p><div id="tooltip" role="tooltip"></div>
        <div class="viewport-top"><div class="segmented" aria-label="Standard views">${['front','back','left','right'].map(v=>`<button data-view="${v}" aria-pressed="false">${v[0].toUpperCase()+v.slice(1)}</button>`).join('')}</div><button class="tool-button" data-view="reset" aria-pressed="false" title="Reset view">${svg('reset')}</button></div>
        ${renderRegionBar()}

        <button class="inspector-tab" data-drawer="inspector">Details</button>
        <aside id="inspector" class="inspector" aria-live="polite"><div class="inspector-head"><div><p class="eyebrow" id="info-system">ANATOMY</p><p class="breadcrumb" id="breadcrumb">Human body / Overview</p></div><button id="close-info" class="icon-button" aria-label="Close details">${svg('close')}</button></div><h2 id="info-name">Explore the human body</h2><p id="info-summary">Select a named structure in the model or anatomy browser to inspect it.</p><div class="action-grid"><button data-action="focus">Focus</button><button data-action="isolate">Isolate</button><button data-action="fade">X-ray others</button><button data-action="hide">Hide</button></div><div class="fact"><b>Educational note</b><span id="info-fact">This interactive overview is simplified and not intended for diagnosis.</span></div></aside>
    </div></section></main><div id="scrim" class="scrim"></div>
    <dialog id="about"><button class="dialog-close icon-button" aria-label="Close">${svg('close')}</button><p class="eyebrow">ABOUT &amp; CREDITS</p><h2>Body Atlas</h2><p>An educational, non-diagnostic anatomy explorer. Anatomical forms and motion are simplified.</p><div class="credit"><b>Skeleton asset</b><span>Open3Dmodel — CC BY-SA 4.0; runtime left-side mirroring and web adaptations.</span><a href="https://anatomytool.org/open3dmodel-create" target="_blank" rel="noreferrer">Asset source ↗</a><a href="https://creativecommons.org/licenses/by-sa/4.0/legalcode" target="_blank" rel="noreferrer">CC BY-SA 4.0 legalcode ↗</a><a href="/licenses/CC-BY-SA-4.0.txt">Deployed license copy</a></div><div class="credit"><b>Skin &amp; organ assets</b><span>BodyParts3D, © The Database Center for Life Science — CC BY-SA 2.1 Japan; Draco/LOD, registration, material and grouping adaptations.</span><a href="https://github.com/Kevin-Mattheus-Moerman/BodyParts3D" target="_blank" rel="noreferrer">BodyParts3D source mirror ↗</a><a href="https://creativecommons.org/licenses/by-sa/2.1/jp/legalcode" target="_blank" rel="noreferrer">CC BY-SA 2.1 Japan legalcode ↗</a><a href="/licenses/CC-BY-SA-2.1-JP.txt">Deployed license notice</a><a href="/THIRD_PARTY_NOTICES.md">Full third-party notices</a></div><p class="dialog-disclaimer">${DISCLAIMER}</p></dialog>

    <dialog id="history-dialog" class="atlas-dialog history-dialog-custom">
      <button class="dialog-close icon-button" data-close-dialog="history-dialog" aria-label="Close">${svg('close')}</button>
      <div class="atlas-dialog-head">
        <p class="eyebrow" style="color: #00bcd4; display: flex; align-items: center; gap: 6px;">
          ${svg('history')} ASSESSMENT LOGS
        </p>
        <h2>Health Assessment History</h2>
      </div>
      <div class="history-toolbar">
        <span style="font-size:11px;color:#94a3b8;">Recorded diagnostic sessions &bull; Select a record to inspect 3D correlation</span>
        <button id="clear-history-btn" class="quiet-button" style="font-size:10.5px;color:#ef4444;border-color:rgba(239,68,68,0.25);">Clear History</button>
      </div>
      <div id="history-records-container" class="history-records-list"></div>
    </dialog>
    ${renderHealthAdvisorDialog()}`;

  const ui={
    host:root.querySelector('#canvas-host'),loading:root.querySelector('#loading'),loadingDetail:root.querySelector('#loading-detail'),
    progress:root.querySelector('#progress-bar'),tooltip:root.querySelector('#tooltip'),inspector:root.querySelector('#inspector'),
    structureList:root.querySelector('#structure-list'),search:root.querySelector('#search'),resultCount:root.querySelector('#result-count'),
    systemInputs:[...root.querySelectorAll('[data-system]')],systemToggles:[...root.querySelectorAll('[data-system-toggle]')],
    viewButtons:[...root.querySelectorAll('[data-view]')],regionButtons:[...root.querySelectorAll('[data-region]')],
    sysFilterButtons:[...root.querySelectorAll('[data-sys-filter]')],
    pause:root.querySelector('#pause'),rotate:root.querySelector('#rotate'),labels:root.querySelector('#labels'),
    speed:root.querySelector('#speed'),speedValue:root.querySelector('#speed-value'),closeInfo:root.querySelector('#close-info'),
    restore:root.querySelector('#restore-all'),actions:[...root.querySelectorAll('[data-action]')],
    assetStatus:root.querySelector('.asset-status span') || { textContent: '' },
    about:root.querySelector('#about'),
    historyDialog:root.querySelector('#history-dialog'),
    advisorDialog:root.querySelector('#advisor-dialog'),
  };
  ui.inspector.setAttribute('inert','');ui.inspector.setAttribute('aria-hidden','true');

  function renderHistoryList() {
    const container = root.querySelector('#history-records-container');
    if (!container) return;
    const history = getLocalHistory();
    if (!history || history.length === 0) {
      container.innerHTML = `
        <div class="history-empty-state">
          <p style="font-size:24px;margin-bottom:8px;">📋</p>
          <strong>No health assessment history found</strong>
          <p style="margin-top:4px;color:#64748b;">Run an assessment in the AI Health Advisor to generate records.</p>
        </div>
      `;
      return;
    }
    container.innerHTML = history.map(rec => {
      const dateStr = new Date(rec.timestamp).toLocaleString();
      const symList = (rec.symptoms || []).join(', ') || 'None reported';
      return `
        <div class="history-card">
          <div class="history-card-main">
            <div class="history-card-header">
              <span class="risk-badge-tier" style="background:${rec.color}22;color:${rec.color};border:1px solid ${rec.color}44;">
                ${escapeHtml(rec.level)} RISK (${escapeHtml(rec.score)})
              </span>
              <span class="history-time">${escapeHtml(dateStr)}</span>
            </div>
            <div class="history-target">Target: ${escapeHtml(rec.targetOrgan || rec.primarySystem)} &bull; <small style="color:#94a3b8;">${escapeHtml(rec.systemName)}</small></div>
            <div class="history-metrics">
              <span>HR: <b>${escapeHtml(rec.vitals?.hr || '--')} bpm</b></span>
              <span>BP: <b>${escapeHtml(rec.vitals?.bp || '--')}</b></span>
              <span>SpO2: <b>${escapeHtml(rec.vitals?.spo2 || '--')}%</b></span>
              <span>AQI: <b>${escapeHtml(rec.aqi)} (${escapeHtml(rec.aqiTier)})</b></span>
            </div>
            <div style="font-size:9.5px;color:#64748b;margin-top:2px;">Symptoms: ${escapeHtml(symList)}</div>
          </div>
          <button class="history-view-btn" data-view-history="${escapeHtml(rec.id)}">View in 3D ↗</button>
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-view-history]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.viewHistory;
        const rec = history.find(r => r.id === id);
        if (rec) {
          ui.historyDialog?.close();
          window.dispatchEvent(new CustomEvent('anatomy:apply-ai-advisory', {
            detail: {
              organ: rec.targetOrgan,
              region: rec.targetRegion,
              system: rec.primarySystem,
              score: rec.score,
              level: rec.level,
              systemName: rec.systemName
            }
          }));
        }
      };
    });
  }

  root.querySelector('#history-button')?.addEventListener('click', () => {
    renderHistoryList();
    ui.historyDialog?.showModal();
  });

  root.querySelector('#clear-history-btn')?.addEventListener('click', () => {
    clearLocalHistory();
    renderHistoryList();
  });

  root.querySelector('#advisor-button')?.addEventListener('click',()=>ui.advisorDialog?.showModal());
  root.querySelectorAll('#credits-button').forEach(b=>b.onclick=()=>ui.about?.showModal());
  root.querySelectorAll('.dialog-close').forEach(b=>{
    b.onclick=()=>{
      const dlg = b.dataset.closeDialog ? root.querySelector(`#${b.dataset.closeDialog}`) : b.closest('dialog');
      dlg?.close();
    };
  });
  setupAdvisorInteractions(root, (info) => {
    window.dispatchEvent(new CustomEvent('anatomy:apply-ai-advisory', { detail: info }));
  });
  setupMovableRegionBar(root);
  root.querySelectorAll('[data-drawer]').forEach(b=>b.onclick=()=>openDrawer(root,b.dataset.drawer,b));root.querySelectorAll('[data-close-drawer]').forEach(b=>b.onclick=()=>closeDrawers(root));root.querySelector('#scrim').onclick=()=>closeDrawers(root);
  return ui;
}

export function setupMovableRegionBar(root) {
  const bar = root.querySelector('.region-bar');
  if (!bar) return;

  const handle = bar.querySelector('.region-bar-drag-handle') || bar;
  const orientBtn = bar.querySelector('#toggle-region-orientation-btn');
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  if (orientBtn) {
    orientBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHorizontal = bar.classList.contains('horizontal');
      if (isHorizontal) {
        bar.classList.remove('horizontal');
        orientBtn.textContent = '↔';
        orientBtn.title = 'Switch to horizontal layout';
        bar.style.top = '72px';
        bar.style.bottom = 'auto';
        bar.style.left = '18px';
        bar.style.transform = 'none';
      } else {
        bar.classList.add('horizontal');
        orientBtn.textContent = '↕';
        orientBtn.title = 'Switch to vertical layout';
        bar.style.top = 'auto';
        bar.style.bottom = '20px';
        bar.style.left = '50%';
        bar.style.transform = 'translateX(-50%)';
      }
    });
  }

  function getContainer() {
    return bar.closest('.viewport-wrap') || root || document.body;
  }

  function onPointerDown(e) {
    if (e.target.closest('.region-btn') || e.target.closest('.region-orientation-btn')) {
      return;
    }

    const container = getContainer();
    const barRect = bar.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    initialLeft = barRect.left - contRect.left;
    initialTop = barRect.top - contRect.top;

    bar.style.bottom = 'auto';
    bar.style.transform = 'none';
    bar.style.left = `${initialLeft}px`;
    bar.style.top = `${initialTop}px`;

    bar.classList.add('dragging');
    try {
      bar.setPointerCapture(e.pointerId);
    } catch {}
  }

  function onPointerMove(e) {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const container = getContainer();
    const contRect = container.getBoundingClientRect();
    const barWidth = bar.offsetWidth;
    const barHeight = bar.offsetHeight;

    let targetLeft = initialLeft + dx;
    let targetTop = initialTop + dy;

    const minLeft = 8;
    const maxLeft = Math.max(8, contRect.width - barWidth - 8);
    const minTop = 8;
    const maxTop = Math.max(8, contRect.height - barHeight - 8);

    targetLeft = Math.min(Math.max(targetLeft, minLeft), maxLeft);
    targetTop = Math.min(Math.max(targetTop, minTop), maxTop);

    bar.style.left = `${targetLeft}px`;
    bar.style.top = `${targetTop}px`;
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    bar.classList.remove('dragging');
    try {
      bar.releasePointerCapture(e.pointerId);
    } catch {}
  }

  bar.addEventListener('pointerdown', onPointerDown);
  bar.addEventListener('pointermove', onPointerMove);
  bar.addEventListener('pointerup', onPointerUp);
  bar.addEventListener('pointercancel', onPointerUp);

  handle.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    if (bar.classList.contains('horizontal')) {
      bar.style.left = '50%';
      bar.style.top = 'auto';
      bar.style.bottom = '20px';
      bar.style.transform = 'translateX(-50%)';
    } else {
      bar.style.left = '18px';
      bar.style.top = '72px';
      bar.style.bottom = 'auto';
      bar.style.transform = 'none';
    }
  });
}

export function renderStructures(ui,bones=[],query=''){
  const results=filterStructures(searchableStructures(ORGAN_INFO,bones),query).slice(0,220);ui.resultCount.textContent=results.length;
  ui.structureList.innerHTML=results.map(x=>`<button data-structure="${escapeHtml(x.id)}" data-type="${escapeHtml(x.type)}"><span class="structure-dot ${escapeHtml(x.type)}"></span><span><b>${escapeHtml(x.name)}</b><small>${escapeHtml(x.system)}</small></span></button>`).join('');return [...ui.structureList.querySelectorAll('[data-structure]')];
}

export function showStructure(root,id,name){
  const organ=ORGAN_INFO[id],bone=id?.startsWith('bone:'),inspector=root.querySelector('#inspector');
  root.querySelector('#info-system').textContent=(organ?.system||'Skeletal system').toUpperCase();
  root.querySelector('#info-name').textContent=organ?.name||displayAnatomyName(name||id?.slice(5)||'Structure');
  root.querySelector('#info-summary').textContent=organ?.summary||'A named component of the skeletal system. Select adjacent structures to explore regional relationships.';
  root.querySelector('#info-fact').textContent=organ?.fact||'Bone shape reflects its roles in support, protection, leverage, and articulation.';
  root.querySelector('#breadcrumb').textContent=`Human body / ${bone?'Skeleton':organ?.system||'Anatomy'} / ${organ?.name||displayAnatomyName(name||'')}`;
  inspector.classList.add('active');inspector.removeAttribute('inert');inspector.setAttribute('aria-hidden','false');
  if(matchMedia('(max-width:800px)').matches)openDrawer(root,'inspector');
  root.querySelectorAll('[data-structure]').forEach(b=>b.classList.toggle('selected',b.dataset.structure===id));
}

export function showRegion(root, regionId) {
  const info = REGION_INFO[regionId];
  if (!info) return;
  const inspector = root.querySelector('#inspector');
  root.querySelector('#info-system').textContent = info.systems.join(' · ').toUpperCase();
  root.querySelector('#info-name').textContent = info.label;
  root.querySelector('#info-summary').textContent = info.summary;
  root.querySelector('#info-fact').textContent = info.organs.length
    ? `Key structures: ${info.organs.map(id=>ORGAN_INFO[id]?.name||id).join(', ')}.`
    : 'Primarily structural — select individual bones or structures to inspect details.';
  root.querySelector('#breadcrumb').textContent = `Human body / Regions / ${info.label}`;
  inspector.classList.add('active');inspector.removeAttribute('inert');inspector.setAttribute('aria-hidden','false');
  if(matchMedia('(max-width:800px)').matches)openDrawer(root,'inspector');
}

let drawerReturnFocus=null;
function setDrawerBackground(root,panel,inert){for(const element of [root.querySelector('.topbar'),root.querySelector('.viewport-wrap'),panel===root.querySelector('.anatomy-panel')?root.querySelector('#inspector'):root.querySelector('.anatomy-panel')]){if(!element||element===panel)continue;if(inert){element.setAttribute('inert','');element.setAttribute('aria-hidden','true');}else{element.removeAttribute('inert');element.removeAttribute('aria-hidden');}}}
export function openDrawer(root,name,trigger=document.activeElement){closeDrawers(root,false);drawerReturnFocus=trigger;root.classList.add(`${name}-open`);root.querySelector('#scrim').classList.add('active');const panel=root.querySelector(name==='browser'?'.anatomy-panel':'#inspector');setDrawerBackground(root,panel,true);panel?.removeAttribute('inert');panel?.setAttribute('aria-hidden','false');panel?.setAttribute('role','dialog');panel?.setAttribute('aria-modal','true');panel?.querySelector('button,input,[tabindex]:not([tabindex="-1"])')?.focus();}
export function closeDrawers(root,restoreFocus=true){const active=root.querySelector(root.classList.contains('browser-open')?'.anatomy-panel':'#inspector');root.classList.remove('browser-open','inspector-open');root.querySelector('#scrim').classList.remove('active');setDrawerBackground(root,active,false);root.querySelectorAll('.anatomy-panel,#inspector').forEach(panel=>{panel.removeAttribute('role');panel.removeAttribute('aria-modal');if(matchMedia('(max-width:800px)').matches||panel.id==='inspector'){panel.setAttribute('inert','');panel.setAttribute('aria-hidden','true');}});if(restoreFocus&&drawerReturnFocus?.isConnected)drawerReturnFocus.focus();drawerReturnFocus=null;}
export function trapDrawerFocus(root,event){if(event.key!=='Tab')return;const panel=root.querySelector(root.classList.contains('browser-open')?'.anatomy-panel':root.classList.contains('inspector-open')?'#inspector':'.nothing');if(!panel)return;const items=[...panel.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')].filter(x=>!x.closest('[inert]'));if(!items.length)return;const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}

