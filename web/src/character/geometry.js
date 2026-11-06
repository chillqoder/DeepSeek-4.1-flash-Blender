import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* ---------------------------------------------------------------------------
   Geometry toolkit: lofts, tapered hair strands, shells, buckles, gears,
   wrenches and rivets. Everything is flat-shaded, low-poly and game friendly.
--------------------------------------------------------------------------- */

export function mesh(geometry, material, { smooth = false, shadow = true } = {}) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  m.userData.smooth = smooth;
  return m;
}

export function roundedBox(w, h, d, radius = 0.01, segments = 1) {
  // One bevel segment keeps the chunky low-poly read and the triangle budget
  // under control; extra segments mostly vanish at game resolution.
  return new RoundedBoxGeometry(w, h, d, Math.min(segments, 1), Math.min(radius, Math.min(w, h, d) / 2 - 1e-4));
}

/**
 * Vertical loft from a list of rings: { y, rx, rz, x, z, squareness }.
 * squareness 2 = ellipse, 4 = boxy superellipse.
 */
export function loft(rings, segments = 14, { capStart = true, capEnd = true, uvScale = 1 } = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const count = rings.length;

  for (let i = 0; i < count; i += 1) {
    const ring = rings[i];
    const squareness = ring.squareness ?? 2;
    const power = 2 / squareness;
    for (let j = 0; j < segments; j += 1) {
      const a = (j / segments) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const x = (ring.x ?? 0) + ring.rx * Math.sign(cos) * Math.abs(cos) ** power;
      const z = (ring.z ?? 0) + ring.rz * Math.sign(sin) * Math.abs(sin) ** power;
      positions.push(x, ring.y, z);
      uvs.push((j / segments) * uvScale, (i / (count - 1)) * uvScale);
    }
  }

  for (let i = 0; i < count - 1; i += 1) {
    for (let j = 0; j < segments; j += 1) {
      const jn = (j + 1) % segments;
      const a = i * segments + j;
      const b = i * segments + jn;
      const c = (i + 1) * segments + j;
      const d = (i + 1) * segments + jn;
      indices.push(a, c, b, b, c, d);
    }
  }

  if (capStart) {
    const center = positions.length / 3;
    positions.push(rings[0].x ?? 0, rings[0].y, rings[0].z ?? 0);
    uvs.push(0.5, 0.5);
    for (let j = 0; j < segments; j += 1) {
      const jn = (j + 1) % segments;
      indices.push(center, j, jn);
    }
  }

  if (capEnd) {
    const center = positions.length / 3;
    const top = (count - 1) * segments;
    positions.push(rings[count - 1].x ?? 0, rings[count - 1].y, rings[count - 1].z ?? 0);
    uvs.push(0.5, 0.5);
    for (let j = 0; j < segments; j += 1) {
      const jn = (j + 1) % segments;
      indices.push(center, top + jn, top + j);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

/**
 * Tapered, faceted strand that follows a path. Used for beard locks, braids,
 * the moustache and trim. Widths/depths are half extents along the local
 * cross-section.
 */
export function strand(points, widths, depths, { sides = 6, capStart = true, capEnd = true, up = null } = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const n = points.length;

  for (let i = 0; i < n; i += 1) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(n - 1, i + 1)];
    const tangent = new THREE.Vector3().subVectors(next, prev).normalize();
    let upRef = up ? new THREE.Vector3(...up) : new THREE.Vector3(0, 0, 1);
    if (Math.abs(tangent.dot(upRef)) > 0.94) {
      upRef = new THREE.Vector3(0, 1, 0);
      if (Math.abs(tangent.dot(upRef)) > 0.94) upRef.set(1, 0, 0);
    }
    const side = new THREE.Vector3().crossVectors(tangent, upRef).normalize();
    const normal = new THREE.Vector3().crossVectors(side, tangent).normalize();
    const w = widths[i];
    const d = depths[i];
    for (let k = 0; k < sides; k += 1) {
      const a = (k / sides) * Math.PI * 2;
      const off = new THREE.Vector3()
        .addScaledVector(side, Math.cos(a) * w)
        .addScaledVector(normal, Math.sin(a) * d);
      positions.push(points[i].x + off.x, points[i].y + off.y, points[i].z + off.z);
      uvs.push(k / sides, i / (n - 1));
    }
  }

  for (let i = 0; i < n - 1; i += 1) {
    for (let k = 0; k < sides; k += 1) {
      const kn = (k + 1) % sides;
      const a = i * sides + k;
      const b = i * sides + kn;
      const c = (i + 1) * sides + k;
      const d = (i + 1) * sides + kn;
      indices.push(a, c, b, b, c, d);
    }
  }

  if (capStart) {
    const center = positions.length / 3;
    positions.push(points[0].x, points[0].y, points[0].z);
    uvs.push(0.5, 0.5);
    for (let k = 0; k < sides; k += 1) {
      indices.push(center, k, (k + 1) % sides);
    }
  }

  if (capEnd) {
    const center = positions.length / 3;
    const base = (n - 1) * sides;
    positions.push(points[n - 1].x, points[n - 1].y, points[n - 1].z);
    uvs.push(0.5, 0.5);
    for (let k = 0; k < sides; k += 1) {
      indices.push(center, base + ((k + 1) % sides), base + k);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

export function tube(points, radius, sides = 6) {
  const widths = points.map((p) => (typeof radius === 'function' ? radius(p) : radius));
  return strand(points, widths, widths, { sides });
}

export function v(x, y, z) {
  return new THREE.Vector3(x, y, z);
}

/**
 * Thick band with an inner wall, like a belt, cuff or strap ring.
 */
export function ringShell({ y0, y1, rx0, rz0, rx1 = rx0, rz1 = rz0, thickness = 0.012, segments = 16, x = 0, z = 0 }) {
  const pos = [];
  const uvs = [];
  const idx = [];
  const loops = [];

  const addLoop = (y, rx, rz) => {
    const start = pos.length / 3;
    for (let j = 0; j < segments; j += 1) {
      const a = (j / segments) * Math.PI * 2;
      pos.push(x + Math.cos(a) * rx, y, z + Math.sin(a) * rz);
      uvs.push(j / segments, 0);
    }
    loops.push({ start, y, rx, rz });
    return start;
  };

  const ob = addLoop(y0, rx0, rz0);
  const ot = addLoop(y1, rx1, rz1);
  const ib = addLoop(y0, rx0 - thickness, rz0 - thickness);
  const it = addLoop(y1, rx1 - thickness, rz1 - thickness);

  const faces = (a0, a1, b0, b1, flip = false) => {
    for (let j = 0; j < segments; j += 1) {
      const jn = (j + 1) % segments;
      const a = a0 + j;
      const b = a0 + jn;
      const c = a1 + j;
      const d = a1 + jn;
      if (!flip) idx.push(a, c, b, b, c, d);
      else idx.push(a, b, c, b, d, c);
    }
  };

  faces(ob, ot, null, null); // outer wall
  faces(ib, it, null, null, true); // inner wall

  // Top and bottom rims.
  for (let j = 0; j < segments; j += 1) {
    const jn = (j + 1) % segments;
    idx.push(ob + j, ob + jn, ib + j);
    idx.push(ib + jn, ib + j, ob + jn);
    idx.push(ot + j, it + j, ot + jn);
    idx.push(it + j, it + jn, ot + jn);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(idx);
  return geometry;
}

/**
 * A curved vest panel with real thickness. The front opening widens toward
 * the neck, the top edge dips at the armholes, and both the outside and inside
 * have visible surfaces.
 */
export function vestPanel({ side = 1, profile, openingAt, topYAt, y0 = 0.575, y1 = 0.935, thickness = 0.011, rings = 9, segments = 12 }) {
  const pos = [];
  const uvs = [];
  const idx = [];

  const grid = (inner) => {
    const rows = [];
    for (let i = 0; i < rings; i += 1) {
      const t = i / (rings - 1);
      const open = openingAt(t);
      const row = [];
      for (let j = 0; j < segments; j += 1) {
        const q = j / (segments - 1);
        const angle = open + q * (Math.PI - open - 0.003);
        const top = topYAt(angle, t);
        const y = y0 + t * (top - y0);
        const p = profile(y);
        const rx = Math.max(0.001, p.rx - (inner ? thickness : 0));
        const rz = Math.max(0.001, p.rz - (inner ? thickness : 0));
        const x = side * rx * Math.sin(angle);
        const z = rz * Math.cos(angle);
        row.push({
          p: new THREE.Vector3(x, y, z),
          uv: [q, t],
        });
      }
      rows.push(row);
    }
    return rows;
  };

  const outer = grid(false);
  const inner = grid(true);
  const startOuter = 0;
  const startInner = rings * segments;

  outer.flat().forEach((entry) => {
    pos.push(entry.p.x, entry.p.y, entry.p.z);
    uvs.push(entry.uv[0], entry.uv[1]);
  });
  inner.flat().forEach((entry) => {
    pos.push(entry.p.x, entry.p.y, entry.p.z);
    uvs.push(entry.uv[0], entry.uv[1]);
  });

  const addGridFaces = (base, flip) => {
    for (let i = 0; i < rings - 1; i += 1) {
      for (let j = 0; j < segments - 1; j += 1) {
        const a = base + i * segments + j;
        const b = a + 1;
        const c = a + segments;
        const d = c + 1;
        if (!flip) idx.push(a, b, c, b, d, c);
        else idx.push(a, c, b, b, c, d);
      }
    }
  };

  addGridFaces(startOuter, side < 0);
  addGridFaces(startInner, side > 0);

  // Connect the open edges (front edge and top edge). Bottom is hidden by belt.
  const edgeQuad = (o0, i0, o1, i1, flip = false) => {
    const a = o0;
    const b = o1;
    const c = i0;
    const d = i1;
    if (!flip) idx.push(a, b, c, b, d, c);
    else idx.push(a, c, b, b, c, d);
  };

  for (let i = 0; i < rings - 1; i += 1) {
    const o0 = startOuter + i * segments;
    const o1 = startOuter + (i + 1) * segments;
    const i0 = startInner + i * segments;
    const i1 = startInner + (i + 1) * segments;
    edgeQuad(o0, i0, o1, i1, side < 0);
  }

  for (let j = 0; j < segments - 1; j += 1) {
    const o0 = startOuter + (rings - 1) * segments + j;
    const o1 = o0 + 1;
    const i0 = startInner + (rings - 1) * segments + j;
    const i1 = i0 + 1;
    edgeQuad(o0, i0, o1, i1, side > 0);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(idx);
  return geometry;
}

export function buckle({ width = 0.095, height = 0.07, bar = 0.012, depth = 0.018, prong = true } = {}, material) {
  const group = new THREE.Group();
  const add = (w, h, d, x, y, z = 0) => {
    // Sharp box bars keep every buckle at 12 triangles and reinforce the
    // early-2000s, chunky metal look.
    const m = mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    group.add(m);
  };
  add(width, bar, depth, 0, height / 2 - bar / 2);
  add(width, bar, depth, 0, -height / 2 + bar / 2);
  add(bar, height - bar * 2, depth, -width / 2 + bar / 2, 0);
  add(bar, height - bar * 2, depth, width / 2 - bar / 2, 0);
  if (prong) {
    const tongue = mesh(new THREE.BoxGeometry(bar * 0.7, height * 0.8, depth * 1.2), material);
    tongue.position.set(0, -height * 0.05, depth * 0.1);
    group.add(tongue);
    const pin = mesh(new THREE.ConeGeometry(bar * 0.55, bar * 0.8, 4), material);
    pin.rotation.x = Math.PI / 2;
    pin.position.set(0, height * 0.36, depth * 0.12);
    group.add(pin);
  }
  return group;
}

export function gearGeometry({ teeth = 10, radius = 0.045, tooth = 0.012, root = 0.033, hole = 0.011 } = {}) {
  const shape = new THREE.Shape();
  const steps = teeth * 4;
  for (let i = 0; i <= steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    const phase = i % 4;
    const r = phase === 1 || phase === 2 ? radius : root;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const holePath = new THREE.Path();
  holePath.absarc(0, 0, hole, 0, Math.PI * 2, true);
  shape.holes.push(holePath);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.012,
    bevelEnabled: false,
    curveSegments: 1,
    steps: 1,
  });
  geo.center();
  return geo;
}

export function wrench({ length = 0.14, thickness = 0.009, open = true } = {}, material) {
  const group = new THREE.Group();
  const handle = mesh(roundedBox(0.018, length, thickness, 0.006, 1), material);
  handle.position.y = length * 0.5;
  group.add(handle);

  const headY = length + 0.018;
  if (open) {
    // C-shaped open jaw, facing up.
    const head = mesh(new THREE.TorusGeometry(0.024, 0.0085, 4, 8, 4.4), material);
    head.rotation.z = -0.7;
    head.position.y = headY;
    group.add(head);
    const jawL = mesh(roundedBox(0.009, 0.025, thickness, 0.003, 1), material);
    jawL.position.set(-0.021, headY + 0.018, 0);
    jawL.rotation.z = 0.28;
    group.add(jawL);
    const jawR = mesh(roundedBox(0.009, 0.025, thickness, 0.003, 1), material);
    jawR.position.set(0.021, headY + 0.018, 0);
    jawR.rotation.z = -0.28;
    group.add(jawR);
  } else {
    const head = mesh(new THREE.TorusGeometry(0.023, 0.008, 4, 8), material);
    head.position.y = headY;
    group.add(head);
  }

  const grip = mesh(roundedBox(0.02, 0.026, thickness * 1.15, 0.006, 1), material);
  grip.position.y = length * 0.13;
  group.add(grip);
  return group;
}

export function rivet(radius = 0.006, material, depthScale = 0.65) {
  const geo = new THREE.SphereGeometry(radius, 4, 3);
  geo.scale(1, 1, depthScale);
  return mesh(geo, material);
}

export function addRivet(parent, x, y, z, material, radius = 0.0055, rotation = null) {
  const r = rivet(radius, material);
  r.position.set(x, y, z);
  if (rotation) r.rotation.set(rotation.x, rotation.y, rotation.z);
  parent.add(r);
  return r;
}

export function starDisc({ radius = 0.02, points = 8, material }) {
  const shape = new THREE.Shape();
  for (let i = 0; i < points * 2; i += 1) {
    const a = (i / (points * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? radius : radius * 0.55;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.004, bevelEnabled: false, curveSegments: 1 });
  geo.center();
  return mesh(geo, material);
}
