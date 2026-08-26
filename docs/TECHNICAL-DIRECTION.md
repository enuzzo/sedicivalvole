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
             ├─> normalized speed stream ─> signal model ─> audio engine
Simulator ───┘                                  │             │
                                               │             └─> analysis snapshot
                                               └────────────────> visual renderer
```

The audio clock is authoritative for musical events. Visuals consume derived snapshots and may drop frames without changing sound. UI state never schedules musical timing directly.

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
- `visualFlow`: separately filtered movement/depth response;
- `confidence`: reduces risky reactions to low-quality input;
- structural state: bar-quantized layer/harmony/section decisions;
- transients: bounded acceleration, deceleration, and Brake envelopes.

A suitable family for tempo/energy is a monotonic saturating curve such as:

```text
y(v) = y0 + (ymax - y0) × (1 - exp(-v / k))
```

Use hysteresis and dwell around structural thresholds. Quantize layer changes to beats or bars and crossfade timbral/ambient changes. High speed primarily increases depth, density, low end, timbre, harmony, and space rather than tempo.

## Audio architecture

### Current spike

The current Drive Lab intentionally uses a main-thread lookahead scheduler for rapid validation. It contains a 16-step pattern, kick/bass/hat/snare/arp/pad layers, a continuous speed-rising energy wave, speed-gated rhythmic subdivisions, a separate atmosphere drone, delay, motion cues, Brake accent, and limiter. This is a prototype, not the production real-time architecture.

### Production direction

- one AudioContext created by an explicit user gesture;
- AudioWorklet for timing-critical synthesis/sequencing;
- bounded voice pool and reused buffers/nodes;
- deterministic parameter queue keyed to audio time;
- master limiter with conservative headroom;
- worklet capability fallback to simpler main-thread scheduling or sample loops;
- suspend/resume handling and explicit audio-state display;
- performance counters that do not include personal location data.

Profile before adding WASM. It is justified only if measured DSP cost, not fashion, requires it.

## Visual architecture

Direction 1 becomes a parameterized family, not a static background:

- central-axis depth and flow;
- hue and chroma fields;
- layer-specific pressure, luminance, distortion, and particle/line density;
- aggregate pulses rather than one flash per audio event;
- renderer quality levels controlling resolution scale, shader complexity, passes, and frame rate;
- context-loss recovery;
- reduced-motion mode with slow luminance/chroma breathing and no tunnel acceleration;
- Canvas2D/static image fallback.

The renderer consumes a small snapshot and never blocks the audio event queue.

## Control-state model

Controls have explicit states: `awake`, `resting`, `parked_configuration`, and `reduced`. The first interaction while resting reveals the layer without mutating a value. Stop/Mute remains visible and usable. Sliders use large physical targets, clear active/focus states, and accessible names.

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

The first vehicle evidence confirms a `773 × 601` split-view CSS viewport on a `1254 × 784` logical screen at DPR `1.53`. The integrated v2 report now records viewport history, runtime/GPU/audio details, bounded GPS statistics, and a chronological event log. It contains no coordinates.

The user explicitly approved a same-origin PHP send endpoint with a fixed recipient. It rejects cross-origin requests, oversized or malformed payloads, and coordinate keys; applies a hashed temporary per-client rate limit; persists no report; and exposes no FTP credentials. PHP `mail()` acceptance is local transport handoff, not inbox-delivery proof.

## Deployment

Build output is static. During the current private development phase, user-approved builds are published to `https://sedicivalvole.app/`. The FTP channel is passive port 21 and therefore unencrypted. Every deploy must keep secrets out of commands/logs, upload assets before the entry point, and verify canonical HTML/assets/version/cache behavior after publication.
