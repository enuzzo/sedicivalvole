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

Status: **PARTIAL VEHICLE PASS**. Split-view display, WebGL2, Web Audio, AudioWorklet, WASM, storage APIs, touch points, and numeric GPS speed are now photographed on the target vehicle. The richer compact-view report and explicit mail handoff are deployed; inbox delivery, GPS cadence/quality, long-session performance, physical reach, and audio acceptance remain pending.

Measure:

- CSS viewport, screen, VisualViewport, DPR, safe-area behavior, and orientation;
- Geolocation availability, permission, update cadence, `coords.speed`, null values, and accuracy;
- AudioContext unlock, sample rate, latency hints, AudioWorklet, and background behavior;
- WebGL2/GPU limits, frame pacing, context loss, storage, service-worker, and cache behavior;
- touch reach and physical legibility while parked.

Gate: a repeatable vehicle report with no invented values. If GPS speed is absent or unreliable, Demo/manual mode becomes first-class rather than hidden failure recovery.

## Phase 2 — Flux visual direction

Status: **COMPLETE on 2026-08-26**.

Exactly three directions were presented. The user selected direction 1: a luminous central axis with abstract depth/tunnel motion and a translucent lower control dock. The selection fixes the current composition and visual grammar, not the final logo, typeface, palette, or future per-layer motifs.

## Phase 3 — Flux signal and music spike

Status: **IN PROGRESS**.

Implemented:

- nullable GPS normalization, deadband, smoothing, and bounded Demo input;
- tempo knee with asymptotic ceiling;
- continuous energy separated from discrete layer/Brake events;
- 16-step lookahead sequencer, layered arrangement, transitions, and limiter;
- deterministic desktop signal tests.

The first desktop listen exposed excessive Atmos noise and weak motion mapping. The audio was rebuilt around rhythmic/harmonic layer growth, but the new mix still requires an in-car verdict.

Gate: no audible jitter on deterministic replay, no frantic high-speed march, all automated tests green, and no masking of vehicle alerts.

## Phase 4 — Flux generative renderer spike

Status: **FIRST TESLA VISUAL PASS, PERFORMANCE PENDING**.

Implemented:

- selected direction 1 as a real texture asset;
- WebGL2 displacement, chromatic depth, speed energy, hue, pulse, and Brake response;
- static CSS and reduced-motion fallback;
- local comparison against the selected source at 1254×784.

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
- final splash/audio-unlock flow and version access.

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
