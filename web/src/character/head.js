import * as THREE from 'three';
import {
  addRivet,
  buckle,
  loft,
  mesh,
  ringShell,
  roundedBox,
  strand,
  tube,
  v,
} from './geometry.js';

const HEAD_Y = 1.112;
const HEAD_Z = 0.008;

function deformHead(geometry) {
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Broad skull, slightly flattened at the back.
    x *= 0.126;
    y *= 0.134;
    z *= 0.124;
    if (z < 0) z *= 0.94;

    // Wide cheekbones and a narrower jaw.
    const t = (y + 0.134) / 0.268; // 0 bottom, 1 top
    const cheek = 1 + 0.055 * Math.exp(-((t - 0.48) ** 2) / 0.018);
    const jaw = 0.8 + 0.2 * Math.min(1, Math.max(0, (t - 0.02) / 0.44));
    x *= cheek * jaw;

    // Push the chin and brow ridge forward.
    if (z > 0.02) {
      if (y < -0.055 && y > -0.125) z += 0.012 * (-y - 0.055) / 0.07;
      if (y > 0.03 && y < 0.075) z += 0.007 * Math.sin(((y - 0.03) / 0.045) * Math.PI);
    }

    // Flatten the face plane a little so features sit on a readable mask.
    if (z > 0.09) z = 0.09 + (z - 0.09) * 0.85;

    pos.setXYZ(i, x, y, z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function eye(side, mats) {
  const group = new THREE.Group();
  const x = side * 0.047;
  const y = 1.126;
  const z = 0.123;

  const socket = mesh(new THREE.SphereGeometry(1, 6, 4), mats.eyeSocket);
  socket.scale.set(0.031, 0.022, 0.008);
  socket.position.set(x, y + 0.002, z);
  group.add(socket);

  const white = mesh(new THREE.SphereGeometry(1, 10, 6), mats.eyeWhite, { smooth: true });
  white.scale.set(0.018, 0.011, 0.0105);
  white.position.set(x, y, z + 0.007);
  group.add(white);

  const iris = mesh(new THREE.CircleGeometry(0.008, 14), mats.iris);
  iris.position.set(x, y, z + 0.0192);
  group.add(iris);

  const pupil = mesh(new THREE.CircleGeometry(0.004, 12), mats.pupil);
  pupil.position.set(x, y, z + 0.0198);
  group.add(pupil);

  const glint = mesh(new THREE.CircleGeometry(0.0016, 8), mats.eyeWhite);
  glint.position.set(x - 0.0022, y + 0.0024, z + 0.0203);
  group.add(glint);

  // Heavy upper lid and a small lower pad.
  const upper = mesh(new THREE.SphereGeometry(1, 6, 4), mats.skin);
  upper.scale.set(0.026, 0.0118, 0.0135);
  upper.position.set(x, y + 0.012, z + 0.008);
  upper.rotation.z = side * 0.13;
  group.add(upper);

  const lower = mesh(new THREE.SphereGeometry(1, 6, 4), mats.skinShadow);
  lower.scale.set(0.023, 0.005, 0.009);
  lower.position.set(x, y - 0.0115, z + 0.009);
  group.add(lower);

  const crease = mesh(new THREE.TorusGeometry(1, 0.002, 3, 8, Math.PI), mats.skinShadow);
  crease.scale.set(0.025, 0.01, 1);
  crease.position.set(x, y + 0.013, z + 0.0155);
  group.add(crease);

  return group;
}

function brow(side, mats) {
  const pts = [
    v(side * 0.011, 1.138, 0.13),
    v(side * 0.038, 1.146, 0.138),
    v(side * 0.067, 1.152, 0.132),
    v(side * 0.09, 1.148, 0.116),
  ];
  const geometry = strand(
    pts,
    [0.011, 0.016, 0.017, 0.008],
    [0.01, 0.013, 0.013, 0.006],
    { sides: 6 },
  );
  return mesh(geometry, mats.beardLight);
}

function moustache(side, mats) {
  const pts = [
    v(side * 0.004, 1.069, 0.152),
    v(side * 0.032, 1.066, 0.18),
    v(side * 0.066, 1.053, 0.192),
    v(side * 0.104, 1.032, 0.172),
  ];
  const geometry = strand(
    pts,
    [0.016, 0.032, 0.036, 0.016],
    [0.014, 0.022, 0.023, 0.011],
    { sides: 6 },
  );
  const m = mesh(geometry, mats.beardLight);
  m.name = 'moustache';
  return m;
}

function beardLock(points, widths, depths, mat) {
  return mesh(strand(points, widths, depths, { sides: 5 }), mat);
}

function sideBraid(side, mats) {
  const group = new THREE.Group();
  group.name = side > 0 ? 'braid_l' : 'braid_r';
  const pts = [
    v(side * 0.072, 1.035, 0.17),
    v(side * 0.083, 0.998, 0.197),
    v(side * 0.089, 0.962, 0.205),
    v(side * 0.091, 0.93, 0.193),
  ];
  const braid = beardLock(pts, [0.027, 0.026, 0.02, 0.01], [0.023, 0.022, 0.018, 0.008], mats.beardDark);
  group.add(braid);

  const cuff = mesh(new THREE.CylinderGeometry(0.031, 0.028, 0.03, 8), mats.brass);
  cuff.scale.z = 0.82;
  cuff.position.set(side * 0.083, 0.999, 0.199);
  cuff.rotation.z = side * 0.1;
  group.add(cuff);

  for (let i = 0; i < 3; i += 1) {
    const a = -0.9 + i * 0.9 + Math.PI / 2;
    addRivet(
      group,
      side * 0.083 + Math.cos(a) * 0.028,
      0.999,
      0.199 + Math.sin(a) * 0.023 + 0.013,
      mats.brassDark,
      0.0038,
    );
  }
  return group;
}

function createBeard(mats) {
  const group = new THREE.Group();
  group.name = 'beard';

  // Main volume, tucked behind the mouth but protruding over the chest.
  const base = mesh(
    loft(
      [
        { y: 1.048, rx: 0.099, rz: 0.05, z: 0.045, squareness: 2.1 },
        { y: 1.02, rx: 0.122, rz: 0.072, z: 0.065, squareness: 2.2 },
        { y: 0.975, rx: 0.135, rz: 0.082, z: 0.085, squareness: 2.3 },
        { y: 0.925, rx: 0.128, rz: 0.083, z: 0.105, squareness: 2.3 },
        { y: 0.87, rx: 0.108, rz: 0.077, z: 0.12, squareness: 2.3 },
        { y: 0.82, rx: 0.082, rz: 0.065, z: 0.128, squareness: 2.2 },
        { y: 0.79, rx: 0.078, rz: 0.052, z: 0.132, squareness: 2.1 },
        { y: 0.765, rx: 0.055, rz: 0.045, z: 0.135, squareness: 2.1 },
      ],
      13,
    ),
    mats.beard,
  );
  group.add(base);

  // Individual locks, layered front to back with a few tonal variations.
  const locks = [
    {
      p: [[0, 1.038, 0.11], [0, 0.985, 0.16], [0, 0.91, 0.19], [0, 0.83, 0.185], [0, 0.8, 0.16]],
      w: [0.038, 0.041, 0.036, 0.03, 0.016],
      d: [0.032, 0.037, 0.032, 0.025, 0.012],
      m: 'beard',
    },
    {
      p: [[-0.035, 1.045, 0.105], [-0.055, 0.99, 0.155], [-0.062, 0.92, 0.185], [-0.052, 0.85, 0.18], [-0.028, 0.81, 0.155]],
      w: [0.03, 0.037, 0.034, 0.026, 0.014],
      d: [0.026, 0.03, 0.028, 0.02, 0.01],
      m: 'beardLight',
    },
    {
      p: [[0.035, 1.045, 0.105], [0.055, 0.99, 0.155], [0.062, 0.92, 0.185], [0.052, 0.85, 0.18], [0.028, 0.81, 0.155]],
      w: [0.03, 0.037, 0.034, 0.026, 0.014],
      d: [0.026, 0.03, 0.028, 0.02, 0.01],
      m: 'beardLight',
    },
    {
      p: [[-0.085, 1.055, 0.075], [-0.105, 1.0, 0.145], [-0.11, 0.935, 0.17], [-0.095, 0.87, 0.17], [-0.06, 0.83, 0.15]],
      w: [0.026, 0.03, 0.028, 0.022, 0.013],
      d: [0.024, 0.027, 0.025, 0.018, 0.009],
      m: 'beardDark',
    },
    {
      p: [[0.085, 1.055, 0.075], [0.105, 1.0, 0.145], [0.11, 0.935, 0.17], [0.095, 0.87, 0.17], [0.06, 0.83, 0.15]],
      w: [0.026, 0.03, 0.028, 0.022, 0.013],
      d: [0.024, 0.027, 0.025, 0.018, 0.009],
      m: 'beardDark',
    },
    {
      p: [[-0.055, 1.02, 0.12], [-0.09, 0.96, 0.16], [-0.093, 0.89, 0.175], [-0.073, 0.84, 0.16]],
      w: [0.024, 0.027, 0.024, 0.014],
      d: [0.022, 0.024, 0.02, 0.009],
      m: 'beard',
    },
    {
      p: [[0.055, 1.02, 0.12], [0.09, 0.96, 0.16], [0.093, 0.89, 0.175], [0.073, 0.84, 0.16]],
      w: [0.024, 0.027, 0.024, 0.014],
      d: [0.022, 0.024, 0.02, 0.009],
      m: 'beard',
    },
    {
      p: [[-0.025, 1.025, 0.13], [-0.028, 0.96, 0.175], [-0.02, 0.885, 0.19], [-0.01, 0.845, 0.17]],
      w: [0.018, 0.022, 0.02, 0.012],
      d: [0.016, 0.018, 0.016, 0.008],
      m: 'beardLight',
    },
    {
      p: [[0.025, 1.025, 0.13], [0.028, 0.96, 0.175], [0.02, 0.885, 0.19], [0.01, 0.845, 0.17]],
      w: [0.018, 0.022, 0.02, 0.012],
      d: [0.016, 0.018, 0.016, 0.008],
      m: 'beardLight',
    },
  ];

  locks.forEach((spec) => {
    const mat = mats[spec.m];
    group.add(beardLock(spec.p.map(([x, y, z]) => v(x, y, z)), spec.w, spec.d, mat));
  });

  // Broad cheek masses that give the beard its bushy silhouette.
  for (const side of [1, -1]) {
    const pts = [
      v(side * 0.095, 1.062, 0.075),
      v(side * 0.118, 1.012, 0.125),
      v(side * 0.126, 0.955, 0.158),
      v(side * 0.118, 0.9, 0.165),
      v(side * 0.095, 0.855, 0.148),
    ];
    group.add(
      beardLock(
        pts,
        [0.03, 0.034, 0.031, 0.023, 0.011],
        [0.026, 0.03, 0.027, 0.02, 0.009],
        side > 0 ? mats.beard : mats.beardDark,
      ),
    );
  }

  // Shadow gaps between the big locks.
  [
    [[-0.02, 1.015, 0.15], [-0.03, 0.95, 0.19], [-0.025, 0.87, 0.19]],
    [[0.02, 1.015, 0.15], [0.03, 0.95, 0.19], [0.025, 0.87, 0.19]],
  ].forEach((pts) => {
    group.add(beardLock(pts.map(([x, y, z]) => v(x, y, z)), [0.006, 0.007, 0.004], [0.003, 0.004, 0.002], mats.beardShadow));
  });

  // Sideburns climbing under the cap.
  for (const side of [1, -1]) {
    const pts = [
      v(side * 0.107, 1.155, 0.012),
      v(side * 0.115, 1.11, 0.05),
      v(side * 0.113, 1.065, 0.1),
      v(side * 0.1, 1.035, 0.135),
    ];
    group.add(beardLock(pts, [0.016, 0.022, 0.03, 0.032], [0.016, 0.02, 0.026, 0.027], mats.beardDark));
  }

  // Moustache halves.
  group.add(moustache(1, mats));
  group.add(moustache(-1, mats));

  // Side braids with brass cuffs.
  group.add(sideBraid(1, mats));
  group.add(sideBraid(-1, mats));

  // Central braid and the wide brass beard clasp.
  const braid = beardLock(
    [
      v(0, 0.802, 0.15),
      v(0, 0.762, 0.178),
      v(0.006, 0.735, 0.18),
      v(-0.005, 0.708, 0.172),
      v(0, 0.682, 0.16),
    ],
    [0.03, 0.032, 0.027, 0.02, 0.007],
    [0.027, 0.028, 0.024, 0.017, 0.006],
    mats.beard,
  );
  group.add(braid);

  const clasp = mesh(new THREE.CylinderGeometry(0.046, 0.04, 0.062, 8), mats.brass);
  clasp.scale.z = 0.82;
  clasp.position.set(0, 0.756, 0.182);
  group.add(clasp);
  for (let i = 0; i < 3; i += 1) {
    addRivet(group, -0.022 + i * 0.022, 0.756, 0.22 - Math.abs(i - 1) * 0.009, mats.brassDark, 0.0043);
  }

  return group;
}

function makeEarFlap(side, mats) {
  // A shaped leather panel built in the (depth, height) plane and extruded
  // sideways, so the cap flap tapers around the jaw instead of reading as a box.
  const pts = [
    [0.055, 1.166],
    [0.072, 1.135],
    [0.072, 1.08],
    [0.058, 1.028],
    [0.032, 1.004],
    [-0.008, 1.0],
    [-0.044, 1.018],
    [-0.058, 1.066],
    [-0.058, 1.128],
    [-0.04, 1.162],
    [0.0, 1.17],
  ];
  const shape = new THREE.Shape();
  const coords = pts.map(([z, y]) => [side > 0 ? z : -z, y]);
  shape.moveTo(coords[0][0], coords[0][1]);
  for (let i = 1; i < coords.length; i += 1) shape.lineTo(coords[i][0], coords[i][1]);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 1,
    curveSegments: 2,
    steps: 1,
  });
  const flap = mesh(geo, mats.hatLeather);
  flap.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
  flap.position.x = side * 0.15;
  flap.name = 'hat_ear_flap';
  return flap;
}

function createHat(mats) {
  const group = new THREE.Group();
  group.name = 'hat';

  const profile = [
    new THREE.Vector2(0.152, 1.174),
    new THREE.Vector2(0.158, 1.188),
    new THREE.Vector2(0.157, 1.212),
    new THREE.Vector2(0.15, 1.242),
    new THREE.Vector2(0.136, 1.266),
    new THREE.Vector2(0.114, 1.288),
    new THREE.Vector2(0.082, 1.305),
    new THREE.Vector2(0.042, 1.315),
    new THREE.Vector2(0.0, 1.32),
  ];
  const dome = mesh(new THREE.LatheGeometry(profile, 12), mats.hatLeather);
  dome.scale.z = 0.98;
  group.add(dome);

  const brim = mesh(
    ringShell({
      y0: 1.164,
      y1: 1.19,
      rx0: 0.156,
      rz0: 0.153,
      rx1: 0.15,
      rz1: 0.147,
      thickness: 0.008,
      segments: 16,
    }),
    mats.leatherDark,
  );
  group.add(brim);

  // Leather skirt wrapping the sides and nape so the cap reads as a full
  // aviator helmet rather than a dome sitting on the skull.
  const skirt = mesh(
    new THREE.CylinderGeometry(0.158, 0.168, 0.152, 14, 1, true, 0.98, Math.PI * 2 - 1.96),
    mats.hatLeather,
  );
  skirt.position.y = 1.094;
  skirt.scale.z = 0.96;
  group.add(skirt);

  const skirtEdge = mesh(
    new THREE.CylinderGeometry(0.17, 0.174, 0.03, 14, 1, true, 0.98, Math.PI * 2 - 1.96),
    mats.leatherDark,
  );
  skirtEdge.position.y = 1.031;
  skirtEdge.scale.z = 0.96;
  group.add(skirtEdge);

  for (const side of [1, -1]) {
    addRivet(group, side * 0.065, 1.045, -0.155, mats.brass, 0.0042);
  }

  // Raised seams from the brim over the crown.
  const seamPaths = [
    [
      [0, 1.176, 0.154],
      [0, 1.23, 0.148],
      [0, 1.274, 0.115],
      [0, 1.305, 0.055],
      [0, 1.32, 0],
    ],
    [
      [0, 1.176, -0.152],
      [0, 1.23, -0.147],
      [0, 1.274, -0.114],
      [0, 1.305, -0.054],
    ],
  ];
  seamPaths[1].reverse();
  const seams = [...seamPaths[0], ...seamPaths[1]];
  const seamPoints = seams.map(([x, y, z]) => v(x, y, z));
  group.add(mesh(tube(seamPoints, 0.0045, 4), mats.leatherDark));

  // Side seams.
  for (const side of [1, -1]) {
    const pts = [
      v(side * 0.077, 1.176, 0.132),
      v(side * 0.08, 1.225, 0.126),
      v(side * 0.078, 1.272, 0.098),
      v(side * 0.06, 1.305, 0.045),
    ];
    group.add(mesh(tube(pts, 0.0038, 4), mats.leatherDark));
  }

  // Ear flaps.
  for (const side of [1, -1]) {
    group.add(makeEarFlap(side, mats));

    const strap = mesh(roundedBox(0.018, 0.05, 0.04, 0.005, 1), mats.leatherDark);
    strap.position.set(side * 0.157, 1.038, 0.022);
    group.add(strap);

    const flapBuckle = buckle({ width: 0.033, height: 0.027, bar: 0.005, depth: 0.009, prong: false }, mats.brass);
    flapBuckle.position.set(side * 0.169, 1.035, 0.024);
    flapBuckle.rotation.y = side * Math.PI / 2;
    group.add(flapBuckle);

    addRivet(group, side * 0.165, 1.12, 0.025, mats.brass, 0.0042);
    addRivet(group, side * 0.165, 1.065, 0.025, mats.brass, 0.0042);
  }

  // Nape flap.
  const nape = mesh(roundedBox(0.185, 0.09, 0.028, 0.026, 2), mats.hatLeather);
  nape.position.set(0, 1.072, -0.171);
  nape.rotation.x = -0.07;
  group.add(nape);
  const napeEdge = mesh(roundedBox(0.19, 0.016, 0.014, 0.005, 1), mats.leatherDark);
  napeEdge.position.set(0, 1.005, -0.177);
  group.add(napeEdge);
  const napeBuckle = buckle({ width: 0.038, height: 0.028, bar: 0.005, depth: 0.008, prong: true }, mats.brass);
  napeBuckle.position.set(0, 1.055, -0.187);
  napeBuckle.rotation.y = Math.PI;
  group.add(napeBuckle);

  // Goggles strap around the cap.
  const strapBand = mesh(
    ringShell({
      y0: 1.184,
      y1: 1.216,
      rx0: 0.162,
      rz0: 0.158,
      rx1: 0.161,
      rz1: 0.157,
      thickness: 0.007,
      segments: 16,
    }),
    mats.leatherDark,
  );
  group.add(strapBand);
  const strapBuckle = buckle({ width: 0.033, height: 0.025, bar: 0.005, depth: 0.008, prong: false }, mats.brassDark);
  strapBuckle.position.set(0.065, 1.2, -0.158);
  strapBuckle.rotation.y = Math.PI + 0.35;
  group.add(strapBuckle);

  return group;
}

function createGoggles(mats) {
  const group = new THREE.Group();
  group.name = 'goggles';
  group.position.set(0, 1.216, 0.152);
  group.rotation.x = -0.12;

  for (const side of [1, -1]) {
    const lensGroup = new THREE.Group();
    lensGroup.position.x = side * 0.062;

    const rim = mesh(new THREE.TorusGeometry(0.054, 0.0115, 4, 8), mats.brass);
    lensGroup.add(rim);

    const inner = mesh(new THREE.TorusGeometry(0.0435, 0.0052, 3, 8), mats.brassDark);
    inner.position.z = 0.008;
    lensGroup.add(inner);

    const housing = mesh(new THREE.CylinderGeometry(0.049, 0.052, 0.022, 8), mats.brassDark);
    housing.rotation.x = Math.PI / 2;
    housing.position.z = -0.002;
    lensGroup.add(housing);

    const glass = mesh(new THREE.CircleGeometry(0.0435, 12), mats.lens, { smooth: false });
    glass.position.z = 0.0125;
    lensGroup.add(glass);

    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      addRivet(lensGroup, Math.cos(a) * 0.054, Math.sin(a) * 0.054, 0.012, mats.brassDark, 0.0045);
    }

    group.add(lensGroup);

    const connector = mesh(roundedBox(0.018, 0.026, 0.02, 0.005, 1), mats.brass);
    connector.position.set(side * 0.124, 0, -0.012);
    group.add(connector);
  }

  const bridge = mesh(roundedBox(0.03, 0.014, 0.016, 0.005, 1), mats.brass);
  bridge.position.set(0, 0.003, -0.004);
  group.add(bridge);
  addRivet(group, 0, 0.003, 0.006, mats.brassDark, 0.0045);

  // Leather pads behind the lenses so they sit on the cap convincingly.
  for (const side of [1, -1]) {
    const pad = mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.012, 8), mats.leatherDark);
    pad.rotation.x = Math.PI / 2;
    pad.position.set(side * 0.062, 0, -0.02);
    group.add(pad);
  }

  return group;
}

function createFace(mats) {
  const face = new THREE.Group();
  face.name = 'face';

  const headGeo = deformHead(new THREE.SphereGeometry(1, 14, 10));
  const head = mesh(headGeo, mats.skin);
  head.position.set(0, HEAD_Y, HEAD_Z);
  face.add(head);

  // Cheekbones, kept low and mostly embedded.
  for (const side of [1, -1]) {
    const cheek = mesh(new THREE.SphereGeometry(1, 6, 4), mats.skin);
    cheek.scale.set(0.043, 0.033, 0.026);
    cheek.position.set(side * 0.077, 1.098, 0.082);
    face.add(cheek);
  }

  // Nose bridge and bulbous tip.
  const bridge = mesh(
    strand(
      [v(0, 1.151, 0.12), v(0, 1.125, 0.14), v(0, 1.105, 0.15)],
      [0.014, 0.019, 0.023],
      [0.012, 0.017, 0.021],
      { sides: 6 },
    ),
    mats.skinWarm,
  );
  face.add(bridge);

  const nose = mesh(new THREE.SphereGeometry(1, 8, 6), mats.skinWarm);
  nose.scale.set(0.033, 0.028, 0.031);
  nose.position.set(0, 1.093, 0.152);
  face.add(nose);

  for (const side of [1, -1]) {
    const wing = mesh(new THREE.SphereGeometry(1, 6, 4), mats.skinWarm);
    wing.scale.set(0.017, 0.016, 0.018);
    wing.position.set(side * 0.025, 1.081, 0.147);
    face.add(wing);

    const nostril = mesh(new THREE.SphereGeometry(1, 6, 4), mats.eyeSocket);
    nostril.scale.set(0.0075, 0.0045, 0.005);
    nostril.position.set(side * 0.015, 1.075, 0.158);
    face.add(nostril);
  }

  // Eyes and heavy angry brows.
  face.add(eye(1, mats));
  face.add(eye(-1, mats));
  face.add(brow(1, mats));
  face.add(brow(-1, mats));

  // Glabella frown creases.
  for (const side of [1, -1]) {
    const crease = mesh(roundedBox(0.0045, 0.022, 0.004, 0.0015, 1), mats.skinShadow);
    crease.position.set(side * 0.012, 1.155, 0.135);
    crease.rotation.z = side * 0.22;
    face.add(crease);
  }

  // Lower lip, mostly hidden under the moustache.
  const lip = mesh(new THREE.SphereGeometry(1, 6, 4), mats.skinWarm);
  lip.scale.set(0.025, 0.008, 0.011);
  lip.position.set(0, 1.051, 0.134);
  face.add(lip);

  const mouthLine = mesh(roundedBox(0.045, 0.004, 0.006, 0.0018, 1), mats.mouth);
  mouthLine.position.set(0, 1.059, 0.137);
  face.add(mouthLine);

  // Chin volume hides under the beard, but supports the silhouette from the side.
  const chin = mesh(new THREE.SphereGeometry(1, 6, 4), mats.skin);
  chin.scale.set(0.046, 0.028, 0.026);
  chin.position.set(0, 1.038, 0.112);
  face.add(chin);

  // Ears tucked under the cap flaps.
  for (const side of [1, -1]) {
    const ear = mesh(new THREE.SphereGeometry(1, 6, 4), mats.skinWarm);
    ear.scale.set(0.015, 0.032, 0.022);
    ear.position.set(side * 0.126, 1.103, 0.008);
    face.add(ear);
    const inner = mesh(new THREE.SphereGeometry(1, 5, 3), mats.skinShadow);
    inner.scale.set(0.007, 0.019, 0.012);
    inner.position.set(side * 0.134, 1.103, 0.012);
    face.add(inner);
  }

  // Neck.
  const neck = mesh(
    loft(
      [
        { y: 0.94, rx: 0.064, rz: 0.061 },
        { y: 0.985, rx: 0.066, rz: 0.063 },
        { y: 1.02, rx: 0.069, rz: 0.066 },
      ],
      10,
    ),
    mats.skin,
  );
  neck.name = 'neck';
  face.add(neck);

  face.add(createBeard(mats));
  face.add(createHat(mats));
  face.add(createGoggles(mats));

  return face;
}

export function createHead(mats) {
  const group = new THREE.Group();
  group.name = 'head';
  group.scale.set(1.06, 1, 1.04);
  group.add(createFace(mats));
  return group;
}
