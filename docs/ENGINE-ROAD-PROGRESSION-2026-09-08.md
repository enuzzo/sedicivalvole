# Engine road progression — 2026-09-08

The owner wants restrained city driving at 20–40 km/h, with power already
present at 80 and further progression to 130. The former ratios made Mono
approach 7,000 RPM at 30 km/h. That falsely suggested hard acceleration while
cruising through town. This correction changes acoustic motion, not the selected
Telemetry visual or the shared dry master level.

## Road ratios and automatic selection

Each piston character now has six fixed authored gear ratios, its own final
drive, and a 0.32 m virtual rolling radius. Engaged RPM is road wheel RPM times
those two ratios. Ratios do not stretch to put every shift near the limiter.
These are sporting instruments, not replicas of a named car or measured Tesla
engine, pedal, gear or torque data.

| km/h | Mono | Rosso | Touring | Otto | Cinque |
|---:|---:|---:|---:|---:|---:|
| 20 | 2 / 1,801 | 2 / 1,818 | 2 / 1,616 | 2 / 1,409 | 2 / 1,681 |
| 30 | 3 / 1,988 | 3 / 2,053 | 3 / 1,772 | 3 / 1,539 | 3 / 1,862 |
| 40 | 3 / 2,651 | 3 / 2,737 | 3 / 2,362 | 3 / 2,052 | 3 / 2,483 |
| 80 | 4 / 3,997 | 4 / 4,220 | 4 / 3,606 | 4 / 3,111 | 4 / 3,776 |
| 100 | 5 / 4,486 | 5 / 4,634 | 5 / 3,917 | 5 / 3,382 | 5 / 4,170 |
| 130 | 6 / 5,037 | 6 / 5,282 | 6 / 4,364 | 6 / 3,847 | 6 / 4,665 |

Cells are selected gear / calculated coupled RPM at light demand, rounded to
the nearest RPM. They are not recorded audio or real-car measurements. The
runtime's inertia and load response can differ slightly from these targets.
Turbine remains a continuous virtual shaft/airflow voice without piston gears.

Automatic selection separates ratio from shift policy. Light demand changes
early; high inferred demand holds first/second only 4–5 km/h longer, and middle
gears modestly longer. Ordinary downshifts have lower thresholds; kickdown is
disabled below 48 km/h and requires at least a 5 km/h margin below the earliest
subsequent upshift. A 1.1-second dwell and the existing one-pending-shift contract
prevent hunting. Release, RPM synchronization, commit and engagement retain their
shared audio-clock ramps for both samples and synthesis.

The highest-load final upshift enters by 128 km/h: filtered GPS approaches a
held 130 asymptotically, so requiring exact equality would leave fifth engaged.
A real-browser audio comparison exposed this boundary and it has a regression
test.

The 130 km/h ceiling applies to coupled RPM, automatic selection, road load and
transmission pitch. The actual observed speed remains intact for UI/session
data. Acceleration still supplies demand, and stationary TAMARRO still reaches
its authored rev phrase. Neither effect is a reward for exceeding the ceiling.
Loading a bank or recovering after source/lifecycle loss initializes an
appropriate ratio immediately; it does not replay first-through-sixth shifts.

## Audible pitch, not only the tachometer

Core sample detune now uses `1200 * log2(targetRPM / referenceRPM)`, bounded to
two octaves either way. Doubling RPM doubles playback pitch within that range;
the retired linear cents-per-RPM law did not. See the Web Audio
[detune documentation](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/detune).
The current low/high crossfades keep high layers out of ordinary city RPM.

Rosso and Touring retain donor nominal references, which are not independently
calibrated. Mono's four donor 1000 labels are replaced only in the host texture
mapping by one authored 3400 anchor. Multiple spectral periodicities prevent
claiming measured source RPM. The separate Mono firing voice remains precisely
crank-timed; existing WAV bytes and upstream source are unchanged. Resampling
also stretches texture/noise, so mathematical pitch consistency is not a claim
of preferred timbre or perfect replication.

## Ange source and download findings

The original pinned Ange Yaghi repository retains its declared MIT licence.
Ten active WAV impulse responses, their licence and relevant source/scripts
were downloaded into the ignored local reference library with hashes. They
colour generated excitation; they are not a complete engine RPM/load loop bank.
Original and inspected fork code use manual gear/clutch control, not an AUTO
schedule to transplant. The current Community Edition distributes newer builds
without their application source. The older MIT grant does not automatically
license those newer assets.

No new Ange code or WAV is shipped in this correction. The immediately useful
lesson is wheel/gear/final-drive kinematics; licensed convolution experiments
remain available for subsequent timbre work. Exact pins, files, licence scope,
sample sizes and source links are in the
[source comparison](ENGINE-SOURCE-COMPARISON-2026-09-08.md).

## Verification and acceptance

The complete native suite passes 784 tests, including profile road sweeps,
city/high-demand bounds, 80 km/h engagement, no hunting, 130/160 parity, real
speed retention, bank loading and lifecycle/source recovery without a first-gear
flare. Existing dry-output, manual TAMARRO, exact-zero idle, memory/integrity and
worklet recovery tests remain green. Production-browser audio comparisons and
canonical deployment evidence are recorded below when complete. Actual Tesla
cabin listening, preference and long-drive acceptance remain separate.


### Final browser audio evidence

The exact final source hashes match checkpoint `d1beea3`. Twelve final Chromium
renders cover all six voices at 44.1/48 kHz, compared with twelve baseline
renders from `cb81c7a`. Each complete dry render is 132 seconds, with 18 probes:
eight steady speeds, eight acceleration crossings and held-demand 130/160.
All outputs are finite and unclipped. RPM/load/gear parity at 130 versus 160
passes at steady cruise and full demand, while original observed speed is kept.
The emitted PCM differs with sample phase and noise history; the cap is a
control-state invariant, not a claim of byte-identical audio.

| Mono at 48 kHz, steady cruise | Before RPM | After RPM | After gear |
|---:|---:|---:|---:|
| 20 km/h | 4,582 | 1,755 | 2 |
| 30 km/h | 6,900 | 1,945 | 3 |
| 40 km/h | 4,946 | 2,612 | 3 |
| 80 km/h | 7,191 | 3,984 | 4 |
| 130 km/h | 8,066 | 5,125 | 6 |

At 48 kHz, Otto cruise rises from -34.56 dBFS at 30 to -30.45 at 80;
Cinque rises from -35.73 to -30.84. Their accelerated 80 probes reach
-25.02/-23.58 dBFS respectively. These are raw signal measurements, not loudness
preference or cabin acceptance. The sampled voices retain similar overall levels
while pitch and timbre change; no speed-dependent master fader was added.

[Full measured table](qa/2026-09-08-engine-road/audio-measurements.md) and
[structured evidence](qa/2026-09-08-engine-road/audio-evidence.json) are versioned.
Raw 48 kHz WAVs, all source snapshots/hashes and selected 30/80 before-after
comparisons are saved in ignored `_references/audio/engine/road-progression-20260908/`.
Comparison files play before, 0.5 seconds of silence, then after, at original
production levels with 5 ms cut-edge fades only. No synthetic email was sent.

A bank selected during degraded GPS also initializes from the existing bounded
held road speed, without permitting an automatic shift. It still returns to idle
when that hold expires; no new confidence or stationary evidence is fabricated.


### Canonical publication — 2026-09-08 09:14 Europe/Rome

Build **20260908-0834**, source **d1beea3**, is verified at the canonical root.
Official publication: 232 files / 254,871,524 bytes, 29 Illobo hashes and
1 overlap assets. Independent postflight reports remote_writes=NONE;
29 HTML/asset/cache checks and final compiled/canonical six-voice Tesla/phone
browser QA pass. See [deployment evidence](DEPLOY.md) and
[current captures](qa/2026-09-08-engine-road/). Source recordings and the
selected visual remain unchanged. Final listening acceptance is still physical.
