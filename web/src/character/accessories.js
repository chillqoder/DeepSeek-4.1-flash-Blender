import * as THREE from 'three';
import {
  addRivet,
  buckle,
  gearGeometry,
  mesh,
  ringShell,
  roundedBox,
  starDisc,
  wrench,
} from './geometry.js';
import { torsoProfile } from './torso.js';

function beltPoint(angle, offset = 0) {
  const p = torsoProfile(0.575);
  return new THREE.Vector3(
    Math.sin(angle) * (p.rx + offset),
    0.575,
    Math.cos(angle) * (p.rz + offset),
  );
}

function createBelt(mats) {
  const group = new THREE.Group();
  group.name = 'belt';

  const band = mesh(
    ringShell({
      y0: 0.538,
      y1: 0.614,
      rx0: 0.215,
      rz0: 0.176,
      rx1: 0.22,
      rz1: 0.181,
      thickness: 0.01,
      segments: 16,
    }),
    mats.leatherMid,
  );
  group.add(band);

  // Stitched edges.
  for (const y of [0.544, 0.609]) {
    const p = torsoProfile(0.575);
    const stitch = mesh(new THREE.TorusGeometry(1, 0.0022, 3, 18), mats.leatherEdge);
    stitch.rotation.x = Math.PI / 2;
    stitch.scale.set(p.rx + 0.022, p.rz + 0.022, 1);
    stitch.position.y = y;
    group.add(stitch);
  }

  // Wide brass buckle.
  const buckleGroup = buckle({ width: 0.12, height: 0.088, bar: 0.014, depth: 0.022, prong: true }, mats.brass);
  buckleGroup.position.set(0, 0.575, torsoProfile(0.575).rz + 0.042);
  group.add(buckleGroup);
  addRivet(group, -0.047, 0.575, torsoProfile(0.575).rz + 0.056, mats.brassDark, 0.0045);
  addRivet(group, 0.047, 0.575, torsoProfile(0.575).rz + 0.056, mats.brassDark, 0.0045);

  // Hanging strap end below the buckle.
  const tail = mesh(roundedBox(0.032, 0.105, 0.012, 0.005, 1), mats.leatherMid);
  tail.position.set(0.032, 0.503, torsoProfile(0.55).rz + 0.034);
  tail.rotation.z = -0.06;
  group.add(tail);
  const tip = mesh(roundedBox(0.034, 0.014, 0.014, 0.004, 1), mats.brassDark);
  tip.position.set(0.03, 0.449, torsoProfile(0.55).rz + 0.034);
  group.add(tip);
  const hole = mesh(new THREE.CylinderGeometry(0.0038, 0.0038, 0.004, 6), mats.darkInterior);
  hole.rotation.x = Math.PI / 2;
  hole.position.set(0.032, 0.481, torsoProfile(0.55).rz + 0.041);
  group.add(hole);

  // Belt loops and rivets around the waist.
  [0.62, -0.62, 2.25, -2.25].forEach((angle) => {
    const p = beltPoint(angle, 0.024);
    const loop = mesh(roundedBox(0.026, 0.092, 0.014, 0.005, 1), mats.leatherDark);
    loop.position.set(p.x, 0.577, p.z);
    loop.rotation.y = angle;
    group.add(loop);
  });

  [0.28, -0.28, 1.15, -1.15, 2.3, -2.3].forEach((angle) => {
    const p = beltPoint(angle, 0.024);
    addRivet(group, p.x, 0.588, p.z, mats.brass, 0.0046);
  });

  return group;
}

function createClosedPouch(mats) {
  const group = new THREE.Group();
  group.name = 'belt_pouch';
  group.position.set(-0.17, 0.535, 0.108);
  group.rotation.y = -0.8;

  const body = mesh(roundedBox(0.128, 0.118, 0.068, 0.02, 2), mats.leatherLight);
  body.position.y = -0.06;
  group.add(body);

  const flap = mesh(roundedBox(0.136, 0.052, 0.08, 0.016, 2), mats.leatherMid);
  flap.position.set(0, 0.006, 0.002);
  group.add(flap);

  const strap = mesh(roundedBox(0.03, 0.095, 0.016, 0.006, 1), mats.leatherDark);
  strap.position.set(0, -0.045, 0.036);
  group.add(strap);

  const stud = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.007, 8), mats.brass);
  stud.rotation.x = Math.PI / 2;
  stud.position.set(0, -0.005, 0.046);
  group.add(stud);

  const flapBuckle = buckle({ width: 0.036, height: 0.027, bar: 0.005, depth: 0.008, prong: true }, mats.brass);
  flapBuckle.position.set(0, -0.045, 0.046);
  group.add(flapBuckle);

  // Corner rivets and a belt loop at the top.
  addRivet(group, -0.052, -0.09, 0.031, mats.brassDark, 0.0042);
  addRivet(group, 0.052, -0.09, 0.031, mats.brassDark, 0.0042);

  const hanger = mesh(roundedBox(0.03, 0.07, 0.02, 0.006, 1), mats.leatherDark);
  hanger.position.set(0, 0.045, -0.012);
  group.add(hanger);

  return group;
}

function createToolPouch(mats) {
  const group = new THREE.Group();
  group.name = 'tool_pouch';
  group.position.set(0.176, 0.532, 0.105);
  group.rotation.y = 0.68;

  // Open-top leather pocket.
  const body = mesh(roundedBox(0.142, 0.118, 0.072, 0.018, 2), mats.leatherMid);
  body.position.y = -0.063;
  group.add(body);

  const opening = mesh(roundedBox(0.112, 0.012, 0.05, 0.004, 1), mats.darkInterior);
  opening.position.set(0, -0.001, 0.002);
  group.add(opening);

  // Front lip.
  const lip = mesh(roundedBox(0.138, 0.04, 0.018, 0.007, 1), mats.leatherDark);
  lip.position.set(0, 0.012, 0.03);
  group.add(lip);

  const stud = mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.006, 8), mats.brass);
  stud.rotation.x = Math.PI / 2;
  stud.position.set(0, 0.016, 0.04);
  group.add(stud);

  addRivet(group, -0.055, -0.07, 0.034, mats.brassDark, 0.0042);
  addRivet(group, 0.055, -0.07, 0.034, mats.brassDark, 0.0042);

  const hanger = mesh(roundedBox(0.032, 0.07, 0.02, 0.006, 1), mats.leatherDark);
  hanger.position.set(0, 0.045, -0.012);
  group.add(hanger);

  // Two steel wrenches sticking out of the pocket.
  const wrenchA = wrench({ length: 0.155, thickness: 0.011, open: true }, mats.steel);
  wrenchA.position.set(-0.027, 0.004, 0.012);
  wrenchA.rotation.z = 0.14;
  wrenchA.rotation.y = -0.08;
  group.add(wrenchA);

  const wrenchB = wrench({ length: 0.137, thickness: 0.011, open: false }, mats.steel);
  wrenchB.position.set(0.025, 0.002, 0.02);
  wrenchB.rotation.z = -0.16;
  wrenchB.rotation.y = 0.1;
  group.add(wrenchB);

  return group;
}

function createWatch(mats) {
  const group = new THREE.Group();
  group.name = 'pocket_watch';

  const caseMesh = mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.02, 10), mats.brass);
  caseMesh.rotation.x = Math.PI / 2;
  group.add(caseMesh);

  const bezel = mesh(new THREE.TorusGeometry(0.04, 0.005, 4, 10), mats.brassDark);
  bezel.position.z = 0.011;
  group.add(bezel);

  const dial = mesh(new THREE.CircleGeometry(0.036, 14), mats.watchFace);
  dial.position.z = 0.012;
  group.add(dial);

  const handHour = mesh(roundedBox(0.004, 0.022, 0.002, 0.0015, 1), mats.black);
  handHour.position.set(0.0, 0.006, 0.0145);
  handHour.rotation.z = -0.4;
  handHour.geometry.translate(0, 0.01, 0);
  group.add(handHour);

  const handMinute = mesh(roundedBox(0.003, 0.031, 0.002, 0.0012, 1), mats.black);
  handMinute.position.set(0.0, 0.008, 0.015);
  handMinute.rotation.z = 1.35;
  handMinute.geometry.translate(0, 0.014, 0);
  group.add(handMinute);

  const pin = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.004, 8), mats.brassDark);
  pin.rotation.x = Math.PI / 2;
  pin.position.z = 0.018;
  group.add(pin);

  const crown = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 6), mats.brass);
  crown.position.set(0, 0.047, 0.003);
  group.add(crown);

  const loop = mesh(new THREE.TorusGeometry(0.009, 0.0025, 3, 8), mats.brass);
  loop.position.set(0, 0.062, 0.003);
  group.add(loop);

  // Chain links rising to a vest button.
  const start = new THREE.Vector3(0, 0.066, 0.003);
  const end = new THREE.Vector3(0.037, 0.142, 0.008);
  for (let i = 0; i < 6; i += 1) {
    const t = i / 5;
    const link = mesh(new THREE.TorusGeometry(0.0065, 0.002, 3, 6), mats.brassDark);
    link.position.lerpVectors(start, end, t);
    link.position.y += Math.sin(t * Math.PI) * 0.012;
    link.position.z += Math.sin(t * Math.PI) * 0.01;
    link.rotation.y = i % 2 ? Math.PI / 2 : 0;
    link.rotation.z = 0.4;
    group.add(link);
  }

  group.position.set(-0.111, 0.757, 0.197);
  group.rotation.y = -0.18;
  group.rotation.z = 0.05;
  return group;
}

function createChestGear(mats) {
  const group = new THREE.Group();
  group.name = 'chest_gear';
  group.position.set(0.118, 0.846, 0.195);
  group.rotation.y = 0.35;

  const backing = mesh(new THREE.CylinderGeometry(0.049, 0.049, 0.01, 12), mats.leatherDark);
  backing.rotation.x = Math.PI / 2;
  backing.position.z = -0.003;
  group.add(backing);

  const gear = mesh(gearGeometry({ teeth: 10, radius: 0.049, root: 0.036, hole: 0.012 }), mats.brass);
  gear.position.z = 0.013;
  group.add(gear);

  const hub = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 8), mats.brassDark);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.014;
  group.add(hub);

  addRivet(group, 0, 0, 0.024, mats.brass, 0.0045);
  addRivet(group, 0.032, 0.032, 0.013, mats.brassDark, 0.0033);
  addRivet(group, -0.033, 0.024, 0.013, mats.brassDark, 0.0033);

  return group;
}

function createWatchButton(mats) {
  const group = new THREE.Group();
  const p = torsoProfile(0.9);
  const y = 0.9;
  const btn = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.007, 8), mats.brass);
  btn.rotation.x = Math.PI / 2;
  btn.position.set(-0.072, y, p.rz + 0.026);
  group.add(btn);
  const ring = mesh(new THREE.TorusGeometry(0.011, 0.0025, 3, 8), mats.brassDark);
  ring.position.set(-0.072, y, p.rz + 0.03);
  group.add(ring);
  return group;
}

export function createAccessories(mats) {
  const group = new THREE.Group();
  group.name = 'accessories';

  group.add(createBelt(mats));
  group.add(createClosedPouch(mats));
  group.add(createToolPouch(mats));

  const watch = createWatch(mats);
  // Tilt the watch so it follows the curve of the chest.
  watch.position.set(-0.113, 0.756, 0.191);
  watch.rotation.y = -0.32;
  watch.rotation.z = 0.05;
  watch.scale.setScalar(1.12);
  group.add(watch);

  group.add(createWatchButton(mats));
  group.add(createChestGear(mats));

  return group;
}
