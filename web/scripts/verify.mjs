import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const browser = await chromium.launch();
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage({ viewport: { width: 1200, height: 900 } });

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ready === true, null, { timeout: 90000 });
await page.waitForTimeout(500);

const stats = await page.evaluate(() => window.__dwarfStats);
console.log('STATS', JSON.stringify(stats));

const round = (v) => v.map((n) => +n.toFixed(3));
const views = {};
for (const name of ['front', 'back', 'left', 'right', 'three-quarter']) {
  await page.click(`[data-view="${name}"]`);
  await page.waitForTimeout(950);
  views[name] = {
    camera: round(await page.evaluate(() => window.__camera.position.toArray())),
    active: await page.evaluate(() => document.querySelector('.views .is-active')?.dataset.view),
  };
}
console.log('VIEWS', JSON.stringify(views, null, 2));

await page.click('[data-view="reset"]');
await page.waitForTimeout(950);
console.log('RESET_ACTIVE', await page.evaluate(() => document.querySelector('.views .is-active')?.dataset.view));

// OrbitControls drag.
const before = await page.evaluate(() => window.__camera.position.toArray());
await page.mouse.move(700, 500);
await page.mouse.down();
await page.mouse.move(820, 540, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(500);
const after = await page.evaluate(() => window.__camera.position.toArray());
console.log('ORBIT_CHANGED', round(before), '->', round(after));

// Zoom.
const distBefore = await page.evaluate(() => window.__camera.position.length());
await page.mouse.move(700, 500);
await page.mouse.wheel(0, -320);
await page.waitForTimeout(700);
const distAfter = await page.evaluate(() => window.__camera.position.length());
console.log('ZOOM_DISTANCE', +distBefore.toFixed(3), '->', +distAfter.toFixed(3));

// Download button.
await page.evaluate(() => window.__setView('front', true));
await page.waitForTimeout(400);
const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
await page.click('#export');
const download = await downloadPromise;
const downloadPath = await download.path();
const downloaded = downloadPath ? await fs.stat(downloadPath) : null;
console.log('DOWNLOAD', download.suggestedFilename(), downloaded?.size);
await page.waitForTimeout(500);
console.log('STATUS_TEXT', await page.locator('#status').innerText());

console.log('ERRORS', errors);
await page.screenshot({ path: root + 'screenshots/browser/ui_verified.png' });
await browser.close();
