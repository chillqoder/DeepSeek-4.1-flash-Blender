import * as THREE from 'three';
import {
  addRivet,
  buckle,
  loft,
  mesh,
  ringShell,
  roundedBox,
  strand,
} from './geometry.js';

function bootRivets(group, material) {
  const spots = [
    [-0.052, 0.124, 0.158],
    [0.0, 0.134, 0.172],
    [0.052, 0.124, 0.158],
    [-0.066, 0.098, 0.153],
    [0.066, 0.098, 0.153],
  ];
  spots.forEach(([x, y, z]) => addRivet(group, x, y, z, material, 0.0045));
}

function createBoot(side, mats) {
  const boot = new THREE.Group();
  boot.name = side > 0 ? 'boot_l' : 'boot_r';
  boot.position.x = side * 0.142;

  // Thick sole with a small heel.
  const sole = mesh(roundedBox(0.184, 0.052, 0.285, 0.019, 2), mats.sole);
  sole.position.set(0, 0.026, 0.022);
  boot.add(sole);
  const heel = mesh(roundedBox(0.154, 0.034, 0.095, 0.013, 1), mats.sole);
  heel.position.set(0, 0.035, -0.086);
  boot.add(heel);

  // Rounded leather foot.
  const foot = mesh(roundedBox(0.166, 0.122, 0.258, 0.042, 2), mats.leatherBoot);
  foot.position.set(0, 0.108, 0.025);
  foot.scale.set(1, 1, 1.02);
  boot.add(foot);

  // Shaft, flaring into a folded cuff.
  const shaft = mesh(
    loft(
      [
        { y: 0.1, rx: 0.078, rz: 0.08, z: -0.012, squareness: 2.4 },
        { y: 0.16, rx: 0.079, rz: 0.084, z: -0.014, squareness: 2.4 },
        { y: 0.22, rx: 0.086, rz: 0.091, z: -0.016, squareness: 2.5 },
        { y: 0.265, rx: 0.09, rz: 0.095, z: -0.017, squareness: 2.5 },
        { y: 0.3, rx: 0.097, rz: 0.102, z: -0.018, squareness: 2.6 },
      ],
      9,
    ),
    mats.leatherBoot,
  );
  boot.add(shaft);

  const cuff = mesh(
    ringShell({
      y0: 0.278,
      y1: 0.322,
      rx0: 0.104,
      rz0: 0.109,
      rx1: 0.113,
      rz1: 0.119,
      thickness: 0.009,
      segments: 10,
      z: -0.018,
    }),
    mats.leatherMid,
  );
  boot.add(cuff);

  // Brass armored toe cap.
  const cap = mesh(new THREE.SphereGeometry(1, 8, 5), mats.brass);
  cap.scale.set(0.087, 0.048, 0.079);
  cap.position.set(0, 0.094, 0.122);
  boot.add(cap);
  bootRivets(boot, mats.brassDark);

  // Straps with buckles at the ankle and at the cuff.
  const ankleStrap = mesh(
    ringShell({
      y0: 0.164,
      y1: 0.196,
      rx0: 0.091,
      rz0: 0.096,
      rx1: 0.092,
      rz1: 0.097,
      thickness: 0.006,
      segments: 10,
      z: -0.013,
    }),
    mats.leatherDark,
  );
  boot.add(ankleStrap);

  const topStrap = mesh(
    ringShell({
      y0: 0.25,
      y1: 0.282,
      rx0: 0.099,
      rz0: 0.104,
      rx1: 0.102,
      rz1: 0.107,
      thickness: 0.006,
      segments: 10,
      z: -0.017,
    }),
    mats.leatherDark,
  );
  boot.add(topStrap);

  const ankleBuckle = buckle({ width: 0.036, height: 0.028, bar: 0.005, depth: 0.009, prong: false }, mats.brass);
  ankleBuckle.position.set(side * 0.095, 0.18, 0.012);
  ankleBuckle.rotation.y = side * Math.PI / 2;
  boot.add(ankleBuckle);

  const topBuckle = buckle({ width: 0.042, height: 0.032, bar: 0.006, depth: 0.01, prong: true }, mats.brass);
  topBuckle.position.set(side * 0.109, 0.266, 0.0);
  topBuckle.rotation.y = side * Math.PI / 2;
  boot.add(topBuckle);

  const strapEnd = mesh(roundedBox(0.018, 0.026, 0.06, 0.004, 1), mats.leatherDark);
  strapEnd.position.set(side * 0.094, 0.265, 0.048);
  boot.add(strapEnd);

  // Instep strap over the leather foot, with a small side buckle.
  const instep = mesh(roundedBox(0.168, 0.026, 0.062, 0.009, 2), mats.leatherDark);
  instep.position.set(0, 0.151, 0.055);
  instep.rotation.x = 0.08;
  boot.add(instep);
  const instepBuckle = buckle({ width: 0.028, height: 0.023, bar: 0.004, depth: 0.007, prong: false }, mats.brass);
  instepBuckle.position.set(side * 0.086, 0.153, 0.062);
  instepBuckle.rotation.y = side * Math.PI / 2;
  boot.add(instepBuckle);

  // Sole rivets.
  addRivet(boot, side * 0.078, 0.06, 0.11, mats.brassDark, 0.0038);
  addRivet(boot, side * 0.081, 0.06, 0.023, mats.brassDark, 0.0038);

  // Sole edge seam.
  const welt = mesh(
    ringShell({
      y0: 0.048,
      y1: 0.06,
      rx0: 0.09,
      rz0: 0.142,
      thickness: 0.006,
      segments: 12,
      z: 0.022,
    }),
    mats.leatherDark,
  );
  welt.scale.set(1, 1, 1);
  boot.add(welt);

  return boot;
}

function createPants(side, mats) {
  const leg = new THREE.Group();
  leg.name = side > 0 ? 'pants_l' : 'pants_r';

  const geo = loft(
    [
      { y: 0.285, rx: 0.085, rz: 0.09, x: side * 0.137, squareness: 2.15 },
      { y: 0.33, rx: 0.094, rz: 0.099, x: side * 0.134, squareness: 2.15 },
      { y: 0.375, rx: 0.102, rz: 0.108, x: side * 0.129, squareness: 2.15 },
      { y: 0.43, rx: 0.116, rz: 0.121, x: side * 0.121, squareness: 2.1 },
      { y: 0.49, rx: 0.122, rz: 0.128, x: side * 0.112, squareness: 2.05 },
      { y: 0.535, rx: 0.118, rz: 0.128, x: side * 0.105, squareness: 2.05 },
      { y: 0.585, rx: 0.108, rz: 0.12, x: side * 0.1, squareness: 2.05 },
    ],
    12,
  );
  const pantsLeg = mesh(geo, mats.pants);
  leg.add(pantsLeg);

  // A couple of soft cloth folds at the knee, kept low and wide.
  const foldSpecs = [
    { y: 0.352, rx: 0.092, rz: 0.098, arc: 2.4, rot: 0.3, mat: mats.pantsShade },
    { y: 0.412, rx: 0.108, rz: 0.114, arc: 1.9, rot: 2.2, mat: mats.pantsShade },
    { y: 0.468, rx: 0.12, rz: 0.126, arc: 1.5, rot: 4.1, mat: mats.pantsShade },
  ];
  foldSpecs.forEach((spec) => {
    const fold = mesh(new THREE.TorusGeometry(1, 0.0055, 3, 7, spec.arc), spec.mat);
    fold.rotation.x = Math.PI / 2;
    fold.rotation.z = spec.rot;
    fold.scale.set(spec.rx, spec.rz, 1);
    fold.position.set(side * 0.128, spec.y, 0.006);
    leg.add(fold);
  });

  // Outer trouser seam, as on the reference's broad cloth legs.
  const seamPts = [];
  for (let i = 0; i <= 5; i += 1) {
    const t = i / 5;
    const y = 0.3 + t * 0.27;
    const x = side * (0.083 + t * 0.02);
    seamPts.push(new THREE.Vector3(x, y, 0.0));
  }
  const seam = mesh(
    strand(seamPts, seamPts.map(() => 0.0032), seamPts.map(() => 0.0026), { sides: 4 }),
    mats.pantsShade,
  );
  leg.add(seam);

  // Boot-top fold where the trousers are tucked in.
  const tuck = mesh(
    ringShell({
      y0: 0.292,
      y1: 0.318,
      rx0: 0.092,
      rz0: 0.098,
      rx1: 0.089,
      rz1: 0.095,
      thickness: 0.006,
      segments: 8,
      x: side * 0.137,
    }),
    mats.pantsShade,
  );
  leg.add(tuck);

  return leg;
}

export function createLegs(mats) {
  const group = new THREE.Group();
  group.name = 'legs';

  const pelvis = mesh(
    loft(
      [
        { y: 0.46, rx: 0.155, rz: 0.132, squareness: 2.2 },
        { y: 0.5, rx: 0.18, rz: 0.144, squareness: 2.2 },
        { y: 0.545, rx: 0.202, rz: 0.154, squareness: 2.2 },
        { y: 0.585, rx: 0.21, rz: 0.16, squareness: 2.2 },
        { y: 0.61, rx: 0.211, rz: 0.161, squareness: 2.2 },
      ],
      12,
    ),
    mats.pantsShade,
  );
  group.add(pelvis);

  const crotch = mesh(roundedBox(0.162, 0.13, 0.168, 0.052, 2), mats.pantsShade);
  crotch.position.set(0, 0.46, 0.015);
  group.add(crotch);

  for (const side of [1, -1]) {
    group.add(createPants(side, mats));
    group.add(createBoot(side, mats));
  }

  return group;
}
