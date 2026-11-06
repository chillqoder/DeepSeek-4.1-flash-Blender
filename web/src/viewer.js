import * as THREE from 'three';
import { arrayBufferToBase64, downloadGLB, exportGLBBuffer } from './export.js';

const VIEWS = {
  front: { position: [0, 0.72, 3.05], target: [0, 0.67, 0] },
  back: { position: [0, 0.72, -3.05], target: [0, 0.67, 0] },
  left: { position: [-3.05, 0.72, 0], target: [0, 0.67, 0] },
  right: { position: [3.05, 0.72, 0], target: [0, 0.67, 0] },
  'three-quarter': { position: [2.0, 1.02, 2.28], target: [0, 0.66, 0] },
};

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function createViewer({ renderer, scene, camera, controls, root }) {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let tween = null;
  let activeView = 'front';
  let introPlayed = false;

  const buttons = [...document.querySelectorAll('[data-view]')];
  const status = document.getElementById('status');
  const exportButton = document.getElementById('export');
  const collapseButton = document.getElementById('collapse');
  const panel = document.getElementById('ui');
  const loading = document.getElementById('loading');

  function setStatus(text) {
    if (status) status.textContent = text || '';
  }

  function markActive(name) {
    buttons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.view === name);
    });
  }

  function setView(name, immediate = false) {
    const view = VIEWS[name] || VIEWS.front;
    const targetView = name === 'reset' ? VIEWS.front : view;
    const toPos = new THREE.Vector3(...targetView.position);
    const toTarget = new THREE.Vector3(...targetView.target);
    activeView = name === 'reset' ? 'front' : name;
    markActive(activeView);

    if (immediate || reduceMotion) {
      camera.position.copy(toPos);
      controls.target.copy(toTarget);
      camera.lookAt(controls.target);
      controls.update();
      tween = null;
      return;
    }

    tween = {
      fromPos: camera.position.clone(),
      toPos,
      fromTarget: controls.target.clone(),
      toTarget,
      start: performance.now(),
      duration: 750,
    };
  }

  function cancelTween() {
    if (tween) tween = null;
  }

  controls.addEventListener('start', cancelTween);

  buttons.forEach((button) => {
    button.addEventListener('click', () => setView(button.dataset.view));
  });

  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement) return;
    const map = { 1: 'front', 2: 'back', 3: 'left', 4: 'right', 5: 'three-quarter', 0: 'reset' };
    if (map[event.key]) setView(map[event.key]);
    if (event.key.toLowerCase() === 'e') exportButton?.click();
  });

  collapseButton?.addEventListener('click', () => {
    panel.classList.toggle('is-collapsed');
    collapseButton.textContent = panel.classList.contains('is-collapsed') ? '+' : '−';
    collapseButton.title = panel.classList.contains('is-collapsed') ? 'Развернуть панель' : 'Свернуть панель';
  });

  exportButton?.addEventListener('click', async () => {
    try {
      exportButton.disabled = true;
      setStatus('Экспорт GLB…');
      const buffer = await downloadGLB(root);
      const size = (buffer.byteLength / 1024 / 1024).toFixed(2);
      setStatus(`Готово: ${size} МБ · textures embedded`);
    } catch (error) {
      console.error(error);
      setStatus('Ошибка экспорта — см. консоль');
    } finally {
      exportButton.disabled = false;
    }
  });

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', resize);

  function frame(now) {
    if (tween) {
      const t = Math.min(1, (now - tween.start) / tween.duration);
      const e = easeInOutCubic(t);
      camera.position.lerpVectors(tween.fromPos, tween.toPos, e);
      controls.target.lerpVectors(tween.fromTarget, tween.toTarget, e);
      if (t >= 1) tween = null;
    }

    controls.update();
    renderer.render(scene, camera);

    if (!introPlayed) {
      introPlayed = true;
      requestAnimationFrame(() => {
        loading?.classList.add('is-hidden');
        window.__ready = true;
      });
    }
    requestAnimationFrame(frame);
  }

  setView('front', true);
  requestAnimationFrame(frame);

  // Small automation surface for screenshots and the Blender hand-off.
  window.__setView = (name, immediate = true) => setView(name, immediate);
  window.__hideUI = () => {
    panel.style.display = 'none';
  };
  window.__showUI = () => {
    panel.style.display = '';
  };
  window.__exportGLB = async () => {
    const buffer = await exportGLBBuffer(root);
    return { base64: arrayBufferToBase64(buffer), bytes: buffer.byteLength };
  };
  window.__dwarfStats = root.userData;

  return {
    setView,
    get activeView() {
      return activeView;
    },
  };
}
