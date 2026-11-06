import './style.css';
import { createScene } from './scene.js';
import { createDwarf } from './character/index.js';
import { createViewer } from './viewer.js';

const canvas = document.getElementById('viewport');
const context = createScene(canvas);
const dwarf = createDwarf();
context.scene.add(dwarf.root);
context.scene.userData.character = dwarf.root;
window.__dwarfRoot = dwarf.root;
window.__scene = context.scene;
window.__camera = context.camera;
window.__renderer = context.renderer;

createViewer({ ...context, root: dwarf.root });

console.info(
  `Steampunk Dwarf: ${dwarf.triangles} triangles · height ${dwarf.root.userData.height} m · arm span ${dwarf.root.userData.width} m`,
);
