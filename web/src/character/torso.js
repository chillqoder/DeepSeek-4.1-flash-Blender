import * as THREE from 'three';
import {
  addRivet,
  buckle,
  loft,
  mesh,
  ringShell,
  roundedBox,
  strand,
  v,
  vestPanel,
} from './geometry.js';

const TORSO_KEYS = [
  { y: 0.545, rx: 0.192, rz: 0.151 },
  { y: 0.56, rx: 0.198, rz: 0.155 },
  { y: 0.62, rx: 0.214, rz: 0.165 },
  { y: 0.68, rx: 0.226, rz: 0.173 },
  { y: 0.74, rx: 0.236, rz: 0.177 },
  { y: 0.8, rx: 0.241, rz: 0.174 },
  { y: 0.85, rx: 0.238, rz: 0.168 },
  { y: 0.89, rx: 0.232, rz: 0.162 },
  { y: 0.925, rx: 0.213, rz: 0.151 },
  { y: 0.955, rx: 0.185, rz: 0.136 },
  { y: 0.975, rx: 0.145, rz: 0.118 },
];

export function torsoProfile(y) {
  if (y <= TORSO_KEYS[0].y) return { ...TORSO_KEYS[0] };
  if (y >= TORSO_KEYS[TORSO_KEYS.length - 1].y) return { ...TORSO_KEYS[TORSO_KEYS.length - 1] };
  for (let i = 0; i < TORSO_KEYS.length - 1; i += 1) {
    const a = TORSO_KEYS[i];
    const b = TORSO_KEYS[i + 1];
    if (y >= a.y && y <= b.y) {
      const t = (y - a.y) / (b.y - a.y);
      return {
        y,
        rx: a.rx + (b.rx - a.rx) * t,
        rz: a.rz + (b.rz - a.rz) * t,
      };
    }
  }
  return { ...TORSO_KEYS[3] };
}

/** Point on the front of the torso shell, used to align accessories. */
export function torsoFront(y, fraction = 1) {
  const p = torsoProfile(y);
  return { x: 0, y, z: p.rz * fraction, rx: p.rx, rz: p.rz };
}

function pocket({ x, y, side, mats }) {
  const p = torsoProfile(y);
  const angle = Math.asin(Math.min(0.95, Math.abs(x) / p.rx));
  const group = new THREE.Group();
  const sx = Math.sign(x);
  group.position.set(x, y, p.rz * Math.cos(angle) + 0.015);
  group.rotation.y = sx * angle;

  const body = mesh(roundedBox(0.086, 0.078, 0.02, 0.009, 2), mats.vestLeather);
  body.position.z = 0.006;
  group.add(body);

  const flap = mesh(roundedBox(0.095, 0.032, 0.026, 0.008, 2), mats.leatherDark);
  flap.position.set(0, 0.043, 0.01);
  flap.rotation.x = -0.08;
  group.add(flap);

  const stud = mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.006, 8), mats.brass);
  stud.rotation.x = Math.PI / 2;
  stud.position.set(0, 0.033, 0.027);
  group.add(stud);

  // Stitched top edge of the pocket.
  const seam = mesh(roundedBox(0.086, 0.0045, 0.004, 0.0018, 1), mats.leatherLight);
  seam.position.set(0, 0.032, 0.017);
  group.add(seam);

  group.name = 'vest_pocket';
  return group;
}

const vestProfile = (y) => {
  const p = torsoProfile(y);
  return { y, rx: p.rx + 0.012, rz: p.rz + 0.012 };
};

export function createTorso(mats) {
  const group = new THREE.Group();
  group.name = 'torso';

  // Beige shirt body under the vest.
  const shirt = mesh(loft(TORSO_KEYS, 14, { uvScale: 1 }), mats.shirt);
  group.add(shirt);

  // Collar band peeking out around the neck.
  const collar = mesh(
    ringShell({
      y0: 0.948,
      y1: 0.982,
      rx0: 0.083,
      rz0: 0.077,
      rx1: 0.075,
      rz1: 0.07,
      thickness: 0.009,
      segments: 12,
    }),
    mats.shirtShade,
  );
  group.add(collar);

  // Dark leather vest: two thick panels with a V opening at the chest.
  const openingAt = (t) => 0.004 + 0.24 * t * t;
  const topYAt = (angle) => 0.935 - 0.022 * Math.sin(angle) ** 4;
  const vest = new THREE.Group();
  vest.name = 'vest';
  for (const side of [1, -1]) {
    const panel = mesh(
      vestPanel({
        side,
        profile: vestProfile,
        openingAt,
        topYAt,
        y0: 0.545,
        y1: 0.935,
        thickness: 0.012,
        rings: 9,
        segments: 11,
      }),
      mats.vestLeather,
    );
    panel.name = side > 0 ? 'vest_panel_l' : 'vest_panel_r';
    vest.add(panel);

    // Raised trim following the V opening.
    const pts = [];
    for (let i = 0; i <= 5; i += 1) {
      const t = i / 5;
      const open = openingAt(t);
      const top = topYAt(open);
      const y = 0.545 + t * (top - 0.545);
      const p = vestProfile(y);
      pts.push(v(side * (p.rx + 0.002) * Math.sin(open), y, (p.rz + 0.002) * Math.cos(open)));
    }
    const trim = mesh(strand(pts, pts.map((_, i) => 0.008 + i * 0.0006), pts.map(() => 0.011), { sides: 5 }), mats.leatherDark);
    trim.name = 'vest_front_trim';
    vest.add(trim);

    // Rivets along the opening.
    [0.3, 0.52, 0.72].forEach((t) => {
      const open = openingAt(t);
      const top = topYAt(open);
      const y = 0.545 + t * (top - 0.545);
      const p = vestProfile(y);
      addRivet(
        vest,
        side * (p.rx + 0.007) * Math.sin(open),
        y,
        (p.rz + 0.007) * Math.cos(open),
        mats.brass,
        0.0048,
      );
    });

  }

  // Back seam and adjustment strap.
  const backSeamPts = [];
  for (let i = 0; i <= 5; i += 1) {
    const t = i / 5;
    const y = 0.555 + t * 0.35;
    const p = vestProfile(y);
    backSeamPts.push(v(0, y, -p.rz - 0.004));
  }
  const backSeam = mesh(strand(backSeamPts, backSeamPts.map(() => 0.006), backSeamPts.map(() => 0.007), { sides: 4 }), mats.leatherDark);
  vest.add(backSeam);

  const backStrap = mesh(roundedBox(0.17, 0.038, 0.014, 0.006, 1), mats.leatherDark);
  backStrap.position.set(0, 0.79, -0.194);
  vest.add(backStrap);
  const backBuckle = buckle({ width: 0.04, height: 0.03, bar: 0.006, depth: 0.008, prong: true }, mats.brass);
  backBuckle.position.set(0, 0.79, -0.203);
  backBuckle.rotation.y = Math.PI;
  vest.add(backBuckle);
  addRivet(vest, -0.07, 0.79, -0.201, mats.brass, 0.0045);
  addRivet(vest, 0.07, 0.79, -0.201, mats.brass, 0.0045);

  // Side seams.
  for (const side of [1, -1]) {
    const pts = [];
    for (let i = 0; i <= 4; i += 1) {
      const t = i / 4;
      const y = 0.555 + t * 0.34;
      const p = vestProfile(y);
      pts.push(v(side * (p.rx + 0.001), y, 0));
    }
    const seam = mesh(strand(pts, pts.map(() => 0.004), pts.map(() => 0.006), { sides: 4 }), mats.leatherDark);
    vest.add(seam);
  }

  group.add(vest);

  // Bound armholes hide the join between the vest shell and the sleeves.
  for (const side of [1, -1]) {
    const binding = mesh(new THREE.TorusGeometry(0.095, 0.0095, 4, 12), mats.leatherDark);
    binding.rotation.y = Math.PI / 2;
    binding.position.set(side * 0.205, 0.902, 0.0);
    binding.name = 'vest_armhole';
    group.add(binding);
  }

  // Brass vest buttons down the belly.
  [0.805, 0.748, 0.69, 0.65, 0.618].forEach((y) => {
    const p = vestProfile(y);
    const btn = mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.006, 8), mats.brass);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(0, y, p.rz + 0.008);
    group.add(btn);
    const rim = mesh(new THREE.TorusGeometry(0.0095, 0.0022, 3, 8), mats.brassDark);
    rim.position.set(0, y, p.rz + 0.011);
    group.add(rim);
  });

  // Central leather placket under the buttons: closes the seam and hides the
  // shirt where the two vest panels meet.
  const placketPts = [];
  for (let i = 0; i <= 6; i += 1) {
    const y = 0.55 + (i / 6) * 0.33;
    const p = vestProfile(y);
    placketPts.push(v(0, y, p.rz + 0.003));
  }
  const placket = mesh(
    strand(
      placketPts,
      placketPts.map(() => 0.009),
      placketPts.map(() => 0.008),
      { sides: 4 },
    ),
    mats.leatherDark,
  );
  group.add(placket);

  group.add(pocket({ x: 0.125, y: 0.775, mats }));

  // Small stitched detail on the opposite chest, above the watch.
  const chestSeam = mesh(roundedBox(0.075, 0.0045, 0.004, 0.0018, 1), mats.leatherEdge);
  chestSeam.position.set(-0.105, 0.82, torsoFront(0.82).rz + 0.016);
  chestSeam.rotation.y = -0.38;
  group.add(chestSeam);

  // Back yoke seams, so the unseen side is finished in the same style.
  for (const side of [1, -1]) {
    const pts = [];
    for (let i = 0; i <= 4; i += 1) {
      const t = i / 4;
      const y = 0.58 + t * 0.33;
      const p = vestProfile(y);
      const angle = 0.34;
      pts.push(v(side * p.rx * Math.sin(angle), y, -p.rz * Math.cos(angle)));
    }
    const seam = mesh(strand(pts, pts.map(() => 0.004), pts.map(() => 0.005), { sides: 4 }), mats.leatherDark);
    vest.add(seam);
  }
  addRivet(vest, -0.075, 0.9, -0.151, mats.brass, 0.0045);
  addRivet(vest, 0.075, 0.9, -0.151, mats.brass, 0.0045);

  return group;
}
