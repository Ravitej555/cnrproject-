import * as THREE from 'three';
import { REGION_INFO, ORGAN_INFO, SYSTEM_ORGANS, boneNameToRegion } from '../data/anatomy.js';
import { fitPerspectiveBox } from '../utils/camera.js';

// ─── Colours for region glow & shared highlight/dim materials ─────────────────
export const REGION_GLOW = new THREE.Color('#c89a66');
const DIM_OPACITY = 0.25;

export const GLOW_BONE_MATERIAL = new THREE.MeshPhysicalMaterial({
  color: 0xc89a66,
  roughness: 0.35,
  metalness: 0.05,
  emissive: REGION_GLOW,
  emissiveIntensity: 0.65,
  transparent: false,
  opacity: 1.0,
  depthWrite: true,
  clearcoat: 0.5,
  clearcoatRoughness: 0.25,
});

export const DIM_BONE_MATERIAL = new THREE.MeshPhysicalMaterial({
  color: 0x4a4740,
  roughness: 0.8,
  transparent: true,
  opacity: 0.25,
  depthWrite: false,
});

const DIM_ORGAN_MATERIALS = new Map();
const GLOW_ORGAN_MATERIALS = new Map();

function getDimOrganMaterial(baseMat, organId) {
  if (!DIM_ORGAN_MATERIALS.has(organId)) {
    const clone = baseMat.clone();
    clone.transparent = true;
    clone.opacity = 0.25;
    clone.depthWrite = false;
    if (clone.emissive) clone.emissive.set(0, 0, 0);
    clone.emissiveIntensity = 0;
    DIM_ORGAN_MATERIALS.set(organId, clone);
  }
  return DIM_ORGAN_MATERIALS.get(organId);
}

function getGlowOrganMaterial(baseMat, organId) {
  if (!GLOW_ORGAN_MATERIALS.has(organId)) {
    const clone = baseMat.clone();
    clone.transparent = false;
    clone.opacity = 1.0;
    clone.depthWrite = true;
    if (clone.emissive) clone.emissive.copy(REGION_GLOW);
    clone.emissiveIntensity = 0.65;
    clone.roughness = 0.35;
    clone.clearcoat = 0.4;
    GLOW_ORGAN_MATERIALS.set(organId, clone);
  }
  return GLOW_ORGAN_MATERIALS.get(organId);
}

export function animateRegionGlow(time) {
  const pulse = 0.65 + Math.sin(time * 3.0) * 0.20;
  GLOW_BONE_MATERIAL.emissiveIntensity = pulse;
  GLOW_ORGAN_MATERIALS.forEach(mat => {
    mat.emissiveIntensity = pulse;
  });
}

// ─── Tag every mesh in the HumanModel with its body region ────────────────────
export function tagMeshRegions(human) {
  human.pickables.forEach(mesh => {
    const organId = mesh.userData.organId;
    if (organId && ORGAN_INFO[organId]) {
      mesh.userData.bodyRegion = ORGAN_INFO[organId].region;
    }
    const structId = mesh.userData.structureId;
    if (structId?.startsWith('bone:')) {
      const boneName = structId.slice(5);
      mesh.userData.bodyRegion = boneNameToRegion(boneName);
    }
  });
}

function regionBox(regionId) {
  const info = REGION_INFO[regionId];
  if (!info) return null;
  return new THREE.Box3(
    new THREE.Vector3(...info.cameraBox.min),
    new THREE.Vector3(...info.cameraBox.max),
  );
}

// ─── Highlight a body region: glow its meshes, dim all others ─────────────────
export function highlightRegion(human, regionId) {
  clearRegionHighlight(human);
  if (!regionId) return;

  human._activeRegion = regionId;

  human.pickables.forEach(mesh => {
    const inRegion = mesh.userData.bodyRegion === regionId;
    if (!mesh.userData._regionOriginalMat) {
      mesh.userData._regionOriginalMat = mesh.material;
    }

    const isBone = mesh.userData.structureId?.startsWith('bone:');
    const organId = mesh.userData.organId;

    if (isBone) {
      mesh.material = inRegion ? GLOW_BONE_MATERIAL : DIM_BONE_MATERIAL;
    } else if (organId) {
      const base = mesh.userData.baseMaterial || mesh.userData._regionOriginalMat;
      mesh.material = inRegion ? getGlowOrganMaterial(base, organId) : getDimOrganMaterial(base, organId);
    }
  });
}

// ─── Clear region highlight, restore original materials ───────────────────────
export function clearRegionHighlight(human) {
  if (!human._activeRegion) return;
  human._activeRegion = null;

  human.pickables.forEach(mesh => {
    if (mesh.userData._regionOriginalMat) {
      mesh.material = mesh.userData._regionOriginalMat;
      delete mesh.userData._regionOriginalMat;
    }
  });

  if (typeof human.updateHighlights === 'function') human.updateHighlights();
}

// ─── Apply system filter: dim organs not in the system's primary list ─────────
export function applySystemFilter(human, systemId) {
  clearSystemFilter(human);
  if (!systemId || systemId === 'skin' || systemId === 'skeleton') return;

  const primaryIds = SYSTEM_ORGANS[systemId] ?? [];
  if (!primaryIds.length) return;

  human._activeSystemFilter = systemId;

  human.pickables.forEach(mesh => {
    const organId = mesh.userData.organId;
    if (!organId) return;
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    if (!mat) return;

    if (!mesh.userData._sysBase) {
      mesh.userData._sysBase = {
        opacity: mat.opacity, transparent: mat.transparent, depthWrite: mat.depthWrite,
        emissive: mat.emissive?.clone(), emissiveIntensity: mat.emissiveIntensity ?? 1,
      };
    }

    const isPrimary = primaryIds.includes(organId);
    if (isPrimary) {
      if (mat.emissive) mat.emissive.setRGB(0.08, 0.02, 0.02);
      mat.emissiveIntensity = 0.4;
    } else {
      mat.transparent = true;
      mat.opacity = Math.min(mat.opacity, DIM_OPACITY);
      mat.depthWrite = false;
      if (mat.emissive) mat.emissive.set(0, 0, 0);
      mat.emissiveIntensity = 0;
    }
    mat.needsUpdate = true;
  });
}

export function clearSystemFilter(human) {
  if (!human._activeSystemFilter) return;
  human._activeSystemFilter = null;
  human.pickables.forEach(mesh => {
    const base = mesh.userData._sysBase;
    if (!base) return;
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    if (!mat) return;
    mat.opacity = base.opacity;
    mat.transparent = base.transparent;
    mat.depthWrite = base.depthWrite;
    if (mat.emissive && base.emissive) mat.emissive.copy(base.emissive);
    mat.emissiveIntensity = base.emissiveIntensity;
    mat.needsUpdate = true;
    delete mesh.userData._sysBase;
  });
  if (typeof human.updateHighlights === 'function') human.updateHighlights();
}

export function focusRegion(regionId, moveCamera) {
  const box = regionBox(regionId);
  if (!box || !moveCamera) return;
  moveCamera(new THREE.Vector3(0.3, 0.05, 1).normalize(), box);
}
