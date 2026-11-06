import * as THREE from 'three';

/* ---------------------------------------------------------------------------
   Procedural painted textures. Everything is generated on a canvas so the full
   character (geometry + textures) can be exported as a single self-contained
   GLB. The look targets a hand-painted, early-2000s low-poly RPG.
--------------------------------------------------------------------------- */

function rng(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function toTexture(canvas, { repeat = [1, 1], clamp = false, srgb = true } = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  texture.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = 4;
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function fill(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function blotches(ctx, random, colors, count, minR, maxR, alpha) {
  const { width, height } = ctx.canvas;
  for (let i = 0; i < count; i += 1) {
    const x = random() * width;
    const y = random() * height;
    const r = minR + random() * (maxR - minR);
    const color = colors[(random() * colors.length) | 0];
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = alpha * (0.4 + random() * 0.6);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function grain(ctx, random, count, colors, alpha = 0.1, size = 1.4) {
  const { width, height } = ctx.canvas;
  for (let i = 0; i < count; i += 1) {
    ctx.globalAlpha = alpha * (0.25 + random() * 0.75);
    ctx.fillStyle = colors[(random() * colors.length) | 0];
    const s = size * (0.4 + random() * 1.4);
    ctx.fillRect(random() * width, random() * height, s, s);
  }
  ctx.globalAlpha = 1;
}

function leatherTexture({ base, dark, light, seed, repeat = [2, 2] }) {
  const size = 512;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = rng(seed);
  fill(ctx, base);

  // Soft uneven tanning and wear.
  blotches(ctx, random, [dark, light, 'rgba(255,225,180,0.55)'], 30, 24, 140, 0.16);
  blotches(ctx, random, [dark], 18, 8, 50, 0.14);

  // Leather grain.
  grain(ctx, random, 22000, [dark, light, 'rgba(0,0,0,0.5)'], 0.13, 1.2);

  // Creases and scratches.
  ctx.lineCap = 'round';
  for (let i = 0; i < 54; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const len = 12 + random() * 90;
    const angle = random() * Math.PI * 2;
    ctx.strokeStyle = random() > 0.45 ? light : dark;
    ctx.globalAlpha = 0.16 + random() * 0.26;
    ctx.lineWidth = 0.8 + random() * 1.9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(angle) * len * 0.5 + (random() - 0.5) * 14,
      y + Math.sin(angle) * len * 0.5 + (random() - 0.5) * 14,
      x + Math.cos(angle) * len,
      y + Math.sin(angle) * len,
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  return toTexture(canvas, { repeat });
}

function clothTexture({ base, dark, light, seed, repeat = [2.5, 2.5], patches = false }) {
  const size = 512;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = rng(seed);
  fill(ctx, base);

  // Woven cross-hatch.
  ctx.globalAlpha = 0.075;
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 3) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }
  ctx.strokeStyle = light;
  for (let i = 1.5; i < size; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  blotches(ctx, random, [dark, light, 'rgba(80,52,25,0.5)'], 24, 20, 120, 0.1);
  grain(ctx, random, 16000, [dark, light], 0.12, 1.2);

  if (patches) {
    for (let i = 0; i < 6; i += 1) {
      const w = 36 + random() * 80;
      const h = 30 + random() * 60;
      const x = random() * (size - w);
      const y = random() * (size - h);
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = random() > 0.5 ? dark : light;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 0.32;
      ctx.strokeStyle = dark;
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = 1;
  }

  // Broad fold shading.
  for (let i = 0; i < 9; i += 1) {
    const x = random() * size;
    const w = 20 + random() * 60;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.45, 'rgba(0,0,0,0.13)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, w, size);
  }

  return toTexture(canvas, { repeat });
}

function skinTexture() {
  const size = 512;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = rng(9127);
  fill(ctx, '#b07c58');

  blotches(ctx, random, ['#9c5f42', '#c99772', '#aa6d4b', '#d3a17d'], 50, 12, 80, 0.12);
  blotches(ctx, random, ['#9e5d40'], 30, 6, 30, 0.1);
  grain(ctx, random, 24000, ['#9d6042', '#d9a47d', '#8d5439'], 0.09, 1.1);

  // Freckles / sun spots.
  for (let i = 0; i < 220; i += 1) {
    ctx.globalAlpha = 0.06 + random() * 0.12;
    ctx.fillStyle = random() > 0.5 ? '#7e4b31' : '#e3b18c';
    ctx.beginPath();
    ctx.arc(random() * size, random() * size, 0.4 + random() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  return toTexture(canvas, { repeat: [1.4, 1.4] });
}

function beardTexture() {
  const size = 512;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = rng(4471);
  fill(ctx, '#8a3714');

  // Long vertical wavy hair strands.
  ctx.lineCap = 'round';
  const colors = ['#6f2a0d', '#b9571f', '#c86b2b', '#d47f3b', '#853311', '#aa4718'];
  for (let i = 0; i < 130; i += 1) {
    const x = random() * size;
    const w = 2 + random() * 8;
    const amp = 3 + random() * 18;
    const phase = random() * Math.PI * 2;
    ctx.strokeStyle = colors[(random() * colors.length) | 0];
    ctx.globalAlpha = 0.18 + random() * 0.35;
    ctx.lineWidth = w;
    ctx.beginPath();
    for (let y = -20; y <= size + 20; y += 16) {
      const xx = x + Math.sin(y * 0.018 + phase) * amp;
      if (y === -20) ctx.moveTo(xx, y);
      else ctx.lineTo(xx, y);
    }
    ctx.stroke();
  }

  // Deep separations.
  for (let i = 0; i < 30; i += 1) {
    const x = random() * size;
    ctx.strokeStyle = '#551d08';
    ctx.globalAlpha = 0.2 + random() * 0.25;
    ctx.lineWidth = 1 + random() * 2;
    ctx.beginPath();
    ctx.moveTo(x, -10);
    ctx.quadraticCurveTo(x + (random() - 0.5) * 35, size * 0.5, x + (random() - 0.5) * 50, size + 10);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  return toTexture(canvas, { repeat: [1, 1.3] });
}

function brassTexture() {
  const size = 256;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = rng(18);
  fill(ctx, '#856426');

  blotches(ctx, random, ['#6f4f1c', '#d6b062', '#8a6526', '#c9a253'], 45, 5, 55, 0.22);
  grain(ctx, random, 9000, ['#5e4316', '#e2c27a', '#b18a3f'], 0.13, 1.1);

  // Verdigris / patina flecks.
  for (let i = 0; i < 110; i += 1) {
    ctx.globalAlpha = 0.05 + random() * 0.14;
    ctx.fillStyle = random() > 0.55 ? '#4c6d5c' : '#6d4a1a';
    ctx.beginPath();
    ctx.arc(random() * size, random() * size, 0.5 + random() * 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Fine scratches catch the light.
  for (let i = 0; i < 40; i += 1) {
    ctx.strokeStyle = random() > 0.5 ? '#f1d58d' : '#5a4016';
    ctx.globalAlpha = 0.12 + random() * 0.2;
    ctx.lineWidth = 0.5 + random() * 0.8;
    const x = random() * size;
    const y = random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (random() - 0.5) * 50, y + (random() - 0.5) * 12);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  return toTexture(canvas, { repeat: [1.6, 1.6] });
}

function steelTexture() {
  const size = 256;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = rng(812);
  fill(ctx, '#8b8f90');

  // Brushed metal.
  for (let i = 0; i < 380; i += 1) {
    ctx.strokeStyle = random() > 0.5 ? '#b9bcbc' : '#63696a';
    ctx.globalAlpha = 0.06 + random() * 0.14;
    ctx.lineWidth = 0.5 + random() * 1.2;
    const y = random() * size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (random() - 0.5) * 3);
    ctx.stroke();
  }
  blotches(ctx, random, ['#4f5557', '#c9cccc'], 24, 4, 45, 0.16);
  grain(ctx, random, 6000, ['#4f5557', '#c9cccc'], 0.1, 1);
  ctx.globalAlpha = 1;

  return toTexture(canvas, { repeat: [1.3, 1.3] });
}

function lensTexture() {
  const size = 256;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = rng(701);
  const g = ctx.createRadialGradient(size * 0.38, size * 0.34, 8, size * 0.5, size * 0.5, size * 0.62);
  g.addColorStop(0, '#8d999b');
  g.addColorStop(0.32, '#5b686c');
  g.addColorStop(0.7, '#384347');
  g.addColorStop(1, '#1b2226');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // Painted diagonal highlights, like the reference.
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(-0.7);
  const h = ctx.createLinearGradient(-110, 0, 110, 0);
  h.addColorStop(0, 'rgba(255,255,255,0)');
  h.addColorStop(0.48, 'rgba(235,242,240,0.24)');
  h.addColorStop(0.56, 'rgba(255,255,255,0.36)');
  h.addColorStop(0.64, 'rgba(255,255,255,0)');
  ctx.fillStyle = h;
  ctx.fillRect(-120, -5, 240, 22);
  ctx.restore();

  for (let i = 0; i < 26; i += 1) {
    ctx.globalAlpha = 0.03 + random() * 0.06;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(random() * size, random() * size, 0.6 + random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  return toTexture(canvas, { clamp: true });
}

function watchFaceTexture() {
  const size = 256;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = rng(177);
  fill(ctx, '#d8cba9');

  const r = size * 0.46;
  const c = size / 2;
  const grad = ctx.createRadialGradient(c - 20, c - 25, 8, c, c, r);
  grad.addColorStop(0, '#efe6cc');
  grad.addColorStop(0.7, '#d8c8a3');
  grad.addColorStop(1, '#b39d73');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.fill();

  // Age spots.
  for (let i = 0; i < 26; i += 1) {
    ctx.globalAlpha = 0.04 + random() * 0.07;
    ctx.fillStyle = '#7d6338';
    ctx.beginPath();
    ctx.arc(c + (random() - 0.5) * r * 1.6, c + (random() - 0.5) * r * 1.6, 1 + random() * 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = '#4a3b25';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(c, c, r - 3, 0, Math.PI * 2);
  ctx.stroke();

  // Minute ticks.
  for (let i = 0; i < 60; i += 1) {
    const a = (i / 60) * Math.PI * 2;
    const inner = i % 5 === 0 ? r - 18 : r - 11;
    ctx.strokeStyle = '#4a3b25';
    ctx.lineWidth = i % 5 === 0 ? 3 : 1.2;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * inner, c + Math.sin(a) * inner);
    ctx.lineTo(c + Math.cos(a) * (r - 5), c + Math.sin(a) * (r - 5));
    ctx.stroke();
  }

  // Roman-ish numerals painted as simple hand-lettered marks.
  ctx.fillStyle = '#44351f';
  ctx.font = '600 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const numerals = ['XII', 'III', 'VI', 'IX'];
  numerals.forEach((n, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 2;
    ctx.save();
    ctx.translate(c + Math.cos(a) * r * 0.68, c + Math.sin(a) * r * 0.68);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(n, 0, 0);
    ctx.restore();
  });

  return toTexture(canvas, { clamp: true });
}

function irisTexture() {
  const size = 128;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = rng(615);
  fill(ctx, '#5b4a2c');

  const c = size / 2;
  const grad = ctx.createRadialGradient(c, c, 4, c, c, c);
  grad.addColorStop(0, '#3a2b14');
  grad.addColorStop(0.45, '#75612f');
  grad.addColorStop(0.85, '#4d3b1c');
  grad.addColorStop(1, '#241b0e');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c, c, c, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 70; i += 1) {
    const a = random() * Math.PI * 2;
    const len = c * (0.2 + random() * 0.72);
    ctx.strokeStyle = random() > 0.45 ? '#a08a4c' : '#33240f';
    ctx.lineWidth = 0.5 + random() * 1.2;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * 5, c + Math.sin(a) * 5);
    ctx.lineTo(c + Math.cos(a) * len, c + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  return toTexture(canvas, { clamp: true });
}

function soleTexture() {
  const size = 256;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = rng(66);
  fill(ctx, '#2b241c');
  for (let i = 0; i < 16; i += 1) {
    ctx.fillStyle = i % 2 ? '#221c15' : '#332b21';
    ctx.globalAlpha = 0.6;
    ctx.fillRect(0, i * 18, size, 9);
  }
  ctx.globalAlpha = 1;
  grain(ctx, random, 5000, ['#17120d', '#4d4133'], 0.14, 1.6);
  blotches(ctx, random, ['#5d5040', '#14100c'], 20, 10, 50, 0.18);
  return toTexture(canvas, { repeat: [1, 2] });
}

export function createTextures() {
  return {
    leatherDark: leatherTexture({ base: '#4a2c16', dark: '#2f1909', light: '#6b4526', seed: 22 }),
    leatherMid: leatherTexture({ base: '#54331c', dark: '#36200f', light: '#794f2c', seed: 73 }),
    leatherLight: leatherTexture({ base: '#6a4728', dark: '#462b13', light: '#94683d', seed: 114 }),
    leatherBoot: leatherTexture({ base: '#392513', dark: '#221408', light: '#573a1f', seed: 214 }),
    vestLeather: leatherTexture({ base: '#472a14', dark: '#2b1707', light: '#6a4325', seed: 918 }),
    hatLeather: leatherTexture({ base: '#624020', dark: '#40270f', light: '#8a5b30', seed: 317 }),
    shirt: clothTexture({ base: '#998d76', dark: '#746850', light: '#b3a78f', seed: 55, repeat: [2, 2] }),
    pants: clothTexture({ base: '#5e4124', dark: '#432b15', light: '#7a5a35', seed: 66, repeat: [2, 2], patches: true }),
    skin: skinTexture(),
    beard: beardTexture(),
    brass: brassTexture(),
    steel: steelTexture(),
    lens: lensTexture(),
    watchFace: watchFaceTexture(),
    iris: irisTexture(),
    sole: soleTexture(),
  };
}
