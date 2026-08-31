# Sample harmony analysis

This development-only pipeline inventories the actual audio content of tonal
source material before it can influence the generative selector. A filename is
treated as a declaration to verify, never as ground truth.

The first pilot is intentionally limited to the eight JUNCTION chord one-shots
that are reachable today: two source voicings for each of `Emin9`, `Cmaj7`,
`Amin7`, and `Bmin9`. The source pack contains 33 chord one-shots in total.

## Setup

```sh
/opt/homebrew/bin/python3.11 -m venv .sample-analysis-venv
.sample-analysis-venv/bin/pip install -r analysis/requirements.txt
.sample-analysis-venv/bin/python -m pip check
```

The virtual environment is machine-local and ignored by Git. Recreate it from
the requirements file after moving between Macs or CPU architectures; never
trust or reuse a Dropbox-copied environment. Intel Homebrew installations may
use `/usr/local/bin/python3.11` instead.

## Run

```sh
.sample-analysis-venv/bin/python scripts/analyse-sample-harmony.py --junction
```

The default report is written below the ignored `_references/audio/analysis/`
tree. Pass `--output PATH` to choose another destination.

This stage records file identity, envelope segmentation, tuning, Basic Pitch
note proposals and review-only harmonic-residual evidence. The residual is
excluded from classifier input after the F-sharp2 fixture falsified its threshold.
It deliberately
writes `pitch_set_midi: null` and `chord_label.value: unknown`: passing one
controlled synthetic grid is not enough to make the arbiter authoritative on
detuned, saturated or chorused source material. The tool does not rename, move,
delete, rewrite, or admit source material.

Validate the deterministic synthetic fixture separately:

```sh
.sample-analysis-venv/bin/python scripts/validate-harmonic-arbiter.py \
  --output ../../_references/audio/analysis/harmonic-arbiter-ground-truth.json
```

The first grid tests a separately enveloped C-sharp at `-6`, `-12`, `-20` and
`-30 dB` against overlapping B, A and F-sharp partials at three saturation
drives. It currently reaches `1.0` recall, `0.0` false-positive rate and a narrow
`0.012246` residual margin before F-sharp2 was added. The corrected grid produces
a negative `-0.006729` margin. The validation now passes only when this feature
cannot emit a voiced-versus-harmonic verdict and every audible case abstains.

## Acceptance boundary

Before automatic pitch sets can become authoritative, a replacement evidence
stack must demonstrate:

- at least `0.90` recall for a deliberately voiced C-sharp at `-20 dB`;
- at most `0.05` false positives when C-sharp is absent;
- the same result across the agreed saturation test grid;
- an explicit `unknown` whenever the sustain is too short or the methods do not
  have enough independent evidence.

The first corrected real-audio pass rejected automatic admission: every Basic
Pitch proposal was classified as voiced at the calibrated `0.22` residual
threshold. The closest call, B5 in the Emin9 pad, passed by only `0.006971`.
Shared synth envelopes can therefore erase the synthetic fixture's clean
separation. The next validation grid must vary shared ADSR, detune, chorus,
partial slope and saturation before any real verdict can gate sample selection.

Chroma plots may support human inspection, but pitch-class chroma never votes:
folding octaves together cannot distinguish a separately voiced note from an
overlapping harmonic.

## Reproduce the replacement evidence stack

```sh
npm run analyze:junction-pitch-evidence
```

This command rebuilds the tracked
`analysis/junction-pitch-evidence.json` artifact from deterministic stereo
fixtures. It varies shared ADSR, filter cutoff, oscillator phase seed, detuned
unison, chorus, partial slope, saturation, and stereo placement/coherence. The
phase-aware two-frequency model reaches `1.0` recall and `0.0` false-positive
rate on the valid synthetic cases, while every short-sustain, unresolved-detune,
or independently chorused case returns `unknown` with a named invalidity reason.

That synthetic result does **not** authorize a pitch gate on the published
JUNCTION performances. They are complete processed mixes and do not expose the
isolated-source provenance needed to rule out detune, chorus, or nonlinear
cross-products. The artifact therefore records
`real_audio_pitch_gate_authorized: false`. This explicit abstention replaces the
failed magnitude-residual shortcut; it does not disguise uncertainty as a chord
verdict.

## Review-only source and voicing reports

The independent-source report now retains every inspected harmonic hypothesis,
including rejected ones. Each hypothesis records its measured detection floor,
whether a fundamental crossed that floor, and the minimum candidate-to-source
ratio implied by a bounded null:

```sh
.sample-analysis-venv/bin/python scripts/inspect-independent-harmonic-sources.py \
  ../../_references/audio/analysis/junction-harmony-proposals.json \
  --label Bmin9 \
  --output ../../_references/audio/analysis/bmin9-source-review.json
```

The companion voicing report uses only the standard library and compares note
proposals as actual MIDI registers rather than folded pitch classes. It flags
one- and thirteen-semitone collisions within each take and across every ordered
same-label pair, while leaving rendered loudness, roughness and boundary flux
explicitly unmeasured:

```sh
python3 scripts/inspect-sample-voicings.py \
  ../../_references/audio/analysis/junction-harmony-proposals.json \
  --label Bmin9 \
  --output ../../_references/audio/analysis/bmin9-voicing-review.json
```

Both reports are `review_evidence_only`. They may move a file to the front of a
listening queue; they never produce an admission, rejection, pitch set or chord
verdict.

Audit the renderer's real chord-hit selection before comparing hypothetical
voicings:

```sh
node scripts/inspect-junction-voicing-selection.mjs \
  --output ../../_references/audio/analysis/junction-voicing-selection.json
```

The report mirrors the renderer's filesystem order and exact index expression.
It currently proves that all 24 performances select index zero for every chord
and stab: `section.voicing` and `sectionIndex` advance with matching parity and
cancel modulo two. This is measured selection reachability, not an instruction
to enable the unused recordings. Those recordings still need a compatible-deck
review before they may enter a render.

Measure the internal chord boundaries already printed into the production WAV
without consuming any pitch proposal:

```sh
.sample-analysis-venv/bin/python scripts/inspect-junction-audio-transitions.py \
  --wav renders/junction-sketch-adaptive.wav \
  --bank public/audio/junction.svb \
  --output ../../_references/audio/analysis/junction-rendered-transitions.json
```

This first pass measures Sethares roughness, normalized boundary flux, RMS level
and spectral centroid over each ordinary internal transition. Its thresholds are
explicitly `uncalibrated_flag_only`; it excludes REST's deliberately sparse
grammar, live browser-delay tails and cross-clip runtime boundaries. Those
omissions prevent the report from becoming a production block until the live
transition renderer is added and the probes are calibrated by listening.

## Reproduce the encoded JUNCTION brake calibration

The full-depth brake report is independent of `_references/` and can be rebuilt
from the tracked production bank alone:

```sh
npm run analyze:junction-brake
```

The command decodes all 24 self-contained Ogg performances with local FFmpeg,
applies the runtime 550 Hz low-pass, `0.84/0.16` filtered/residual blend,
`tanh(2x)` WaveShaper and `-4.32 dB` makeup, then recomputes BS.1770 loudness,
energy above 2 kHz after the first 500 ms and processed sample peak. It fails if
the bank hash, DSP parameters, clip identities or any recorded metric drifts by
more than `0.025 dB` or LU. This is a reproducibility gate, not listening
authority.
