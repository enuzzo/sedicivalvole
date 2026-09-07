# Engine acoustics study — 2026-09-07

Status: focused source research and an original, independently tested transmission
gain helper. This document does not admit a new sound bank or claim target-vehicle
listening acceptance. Product baseline inspected: `e9e647e`, with Engine sound
source `7285ecb` and automatic diagnostic source `b27975d` already published.

## Findings that change the next work

The owner's complete build `20260907-1936` report contains 30 scheduled and 30
committed automatic shifts, reaching fifth gear. Its final Engine state is fresh
GPS, 600 RPM and confirmed standstill. The road control path demonstrably executed
on this drive; the earlier complaint must not remain the only account of its
status. The report still cannot prove acoustic pitch, timbre, or comfortable cabin
loudness. It has a final RPM snapshot, but no comparable sampled RPM history.

The same report records these profile preparation intervals:

| Requested bank | Selection to `engine.bank.ready` | Interpretation |
|---|---:|---|
| First Rosso selection | 14.0183 s | Long cold preparation; transfer versus decode was not separately timed |
| First Touring selection | 11.8356 s | Long cold preparation despite the smaller decoded bank |
| Return to Mono | 0.7373 s | Substantially faster warm return |
| Return to Rosso | 0.7490 s | Substantially faster warm return |

These are readiness latencies, not measured durations of silence. Diagnose the
existing selection/transport behavior before deciding between a continuous old
bank, early preparation or an additional cache. Preloading every decoded profile
would undermine the current memory policy. Keep requested and audible identity
distinct if the outgoing bank continues during preparation.

Two acoustic control issues are visible in the current code:

1. `src/engine/runtime.js`, `gainsFor()` and `targets()`, keep `tranny_on` and
   `tranny_off` audible at zero and during TAMARRO's displayed Neutral. Their pitch
   also follows engine RPM without road speed or gear. This can put a road
   transmission whine underneath a stationary engine rev. It is a host-layer
   modeling issue; no new WAV is needed to remove it.
2. Core sample detune follows `(rpm - referenceRpm) * 0.2`. Thus a 600→3,000 RPM
   sweep changes a given sample's playback ratio by only approximately 1.32×,
   despite a fivefold virtual RPM increase. This is an authored mapping, not
   proportional shaft pitch. Mono assigns 1,000 RPM to all four distinct core
   loops, so treating these labels as measured references would be unjustified.

For a measured sample, proportional resampling would use
`rate = virtualRpm / referenceRpm`, or `1200 * log2(rate)` cents. Web Audio's
detune/rate relationship is normative; a particular recording's reference RPM
is not. Do not apply this equation blindly across the current bank.
[Web Audio specification](https://webaudio.github.io/web-audio-api/#AudioBufferSourceNode).

## First integration: clean up the existing instrument

Prioritize profile preparation reliability and sampled Engine evidence. The first
sound-only change should gate the existing transmission layers at known movement,
without altering the engine-core gains, limiter, sample pitch, master loudness,
dry routing, current WAV bytes or selected visual.

`src/engine/driveline-audio.js` supplies the original pure
`drivelineAudibility({ rawSpeedKmh, speedKmh, freshness, neutral, gear })` helper.
It returns zero for actual zero, unknown/invalid speed, degraded/lost motion,
Neutral or invalid gear. During fresh movement, the lower raw/filtered speed
grows smoothly to full audibility at 5 km/h. This threshold is a project tuning
seed, not measured vehicle physics. Actual raw zero wins over a lingering filtered
speed. Call it with Neutral throughout TAMARRO, then multiply only the existing
transmission gains. Preserve the runtime's audio-clock parameter smoothing.

The dedicated `tests/engine-driveline-audio.test.mjs` has five passing tests for
stop/filter disagreement, neutral revs, invalid evidence, smooth bounded creep
and gear-independent gain. Runtime integration and real-WAV browser verification now pass. Verified checks: Mono and Rosso transmission nodes
silent at zero and during TAMARRO, original core still non-silent, normal road
whine retained, no peak increase, and no Flux routing change. Touring has no
transmission loops and should remain acoustically unchanged.

## Sources worth using next

The owner-provided reference list and sanitized study were read first. The prior
owner-kit source assessment and candidate architecture/parameter ledger were
inspected under the owner's later informed-review authorization. No competitor
code/audio or quarantined recordings were opened, copied or admitted. Historical
study approval holds do not supersede the owner's current exact donor decision.

| Source and verified pin | What it adds | Admission boundary |
|---|---|---|
| [Mark Oosting — engine-audio](https://github.com/markeasting/engine-audio/tree/b8cf9887c914f17c2f006d68427080e39d02d0b0) | Current browser sample donor, separate drive/coast timbres and transmission layers | Already authorized exact MIT integration; independent recording ownership remains unverified |
| [ATG / Dan — VehicleNoiseSynthesizer](https://github.com/ATG-Simulator/VehicleNoiseSynthesizer/tree/4241caca5a18be0d47f0b8586df93b1b42d7020d) | Neighbouring RPM regions with stable selection; explicit tip-in, tip-out and shift events | MIT code study; Unity/Burst/NWH topology is not a browser integration; demo recordings are not newly admitted |
| [DasEtwas — enginesound](https://github.com/DasEtwas/enginesound/tree/e5fcca587397c0c8ba9c9d24874b951fed74d260) | Procedural cylinder/intake/exhaust waveguides; headless WAV export with warmup and loop preparation | MIT code; promising offline tool, not a shipped dependency or an imported example recording |
| [Antonio-R1 — engine-sound-generator](https://github.com/Antonio-R1/engine-sound-generator/tree/c76c5adb9e63f5a54fb0def3b97e8e0ac1a7dea1) | An existing AudioWorklet implementation and a C++/WASM version of a waveguide engine | MIT code; no audio assets in the inspected tree; separate bundled Three.js notice required if reused |
| [Ange Yaghi — engine-sim](https://github.com/ange-yaghi/engine-sim/tree/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630) | Deeper physical excitation and firing/path-length study | Retain as research/offline candidate; complete upstream graph includes WAV impulse responses, so default output is not automatically asset-free |

The new repository pins above were checked against GitHub's commit/tree API on
September 7. DasEtwas declares [MIT](https://github.com/DasEtwas/enginesound/blob/e5fcca587397c0c8ba9c9d24874b951fed74d260/LICENSE)
and Antonio-R1 declares [MIT](https://github.com/Antonio-R1/engine-sound-generator/blob/c76c5adb9e63f5a54fb0def3b97e8e0ac1a7dea1/LICENSE).
DasEtwas's only listed audio file is `example.mp3`; the inspected `src/gen.rs`
generates excitation and waveguide output without loading it. This makes an
authored, reproducible offline loop experiment attractive. It does not establish
that every possible imported preset or generated output has acceptable provenance.

The earlier SyedOmarNooredu source has no established reuse licence in the owner
study and remains excluded. SenaTaka's browser simulator was encountered as a
comparison, but its licence was not established in this focused pass; no code or
assets were admitted. Real Engine Simulator remains an ordinary public behavior
reference, not a code or audio donor.

## Research that can guide a better bank

[Baldan, Lachambre, Delle Monache and Boussard (2015)](https://air.iuav.it/handle/11578/264484)
describe a physically informed engine model. Antonio-R1 and DasEtwas explicitly
cite this work. It supports investigating separate excitation and resonances
instead of trying to manufacture every engine identity from one pitch-shifted
loop. The institutional abstract and repository implementations were reviewed;
the full PDF did not load in this pass, so no equation-level paper audit is claimed.

[Doerfler and Wyse's Pulse-Train-Resonator paper (2026)](https://arxiv.org/abs/2603.09391)
models firing pulses and exhaust resonators rather than only harmonic magnitudes.
Its useful design lesson here is cycle timing plus load-dependent articulation.
The reported reconstruction improvement is against their own synthetic benchmark,
not proof of a more convincing Tesla experience. Their
[code repository](https://github.com/rdoerfler/ptr-model) uses CC BY-NC 4.0;
under this project's no-Creative-Commons-software policy it remains a research
reference, not a software donor. There is no reason to add neural inference to
the production browser for the next Engine improvement.

The authors' [Procedural Engine Sounds Dataset](https://huggingface.co/datasets/rdoerfler/procedural-engine-sounds)
is a separate, explicit CC BY-NC 4.0 audio release: about 19 hours across 5,935
files. The four-channel WAVs contain stereo sound plus sample-aligned RPM and
torque control channels. Those control channels must never be played as audio.
It is promising for comparing analysis methods and measuring pitch tracking
without guessing an RPM label. It represents fictional procedural engines, not
recordings of identified real cars. It has not been downloaded or added to the
product; the audio licence and attribution must be handled separately from our
software licence before any later selected extract is distributed.

## Bounded experiment queue

| Order | Experiment | Success evidence |
|---|---|---|
| 1 | Preserve reliable sound during selected-bank preparation; instrument transfer/decode/ready timing and sampled RPM | Fault-injected selection tests, real-WAV meter continuity, accurate requested/audible identity, bounded memory |
| 2 | Integrate the transmission gate above | Stop/Neutral silences only road whine; moving original trim retained; no peak increase |
| 3 | Measure current core loops before changing pitch | Exact SHA, native sample rate, repeat period/order candidates, spectral stability, loop-edge discontinuity and explicit uncertainty per asset |
| 4 | Render one original procedural four-cylinder study with DasEtwas, using an authored preset and no example audio or imported IR | Reproducible pinned tool/config, 600–8,000 RPM coverage, drive/coast contrast, seamless loops, bounded peaks; A/B comparison before a new public profile |
| 5 | Prototype a small cycle-locked intake/exhaust layer from an admitted MIT waveguide implementation | No dependence on uncertain recordings; shared context, bounded worklet cost and lifecycle recovery; demonstrated audible value beyond extra noise |

The old study already proposed sample calibration, discrete acoustic events,
transmission ownership and later procedural synthesis. These are recovered
unfinished research items. The two additional MIT implementations and the
annotated 2026 research are new leads. A full physical simulator/WASM port, turbo
and blow-off, more catalog profiles, and new Engine visuals remain larger
experiments; none is necessary to ship the immediate reliability and whine fix.

## Measurement follow-through — September 7 evening

The read-only core-loop measurement is now complete:
[summary](../prototype/drive-lab/analysis/engine-loop-measurements.md),
[exact numeric artifact](../prototype/drive-lab/analysis/engine-loop-measurements.json),
and [reproducible original analyzer](../prototype/drive-lab/analysis/engine_loop_audit.py).
All 12 active core WAV hashes match their admitted inventory. Three Mono seams
are exceptional relative to their own interior sample differences: maximum wrap
steps are 0.68341 FS for on_high, 0.70541 FS for off_high and 0.65820 FS for
off_low. These are measurable discontinuities, not a claim that the owner heard
three distinct clicks. No source declares an authored sampler loop region.

An original decoded-tail helper, `src/engine/loop-seam.js`, now implements a
10 ms complementary blend only for those outliers. The original WAV bytes stay
unchanged. The prepared loop starts after the head that is blended into its tail;
both blend boundaries preserve neighbouring source samples. This cannot raise
the decoded source peak, and the native-file tests measure less than 0.02 dB
steady-loop RMS change per channel. It avoids a recurring fade to silence.
The helper is integrated before bank level matching and has five focused tests.
The tests include the actual 12 native core WAVs and a 44.1 kHz overshoot case;
the original bytes remain unchanged.

Isolated Chrome checks at both 48 kHz and 44.1 kHz found and verified a decoded
headroom issue. Resampling Mono's 48 kHz PCM to 44.1 kHz produces finite peaks up
to 1.01565 FS. Rejecting every value above 1 FS incorrectly skipped all repairs.
The helper now permits finite decoded values up to 2 FS, measures interior steps
in a correspondingly bounded 0–4 FS histogram, and preserves the original peak
through its complementary blend; it does not clip or normalize the decoded data.
Values outside that bound and nonfinite data still leave the buffer untouched.

The runtime's seam gate is greater than 0.08 FS and greater than 3.25 times the
interior absolute-step p99.9 upper bound. This is an empirical bank-specific
criterion calibrated against both browser sample rates, not a physical constant
or a claim of audible click probability. The native discovery artifact retains
its original 3.5-ratio cue; browser resampling reduced Mono on_high's ratio to
3.436 even while its wrap remained 0.65105 FS. The final 3.25 gate selects exactly
Mono on_high, off_high and off_low at both tested rates; Mono on_low and all eight
Rosso/Touring core roles remain unmodified. No derivative-rescaling model is
assumed.

Both browser runs passed the same actual-audio graph checks: nonzero core output
at standstill, silent transmission during standstill/TAMARRO, moving output,
three seconds of poor-accuracy RPM hold and recovery, long-loss idle, uninterrupted
old-bank output during a forced 5.4-second preparation delay, truthful Media
Session playback state, authoritative mute, and sampled Engine diagnostic fields.
Every admitted WAV hash remained unchanged. The 773 × 601 captures show the
current Engine interface. Both diagnostic endpoints were intercepted, no mail
was sent, and no page exceptions occurred; two pre-gesture autoplay warnings
preceded successful audio activation. Evidence is in the temporary session
artifacts `/tmp/sv-night-engine-qa/evidence.json` and
`/tmp/sv-night-engine-qa-44100/evidence.json`. These are headless browser signal
and rendering checks with controlled GPS observations, not in-vehicle listening
acceptance.

The spectral/autocorrelation measurements also confirm why RPM calibration is
still open: each file offers multiple plausible periodicities. No cylinder/order
identity has been established, so every inferred RPM remains explicitly null.
