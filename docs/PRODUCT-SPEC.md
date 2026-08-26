# Product Specification

Status: **decision baseline, not an implementation contract**. “Confirmed” items below are explicit user requirements. Recommendations, assumptions, and unknowns are labeled separately.

## 1. Confirmed identity

- Name: **sedicivalvole**, always one word and written in letters.
- Domain: **sedicivalvole.app**.
- Product nature: an atmospheric, useful, memorable audiovisual experience; not a dashboard, imitation toy, or generic card collection.
- Primary real input: locally observed vehicle speed through Web Geolocation when the Tesla browser exposes it.
- Privacy: location is not recorded or transmitted; only locally processed speed is used.
- Repository and interface language: English. Italian is reserved for direct user/assistant conversation.

## 2. Touch, safety, and control behavior

- Touch-first interaction with large, finger-comfortable controls.
- Controls may be dimmed or partially hidden at rest, then become fully opaque after interaction.
- Sliders and buttons must independently activate and adjust functions, sound layers, and visual layers.
- Stop/Mute and current audio state must remain immediately recognizable.
- A first tap on a sleeping control layer reveals controls without changing values.
- Full configuration is intended while parked; driving state emphasizes atmosphere, not manipulation.
- Dimmed opacity must not make controls undiscoverable or fail contrast.
- Focus, active, disabled, and current-value states must remain distinct.
- `prefers-reduced-motion` must meaningfully calm the experience.

Tesla instructs drivers not to adjust the touchscreen while driving. This is a primary design constraint. WCAG's 24×24 CSS-pixel minimum is only a web floor, not an adequate physical in-car target.

## 3. Confirmed visual direction

### Excluded

- environmental scenes, landscapes, characters, illustrated objects, or narrative decoration;
- cheap vectors, old Flash-animation aesthetics, generic dashboards, and decorative motion disconnected from sound.

### Required

- an abstract, minimal, elegant system based on geometry, chromatic fields, rich animated gradients, light, depth, and motion;
- a parametric generative relationship to audio state and speed;
- an optional mode that accelerates and converges into a tunnel/depth sensation;
- an interesting visualization for each sound or layer, sharing a coherent family while supporting different colors, moods, and parameters;
- at least hue control for each visual effect;
- progressive degradation when GPU, shaders, or frame budget are unreliable;
- reduced motion that preserves atmosphere and information without aggressive tunnel movement.

Exactly three Product Design directions were shown. The user selected direction 1: a luminous central axis, tunnel depth, indigo–magenta–cyan mood, and translucent lower controls. This selection guides the first Drive Lab but does not freeze the final logo, typeface, palette, or every future motif.

## 4. Splash and audio unlock

- The future splash uses tunnel vision and flows continuously into the main scene.
- It is not an artificial wait.
- The first deliberate gesture may unlock Web Audio and complete minimum preload.
- Reserve a structural logo area without inventing a final mark.
- Display the version discreetly on the splash and/or when controls are visible.
- Support fast return visits and a reduced-motion variant while respecting any required new audio gesture.

## 5. Speed, GPS, and simulation

### Source abstraction

GPS and keyboard simulation produce the same normalized stream of speed samples and discrete events. Other app layers do not access Geolocation or keyboard state directly.

### Verified platform facts

The Geolocation API requires a secure context and explicit permission. `coords.speed` is nullable by specification: [W3C Geolocation](https://www.w3.org/TR/geolocation/). No public Tesla primary source currently confirms that the in-car browser exposes `watchPosition()` or numeric `coords.speed`; this must be measured on the vehicle.

### Required behavior

- a controlled non-linear speed-to-energy curve;
- smoothing, deadband/hysteresis, upper bound, stale-state handling, and manual fallback;
- explicit handling for denied permission, absent API, inaccurate fixes, slow cadence, and null speed;
- no persistence or telemetry of raw position;
- understandable degraded GPS state without intrusive alarms.

### Keyboard simulator

- `ArrowUp` increases simulated speed;
- `ArrowDown` decreases it;
- `Space` emits a hard-brake transient;
- no persistent HUD or on-screen simulator toggle;
- after keyboard use, a small bottom-right speed/source hint appears briefly and fades;
- keyboard handlers do not intercept focused inputs, buttons, sliders, or other controls;
- prevent scrolling only when the simulator actually handles the event;
- simulation temporarily overrides GPS, then returns through a defined lease;
- desktop tests must advance time and input deterministically.

Brake is a discrete event with envelope and cooldown, not only a negative continuous delta. It may drive controlled audio and visual accents without harsh flashes or dangerous peaks.

## 6. Music and speed mapping

The received HTML is a useful starting point but not the target ambition.

- BPM must not increase nearly linearly into a frantic march.
- The speed-to-tempo curve needs a knee and must asymptotically approach a musical ceiling.
- Beyond the knee, intensity comes mainly from deeper arrangement and environment: layers, harmony/tension, rhythmic density, low end, kick, percussion, timbre, space/reverb, and motion.
- Continuous parameters include speed, energy, filters, dynamics, and effect sends.
- Discrete structural events include layer entry, harmonic change, new section, and Brake.
- Use hysteresis/dwell, bar or beat quantization, and crossfades to avoid nervous switching.
- Acceleration/deceleration may prepare a transition rather than changing everything immediately.
- A continuous restrained energy wave remains underneath the mix; its frequency and gain rise smoothly with acceleration.
- Beat rate and rhythmic density must also increase perceptibly with speed while retaining the tempo knee and musical ceiling.

## 7. Feature decision matrix

| Feature | Status | Note |
|---|---|---|
| Synthesized/sampled engine | core candidate | quality and latency require vehicle test |
| Tempo + arrangement system | prototype available | musical acceptance pending |
| Per-layer generative visuals | prototype available | direction 1 selected; deeper per-layer mapping pending |
| Open packs | strategic goal | schema and licensing not frozen |
| Offline core | planned after capability test | browser persistence unknown |
| Reactive map / OSM limits | not confirmed for v1 | scope, network, distraction, and policy risk |
| WAV-to-parameter editor | future research | source lab not validated on real audio |
| Trip postcard | not confirmed | privacy conflict requires review |

## 8. Assumptions that must not become facts

- The target Tesla provides numeric `coords.speed` at useful cadence and quality.
- Browser permission, cache, and storage persist between sessions.
- Background audio continues exactly as community reports suggest.
- WebGL2 renderer strings identify MCU hardware reliably.
- WASM synthesis is always cheaper than sample playback.
- A single community viewport applies to every Tesla model/software combination.
- OSM `maxspeed` is numeric, complete, directionally correct, or policy-free.

## 9. Vehicle information still required

### Verified on 2026-08-26

- split-view browser viewport and VisualViewport: `773 × 601`;
- logical screen: `1254 × 784`;
- DPR: approximately `1.53`;
- touch points: `16`;
- WebGL2, AudioContext, AudioWorklet, WebAssembly, Service Worker API, Cache Storage, localStorage, and IndexedDB: available;
- GPS `coords.speed`: numeric/live in the photographed session;
- photographed accuracy sample: approximately `±10000 m`, therefore not evidence of precise location quality;
- reported platform/browser: Linux x86_64, Chrome 148, AppleWebKit 537.36.

The split view is the primary driving layout. High DPR preserves visual detail, but does not justify physically small touch targets.

Capture from the integrated harness:

1. Tesla model and year;
2. MCU/hardware if available;
3. installed software version;
4. CSS viewport, screen, VisualViewport, DPR, orientation, safe areas, and browser zoom;
5. Geolocation support, permission, cadence, `coords.speed`, null rate, and accuracy;
6. AudioContext/AudioWorklet/WASM, sample rate, perceived latency, and background behavior;
7. WebGL2, frame time, context loss, and long-session temperature behavior;
8. touch reach and legibility while parked.

Tesla's official Model 3 page reports a 15.4-inch center display, but not a CSS viewport: [Tesla Model 3](https://www.tesla.com/model3). Community evidence suggests software updates can change the browser viewport, including a reported shift from 1920×1200 at DPR 1 to roughly 1254×784 at DPR 1.53. This is responsive-test evidence, not a universal specification. The real harness report is authoritative.

## 10. Version, documentation, deployment, and license

- `VERSION` is the only SemVer source of truth; `0.0.0` means no release.
- The app exposes the version discreetly.
- README contains only implemented facts and real verified screenshots.
- `CHANGELOG.md` keeps an `Unreleased` section.
- During private development, user-approved builds go to the canonical root and are verified live.
- The provisional license recommendation is AGPL-3.0-or-later for code, shaders, CSS, and build configuration, with original brand/audio/media outside that grant.
- AGPL allows commercial use, forks, rebranding, and sale; it does not prevent cloning.
- Do not create `LICENSE` until the exact legal owner and mixed-license policy are confirmed.
