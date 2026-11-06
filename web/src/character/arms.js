import * as THREE from 'three';
import { loft, mesh, roundedBox, strand, v } from './geometry.js';

function finger({ side, baseX, baseY, length, width, depth, fan = 0, curl = 0.012 }) {
  const points = [
    v(baseX, baseY, 0.012),
    v(baseX + fan * 0.45, baseY + length * 0.52, 0.012 + curl * 0.8),
    v(baseX + fan, baseY + length * 0.82, 0.012 + curl),
    v(baseX + fan * 1.15, baseY + length, 0.012 + curl * 0.55),
  ];
  const widths = [width, width * 0.96, width * 0.85, width * 0.62];
  const depths = [depth, depth * 0.95, depth * 0.85, depth * 0.6];
  return strand(points, widths, depths, { sides: 5 });
}

function createArm(side, mats) {
  const arm = new THREE.Group();
  arm.name = side > 0 ? 'arm_l' : 'arm_r';
  arm.position.set(side * 0.205, 0.902, 0);
  arm.rotation.z = -side * Math.PI / 2;

  // Rolled beige sleeve.
  const sleeve = mesh(
    loft(
      [
        { y: -0.025, rx: 0.084, rz: 0.086, squareness: 2.1 },
        { y: 0.012, rx: 0.098, rz: 0.097, squareness: 2.1 },
        { y: 0.065, rx: 0.092, rz: 0.093, squareness: 2.1 },
        { y: 0.125, rx: 0.081, rz: 0.083, squareness: 2.1 },
        { y: 0.185, rx: 0.071, rz: 0.074, squareness: 2.1 },
        { y: 0.232, rx: 0.067, rz: 0.07, squareness: 2.1 },
        { y: 0.245, rx: 0.079, rz: 0.081, squareness: 2.1 },
        { y: 0.278, rx: 0.085, rz: 0.087, squareness: 2.1 },
        { y: 0.292, rx: 0.081, rz: 0.083, squareness: 2.1 },
      ],
      10,
    ),
    mats.shirt,
  );
  sleeve.name = 'shirt_sleeve';
  arm.add(sleeve);

  // Rolled cuff edge, slightly darker.
  const cuff = mesh(
    loft(
      [
        { y: 0.246, rx: 0.083, rz: 0.084, squareness: 2.1 },
        { y: 0.268, rx: 0.088, rz: 0.089, squareness: 2.1 },
        { y: 0.289, rx: 0.082, rz: 0.084, squareness: 2.1 },
      ],
      10,
      { capStart: false, capEnd: false },
    ),
    mats.shirtShade,
  );
  arm.add(cuff);

  // Rolled cuff edges and cloth folds on the upper sleeve.
  [0.252, 0.286].forEach((y, i) => {
    const rim = mesh(new THREE.TorusGeometry(1, 0.0048, 3, 10), mats.shirtShade);
    rim.rotation.x = Math.PI / 2;
    rim.scale.set(0.084 - i * 0.004, 0.086 - i * 0.004, 1);
    rim.position.y = y;
    arm.add(rim);
  });

  [
    { y: 0.085, rx: 0.09, rz: 0.092, arc: 2.2, rot: 0.6 },
    { y: 0.158, rx: 0.081, rz: 0.083, arc: 1.8, rot: 2.4 },
    { y: 0.195, rx: 0.075, rz: 0.078, arc: 1.4, rot: 4.5 },
  ].forEach((spec) => {
    const fold = mesh(new THREE.TorusGeometry(1, 0.0038, 3, 6, spec.arc), mats.shirtShade);
    fold.rotation.x = Math.PI / 2;
    fold.rotation.z = spec.rot;
    fold.scale.set(spec.rx, spec.rz, 1);
    fold.position.y = spec.y;
    arm.add(fold);
  });

  // Thick bare forearm.
  const forearm = mesh(
    loft(
      [
        { y: 0.288, rx: 0.066, rz: 0.068, squareness: 2.15 },
        { y: 0.32, rx: 0.072, rz: 0.074, squareness: 2.15 },
        { y: 0.36, rx: 0.078, rz: 0.079, squareness: 2.15 },
        { y: 0.405, rx: 0.072, rz: 0.073, squareness: 2.15 },
        { y: 0.45, rx: 0.062, rz: 0.064, squareness: 2.15 },
        { y: 0.482, rx: 0.056, rz: 0.058, squareness: 2.2 },
        { y: 0.505, rx: 0.052, rz: 0.054, squareness: 2.2 },
      ],
      9,
    ),
    mats.skin,
  );
  forearm.name = 'forearm';
  arm.add(forearm);

  // Wrist crease.
  const wrist = mesh(new THREE.TorusGeometry(1, 0.0035, 3, 8, Math.PI * 1.6), mats.skinShadow);
  wrist.rotation.x = Math.PI / 2;
  wrist.rotation.z = 0.6;
  wrist.scale.set(0.055, 0.057, 1);
  wrist.position.y = 0.5;
  arm.add(wrist);

  // Palm, broad and flat as in the reference.
  const palm = mesh(roundedBox(0.116, 0.132, 0.062, 0.026, 2), mats.skin);
  palm.position.set(0, 0.558, 0.004);
  palm.name = 'palm';
  arm.add(palm);

  const heel = mesh(new THREE.SphereGeometry(1, 8, 5), mats.skinWarm);
  heel.scale.set(0.04, 0.055, 0.032);
  heel.position.set(-side * 0.036, 0.522, 0.022);
  arm.add(heel);

  // Four fingers, fanning in the vertical plane of the palm.
  const spreads = [0.037, 0.012, -0.012, -0.037];
  const lengths = [0.104, 0.114, 0.103, 0.085];
  const widths = [0.0166, 0.017, 0.016, 0.0145];
  for (let i = 0; i < 4; i += 1) {
    const baseX = -side * spreads[i];
    const geometry = finger({
      side,
      baseX,
      baseY: 0.601,
      length: lengths[i],
      width: widths[i],
      depth: widths[i] * 0.82,
      fan: Math.sign(baseX) * 0.008,
    });
    const f = mesh(geometry, i === 3 ? mats.skinWarm : mats.skin);
    f.name = `finger_${i + 1}`;
    arm.add(f);

    const knuckle = mesh(new THREE.SphereGeometry(1, 5, 3), mats.skin);
    knuckle.scale.set(widths[i] * 1.1, 0.015, widths[i] * 0.95);
    knuckle.position.set(baseX, 0.6, 0.004);
    arm.add(knuckle);
  }

  // Thumb, pointing up once the arm is rotated into the T-pose.
  const thumbPoints = [
    v(-side * 0.045, 0.505, 0.018),
    v(-side * 0.075, 0.53, 0.032),
    v(-side * 0.095, 0.552, 0.032),
    v(-side * 0.1, 0.564, 0.025),
  ];
  const thumb = mesh(
    strand(thumbPoints, [0.022, 0.02, 0.0155, 0.011], [0.018, 0.017, 0.0135, 0.0095], { sides: 5 }),
    mats.skinWarm,
  );
  thumb.name = 'thumb';
  arm.add(thumb);

  // A few knuckle folds / veins to keep the hand from reading as a mitten.
  const crease = mesh(roundedBox(0.06, 0.004, 0.0025, 0.0012, 1), mats.skinShadow);
  crease.position.set(0, 0.512, 0.031);
  arm.add(crease);

  return arm;
}

export function createArms(mats) {
  const group = new THREE.Group();
  group.name = 'arms';
  group.add(createArm(1, mats));
  group.add(createArm(-1, mats));
  return group;
}
