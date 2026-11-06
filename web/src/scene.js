import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

function makeFloorTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 80, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, '#ece6db');
  gradient.addColorStop(0.45, '#e3dcd0');
  gradient.addColorStop(1, '#d2cabc');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 5000; i += 1) {
    ctx.globalAlpha = 0.02 + random() * 0.035;
    ctx.fillStyle = random() > 0.5 ? '#ffffff' : '#7d7263';
    ctx.fillRect(random() * size, random() * size, 1 + random() * 2, 1 + random() * 2);
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  return texture;
}

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.97;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e4dfd6');
  scene.fog = new THREE.Fog('#e4dfd6', 5.5, 14);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.42;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.05, 30);
  camera.position.set(0, 0.72, 3.05);

  const target = new THREE.Vector3(0, 0.67, 0);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.rotateSpeed = 0.75;
  controls.zoomSpeed = 0.8;
  controls.panSpeed = 0.6;
  controls.minDistance = 1.25;
  controls.maxDistance = 5.5;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = 1.62;
  controls.enablePan = false;
  controls.update();

  // Lighting: warm key, soft fill, cool rim.
  const hemisphere = new THREE.HemisphereLight('#fff2dc', '#6f5a45', 0.95);
  scene.add(hemisphere);

  const key = new THREE.DirectionalLight('#ffe6c2', 2.45);
  key.position.set(2.4, 4.2, 3.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -1.5;
  key.shadow.camera.right = 1.5;
  key.shadow.camera.top = 2.0;
  key.shadow.camera.bottom = -0.35;
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 12;
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.015;
  key.shadow.radius = 3;
  scene.add(key);

  const fill = new THREE.DirectionalLight('#e3ded2', 0.95);
  fill.position.set(-3.4, 2.0, 2.2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight('#ffd9a8', 1.25);
  rim.position.set(-1.5, 3.0, -3.8);
  scene.add(rim);

  const bounce = new THREE.PointLight('#ffd4a0', 1.0, 4, 2);
  bounce.position.set(0.4, 0.35, 1.8);
  scene.add(bounce);

  // Studio floor, separate from the exported character.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.MeshStandardMaterial({
      map: makeFloorTexture(),
      roughness: 1,
      metalness: 0,
      color: 0xffffff,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.002;
  floor.receiveShadow = true;
  floor.name = 'studio_floor';
  scene.add(floor);

  return { renderer, scene, camera, controls, target };
}
