import * as THREE from 'three';
import { createMaterials } from './materials.js';
import { createHead } from './head.js';
import { createTorso } from './torso.js';
import { createArms } from './arms.js';
import { createLegs } from './legs.js';
import { createAccessories } from './accessories.js';

function bakeFlatNormals(root) {
  root.traverse((object) => {
    if (!object.isMesh || !object.geometry) return;
    if (object.userData.smooth) return;
    if (object.geometry.index) {
      object.geometry = object.geometry.toNonIndexed();
    }
    object.geometry.computeVertexNormals();
  });
}

function countTriangles(root) {
  let triangles = 0;
  root.traverse((object) => {
    if (!object.isMesh || !object.geometry) return;
    const index = object.geometry.getIndex();
    const position = object.geometry.getAttribute('position');
    if (index) triangles += index.count / 3;
    else if (position) triangles += position.count / 3;
  });
  return Math.round(triangles);
}

export function createDwarf() {
  const materials = createMaterials();

  const root = new THREE.Group();
  root.name = 'dwarfRoot';

  root.add(createLegs(materials));
  root.add(createTorso(materials));
  root.add(createArms(materials));
  root.add(createHead(materials));
  root.add(createAccessories(materials));

  bakeFlatNormals(root);

  // Uniformly normalize to the requested 1.3 m, with soles on Y = 0 and the
  // root pivot centered between the feet.
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const height = box.max.y - box.min.y;
  const scale = 1.3 / height;
  root.scale.setScalar(scale);
  root.position.x = -((box.min.x + box.max.x) / 2) * scale;
  root.position.y = -box.min.y * scale;
  root.position.z = -((box.min.z + box.max.z) / 2) * scale;
  root.updateMatrixWorld(true);

  const finalBox = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  finalBox.getSize(size);
  const triangles = countTriangles(root);

  root.userData = {
    name: 'Steampunk Dwarf',
    height: Number(size.y.toFixed(3)),
    width: Number(size.x.toFixed(3)),
    depth: Number(size.z.toFixed(3)),
    triangles,
    pose: 'T-pose',
  };

  return { root, materials, triangles };
}
