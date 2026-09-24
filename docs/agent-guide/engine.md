# Engine contracts

For Engine changes read the relevant sections here and [shared motion/mode ownership](motion-runtime.md#energy-and-mode-boundary). Changes to GPS freshness, lifecycle, preload or reports additionally use the matching sections in [motion/runtime](motion-runtime.md) and [diagnostics](diagnostics-reports.md). Musical findings belong in [MUSIC-CRAFT](../MUSIC-CRAFT.md) under the relevant diagnosis.

## Accepted source and voices

The owner authorized pinned MIT `markeasting/engine-audio`, including bundled active WAVs, under its declared license. The pin is `b8cf9887c914f17c2f006d68427080e39d02d0b0`; inspect `prototype/drive-lab/src/engine/source-inventory.json` for exact files/hashes/changes before integration work. Preserve upstream code/WAV attribution and integrity. Recording-provenance follow-up remains open: do not claim independently verified ownership or transferred liability. This exception is specific to this donor, not arbitrary audio under a repository's code license. The earlier sealed candidate can be inspected/adapted; do not claim independent blind review or reactivate its historical AWAITING_APPROVAL hold. New material still uses [provenance](provenance.md#third-party-admission).

**Mono, Rosso and Touring are retained. Otto, Cinque and Turbine are retired from public and LAB selection.** Mono's accepted hybrid layer stays. Internal retired definitions/tests are historical support, not selectable engines. This owner decision supersedes the earlier six-voice refinement campaign; see [Retained voices](../ENGINE-RETAINED-VOICES-2026-09-08.md) and [office handoff / Owner decision](../ENGINE-SOURCE-OFFICE-HANDOFF-2026-09-09.md#owner-decision-overriding-earlier-research-proposals).

## Output and road response

Engine is a separate engine-emulation mode with selected **Telemetry** visual, not a Flux score. [The explicit Telemetry selection](../ENGINE-INTEGRATION-2026-09-07.md#accepted-scope) resolves the old initial three-direction hold; a new visual redesign still needs selection.

Bypass UNDERWATER and **all Flux creative effects**. Deceleration changes RPM without artificial gain ducking; moving lift/downshifts retain full level. Keep full deep body, dry output, reliable GPS/lifecycle behavior and stationary TAMARRO. Reduce perceived echo/phase smear; browser measurements cannot establish cabin timbre.

Urban `20–40 km/h` is restrained; `80 km/h` already sounds powerful, then progresses through `100–130`. Use coherent virtual wheel/gear/final-drive ratios and load-sensitive automatic shifts, with lower downshift boundaries and dwell against hunting. The `130 km/h` acoustic ceiling limits road response, **not explicit neutral rev gestures**. These are authored acoustic RPM/gears/load, never actual Tesla RPM, throttle, gears or CAN. The old nominal `35/65 km/h` ladder is explicitly superseded by September 8 road progression. Later road feedback favors second around `30 km/h` without excessive city RPM; use [road progression](../ENGINE-ROAD-PROGRESSION-2026-09-08.md) and [real-ratio comparison](../ENGINE-LISTENING-REFINEMENT-2026-09-08.md#what-real-ratios-establish) for calibration, not an inferred hard speed-only gear rule.

## TAMARRO and idle

TAMARRO with English SHOW-OFF subtitle is a varied bounded neutral phrase: up, release, up, brief limiter flutter and down, not a maximum-throttle hold. One tap starts; another stops. Manual TAMARRO requires **ready, unmuted foreground audio, with no GPS fix required**, including before the first fix or when GPS is absent/stale. Actual movement cancels it; retain shared Stop/Mute and lifecycle cancellation rather than allowing a gesture to outlive its audio/session owner. Do not apply automatic idle's fresh-standstill gate to manual revs. The earlier general stale-disabled manual-control rule is superseded by [the explicit no-GPS correction](../ROAD-FEEDBACK-2026-09-07.md#implemented-corrections). Prominent left/right controls remain visible at displayed zero independently of chrome, disabled rather than removed when the remaining audio/movement/lifecycle conditions make them ineligible. Stale/missing zero evidence disables **automatic idle**, not manual rev solely for missing GPS. Explain automatic eligibility in the RPM label (no speed signal, confirming stop, auto blips on), distinguish an actual IDLE BLIP, and show changing RPM during gestures. Loading is centered/prominent and separate from the controls.

Automatic idle requires an actual exact-zero watch observation. A bounded `12-second` stationary watch hold bridges the roughly `10-second` cadence observed in the owner's report; hidden state, missing/invalid live speed and movement cancel it. Live watch events use the shared receiver's monotonic clock, while one-shot renewals retain acquisition/replay checks. The older road report lacked acquisition timestamps and Engine reasons; it does not prove a provider-clock defect. For implementation details use [road feedback](../ROAD-FEEDBACK-2026-09-07.md) and `src/engine/motion.js`, `stationary-refresh.js`, `show-off.js`, `idle-blip.js` under Drive Lab.

Confirmed standstill uses `600 RPM` and `70%` of normal Engine master. Manual TAMARRO overrides the quiet level for the whole phrase then returns to 600 RPM. Fresh accepted speed `>= 1 km/h` restores full level; sub-threshold jitter, stale/invalid evidence or GPS loss cannot falsely restore it after a stop. Initial no-speed fallback is `1000 RPM`, never a fabricated stop. Automatic idle blips rise to about `1800 RPM` (`1200` above idle) over `1.2 seconds`, with `five seconds` between gestures, remaining at 70%. Manual rev, movement, mute and lifecycle loss interrupt automatic idle. Preserve dry audio and upstream bytes throughout.

## Research and campaign scope

The Engine quality campaign authorizes substantive original implementation/refactoring for sound quality, versatility, engine types, shifting, load, turbo/turbine behavior and timing when that campaign is the requested task. Study relevant local analysis/reference material and the fuller simulators before choosing reuse, synthesis or refactoring. Keep implementation in the saved Dropbox project on this Mac; finish prior verified delivery checkpoints before switching campaigns. The old overnight mandate to progress every open task is not permanent authorization to start unrelated backlog work.

Ange Yaghi's engine-sim and Real Engine Simulator are central references. Distinguish Yaghi's impulse responses, authored ratios and manual controls from engine recordings or an automatic gearbox. Explore the latter's publicly accessible engines/interface/explanations only: public presets are free and Pro concerns custom building as recorded at the time; recheck when needed. Do not purchase, bypass access or import its proprietary runtime, audio, parameters or presets. This is concept research for an original implementation, preserving Telemetry and provenance.

**For new source-bank research**, read the [complete office handoff](../ENGINE-SOURCE-OFFICE-HANDOFF-2026-09-09.md) and its linked research ledger before searching. Its specialist [restart prompt](../ENGINE-SOURCE-OFFICE-START-2026-09-09.txt) is preserved unchanged and applies only to an owner-requested research restart; do not automatically launch it. The owner rejected the 111-item short/disconnected recording direction and the official FMOD granular truck audition; stop FMOD acquisition/integration and do not repeat its obsolete account question. Seek coherent same-engine RPM/load/coast banks with usable rights. Deduplicate exact sources, not all of GitHub. Those detailed search exclusions remain authoritative for that specialist task.

The September 8 build-0807 listening report supported motion/progression/braking and high-volume Mono/Rosso/Touring, while requesting refinement. Subsequent Otto/Cinque/Turbine rejection did not identify its listening build. Preserve that uncertainty and distinguish historical evidence from current quality. New recording/voice changes need audible comparison before claiming improvement.

## Protected listening LAB

The owner selected A/B listening: identical route, two calibrations, locally saved preference and notes. Use the existing protected LAB, one take at a time, original levels, bounded local history/export and the public refined default. Keep dry output and motion/lifecycle contracts. A/B labels and source identifiers must change whenever their parameters change; an old identifier cannot silently describe a new sound. This is not a blind or loudness-matched comparison.

For replay/storage/export changes, read [Listening flow](../ENGINE-LISTENING-LAB-2026-09-08.md#listening-flow); for reproducing its QA, read [Repeating the browser check](../ENGINE-LISTENING-LAB-2026-09-08.md#repeating-the-browser-check). Retained-voice selection above supersedes historical six-voice examples in that report. No auto-mail is authorized for LAB notes; exported notes are owner-shared. Browser signal parity, headless mute and historical counts such as 657 tests or 0.112/0.16 gain checks are not new listening/vehicle acceptance.

## Selected instrument refinement B

The owner delegated [September 19 refinement B](../ROAD-REFINEMENT-2026-09-19.md): RPM / instantaneous speed / gear in one band, preserving the upper RPM crest and adding measurement-driven accents. The later [shared identity correction](interface.md#shared-geometry-and-palette) keeps the global speed cell adjacent to the logo in Engine too. Voice choices follow complementary chrome visibility; essential TAMARRO remains separate. Engine retains its own mute preference, independent of Music.

## Equal telemetry cells and live micro-signals

The September 19 browser annotation explicitly refines the selected instrument:
RPM, speed and gear have equal-width cells, identical label/value/status/signal
rows and left alignment. All values share one responsive font size. Preserve the
upper RPM crest, lower response graphs, profile lane and TAMARRO geometry.

Each original SVG micro-signal encodes existing state only. The slowed virtual
cycle train uses authored RPM for cadence and drive for amplitude; it is not an
audio waveform or measured combustion. The road ruler uses valid fresh speed,
independently of audio; aging readings remain numeric but stop scrolling. Lost
GPS shows no motion. The ratio selector follows the committed virtual gear, with
separation/re-engagement driven by the existing shift phases. Stable gear has no
invented loop; neutral and continuous shaft select no ratio. Paused/unprepared
engine does not imply active cycles or shifting. Hidden documents and reduced
motion stop decorative travel; values remain available. No audio/control model
or physical vehicle telemetry is added.

[Implementation, silent preview and verification](../qa/2026-09-19-engine-cells/README.md).

## Mounted phone response — September 19

Mounted longitudinal acceleration feeds the existing demand/load/coast estimator and load-sensitive shifts; GPS still owns speed, standstill and shift freshness. Preserve the dry Engine path and manual rev exception. See [the implementation contract](../PHONE-ROAD-INPUT-2026-09-19.md).

## Predictive response and full-body voicing — September 24

The owner found the sound clean but wanted it higher resolution, fuller and
more powerful, and above all a more predictive, dynamic response from GPS.

**Response.** `src/engine/speed-tracker.js` treats a repeated speed inside the
provider's own update interval as no new information (the owner's Tesla trace
reports whole km/h at about 10 Hz), keeps an alpha-beta speed and acceleration,
and predicts a short decaying horizon with a 0.25 s lead. The Engine motion
snapshot exposes it as `predictedSpeedKmh`; gears, standstill and freshness
keep the filtered/raw speed. The runtime follows the prediction through a
critically damped spring (`followRoadSpeed`), so a correction is a glide. The
outlier test uses the provider's interval. First gear pulls away through a
demand-dependent clutch-slip floor (`launchSlipRpm`) that the road ratio
overtakes without a dip. This is acoustic estimation only, never measured
vehicle state; the phone accelerometer path is unchanged and still wins when
mounted.

**Voicing.** `src/engine/voicing.js` is a dry chain between every loop, the
procedural voice and the master: per-profile EQ, air harmonics regenerated
above 3.6 kHz and a firing-order body tone locked to the virtual crank
(cam-rate harmonics), plus a trim. No reverb, delay or modulation. Measured
with `scripts/engine-render.mjs` + `scripts/analyse-engine-render.py` along a
Tesla-like route: +2.6 to +3.7 dB in motion, +4 to +6 dB below 60 Hz, a
smoother tilt to the top, peaks at or below −6 dBFS. `voicing: null` is exactly
the earlier sound. The protected LAB A/B is now **A · Refined** (null voicing)
vs **B · Full body** (published default), same route and response; bump
`sourceCalibrations.B` (`full-body.v1`) whenever the voicing changes.

**Cluster.** Delegated by the owner on September 24 (free to retouch the Engine
interface) within the selected Telemetry instrument, Night Instrument and the
equal-cell contract above; it is a refinement, not a new direction: a
72-segment LED tachometer (125 RPM each, a tick per thousand) whose heights
form the crest, with warm/hot/red zones and a held peak segment; twelve shift
lights that close in from both ends, pulsing at 2.5 Hz only on the limiter;
three equal plates with status LEDs; oscilloscope response traces; status chips
in the header; hazard stripes on TAMARRO that run while it revs, with the
phrase phase (REV, RELEASE, LIMITER) in its label. Standstill, short windows
(≤ 580 / ≤ 500 px) and phone landscape compact the same cluster; the visual
gate now captures it.
