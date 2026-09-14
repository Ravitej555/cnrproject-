import { DEFAULT_VISIBILITY, ORGAN_INFO, defaultLayerOpacity } from '../data/anatomy.js';

export function clampSpeed(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.min(2, Math.max(0.25, number));
}

export function createInitialState() {
  return { visibility: { ...DEFAULT_VISIBILITY }, opacity: Object.fromEntries(Object.keys(DEFAULT_VISIBILITY).map(key=>[key, defaultLayerOpacity(key)])), selectedOrgan: null, selectedStructure: null, paused: false, speed: 1, autoRotate: false, labels: true, hidden: new Set(), isolated: null };
}

export function setLayerOpacity(state, system, value) {
  if (!Object.hasOwn(state.opacity, system)) return state;
  const opacity = Math.min(1, Math.max(0, Number(value) || 0));
  return { ...state, opacity: { ...state.opacity, [system]: opacity }, visibility: { ...state.visibility, [system]: opacity > 0 } };
}

export function selectOrgan(state, organId) {
  return { ...state, selectedOrgan: Object.hasOwn(ORGAN_INFO, organId) ? organId : null };
}

export function toggleSystem(state, system) {
  if (!Object.hasOwn(state.visibility, system)) return state;
  return { ...state, visibility: { ...state.visibility, [system]: !state.visibility[system] } };
}

export function animationScales(time, speed = 1, paused = false) {
  if (paused) return { breath: 1, heartbeat: 1, pulse: 0 };
  const t = time * clampSpeed(speed);
  const breath = 1 + Math.sin(t * 1.7) * 0.035;
  const phase = (t * 1.25) % 1;
  const beat = Math.exp(-Math.pow((phase - 0.08) / 0.055, 2)) + 0.45 * Math.exp(-Math.pow((phase - 0.22) / 0.075, 2));
  return { breath, heartbeat: 1 + beat * 0.12, pulse: Math.min(1, beat) };
}
