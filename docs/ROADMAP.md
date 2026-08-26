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

Status: **DIRECTION SELECTED; CURRENT BUILD IMPLEMENTED**.

Exactly three revised minimal directions were presented after the luminous-axis rejection. The selected **Modular Aperture** direction uses a flat Braun/Swiss control plane and a sparse rectangular field that converges into a centered tunnel. Five body-color themes are approved. The Laminar alternative is preserved only as an ignored study because its visible resemblance to Infinite Lights requires a stronger independent reinterpretation before use.

## Phase 3 — Flux signal and music spike

Status: **IN PROGRESS**.

Implemented:

- nullable GPS normalization, deadband, smoothing, and bounded Demo input;
- tempo knee with asymptotic ceiling;
- continuous energy separated from discrete layer/Brake events;
- four-section lookahead arrangement, bar-quantized transitions, two-bar dwell, crossfades, and limiter;
- full-energy speed threshold and curated `APERTURE 01` environment;
- deterministic desktop signal tests.

The earlier synthesized spike was explicitly rejected. The current build implements the first authored adaptive arrangement and purposeful control model; its musical quality is still pending a real Tesla listening test.

Gate: no audible jitter on deterministic replay, no frantic high-speed march, all automated tests green, and no masking of vehicle alerts.

## Phase 4 — Flux generative renderer spike

Status: **MODULAR APERTURE IMPLEMENTED; TESLA PERFORMANCE PENDING**.

Implemented:

- procedural WebGL2 Modular Aperture field with no texture asset;
- bounded speed energy, palette, aggregate pulse, Brake, and asymmetric deceleration response;
- reduced-motion behavior and continuously redrawn Canvas2D fallback;
- flat Braun/Swiss interface, compact diagnostics, and body-color selection at `773 × 601`.

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
