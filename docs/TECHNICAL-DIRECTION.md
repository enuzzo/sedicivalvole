# Independent Technical Direction

This recommendation does not automatically adopt the bootstrap stack. It optimizes for a Tesla browser, deterministic audio, graceful degradation, and maintainability.

## Recommended stack

| Layer | Recommendation | Reason |
|---|---|---|
| Language/build | TypeScript + Vite | typed contracts and simple static output |
| UI shell | Preact or similarly small component runtime | maintainable state/accessibility with low overhead |
| Real-time audio | AudioWorklet | stable scheduling away from the main thread |
| DSP | JavaScript first; WASM only after profiling | avoids premature complexity and preserves fallback |
| Visuals | WebGL2 with quality tiers, then Canvas2D/static fallback | rich generative field with progressive degradation |
| Persistence | versioned IndexedDB for packs; localStorage only for tiny preferences | explicit migrations and bounded data |
| Offline | service worker after Tesla validation | resilient core without unverified PWA claims |
| Backend | none for core | privacy, simplicity, and offline behavior |
| Deployment | static HTTPS at the canonical root | required for Geolocation and secure APIs |

The current Product Design prototype uses React because it came from the verified template. That is an implementation fact, not a final stack decision.

## System boundaries

```text
GPS adapter ─┐
             ├─> normalized speed stream ─> signal model ─> mode coordinator
Simulator ───┘                                  │             │
                                               │             ├─> Engine audio + visual
                                               │             ├─> Flux audio + visual
                                               │             └─> shared analysis snapshot
                                               └────────────────> diagnostics
```

The audio clock is authoritative for musical events. Visuals consume derived snapshots and may drop frames without changing sound. UI state never schedules musical timing directly.

## Primary-mode boundary

```ts
type ExperienceMode = "engine" | "flux";
```

The mode coordinator owns selection and lifecycle, not signal acquisition. Both modes consume the same normalized speed samples, motion events, confidence state, and master safety envelope. They share AudioContext unlock, diagnostics, master Stop/Mute, output limiter, reduced-motion preference, and fallback policy.

They remain separate audio and rendering modules:

- **Engine** maps speed and derived acceleration into an explicitly synthetic RPM/load/gear-state model, then renders selectable engine timbres and an instrument-inspired visual system.
- **Flux** maps speed and motion into tempo, energy, arrangement, harmony, timbre, space, and generative field parameters.

Switching should use a bounded equal-power crossfade or an equivalent click-free transition. The incoming mode may prewarm minimal assets, but inactive full DSP/rendering must not consume an unbounded CPU or memory budget. A switch must not recreate Geolocation, request permission again, or start a second independent AudioContext.

The mode selector must remain reachable and clearly show the active mode at the verified `773 × 601` split viewport. Its exact component anatomy and Engine visual language require Product Design exploration before implementation.

## Speed-source contract

Each source emits normalized samples and events rather than exposing browser APIs downstream.

```ts
type SpeedSample = {
  source: "gps" | "simulator";
  capturedAtMs: number;
  speedKmh: number | null;
  accuracyM: number | null;
  stale: boolean;
};

type MotionEvent =
  | { type: "brake"; strength: number; capturedAtMs: number }
  | { type: "source_changed"; source: "gps" | "simulator" };
```

Rules:

- accept `coords.speed` only when finite and non-negative;
- convert m/s to km/h once at the adapter boundary;
- treat null as unknown rather than zero;
- discard latitude/longitude immediately;
- gate optional position-derived fallback by accuracy and elapsed time, and never treat it as equivalent quality;
- use a monotonic local clock for filters and timeouts;
- simulator input gets a bounded temporary lease, then hands control back to GPS;
- do not intercept keyboard events owned by focused controls.

## Filtering and confidence

Use a pipeline with:

1. validity and accuracy gate;
2. outlier/reordering guard;
3. asymmetric smoothing (faster attack, slower release where musically appropriate);
4. deadband around tiny changes;
5. stale timeout;
6. source confidence/state;
7. a separate discrete Brake detector with cooldown.

Do not hide unavailable GPS behind a false zero. Surface `unknown`, `stale`, or `manual` in a calm, compact state.

## Multi-lane musical mapping

Never drive the entire experience from one “intensity” variable.

- `tempo`: monotonic, knee-shaped, and saturating;
- `energy`: continuous arrangement/dynamics control;
- `visualFlow`: separately filtered movement/depth response that continues to scale with speed after arrangement energy saturates;
- `confidence`: reduces risky reactions to low-quality input;
- structural state: bar-quantized layer/harmony/section decisions;
- transients: bounded acceleration, deceleration, and Brake envelopes.

A suitable family for tempo/energy is a monotonic saturating curve such as:

```text
y(v) = y0 + (ymax - y0) × (1 - exp(-v / k))
```

Use hysteresis and dwell around structural thresholds. Quantize layer changes to beats or bars and crossfade timbral/ambient changes. High speed primarily increases depth, density, low end, timbre, harmony, and space rather than tempo.

## Audio architecture

### Engine direction

The browser currently provides speed evidence, not powertrain telemetry. Engine therefore needs a deterministic synthesis model with explicitly named derived signals:

- `rpmProxy`: speed plus simulated ratio/gear state, never labeled as vehicle RPM;
- `loadProxy`: filtered positive acceleration and sustained-speed demand;
- `liftEnvelope`: deceleration/lift-off transient;
- `shiftEvent`: hysteretic synthetic structural event, not a detected vehicle gear change;
- `engineModel`: user-selected timbral/sampling definition with provenance and license metadata.

Sample loops require phase-consistent crossfades, bounded decoded-memory use, click-free pitch transitions, and conservative limiting. Procedural synthesis may reduce asset weight but must win an actual listening test. Neither approach is preferred without a dedicated spike.

### Current Flux spike

The current Drive Lab uses a main-thread lookahead scheduler for rapid validation and implements the authored `APERTURE 01` environment. Four structural sections coordinate kick, bass, hats, clap, harmony, motif, delay, and dynamics. Continuous speed maps to bounded energy and timbre; filtered acceleration and deceleration envelopes separately shape rhythmic pressure, low end, brightness, motion, and delay. A motion-direction change produces one bounded transition gesture rather than a periodically repeated effect, and the envelopes decay to steady state when speed stops changing. Section changes use hysteresis, a two-bar dwell, bar quantization, and crossfades. The user-selected full-energy threshold scales the speed domain without changing the environment's intended ceiling. This remains a prototype, not the production real-time architecture, and musical acceptance requires a Tesla listening test.

### Shared production direction

- one AudioContext created by an explicit user gesture;
- AudioWorklet for timing-critical synthesis/sequencing;
- bounded voice pool and reused buffers/nodes;
- deterministic parameter queue keyed to audio time;
- master limiter with conservative headroom;
- worklet capability fallback to simpler main-thread scheduling or sample loops;
- suspend/resume handling and explicit audio-state display;
- performance counters that do not include personal location data.

Profile before adding WASM. It is justified only if measured DSP cost, not fashion, requires it.

## Flux visual architecture

The approved Flux renderer is **Modular Aperture**, selected from exactly three revised minimal alternatives. It is an independently implemented parameterized field, not a static background:

- central-axis depth and flow;
- outward vanishing-point travel at speed, with a non-linear flow ceiling and a near-planar zero-energy state;
- independent flat/tunnel grids that crossfade without leaking four-wall discontinuities into the resting plane;
- a seam-free zero-speed score field with staggered rows, deterministic cadence, horizontal bar proportions, a central datum, and slow per-module tonal breathing;
- speed-driven radial panel elongation and reduced depth frequency in the 150 km/h velocity band;
- five curated body-color palettes;
- energy-driven pressure, luminance, distortion, and rectangular panel density;
- aggregate pulses rather than one flash per audio event;
- renderer quality levels controlling resolution scale, shader complexity, passes, and frame rate;
- context-loss recovery;
- reduced-motion mode with slow luminance/chroma breathing and no tunnel acceleration;
- a continuously redrawn Canvas2D fallback.

The Codrops/Tympanus Infinite Lights reference is useful for its coordinated instancing, depth cues, distortion, FOV response, and eased speed offset. Its source remains in the ignored reference library and its literal road/bloom treatment is not the target. Any implementation must be independent, modernized, profiled, and provenance-safe. See [`REFERENCE-STUDY-INFINITE-LIGHTS.md`](REFERENCE-STUDY-INFINITE-LIGHTS.md).

The renderer consumes a small snapshot and never blocks the audio event queue.

## Engine visual architecture

Engine may use an abstract tachometer, throttle/load arc, acceleration trace, mechanical light field, or related instrument-like motif. It must not collapse into a generic dashboard, imply unavailable telemetry, or copy a protected vehicle cluster. The next Product Design gate is exactly three Engine-specific directions; no final palette, instrument anatomy, or motion grammar is selected yet.

Flux may incorporate procedural road-like flow only as abstract WebGL geometry or light/depth structure. It must not reintroduce scenic landscapes, illustrative environments, or visually distracting narrative decoration.

## Control-state model

Controls have explicit states: `awake`, `resting`, `parked_configuration`, and `reduced`. In `resting`, the header and footer translate fully outside the viewport, the secondary energy readout disappears, and only speed plus its unit remain visible in an opaque, padded, high-contrast rectangular readout. The first interaction reveals the layer without mutating a value. Stop/Mute remains immediate once the layer is awake. Sliders use large physical targets, clear active/focus states, and accessible names.

## Splash as bootstrap

The splash represents real work:

1. a user gesture unlocks audio;
2. minimum assets are verified/decoded;
3. capability state is measured;
4. the tunnel field transitions continuously into the live scene.

Do not add artificial delay. Return visits may compress the visual sequence, but cannot bypass a newly required audio gesture. Inject version from `VERSION`; never copy it manually.

## Persistence and offline

- store only non-sensitive preferences by default;
- never persist coordinates or a raw route;
- use versioned IndexedDB records and migration tests for future packs;
- define cache version, byte budget, corruption recovery, and update flow;
- provide a visible offline-readiness indicator before relying on it;
- do not promise PWA installation until the Tesla browser proves support.

## Pack contract requirements

A future pack needs:

- strict versioned JSON Schema;
- explicit units, ranges, defaults, and compatibility version;
- content hashes and per-file provenance/license metadata;
- compressed/decoded memory budgets;
- migration and partial-failure rules;
- fixture tests and safe rejection of unknown executable content.

## Testing gates

### Deterministic desktop

- speed normalization, null/negative/outlier handling;
- smoothing, deadband, stale state, and source lease;
- tempo/energy saturation;
- hysteresis/dwell and bar-quantized structural transitions;
- Brake envelope/cooldown;
- audio unlock/resume and safe failure;
- renderer fallback and reduced motion;
- package/build integrity.

### Target Tesla

- viewport/DPR/touch reach;
- Geolocation availability, cadence, null rate, and accuracy;
- AudioContext/AudioWorklet behavior and output latency;
- frame pacing, context loss, thermal stability, and long session;
- permission denial, network loss, cache reset, and background/minimize behavior;
- audible balance against real vehicle alerts.

## Diagnostic harness and data handling

The first vehicle evidence confirms a `773 × 601` split-view CSS viewport on a `1254 × 784` logical screen at DPR `1.53`. The integrated v3 report records viewport history, runtime/GPU/audio details, bounded GPS statistics, aggregate canvas frame pacing, long tasks, page/resource timing, memory/storage hints, connection changes, and a chronological event log. High-frequency metrics accumulate outside React state so diagnostics do not add a per-frame render cost. The report contains no coordinates.

The user explicitly approved a same-origin PHP send endpoint with a fixed private recipient and extensive technical reports after an explicit send gesture. It rejects cross-origin requests, oversized or malformed payloads, and common coordinate keys; applies a hashed temporary per-client rate limit; persists no report; and exposes no FTP credentials. PHP `mail()` acceptance is local transport handoff, not inbox-delivery proof.

## Deployment

Build output is static. During the current private development phase, user-approved builds are published to `https://sedicivalvole.app/`. The FTP channel is passive port 21 and therefore unencrypted. Every deploy must keep secrets out of commands/logs, upload assets before the entry point, and verify canonical HTML/assets/version/cache behavior after publication.
