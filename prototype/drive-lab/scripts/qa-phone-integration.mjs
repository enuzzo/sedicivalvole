// Compiled App + compiled phone + real sensor owner, session, cipher, protocol and PHP.
// Only hardware events/permissions/wake are synthetic. No production test hooks or mail.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';
import { createMotionCipher } from '../src/motion/relay.js';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const project = fileURLToPath(new URL('..', import.meta.url));
const dist = resolve(process.env.SEDICIVALVOLE_QA_DIST || join(project, 'dist/client'));
const output = process.env.QA_OUTPUT || join(tmpdir(), 'sv-phone-integration');
const adaptive = process.env.QA_TRANSPORT === 'auto';
const directory = await mkdtemp(join(tmpdir(), 'sv-phone-integration-pairs-'));
const evidence = { syntheticSensors: true, adaptive, checks: [], pageErrors: [], consoleErrors: [], http: [], wire: [] };
let delay = 0, cipher = null;
const roles = new Map();
// Keep PHP loaded: launching a new interpreter for every exchange would add
// process-start latency unrelated to the deployed endpoint.
const workerScript = "define('SEDICIVALVOLE_MOTION_PAIR_TEST',true); require $argv[1]; while(($line=fgets(STDIN))!==false){echo json_encode(motionPairRequest(json_decode($line,true),$argv[2],time())).\"\\n\";fflush(STDOUT);}";
const worker = spawn('php', ['-r', workerScript, join(project, 'public/api/motion-pair.php'), directory], { stdio: ['pipe', 'pipe', 'ignore'] });
const pending = []; let phpOutput = '';
worker.stdout.on('data', chunk => {
  phpOutput += chunk;
  while (phpOutput.includes('\n')) {
    const end = phpOutput.indexOf('\n'), line = phpOutput.slice(0, end); phpOutput = phpOutput.slice(end + 1);
    pending.shift()?.(JSON.parse(line));
  }
});
const endpoint = body => new Promise(done => { pending.push(done); worker.stdin.write(body + '\n'); });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname === '/api/motion-pair.php' && request.method === 'POST') {
    let body = ''; for await (const chunk of request) body += chunk;
    const started = performance.now(), input = JSON.parse(body), action = input.action;
    if (action === 'exchange' && delay) await new Promise(r => setTimeout(r, delay));
    const [status, payload] = await endpoint(body);
    if (status === 200 && action === 'create') roles.set(payload.token, 'receiver');
    if (status === 200 && action === 'join') roles.set(payload.token, 'phone');
    if (cipher && action === 'exchange' && input.packet && roles.has(input.token)) {
      try {
        const role = roles.get(input.token), decoded = JSON.parse(await cipher.open(input.packet, role));
        // In-memory test timing only: never retain keys, axes or packet bodies.
        if (evidence.wire.length < 3000) evidence.wire.push({ at: Math.round(started), role, request: decoded.request,
          sequence: decoded.sequence, generation: decoded.values?.generation, ageMs: decoded.ageMs,
          acceptedSequence: decoded.context?.acceptedSequence, acceptedGeneration: decoded.context?.acceptedGeneration,
          confirmed: decoded.summary?.receiverConfirmed, sensorState: decoded.summary?.sensorState, tared: decoded.summary?.tared });
      } catch { /* A later QR uses a different in-memory key. */ }
    }
    evidence.http.push({ action, status, at: Math.round(started), durationMs: Math.round(performance.now() - started) });
    response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); response.end(JSON.stringify(payload)); return;
  }
  if (pathname.startsWith('/api/')) { response.writeHead(503, { 'Content-Type': 'application/json' }); response.end('{}'); return; }
  const path = resolve(dist, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!path.startsWith(dist + sep)) { response.writeHead(403); response.end(); return; }
  try { const bytes = await readFile(path); response.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); response.end(bytes); }
  catch { if (!response.headersSent) response.writeHead(404); response.end(); }
});
await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const check = name => { evidence.checks.push(name); console.log(`PASS ${name}`); };
let receiver, phone;

// Run in the phone browser before product code. Invoke only registered platform
// listeners: ZERO, projection, freshness, permissions and teardown remain real.
function hardwareFixture() {
  const listeners = new Map();
  const add = window.addEventListener.bind(window), remove = window.removeEventListener.bind(window);
  window.addEventListener = (name, fn, ...args) => {
    if (['devicemotion', 'deviceorientation'].includes(name)) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); }
    else add(name, fn, ...args);
  };
  window.removeEventListener = (name, fn, ...args) => {
    if (listeners.has(name)) listeners.get(name).delete(fn); else remove(name, fn, ...args);
  };
  window.DeviceMotionEvent = class { static requestPermission() { return Promise.resolve('granted'); } };
  window.DeviceOrientationEvent = class { static requestPermission() { return Promise.resolve('granted'); } };
  let a = [0, 0, 0], rotation = [0, 0, 0], running = true, wake, wakeDenied = false, inclined = false;
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => {
    if (wakeDenied) throw new DOMException('Synthetic denial', 'NotAllowedError');
    wake = new EventTarget(); wake.released = false;
    wake.release = async () => { wake.released = true; wake.dispatchEvent(new Event('release')); };
    return wake;
  } } });
  setInterval(() => {
    if (!running) return;
    const gravity = inclined ? [0, 9.81 / Math.sqrt(2), 9.81 / Math.sqrt(2)] : [0, 0, 9.81];
    listeners.get('deviceorientation')?.forEach(fn => fn({ isTrusted: true, alpha: 0, beta: inclined ? 45 : 0, gamma: 0 }));
    listeners.get('devicemotion')?.forEach(fn => fn({ isTrusted: true, acceleration: { x: a[0], y: a[1], z: a[2] },
      accelerationIncludingGravity: { x: a[0] + gravity[0], y: a[1] + gravity[1], z: a[2] + gravity[2] }, rotationRate: { beta: rotation[0], gamma: rotation[1], alpha: rotation[2] } }));
  }, 20);
  window.motionHardware = {
    set(acceleration, gyro) { a = acceleration; rotation = gyro; },
    incline(value) { inclined = value; },
    pause(value) { running = !value; },
    denyWake(value) { wakeDenied = value; },
    releaseWake() { return wake?.release(); },
    listeners() { return [...listeners].map(([name, set]) => [name, set.size]); },
  };
}

function renderProbe() {
  window.motionRenders = { root: 0, panel: 0, rootMotionUpdates: 0, panelUpdates: 0 };
  let lastRootMotion, lastPanel;
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true, inject() { return 1; }, onCommitFiberUnmount() {},
    onCommitFiberRoot(_id, root) {
      const visit = fiber => {
        if (!fiber) return;
        if (fiber.flags & 1) {
          if (fiber.memoizedProps?.readSnapshot) {
            window.motionRenders.panel++;
            if (fiber.memoizedState?.memoizedState !== lastPanel) { window.motionRenders.panelUpdates++; lastPanel = fiber.memoizedState?.memoizedState; }
          }
          // App has many independent owners; the focused panel has two hooks.
          let hooks = 0, state = fiber.memoizedState, motion;
          if (fiber.tag === 0) while (state && hooks < 500) {
            hooks++;
            if (state.memoizedState?.role === 'receiver' && state.memoizedState?.qrUrl !== undefined) motion = state.memoizedState;
            state = state.next;
          }
          if (hooks >= 60) {
            window.motionRenders.root++;
            if (motion && motion !== lastRootMotion) { window.motionRenders.rootMotionUpdates++; lastRootMotion = motion; }
          }
        }
        visit(fiber.child); visit(fiber.sibling);
      };
      visit(root.current);
    },
  };
}

try {
  await mkdir(output, { recursive: true });
  const receiverContext = await browser.newContext({ viewport: { width: 773, height: 601 }, serviceWorkers: 'block' });
  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  for (const context of [receiverContext, phoneContext]) await context.addInitScript(enabled => {
    if (!enabled) { window.RTCPeerConnection = undefined; return; }
    const NativePeer = window.RTCPeerConnection;
    const fault = window.motionNetwork = { drop: false, peers: 0, closed: 0 };
    window.RTCPeerConnection = class extends NativePeer {
      constructor(...args) {
        super(...args); fault.peers++;
        this.addEventListener('datachannel', event => {
          const channel = event.channel, send = channel.send.bind(channel);
          channel.send = text => { if (!fault.drop) send(text); };
        });
      }
      close() { fault.closed++; return super.close(); }
    };
  }, adaptive);
  await phoneContext.addInitScript(hardwareFixture);
  await receiverContext.addInitScript(renderProbe);
  // Synthetic GPS remains separate from network availability, as satellite fixes
  // can continue through a mobile data outage. It never changes the product owner.
  await receiverContext.addInitScript(() => {
    let paused = false;
    const position = () => ({timestamp: Date.now(), coords: {latitude: 0, longitude: 0, accuracy: 5, speed: 12, heading: 0, altitude: 100, altitudeAccuracy: 5}});
    Object.defineProperty(navigator, 'geolocation', {configurable:true, value: {
      watchPosition(ok) { const tick = () => {if (!paused) ok(position());}; setTimeout(tick,0); return setInterval(tick,500); },
      clearWatch(id) { clearInterval(id); }, getCurrentPosition(ok) { if (!paused) setTimeout(() => ok(position()),0); },
    }});
    window.gpsHardware = {pause(value) {paused=value;}};
  });
  for (const context of [receiverContext, phoneContext]) await context.route('**/*', route => {
    if (new URL(route.request().url()).origin !== base) return route.abort();
    return route.continue();
  });
  receiver = await receiverContext.newPage(); phone = await phoneContext.newPage();
  receiver.setDefaultTimeout(15000); phone.setDefaultTimeout(15000);
  for (const [name, page] of [['receiver', receiver], ['phone', phone]]) {
    page.on('pageerror', error => evidence.pageErrors.push({ name, error: error.message }));
    page.on('console', message => { if (message.type() === 'error') evidence.consoleErrors.push({ name, error: message.text() }); });
  }
  await receiver.goto(base);
  evidence.release = await receiver.locator('meta[name="sedicivalvole-release"]').getAttribute('content');
  await receiver.getByRole('button', { name: /START MUSIC/ }).click();
  await receiver.waitForFunction(() => document.querySelector('.app')?.dataset.phase === 'running' || !document.querySelector('.intro'));
  await receiver.keyboard.press('Tab');
  await receiver.locator('.motion-button').click();
  if (await receiver.locator('.local-sensors-panel').count()) await receiver.getByRole('button', { name: 'USE ANOTHER PHONE INSTEAD', exact: true }).click();
  await receiver.locator('.motion-qr').waitFor();
  // Read exactly the QR input through React props; never replace a session/sample.
  const qr = await receiver.locator('.motion-qr').evaluate(element => {
    let fiber = element[Object.keys(element).find(key => key.startsWith('__reactFiber$'))];
    while (fiber) { if (fiber.memoizedProps?.snapshot?.qrUrl) return fiber.memoizedProps.snapshot.qrUrl; fiber = fiber.return; }
    throw new Error('Rendered QR input not found');
  });
  cipher = await createMotionCipher(new URL(qr).hash.slice(6).split('.')[2], webcrypto);
  await phone.goto(qr);
  await phone.getByRole('button', { name: 'ENABLE LOCAL SENSORS', exact: true }).click();
  await phone.getByRole('button', { name: 'CONNECT TO DISPLAY', exact: true }).click();
  await phone.getByRole('checkbox', { name: /Use aligned car motion/ }).waitFor();
  assert.equal(await phone.getByRole('checkbox', { name: /Use aligned car motion/ }).isChecked(), false);
  await phone.screenshot({ path: join(output, 'phone-position-choice.png') });
  check('Position exposes car-response choice before ZERO without guessing alignment');
  await phone.getByRole('button', { name: 'PHONE IS SECURED', exact: true }).click();
  await receiver.getByText('Set ZERO on your phone.', { exact: true }).waitFor();
  const done = () => receiver.locator('.motion-setup-steps li').evaluateAll(items => items.map(item => item.dataset.done === 'true'));
  assert.deepEqual(await done(), [true, true, true, false, false]);
  delay = 400;
  await receiver.waitForTimeout(500);
  for (let i = 0; i < 10; i++) {
    assert.equal(await receiver.getByText('Set ZERO on your phone.', { exact: true }).count(), 1);
    await receiver.waitForTimeout(50);
  }
  assert.deepEqual(await done(), [true, true, true, false, false]);
  check('timed pre-ZERO delay retains completed actions while current health becomes delayed');
  delay = 0;
  await receiver.getByText('Set ZERO on your phone.', { exact: true }).waitFor();
  await phone.getByRole('button', { name: 'ZERO', exact: true }).click();
  await phone.evaluate(() => motionHardware.denyWake(true));
  await phone.getByRole('button', { name: 'KEEP SCREEN AWAKE', exact: true }).click();
  await phone.getByText(/Screen wake was not granted/).waitFor();
  assert.equal(await phone.getByRole('heading', { name: 'Recent phone motion', exact: true }).count(), 0);
  await phone.evaluate(() => motionHardware.denyWake(false));
  await phone.getByRole('button', { name: 'KEEP SCREEN AWAKE', exact: true }).click();
  await phone.getByRole('heading', { name: 'Recent phone motion', exact: true }).waitFor();
  await phone.locator('.motion-input-health[data-fresh="true"]').waitFor();
  await receiver.getByText('Fresh', { exact: true }).waitFor();
  check('real compiled phone and receiver complete arbitrary-pose ZERO and reciprocal setup');
  if (adaptive) {
    const readState = () => {
      const element = document.querySelector('.motion-panel-content');
      let fiber = element?.[Object.keys(element).find(key => key.startsWith('__reactFiber$'))];
      while (fiber) {
        if (fiber.memoizedProps?.readSnapshot) {
          const s = fiber.memoizedProps.readSnapshot();
          return { transport: s.transport, state: s.state, fresh: s.dataFresh, confirmed: s.receiverConfirmed,
            hasValues: !!s.values, generation: s.values?.generation, sensorState: s.sensorState, complete: s.setupProgress?.complete };
        }
        fiber = fiber.return;
      }
      return null;
    };
    await receiver.waitForFunction(read => {
      const fn = (0, eval)(`(${read})`); return fn()?.transport === 'direct';
    }, readState.toString());
    check('same encrypted HTTPS pairing automatically selects a real native WebRTC data channel');
    await receiver.evaluate(read => {
      const fn = (0, eval)(`(${read})`);
      window.motionContinuity = [];
      window.motionContinuityTimer = setInterval(() => {
        const s = fn();
        if (window.motionContinuity.length < 1600) window.motionContinuity.push({ at: performance.now(), ...s,
          numeric: [...document.querySelectorAll('.motion-live-row strong')].every(e => !e.textContent.includes('—')) });
      }, 50);
    }, readState.toString());
    const observations = [];
    for (let i = 0; i < 120; i++) {
      const [r, p] = await Promise.all([receiver.evaluate(readState), phone.locator('.motion-live-metrics').innerText()]);
      observations.push({ ...r, phoneFresh: p.includes('Fresh') });
      await receiver.waitForTimeout(500);
    }
    evidence.continuity = { samples: observations, observations: 120,
      mutual: observations.filter(s => s.fresh && s.confirmed && s.hasValues && s.phoneFresh).length };
    evidence.continuity.highRate = await receiver.evaluate(() => { clearInterval(motionContinuityTimer); return motionContinuity; });
    evidence.continuity.targetMet = evidence.continuity.mutual >= 114;
    assert.ok(evidence.continuity.targetMet, JSON.stringify({ mutual: evidence.continuity.mutual, target: 114 }));
    assert.ok(evidence.continuity.highRate.filter(s => s.fresh && s.confirmed && s.numeric && s.complete).length / evidence.continuity.highRate.length >= .95);
    check('sixty seconds exceed unchanged 114/120 mutual continuity and 95% at 20 Hz');
    delay = 450; await receiver.waitForTimeout(2500);
    assert.equal((await receiver.evaluate(readState)).transport, 'direct');
    assert.equal((await receiver.evaluate(readState)).confirmed, true);
    check('slow HTTPS requests do not interrupt current direct sensor delivery');
    delay = 0;
    const admissions = evidence.http.filter(r => ['create', 'join', 'delete'].includes(r.action)).length;
    const generation = (await receiver.evaluate(readState)).generation;
    await phone.evaluate(() => { motionNetwork.drop = true; });
    await receiver.waitForFunction(read => { const s = (0, eval)(`(${read})`)(); return s?.transport === 'https' && s.fresh && s.confirmed; }, readState.toString());
    assert.equal((await receiver.evaluate(readState)).generation, generation);
    assert.equal(evidence.http.filter(r => ['create', 'join', 'delete'].includes(r.action)).length, admissions);
    check('one-way direct failure recovers fresh HTTPS readings without a new pairing or ZERO');
    await phone.evaluate(() => { motionNetwork.drop = false; });
    await receiver.waitForFunction(read => { const s = (0, eval)(`(${read})`)(); return s?.transport === 'direct' && s.confirmed; }, readState.toString());
    check('direct path recovers without duplicate owners after one-way loss');
  }
  await phone.evaluate(() => motionHardware.set([0.3, 0.4, 0], [0, 0, 12]));
  await phone.waitForFunction(() => document.querySelector('.motion-live-row strong')?.textContent.includes('+0.5'));
  // This is the prior coverage gap: App's real onChange used to strip values.
  await receiver.waitForFunction(() => document.querySelector('.motion-live-row strong')?.textContent.includes('+0.5'), null, { timeout: 5000 });
  await receiver.waitForFunction(() => document.querySelectorAll('.motion-live-row strong')[1]?.textContent.includes('+12'));
  assert.match(await receiver.locator('.motion-live-row').nth(1).innerText(), /\+12.*°\/s/s);
  await receiver.screenshot({ path: join(output, 'receiver-readings.png') });
  await phone.screenshot({ path: join(output, 'phone-readings.png') });
  check('real session/protocol inputs reach compiled App numbers with m/s² and °/s units');
  await phone.evaluate(() => motionHardware.set([0, 0, 1.25], [0, 0, -8]));
  await receiver.waitForFunction(() => document.querySelector('.motion-live-row strong')?.textContent.includes('+1.3'));
  await receiver.waitForFunction(() => document.querySelectorAll('.motion-live-row strong')[1]?.textContent.includes('-8'));
  check('successive acceleration and signed gyro samples change actual receiver rows');
  const rendersBefore = await receiver.evaluate(() => ({ ...motionRenders }));
  await receiver.waitForTimeout(2000);
  const rendersAfter = await receiver.evaluate(() => ({ ...motionRenders }));
  evidence.renders = { milliseconds: 2000, ...Object.fromEntries(Object.keys(rendersBefore).map(key => [key, rendersAfter[key] - rendersBefore[key]])) };
  assert.ok(evidence.renders.panelUpdates >= 25, JSON.stringify(evidence.renders));
  assert.ok(evidence.renders.rootMotionUpdates <= 3, JSON.stringify(evidence.renders));
  check('20 Hz drawer values leave root motion metadata bounded to one update per second');
  await phone.evaluate(() => motionHardware.releaseWake());
  await phone.getByRole('button', { name: 'KEEP SCREEN AWAKE', exact: true }).waitFor();
  await receiver.getByText('Keep your phone awake.', { exact: true }).waitFor();
  assert.deepEqual(await done(), [true, true, true, true, false]);
  await phone.getByRole('button', { name: 'KEEP SCREEN AWAKE', exact: true }).click();
  await phone.getByRole('heading', { name: 'Recent phone motion', exact: true }).waitFor();
  await phone.locator('.motion-input-health[data-fresh="true"]').waitFor();
  await receiver.getByText('Fresh', { exact: true }).waitFor();
  check('denied/released wake is never completed until a new explicit acquisition');
  await receiver.waitForFunction(() => !document.querySelector('.motion-live-row strong')?.textContent.includes('—'));
  const stableHeight = await receiver.locator('.motion-panel-content').evaluate(e => e.getBoundingClientRect().height);
  if (adaptive) await phone.evaluate(() => { motionNetwork.drop = true; });
  delay = 400;
  await receiver.waitForTimeout(350);
  assert.match(await receiver.locator('.motion-live-metrics').innerText(), /Delayed/);
  assert.doesNotMatch(await receiver.locator('.motion-live-row').first().innerText(), /—/);
  assert.equal(await receiver.getByText('Recent motion · 1 s average · display only', { exact: true }).count(), 1);
  await receiver.waitForTimeout(1100);
  assert.match(await receiver.locator('.motion-live-row').first().innerText(), /—/);
  assert.equal(await receiver.locator('.motion-panel-content').evaluate(e => e.getBoundingClientRect().height), stableHeight);
  check('current input expires at 250 ms; explicitly historical averages clear by one second without panel resizing');
  if (adaptive) await phone.evaluate(() => { motionNetwork.drop = false; });
  delay = 0;
  await receiver.getByText('Fresh', { exact: true }).waitFor();
  const admissionsBefore = evidence.http.filter(r => ['create','join','delete'].includes(r.action)).length;
  const generationBefore = evidence.wire.findLast(r => r.role === 'phone' && r.confirmed)?.generation;
  await receiver.getByRole('button', {name:'CLOSE',exact:true}).click();
  await receiver.locator('.motion-dialog').waitFor({state:'detached'});
  await Promise.all([receiverContext.setOffline(true), phoneContext.setOffline(true)]);
  await receiver.locator('[data-motion-recovery="true"]').waitFor();
  await receiver.waitForFunction(() => document.querySelector('[data-motion-recovery="true"]')?.textContent.includes('using GPS'));
  await phone.getByText('Network unavailable. Pairing kept; recovery is automatic.', {exact:true}).waitFor();
  assert.match(await phone.locator('.motion-live-row').first().innerText(), /—/);
  await receiver.waitForTimeout(30000);
  await receiver.screenshot({path:join(output,'receiver-network-gap.png')});
  await phone.screenshot({path:join(output,'phone-network-gap.png')});
  assert.equal(await phone.getByText('Setup complete',{exact:true}).count(),1);
  assert.equal(await phone.getByRole('button',{name:'ZERO',exact:true}).count(),0);
  assert.equal(await receiver.locator('[data-motion-recovery="true"]').evaluate(e=>getComputedStyle(e).visibility),'visible');
  await receiver.evaluate(() => gpsHardware.pause(true));
  await receiver.waitForFunction(() => document.querySelector('[data-motion-recovery="true"]')?.textContent.includes('waiting for GPS'));
  check('thirty-second real browser outage keeps setup and warns outside drawer; missing GPS is not represented as usable');
  await receiver.evaluate(() => gpsHardware.pause(false));
  await Promise.all([receiverContext.setOffline(false), phoneContext.setOffline(false)]);
  await phone.getByRole('heading',{name:'Recent phone motion',exact:true}).waitFor();
  await phone.locator('.motion-input-health[data-fresh="true"]').waitFor();
  await receiver.locator('[data-motion-recovery="true"]').waitFor({state:'detached'});
  await receiver.keyboard.press('Tab');await receiver.locator('.motion-button').click();
  await receiver.getByText('Fresh',{exact:true}).waitFor();
  await receiver.waitForFunction(() => document.querySelector('.motion-live-row strong')?.textContent.includes('+1.3'));
  assert.equal(evidence.http.filter(r => ['create','join','delete'].includes(r.action)).length,admissionsBefore);
  assert.equal(evidence.wire.findLast(r=>r.role==='phone'&&r.confirmed)?.generation,generationBefore);
  check('fresh reciprocal motion returns automatically with the same pairing and ZERO after network restoration');

  await receiver.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await receiver.locator('.motion-dialog').waitFor({ state: 'detached' });
  await receiver.keyboard.press('Tab'); await receiver.locator('.motion-button').click();
  await receiver.getByText('Fresh', { exact: true }).waitFor();
  await receiver.waitForFunction(() => document.querySelector('.motion-live-row strong')?.textContent.includes('+1.3'));
  check('drawer close and reopen retain session and refresh current readings');
  await receiver.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await receiver.locator('.motion-dialog').waitFor({ state: 'detached' });
  const closedCount = await receiver.evaluate(() => motionRenders.panel);
  await receiver.waitForTimeout(350);
  assert.equal(await receiver.evaluate(() => motionRenders.panel), closedCount);
  await receiver.keyboard.press('Tab'); await receiver.locator('.motion-button').click();
  await receiver.getByText('Fresh', { exact: true }).waitFor();
  check('closing the drawer stops its telemetry rendering');
  for (const appearance of ['dark', 'light']) {
    await receiver.getByRole('button', { name: 'CLOSE', exact: true }).click();
    await receiver.locator('.motion-dialog').waitFor({ state: 'detached' });
    await receiver.keyboard.press('Tab'); await receiver.locator('.appearance-trigger').click();
    // If this first deliberate gesture only woke resting chrome, use its now-visible control.
    if (!await receiver.getByRole('menuitemradio', { name: appearance.toUpperCase(), exact: true }).isVisible()) {
      await receiver.locator('.appearance-trigger').click();
    }
    await receiver.getByRole('menuitemradio', { name: appearance.toUpperCase(), exact: true }).click();
    await receiver.keyboard.press('Tab'); await receiver.locator('.motion-button').click();
    await receiver.getByText('Fresh', { exact: true }).waitFor();
    await phone.locator(`.motion-phone[data-appearance="${appearance}"]`).waitFor();
    await receiver.screenshot({ path: join(output, `receiver-${appearance}.png`) });
    for (const [width, height] of [[390, 844], [320, 568], [760, 390]]) {
      await phone.setViewportSize({ width, height });
      assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.equal(await phone.evaluate(() => { const stage=document.querySelector('.motion-guided-stage'), details=document.querySelector('.motion-extra-details'), toggle=document.querySelector('.motion-detail-toggle'); return stage.getBoundingClientRect().bottom >= toggle.getBoundingClientRect().bottom - 1 && (!details || details.getBoundingClientRect().top >= stage.getBoundingClientRect().bottom - 1); }), true, 'phone details never overlap the main controls');
      await phone.screenshot({ path: join(output, `phone-${width}-${appearance}.png`) });
    }
  }
  await phone.setViewportSize({ width: 390, height: 844 });
  check('real paired LIGHT/DARK presentation preserves readings across compact portrait and landscape sizes');
  await phone.evaluate(() => motionHardware.pause(true));
  await receiver.getByText('Enable sensors on your phone.', { exact: true }).waitFor();
  await phone.evaluate(() => { motionHardware.set([0, 0, 0], [0, 0, 0]); motionHardware.pause(false); });
  await receiver.getByText('Set ZERO on your phone.', { exact: true }).waitFor();
  const ring = phone.locator('.motion-setup-steps [data-active="true"][data-done="false"] .motion-step-number');
  assert.equal(await ring.evaluate(element => getComputedStyle(element, '::after').animationDuration), '2.4s');
  await phone.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await ring.evaluate(element => getComputedStyle(element, '::after').animationName), 'none');
  check('approved active ring retains its 2.4-second pulse and reduced-motion static state');
  await phone.getByRole('button', { name: 'ZERO', exact: true }).click();
  await phone.getByRole('heading', { name: 'Recent phone motion', exact: true }).waitFor();
  await phone.locator('.motion-input-health[data-fresh="true"]').waitFor();
  await receiver.getByText('Fresh', { exact: true }).waitFor();
  check('sensor gaps invalidate ZERO; a new generation and reciprocal receipts restore readings');
  assert.match(await receiver.locator('.motion-setup-intro').innerText(), /Phone connected · car motion off/);
  await receiver.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await receiver.locator('.motion-dialog').waitFor({ state: 'detached' });
  await receiver.keyboard.press('Tab');
  const navbar = receiver.locator('.motion-button');
  await receiver.locator('.motion-button[data-motion-state="paired"]').waitFor();
  const cellSize = await navbar.evaluate(e => ({ width:e.getBoundingClientRect().width, height:e.getBoundingClientRect().height }));
  assert.equal((await navbar.innerText()).trim(), '', 'the phone cell uses an icon, never a subtitle');
  assert.equal(await navbar.getAttribute('data-connected'), 'true');
  await receiver.waitForFunction(() => document.querySelector('.motion-button').getBoundingClientRect().top >= 0 && Number(getComputedStyle(document.querySelector('.topbar')).opacity) > .99 && Number(getComputedStyle(document.querySelector('.motion-button')).opacity) > .99);
  await receiver.screenshot({ path:join(output,'navbar-paired.png') });
  check('paired phone has a checked icon without a subtitle and immediate road-use status in the drawer');
  await phone.evaluate(() => motionHardware.incline(true));
  await phone.getByRole('button', { name:'CHANGE CAR MOTION', exact:true }).click();
  await phone.getByRole('checkbox', { name:/Use aligned car motion/ }).click();
  // Enabling car axes invalidates ZERO and unmounts this live-only checkbox.
  await phone.getByRole('button', { name:'ZERO', exact:true }).waitFor();
  await phone.getByRole('button', { name:'ZERO', exact:true }).click();
  await phone.locator('.motion-input-health[data-fresh="true"]').waitFor();
  await receiver.locator('.motion-button[data-motion-state="active"]').waitFor();
  await receiver.keyboard.press('Tab');
  assert.equal(await navbar.locator('ellipse').count(),1);
  assert.deepEqual(await navbar.evaluate(e => ({ width:e.getBoundingClientRect().width, height:e.getBoundingClientRect().height })),cellSize);
  await receiver.screenshot({ path:join(output,'navbar-sensors.png') });
  await navbar.click();
  await receiver.getByText('Phone sensors active · GPS speed', {exact:true}).waitFor();
  await phone.evaluate(() => motionHardware.set([0, -Math.SQRT2, Math.SQRT2], [0, -12 / Math.SQRT2, -12 / Math.SQRT2]));
  await receiver.waitForFunction(() => document.querySelector('.motion-live-row strong')?.textContent.includes('-2.0'));
  await receiver.waitForFunction(() => document.querySelectorAll('.motion-live-row strong')[1]?.textContent.includes('-12'));
  assert.match(await receiver.locator('.motion-live-row').first().innerText(), /deceleration/);
  await receiver.screenshot({ path:join(output,'drawer-sensors.png') });
  await phone.screenshot({ path:join(output,'phone-deceleration.png') });
  await phone.evaluate(() => motionHardware.set([0, 0, 0], [0, 0, 0]));
  check('calibrated phone braking stays signed and car yaw reaches the real receiver');
  await receiver.getByRole('button', { name:'CLOSE',exact:true }).click();
  await receiver.keyboard.press('Tab');
  check('real optional aligned ZERO selects the gyroscope icon with current sensor input and unchanged navbar geometry');
  await receiver.locator('.source-readout').click();
  await receiver.locator('.motion-button[data-motion-state="demo"]').waitFor();
  assert.equal(await navbar.getAttribute('data-connected'),'true');
  assert.match(await navbar.getAttribute('aria-label'),/phone excluded/);
  await receiver.keyboard.press('Tab'); await receiver.locator('.source-readout').click();
  await receiver.locator('.motion-button[data-motion-state="active"]').waitFor();
  await receiver.evaluate(() => gpsHardware.pause(true));
  await receiver.locator('.motion-button[data-motion-state="paired"]').waitFor();
  assert.match(await navbar.getAttribute('aria-label'),/waiting for fresh speed/);
  await receiver.evaluate(() => gpsHardware.pause(false));
  await receiver.locator('.motion-button[data-motion-state="active"]').waitFor();
  check('Demo and lost GPS remove the active-sensor claim without losing the pairing indicator');
  for (const appearance of ['dark','light']) {
    await receiver.keyboard.press('Tab'); await receiver.locator('.appearance-trigger').click();
    if (!await receiver.getByRole('menuitemradio',{name:appearance.toUpperCase(),exact:true}).isVisible()) await receiver.locator('.appearance-trigger').click();
    await receiver.getByRole('menuitemradio',{name:appearance.toUpperCase(),exact:true}).click();
    for (const [width,height] of [[773,601],[760,390]]) {
      await receiver.setViewportSize({width,height}); await receiver.keyboard.press('Tab');
      const geometry=await navbar.evaluate(e=>{const b=e.getBoundingClientRect(),s=e.querySelector('svg').getBoundingClientRect();return {button:[b.width,b.height],svg:[s.width,s.height],inside:s.left>=b.left&&s.right<=b.right&&s.top>=b.top&&s.bottom<=b.bottom};});
      assert.ok(geometry.inside); assert.deepEqual(geometry.svg,[28,28]); assert.ok(geometry.button.every(n=>n>=48));
      await receiver.screenshot({path:join(output,`navbar-${width}-${appearance}.png`)});
    }
    await receiver.setViewportSize({width:773,height:601});
  }
  check('icon-only navbar preserves shared 28px glyphs and touch targets in both appearances and compact landscape');
  await receiver.keyboard.press('Tab'); await navbar.click();
  await receiver.getByText('Phone sensors active · GPS speed', {exact:true}).waitFor();
  await phone.getByRole('button', { name: 'STOP', exact: true }).click();
  await receiver.getByText('Connection ended', { exact: true }).waitFor();
  await receiver.locator('.motion-button[data-motion-state="gps"]').waitFor({state:'attached'});
  assert.equal(await navbar.getAttribute('data-connected'),'false');
  assert.equal((await phone.evaluate(() => motionHardware.listeners())).find(([name]) => name === 'devicemotion')[1], 0);
  check('STOP clears readiness and removes the sensor listener');
  await receiver.getByRole('button', { name:'CLOSE',exact:true }).click();
  await receiver.locator('.motion-dialog').waitFor({state:'detached'});
  await receiver.keyboard.press('Tab');
  await receiver.waitForFunction(() => document.querySelector('.motion-button').getBoundingClientRect().top >= 0 && Number(getComputedStyle(document.querySelector('.topbar')).opacity) > .99 && Number(getComputedStyle(document.querySelector('.motion-button')).opacity) > .99);
  await receiver.screenshot({path:join(output,'navbar-gps.png')});
  await navbar.click();
  await receiver.locator('.motion-qr').waitFor();
  assert.equal(await receiver.locator('.motion-live-readings').count(), 0);
  assert.deepEqual(await done(), [false, false, false, false, false]);
  check('new QR clears old progress, readings and readiness');
  assert.ok(evidence.wire.some(packet => packet.confirmed && Number.isSafeInteger(packet.generation)));
  assert.ok(evidence.wire.some(packet => Number.isSafeInteger(packet.acceptedSequence) && Number.isSafeInteger(packet.acceptedGeneration)));
  assert.deepEqual(evidence.pageErrors, []);
} catch (error) {
  console.error(error);
  for (const [name, page] of [['receiver', receiver], ['phone', phone]]) if (page) {
    await page.screenshot({ path: join(output, `${name}-failure.png`) });
    await writeFile(join(output, `${name}-failure.txt`), await page.locator('body').innerText());
  }
  throw error;
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise(r => server.close(r));
  worker.stdin.end();
  await rm(directory, { recursive: true, force: true });
  await writeFile(join(output, 'evidence.json'), JSON.stringify(evidence, null, 2));
}
