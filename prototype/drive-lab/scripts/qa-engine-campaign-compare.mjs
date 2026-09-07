import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// Listening copies use one fixed attenuation per complete run. Segment dynamics
// remain intact; original exported dry WAVs are retained beside the evidence.
const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const [key, ...rest] = value.replace(/^--/, '').split('='); return [key, rest.join('=') || true];
}));
const beforePath = path.resolve(args.before || '/tmp/sv-engine-campaign/baseline');
const afterPath = path.resolve(args.after || '/tmp/sv-engine-campaign/after');
const output = path.resolve(args.output || '/tmp/sv-engine-campaign/comparison');
const profile = String(args.profile || 'mono'), rate = Number(args.rate || 48000), prefix = `${profile}-${rate}`;
const [before, after, beforeAudio, afterAudio] = await Promise.all([
  fs.readFile(path.join(beforePath, `${prefix}.json`), 'utf8').then(JSON.parse),
  fs.readFile(path.join(afterPath, `${prefix}.json`), 'utf8').then(JSON.parse),
  fs.readFile(path.join(beforePath, `${prefix}.wav`)), fs.readFile(path.join(afterPath, `${prefix}.wav`)),
]);
assert.equal(before.sampleRate, after.sampleRate); assert.equal(before.duration, after.duration);
for (const bytes of [beforeAudio, afterAudio]) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF'); assert.equal(bytes.toString('ascii', 36, 40), 'data');
  assert.equal(bytes.readUInt16LE(20), 1); assert.equal(bytes.readUInt16LE(22), 2); assert.equal(bytes.readUInt16LE(34), 16);
  assert.equal(bytes.readUInt32LE(24), rate);
}
const referenceRms = Math.min(before.metrics.rms, after.metrics.rms);
assert.ok(referenceRms > 0);
const gains = [before, after].map(report => Math.min(1, referenceRms / report.metrics.rms, .9 / report.metrics.peak));
await fs.mkdir(output, { recursive: true });
const results = [];
for (const segment of before.segments) {
  const current = after.segments.find(part => part.name === segment.name);
  assert.equal(current.start, segment.start); assert.equal(current.end, segment.end);
  const frames = Math.floor((segment.end - segment.start) * rate), gap = Math.round(rate * .5);
  const audio = Buffer.alloc(44 + (frames * 2 + gap) * 4);
  beforeAudio.copy(audio, 0, 0, 44); audio.writeUInt32LE(audio.length - 8, 4); audio.writeUInt32LE(audio.length - 44, 40);
  for (let side = 0; side < 2; side++) {
    const input = side === 0 ? beforeAudio : afterAudio;
    for (let frame = 0; frame < frames; frame++) for (let channel = 0; channel < 2; channel++) {
      const offset = 44 + (Math.floor(segment.start * rate) + frame) * 4 + channel * 2;
      const target = 44 + (side * (frames + gap) + frame) * 4 + channel * 2;
      // Short file-edge fades prevent export-boundary clicks unrelated to DSP.
      const edge = Math.min(1, frame / (rate * .005), (frames - 1 - frame) / (rate * .005));
      audio.writeInt16LE(Math.round(input.readInt16LE(offset) * gains[side] * edge), target);
    }
  }
  const filename = `${prefix}-${segment.name}-rms-matched-before-after.wav`;
  await fs.writeFile(path.join(output, filename), audio);
  results.push({ segment: segment.name, file: filename, audioSha256: createHash('sha256').update(audio).digest('hex'),
    order: [{ name: 'before', start: 0, end: frames / rate }, { name: 'after', start: (frames + gap) / rate, end: (frames * 2 + gap) / rate }],
    before: segment.metrics, after: current.metrics,
    rmsChangeDb: 20 * Math.log10(current.metrics.rms / segment.metrics.rms) });
}
const report = { generatedAt: new Date().toISOString(), beforePath, afterPath, profile, sampleRate: rate,
  methodology: 'Each excerpt plays before, then 0.5 seconds of silence, then after. Fixed attenuation is derived from complete-run RMS to reduce loudness bias; this is not a perceptual loudness or listener-preference measurement. Five-millisecond file-edge fades remove export-boundary clicks. Raw source WAVs are unchanged.',
  originalAudioSha256: [beforeAudio, afterAudio].map(bytes => createHash('sha256').update(bytes).digest('hex')),
  gains: { before: gains[0], after: gains[1], beforeDb: 20 * Math.log10(gains[0]), afterDb: 20 * Math.log10(gains[1]) },
  results };
await fs.writeFile(path.join(output, `${prefix}-comparison.json`), JSON.stringify(report, null, 2) + '\n');
console.log(`ENGINE COMPARISON READY: ${results.length} level-matched before/after excerpts; ${output}`);
