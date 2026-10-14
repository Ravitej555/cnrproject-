import * as THREE from 'three';

const cornersOf = box => {
  const points = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) points.push(new THREE.Vector3(x, y, z));
  return points;
};

// Returns the camera distance needed to contain an axis-aligned box from a
// given direction. Unlike a bounding sphere, this remains useful on narrow
// screens without adding excessive empty space above and below the subject.
export function fitPerspectiveBox(box, direction, verticalFov, aspect, padding = 1.2) {
  const target = box.getCenter(new THREE.Vector3());
  const viewDirection = direction.clone().normalize();
  const forward = viewDirection.clone().negate();
  const worldUp = Math.abs(forward.y) > .999 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(forward, worldUp).normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();
  const tanY = Math.tan(THREE.MathUtils.degToRad(verticalFov) / 2) / padding;
  const tanX = tanY * Math.max(aspect, .01);
  let distance = 0;
  for (const point of cornersOf(box)) {
    const offset = point.sub(target);
    const nearOffset = offset.dot(viewDirection);
    distance = Math.max(distance, Math.abs(offset.dot(right)) / tanX + nearOffset, Math.abs(offset.dot(up)) / tanY + nearOffset);
  }
  return { target, distance };
}

export const VIEW_DIRECTIONS = Object.freeze({
  front: [0, .015, 1], back: [0, .015, -1], left: [-1, .015, 0], right: [1, .015, 0], reset: [.42, .08, 1],
});

export function viewDirection(name) {
  return new THREE.Vector3(...(VIEW_DIRECTIONS[name] || VIEW_DIRECTIONS.reset)).normalize();
}

export const orientationForAspect = aspect => aspect < 1 ? 'portrait' : 'landscape';
export function shouldRefitForResize(previousAspect, nextAspect) {
  return !Number.isFinite(previousAspect) || orientationForAspect(previousAspect) !== orientationForAspect(nextAspect);
}
export function refitPreservingView(box, position, target, verticalFov, aspect, padding = 1.2) {
  const direction = position.clone().sub(target);
  if (direction.lengthSq() < 1e-8) direction.copy(viewDirection('reset'));
  direction.normalize();
  const { distance } = fitPerspectiveBox(box, direction, verticalFov, aspect, padding);
  return { target: target.clone(), position: target.clone().addScaledVector(direction, distance), distance };
}
