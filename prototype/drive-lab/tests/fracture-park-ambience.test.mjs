import assert from "node:assert/strict";
import test from "node:test";

import {
  FRACTURE_PARK_HOLD_SECONDS,
  FRACTURE_PARK_OUTPUT_GAIN,
  FRACTURE_PARK_VOICINGS,
} from "../src/score/park-ambience.js";
import { midiToHz } from "../src/score/dsp/synth-voice.js";
import { createScoreCore } from "../src/score/score-core.js";

const SAMPLE_RATE = 8000;
const BLOCK = 128;
const REFERENCE_SAMPLE_RATE = 48000;

const PARK_CHORD_PITCH_CLASSES = Object.freeze({
  Fm9: [0, 3, 5, 7, 8],
  Dbmaj9: [0, 1, 3, 5, 8],
  "Ab6/9": [0, 3, 5, 8, 10],
  "Eb6/9": [0, 3, 5, 7, 10],
  Cm7: [0, 3, 7, 10],
  Fm11: [0, 3, 5, 7, 8, 10],
});

const REFERENCE_DRIVE = Object.freeze([
  [0, 6],
  [40, 12],
  [40, 10],
  [80, 14],
  [80, 10],
  [115, 14],
  [115, 12],
  [60, 10],
  [60, 14],
  [115, 12],
  [115, 10],
  [0, 16],
  [0, 8],
]);

function renderPark(seconds = 52) {
  const core = createScoreCore({ sampleRate: SAMPLE_RATE });
  const frames = Math.round(seconds * SAMPLE_RATE);
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);
  const blockLeft = new Float32Array(BLOCK);
  const blockRight = new Float32Array(BLOCK);
  const snapshots = [];
  let nextSnapshotFrame = SAMPLE_RATE;

  for (let start = 0; start < frames; start += BLOCK) {
    const count = Math.min(BLOCK, frames - start);
    core.observe(0, count / SAMPLE_RATE);
    core.process(blockLeft, blockRight, count);
    left.set(blockLeft.subarray(0, count), start);
    right.set(blockRight.subarray(0, count), start);
    if (start + count >= nextSnapshotFrame) {
      snapshots.push(core.snapshot());
      nextSnapshotFrame += SAMPLE_RATE;
    }
  }

  return { core, left, right, snapshots };
}

function signalMetrics(left, right, fromFrame = 0) {
  let peak = 0;
  let sum = 0;
  let count = 0;
  for (let frame = fromFrame; frame < left.length; frame += 1) {
    peak = Math.max(peak, Math.abs(left[frame]), Math.abs(right[frame]));
    sum += (left[frame] ** 2 + right[frame] ** 2) * 0.5;
    count += 1;
  }
  return { peak, rms: Math.sqrt(sum / Math.max(1, count)) };
}

function renderCoreSegment(core, speedKmh, seconds, sampleRate) {
  const frames = Math.round(seconds * sampleRate);
  const left = new Float32Array(BLOCK);
  const right = new Float32Array(BLOCK);
  let peak = 0;
  let sum = 0;
  let count = 0;
  for (let start = 0; start < frames; start += BLOCK) {
    const blockFrames = Math.min(BLOCK, frames - start);
    core.observe(speedKmh, blockFrames / sampleRate);
    core.process(left, right, blockFrames);
    for (let frame = 0; frame < blockFrames; frame += 1) {
      peak = Math.max(peak, Math.abs(left[frame]), Math.abs(right[frame]));
      sum += (left[frame] ** 2 + right[frame] ** 2) * 0.5;
      count += 1;
    }
  }
  return { peak, rms: Math.sqrt(sum / Math.max(1, count)) };
}

function speedAt(legs, seconds) {
  let elapsed = 0;
  let previous = 0;
  for (const [target, duration] of legs) {
    if (seconds < elapsed + duration) {
      return previous + (target - previous) * ((seconds - elapsed) / duration);
    }
    elapsed += duration;
    previous = target;
  }
  return previous;
}

function renderReferenceDrive() {
  const seconds = REFERENCE_DRIVE.reduce((total, [, duration]) => total + duration, 0);
  const frames = seconds * REFERENCE_SAMPLE_RATE;
  const core = createScoreCore({ sampleRate: REFERENCE_SAMPLE_RATE });
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);
  const blockLeft = new Float32Array(BLOCK);
  const blockRight = new Float32Array(BLOCK);

  for (let start = 0; start < frames; start += BLOCK) {
    const count = Math.min(BLOCK, frames - start);
    const at = start / REFERENCE_SAMPLE_RATE;
    core.observe(speedAt(REFERENCE_DRIVE, at), count / REFERENCE_SAMPLE_RATE);
    core.process(blockLeft, blockRight, count);
    left.set(blockLeft.subarray(0, count), start);
    right.set(blockRight.subarray(0, count), start);
  }
  return { left, right };
}

function biquadTick(coefficients) {
  const { b, a } = coefficients;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  return (input) => {
    const output = b[0] * input + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;
    x2 = x1;
    x1 = input;
    y2 = y1;
    y1 = output;
    return output;
  };
}

/** ITU-R BS.1770 K-weighted integrated loudness at the fixed 48 kHz fixture rate. */
function integratedLoudness(left, right) {
  const shelf = {
    b: [1.53512485958697, -2.69169618940638, 1.19839281085285],
    a: [1, -1.69065929318241, 0.73248077421585],
  };
  const highPass = {
    b: [1, -2, 1],
    a: [1, -1.99004745483398, 0.99007225036621],
  };
  const filterLeft = [biquadTick(shelf), biquadTick(highPass)];
  const filterRight = [biquadTick(shelf), biquadTick(highPass)];
  const windowFrames = Math.round(REFERENCE_SAMPLE_RATE * 0.4);
  const hopFrames = Math.round(REFERENCE_SAMPLE_RATE * 0.1);
  const energyWindow = new Float64Array(windowFrames);
  const blocks = [];
  let position = 0;
  let rollingEnergy = 0;

  for (let frame = 0; frame < left.length; frame += 1) {
    const weightedLeft = filterLeft[1](filterLeft[0](left[frame]));
    const weightedRight = filterRight[1](filterRight[0](right[frame]));
    const energy = weightedLeft ** 2 + weightedRight ** 2;
    rollingEnergy += energy - energyWindow[position];
    energyWindow[position] = energy;
    position = (position + 1) % windowFrames;
    const observed = frame + 1;
    if (observed >= windowFrames && (observed - windowFrames) % hopFrames === 0) {
      blocks.push(rollingEnergy / windowFrames);
    }
  }

  const toLufs = (energy) => -0.691 + 10 * Math.log10(energy);
  const absoluteGated = blocks.filter((energy) => toLufs(energy) > -70);
  const ungatedEnergy = absoluteGated.reduce((sum, energy) => sum + energy, 0)
    / absoluteGated.length;
  const relativeGate = toLufs(ungatedEnergy) - 10;
  const relativeGated = absoluteGated.filter((energy) => toLufs(energy) > relativeGate);
  const integratedEnergy = relativeGated.reduce((sum, energy) => sum + energy, 0)
    / relativeGated.length;
  return toLufs(integratedEnergy);
}

/** Four-times band-limited interpolation, used as a deterministic true-peak guard. */
function truePeak(left, right) {
  let samplePeak = 0;
  for (let frame = 0; frame < left.length; frame += 1) {
    samplePeak = Math.max(samplePeak, Math.abs(left[frame]), Math.abs(right[frame]));
  }

  const radius = 16;
  const phases = [];
  for (let phase = 1; phase < 4; phase += 1) {
    const coefficients = [];
    let total = 0;
    for (let offset = -radius + 1; offset <= radius; offset += 1) {
      const distance = phase / 4 - offset;
      const sinc = Math.abs(distance) < 1e-12
        ? 1
        : Math.sin(Math.PI * distance) / (Math.PI * distance);
      const window = 0.42
        + 0.5 * Math.cos(Math.PI * distance / radius)
        + 0.08 * Math.cos(2 * Math.PI * distance / radius);
      const coefficient = sinc * window;
      coefficients.push([offset, coefficient]);
      total += coefficient;
    }
    phases.push(coefficients.map(([offset, coefficient]) => [offset, coefficient / total]));
  }

  let peak = samplePeak;
  for (let frame = radius; frame < left.length - radius - 1; frame += 1) {
    // Intersample overshoots occur beside high samples. This pruning keeps the
    // full 148-second regression inexpensive without reducing its measured max.
    const neighbourPeak = Math.max(
      Math.abs(left[frame]), Math.abs(left[frame + 1]),
      Math.abs(right[frame]), Math.abs(right[frame + 1]),
    );
    if (neighbourPeak < samplePeak * 0.55) continue;
    for (const coefficients of phases) {
      let interpolatedLeft = 0;
      let interpolatedRight = 0;
      for (const [offset, coefficient] of coefficients) {
        interpolatedLeft += left[frame + offset] * coefficient;
        interpolatedRight += right[frame + offset] * coefficient;
      }
      peak = Math.max(peak, Math.abs(interpolatedLeft), Math.abs(interpolatedRight));
    }
  }
  return peak;
}

function goertzelPower(samples, startFrame, frameCount, frequency) {
  const omega = (2 * Math.PI * frequency) / SAMPLE_RATE;
  const coefficient = 2 * Math.cos(omega);
  let previous = 0;
  let previous2 = 0;
  for (let offset = 0; offset < frameCount; offset += 1) {
    const position = offset / Math.max(1, frameCount - 1);
    const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * position);
    const current = samples[startFrame + offset] * window
      + coefficient * previous - previous2;
    previous2 = previous;
    previous = current;
  }
  return previous2 ** 2 + previous ** 2 - coefficient * previous * previous2;
}

function stereoPitchPower(render, startSeconds, durationSeconds, midi) {
  const start = Math.round(startSeconds * SAMPLE_RATE);
  const count = Math.round(durationSeconds * SAMPLE_RATE);
  const frequency = midiToHz(midi);
  return goertzelPower(render.left, start, count, frequency)
    + goertzelPower(render.right, start, count, frequency);
}

test("FRACTURE PARK authors six consonant rootless voicings on a clockless slow cycle", () => {
  assert.equal(FRACTURE_PARK_VOICINGS.length, 6);
  assert.equal(FRACTURE_PARK_HOLD_SECONDS.length, FRACTURE_PARK_VOICINGS.length);
  assert.equal(new Set(FRACTURE_PARK_VOICINGS.map(({ id }) => id)).size, 6);
  assert.deepEqual(
    FRACTURE_PARK_VOICINGS.map(({ id }) => id),
    Object.keys(PARK_CHORD_PITCH_CLASSES),
  );
  assert.equal(new Set(FRACTURE_PARK_HOLD_SECONDS).size, FRACTURE_PARK_HOLD_SECONDS.length);
  assert.ok(FRACTURE_PARK_HOLD_SECONDS.every((seconds) => seconds >= 6));
  assert.ok(FRACTURE_PARK_HOLD_SECONDS.reduce((sum, seconds) => sum + seconds, 0) >= 45);
  assert.ok(FRACTURE_PARK_OUTPUT_GAIN <= 0.24);

  for (let index = 0; index < FRACTURE_PARK_VOICINGS.length; index += 1) {
    const current = FRACTURE_PARK_VOICINGS[index];
    const next = FRACTURE_PARK_VOICINGS[(index + 1) % FRACTURE_PARK_VOICINGS.length];
    assert.deepEqual(current.allowedPitchClasses, PARK_CHORD_PITCH_CLASSES[current.id]);
    assert.equal(current.notes.length, 4);
    assert.ok(Math.min(...current.notes) >= 60, `${current.id} entered the bass register`);
    assert.notDeepEqual(current.notes, next.notes, `${current.id} repeats immediately`);
    for (const midi of current.notes) {
      assert.ok(
        current.allowedPitchClasses.includes(((midi % 12) + 12) % 12),
        `${current.id} contains non-chord MIDI ${midi}`,
      );
    }
    const largestMove = Math.max(...current.notes.map((midi, voice) => (
      Math.abs(next.notes[voice] - midi)
    )));
    assert.ok(largestMove <= 2, `${current.id} -> ${next.id} jumps ${largestMove} semitones`);
  }
});

test("FRACTURE PARK audibly changes voicing without beat, bass, repetition or a loud drone", () => {
  const render = renderPark();
  const visited = [];
  for (const snapshot of render.snapshots) {
    assert.equal(snapshot.motionLane, "PARK");
    assert.equal(snapshot.perceivedTempo, null);
    assert.equal(snapshot.beat, false);
    assert.equal(snapshot.bass, false);
    if (visited.at(-1) !== snapshot.parkVoicing) visited.push(snapshot.parkVoicing);
  }
  assert.deepEqual(visited.slice(0, 6), FRACTURE_PARK_VOICINGS.map(({ id }) => id));
  assert.ok(render.core.snapshot().parkVoicingChanges >= 6);

  const { peak, rms } = signalMetrics(render.left, render.right, SAMPLE_RATE * 2);
  assert.ok(rms >= 0.0025, `PARK disappeared below a useful floor (${rms})`);
  assert.ok(rms <= 0.008, `PARK is too loud for a stopped vehicle (${rms})`);
  assert.ok(peak <= 0.05, `PARK has an exposed transient or excessive peak (${peak})`);
  assert.ok(peak / rms <= 7, `PARK is punctuated like a beat (crest ${peak / rms})`);

  // Near the end of each hold, the previous bank's tail has cleared. At least
  // three of the four authored tones must still sit within 18 dB of the
  // strongest one: this prevents a valid chord table feeding one audible note.
  let voicingStart = 0;
  for (let index = 0; index < FRACTURE_PARK_VOICINGS.length; index += 1) {
    const hold = FRACTURE_PARK_HOLD_SECONDS[index];
    const probeStart = voicingStart + hold - 1.2;
    const powers = FRACTURE_PARK_VOICINGS[index].notes.map((midi) => (
      stereoPitchPower(render, probeStart, 0.8, midi)
    ));
    const strongest = Math.max(...powers);
    const audibleTones = powers.filter((power) => power >= strongest * 0.0158).length;
    assert.ok(
      audibleTones >= 3,
      `${FRACTURE_PARK_VOICINGS[index].id} collapsed to ${audibleTones} audible tones`,
    );
    voicingStart += hold;
  }
});

test("FRACTURE PARK recovers its authored level after a high-energy drive", () => {
  // The production limiter once retained the loudest double-precision peak
  // after its Float32 history had rounded that sample. PARK then returned about
  // 10 dB below its launch level and no longer provided a constant background.
  const sampleRate = 16000;
  const core = createScoreCore({ sampleRate });
  const initialPark = renderCoreSegment(core, 0, 8, sampleRate);
  const drive = renderCoreSegment(core, 110, 20, sampleRate);
  assert.ok(drive.peak > 0.6, "the fixture never exercised limiter gain reduction");

  renderCoreSegment(core, 0, 3, sampleRate);
  const returnedPark = renderCoreSegment(core, 0, 8, sampleRate);
  const recoveryDb = 20 * Math.log10(returnedPark.rms / initialPark.rms);
  assert.ok(
    Math.abs(recoveryDb) <= 3,
    `returned PARK moved ${recoveryDb.toFixed(1)} dB from its authored level`,
  );
  assert.ok(returnedPark.rms >= 0.0025, `returned PARK fell below its useful floor (${returnedPark.rms})`);
  assert.equal(core.snapshot().motionLane, "PARK");
  assert.equal(core.snapshot().beat, false);
  assert.equal(core.snapshot().bass, false);
});

test("the full FRACTURE reference preserves its loudness target and true-peak margin", (context) => {
  const { left, right } = renderReferenceDrive();
  const loudness = integratedLoudness(left, right);
  const truePeakDb = 20 * Math.log10(truePeak(left, right));

  context.diagnostic(
    `FRACTURE trajectory: ${loudness.toFixed(3)} LUFS, ${truePeakDb.toFixed(3)} dBTP`,
  );

  assert.ok(loudness >= -16.8, `full reference fell below its working level (${loudness.toFixed(1)} LUFS)`);
  assert.ok(loudness <= -15.2, `full reference became over-limited (${loudness.toFixed(1)} LUFS)`);
  assert.ok(truePeakDb <= -0.8, `full reference exceeded its true-peak margin (${truePeakDb.toFixed(1)} dBTP)`);
});
