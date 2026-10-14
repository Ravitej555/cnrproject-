import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './styles.css';
import './overflow.css';
import { HumanModel } from './anatomy/HumanModel.js';
import { animationScales, clampSpeed, createInitialState } from './utils/state.js';
import { fitPerspectiveBox, refitPreservingView, shouldRefitForResize, viewDirection } from './utils/camera.js';
import { closeDrawers, renderApp, renderStructures, showStructure, showRegion, svg, trapDrawerFocus } from './ui.js';
import { defaultLayerOpacity, REGION_INFO } from './data/anatomy.js';
import { tagMeshRegions, highlightRegion, clearRegionHighlight, applySystemFilter, clearSystemFilter, focusRegion, animateRegionGlow } from './anatomy/regions.js';

const root=document.querySelector('#app'),ui=renderApp(root),state=createInitialState();
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const query=new URLSearchParams(location.search);
const requestedView=query.get('view');
const initialView=['front','back','left','right'].includes(requestedView)?requestedView:'reset';
const lowQuality=query.get('quality')==='low';
if(query.get('openAdvisor')==='true'){
  setTimeout(()=>ui.advisorDialog?.showModal(),400);
  window.history.replaceState({}, document.title, window.location.pathname);
}
const scene=new THREE.Scene();scene.background=new THREE.Color('#0b0c0e');scene.fog=new THREE.FogExp2('#0b0c0e',.027);
const camera=new THREE.PerspectiveCamera(32,1,.08,80);camera.position.set(3.2,.5,9);
const renderer=new THREE.WebGLRenderer({antialias:!lowQuality,powerPreference:'high-performance'});renderer.setPixelRatio(lowQuality?.65:Math.min(devicePixelRatio,innerWidth<800?1.5:1.85));renderer.shadowMap.enabled=!lowQuality;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;ui.host.append(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.15,0);controls.enableDamping=!reducedMotion;controls.dampingFactor=.075;controls.minDistance=2;controls.maxDistance=18;controls.autoRotateSpeed=.55;
scene.add(new THREE.HemisphereLight('#eaf0f8','#3a3430',1.45));
const key=new THREE.DirectionalLight('#fff6ee',2.2);key.position.set(3.5,6,5.5);key.castShadow=true;key.shadow.mapSize.set(innerWidth<800?1024:2048,innerWidth<800?1024:2048);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=5;key.shadow.camera.bottom=-4;key.shadow.bias=-0.0003;scene.add(key);
const fill=new THREE.DirectionalLight('#c5d4e4',1.2);fill.position.set(-3.5,2.5,4.5);scene.add(fill);
const frontFill=new THREE.DirectionalLight('#f4f0ea',0.6);frontFill.position.set(0,1,6);scene.add(frontFill);
const backKey=new THREE.DirectionalLight('#fff2e6',1.7);backKey.position.set(2.5,5,-5.5);scene.add(backKey);
const backFill=new THREE.DirectionalLight('#ccdcf0',1.1);backFill.position.set(-3,2.5,-4.5);scene.add(backFill);
const rim=new THREE.DirectionalLight('#dbe0ea',1.0);rim.position.set(-3,4,-4.5);scene.add(rim);
const floor=new THREE.Mesh(new THREE.CircleGeometry(3,64),new THREE.MeshStandardMaterial({color:'#18191b',roughness:.92,transparent:true,opacity:.72}));floor.rotation.x=-Math.PI/2;floor.position.y=-3.5;floor.receiveShadow=true;scene.add(floor);
const human=new HumanModel();scene.add(human.root);
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),clock=new THREE.Clock();let hovered=null,elapsed=0,selectedId=null,selectedName='',cameraTween=null,hasFramed=false,previousAspect=NaN,frameId=0,tornDown=false;
const bodyBox=new THREE.Box3(new THREE.Vector3(-1.45,-3.5,-.75),new THREE.Vector3(1.45,3.9,.75));

// Track active region & selection counter for re-applying glow on repeated clicks
let activeRegionId=null;
let activeSystemFilter=null;

function fit(direction=viewDirection('reset'),box=bodyBox,padding=1.18){return fitPerspectiveBox(box,direction,camera.fov,camera.aspect,padding)}
function moveCamera(direction,box=bodyBox,duration=reducedMotion?0:650){const result=fit(direction,box,box===bodyBox?1.18:1.55),toTarget=result.target,toPosition=result.target.clone().addScaledVector(direction,result.distance);if(!duration){controls.target.copy(toTarget);camera.position.copy(toPosition);controls.update();return}cameraTween={start:performance.now(),duration,fromPosition:camera.position.clone(),fromTarget:controls.target.clone(),toPosition,toTarget};}
function updateCameraTween(now){if(!cameraTween)return;const t=Math.min(1,(now-cameraTween.start)/cameraTween.duration),e=1-Math.pow(1-t,3);camera.position.lerpVectors(cameraTween.fromPosition,cameraTween.toPosition,e);controls.target.lerpVectors(cameraTween.fromTarget,cameraTween.toTarget,e);if(t===1)cameraTween=null;}
function resize(){const {clientWidth:w,clientHeight:h}=ui.host;if(!w||!h||tornDown)return;const nextAspect=w/h,refit=shouldRefitForResize(previousAspect,nextAspect);camera.aspect=nextAspect;camera.updateProjectionMatrix();renderer.setSize(w,h,false);if(!hasFramed){moveCamera(viewDirection(initialView),bodyBox,0);hasFramed=true;}else if(refit){const result=refitPreservingView(bodyBox,camera.position,controls.target,camera.fov,nextAspect,1.18);camera.position.copy(result.position);controls.target.copy(result.target);controls.update();}previousAspect=nextAspect;}
const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(ui.host);resize();

function structureFromHit(hit){if(!hit)return null;return {id:hit.object.userData.structureId||hit.object.userData.organId,name:hit.object.userData.structureName||hit.object.name,region:hit.object.userData.bodyRegion};}
function hitTest(event){const rect=renderer.domElement.getBoundingClientRect();pointer.set(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(human.pickables,false).find(hit=>hit.object.visible&&hit.object.parent?.visible);}
function notifyChatbotSelection(id, name='', region='', forceLeg=false) {
  const cleanName = (name || id || '').replace(/\.r\.?$/i, ' — right').replace(/\.l$/i, ' — left');
  const lower = (id + ' ' + name + ' ' + region).toLowerCase();
  const isLeg = forceLeg || /femur|tibia|fibula|patella|leg|calf|thigh|foot|tarsal|metatarsal|calcaneus/i.test(lower) || region === 'left_leg' || region === 'right_leg';

  window.dispatchEvent(new CustomEvent('anatomy:select-part', {
    detail: {
      id,
      name: cleanName || (isLeg ? 'Leg' : 'Body Structure'),
      region: region || (isLeg ? 'leg' : ''),
      isLeg
    }
  }));
}

function select(id,name=''){
  selectedId=id;
  selectedName=name;
  state.selectedStructure=id;
  if(id?.startsWith('bone:')){human.setSelected(null);human.setStructureSelected(id)}
  else{human.setStructureSelected(null);human.setSelected(id)}
  closeDrawers(root);
  showStructure(root,id,name);

  // Notify chatbot of part selection
  notifyChatbotSelection(id, name);
}
function focusSelection(){if(!selectedId)return;const mesh=human.structureMeshes.get(selectedId)||human.getOrganParts(selectedId)[0];if(!mesh)return;const box=new THREE.Box3().setFromObject(mesh);moveCamera(camera.position.clone().sub(controls.target).normalize(),box);}
function bindStructureButtons(){renderStructures(ui,human.skeletonAsset?.userData.structureNames||[],ui.search.value).forEach(button=>button.onclick=()=>select(button.dataset.structure,button.textContent.trim()));}
ui.search.addEventListener('input',bindStructureButtons);bindStructureButtons();

renderer.domElement.addEventListener('pointermove',event=>{
  const hit=hitTest(event),value=structureFromHit(hit);
  if(value?.id!==hovered){
    if(hovered?.startsWith('bone:'))human.setStructureHovered(null);
    else human.setHovered(null);
    hovered=value?.id||null;
    if(hovered?.startsWith('bone:'))human.setStructureHovered(hovered);
    else human.setHovered(hovered);
  }
  renderer.domElement.style.cursor=value?'pointer':'grab';
  ui.tooltip.classList.toggle('visible',!!value&&state.labels);
  if(value&&state.labels){
    const cleanName=value.name?.replace(/\.r\.?$/i,' — right').replace(/\.l$/i,' — left')||value.id;
    const reg=value.region?` [${value.region.toUpperCase().replace('_',' ')}]`:'';
    ui.tooltip.textContent=`${cleanName}${reg}`;
    const rect=ui.host.getBoundingClientRect();
    ui.tooltip.style.left=`${event.clientX-rect.left+13}px`;
    ui.tooltip.style.top=`${event.clientY-rect.top+13}px`;
  }
});
renderer.domElement.addEventListener('pointerleave',()=>{hovered=null;human.setHovered(null);human.setStructureHovered(null);ui.tooltip.classList.remove('visible')});

renderer.domElement.addEventListener('click',event=>{
  const hit=hitTest(event);
  const value=structureFromHit(hit);
  if(value) {
    select(value.id,value.name);
    return;
  }

  // Fallback raycaster across human.root to detect leg / limb clicks on skin or body
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.set(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
  raycaster.setFromCamera(pointer,camera);
  const allHits=raycaster.intersectObjects(human.root.children,true).filter(h=>h.object.visible&&h.object.type==='Mesh');
  if(allHits.length>0){
    const first=allHits[0];
    const y=first.point.y;
    const x=first.point.x;
    if(y<0.25&&y>-3.6){
      const side=x<0?'Left':'Right';
      const legRegion=x<0?'left_leg':'right_leg';
      const legName=`${side} Leg (Bipedal Locomotion & Skeletal Framework)`;
      highlightRegion(human, legRegion);
      showRegion(root, legRegion);
      notifyChatbotSelection(legRegion, legName, legRegion, true);
    }
  }
});

// Layer opacity sliders & toggles
ui.systemInputs.forEach(input=>input.oninput=()=>{
  const opacity=Number(input.value);state.opacity[input.dataset.system]=opacity;state.visibility[input.dataset.system]=opacity>0;human.setOpacity(input.dataset.system,opacity);
  const toggle=root.querySelector(`[data-system-toggle="${input.dataset.system}"]`);
  if(toggle){toggle.classList.toggle('active',opacity>0);toggle.setAttribute('aria-pressed',opacity>0);}
});
ui.systemToggles.forEach(button=>button.onclick=()=>{
  const input=root.querySelector(`[data-system="${button.dataset.systemToggle}"]`),on=Number(input?.value)>0;
  if(input){input.value=on?0:defaultLayerOpacity(button.dataset.systemToggle);input.dispatchEvent(new Event('input'))}
});

// View orientation buttons (front, back, left, right, reset)
ui.viewButtons.forEach(button=>button.onclick=()=>{
  moveCamera(viewDirection(button.dataset.view));
  ui.viewButtons.forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));})
});

// ─── Region Buttons Handler (Bottom Toolbar) ──────────────────────────────────
ui.regionButtons.forEach(button => {
  button.onclick = () => {
    const rId = button.dataset.region;
    const isSame = (activeRegionId === rId);
    const isLeg = (rId === 'left_leg' || rId === 'right_leg');

    if (isSame) {
      activeRegionId = null;
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
      clearRegionHighlight(human);
      closeInspector();
      return;
    }

    activeRegionId = rId;
    ui.regionButtons.forEach(b => {
      const active = b.dataset.region === rId;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });

    highlightRegion(human, rId);
    focusRegion(rId, moveCamera);
    showRegion(root, rId);
    notifyChatbotSelection(rId, button.textContent.trim(), rId, isLeg);
  };
});

// ─── Extended System Filter Chips (Muscular, Nervous, etc.) ───────────────────
ui.sysFilterButtons.forEach(button => {
  button.onclick = () => {
    const sysId = button.dataset.sysFilter;
    const isSame = (activeSystemFilter === sysId);

    if (isSame) {
      // Deactivate filter
      activeSystemFilter = null;
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
      clearSystemFilter(human);
      return;
    }

    activeSystemFilter = sysId;
    ui.sysFilterButtons.forEach(b => {
      const active = b.dataset.sysFilter === sysId;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });

    if (sysId === 'muscular') {
      // Emphasize skin & semi-dim skeleton
      human.setOpacity('skin', 0.55);
      human.setOpacity('skeleton', 0.35);
      human.setOpacity('organs', 0);
      human.setOpacity('circulatory', 0);
    } else {
      applySystemFilter(human, sysId);
    }
  };
});

if(ui.pause) ui.pause.onclick=()=>{state.paused=!state.paused;ui.pause.innerHTML=svg(state.paused?'play':'pause');ui.pause.setAttribute('aria-label',state.paused?'Resume animation':'Pause animation')};
if(ui.speed) ui.speed.oninput=()=>{state.speed=clampSpeed(ui.speed.value);if(ui.speedValue) ui.speedValue.textContent=`${state.speed.toFixed(2).replace(/\.00$/,'')}×`;const el=root.querySelector('#dash-speed-status');if(el)el.textContent=`${state.speed.toFixed(2).replace(/\.00$/,'')}× Normal`;};
if(ui.rotate) ui.rotate.onclick=()=>{state.autoRotate=!state.autoRotate;controls.autoRotate=state.autoRotate;ui.rotate.setAttribute('aria-pressed',state.autoRotate);const el=root.querySelector('#dash-rot-status');if(el)el.textContent=state.autoRotate?'Auto Orbit Active':'Interactive Orbit';};
if(ui.labels) ui.labels.onclick=()=>{state.labels=!state.labels;ui.labels.setAttribute('aria-pressed',state.labels);if(!state.labels)ui.tooltip.classList.remove('visible');const el=root.querySelector('#dash-labels-status');if(el)el.textContent=state.labels?'Visible':'Hidden';};

function closeInspector(){ui.inspector.classList.remove('active');closeDrawers(root);selectedId=null;human.setSelected(null);human.setStructureSelected(null);root.querySelectorAll('[data-structure].selected').forEach(button=>button.classList.remove('selected'));if(activeRegionId){clearRegionHighlight(human);activeRegionId=null;ui.regionButtons.forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});}}
ui.closeInfo.onclick=closeInspector;

ui.restore.onclick=()=>{
  human.restoreAll();
  clearRegionHighlight(human);
  clearSystemFilter(human);
  activeRegionId = null;
  activeSystemFilter = null;
  ui.regionButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
  ui.sysFilterButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
  Object.keys(state.opacity).forEach(key=>{
    const input=root.querySelector(`[data-system="${key}"]`);
    if(input){input.value=defaultLayerOpacity(key);input.dispatchEvent(new Event('input'));}
  });
};

ui.actions.forEach(button=>button.onclick=()=>{
  if(!selectedId)return;
  if(button.dataset.action==='focus')focusSelection();
  if(button.dataset.action==='isolate')human.isolate(selectedId);
  if(button.dataset.action==='fade'){human.restoreAll();human.fadeOthers(selectedId)}
  if(button.dataset.action==='hide'){human.hideStructure(selectedId);closeInspector();}
});



// ─── AI Health Advisory 3D Highlight & Focus Handler ─────────────────────────
window.addEventListener('anatomy:apply-ai-advisory', (e) => {

  const { organ, region, system, score, level, systemName } = e.detail || {};
  if (!organ) return;

  // Ensure organs and skeleton are visible
  human.setOpacity('organs', 1.0);
  human.setOpacity('skeleton', 0.85);
  human.setOpacity('skin', 0.22);
  human.setOpacity('circulatory', 0.85);

  // If region exists, highlight it
  if (region) {
    activeRegionId = region;
    highlightRegion(human, region);
    focusRegion(region, moveCamera);
    showRegion(root, region);
  }

  // Select target organ structure
  if (organ) {
    select(organ, `${organ.toUpperCase()} · Primary Focus (${systemName || system})`);
    focusSelection();
  }

  // Open inspector with custom AI clinical note
  const infoSys = root.querySelector('#info-system');
  const infoName = root.querySelector('#info-name');
  const infoSummary = root.querySelector('#info-summary');
  const infoFact = root.querySelector('#info-fact');
  if (infoSys) infoSys.textContent = `AI ADVISORY: ${level} RISK (${score}/100)`;
  if (infoName) infoName.textContent = `${systemName || system} Impact`;
  if (infoSummary) infoSummary.textContent = `Target organ "${organ.toUpperCase()}" prioritized based on multi-factorial AI risk analysis (biometrics, air pollution & symptom synergy).`;
  if (infoFact) infoFact.textContent = `Educational Advisory: Risk Index ${score}/100 (${level}). Please consult a licensed medical provider for diagnostic evaluation.`;
});

function onKeydown(event){
  trapDrawerFocus(root,event);
  if(event.key==='/'&&document.activeElement!==ui.search){event.preventDefault();ui.search.focus()}
  if(event.key==='Escape'){closeInspector()}
  if(event.key===' '&&!['INPUT','BUTTON'].includes(event.target.tagName)){event.preventDefault();ui.pause?.click()}
  if(event.key.toLowerCase()==='r')moveCamera(viewDirection('reset'));
  if(['1','2','3','4'].includes(event.key))moveCamera(viewDirection(['front','back','left','right'][Number(event.key)-1]));
}
window.addEventListener('keydown',onKeydown);

async function prepareAnatomyAssets(){
  const progress={skeleton:0,skin:0,organs:0}, labels={skeleton:'skeleton',skin:'scanned skin',organs:'detailed organs'};
  const update=(key,ratio,loaded,total)=>{progress[key]=ratio||0;ui.progress.style.width=`${Math.max(3,(progress.skeleton+progress.skin+progress.organs)/3*100)}%`;ui.loadingDetail.textContent=total?`Loading ${labels[key]} · ${Math.round(loaded/1024)} of ${Math.round(total/1024)} KB`:`Loading ${labels[key]} · ${Math.round(loaded/1024)} KB`;};
  const jobs=[
    ['skeleton',human.loadDetailedSkeleton((...args)=>update('skeleton',...args))],
    ['skin',human.loadScannedSkin((...args)=>update('skin',...args))],
    ['organs',human.loadDetailedOrgans((...args)=>update('organs',...args))],
  ];
  const results=await Promise.all(jobs.map(async([key,promise])=>{try{const asset=await promise;progress[key]=1;return {key,asset,ok:!asset?.ignored}}catch(error){if(!tornDown)console.error(`${labels[key]} unavailable; using procedural fallback.`,error);progress[key]=1;return {key,error,ok:false}}}));
  if(tornDown)return;
  const skeleton=results.find(x=>x.key==='skeleton');
  if(skeleton.ok){human.skeletonAsset.userData.structureNames=skeleton.asset.structures;bindStructureButtons();}
  tagMeshRegions(human);
  const ready=results.filter(x=>x.ok).length;
  if(ui.assetStatus) ui.assetStatus.textContent=ready===3?'Detailed anatomy ready':`${ready}/3 detailed assets ready · fallback active`;
  root.querySelector('.asset-status')?.classList.toggle('ready',ready===3);
  const dashAssetStatus = root.querySelector('#dash-asset-status');
  if(dashAssetStatus) {
    dashAssetStatus.innerHTML = ready===3 
      ? '<span class="status-pulse online"></span> Active · 3/3 Loaded' 
      : `<span class="status-pulse standby"></span> ${ready}/3 Assets Ready`;
  }
  const dashStructures = root.querySelector('#dash-structures-count');
  if(dashStructures && skeleton?.asset?.structures) {
    dashStructures.textContent = `${skeleton.asset.structures.length}+ Structures`;
  }
  ui.loadingDetail.textContent=ready===3?`${skeleton?.asset?.structures?.length || 206} bones · scanned skin · semantic organs ready`:`${3-ready} asset ${3-ready===1?'fallback':'fallbacks'} active`;
  ui.loading.classList.toggle('failure',ready<3);ui.progress.style.width='100%';ui.loading.classList.add('done');
}
prepareAnatomyAssets();

function teardown(){if(tornDown)return;tornDown=true;cancelAnimationFrame(frameId);resizeObserver.disconnect();window.removeEventListener('keydown',onKeydown);window.removeEventListener('pagehide',onPageHide);window.removeEventListener('beforeunload',teardown);human.dispose();floor.geometry.dispose();floor.material.dispose();controls.dispose();renderer.dispose();}
function onPageHide(event){if(!event.persisted)teardown();}
window.addEventListener('pagehide',onPageHide);window.addEventListener('beforeunload',teardown);
function frame(now){if(tornDown)return;frameId=requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);if(!state.paused)elapsed+=dt;human.animate(animationScales(elapsed,state.speed,state.paused));updateCameraTween(now);controls.update();renderer.render(scene,camera)}frameId=requestAnimationFrame(frame);
