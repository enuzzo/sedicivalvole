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
- Header and footer controls retire fully off-canvas at rest instead of remaining as translucent overlays; only the speed and unit remain visible above the field.
- A first tap anywhere on the resting surface restores the complete control layer without changing a value; diagnostics remain reachable after that wake gesture.
- Sliders and buttons must independently activate and adjust functions, sound layers, and visual layers.
- Stop/Mute and current audio state must remain immediately recognizable.
- Full configuration is intended while parked; driving state emphasizes atmosphere, not manipulation.
- Focus, active, disabled, and current-value states must remain distinct.
- `prefers-reduced-motion` must meaningfully calm the experience.

Tesla instructs drivers not to adjust the touchscreen while driving. This is a primary design constraint. WCAG's 24×24 CSS-pixel minimum is only a web floor, not an adequate physical in-car target.

## 3. Confirmed primary modes

The product has two equal primary modes that remain selectable from either experience:

- **Engine**: selectable engine-sound emulation. Each engine model has its own audio behavior and may use a dedicated instrument-inspired visualization such as an abstract tachometer, throttle/load field, acceleration trace, or similarly focused motif.
- **Flux**: the current adaptive music system. Speed, acceleration, deceleration, and discrete motion events shape tempo, arrangement, energy, timbre, and space. Its visual family uses animated gradients, chromatic fields, depth/tunnel motion, and optionally abstract procedural road-like geometry in WebGL.

The modes share speed acquisition, simulation, diagnostics, privacy rules, AudioContext unlock, master Stop/Mute, output protection, reduced motion, and accessibility. They do not share a single undifferentiated audio arrangement or visual identity.

The active mode must be unmistakable and the switch must not be buried in settings or available only on the splash. Switching must avoid abrupt gain jumps, overlapping full mixes, or a second GPS/audio permission flow.

Engine is an emulation driven by the signals the browser actually exposes. It must never claim access to real vehicle RPM, throttle position, gear, motor load, or CAN data without direct evidence.

See [`MODES.md`](MODES.md) for the boundary model, recommendations, and open decisions.

## 4. Confirmed Flux visual direction

### Excluded

- environmental scenes, landscapes, characters, illustrated objects, or narrative decoration;
- cheap vectors, old Flash-animation aesthetics, generic dashboards, and decorative motion disconnected from sound.

### Required

- an abstract, minimal, elegant system based on geometry, chromatic fields, rich animated gradients, light, depth, and motion;
- a parametric generative relationship to audio state and speed;
- an optional mode that accelerates and converges into a tunnel/depth sensation;
- an interesting visualization for each sound or layer, sharing a coherent family while supporting different colors, moods, and parameters;
- curated body-color themes that provide a clear visual choice without exposing low-level shader parameters;
- progressive degradation when GPU, shaders, or frame budget are unreliable;
- reduced motion that preserves atmosphere and information without aggressive tunnel movement.

Exactly three revised Product Design directions were shown after the luminous-axis rejection. The user selected **Modular Aperture**: an ordered rectangular field with a low black control plane, flat monochrome geometry, and a restrained body-color accent. The interface is Braun-influenced, Swiss, minimal, and slightly brutalist, with square actions, strict monospace typography, no circular buttons, and no glassmorphism.

Framed controls use a restrained 6 px corner radius rather than completely sharp corners. The speed readout occupies an exact header-grid cell with the same divider stroke while the chrome is awake; when the header retires, the readout remains fixed in place and gains only the exposed lower corner treatment so it reads as a detached module rather than an unrelated overlay.

Modular Aperture is calm and comparatively flat at rest. Zero speed uses a complete Swiss mosaic of large square modules, distributed evenly across four tones from the active body-color palette, with no missing cells, black gaps, or central void. As energy rises the same modules become smaller; speed then bends and recedes that shared coordinate field into a centered funnel/tunnel instead of fading between separate scenes. The dark terminal aperture opens geometrically only as depth forms. Deceleration reverses the same continuous transformation so the tunnel flattens back into squares without a flash or a disabled-warp step. At high velocity, modules travel outward from the central vanishing point and stretch into radial stripes, compressing perceived depth into a Plaid-like velocity field. Curated Pearl, Graphite, Red, Blue, and Silver body-color themes change the visual character without exposing low-level shader controls. See [`RECOVERED-REQUIREMENTS-2026-08-26.md`](RECOVERED-REQUIREMENTS-2026-08-26.md).

The module identity must remain visually continuous across the entire speed range: size, aspect ratio, perspective, curvature, and depth may deform, but modules must not be replaced through an opacity fade. The zero-speed endpoint is genuinely two-dimensional and square; the maximum-speed endpoint is the most elongated and deeply projected version of that same field.

## 5. Splash and audio unlock

- The future splash uses tunnel vision and flows continuously into the main scene.
- It is not an artificial wait.
- The first deliberate gesture may unlock Web Audio and complete minimum preload.
- Reserve a structural logo area without inventing a final mark.
- Display the version discreetly on the splash and/or when controls are visible.
- Support fast return visits and a reduced-motion variant while respecting any required new audio gesture.

## 6. Speed, GPS, and simulation

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

## 7. Flux music and speed mapping

The received HTML is a useful starting point but not the target ambition. The current Drive Lab audio spike is audible but musically rejected; isolated pings, exposed oscillator tones, and a noise bed do not satisfy the product.

- BPM must not increase nearly linearly into a frantic march.
- The speed-to-tempo curve needs a knee and must asymptotically approach a musical ceiling.
- Beyond the knee, intensity comes mainly from deeper arrangement and environment: layers, harmony/tension, rhythmic density, low end, kick, percussion, timbre, space/reverb, and motion.
- Continuous parameters include speed, energy, filters, dynamics, and effect sends.
- Discrete structural events include layer entry, harmonic change, new section, and Brake.
- Use hysteresis/dwell, bar or beat quantization, and crossfades to avoid nervous switching.
- Acceleration/deceleration may prepare a transition rather than changing everything immediately.
- Sustained acceleration and deceleration must not retrigger transition effects on a timer. A direction change produces one bounded musical gesture, while continuous motion envelopes shape rhythm, low end, timbre, dynamics, and space.
- A continuous restrained energy wave remains underneath the mix; its frequency and gain rise smoothly with acceleration.
- Beat rate and rhythmic density must also increase perceptibly with speed while retaining the tempo knee and musical ceiling.
- Flux must behave like a curated adaptive arrangement: kick, low end, percussion, rhythmic detail, harmony, timbre, effects, and spatial depth enter and evolve coherently.
- The first priority environment must reach a recognizable Jungle/D&B identity at high energy through break structure, syncopation, sub/reese movement, riffs, fills, and a genre-appropriate tempo ceiling; a slow soft-club groove at approximately 115 km/h is explicitly rejected.
- The score must retain short-term kinetic memory during deceleration. Brief speed drops preserve transport and the principal groove while changing pressure and space; only sustained lower speed gradually removes layers and then lowers tempo at musical boundaries. Re-acceleration cancels queued removals instead of restarting the score.
- Flux needs an authored synth/sequencer system with independent lanes, patterns, kits, scenes, deterministic variation, and quantized transitions. Samples are optional and must be original or separately licensed.
- Both beat-driven and beatless digital environments are allowed, but each must have an authored musical identity.
- A Flux environment is an authored audiovisual bundle: generative visual system, musical genre/score, palette family, geometry parameters, and speed-response mapping. Users may select an environment and tune its supported palette without exposing low-level renderer or mixer controls while driving.
- The environment system must make variety structural rather than decorative: changing environment may change visual mechanics and musical genre, while every environment consumes the same normalized speed, energy, acceleration, deceleration, Brake, safety, and diagnostic contracts.
- The primary user-facing performance control should be an energy threshold defining the speed at which an environment reaches full intended energy. Low-level `Atmos`, `Harmonics`, and `Pulse` controls are not accepted as the final driving interface.

## 8. Feature decision matrix

| Feature | Status | Note |
|---|---|---|
| Engine mode with synthesized/sampled models | confirmed primary mode | mapping, catalog, quality, and latency require dedicated spike |
| Adaptive synth + sequencer | architecture queued | textStep study recorded; browser worklet spike and musical acceptance pending |
| Modular Aperture generative visual | implemented prototype | WebGL2 plus Canvas2D fallback; Tesla performance pending |
| Selectable audiovisual environments | confirmed product model | visual, genre, palette, and geometry variation; Interstate 4/7-inspired studies pending selection and independent implementation |
| Open packs | strategic goal | schema and licensing not frozen |
| Offline core | planned after capability test | browser persistence unknown |
| Reactive map / OSM limits | not confirmed for v1 | scope, network, distraction, and policy risk |
| WAV-to-parameter editor | future research | source lab not validated on real audio |
| Trip postcard | not confirmed | privacy conflict requires review |

## 9. Assumptions that must not become facts

- The target Tesla provides numeric `coords.speed` at useful cadence and quality.
- Browser permission, cache, and storage persist between sessions.
- Background audio continues exactly as community reports suggest.
- WebGL2 renderer strings identify MCU hardware reliably.
- WASM synthesis is always cheaper than sample playback.
- A single community viewport applies to every Tesla model/software combination.
- OSM `maxspeed` is numeric, complete, directionally correct, or policy-free.

## 10. Vehicle information still required

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

## 11. Version, documentation, deployment, and license

- `VERSION` is the only SemVer source of truth; `0.0.0` means no release.
- The app exposes the version discreetly.
- README contains only implemented facts and real verified screenshots.
- `CHANGELOG.md` keeps an `Unreleased` section.
- During private development, user-approved builds go to the canonical root and are verified live.
- The operative repository license is AGPL-3.0-or-later for code and documentation, with original brand/audio/standalone media outside that grant as defined in `LICENSE-SCOPE.md`.
- AGPL allows commercial use, forks, rebranding, and sale; it does not prevent cloning.
- Exact legal ownership, trademark policy, contributor terms, and the final mixed-license asset policy remain open for legal review; do not invent an owner.
