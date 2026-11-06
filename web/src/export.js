import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

export async function exportGLBBuffer(root) {
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(root, {
    binary: true,
    onlyVisible: true,
    maxTextureSize: 2048,
  });
  if (!(result instanceof ArrayBuffer)) {
    throw new Error('GLTFExporter did not return a binary buffer');
  }
  return result;
}

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function downloadGLB(root, filename = 'steampunk_dwarf.glb') {
  const buffer = await exportGLBBuffer(root);
  const blob = new Blob([buffer], { type: 'model/gltf-binary' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return buffer;
}
