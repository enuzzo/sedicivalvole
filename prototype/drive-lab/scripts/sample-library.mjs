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

// ---------------------------------------------------------------------------
// Multisampled instruments
//
// The rave pack ships true multisamples: one file per chromatic note across
// three or four octaves. That is what makes it possible to play *our own*
// melodies on these instruments rather than replay someone else's phrase, and
// it is why the second score can have real variety without stretching anything.
//
// Because coverage is chromatic, the nearest sample is never more than a
// semitone away, and in practice a note is either exact or a fraction of one.
// ---------------------------------------------------------------------------

const NOTE_OFFSETS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** `A#3` -> MIDI number. Returns null for anything that is not a note name. */
export function noteToMidi(name) {
  const match = String(name).match(/^([A-G])(#?)(-?\d)$/);
  if (!match) return null;
  const [, letter, sharp, octave] = match;
  return NOTE_OFFSETS[letter] + (sharp ? 1 : 0) + (Number.parseInt(octave, 10) + 1) * 12;
}

export const RAVE_INSTRUMENTS = [
  "Rave_Lead", "RavePiano", "Short_String", "Rave_Saw", "Buzz",
  "Crunchy_Sub", "Stab_FX", "Pitched_Piano_Stab", "Pitched_String_Hit",
];

/**
 * Loads one multisampled instrument as a MIDI-keyed map of decoded buffers.
 *
 * Filenames are tolerated rather than trusted: at least one file in the pack is
 * named `RavePiano_A#2..wav`, and a strict parser would silently drop it.
 */
export async function loadInstrument(name, sampleRate = 48000) {
  const directory = join(RAVE_ROOT, "Multis", name);
  const files = (await readdir(directory)).filter((file) => file.endsWith(".wav"));
  const notes = new Map();
  for (const file of files) {
    const stem = basename(file, ".wav").replace(/\.+$/, "");
    const midi = noteToMidi(stem.split("_").pop());
    if (midi === null) continue;
    notes.set(midi, await decode(join(directory, file), sampleRate));
  }
  if (notes.size === 0) throw new Error(`no playable notes found in ${name}`);
  return { name, notes, keys: [...notes.keys()].sort((a, b) => a - b) };
}

/**
 * The sampled note to play a wanted pitch from, and the rate to play it at.
 *
 * A pitch outside the instrument's range is folded by whole octaves until it is
 * inside. Folding rather than clamping matters: clamping to the top note would
 * flatten a melody's shape into a repeated note, and stretching a sample five
 * semitones to reach a pitch it does not have is exactly the artefact this
 * whole design exists to avoid. Every instrument keeps its own natural
 * register, which is a source of variety rather than a limitation.
 */
export function nearestNote(instrument, midi) {
  const lowest = instrument.keys[0];
  const highest = instrument.keys.at(-1);
  let wanted = midi;
  while (wanted > highest && wanted - 12 >= lowest) wanted -= 12;
  while (wanted < lowest && wanted + 12 <= highest) wanted += 12;

  let best = lowest;
  for (const key of instrument.keys) {
    if (Math.abs(key - wanted) < Math.abs(best - wanted)) best = key;
  }
  return { key: best, rate: 2 ** ((wanted - best) / 12), playedMidi: wanted };
}

/** Chord one-shots from the jungle pack, keyed by the chord in the filename. */
export async function loadChordHits(sampleRate = 48000) {
  const directory = join(JUNGLE_ROOT, "Synth One Shots");
  const files = (await readdir(directory)).filter((file) => file.endsWith(".wav"));
  const hits = [];
  for (const file of files) {
    const match = basename(file, ".wav").match(/^Jungle_([A-Za-z-]+)_(.+)$/);
    if (!match) continue;
    hits.push({
      instrument: match[1],
      chord: match[2],
      path: join(directory, file),
      buffer: await decode(join(directory, file), sampleRate),
    });
  }
  return hits;
}
