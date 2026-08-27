// Reading the local sample library.
//
// Development-time only. The libraries under `_references/audio/samples/` are
// MusicRadar SampleRadar packs: royalty-free to use in music, explicitly not
// redistributable. Nothing here copies a loop into the repository or into a
// build — this module exists so the *authoring* step can compose with them, and
// what ships is the rendered sedicivalvole arrangement. See
// THIRD_PARTY_NOTICES.md.
//
// The library is unusually regular and the arrangement depends on it:
//
//   - every beat loop is exactly two bars;
//   - loops are sorted into folders by tempo, 158 to 172 BPM;
//   - the key is in the filename, and E exists at every tempo;
//   - everything is 24-bit 44.1 kHz stereo.
//
// Because the tempo is a folder rather than a stretch factor, a tempo change is
// a change of *recording* at its own native rate. No loop is ever time-stretched
// or pitched, which is the whole reason the arrangement is built this way.

import { execFile } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export const LIBRARY_ROOT = "/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick"
  + "/sedicivalvole/_references/audio/samples";

export const JUNGLE_ROOT = join(LIBRARY_ROOT, "Jungle Samples");
export const RAVE_ROOT = join(LIBRARY_ROOT, "Rave Synths");

/** The tempo folders the jungle pack ships, in order. */
export const TEMPOS = [158, 160, 164, 166, 168, 170, 172];

/** Every beat loop is two bars. The arrangement relies on this being exact. */
export const LOOP_BARS = 2;

export async function libraryAvailable() {
  try {
    await stat(JUNGLE_ROOT);
    return true;
  } catch {
    return false;
  }
}

/**
 * Decodes any audio file to interleaved 32-bit float at a chosen rate.
 *
 * ffmpeg rather than a WAV parser: the packs are 24-bit, which needs handling a
 * hand-written reader would only get subtly wrong, and this also normalises
 * everything to one rate and channel count in a single step.
 */
export async function decode(path, sampleRate = 48000) {
  const { stdout } = await run("ffmpeg", [
    "-v", "error",
    "-i", path,
    "-f", "f32le",
    "-acodec", "pcm_f32le",
    "-ac", "2",
    "-ar", String(sampleRate),
    "-",
  ], { encoding: "buffer", maxBuffer: 1 << 28 });

  const interleaved = new Float32Array(
    stdout.buffer, stdout.byteOffset, Math.floor(stdout.byteLength / 4),
  );
  const frames = Math.floor(interleaved.length / 2);
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);
  for (let frame = 0; frame < frames; frame += 1) {
    left[frame] = interleaved[frame * 2];
    right[frame] = interleaved[frame * 2 + 1];
  }
  return { left, right, frames, sampleRate };
}

/**
 * Parses what a filename declares.
 *
 * `Jungle_BeatA_168_01.wav` -> kind Beat, set A, tempo 168, variant 01
 * `Jungle_BassC_168_E.wav`  -> kind Bass, set C, tempo 168, key E
 */
export function describe(path) {
  const name = basename(path, ".wav");
  const match = name.match(/^Jungle_(Beat|Bass)([A-D])_(\d+)_(.+)$/);
  if (!match) return { name, kind: null };
  const [, kind, set, tempo, tail] = match;
  return {
    name,
    kind: kind.toLowerCase(),
    set,
    tempo: Number.parseInt(tempo, 10),
    variant: kind === "Beat" ? tail : null,
    key: kind === "Bass" ? tail : null,
  };
}

/** Every jungle loop at one tempo, described. */
export async function loopsAtTempo(tempo) {
  const directory = join(JUNGLE_ROOT, `${tempo}bpm`);
  const files = await readdir(directory);
  return files
    .filter((file) => file.endsWith(".wav"))
    .map((file) => ({ ...describe(file), path: join(directory, file) }))
    .filter((entry) => entry.kind !== null)
    .sort((first, second) => first.name.localeCompare(second.name));
}

/** Seconds one loop occupies at its own tempo. */
export function loopSeconds(tempo, bars = LOOP_BARS) {
  return (60 / tempo) * 4 * bars;
}
