# Roadmap

The original brief accumulated features before validating the two hardest risks: the real Tesla browser and perceived audio quality. This roadmap gates those risks first.

## Phase 0 — Source safety and direction baseline

Status: **COMPLETE**.

- archive inventory, integrity, hash, and suspicious-path review;
- complete technical and visual reading;
- ignored `_references/` library;
- Git initialization and ignore validation;
- versioned specification, critique, architecture, licensing, and deployment notes;
- secret-safe local deployment configuration.

## Phase 1 — Real Tesla capability profile

Status: **PARTIAL VEHICLE PASS**. Split-view display, WebGL2, Web Audio, AudioWorklet, WASM, storage APIs, touch points, and numeric GPS speed are now photographed on the target vehicle. The compact v3 report, fixed private recipient, explicit mail handoff, and canonical bare-root publication are implemented; inbox delivery, GPS cadence/quality, long-session performance, physical reach, and audio acceptance remain pending.

Measure:

- CSS viewport, screen, VisualViewport, DPR, safe-area behavior, and orientation;
- Geolocation availability, permission, update cadence, `coords.speed`, null values, and accuracy;
- AudioContext unlock, sample rate, latency hints, AudioWorklet, and background behavior;
- WebGL2/GPU limits, frame pacing, context loss, storage, service-worker, and cache behavior;
- touch reach and physical legibility while parked.

Gate: a repeatable vehicle report with no invented values. If GPS speed is absent or unreliable, Demo/manual mode becomes first-class rather than hidden failure recovery.

## Phase 2 — Flux visual direction

Status: **DIRECTION SELECTED; CURRENT BUILD IMPLEMENTED**.

Exactly three revised minimal directions were presented after the luminous-axis rejection. The selected **Modular Aperture** direction uses a flat Braun/Swiss control plane and one continuous square-module field that shrinks and bends from a complete four-color mosaic into a centered tunnel. Five body-color themes are approved. The Laminar alternative is preserved only as an ignored study because its visible resemblance to Infinite Lights requires a stronger independent reinterpretation before use.

## Phase 3 — Flux signal and music spike

Status: **IN PROGRESS**.

Implemented:

- nullable GPS normalization, deadband, smoothing, and bounded Demo input;
- tempo knee with asymptotic ceiling;
- continuous energy separated from discrete layer/Brake events;
- four-section lookahead arrangement, bar-quantized transitions, two-bar dwell, crossfades, and limiter;
- fixed `130 km/h` road-energy ceiling, early tunnel visibility near `40 km/h`, and curated `APERTURE 01` environment;
- filtered acceleration/deceleration envelopes with single direction-change cues and steady-state decay;
- deterministic desktop signal tests.

The earlier synthesized spike was explicitly rejected. The current build implements a first authored arrangement and purposeful control model, but the listening result at approximately 115 km/h is also rejected as a slow soft-club groove without the required Jungle/D&B rhythm, riffs, break density, or bass movement.

Queued next:

- replace the main-thread arrangement with a data-driven AudioWorklet synth/sequencer;
- author independent 32-step drum, break-detail, bass, riff, harmony, and atmosphere lanes;
- create a high-energy Jungle environment with a genre-appropriate tempo ceiling;
- implement catch/recovery/sustained-release deceleration memory so short braking does not dismantle the groove;
- evaluate original or separately licensed samples only after the synthesis-first transport works;
- use the ignored `illobo/textStep` repository as an architecture study under the provenance and licensing gates in [`REFERENCE-STUDY-TEXTSTEP.md`](REFERENCE-STUDY-TEXTSTEP.md).
- define environment data so one transport can load different authored genres, kits, patterns, arrangement rules, and matching visual identities without changing the driving-signal contract.

Gate: deterministic 0 → 115 → 60 → 115 → 0 replay, credible Jungle identity at high energy, no audible jitter or stop/start phrasing, all automated tests green, and no masking of vehicle alerts.

## Phase 4 — Flux generative renderer spike

Status: **APERTURE AND VERTIGO IMPLEMENTED; TESLA PERFORMANCE PENDING**.

Implemented:

- procedural WebGL2 Modular Aperture field with no texture asset;
- bounded speed energy, palette, aggregate pulse, Brake, and asymmetric deceleration response;
- reduced-motion behavior and continuously redrawn Canvas2D fallback;
- flat Braun/Swiss interface, compact diagnostics, and body-color selection at `773 × 601`.
- dark tunnel terminus plus off-canvas resting chrome with a persistent speed readout and wake-first interaction.
- outward high-speed flight, non-linear flow response, true-zero Demo dwell, and an opaque high-contrast speed frame.
- one seam-free geometric field that continuously morphs from large, complete four-color squares through an unmistakable urban-speed tunnel into a full Plaid field at the fixed `130 km/h` Demo ceiling;
- selectable `VERTIGO 02` WebGL2/Canvas2D field with a continuous power-curve fold, paired lateral waves, longitudinal travel, curated palette parameters, reversible deceleration, and persisted environment choice.

Queued next:

- bind the visual environment selector to authored musical genres once the new sequencer boundary exists;
- replace the truthful `SCORE / PROTOTYPE / TEXTSTEP · NEXT` placeholder with a real genre selector only after the data-driven textStep-informed transport can switch authored scores without fake states;
- retain the two unselected Interstate-inspired directions in the ignored backlog for a later three-direction gate rather than presenting them as implemented;
- profile and refine travel rate, projection response, curvature, band density, palette, and geometry on the target Tesla while preserving continuous reversible deceleration;
- verify each environment at rest, intermediate speed, full energy, and sustained deceleration at `773 × 601` before canonical deployment.

Gate: stable frame budget on the slowest target vehicle, graceful degradation, and no audio degradation while the renderer runs.

## Phase 5 — Engine mode discovery

Status: **CONFIRMED MODE, DESIGN AND AUDIO SPIKE PENDING**.

- define the synthetic speed/acceleration → RPM/load/shift model without claiming vehicle telemetry;
- evaluate procedural synthesis versus licensed loop/sample packs;
- present exactly three Engine-specific Product Design directions;
- explore instrument-inspired visuals such as an abstract tachometer, throttle/load field, acceleration trace, or mechanical light system;
- define click-free mode switching, preload budget, persistence, and shared master controls;
- validate Engine audibility and safety against vehicle alerts.

Gate: one selected Engine visual direction, one musically credible engine model, deterministic mapping tests, explicit asset provenance, and a safe dual-mode transition.

## Phase 6 — Focused dual-mode MVP

Planned only after vehicle evidence:

- selected visual family with per-layer parameters;
- an always-reachable, unmistakable Engine / Flux selector;
- separate Engine and Flux audio/rendering modules over one normalized speed pipeline;
- proven signal source and Demo fallback;
- musically accepted core arrangement;
- park-first setup, Stop/Mute, and large touch controls;
- local preferences without position persistence;
- warm offline core and visible cache state if supported;
- approved Signal Gate splash and audio-unlock flow, with final brand/version access still subject to release sign-off.

Gate: complete main flow, accessibility baseline, long-session stability, and safe passenger/parked validation.

## Phase 7 — Vehicle QA matrix

Record model, year, MCU/browser/software context, viewport, GPS behavior, audio output, touch reach, thermal/frame behavior, denied permission, null/stale GPS, network loss, and cache reset.

Gate: visible and audible PASS/FAIL evidence, not automated tests alone.

## Phase 8 — Release and deployment

- update `VERSION`, changelog, README, real screenshots, dependency notices, and final license/brand policy;
- deploy to the canonical root;
- verify live HTML, assets, version, cache headers, and behavior;
- do not infer server stack from hosting UI or cache claims.

During private development, each user-approved build is deployed to the canonical root and verified. A production release remains a separate gate.

## Deferred until the core succeeds

- reactive maps and speed-limit sources;
- WAV-to-parameter editor;
- large downloadable sound catalog;
- trip postcards or route telemetry;
- accounts, analytics, and social features.

These are hypotheses, not committed roadmap promises.
