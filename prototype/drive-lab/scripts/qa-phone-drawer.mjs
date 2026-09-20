/** Real App regression: disclosure/SVG clicks must not become drawer drags. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.SEDICIVALVOLE_QA_URL || 'http://127.0.0.1:5182';
const output = process.env.QA_OUTPUT || 'output/playwright/phone-drawer';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const evidence = { checks: [], pageErrors: [] };
try {
  await mkdir(output, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 773, height: 601 } });
  // Expose capability only; no sensor samples, permission, GPS or wake acquisition.
  await context.addInitScript(() => {
    window.DeviceMotionEvent ??= class extends Event {};
    window.DeviceOrientationEvent ??= class extends Event {};
  });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(base).origin) return route.abort();
    if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 503, json: { error: 'local QA service unavailable' } });
    return route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', error => evidence.pageErrors.push(error.message));
  const check = name => { evidence.checks.push(name); console.log(`PASS ${name}`); };
  await page.goto(`${base}/?motion=phone`);
  await page.getByRole('button', { name: 'ENABLE LOCAL SENSORS', exact: true }).waitFor();
  check('compiled phone entry exposes platform-neutral sensor action');
  await page.goto(base);
  await page.getByRole('button', { name: /START MUSIC/ }).click();
  await page.locator('.motion-button').waitFor({ state: 'attached' });
  const open = async () => {
    await page.keyboard.press('Tab');
    await page.locator('.motion-button').click();
    await page.locator('.motion-dialog').waitFor();
    if (await page.locator('.local-sensors-panel').count()) await page.getByRole('button', { name: 'USE ANOTHER PHONE INSTEAD', exact: true }).click();
    await page.getByRole('button', { name: 'CREATE NEW QR', exact: true }).waitFor();
  };
  const closed = () => page.locator('.motion-dialog').waitFor({ state: 'detached' });
  await open();
  await page.locator('.motion-connection-details summary svg').click();
  await page.getByRole('button', { name: 'USE THIS DEVICE’S SENSORS', exact: true }).waitFor();
  check('pointer click on the disclosure SVG expands details');
  await page.locator('.motion-connection-details summary').focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'USE THIS DEVICE’S SENSORS', exact: true }).waitFor({ state: 'detached' });
  await page.locator('.motion-connection-details summary').click();
  await page.getByRole('button', { name: 'USE THIS DEVICE’S SENSORS', exact: true }).click();
  await page.getByRole('heading', { name: 'Local motion sensors', exact: true }).waitFor();
  check('keyboard disclosure and preserved local-sensor handler work');
  await page.keyboard.press('Escape'); await closed();
  check('Escape closes and restores the previous surface');
  await open();
  await page.locator('.motion-close svg').click(); await closed();
  check('pointer click on the close SVG closes the drawer');
  await open();
  const box = await page.locator('#motion-title').boundingBox();
  await page.mouse.move(box.x + 8, box.y + 10); await page.mouse.down();
  await page.mouse.move(box.x + 180, box.y + 10, { steps: 10 }); await page.mouse.up(); await closed();
  check('non-control drag still dismisses the drawer');
  assert.deepEqual(evidence.pageErrors, []);
} finally {
  await writeFile(`${output}/browser-evidence.json`, JSON.stringify(evidence, null, 2));
  await browser.close();
}
