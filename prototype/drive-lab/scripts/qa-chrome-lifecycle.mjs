/** Rendered regression gate. Uses an explicitly supplied Playwright installation. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { FLUX_THEMES } from '../src/flux-themes.js';
import { contrastRatio, resolveSemanticTheme } from '../src/semantic-theme.js';

export async function auditChrome(page, output) {
  await mkdir(output, { recursive: true });
  const evidence = { viewport: page.viewportSize(), checks: [], palettes: [], geometry: [], console: [] };
  page.on('console', message => { if (['warning', 'error'].includes(message.type())) evidence.console.push({ type: message.type(), text: message.text() }); });
  page.on('pageerror', error => evidence.console.push({ type: 'pageerror', text: error.message }));
  const check = (name) => { evidence.checks.push(name); console.log(`PASS ${name}`); };
  const wake = async () => { await page.mouse.click(350, 400); await page.waitForTimeout(350); };
  const resting = async name => {
    await page.waitForFunction(() => document.querySelector('main.app')?.classList.contains('controls-resting'), { }, { timeout: 1200 });
    await page.waitForTimeout(320);
    const state = await page.evaluate(() => {
      const footer = document.querySelector('.footer-stack');
      const player = document.querySelector('.now-playing-dock');
      return { footerBelow: footer.getBoundingClientRect().top >= innerHeight, inert: footer.inert,
        playerHidden: !player || getComputedStyle(player).visibility === 'hidden' || player.getBoundingClientRect().top >= innerHeight,
        focusSafe: !document.activeElement.closest('.control-layer') };
    });
    assert.ok(Object.values(state).every(Boolean), `${name}: ${JSON.stringify(state)}`); check(name);
  };
  const capture = async name => { await page.waitForTimeout(400); await page.screenshot({ path: `${output}/${name}.png` }); };
  const chooseAppearance = async appearance => {
    await wake(); await page.locator('.appearance-trigger').click();
    await page.getByRole('menuitemradio', { name: appearance.toUpperCase(), exact: true }).click();
    await resting(`appearance ${appearance} retracts`);
  };
  const chooseVisual = async name => {
    await wake(); await page.locator('.environment-control').click();
    await page.locator('.environment-drawer .score-entry').filter({ has: page.locator('strong', { hasText: new RegExp(`^${name}$`, 'i') }) }).click();
    await resting(`visual ${name} retracts`);
  };
  for (const appearance of ['light', 'dark']) {
    await chooseAppearance(appearance);
    for (const theme of FLUX_THEMES) {
      await wake(); await page.locator('.palette-trigger').click();
      const targets = await page.locator('.palette-menu button').evaluateAll(nodes => nodes.map(n => ({ width: n.getBoundingClientRect().width, height: n.getBoundingClientRect().height })));
      assert.ok(targets.every(r => r.width >= 48 && r.height >= 56));
      await page.getByRole('button', { name: `Use the ${theme.label.toLowerCase()} palette`, exact: true }).click();
      await resting(`palette ${theme.id}/${appearance} retracts`);
      const actual = await page.locator('main.app').evaluate(n => Object.fromEntries(['--ui-accent-text','--ui-chart-primary','--ui-chart-secondary','--ui-effect-surface','--ui-effect-text','--ui-selected-accent'].map(key => [key, getComputedStyle(n).getPropertyValue(key).trim()])));
      const expected = resolveSemanticTheme(theme, appearance);
      for (const [key, value] of Object.entries(actual)) assert.equal(value, expected.css[key]);
      const textPairs = await page.locator('.control-label, .control-slab .stop-button > span, .control-slab .effects-button > span, .atlas-drive-summary dt, .atlas-terrain-source > span').evaluateAll(nodes => nodes.map(n => {
        const rgba = value => (value.match(/[0-9.]+/g) || []).map(Number);
        const blend = (front, back) => front.slice(0,3).map((v,i) => v * (front[3] ?? 1) + back[i] * (1 - (front[3] ?? 1)));
        const layers=[];
        for(let parent=n; parent; parent=parent.parentElement) { const colour=rgba(getComputedStyle(parent).backgroundColor); layers.push(colour); if((colour[3] ?? 1) === 1) break; }
        let background=[0,0,0]; for(const layer of layers.reverse()) background=blend(layer,background);
        const foreground=blend(rgba(getComputedStyle(n).color),background);
        const hex=rgb => '#' + rgb.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
        return {text:n.textContent.trim(),foreground:hex(foreground),background:hex(background)};
      }));
      for(const pair of textPairs) { pair.ratio=contrastRatio(pair.foreground,pair.background); assert.ok(pair.ratio>=4.5, `${theme.id}/${appearance} ${JSON.stringify(pair)}`); }
      evidence.palettes.push({ palette: theme.id, appearance, roles: expected.roles, computed: actual, textPairs });
    }
    await wake(); await page.locator('.palette-trigger').click(); await page.getByRole('button', { name: /^Use the acid .*palette$/ }).click();
    await resting('ACID selection before Atlas');
    await chooseVisual('Atlas');
    const handle = page.getByRole('button', { name: 'Open Atlas Drive Lab', exact: true });
    if (await handle.count()) await handle.click();
    await capture(`after-atlas-${appearance}-resting`);
    await wake(); await capture(`after-atlas-${appearance}-awake`);
    const geometry = await page.locator('.topbar .rail-icon').evaluateAll(nodes => nodes.map(n => ({ icon: n.dataset.icon, frame: n.getBoundingClientRect().toJSON(), stroke: getComputedStyle(n.querySelector('path')).strokeWidth, cell: n.closest('button').getBoundingClientRect().toJSON() })));
    assert.equal(geometry.length, 4); assert.ok(geometry.every(g => g.frame.width === 32 && g.frame.height === 32 && g.frame.y === 16 && g.stroke === '2px' && g.cell.height >= 56));
    assert.ok(Math.max(...geometry.map(g => g.cell.width)) - Math.min(...geometry.map(g => g.cell.width)) < 1);
    evidence.geometry.push({ appearance, geometry }); check(`rail geometry ${appearance}`);
    await page.getByRole('button', { name: 'Collapse Atlas Drive Lab', exact: true }).click();
    await resting(`Atlas collapse ${appearance}`); await capture(`after-atlas-${appearance}-collapsed`);
    await wake(); await capture(`after-atlas-${appearance}-collapsed-awake`);
    await page.getByRole('button', { name: 'Open Atlas Drive Lab', exact: true }).click();
    await wake(); await page.getByRole('button', { name: 'Open Discover passenger index', exact: true }).click();
    await page.getByPlaceholder(/search/i).fill('Basilica di San Lorenzo Milano');
    await page.locator('.discover-results > button').first().waitFor({ timeout: 30000 });
    await capture(`after-discover-${appearance}`);
    assert.equal(await page.locator('.now-playing-dock').count(), 0);
    const titles = await page.locator('.discover-results > button strong').evaluateAll(nodes => nodes.map(n => ({ text: n.textContent, whiteSpace: getComputedStyle(n).whiteSpace, lineClamp: getComputedStyle(n).webkitLineClamp, lineHeight: parseFloat(getComputedStyle(n).lineHeight), height: n.getBoundingClientRect().height })));
    assert.ok(titles.every(t => t.whiteSpace === 'normal' && t.lineClamp === '2'));
    assert.ok(titles.some(t => t.height > t.lineHeight * 1.8));
    assert.equal(await page.locator('.discover-results > button > small').count(), 0);
    check(`Discover real names wrap, no numbers or player ${appearance}`);
    await page.getByRole('button', { name: 'CLOSE', exact: true }).click(); await resting(`Discover close ${appearance}`);
  }
  for (const name of ['Aperture','Vertigo','Meridian','Atlas','Drivey','PRTCL','Gradient']) {
    await chooseVisual(name);
    await wake(); await page.locator('.environment-control').click();
    assert.equal(await page.locator('.now-playing-dock').count(), 0);
    await page.getByRole('button', { name: 'Close visual library', exact: true }).click(); await resting(`drawer close on ${name}`);
    await wake();
    const tags = page.locator('.visual-cycle-control button');
    if (await tags.count()) {
      assert.equal(await tags.first().evaluate(n => getComputedStyle(n).borderRadius), '6px');
      await tags.first().click(); await resting(`context action on ${name}`);
    }
  }
  await chooseVisual('Aperture');
  for (const [trigger, close, name] of [
    ['.report-button', '.diagnostic-report-drawer [aria-label="Close session report"]', 'Report'],
    ['.score-control', '.music-library-heading > button', 'Music'],
    ['.mix-button', '.manual-effects-deck header > button:last-child', 'FX'],
    ['.network-state', '.network-popover header > button', 'Network'],
    ['.gps-state', '.gps-help-heading > button', 'GPS'],
  ]) {
    await wake(); await page.locator(trigger).click();
    await page.locator(close).click(); await resting(`${name} close`);
  }
  await wake(); await page.locator('.appearance-trigger').click(); await page.waitForTimeout(6300);
  assert.equal(await page.locator('.appearance-menu').count(), 1);
  assert.ok((await page.locator('main.app').getAttribute('class')).includes('controls-awake'));
  check('open menu survives inactivity'); await page.keyboard.press('Escape'); await resting('menu Escape retracts');
  await wake(); await page.locator('.effects-button').focus(); await page.waitForTimeout(6300); await resting('stale focus cannot pin chrome');
  await wake(); await page.locator('.effects-button').click(); await resting('completed action retracts');
  await wake();
  assert.equal(await page.locator('.footer-stack .now-playing-dock').count(), 1);
  const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, viewport: [innerWidth, innerHeight] }));
  assert.equal(overflow.width, 773); assert.equal(overflow.height, 601); evidence.overflow = overflow; check('no document overflow');
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(1400);
  await resting('motion retracts');
  assert.equal(await page.locator('.topbar-mark').evaluate(n => getComputedStyle(n).visibility), 'hidden');
  await capture('after-moving-speed-only');
  await wake();
  assert.ok((await page.locator('main.app').getAttribute('class')).includes('controls-awake'));
  assert.equal(await page.locator('.footer-stack').evaluate(n => n.inert), false);
  await page.waitForTimeout(700);
  assert.ok((await page.locator('main.app').getAttribute('class')).includes('controls-awake'));
  check('explicit touch wakes usable chrome during changing speed');
  await page.locator('.score-control').click();
  await page.waitForTimeout(6300);
  assert.ok(await page.locator('.music-library-heading > button').isVisible());
  check('Music stays reachable and open while moving');
  await page.locator('.music-library-heading > button').click(); await resting('moving Music close retracts');
  await wake(); await page.waitForTimeout(6300); await resting('moving wake expires after inactivity');
  await wake(); await page.locator('.environment-control').click();
  await page.locator('.environment-drawer .score-entry').filter({ has: page.locator('strong', { hasText: /^Gradient$/i }) }).click();
  await resting('moving visual selection retracts');
  await wake();
  assert.ok((await page.locator('main.app').getAttribute('class')).includes('controls-awake'));
  assert.equal(await page.locator('main.app').getAttribute('data-moving'), 'true');
  check('controls can wake again after moving visual selection');
  await page.keyboard.up('ArrowUp');
  await writeFile(`${output}/browser-evidence.json`, JSON.stringify(evidence, null, 2));
  return evidence;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 773, height: 601 } });
    await page.goto(process.env.SEDICIVALVOLE_QA_URL || 'http://127.0.0.1:5173/?qaMute=1&qaAtlasDemo=1');
    await page.getByRole('button', { name: 'sedicivalvole PLAY THE ROAD', exact: true }).click();
    await page.getByRole('button', { name: 'Mute Visuals only. No music.', exact: true }).click();
    await page.getByRole('button', { name: 'Atlas Live map and drive telemetry', exact: true }).click();
    await page.getByRole('button', { name: /^START/ }).click();
    await page.locator('.atlas-drive-lab-canvas').waitFor();
    await auditChrome(page, process.env.QA_OUTPUT || '/tmp/sedicivalvole-chrome-qa');
  } finally { await browser.close(); }
}
