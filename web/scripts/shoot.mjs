import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const outDir = fileURLToPath(new URL('../screenshots/browser/', import.meta.url));
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 900 },
  deviceScaleFactor: 1,
});

const logs = [];
page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', (error) => logs.push(`[pageerror] ${error.stack || error.message}`));

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ready === true, null, { timeout: 90000 });
await page.waitForTimeout(600);

const stats = await page.evaluate(() => window.__dwarfStats);
console.log('STATS', JSON.stringify(stats));

await page.evaluate(() => window.__hideUI());
for (const view of ['front', 'back', 'left', 'right', 'three-quarter']) {
  await page.evaluate((v) => window.__setView(v, true), view);
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outDir}${view}.png` });
}

await page.evaluate(() => window.__setView('front', true));
await page.evaluate(() => window.__showUI());
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}ui.png` });

console.log('LOGS\n' + logs.join('\n'));
await browser.close();
