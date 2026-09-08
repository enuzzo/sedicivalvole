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
const output = path.resolve(args.output || process.env.QA_OUTPUT || '/tmp/sv-engine-road-progression-20260908');
const label = String(args.label || 'current');
assert.match(label, /^[a-z0-9_-]+$/i);
const source = path.resolve(args.source || path.join(project, 'src/engine'));
const profiles = String(args.profiles || 'mono,rosso,touring,otto,cinque,turbine').split(',');
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
  response.end('<!doctype html><title>Engine road progression QA</title><main>Production Engine audio replay</main>');
});
await server.listen();
const port = server.httpServer.address().port;
const url = `http://127.0.0.1:${port}/`;
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.CHROME_EXECUTABLE || undefined, args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
const report = { label, generatedAt: new Date().toISOString(), source, sources, browser: browser.version(),
  browserPath: 'Browser plugin not available; isolated Playwright Chromium',
  methodology: 'Production runtime and motion receiver, actual dry graph, unnormalized full-run and segmented PCM. Steady cruise probes follow four seconds of settling. Acceleration probes cross each target at 9 km/h/s (2.5 m/s2) using the actual motion reducer. Held-demand probes explicitly exercise the receiver accelerator input at constant speed; they are acoustic bench fixtures, not observed GPS throttle. Offline rendering is suspended at audio quantum boundaries for each 25 ms control tick; the context facade reports running while rendering is paused for scheduling. All sample decoding and AudioWorklet DSP use the browser. Cost is measured wall-clock control and offline render work, not target-vehicle CPU utilization.',
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
    assert.equal(await page.title(), 'Engine road progression QA');
    const result = await page.evaluate(async ({ profile, sampleRate }) => {
      const { createGeapsRuntime } = await import('/engine/runtime.js');
      const { createEngineMotion } = await import('/engine/motion.js');
      const { engineProfile } = await import('/engine/profiles.js');
      const singleSpeed = Boolean(engineProfile(profile).singleSpeed);
      const speeds = [20, 30, 40, 60, 80, 100, 130, 160];
      const stages = []; let cursor = 0, previousSpeed = 0;
      const add = (name, seconds, from, to, input = 'auto', kind = 'transition') => {
        const stage = { name, start: cursor, end: cursor + seconds, from, to, input, kind };
        stages.push(stage); cursor = stage.end; return stage;
      };
      add('initial-idle', 2, 0, 0);
      for (const speed of speeds) {
        add(`approach-${speed}`, Math.max(1, (speed - previousSpeed) / 8), previousSpeed, speed);
        add(`settle-${speed}`, 4, speed, speed);
        add(`cruise-${speed}`, 3, speed, speed, 'auto', 'cruise'); previousSpeed = speed;
      }
      add('return-to-stop', 20, 160, 0, 'regen'); add('settle-stop', 2, 0, 0);
      const firstAcceleration = add('acceleration-0-130', 130 / 9, 0, 130, 'auto', 'acceleration');
      add('settle-demand-130', 4, 130, 130, 'accelerator');
      add('held-demand-130', 3, 130, 130, 'accelerator', 'held-demand');
      const secondAcceleration = add('acceleration-130-160', 30 / 9, 130, 160, 'auto', 'acceleration');
      add('settle-demand-160', 4, 160, 160, 'accelerator');
      add('held-demand-160', 3, 160, 160, 'accelerator', 'held-demand');
      const duration = Math.ceil(cursor);
      const probes = stages.filter(stage => ['cruise', 'held-demand'].includes(stage.kind)).map(stage => ({ ...stage, speed: stage.to }));
      for (const speed of speeds) {
        const stage = speed <= 130 ? firstAcceleration : secondAcceleration;
        const crossing = stage.start + (speed - stage.from) / 9;
        probes.push({ name: `acceleration-${speed}`, kind: 'acceleration', speed, crossing,
          start: Math.max(stage.start, crossing - .5), end: Math.min(stage.end, crossing + .5) });
      }
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
      const routeAt = time => {
        const stage = stages.find(part => time < part.end) || stages.at(-1);
        const progress = Math.max(0, Math.min(1, (time - stage.start) / (stage.end - stage.start)));
        return { segment: stage.name, speed: stage.from + (stage.to - stage.from) * progress,
          driveInput: stage.input, brakeHeld: false };
      };
      const quantum = 128 / sampleRate;
      const count = Math.floor((duration - quantum) / .025);
      let pending = ctx.suspend(0);
      const renderAt = performance.now();
      const renderedPromise = ctx.startRendering();
      for (let i = 0; i <= count; i++) {
        await pending;
        const at = ctx.currentTime, route = routeAt(at);
        if (i % 4 === 0) motion.observe({ source: 'GPS', rawSpeedKmh: route.speed,
          receivedMs: at * 1000, sourceTimestampMs: 1000000000 + at * 1000,
          epochNowMs: 1000000000 + at * 1000, accuracyM: 5, liveWatch: true,
          driveInput: route.driveInput, brakeHeld: route.brakeHeld });
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
      const mean = (rows, read) => rows.reduce((sum, row) => sum + (read(row) ?? 0), 0) / Math.max(1, rows.length);
      const table = probes.map(probe => {
        const rows = trace.filter(row => row.at >= probe.start && row.at < probe.end);
        const closest = rows.reduce((best, row) => Math.abs(row.inputSpeedKmh - probe.speed) < Math.abs(best.inputSpeedKmh - probe.speed) ? row : best, rows[0]);
        const summaryRows = probe.kind === 'acceleration' ? [closest] : rows;
        return { name: probe.name, kind: probe.kind, speedKmh: probe.speed, start: probe.start, end: probe.end,
          observedSpeedKmh: mean(summaryRows, row => row.evidence.rawSpeedKmh),
          acousticSpeedKmh: mean(summaryRows, row => row.acousticSpeedKmh ?? row.audioSpeedKmh ?? row.effectiveSpeedKmh ?? row.evidence.speedKmh),
          gears: [...new Set(rows.map(row => row.gear))], gear: closest.gear,
          rpm: mean(summaryRows, row => row.rpm), load: mean(summaryRows, row => row.drive),
          throttle: mean(summaryRows, row => row.throttle), roadLoad: mean(summaryRows, row => row.roadLoad),
          accelerationMps2: mean(summaryRows, row => row.evidence.accelerationMps2),
          shift: closest.shift, metrics: measure(probe.start, probe.end) };
      });
      const capParity = ['cruise', 'held-demand'].map(kind => {
        const at130 = table.find(row => row.kind === kind && row.speedKmh === 130);
        const at160 = table.find(row => row.kind === kind && row.speedKmh === 160);
        return { kind, raw130: at130.observedSpeedKmh, raw160: at160.observedSpeedKmh,
          rpmDelta: at160.rpm - at130.rpm, loadDelta: at160.load - at130.load,
          gear130: at130.gear, gear160: at160.gear };
      });
      return { profile, sampleRate, duration, singleSpeed, table, capParity, loadMs, renderMs, renderWallRatio: renderMs / (duration * 1000),
        controlCostMs: { mean: costs.reduce((sum, value) => sum + value, 0) / costs.length, p95: percentile(costs, .95), max: Math.max(...costs) },
        metrics: measure(.1, duration), segments: probes.map(part => ({ ...part, metrics: measure(part.start, part.end) })),
        trace, events, wav: wav(0, duration), excerpts: probes.map(part => ({ name: part.name, wav: wav(part.start, part.end) })) };
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
    if (args['assert-cap']) for (const cap of result.capParity) {
      assert.ok(Math.abs(cap.rpmDelta) <= 2, `${prefix} ${cap.kind}: capped RPM ${JSON.stringify(cap)}`);
      assert.ok(Math.abs(cap.loadDelta) < .001, `${prefix} ${cap.kind}: capped load ${JSON.stringify(cap)}`);
      assert.equal(cap.gear130, cap.gear160, `${prefix} ${cap.kind}: capped gear`);
      assert.ok(Math.abs(cap.raw130 - 130) < .01 && Math.abs(cap.raw160 - 160) < .01, `${prefix}: original telemetry remains intact`);
    }
    assert.equal(result.events.some(event => event.type === 'engine.shift.committed'), !result.singleSpeed,
      `${prefix}: automatic gear changes only for a geared profile`);
    const tableColumns = ['name', 'kind', 'speedKmh', 'observedSpeedKmh', 'acousticSpeedKmh', 'gear', 'rpm', 'load', 'throttle', 'roadLoad', 'accelerationMps2'];
    await fs.writeFile(path.join(target, `${prefix}-table.csv`), tableColumns.join(',') + '\n' + result.table.map(row => tableColumns.map(key => JSON.stringify(row[key] ?? '')).join(',')).join('\n') + '\n');
    console.log(JSON.stringify({ label, profile, sampleRate, peak: result.metrics.peak, rms: result.metrics.rms,
      sampleStep: result.metrics.maximumSampleStep, controlMs: result.controlCostMs, renderWallRatio: result.renderWallRatio,
      shifts: result.events.filter(event => event.type === 'engine.shift.committed').length, audio: path.join(target, `${prefix}.wav`) }));
    await fs.writeFile(path.join(target, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    await page.close();
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.emailIntercepted, []);
  const table = ['# Engine road progression measurements', '', 'Actual unnormalized production output. GPS input and acoustic state are synthetic QA observations, not real vehicle RPM, torque or pedal readings.', '', '| Profile | Rate | Mode | Speed | Gear | RPM | Load | RMS dBFS | Peak |', '|---|---:|---|---:|---:|---:|---:|---:|---:|'];
  for (const render of report.renders) for (const row of render.table) table.push(`| ${render.profile} | ${render.sampleRate} | ${row.kind} | ${row.speedKmh} | ${row.gear} | ${row.rpm.toFixed(0)} | ${row.load.toFixed(3)} | ${row.metrics.rmsDbfs.toFixed(2)} | ${row.metrics.peak.toFixed(3)} |`);
  await fs.writeFile(path.join(target, 'TABLE.md'), table.join('\n') + '\n');
  if (args.compare) {
    const beforePath = path.resolve(args.compare), comparisonPath = path.join(target, 'comparison');
    await fs.mkdir(comparisonPath, { recursive: true });
    const comparison = { beforePath, afterPath: target, normalization: 'None: original production levels preserved.',
      methodology: 'Each file plays before, 0.5 seconds of silence, then after. Only 5 ms file-edge fades prevent cut-boundary clicks; complete raw source files are unchanged.', results: [] };
    for (const render of report.renders) {
      const prefix = `${render.profile}-${render.sampleRate}`;
      const old = JSON.parse(await fs.readFile(path.join(beforePath, `${prefix}.json`), 'utf8'));
      const [a, b] = await Promise.all([fs.readFile(path.join(beforePath, `${prefix}.wav`)), fs.readFile(path.join(target, `${prefix}.wav`))]);
      for (const row of render.table) {
        const prior = old.table.find(item => item.name === row.name);
        assert.equal(prior.start, row.start); assert.equal(prior.end, row.end);
        const first = Math.floor(row.start * render.sampleRate), frames = Math.floor(row.end * render.sampleRate) - first;
        const gap = Math.round(render.sampleRate * .5), audio = Buffer.alloc(44 + (frames * 2 + gap) * 4);
        a.copy(audio, 0, 0, 44); audio.writeUInt32LE(audio.length - 8, 4); audio.writeUInt32LE(audio.length - 44, 40);
        for (let side = 0; side < 2; side++) for (let frame = 0; frame < frames; frame++) for (let channel = 0; channel < 2; channel++) {
          const input = side === 0 ? a : b;
          const edge = Math.min(1, frame / (render.sampleRate * .005), (frames - 1 - frame) / (render.sampleRate * .005));
          audio.writeInt16LE(Math.round(input.readInt16LE(44 + (first + frame) * 4 + channel * 2) * edge),
            44 + (side * (frames + gap) + frame) * 4 + channel * 2);
        }
        const filename = `${prefix}-${row.name}-raw-before-after.wav`;
        await fs.writeFile(path.join(comparisonPath, filename), audio);
        comparison.results.push({ profile: render.profile, sampleRate: render.sampleRate, name: row.name,
          file: filename, audioSha256: createHash('sha256').update(audio).digest('hex'), before: prior, after: row,
          rmsChangeDb: row.metrics.rmsDbfs - prior.metrics.rmsDbfs });
      }
    }
    await fs.writeFile(path.join(comparisonPath, 'report.json'), JSON.stringify(comparison, null, 2) + '\n');
  }
  console.log(`ENGINE ROAD PROGRESSION PASS: ${report.renders.length} renders; ${path.join(target, 'report.json')}`);
} finally {
  await fs.writeFile(path.join(target, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await browser.close(); await server.close();
}
