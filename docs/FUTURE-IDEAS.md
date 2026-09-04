# Future Ideas Register

This is the canonical long-horizon register for owner ideas, deliberately
divergent concepts, and useful work that should survive beyond the active
roadmap. Check this file first whenever the owner asks to recover future ideas.

An entry here is **not** an implemented feature or a delivery promise. When an
idea becomes scheduled work, keep the entry and link it to the authoritative
plan, specification, tests, and evidence instead of silently deleting it.

## Status and provenance

- `CAPTURED`: worth preserving, but not scheduled or designed;
- `RESEARCH`: evidence or feasibility work is approved, not implementation;
- `PROMOTED`: accepted into the active plan under the linked stable ID;
- `IMPLEMENTED`: present in source; linked publication or physical acceptance
  gates may still remain open;
- `REJECTED`: deliberately closed, with the reason retained;
- `OWNER`: explicitly requested or approved by the product owner;
- `AGENT PROPOSAL`: a separate suggestion that is not owner-approved.

Future entries must always record provenance. An agent proposal must never be
presented as an owner decision or enter the product without explicit approval.

## Idea index

| ID | Idea | Origin | Captured | Status | Authoritative detail |
|---|---|---|---|---|---|
| `FI-001` | Optional iPhone motion/accelerometer input for use in any car, including Bluetooth-speaker sessions | OWNER | 2026-08-30 | CAPTURED · high-value nice to have | This document |
| `FI-002` | Smoothly raise DRIVEY's Aerial camera as speed increases | OWNER | 2026-08-30 | CAPTURED | [`PIANO.md`](../PIANO.md) `D4` |
| `FI-003` | DISCOVER image-led nearby-place companion | OWNER | 2026-08-30 | PROMOTED | [`PIANO.md`](../PIANO.md) `A5` |
| `FI-004` | Grouped, direct-selection Visual Library | OWNER | 2026-08-30 | PROMOTED | [`PIANO.md`](../PIANO.md) `X9` |
| `FI-005` | Shared LIGHT/DARK/AUTO interface appearance | OWNER | 2026-08-30 | IMPLEMENTED · canonical build `20260903-1752`; Tesla pending | [`MILESTONE-CHECKLIST-2026-08-31.md`](MILESTONE-CHECKLIST-2026-08-31.md) row 13; [`TESLA-TEST-QUEUE-2026-08-31.md`](TESLA-TEST-QUEUE-2026-08-31.md) `R13-01`–`R13-03` |
| `FI-006` | Exception-led local CONDITIONS and weather context | OWNER | 2026-08-30 | PROMOTED | [`PIANO.md`](../PIANO.md) `X11` |
| `FI-007` | Original speed-responsive Gradient Field | OWNER | 2026-08-30 | RETIRED · renderer replaced by one ShaderGradient family with three variants | [`MILESTONE-CHECKLIST-2026-08-31.md`](MILESTONE-CHECKLIST-2026-08-31.md) row 11 |
| `FI-008` | Landscape-first iPhone presentation with an inert portrait rotation notice | OWNER | 2026-08-30 | PROMOTED | [`PIANO.md`](../PIANO.md) `X2`; [`ROADMAP.md`](ROADMAP.md) Phase 6 |
| `DI-001` | A GPS-free `MOTION` interpretation driven by the character of movement rather than a fabricated speedometer | AGENT PROPOSAL | 2026-08-30 | CAPTURED · not approved | This document |

## FI-001 — Optional iPhone motion input

### Product opportunity

Allow sedicivalvole to run in a friend's car using an iPhone as the motion
sensor and a Bluetooth speaker as the audio output. Tesla may never expose a
motion sensor to its browser, but an iPhone can provide a separate future path
that makes the experience useful beyond one vehicle and potentially much more
responsive to launches, braking, turns, and road texture.

The input abstraction should eventually support explicit `GPS`, `MOTION`,
`FUSED`, and `DEMO` sources without giving renderers or scores direct access to
browser sensor APIs. No source should start automatically or silently replace a
source the user selected.

### Important technical truth

An accelerometer may offer faster and denser **short-term motion** evidence than
GPS, but it is not automatically a more accurate absolute speed source.
Integrating acceleration into velocity accumulates bias and drift; gravity,
phone orientation, road slope, bumps, vibration, mounting position, and sensor
noise all affect the signal.

The future design must therefore choose honestly between:

1. **Motion-reactive mode:** use longitudinal acceleration, braking, turning,
   vibration, and stop/start confidence without displaying invented `km/h`;
2. **Sensor fusion:** use motion data for fast transients and GPS for a bounded
   long-term speed reference when both are available;
3. **Calibrated relative drive:** derive a temporary session-response envelope
   after a parked calibration, again without claiming absolute vehicle speed.

⭐ The preferred first spike is motion-reactive mode. It delivers the distinctive
friend's-car experience without making an unreliable inertial speed claim.
Sensor fusion can follow only after measured iPhone traces justify it.

### Architecture and privacy boundaries

- extend the existing normalized input boundary rather than branching music and
  visuals into iPhone-specific implementations;
- request motion access only from a deliberate user gesture and only on a secure
  origin; current iOS Safari permission and API behavior must be re-verified at
  implementation time;
- perform a short, understandable parked calibration and detect orientation or
  mounting changes instead of assuming the phone lies in one fixed axis;
- expose input source, permission, sample cadence, confidence, calibration age,
  and degraded state in REPORT without storing or transmitting raw motion
  history by default;
- keep all raw motion samples in bounded page-session memory and retain the
  project's manual-send privacy boundary;
- measure Bluetooth audio latency separately. It must not be confused with
  sensor latency, and any compensation must stay bounded and reversible;
- preserve GPS, Demo, keyboard simulation, the `130 km/h` response contract, and
  every existing renderer/audio safety bound.

### Feasibility and acceptance gate

Revisit after the landscape-first iPhone foundation exists. The spike must use
real current iPhone Safari evidence and cover:

- availability and explicit permission flow after a user gesture;
- sample cadence, timestamp stability, screen-lock/background behavior, and
  live portrait-to-landscape rotation;
- parked calibration, arbitrary safe phone orientation, remount detection, and
  graceful loss/recovery;
- recorded stationary, ordinary launch, hard launch, braking, cornering,
  incline, rough-road, and false-positive fixtures;
- comparison of GPS, motion-only, and fused timing without claiming one source
  is universally more accurate;
- Bluetooth-speaker listening and audiovisual latency on at least one real
  friend's-car session;
- no fabricated speed, no coordinate persistence, no automatic fallback, and
  no regressions to the Tesla `773 × 601` contract.

Implementation begins only after an explicit owner decision and the required
three-direction interface gate for source selection, permission, calibration,
confidence, and recovery states.

## DI-001 — Divergent concept: MOTION instead of speed

Rather than trying to reconstruct a conventional speedometer from an
accelerometer, a future `MOTION` experience could treat movement itself as the
instrument:

- longitudinal force shapes OPEN and UNDERWATER;
- turn demand bends or rotates the visual field;
- road texture introduces restrained material detail;
- stopping lets the score settle without pretending the inferred speed reached
  an exact number;
- a slow-decaying movement envelope supplies continuity between sensor events.

This could feel more immediate and playful than GPS while staying technically
honest. It is an **agent proposal**, not approved product scope, and must remain
separate from `FI-001` until the owner chooses it.

## Register maintenance

When capturing another idea:

1. assign the next `FI-###` owner-idea ID or `DI-###` divergent-idea ID;
2. record origin, date, status, user value, and the main truth or risk;
3. link existing roadmap/specification detail instead of copying it in full;
4. never promote, implement, reject, or merge an owner idea silently;
5. retain rejected entries so the same dead end is not rediscovered later.
