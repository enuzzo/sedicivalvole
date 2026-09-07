# Engine acoustic campaign — 2026-09-08

Implemented and verified locally; canonical publication evidence is recorded
below when complete. This is an original acoustic model for entertainment, not
measured vehicle telemetry or a full thermodynamic simulator.

## What changes for a listener

| Voice | Character and implementation |
|---|---|
| Mono | Existing admitted loops at their original level plus an original four-cylinder cycle-locked core |
| Rosso | Existing expressive sample bank; profile crossover, road load and phased automatic shifts |
| Touring | Existing lower character sample bank; separate crossover and slower phased shifts |
| Otto | Original crossplane V8, uneven events per bank, two exhaust paths, lower virtual redline and slower engagement |
| Cinque | Original five-cylinder pulse sequence, load-driven compressor spool and pressure release after a real acoustic lift |
| Turbine | Original shaft/airflow voice, slower spool, no piston firings or stepped gearbox |

Launch, running Telemetry and media previous/next share one six-entry catalogue.
The selected visual is retained. Compact Engine launch cards keep START visible
at 773 × 601, while short phone windows retain their existing scroll behavior.
No new recording, third-party source, preset, impulse response or dependency was
added. Existing engine-audio code/configuration lineage and its sixteen WAV
hashes remain recorded; the recording-ownership follow-up is still unresolved.
See [source comparison](ENGINE-SOURCE-COMPARISON-2026-09-08.md).

## Motion, powertrain and audio boundaries

`motion.js` still decides whether evidence is fresh, degraded or lost. Original
`powertrain.js` derives an artistic normalized load using acceleration and a
bounded speed-dependent rolling/drag proxy. It never claims pedal, torque or CAN
access. The six-step acoustic gearbox retains nominal 35/65 km/h road upshifts,
hysteresis, dwell and overrev rejection; profile ratios, redline and shift timing
distinguish the instruments. Turbine deliberately has no shift decisions.

Each shift schedules one immutable AudioContext-time plan: release, RPM
synchronization, downshift rev match where needed, then load return. Samples
and procedural AudioParams use the same boundaries. The UI samples that plan;
it does not schedule combustions. Transmission sample pitch now follows wheel
speed instead of crank RPM. There is no master-gain duck on moving lift or shifts.

The original worklet emits fractional-time pressure pulses on a 720-degree
cycle, distinct bank paths, resonant exhaust/intake delays and rate-aware filters.
Pulse tails end smoothly. Turbo spool retains state; a separate event gate
prevents stale GPS, hidden state or clock gaps from becoming a blow-off event.
Intentional no-GPS TAMARRO remains available, confirmed exact-zero observations
still own automatic idle blips, and movement/mute/lifecycle cancel gestures.
An eight-millisecond worklet fade avoids a hard-zero mute transition.

The host preserves the shared dry graph and its limiter/watchdog. The worklet
loads lazily as a self-contained asset, including in protected LAB packaging.
Import/readiness cancellation frees selection promptly; processor failures enter
bounded retry and keep any healthy sample fallback audible. No overlapping
profile preparation is admitted. WAV-derived decode reservation precedes
decode: 64 MiB per bank, 128 MiB for accounted outgoing/incoming/encoded buffers.
This is not a limit on native decoder overhead or total browser memory.

## Repeatable audio evidence

The production runtime, production motion receiver and admitted WAVs render a
seeded 45-second journey: no-GPS TAMARRO, confirmed idle, 0–90 km/h acceleration,
cruise, lift/downshift, recovery and stop. Baseline source is fd17828, preserved
before edits. All six final voices were rendered at 44.1 and 48 kHz. The harness
uses a real Chromium OfflineAudioContext, paused at quantum boundaries for
25 ms control ticks; artificial instrumentation state changes are suppressed.
Real lifecycle is validated separately in the running browser. Both mail
endpoints are intercepted, and offline audio fixtures block external origins.

| Mono, 48 kHz dry output | Baseline | Final |
|---|---:|---:|
| RMS | 0.061417 | 0.063700 |
| Peak | 0.214994 | 0.221757 |
| Maximum adjacent sample step | 0.137264 | 0.064782 |
| Clipped / invalid samples | 0 / 0 | 0 / 0 |

RMS changes by +0.317 dB; the reduced maximum sample step is a signal result, not
a listener preference. Exported A/B excerpts play before, 0.5 s silence, then
after. Only listening copies attenuate the final by 0.317 dB; original dry files
remain unchanged. Baseline repeated traces/events agree; a few PCM samples
differ by one 16-bit quantization step, so byte-identical rendering is not claimed.

The 12 browser audio renders have finite, unclipped nonzero output. Each geared
journey commits six shifts; Turbine commits none. Direct DSP evidence adds 48
steady cases and four uninterrupted 60-second cases, with exact firing counts,
distinct 100/125/200 Hz orders at 3000 RPM and measurable per-bank V8 character.
The initial turbo high-frequency pressure release motivated a filtered envelope:
Cinque's 48 kHz maximum adjacent step fell from approximately 0.203 to 0.049.

[Machine-readable audio evidence](qa/2026-09-08-engine/audio-metrics.json).
Full WAV/CSV/event/source evidence is retained locally, outside version control,
at `_references/audio/engine/campaign-20260908/`, in baseline, final, final-dsp
and final-comparison folders. No isolated donor stem is newly published.

Reproduction uses the existing native wrapper and existing Playwright/Chrome.
Set PLAYWRIGHT_MODULE and CHROME_EXECUTABLE to installed locations.

```sh
node scripts/native-toolchain.mjs -- node scripts/qa-engine-campaign.mjs --label=current --profiles=mono,rosso,touring,otto,cinque,turbine
node scripts/qa-engine-campaign-dsp.mjs
node scripts/qa-engine-campaign-compare.mjs --before=/path/to/baseline --after=/path/to/current
```

Commands above run from prototype/drive-lab. Use --source to replay a saved
Engine source snapshot without changing the active checkout. Tools also export
control cost and spectral measurements. Mac offline throughput, Node DSP cost
and live browser pacing are separate evidence; none proves Tesla thermal,
real-time audio or cabin listening acceptance.

## Remaining physical acceptance

Listen in the Tesla cabin at idle, TAMARRO, normal-road shifts, cruise and lift,
including quiet and high-load turbo behavior. Confirm character preference and
balance between engines, watch long-session temperature/audio continuity, and
check native media/lifecycle recovery. iPhone Safari/device acceptance and the
first real automatic diagnostic inbox receipt remain separate existing tasks.
No synthetic diagnostic mail was sent.
