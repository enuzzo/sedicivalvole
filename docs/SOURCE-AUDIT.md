# Bootstrap Source Audit

Audit date: **2026-08-26**. All inspected source material remains under the Git-ignored `_references/` tree.

## Integrity and safety

| Check | Result |
|---|---|
| Original archive | `files (1).zip` |
| SHA-256 | `b70b8dd0b6445822b8bb28db0d64c7f67b97600df89bb7a11fbe694610b1ef96` |
| Outer ZIP integrity | PASS, 4 entries |
| Nested ZIP integrity | PASS, 35 entries: 21 files and 14 directories |
| Symlinks | none |
| Absolute paths | none |
| Parent traversal paths | none |
| Duplicate payloads | no harmful duplicate payload identified |

The outer ZIP is **2,475,020 bytes** and expands to **2,514,829 bytes**. The nested `sedicivalvole-starter.zip` is **2,451,713 bytes**. The original archive was preserved unchanged and its hash was rechecked after relocation.

## Material inventory

The bootstrap includes:

- a product brief and mode specifications;
- `feel-the-beat.html`, a single-file Web Audio music demo;
- an engine/audio-worklet prototype;
- Python analysis/generation experiments and cached bytecode;
- six Markdown documents, a README, and an MIT license;
- rendered technical charts for I4, V8, V12, and V-twin experiments;
- an anomalous literal brace-expansion directory;
- no audio sample files.

The project reference library therefore keeps `audio/` and `visual/` ready for future, separately reviewed material.

## Suspicious or accidental structure

A literal directory resembling `{docs,lab/.../note,src}/` appears to be the residue of an unexpanded shell brace expression. It is harmless but not intentional product structure.

A Python cache artifact is consistent with `sedicivalvole_lab.py`. It was neither loaded nor executed. No received script or binary was executed before inspection.

## Visual review

The included images are technical plots, not art-direction references. Several show `ROMBO LAB` while the included generator produces `SEDICIVALVOLE LAB`, so the outputs do not exactly correspond to the supplied current script.

The two HTML files were rendered at a neutral desktop viewport of **1280×720**, not represented as a Tesla viewport. The launch state is restrained, but the overlay behavior and underlying state transitions are inconsistent.

## `feel-the-beat.html` findings

Useful ideas:

- a 16-step sequencer;
- speed/energy thresholds that introduce additional rhythmic and harmonic layers;
- a clear relationship between simulated motion and musical structure.

Concrete problems:

- the simulator jumps immediately to roughly **80 km/h**;
- tempo clamps at **190 BPM** at moderate speeds and becomes frantic;
- a progression counter uses a step value already wrapped to 0–15, so the promised long progression never advances;
- layer thresholds lack hysteresis, dwell, and bar quantization;
- many short-lived oscillators and noise buffers create garbage-collection risk;
- the promised Haversine fallback is absent;
- service worker, PWA, pack loading, WASM, and Tesla tests are proposals rather than implemented features.

The current Drive Lab reuses the useful sequencer/layering concept but replaces the high-speed tempo behavior with a knee and asymptotic musical ceiling.

## Python laboratory findings

Python syntax is valid. Full reproduction was not attempted because the project provides no requirements file or lockfile and SciPy is absent; no implicit dependencies were installed.

Scientific limitations:

- a “16 resonances out of 16” result counts the nearest true peak and omits false positives;
- a simplified summed-cylinder signal does not prove separate banks, unequal headers, or crossplane burble;
- the experiment estimates frequencies, not perceptual authenticity;
- a circular synthetic test measures recovery of the generator's own assumptions, not fidelity on real recordings, noise, Doppler, or variable microphones.

Conclusion: the lab is a useful research hypothesis, not validated science or a production-ready engine model.
