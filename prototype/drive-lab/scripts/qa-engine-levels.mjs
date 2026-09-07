import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE || undefined, args: ['--mute-audio'] });
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/');
  const measurements = await page.evaluate(async () => {
    const { ENGINE_PROFILES } = await import('/src/engine/profiles.js');
    const { matchEngineLoopLevels } = await import('/src/engine/sample-levels.js');
    const { AudioManager } = await import('/src/engine/upstream/AudioManager.ts');
    const { Engine } = await import('/src/engine/upstream/Engine.ts');
    const results = [];
    for (const profile of ENGINE_PROFILES) {
      const decoder = new OfflineAudioContext(2, 48000, 48000);
      const assets = await Promise.all(profile.assets.map(async asset => ({ asset, buffer: await decoder.decodeAudioData(await (await fetch(asset.url)).arrayBuffer()) })));
      const levels = matchEngineLoopLevels(assets);
      for (const rpm of [1000, 3500, 6500]) {
        const readings = [];
        for (const drive of [0, 0.15, 1]) {
          const ctx = new OfflineAudioContext(2, 48000 * 3, 48000);
          const { gain1: high, gain2: low } = AudioManager.crossFade(rpm, 3000, 6500);
          const { gain1: on, gain2: off } = AudioManager.crossFade(drive, 0, 1);
          const weights = { on_low: on * low, off_low: off * low, on_high: on * high, off_high: off * high, tranny_on: on * .25, tranny_off: off * .25 };
          const engine = new Engine(); engine.init(profile.configuration.engine); engine.rpm = rpm;
          for (const { asset, buffer } of assets) {
            const source = ctx.createBufferSource(); source.buffer = buffer; source.loop = true;
            source.detune.value = asset.role === 'limiter' ? 0 : asset.role.startsWith('tranny') ? rpm * .035 - 800 : Math.max(-2400, Math.min(2400, engine.getRPMPitch(asset.rpm, .2)));
            const gain = ctx.createGain(); gain.gain.value = (weights[asset.role] ?? 0) * (levels.get(asset.role) ?? asset.volume ?? 1) * .16;
            source.connect(gain).connect(ctx.destination); source.start();
          }
          const rendered = await ctx.startRendering(); let squares = 0, peak = 0;
          for (let ch = 0; ch < 2; ch++) for (const value of rendered.getChannelData(ch)) { squares += value ** 2; peak = Math.max(peak, Math.abs(value)); }
          readings.push({ drive, rms: Math.sqrt(squares / (rendered.length * 2)), peak });
        }
        results.push({ profile: profile.id, rpm, readings, liftDb: 20 * Math.log10(readings[0].rms / readings[2].rms) });
      }
    }
    return results;
  });
  for (const result of measurements) {
    assert.ok(Math.abs(result.liftDb) < 1.5, JSON.stringify(result));
    assert.ok(result.readings.every(r => r.rms > .001 && r.peak < .95));
  }
  await fs.mkdir(process.env.QA_OUTPUT || '/tmp/sedicivalvole-engine-qa', { recursive: true });
  await fs.writeFile(`${process.env.QA_OUTPUT || '/tmp/sedicivalvole-engine-qa'}/sample-levels.json`, JSON.stringify(measurements, null, 2));
  console.log('REAL WAV LEVELS PASS', measurements.map(({profile,rpm,liftDb})=>({profile,rpm,liftDb})));
} finally { await browser.close(); }
