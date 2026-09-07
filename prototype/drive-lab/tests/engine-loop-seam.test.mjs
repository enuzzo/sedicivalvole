import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { prepareEngineLoopSeam } from "../src/engine/loop-seam.js";

const root = new URL("../", import.meta.url);
const inventory = JSON.parse(readFileSync(new URL("src/engine/source-inventory.json", root)));
const asBuffer = (channels, sampleRate) => ({ length: channels[0].length, numberOfChannels: channels.length, sampleRate, getChannelData: index => channels[index] });
function decodeNativePcm(bytes) {
  let format, body;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const kind = bytes.toString("ascii", offset, offset + 4), size = bytes.readUInt32LE(offset + 4);
    if (kind === "fmt ") format = { encoding: bytes.readUInt16LE(offset + 8), channels: bytes.readUInt16LE(offset + 10), sampleRate: bytes.readUInt32LE(offset + 12), bits: bytes.readUInt16LE(offset + 22) };
    if (kind === "data") body = bytes.subarray(offset + 8, offset + 8 + size);
    offset += 8 + size + (size % 2);
  }
  assert.ok(format && body);
  const width = format.bits / 8, frames = body.length / (format.channels * width);
  const channels = Array.from({ length: format.channels }, () => new Float32Array(frames));
  for (let frame = 0; frame < frames; frame++) for (let channel = 0; channel < format.channels; channel++) {
    const offset = (frame * format.channels + channel) * width;
    channels[channel][frame] = format.encoding === 3 ? body.readFloatLE(offset) : body.readInt16LE(offset) / 32768;
  }
  return asBuffer(channels, format.sampleRate);
}

test("an ordinary periodic stereo loop stays byte-identical", () => {
  const channel = Float32Array.from({ length: 48000 }, (_, index) => .3 * Math.sin(index * 2 * Math.PI * 120 / 48000));
  const right = Float32Array.from(channel, value => -value);
  const before = new Uint8Array(channel.buffer).slice();
  const result = prepareEngineLoopSeam(asBuffer([channel, right], 48000));
  assert.equal(result.applied, false);
  assert.equal(result.loopStart, 0);
  assert.deepEqual(new Uint8Array(channel.buffer), before);
});

test("severe stereo wrap blends only the tail and joins the untouched head without boosting its peak", () => {
  const channel = Float32Array.from({ length: 48000 }, (_, index) => .3 * Math.sin(index * 2 * Math.PI * 127.25 / 48000));
  const right = Float32Array.from(channel, value => -value * .5);
  const buffer = asBuffer([channel, right], 48000);
  const original = channel.slice(), blendFrames = 480;
  const result = prepareEngineLoopSeam(buffer);
  assert.equal(result.applied, true);
  assert.equal(result.loopStart, .01);
  assert.equal(result.loopEnd, 1);
  assert.deepEqual(channel.subarray(0, channel.length - blendFrames), original.subarray(0, original.length - blendFrames));
  assert.equal(channel[channel.length - blendFrames], original[channel.length - blendFrames]);
  assert.equal(channel[channel.length - 1], channel[blendFrames - 1]);
  for (const measurement of result.channels) {
    assert.equal(measurement.peakDidNotIncrease, true);
    assert.ok(measurement.preparedWrapStep < measurement.originalWrapStep);
  }
  const preparedCopy = channel.slice();
  assert.equal(prepareEngineLoopSeam(buffer), result);
  assert.deepEqual(channel, preparedCopy);
});

test("decoded full-scale overshoot at 44.1 kHz still repairs the seam without clipping or peak growth", () => {
  const channel = Float32Array.from({ length: 44100 }, (_, index) => 1.02 * Math.sin(index * 2 * Math.PI * 127.25 / 44100));
  const original = channel.slice();
  const result = prepareEngineLoopSeam(asBuffer([channel], 44100));
  assert.equal(result.applied, true);
  assert.equal(result.loopStart, .01);
  assert.equal(result.blendFrames, 441);
  assert.ok(result.channels[0].originalPeak > 1);
  assert.equal(result.channels[0].peakDidNotIncrease, true);
  assert.deepEqual(channel.subarray(0, channel.length - 441), original.subarray(0, original.length - 441));
  assert.equal(channel[channel.length - 1], channel[440]);
  assert.ok(result.channels[0].preparedWrapStep < result.channels[0].originalWrapStep / 10);
  assert.ok(channel.some(value => value > 1));
});

test("invalid or very short sources are not partially modified", () => {
  for (const invalid of [NaN, Infinity, 2.1, -2.1]) {
    const left = new Float32Array(48000).fill(.2), right = left.slice();
    left[left.length - 1] = -.2;
    right[100] = invalid;
    const before = left.slice();
    assert.equal(prepareEngineLoopSeam(asBuffer([left, right], 48000)).applied, false);
    assert.deepEqual(left, before);
  }
  assert.equal(prepareEngineLoopSeam(asBuffer([new Float32Array(100)], 48000)).applied, false);
});

test("admitted native loops select only the three exceptional Mono seams and preserve all encoded hashes", () => {
  const repaired = [];
  const core = inventory.audio.filter(asset => !/(limiter|trany|tw_off)/.test(asset.source));
  assert.equal(core.length, 12);
  for (const asset of core) {
    const bytes = readFileSync(new URL(`public${asset.url}`, root));
    const buffer = decodeNativePcm(bytes);
    const result = prepareEngineLoopSeam(buffer);
    if (result.applied) {
      repaired.push(asset.source);
      for (let index = 0; index < buffer.numberOfChannels; index++) {
        const channel = buffer.getChannelData(index), measurement = result.channels[index];
        assert.equal(channel[buffer.length - 1], channel[result.blendFrames - 1]);
        assert.equal(measurement.preparedWrapStep, Math.abs(channel[result.blendFrames] - channel[result.blendFrames - 1]));
        assert.equal(measurement.peakDidNotIncrease, true);
        assert.ok(Math.abs(20 * Math.log10(measurement.steadyLoopRms / measurement.originalRms)) < .02);
      }
    }
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256);
  }
  assert.deepEqual(repaired.sort(), ["public/audio/BAC_Mono_offlow.wav", "public/audio/BAC_Mono_offveryhigh.wav", "public/audio/BAC_Mono_onhigh.wav"]);
});
