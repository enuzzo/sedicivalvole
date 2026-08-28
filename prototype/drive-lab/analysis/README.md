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

This first stage records file identity, envelope segmentation, tuning and Basic
Pitch note proposals. It deliberately writes `pitch_set_midi: null` and
`chord_label.value: unknown`: no proposal is accepted until the deterministic
harmonic-residual arbiter has passed synthetic ground-truth tests. The tool does
not rename, move, delete, rewrite, or admit source material.

## Acceptance boundary

Before automatic pitch sets can become authoritative, the arbiter must achieve:

- at least `0.90` recall for a deliberately voiced C-sharp at `-20 dB`;
- at most `0.05` false positives when C-sharp is absent;
- the same result across the agreed saturation test grid;
- an explicit `unknown` whenever the sustain is too short or the methods do not
  have enough independent evidence.

Chroma plots may support human inspection, but pitch-class chroma never votes:
folding octaves together cannot distinguish a separately voiced note from an
overlapping harmonic.
