# Engine / GEAPS integration — September 7, 2026

Status: refined after owner listening and canonically published as build
`20260907-1151`, source `65a4a22` (refinement `acfbd21`; initial integration `69230fd`). Publication and independent postflight
passed; 28 HTTPS identity checks and public Engine startup are verified in DEPLOY.md. Target-Tesla listening and sustained operation remain owner trials.
This is an informed integration after explicit owner authorization, not a blind
Phase A review or a claim that the earlier candidate passed independent review.

## Accepted scope

The owner chose direction **2 — Telemetry**: horizontal tachometer, large virtual
RPM and gear, small drive-response/deceleration histories. Public Engine and Flux
are equal reachable modes. Three sample profiles are Mono, Rosso and Touring,
based respectively on the donor's `bac_mono`, `ferr_458` and `procar` configurations.
They are sound characters; the product does not identify Tesla's actual RPM,
gear, pedal position or powertrain state. The public gearbox is AUTO; protected
LAB has an explicit MANUAL diagnostic selection with redline protection.

## Admitted source

- Mark Oosting, `markeasting/engine-audio`, pinned commit
  `b8cf9887c914f17c2f006d68427080e39d02d0b0`, declared MIT.
- Six source files adapted in `prototype/drive-lab/src/engine/upstream/`.
- Sixteen active, byte-identical WAVs: 37,921,752 bytes, fetched only for the
  selected bank. Shared transmission clips are deduplicated by content identity.
- Exact original/local hashes, source paths, asset hashes and change descriptions:
  `prototype/drive-lab/src/engine/source-inventory.json`.
- The owner explicitly directs using the bundled WAVs on the basis of the
  repository MIT declaration. Independent recording ownership remains unverified;
  upstream provenance follow-up is recorded without blocking this authorization.
- No competitor code/audio, owner quarantine recordings or engine-sim runtime is
  shipped. The sanitized study and authorized candidate inspection informed
  acquisition clocks, standstill proof, shift ownership and lifecycle behavior.

## Architecture and parameter meaning

One existing AudioContext supplies both modes. Engine loops route through its own
bounded safety gain/compressor directly to the shared master mute and meter.
Engine bypasses every Flux/manual effect; the outgoing Flux effect output is gated
too, so reverb tails cannot leak into Engine. UNDERWATER cannot engage or appear
in Engine, and Engine exposes no FX controls. Flux preferences remain retained.
Switching silences the outgoing source, cancels pending selections and stops its
active score scheduling. Engine runtime is lazy-loaded; only one bank load owns
decoding at a time. All clips in a bank start at the same audio-clock time, use
smoothed gain/detune and retain the donor's equal-power sample blending.

| Category | Parameter | Meaning |
|---|---|---|
| PHYS / virtual | 0.25 m wheel radius, six donor ratios, donor final drive, engine torque/inertia/braking | Consistent virtual mechanics from upstream; not calibrated Tesla internals |
| Unit correction | `60 * omega / (2 * PI)` | Correct rad/s → RPM; coupled sample and shift tuning is now independent of the donor's erroneous expression |
| TUNING | 1,000 RPM floor, profile up/down/kick thresholds, 1.1 s minimum gear dwell | Authored driving feel; deterministic and adjustable in source |
| TUNING | 0.20 / 0.24 / 0.30 s shift envelope | Continuous sample-gain/pitch transition, without an artificial gain dip, scheduled against AudioContext time; ratio commits once at the pitch transition boundary |
| TUNING | ±2,400 cents, 35 ms continuous smoothing, 0.16 nominal Engine gain | Bounded first-listen mix, not an acoustic realism certification |
| CAL / evidence | 1,800 ms fresh, 5,000 ms lost, accuracy at most 250 m | Conservative quality gates; position accuracy is not speed accuracy or a probability |
| CAL / filtering | 0.22 s time-based response, 12 m/s² outlier rejection | Cadence-aware speed/acceleration smoothing; the accepted Flux pipeline is retained |
| CAL / standstill | Raw speed exactly zero, two ordered observations, 350 ms dwell | No rounded display zero, missing speed, replay, conflicting duplicate or stale fix can authorize revving |

GPS preserves acquisition and receipt clocks without storing coordinates in this
adapter. Degraded evidence forbids shifts and drive demand; lost evidence eases
to idle. Reacquisition starts with zero acceleration and requires another accepted
sample before a shift. Demo uses the existing accelerator/lift/brake intent.
TAMARRO is a held stationary rev, released by movement, source/lifecycle change,
blur, hide, mute, stop, pointer/key release, or the eight-second cap. Two prominent 60 px left/right controls remain visible at displayed zero even
when global chrome retracts. Stale evidence disables them with WAITING FOR GPS
instead of removing them; the runtime revalidates at activation. The existing GPS
owner requests one fresh fix per second only while foreground Engine is unmuted,
its last raw speed is zero and evidence is aging. Requests never overlap; cached,
missing, replayed or inaccurate speed still cannot authorize revving.
A valid stopped engine makes a 700 ms, 450 RPM idle blip after five seconds, then
rests another five seconds. Movement, stale evidence, mute, lifecycle changes and
manual rev revoke the gesture and reset its clock.

Four engine-core loops receive static RMS matching once at bank decode, using
the powered loops' authored mean energy as the profile reference. The WAVs and
upstream files remain byte-identical. Equal-power load/RPM blending retains its
timbres; lift and downshift have no artificial volume duck. Signal loss eases RPM
to idle without halving the master level. Master mute and the stall watchdog remain.
A control-thread stall already has a five-second audio fade scheduled; this does
not promise uninterrupted Tesla background execution.

## Recovery, memory and diagnostics

Each WAV is SHA-256 checked before decoding. A 20-second attempt deadline and
5/10/20/30-second retry backoff cover a maximum five-minute recovery window.
Offline/hidden retry polling waits for online/foreground; changing the selection
or leaving/muting Engine cancels pending attempts. Bank loads are serialized;
replaced loops fade out and disconnect. A decoded-bank ceiling is 64 MiB.
Only the selected bank stays decoded, with a short fade overlap on replacement. Leaving Engine releases its loops and decoded bank; mute retains the ready bank for quick resume.

Engine state is included in REPORT with profile, RPM, gear, shift, freshness,
mode, decoded memory, loading/error and rev state. The flight recorder identifies
Engine separately from an inactive remembered Flux score. Telemetry's 10 Hz SVG
update cadence is identified as `Engine SVG telemetry`, not a 60 FPS WebGL claim.
Manual sending remains unchanged; future Dev ten-minute packets are still queued.

## Initial integration verification

See `docs/qa/2026-09-07-engine/` and the deployment entry for current evidence.
Automated checks cover exact asset identity, GPS age/replay/outliers/standstill,
gear decisions, scheduled single shift commits, retry recovery, cancellation,
rev expiry and LAB manual redline protection. Browser checks exercise the real
WAV decoding and shared output, mode/profile switching, network recovery and
Telemetry at the Tesla viewport. These cannot close real-vehicle timbre, alerts,
native media, GPS cadence, background behavior or sustained GPU/audio acceptance.

Owner trial line: [A12 in the owner answer document](OWNER-ANSWERS-2026-09-07.md#a12--engine-first-listen).

### Local acceptance — 2026-09-07

- Complete regression suite: **651/651**. Focused Engine/shared-audio tests: 27/27.
- Production App, inline protected LAB and Sites-compatible package build passed.
- Browser: 773 × 601 launch, resting/moving Telemetry, three profiles, injected
  network failure followed by automatic recovery, Demo acceleration to fourth,
  braking, two GPS API zero callbacks, held rev, mute, mode switching and REPORT.
- One non-closed AudioContext throughout the Engine/Flux flow; real output RMS
  0.0466–0.0758 and peak at most 0.1236 in the sampled ten-window moving interval.
  This is a short meter check, not an exhaustive loudness or listening pass.
- LAB: real bank decode (Mono 45,888,512 PCM bytes), MANUAL request and committed
  third gear, with the protected production entry still packaged behind auth.
- No page exceptions and no diagnostic transmissions in the test flow.
- The 390 × 844 capture is only a responsive smoke observation: telemetry renders,
  but the inherited global control shell remains clipped/unfinished on phone.
  It does **not** close the explicitly deferred iPhone milestone.

Visual audit corrections: launch panel stacking and mode access; pointer-through
of global chrome to Engine controls; LAB full-width placement; fixed-height tach
bar under standstill controls; contrast-safe held-rev text. Accepted desktop
frames are 01–04 and 06; frame 05 records the known phone-shell limitation.

### Captured flow audit

1. Launch / profile selection — PASS (01).
2. Ready Telemetry / public control shell — PASS at 773 × 601 (02, 07).
3. Moving / automatic gears / retracting chrome — PASS in Demo (03).
4. Trusted standstill / held rev / mute — PASS with GPS API fixtures (04).
5. Phone shell — OPEN, inherited clipped controls; iPhone milestone deferred (05).
6. Protected LAB / manual diagnostic gear — PASS locally (06); production auth preserved.

The selected Telemetry composition was checked from saved current screenshots.
These checks do not certify physical cabin legibility or full accessibility.


## Owner refinement — September 7, 2026

The first listening response was broadly positive, with four requested fixes:
Engine must bypass UNDERWATER/all creative FX; deceleration must change RPM
without ducking volume; TAMARRO must remain prominent on both sides at zero;
and a stopped engine should receive occasional tiny revs. These corrections are
implemented. All 655 native regression checks and 196 dependency credits pass.
Real Chrome WAV renders cover all three profiles at 1,000/3,500/6,500
RPM: lift versus acceleration differs by -0.531 to +0.292 dB, all finite/non-silent
and below clipping. Browser evidence verifies both buttons after chrome rests,
quiet-watch GPS renewal, stale-disabled/fresh-restored controls, automatic idle
blips, manual rev, mute, mode switching and no Engine FX badge/controls. Exact
773 × 601 captures and JSON evidence: `docs/qa/2026-09-07-engine-refinement/`.
Canonical publication is recorded separately in DEPLOY.md. Tesla listening to
this refinement remains the next acceptance step.
