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

Status: **PARTIAL VEHICLE PASS**. Split-view display, WebGL2, Web Audio, AudioWorklet, WASM, storage APIs, touch points, and numeric GPS speed are now photographed on the target vehicle. The extended v3 report, bounded coordinate-free driving flight recorder, fixed private recipient, explicit mail handoff, and canonical bare-root publication are implemented; inbox delivery, real-drive trace analysis, GPS cadence/quality, long-session performance, physical reach, and audio acceptance remain pending.

Measure:

- CSS viewport, screen, VisualViewport, DPR, safe-area behavior, and orientation;
- Geolocation availability, permission, update cadence, `coords.speed`, null values, and accuracy;
- AudioContext unlock, sample rate, latency hints, AudioWorklet, and background behavior;
- WebGL2/GPU limits, frame pacing, context loss, storage, service-worker, and cache behavior;
- touch reach and physical legibility while parked.

Gate: a repeatable vehicle report with no invented values. If GPS speed is absent or unreliable, Demo/manual mode becomes first-class rather than hidden failure recovery.

## Phase 2 — Flux visual direction

Status: **DIRECTION SELECTED; CURRENT BUILD IMPLEMENTED**.

Exactly three revised minimal directions were presented after the luminous-axis rejection. The selected **Modular Aperture** direction uses a flat Braun/Swiss control plane and one continuous square-module field that shrinks and bends from a complete multi-colour mosaic into a centered tunnel. Ten body themes now serve the original renderers. The Laminar alternative is preserved only as an ignored study because its visible resemblance to Infinite Lights requires a stronger independent reinterpretation before use.

## Phase 3 — Flux signal and music spike

Status: **FIRST AUTHORED SCORE IMPLEMENTED; VEHICLE LISTENING PENDING**.

Implemented:

- nullable GPS normalization, deadband, smoothing, and bounded Demo input;
- tempo knee with asymptotic ceiling;
- continuous energy separated from discrete layer/Brake events;
- sample-accurate AudioWorklet transport, bar/phrase-quantized arrangement, hysteresis, asymmetric dwell, crossfades, and limiter;
- FRACTURE: ten four-bar sections, four theme timbres, harmony and bass checks, offline rendering, voice audition, and measured brake processing;
- fixed `130 km/h` road-energy ceiling, early tunnel visibility near `40 km/h`, and curated `APERTURE 01` environment;
- filtered acceleration/deceleration envelopes with single direction-change cues and steady-state decay;
- deterministic desktop signal tests.

The two earlier synthesized spikes were explicitly rejected. FRACTURE replaces
them with the authored Jungle / Drum & Bass score that now runs in the browser.
Automated checks and a live desktop smoke test pass; musical acceptance still
requires a real Tesla listening session.

Completed in the current working line:

- JUNCTION's 104-clip browser runtime uses one 25.0 MB segmented Opus music bank built from 142 distinct recordings; its eight energy states each own 13 complete takes across five audible harmonic/colour families. Two family-compatible takes are mixed live only at eight-bar boundaries, neither the primary take nor musical family repeats immediately, 40 km/h remains at 127 BPM, 60 km/h remains at 135 BPM, and rest has no break or bassline;
- the bank contains a mixed, processed production rather than loose source samples; browser-delivered bytes remain downloadable and are not described as secret;

Queued next:

- keep every later score disabled and marked `IN PREPARATION` until it has an authored runtime;
- profile simultaneous AudioWorklet and WebGL rendering on the target Tesla;
- preserve the shared speed, energy, brake, safety, and diagnostic contracts when the runtime can switch more than one authored score.

Gate: FRACTURE and JUNCTION accepted during a real drive, no audible jitter or
stop/start phrasing at JUNCTION section changes, all
automated tests green, and no masking of vehicle alerts.

## Phase 4 — Flux generative renderer spike

Status: **FOUR ENVIRONMENTS IMPLEMENTED; TESLA PERFORMANCE PENDING**.

Implemented:

- procedural WebGL2 Modular Aperture field with no texture asset;
- bounded speed energy, palette, aggregate pulse, Brake, and asymmetric deceleration response;
- reduced-motion behavior and continuously redrawn Canvas2D fallback;
- flat Braun/Swiss interface, compact diagnostics, icon-only audio state, vertically ordered Visual/Music controls, and shared `PALETTE` selection at `773 × 601`.
- dark tunnel terminus plus off-canvas resting chrome with a persistent speed readout and wake-first interaction.
- outward high-speed flight, non-linear flow response, true-zero Demo dwell, and an opaque high-contrast speed frame.
- one seam-free geometric field that continuously morphs from large, complete four-color squares through an unmistakable urban-speed tunnel into a full Plaid field at the fixed `130 km/h` Demo ceiling;
- selectable `VERTIGO 02` using the byte-identical upstream Interstate 7 scene with its road, repeated side lights, opposing car trails, bloom, fog, camera, deep distortion, and original dependencies;
- an external `0–130 km/h` bridge that slows the original clock from stopped to its non-boosted `1×` rate and maps FOV from `90°` to `150°`, without editing the vendor runtime.
- original `MERIDIAN 03`, whose widening corridor, displacement field, camera aim, and travel clocks share one monotonic speed model;
- original `LATITUDES 04`, whose stacked field preserves and releases recent motion history over time;

Queued next:

- decide which visual and score combinations become authored audiovisual environments once more than FRACTURE is selectable;
- retain the two unselected Interstate-inspired directions in the ignored backlog for a later three-direction gate rather than presenting them as implemented;
- profile the unmodified Interstate 7 renderer on the target Tesla; any later travel, projection, curvature, density, palette, or geometry changes require a new explicit product decision and must not be folded into the upstream-integrity checkpoint;
- verify each environment at rest, intermediate speed, full energy, and sustained deceleration at `773 × 601` on the target vehicle.

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
