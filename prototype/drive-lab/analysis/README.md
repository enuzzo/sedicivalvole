# Sample harmony analysis

This development-only pipeline inventories the actual audio content of tonal
source material before it can influence the generative selector. A filename is
treated as a declaration to verify, never as ground truth.

The first pilot is intentionally limited to the eight JUNCTION chord one-shots
that are reachable today: two source voicings for each of `Emin9`, `Cmaj7`,
`Amin7`, and `Bmin9`. The source pack contains 33 chord one-shots in total.

## Setup

```sh
python3.11 -m venv .sample-analysis-venv
.sample-analysis-venv/bin/pip install -r analysis/requirements.txt
```

The virtual environment is machine-local and ignored by Git.

## Run

```sh
.sample-analysis-venv/bin/python scripts/analyse-sample-harmony.py --junction
```

The default report is written below the ignored `_references/audio/analysis/`
tree. Pass `--output PATH` to choose another destination.

This stage records file identity, envelope segmentation, tuning, Basic Pitch
note proposals and review-only harmonic-residual evidence. It deliberately
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
`0.012246` residual margin. That is evidence that the method can work in its
calibration case, not evidence that it generalises.

## Acceptance boundary

Before automatic pitch sets can become authoritative, the arbiter must retain:

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
