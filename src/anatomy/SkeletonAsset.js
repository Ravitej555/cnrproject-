import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { isRightSideNode, mirroredNodeName } from './skeletonNodes.js';
import { detailedSkeletonTransform } from './alignment.js';

function configureBone(mesh, name, material, pickables, structures) {
  mesh.name = name;
  mesh.material = material;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.structureId = `bone:${name}`;
  mesh.userData.structureName = name;
  mesh.userData.baseMaterial = material;
  pickables.push(mesh);
  structures.push(name);
}

function adjustBoneGeometry(mesh, name) {
  const geom = mesh.geometry;
  if (!geom || !geom.attributes?.position) return;
  const pos = geom.attributes.position;
  let modified = false;

  // 1. Cranium / Skull adjustments
  if (/occipital|parietal/i.test(name)) {
    const pivot = { x: 0, y: 1.625, z: 0.005 };
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const newX = pivot.x + (x - pivot.x) * 0.94;
      const newY = pivot.y + (y - pivot.y) * 0.94;
      const newZ = pivot.z + (z - pivot.z) * 0.88 + 0.012;
      pos.setXYZ(i, newX, newY, newZ);
    }
    modified = true;
  } else if (/frontal/i.test(name)) {
    const pivot = { x: 0, y: 1.625, z: 0.005 };
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const newX = pivot.x + (x - pivot.x) * 0.96;
      const newY = pivot.y + (y - pivot.y) * 0.95;
      const newZ = pivot.z + (z - pivot.z) * 0.90 + 0.008;
      pos.setXYZ(i, newX, newY, newZ);
    }
    modified = true;

  // 2. All Vertebrae (cervical, thoracic, lumbar, sacrum, coccyx) - stops spinous processes poking out neck & back
  } else if (/vertebra|cervical|thoracic|lumbar|sacrum|coccyx|spine/i.test(name)) {
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      if (z < -0.040) {
        const excess = -0.040 - z;
        pos.setZ(i, z + excess * 0.88);
        modified = true;
      }
    }

  // 3. Hands and finger phalanges
  } else if (!/foot/i.test(name) && /metacarpal|phalanx.*finger|capitate|hamate|lunate|pisiform|scaphoid|trapezium|trapezoid|triquetrum/i.test(name)) {
    geom.computeBoundingBox();
    const box = geom.boundingBox;
    const center = new THREE.Vector3();
    box.getCenter(center);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const newX = center.x + (x - center.x) * 0.84 + 0.008;
      const newY = y;
      const newZ = center.z + (z - center.z) * 0.82 + 0.018;
      pos.setXYZ(i, newX, newY, newZ);
    }
    modified = true;

  // 4. Forearms: Elbow (olecranon process) and Wrist (distal radius/ulna)
  } else if (/radius|ulna/i.test(name)) {
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      // Elbow olecranon (y approx 1.10 to 1.35, points backward at z < -0.01)
      if (y >= 1.05 && y <= 1.40 && z < -0.012) {
        const excess = -0.012 - z;
        pos.setZ(i, z + excess * 0.85);
        modified = true;
      }

      // Wrist / Distal forearm
      if (y < 0.98) {
        const factor = Math.min(1, (0.98 - y) / 0.12);
        const newZ = z + 0.018 * factor;
        const newX = x + 0.006 * factor;
        pos.setXYZ(i, newX, y, newZ);
        modified = true;
      }
    }

  // 5. Scapula, Clavicle, and Shoulder Acromion
  } else if (/scapula|clavicle|acromion/i.test(name)) {
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const y = pos.getY(i);
      if (z < -0.050) {
        const excess = -0.050 - z;
        pos.setZ(i, z + excess * 0.85);
        modified = true;
      }
      if (y > 2.48) {
        pos.setY(i, y - (y - 2.48) * 0.55);
        modified = true;
      }
    }

  // 6. Pelvis, Ilium crest, and Ischium (stops hip / buttocks dimple clipping)
  } else if (/pelvis|ilium|ischium|pubis/i.test(name)) {
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      if (z < -0.038) {
        const excess = -0.038 - z;
        pos.setZ(i, z + excess * 0.88);
        modified = true;
      }
    }

  // 7. Knees and Patella
  } else if (/patella/i.test(name)) {
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      pos.setZ(i, z - 0.012);
      modified = true;
    }

  // 8. Heels, Calcaneus, Talus, and Feet
  } else if (/calcaneus|talus|malleolus|tarsal|metatarsal|foot.*phalanx/i.test(name)) {
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      if (z < -0.055) {
        const excess = -0.055 - z;
        pos.setZ(i, z + excess * 0.85);
        modified = true;
      }
    }
  }

  if (modified) {
    pos.needsUpdate = true;
    geom.computeVertexNormals();
    geom.computeBoundingBox();
    geom.computeBoundingSphere();
  }
}

export async function loadSkeletonAsset({ onProgress = () => {} } = {}) {
  const draco = new DRACOLoader().setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
  const loader = new GLTFLoader().setDRACOLoader(draco);
  try {
    const gltf = await loader.loadAsync(`${import.meta.env.BASE_URL}models/overview-skeleton.glb`, event => {

      onProgress(event.total ? event.loaded / event.total : 0, event.loaded, event.total);
    });
    const source = gltf.scene;
    source.updateMatrixWorld(true);
    const root = new THREE.Group();
    root.name = 'Anatomist-reviewed skeleton';
    const material = new THREE.MeshPhysicalMaterial({ color: 0xe5dfcf, roughness: 0.60, clearcoat: 0.15, clearcoatRoughness: 0.65 });
    const cartilageMaterial = new THREE.MeshPhysicalMaterial({ color: 0xc8beb0, roughness: 0.68, transmission: 0.04, transparent: true, opacity: 0.92 });
    const pickables = [], structures = [];
    const originals = [];
    source.traverse(node => { if (node.isMesh) originals.push(node); });
    originals.forEach(mesh => {
      const nodeIndex=gltf.parser.associations.get(mesh)?.nodes;
      const sourceName=nodeIndex==null?mesh.name:gltf.parser.json.nodes[nodeIndex]?.name||mesh.name;
      adjustBoneGeometry(mesh, sourceName);
      const boneMat = /costal cart/i.test(sourceName) ? cartilageMaterial : material;
      configureBone(mesh,sourceName,boneMat,pickables,structures);
    });
    source.updateMatrixWorld(true);
    const initialBox = new THREE.Box3().setFromObject(source);
    const mirrored = new THREE.Group();
    mirrored.name = 'Generated left-side bones';
    originals.filter(mesh => isRightSideNode(mesh.name)).forEach(mesh => {
      const clone = mesh.clone();
      const name = mirroredNodeName(mesh.name);
      clone.geometry = mesh.geometry;
      clone.material = mesh.material;
      mesh.updateWorldMatrix(true, false);
      clone.matrix.copy(mesh.matrixWorld);
      clone.matrix.premultiply(new THREE.Matrix4().makeScale(-1, 1, 1));
      clone.matrix.decompose(clone.position, clone.quaternion, clone.scale);
      configureBone(clone, name, clone.material, pickables, structures);
      mirrored.add(clone);
    });
    root.add(source,mirrored);
    const transform = detailedSkeletonTransform(initialBox);
    root.scale.setScalar(transform.scale);
    root.position.set(transform.position.x, transform.position.y, transform.position.z);
    root.userData.ownedMaterials = [material, cartilageMaterial];
    return { root, pickables, structures: [...new Set(structures)].sort((a, b) => a.localeCompare(b)), fallback: false };
  } finally {
    draco.dispose();
  }
}


