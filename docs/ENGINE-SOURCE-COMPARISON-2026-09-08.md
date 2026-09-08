# Engine source comparison and acoustic implementation basis — 2026-09-08

Research status: primary source inspection completed across September 7–8, local
time CEST. This note recommends implementation; it does not claim an audition,
benchmark, product integration or vehicle acceptance. No third-party source,
preset, recording, impulse response or proprietary runtime was imported into the product.

The owner has now identified both Ange Yaghi's `engine-sim` and
`realenginesimulator.com` as the intended central references. The latter is the
fuller browser simulator remembered in the campaign handoff. Its identity is no
longer an open question. Root coordinates the separate public UI observation.

The coordinating task's saved public UI observations were subsequently reviewed:
`/tmp/sv-real-engine-interface.json`,
`/tmp/sv-real-engine-motor-comparison.json` and
`/tmp/sv-real-engine-auto-drive.json`. They show a 45-entry engine selector,
distinct piston/rotary/turbojet controls, and an automatic drive sequence with
changing gears, converter slip and lockup indication. The publisher identifies
the existing roster as free and the custom builder as Pro. These are ordinary
interface observations, not listening or physical validation; the auto-drive
artifact explicitly records `audibleListening: false`. No observed configuration
values or timings are adopted as our tuning.

## Decision for the current campaign

Improve the existing sample profiles through explicit load and shift events,
while adding an original, cycle-timed renderer for new engine characters. A
small worklet with authored excitation and bounded resonators is the most direct
route to distinct firing patterns, calibrated virtual RPM and coherent boost.
Keep the current sample renderer available while the new renderer is verified.

This is an engineering recommendation, not a claim that procedural synthesis
already sounds better. A full desktop fluid/mechanical port adds substantial
integration work before resolving today's audible defects. Conversely, renaming
the same sample bank or adding an oscillator on top does not establish a new
engine identity. The comparison must be made with exported audio and traces.

## Verified source boundaries

| Source and exact revision | Verified contribution | Boundary for this implementation |
|---|---|---|
| [Mark Oosting — engine-audio](https://github.com/markeasting/engine-audio/tree/b8cf9887c914f17c2f006d68427080e39d02d0b0) | The existing admitted sample/configuration source; drive/coast, low/high, limiter and optional transmission layers. | Retain the owner's exact MIT integration decision and WAV inventory. Independent recording ownership remains unverified; this study neither expands nor revokes that decision. |
| [Antonio-R1 — engine-sound-generator](https://github.com/Antonio-R1/engine-sound-generator/tree/c76c5adb9e63f5a54fb0def3b97e8e0ac1a7dea1) | Browser AudioWorklet and C++/WASM waveguides; separate intake, block and outlet outputs. [MIT, Antonio-R1 2021–2022](https://github.com/Antonio-R1/engine-sound-generator/blob/c76c5adb9e63f5a54fb0def3b97e8e0ac1a7dea1/LICENSE). | Useful acoustic/source study. It does not supply a completed load, gearbox or turbo model. No code/Three.js bundle enters this change. |
| [DasEtwas — enginesound](https://github.com/DasEtwas/enginesound/tree/e5fcca587397c0c8ba9c9d24874b951fed74d260) | Rust cylinder/intake/exhaust waveguide authoring, headless WAV output, warmup and loop crossfade. [MIT, DasEtwas 2020](https://github.com/DasEtwas/enginesound/blob/e5fcca587397c0c8ba9c9d24874b951fed74d260/LICENSE). | Strong offline comparison tool with original configurations. Its example MP3/configurations are not selected product assets. |
| [Ange Yaghi — engine-sim](https://github.com/ange-yaghi/engine-sim/tree/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630) | Combustion/gas paths, cylinder-dependent propagation and exhaust-system audio channels. [Root MIT](https://github.com/ange-yaghi/engine-sim/blob/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630/LICENSE). | Deep physical/acoustic reference. The pinned README documents Windows and manual controls; this is not browser-ready AUTO/turbo. Default coloration includes WAV impulse responses. |
| [ATG / Dan — VehicleNoiseSynthesizer](https://github.com/ATG-Simulator/VehicleNoiseSynthesizer/tree/4241caca5a18be0d47f0b8586df93b1b42d7020d) | Adjacent RPM clips, drive/coast banks, stable pair selection and explicit tip-in/tip-out/shift API. [MIT](https://github.com/ATG-Simulator/VehicleNoiseSynthesizer/blob/4241caca5a18be0d47f0b8586df93b1b42d7020d/LICENSE). | Study the separation of continuous state and events. Unity/Burst/NWH code and recordings are not imported. Demo transmission, differential and blow-off sounds are explicitly excluded by its README. |
| [TheDIYGuy999 — Rc_Engine_Sound_ESP32](https://github.com/TheDIYGuy999/Rc_Engine_Sound_ESP32/tree/5520d721ef41b50f39dfe9a7081ac4620138702a) | Embedded automatic converter/DCT concepts and independent idle/rev/turbo/knock/wastegate layers. Exact latest commit was verified through GitHub's API: April 6, 2026. | No licence-like file was found in the recursive tree; inspected README/entry files do not establish reuse permission. Keep source study only; do not extract its encoded sound library. |
| [Engine Sim Game / Real Engine Simulator](https://realenginesimulator.com/about) | The publisher describes firing-driven sound, automatic converter/lockup and turbo/turbojet behavior in its [changelog](https://realenginesimulator.com/changelog). | Owner-confirmed public behavioral reference. [September 5 terms](https://realenginesimulator.com/terms) retain proprietary ownership. No runtime, preset, asset or tuning constant is copied; publisher model claims are not physical validation. |

The GitHub commit/tree endpoints were read live for the four nonlocal candidates
and RC; the existing Ange pin's recursive tree and selected sources were also
read. RC's exact pin closes the earlier revision uncertainty, but does not close
its permission or recording-provenance uncertainty. Existing attribution files
should retain study status and update that distinction together.

## Findings that change implementation

### A worklet is a timing mechanism, not a complete engine model

Antonio's [JavaScript worklet](https://github.com/Antonio-R1/engine-sound-generator/blob/c76c5adb9e63f5a54fb0def3b97e8e0ac1a7dea1/src/engine_sound_generator/engine_sound_generator_worklet.js)
reads the `throttle` AudioParam but does not use it in sample excitation. Its
phase increment uses the real sample rate, while its filter coefficients assume
44.1 kHz; waveguide lengths are supplied as sample counts. Its cylinders are
uniformly phased and share one collector. Copying it unchanged would therefore
leave load articulation and bank character unresolved, with timbral differences
between 44.1 and 48 kHz. The
[C++ version](https://github.com/Antonio-R1/engine-sound-generator/blob/c76c5adb9e63f5a54fb0def3b97e8e0ac1a7dea1/src/engine_sound_generator/sound_generator_wasm/engine_sound_generator.cpp)
does pass the actual sample rate into filters, but still reads throttle without
using it to shape excitation. Its greater efficiency is an upstream claim, not
a measured result on this Tesla.

DasEtwas's [generator](https://github.com/DasEtwas/enginesound/blob/e5fcca587397c0c8ba9c9d24874b951fed74d260/src/gen.rs)
separates cylinder phase offsets, piston/ignition excitation, valve reflection,
intake/exhaust paths, collector and muffler. It advances one four-stroke cycle
at `rpm / (120 * sampleRate)`. It also damps large feedback values and removes
DC. Noise is seeded from system time, so reproducible offline experiments need
an explicit seed adaptation. This supports authored phase/path models, but does
not establish calibrated torque, boost or a ready production engine catalogue.

### Firing count alone cannot distinguish two V8 characters

An even-firing four-stroke engine produces `cylinders * rpm / 120` events per
second. A crossplane and a flatplane V8 can share that total event cadence while
their separate exhaust banks receive different spacing. The public
[V8 explanation](https://realenginesimulator.com/blog/crossplane-vs-flatplane-v8)
identifies bank routing as the audible distinction in that simulator; it also
explicitly limits its own gas-wave/scavenging and shaking-force modeling.

For our original renderer, declare firing phase, bank and propagation path as
independent profile data. Keep two differently colored bank paths until their
final mix. Summing identical pulses before any bank-specific treatment would
erase this distinction. Stereo separation alone is insufficient: verify the
character survives a mono downmix and avoid a wide, distracting cabin image.

Ange's
[combustion chamber](https://github.com/ange-yaghi/engine-sim/blob/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630/src/combustion_chamber.cpp)
and [synthesizer](https://github.com/ange-yaghi/engine-sim/blob/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630/src/synthesizer.cpp)
reinforce the separation between physical excitation, path filtering and output
conditioning. Its audio implementation also contains threading, buffering and
convolution machinery whose browser cost must not be assumed away. No pressure
coefficient, default rate, IR or engine preset is selected here.

### Turbo state must survive a throttle release briefly

The public [turbo explanation](https://realenginesimulator.com/blog/how-a-turbocharger-works)
distinguishes rotor inertia, exhaust-side wastegate regulation and intake-side
pressure release. Translate those mechanisms into an original reduced acoustic
model: spool rises with sustained virtual load, continues rotating after lift,
and decays toward its new target. Pitch follows spool; pressure-release energy
depends on stored charge and an actual closing event. Do not play a generic
blow-off sound on every gear change or every noisy GPS acceleration reversal.

A wastegate sound is not the throttle-release valve. A naturally aspirated
profile receives neither; a mechanically driven supercharger follows shaft
speed with its own harmonic character; a standalone turbine would need its own
state/controller rather than the piston engine's firing schedule. These are
proposed authored models, not inferred Tesla hardware values.

RC's [README](https://github.com/TheDIYGuy999/Rc_Engine_Sound_ESP32/blob/5520d721ef41b50f39dfe9a7081ac4620138702a/README.md)
is a useful counterexample: knock retains fixed sample pitch while repetition
and volume vary, whereas other layers change playback rate. Avoid making every
detail brighter solely by speeding up one recording. Its
[transmission settings](https://github.com/TheDIYGuy999/Rc_Engine_Sound_ESP32/blob/5520d721ef41b50f39dfe9a7081ac4620138702a/src/4_Transmission.h)
also distinguish `DOUBLE_CLUTCH` manual truck rev matching from a dual-clutch
automatic; those names must not be conflated.

## Original implementation specification

1. Keep observed motion separate from virtual powertrain state. GPS does not
   reveal a throttle pedal or torque. Estimate artistic load from acceleration,
   speed-dependent rolling/aerodynamic demand and a bounded recovery envelope.
   Coasting changes pulse shape and intake/exhaust balance; it does not duck the
   whole Engine master. Use profile-specific inertia and meaningful cruise load.
2. Emit one audio-time shift contract containing identity, from/to gear, start,
   synchronization/engagement points and completion. Shape the existing RPM
   transition with unload, synchronization and reload phases. A downshift may
   include a bounded rev-match excitation. Preserve one decision owner and one
   commit. Converter-like and fast clutch-like characters may use different
   envelopes; do not claim a fluid simulation without implementing one.
3. Preserve a continuous four-stroke phase in the worklet. Interpolate bounded
   RPM/load controls there; trigger no firing pulse from the 25 ms control loop.
   Band-limit sharp excitation and suppress DC. Store delay lengths in seconds
   or physical units and derive buffers from the actual context rate. Use seeded
   small cycle variation instead of uncontrolled per-sample timing jitter.
4. Start with distinct original archetypes: an even-firing four with strong
   intake detail; a low-register two-bank eight with recognizable bank rhythm;
   and a boosted character with pressure storage and a correctly gated release.
   Their distinction must survive equal-loudness and mono comparisons at idle,
   medium RPM and high RPM. Names should describe authored characters, not
   imply recordings or validated models of particular vehicles.
5. Keep boost/turbine and transmission outputs separate from the combustion
   source. Road whine follows the selected shaft's virtual speed, with the
   existing movement/Neutral audibility gate. No road whine during TAMARRO.
   No spool/BOV event is recovered retroactively after a hidden/offline gap.
6. Keep renderer allocation bounded; build tables/buffers outside `process`.
   Smooth parameters without resetting phase at every snapshot. Cancellation,
   mute and lifecycle loss must silence the entire auxiliary renderer alongside
   the existing dry output. The [Web Audio specification](https://webaudio.github.io/web-audio-api/#AudioWorkletProcessor)
   supplies the rendering-thread/sample-time contract; it does not promise
   execution after the browser suspends the context.

These choices need no proprietary constants and no new recorded assets. If an
MIT implementation is actually adapted later, preserve its exact notices and
record the changed files; do not call an adaptation wholly original.

## Required comparison evidence

| Question | Evidence before selecting or publishing |
|---|---|
| Does RPM sound connected to the tachometer? | Known-cycle procedural firing count and frequency at 44.1/48 kHz; old WAV reference RPM remains explicitly unmeasured. Compare an identical scripted sweep, not different gestures. |
| Is load audible beyond volume? | Matched-RPM, approximately matched-RMS drive/coast samples; spectral/envelope differences and a documented listening judgment. |
| Does a shift sound intentional? | Export idle, TAMARRO, acceleration, cruise, lift, downshift and recovery with one shared time axis for RPM/load/gear/events; inspect event windows for discontinuities and duplicate commits. |
| Are characters distinct? | Level-matched idle/mid/high excerpts plus mono downmix; verify bank event spacing or boost history responsible for the difference. |
| Is turbo causal? | Same RPM with different preceding load, charged versus uncharged lift, repeated lift and lifecycle cancellation. No release event without retained charge. |
| Can the browser sustain it? | Actual worklet renders, finite/non-silent output, output/true-peak estimate and adjacent-sample statistics; sustained wall-time/cost and allocation measurements at both context rates. |
| Is the product still reliable? | Fresh/missing/stale GPS, no-GPS manual TAMARRO, exact-zero idle, mute, hidden/resume, profile cancellation and old-bank continuity. Intercept both mail endpoints throughout synthetic QA. |

No synthesis runtime, offline generator or physical vehicle was executed for this
research note. Performance and listening quality remain measurements for the
implementation campaign; source architecture alone cannot certify either.

### Subsequent implementation review

After the source comparison, the evolving original project DSP was exercised
through native JavaScript imports at 44.1 and 48 kHz. This is separate from the
third-party research above. Review exposed a pressure-release event incorrectly
triggered by lost motion evidence, a nonzero excitation tail at its cutoff, and
sample-rate-dependent damping coefficients. The product writer added an explicit
event-eligibility input, a smooth tail and frequency-derived coefficients; the
focused native probes then produced no release after evidence loss and zero
excitation endpoints at both rates. These checks do not replace production
AudioWorklet, complete-graph, listener or vehicle acceptance. No external engine
runtime, preset, recording or impulse response was used in those probes.

## Follow-up: Ange audio assets and road gearing — 2026-09-08

The owner asked specifically whether Ange's available samples and transmission
could improve calm driving at 20/30/40 km/h and motorway cruise at 100–130 km/h.
This follow-up is source and file inspection, not listening or simulator output.

### Public versions and reuse boundaries

- **Original Ange source:** current `master` still resolves to
  `85f7c3b959a908ed5232ede4f1a4ac7eafe6b630` (January 22, 2023).
  Its [MIT notice](https://github.com/ange-yaghi/engine-sim/blob/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630/LICENSE)
  names Copyright 2022 AngeTheGreat (Ange Yaghi). It permits source reuse with
  the notice retained. The pinned repository also distributes WAVs without a
  separate sound-library licence or recording-origin ledger found in the
  inspected tree. Describe these as **bundled under the repository's declared
  MIT licence**, not independently cleared recordings. No WAV enters the product.
- **Community Edition:** current revision
  `4e5c20da3e2c8b373ec795931b081f4e614048c3` (September 11, 2025)
  is a distribution/documentation repository. Its [own explanation](https://github.com/Engine-Simulator/engine-sim-community-edition/blob/4e5c20da3e2c8b373ec795931b081f4e614048c3/README.md)
  says application source is absent and distinguishes the older MIT version
  from later closed development. A free Windows download does not establish
  permission to redistribute its newer code or assets; it was not downloaded.
- **Carles Onielfa's Open Engine Simulator:** independent fork
  `1e226ee7bfbeb1d5012c7696aee82a57355df281` (August 14, 2026)
  [retains Ange's MIT notice and documents macOS/browser builds](https://github.com/carlesonielfa/open-engine-sim/blob/1e226ee7bfbeb1d5012c7696aee82a57355df281/README.md).
  This is a possible future route to offline reference generation on this Mac;
  no build, compatibility, performance or generated-audio rights audit is claimed.
- **Community catalog:** pilot01's [Better Impulse Response Library](https://catalog.engine-sim.parts/parts/1563)
  explains exposing more existing sound-library responses by changing a script
  and copying the distributed smooth responses. The inspected public page gives
  no explicit reuse licence. It is not evidence of a newly licensed RPM/load
  recording collection; no download was made.

Licensed-repository study downloads are confined to ignored
`_references/engine-source-study-2026-09-08/`: 79 original source/configuration/
licence/audio files (942,457 bytes) and six fork source/licence files. Each folder
has a local `study-download-inventory.json` with the exact pin, file sizes and
SHA-256 values. These local reference copies are not repository or product
imports, and are not to be committed.

### What the downloadable WAVs actually do

The original [standard-library definition](https://github.com/ange-yaghi/engine-sim/blob/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630/es/sound-library/impulse_responses.mr)
exports ten impulse responses. All ten downloaded files are mono 16-bit PCM at
44.1 kHz. Their decoded duration is 0.212–0.962 seconds. There are nine distinct
SHA-256 values: `sharp_01.wav` and `minimal_muffling_03.wav` are byte-identical.

| Exports | Relative files in `es/sound-library/` | Intended role |
|---|---|---|
| `default_0` | `smooth/smooth_39.wav` | Default convolution colour |
| `real_engine_0/1/2` | `archive/test_engine_14/15/16_eq_adjusted_16.wav` | Alternative convolution colours; the names do not prove measured engine/RPM metadata |
| `sharp_0` | `sharp/sharp_01.wav` | Sharp response |
| `mild_exhaust_0`, `mild_exhaust_0_reverb` | `new/mild_exhaust.wav`, `new/mild_exhaust_reverb.wav` | Exhaust response variants |
| `minimal_muffling_01/02/03` | Corresponding WAVs under `new/` | Reduced muffling variants |

The [application loader](https://github.com/ange-yaghi/engine-sim/blob/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630/src/engine_sim_application.cpp#L490)
loads an impulse for each exhaust system, then sends PCM to the synthesizer.
The [synthesizer](https://github.com/ange-yaghi/engine-sim/blob/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630/src/synthesizer.cpp#L86)
finds the last sample above an absolute PCM threshold of 100, caps the usable
kernel at 10,000 samples (about 227 ms at 44.1 kHz), and scales it by the library
volume before convolution. Thus WAV duration alone is not its effective filter
length. The library's 0.001/0.01 levels belong to that simulator's gain chain;
they are not ready-made gains for a Web Audio ConvolverNode.

These are filters applied to continuously generated excitation. They cannot
replace an idle/drive/coast loop bank or repair incorrect RPM tracking merely
by being played on repeat. An experiment could convolve our original firing
voice with an explicitly admitted response, then compare it with our current
original resonators at equal loudness. Keep per-bank paths separate until after
their distinct filtering/delays, and measure browser cost. Another route is
offline generation from the MIT simulator with known RPM, load, engine script
and IR provenance, but no such calibrated loops were generated in this study.

### Manual gearbox, useful physical relationships

In the original [input controller](https://github.com/ange-yaghi/engine-sim/blob/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630/src/engine_sim_application.cpp#L884),
Up/Down directly request gears; Shift/Y/T/U and Space govern clutch pressure.
`Transmission::update` limits clutch torque; it contains no RPM/load upshift
schedule. [`changeGear`](https://github.com/ange-yaghi/engine-sim/blob/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630/src/transmission.cpp#L59)
changes reflected vehicle inertia while conserving its rotational energy.
The Community Edition documents the same manual controls. The inspected
[fork controller](https://github.com/carlesonielfa/open-engine-sim/blob/1e226ee7bfbeb1d5012c7696aee82a57355df281/src/desktop_application.cpp#L413)
also uses Up/Down and a manual clutch. None of these inspected paths supplies
an automatic gearbox controller to transplant.

The useful lesson is explicit kinematics. For an engaged, non-slipping gear:

```text
wheel_rpm = (speed_kmh / 3.6) × 60 / (2π × rolling_radius_m)
engine_rpm = wheel_rpm × final_drive × selected_gear_ratio
```

This follows the pinned transmission's `radius / (finalDrive × gearRatio)`
relation and [vehicle energy/speed calculation](https://github.com/ange-yaghi/engine-sim/blob/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630/src/vehicle.cpp).
Its [road resistance model](https://github.com/ange-yaghi/engine-sim/blob/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630/src/vehicle_drag_constraint.cpp)
also separates constant rolling force from speed-squared aerodynamic force.
Neither relation requires importing C++ into the browser.

For a concrete arithmetic check, the simulator's [GM LS example](https://github.com/ange-yaghi/engine-sim/blob/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630/assets/engines/atg-video-2/07_gm_ls.mr#L438)
uses ratios `2.97, 2.07, 1.43, 1.00, 0.71, 0.57`, final drive `3.42` and tire
radius `10 inches`. Calculating selected combinations gives:

| Road speed | Illustrative selected gear | Calculated engaged RPM |
|---:|---:|---:|
| 20 km/h | 2 | 1,479 |
| 30 km/h | 3 | 1,532 |
| 40 km/h | 3 / 4 | 2,043 / 1,429 |
| 100 km/h | 6 | 2,036 |
| 130 km/h | 6 | 2,647 |

The gear choices in this table are ours for illustration, not an upstream
automatic schedule or measured Corvette behavior. Even the named examples
are authored simulator configurations. For comparison, its [Subaru example](https://github.com/ange-yaghi/engine-sim/blob/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630/assets/engines/atg-video-2/01_subaru_ej25_eh.mr#L362)
has a sixth ratio of `0.756`, final drive `3.9` and the same radius: about
3,079 RPM at 100 km/h and 4,003 at 130. A single motorway RPM target for every
character would erase this gearing difference. Do not copy the simulator's
fallback 2,000 N rolling resistance or 10-inch tire radius as calibrated
real-car values.

### Applicable original implementation decision

Use explicit profile-specific ratios and a cruise-capable top gear. Select a
gear by prospective coupled RPM and inferred demand: light, steady driving can
shift early, while acceleration retains a lower ratio. Require a usable RPM
after each proposed upshift, enforce a redline guard before downshifts, and use
hysteresis/dwell to prevent GPS noise causing gear hunting. Low-speed launch
needs bounded clutch/slip behavior; idle is not the coupled wheel RPM at zero.
These are recommendations for our own automatic controller, not Ange code.

The audio must follow the same RPM. A sample with a valid reference RPM needs
`1200 × log2(target_rpm / reference_rpm)` cents for proportional playback pitch;
a linear cents-per-RPM rule cannot provide that relationship. A ±2,400-cent
bound permits only quarter-to-four-times playback: a nominal 5,300 RPM layer
cannot represent 800 RPM under that bound, so layer selection must also avoid
unsupported ranges. Donor nominal RPM and Mono's authored texture anchors must
remain explicitly uncalibrated until measured. Compare steady 800/1,800/3,000
RPM excerpts and 20/30/40/100/130 km/h road traces at matched loudness; confirm
the sound becomes calm together with the tachometer, without artificial master
ducking. No new samples or production code were added by this follow-up.
