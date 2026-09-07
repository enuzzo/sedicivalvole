import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { audioWorklet } from './vite-audio-worklet.mjs';

// Replays the production Engine runtime, motion receiver, assets and audio graph.
// No project .env, profile constant, source recording or DSP is copied into QA.
const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const [key, ...rest] = value.replace(/^--/, '').split('=');
  return [key, rest.length ? rest.join('=') : true];
}));
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(args.output || process.env.QA_OUTPUT || '/tmp/sv-engine-campaign');
const label = String(args.label || 'current');
assert.match(label, /^[a-z0-9_-]+$/i);
const source = path.resolve(args.source || path.join(project, 'src/engine'));
const profiles = String(args.profiles || 'mono').split(',');
const rates = String(args.rates || '44100,48000').split(',').map(Number);
assert.ok(rates.every(rate => rate === 44100 || rate === 48000));
const target = path.join(output, label);
await fs.mkdir(target, { recursive: true });
const snapshotPath = path.join(target, 'source/engine');
assert.notEqual(path.resolve(source), path.resolve(snapshotPath), 'Use an independent source directory for a fresh run');
await fs.rm(snapshotPath, { recursive: true, force: true });
await fs.cp(source, snapshotPath, { recursive: true, force: true });
// macOS maps /tmp to /private/tmp; Vite's transformed-file allow list must use
// the same canonical path as its resolver or it serves raw TypeScript.
const snapshot = await fs.realpath(snapshotPath);
async function inventory(folder, prefix = '') {
  const rows = [];
  for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) rows.push(...await inventory(path.join(folder, entry.name), relative));
    else rows.push({ path: relative, sha256: createHash('sha256').update(await fs.readFile(path.join(folder, entry.name))).digest('hex') });
  }
  return rows.sort((a, b) => a.path.localeCompare(b.path));
}
const sources = await inventory(snapshot);
await fs.writeFile(path.join(target, 'source-inventory.json'), JSON.stringify(sources, null, 2) + '\n');
const server = await createServer({
  configFile: false, envFile: false, root: path.dirname(snapshot),
  cacheDir: path.join(target, 'vite-cache'), publicDir: path.join(project, 'public'),
  appType: 'custom', logLevel: 'error', plugins: [audioWorklet()],
  server: { host: '127.0.0.1', port: 0, strictPort: false, fs: { allow: [path.dirname(snapshot), project] } },
});
server.middlewares.use((request, response, next) => {
  if (request.url !== '/') return next();
  response.setHeader('Content-Type', 'text/html');
  response.end('<!doctype html><title>Engine campaign audio QA</title><main>Production Engine audio replay</main>');
});
await server.listen();
const port = server.httpServer.address().port;
const url = `http://127.0.0.1:${port}/`;
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.CHROME_EXECUTABLE || undefined, args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
const report = { label, generatedAt: new Date().toISOString(), source, sources, browser: browser.version(),
  browserPath: 'Browser plugin not available; isolated Playwright Chromium',
  methodology: 'Production runtime and motion receiver, actual dry graph, seeded gesture randomness. Offline rendering is suspended at audio quantum boundaries for each 25 ms control tick; the context facade reports running while rendering is paused for scheduling. All sample decoding and AudioWorklet DSP use the browser. Cost is measured wall-clock control and offline render work, not target-vehicle CPU utilization.',
  emailIntercepted: [], errors: [], renders: [] };
try {
  for (const profile of profiles) for (const sampleRate of rates) {
    const page = await browser.newPage({ viewport: { width: 773, height: 601 } });
    page.on('pageerror', error => report.errors.push(error.message));
    await page.route('**/api/send-diagnostic.php', route => { report.emailIntercepted.push('send-diagnostic.php'); return route.abort(); });
    await page.route('**/api/session-report.php', route => { report.emailIntercepted.push('session-report.php'); return route.abort(); });
    // The isolated replay has no external service dependencies.
    await page.route('**/*', route => {
      if (new URL(route.request().url()).origin !== new URL(url).origin) return route.abort();
      return route.fallback();
    });
    await page.goto(url);
    assert.equal(await page.title(), 'Engine campaign audio QA');
    const result = await page.evaluate(async ({ profile, sampleRate }) => {
      const { createGeapsRuntime } = await import('/engine/runtime.js');
      const { createEngineMotion } = await import('/engine/motion.js');
      const { engineProfile } = await import('/engine/profiles.js');
      const singleSpeed = Boolean(engineProfile(profile).singleSpeed);
      const duration = 45;
      const ctx = new OfflineAudioContext(2, duration * sampleRate, sampleRate);
      // Preserve native AudioNode ownership and native methods while making an
      // offline scheduling pause indistinguishable from a running control tick.
      Object.defineProperty(ctx, 'state', { get: () => 'running' });
      // Keep the native context identity required by AudioWorkletNode. Offline
      // pauses are instrumentation, not product lifecycle loss; the live UI
      // check remains responsible for testing genuine suspend/resume behavior.
      for (const method of ['addEventListener', 'removeEventListener']) {
        const native = ctx[method].bind(ctx);
        ctx[method] = (type, callback, options) => { if (type !== 'statechange') native(type, callback, options); };
      }
      const facade = ctx;
      const nativeInterval = window.setInterval, nativeClearInterval = window.clearInterval;
      const timers = new Map(); let timerId = 0;
      window.setInterval = (callback, interval) => { timers.set(++timerId, { callback, interval }); return timerId; };
      window.clearInterval = id => timers.delete(id);
      let seed = 0x16c0ffee;
      const nativeRandom = Math.random;
      Math.random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
      const motion = createEngineMotion(), events = [], trace = [], costs = [];
      const runtime = createGeapsRuntime({ context: facade, destination: ctx.destination, motion,
        now: () => ctx.currentTime * 1000,
        onEvent: (type, detail) => events.push({ at: ctx.currentTime, type, ...detail }) });
      const loadAt = performance.now();
      if (!await runtime.load(profile)) throw new Error(`Engine bank failed: ${JSON.stringify(runtime.getState())}`);
      const loadMs = performance.now() - loadAt;
      runtime.setEnabled(true);
      const segments = [
        { name: 'no-gps-idle', start: 0, end: 2 },
        { name: 'no-gps-tamarro', start: 2, end: 7 },
        { name: 'confirmed-idle', start: 7, end: 14 },
        { name: 'acceleration', start: 14, end: 24 },
        { name: 'cruise', start: 24, end: 28 },
        { name: 'lift', start: 28, end: 30 },
        { name: 'downshift', start: 30, end: 33 },
        { name: 'recovery', start: 33, end: 37 },
        { name: 'braking', start: 37, end: 42 },
        { name: 'return-idle', start: 42, end: 45 },
      ];
      const routeAt = time => {
        const segment = segments.find(part => time < part.end) || segments.at(-1);
        let speed = time < 14 ? 0 : time < 24 ? (time - 14) * 9 : time < 28 ? 90
          : time < 33 ? 90 - (time - 28) * 10.4 : time < 37 ? 38 + (time - 33) * 9.25
          : time < 42 ? 75 - (time - 37) * 15 : 0;
        return { segment: segment.name, speed: Math.max(0, speed), gps: time >= 7,
          driveInput: time >= 14 && time < 24 || time >= 33 && time < 37 ? 'accelerator'
            : time >= 28 && time < 33 || time >= 37 && time < 42 ? 'regen' : 'auto',
          brakeHeld: time >= 37 && time < 42 };
      };
      let tamarroStarted = false, acceptedTamarro = false;
      const quantum = 128 / sampleRate;
      const count = Math.floor((duration - quantum) / .025);
      let pending = ctx.suspend(0);
      const renderAt = performance.now();
      const renderedPromise = ctx.startRendering();
      for (let i = 0; i <= count; i++) {
        await pending;
        const at = ctx.currentTime, route = routeAt(at);
        if (route.gps && i % 4 === 0) motion.observe({ source: 'GPS', rawSpeedKmh: route.speed,
          receivedMs: at * 1000, sourceTimestampMs: 1000000000 + at * 1000,
          epochNowMs: 1000000000 + at * 1000, accuracyM: 5, liveWatch: true,
          driveInput: route.driveInput, brakeHeld: route.brakeHeld });
        if (at >= 2 && !tamarroStarted) { acceptedTamarro = runtime.setRevHeld(true); tamarroStarted = true; }
        const before = performance.now();
        for (const timer of timers.values()) timer.callback();
        costs.push(performance.now() - before);
        const state = runtime.getState();
        trace.push({ at, segment: route.segment, inputSpeedKmh: route.speed,
          inputDrive: route.driveInput, ...state, acousticLoad: state.drive, evidence: motion.snapshot(at * 1000) });
        if (i < count) pending = ctx.suspend((i + 1) * .025);
        await ctx.resume();
      }
      const rendered = await renderedPromise;
      const renderMs = performance.now() - renderAt;
      runtime.destroy(); window.setInterval = nativeInterval; window.clearInterval = nativeClearInterval; Math.random = nativeRandom;
      const channels = [rendered.getChannelData(0), rendered.getChannelData(1)];
      const percentile = (values, q) => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * q))];
      function measure(start, end) {
        const first = Math.floor(start * sampleRate), last = Math.min(rendered.length, Math.floor(end * sampleRate));
        let energy = 0, peak = 0, dc = 0, maximumStep = 0, clipped = 0, nonFinite = 0, lowEnergy = 0, highEnergy = 0;
        const steps = [], windows = []; let low = 0, windowEnergy = 0, windowCount = 0;
        const lowAlpha = 1 - Math.exp(-2 * Math.PI * 250 / sampleRate);
        for (let i = first; i < last; i++) {
          const mono = (channels[0][i] + channels[1][i]) * .5;
          low += lowAlpha * (mono - low); lowEnergy += low * low; highEnergy += (mono - low) ** 2;
          for (const channel of channels) {
            const value = channel[i]; if (!Number.isFinite(value)) nonFinite++;
            energy += value * value; dc += value; peak = Math.max(peak, Math.abs(value)); if (Math.abs(value) >= 1) clipped++;
            const step = Math.abs(value - (i ? channel[i - 1] : value)); maximumStep = Math.max(maximumStep, step);
            if (i % 32 === 0) steps.push(step);
          }
          windowEnergy += mono ** 2; windowCount++;
          if (windowCount >= Math.round(sampleRate * .01)) { windows.push(Math.sqrt(windowEnergy / windowCount)); windowEnergy = 0; windowCount = 0; }
        }
        const count = (last - first) * 2, rms = Math.sqrt(energy / count);
        return { start, end, rms, rmsDbfs: 20 * Math.log10(Math.max(rms, 1e-12)), peak, peakDbfs: 20 * Math.log10(Math.max(peak, 1e-12)),
          dc: dc / count, maximumSampleStep: maximumStep, sampledStepP99: percentile(steps, .99),
          rms10msP05: percentile(windows, .05), rms10msP50: percentile(windows, .5), rms10msP95: percentile(windows, .95),
          lowBandEnergyRatio: lowEnergy / Math.max(1e-20, lowEnergy + highEnergy), clippedSamples: clipped, nonFiniteSamples: nonFinite };
      }
      function wav(start, end) {
        const first = Math.floor(start * sampleRate), frames = Math.floor(end * sampleRate) - first;
        const bytes = new Uint8Array(44 + frames * 4), view = new DataView(bytes.buffer);
        const text = (at, value) => [...value].forEach((char, i) => bytes[at + i] = char.charCodeAt(0));
        text(0, 'RIFF'); view.setUint32(4, bytes.length - 8, true); text(8, 'WAVE'); text(12, 'fmt ');
        view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 2, true);
        view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 4, true); view.setUint16(32, 4, true); view.setUint16(34, 16, true);
        text(36, 'data'); view.setUint32(40, frames * 4, true);
        for (let i = 0; i < frames; i++) for (let c = 0; c < 2; c++) view.setInt16(44 + i * 4 + c * 2, Math.round(Math.max(-1, Math.min(1, channels[c][first + i])) * 32767), true);
        let binary = ''; for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
        return btoa(binary);
      }
      return { profile, sampleRate, duration, singleSpeed, acceptedTamarro, loadMs, renderMs, renderWallRatio: renderMs / (duration * 1000),
        controlCostMs: { mean: costs.reduce((sum, value) => sum + value, 0) / costs.length, p95: percentile(costs, .95), max: Math.max(...costs) },
        metrics: measure(.1, duration), segments: segments.map(part => ({ ...part, metrics: measure(Math.max(.1, part.start), part.end) })),
        trace, events, wav: wav(0, duration), excerpts: segments.filter(part => ['no-gps-tamarro', 'acceleration', 'downshift'].includes(part.name)).map(part => ({ name: part.name, wav: wav(part.start, part.end) })) };
    }, { profile, sampleRate });
    const prefix = `${profile}-${sampleRate}`;
    const { wav, excerpts, ...evidence } = result;
    const audio = Buffer.from(wav, 'base64');
    evidence.audioSha256 = createHash('sha256').update(audio).digest('hex');
    await fs.writeFile(path.join(target, `${prefix}.wav`), audio);
    for (const excerpt of excerpts) await fs.writeFile(path.join(target, `${prefix}-${excerpt.name}.wav`), Buffer.from(excerpt.wav, 'base64'));
    await fs.writeFile(path.join(target, `${prefix}.json`), JSON.stringify(evidence, null, 2) + '\n');
    const columns = ['at', 'segment', 'inputSpeedKmh', 'rpm', 'gear', 'acousticLoad', 'throttle', 'roadLoad', 'coast', 'shift', 'shiftPhase', 'revving', 'showOffPhase', 'idleBlip', 'outputLevel', 'drivelineLevel', 'boost', 'motion'];
    await fs.writeFile(path.join(target, `${prefix}.csv`), columns.join(',') + '\n' + result.trace.map(row => columns.map(key => JSON.stringify(row[key] ?? '')).join(',')).join('\n') + '\n');
    report.renders.push({ ...evidence, trace: undefined, audio: `${prefix}.wav`, traceJson: `${prefix}.json`, traceCsv: `${prefix}.csv` });
    assert.equal(result.metrics.clippedSamples, 0, `${prefix}: unclipped dry output`);
    assert.equal(result.metrics.nonFiniteSamples, 0, `${prefix}: finite dry output`);
    assert.ok(result.metrics.rms > .001, `${prefix}: audible signal`);
    assert.equal(result.acceptedTamarro, true, `${prefix}: manual gesture before GPS`);
    assert.ok(result.trace.some(row => row.revving && row.rpm > 3000 && row.at < 7), `${prefix}: no-GPS TAMARRO has RPM motion`);
    assert.ok(result.trace.some(row => row.trustedStationary && row.idleBlip), `${prefix}: exact-zero automatic idle gesture`);
    assert.equal(result.events.some(event => event.type === 'engine.shift.committed'), !result.singleSpeed,
      `${prefix}: automatic gear changes only for a geared profile`);
    console.log(JSON.stringify({ label, profile, sampleRate, peak: result.metrics.peak, rms: result.metrics.rms,
      sampleStep: result.metrics.maximumSampleStep, controlMs: result.controlCostMs, renderWallRatio: result.renderWallRatio,
      shifts: result.events.filter(event => event.type === 'engine.shift.committed').length, audio: path.join(target, `${prefix}.wav`) }));
    await fs.writeFile(path.join(target, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    await page.close();
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.emailIntercepted, []);
  console.log(`ENGINE CAMPAIGN PASS: ${report.renders.length} renders; ${path.join(target, 'report.json')}`);
} finally {
  await fs.writeFile(path.join(target, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await browser.close(); await server.close();
}
