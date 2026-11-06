import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const browser = await chromium.launch();
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage({ viewport: { width: 1200, height: 900 } });

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ready === true, null, { timeout: 90000 });

const stats = await page.evaluate(() => window.__dwarfStats);
console.log('STATS', JSON.stringify(stats));

const result = await page.evaluate(() => window.__exportGLB());
const buffer = Buffer.from(result.base64, 'base64');
const file = path.join(root, 'steampunk_dwarf.glb');
await fs.writeFile(file, buffer);

const header = buffer.subarray(0, 12).toString('utf8');
console.log('GLB', file, buffer.byteLength, 'bytes', 'header:', JSON.stringify(header), 'reported:', result.bytes);

// Download button smoke test (fresh export through the UI path).
const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
await page.click('#export');
const download = await downloadPromise;
const downloadPath = await download.path();
const downloadStat = downloadPath ? await fs.stat(downloadPath) : null;
console.log('DOWNLOAD_BUTTON', download.suggestedFilename(), downloadStat?.size);

console.log('ERRORS', errors);
await browser.close();
