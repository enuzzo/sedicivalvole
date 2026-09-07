# Engine selection and sanitized study review — 2026-09-07

Baseline inspected: `5ed280d723f96a47633b3d7229f1bde92a419f27` on `main`, initially
clean. Published runtime remains `f590f51` / build `20260907-0930`.
This is an informed intake and code-seam review, not a completed independent
Phase A audit or an Engine implementation.

## Reading scope and owner authorization

The owner explicitly asked to read the prior competitor clean-room analysis.
The sibling `sedicivalvole_engine_study` contains a sanitized handoff inspired
by owner-side competitor research. Read: START_HERE, the public Phase A prompt
and docket, plus README, the motion/clock/gearbox portions of
`02-owner-phase-b-engine-generator-spec.md` and public-source analysis
`04-owner-source-analysis-and-license-notes.md` inside the owner-kit ZIP; also
read the superseding public-audio risk note. This narrowly supersedes the old
blind-reading restriction for this informed review. No competitor source dump,
audio, constants or raw observation archive was accessed. No candidate code or
quarantined WAV archive was opened, executed, copied or admitted.

The kit explicitly excludes competitor internals. Therefore these are lessons
from the sanitized specification and current code verification, not claims
about Dribe's exact implementation. This reader is no longer blind to the
owner's preferred architecture; any later independent review must say so or
use an unexposed reviewer. Research artifacts remain outside the repository.

## Recommended instrument

Use GEAPS as the project-owned Engine subsystem, initially sample/hybrid:

- `markeasting/engine-audio` at `b8cf9887c914f17c2f006d68427080e39d02d0b0`
  is the proposed browser code donor for sample mixing and virtual drivetrain.
  Its three upstream configurations are reference candidates, not yet selected
  or admitted product sound banks.
- Add the required automatic stepped gearbox, including upshift, downshift,
  kickdown, hysteresis and audio-time shift envelopes. Public product is AUTO;
  MANUAL remains an exclusive LAB mode under the existing study direction.
- Keep `ange-yaghi/engine-sim` at `85f7c3b959a908ed5232ede4f1a4ac7eafe6b630`
  as complementary physics/acoustics research and later offline/procedural work.
  Its pinned README documents a Windows desktop build and manual controls;
  browser integration is not a drop-in reuse.
- Reuse the existing GPS owner, AudioContext and final safety/output path.
  First deliver a deterministic motion adapter and LAB audio trial, then
  product exposure after the required visual selection and vehicle audition.

Fresh public-source verification confirms the donor's `Engine.ts` contains
`(60 * omega) / 2 * Math.PI`, which differs from the rad/s-to-RPM relation
`60 * omega / (2 * Math.PI)`. Treat this as a donor-unit defect to reconcile
with all coupled tuning, not a blind one-line import. The study also identifies
main-thread timer shifts and unsmoothed parameter writes for replacement during
admission. Exact recordings remain unresolved in the kit; code selection does
not select or clear a final shipping sound bank.

Sources: [pinned Engine.ts](https://github.com/markeasting/engine-audio/blob/b8cf9887c914f17c2f006d68427080e39d02d0b0/src/Engine.ts),
[pinned Drivetrain.ts](https://github.com/markeasting/engine-audio/blob/b8cf9887c914f17c2f006d68427080e39d02d0b0/src/Drivetrain.ts),
[pinned configurations](https://github.com/markeasting/engine-audio/blob/b8cf9887c914f17c2f006d68427080e39d02d0b0/src/configurations.ts),
[pinned engine-sim README](https://github.com/ange-yaghi/engine-sim/blob/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630/README.md).

## Concrete GPS findings and next experiments

| Current evidence | Implication for Engine | Proposed verification |
|---|---|---|
| `src/App.jsx:2883` records callback `performance.now()`; `position.timestamp` is not retained. The watch allows cached positions up to one second. | Acquisition age and callback age are conflated; delayed/cached fixes can appear fresh. | Preserve both clocks with an explicit epoch/monotonic mapping; reject duplicate/reordered acquisition times and invalidate discrete decisions after resume until new evidence arrives. |
| `src/signal-model.js:156` uses elapsed-time plausibility bounds but fixed per-callback smoothing coefficients. | Response varies with callback cadence. | Replay identical physical traces at 1 Hz, 10 Hz and irregular cadence; fit time-based smoothing against our traces before changing the accepted Flux response. |
| `src/App.jsx:2968` holds a high-position-error sample only after GPS speed is already locked. | The first high-error speed can initialize the motion state. | Exercise first-fix uncertainty separately from steady-state rejection. Do not infer reliable standstill or permit a shift merely from a first callback. |
| `classifyGpsConfidence` is a categorical report helper, using receipt age and position accuracy. | It is not a calibrated probability for automatic shifts. Position accuracy is not velocity accuracy. | Add explicit freshness/quality semantics to the shared motion contract; use dwell/hysteresis and several accepted observations for discrete actions. |

A read-only deterministic probe used a linear 0→36 km/h ramp over ten seconds:
current filtered endpoint is 33.05555 km/h at 1 Hz and 35.01499 km/h at 10 Hz.
This demonstrates cadence dependence, not a measured defect in yesterday's
journey. The probe imported the existing model; no production code was changed.

The [W3C Geolocation specification](https://www.w3.org/TR/geolocation/)
distinguishes acquisition timestamp, horizontal speed in m/s and positional
accuracy. Keep actual speed, filtered speed and artistic drive/deceleration
proxies distinct. Missing motion is not zero. On degraded evidence, preserve
continuous sound briefly under a bounded policy, suppress new shifts/impacts,
and never replay missed shifts after recovery. Schedule audible transitions
with the audio clock; a hidden page must not be treated as an uninterrupted
motion measurement source.

## Reasoning effort recommendation

Medium is reasonable for bounded implementation steps with fixed contracts and
meaningful tests. Prefer High for the initial motion/audio ownership design,
clock/lifecycle review, donor admission and gearbox correctness review, then
return to Medium for ordinary wiring and fixtures. This is an engineering
judgment for this task, not a claim that higher effort always performs better
or that Medium cannot do it. No model or effort setting was changed.
[Official model capability reference](https://developers.openai.com/api/docs/models/gpt-6-astra).
