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
- The phone experience is landscape-first, with explicit support for current iPhone Safari viewport families and safe-area insets. Representative landscape widths from `667 × 375` through `932 × 430` must keep the launch flow, top bar, REPORT, contextual controls, and footer usable without clipping or horizontal scroll.
- On a coarse-pointer phone in portrait, a full-viewport accessible notice asks the user to rotate to landscape and makes the underlying product inert. The notice clears after a real orientation change without reloading, duplicating the AudioContext, losing the current selection, or restarting music or the renderer. This is a request to rotate, not a claim that the browser can force orientation; portrait-like desktop windows and Tesla `773 × 601` remain unaffected.

Tesla instructs drivers not to adjust the touchscreen while driving. This is a primary design constraint. WCAG's 24×24 CSS-pixel minimum is only a web floor, not an adequate physical in-car target.

## 3. Confirmed primary modes

The product has two equal primary modes that remain selectable from either experience:

- **Engine**: selectable engine-sound emulation. Each engine model has its own audio behavior and may use a dedicated instrument-inspired visualization such as an abstract tachometer, throttle/load field, acceleration trace, or similarly focused motif.
- **Flux**: the current adaptive music system. Speed, acceleration, deceleration, and discrete motion events shape tempo, arrangement, energy, timbre, and space. Its visual family uses animated gradients, chromatic fields, depth/tunnel motion, and optionally abstract procedural road-like geometry in WebGL.

The modes share speed acquisition, simulation, diagnostics, privacy rules, AudioContext unlock, master Stop/Mute, output protection, reduced motion, and accessibility. They do not share a single undifferentiated audio arrangement or visual identity.

The active mode must be unmistakable and the switch must not be buried in settings or available only on the splash. Switching must avoid abrupt gain jumps, overlapping full mixes, or a second GPS/audio permission flow.

Engine is an emulation driven by the signals the browser actually exposes. It must never claim access to real vehicle RPM, throttle position, gear, motor load, or CAN data without direct evidence.

See [`MODES.md`](MODES.md) for the boundary model, recommendations, and open decisions.

## 4. Confirmed Flux visual directions

### Excluded

- environmental scenes, landscapes, characters, illustrated objects, or narrative decoration;
- cheap vectors, old Flash-animation aesthetics, generic dashboards, and decorative motion disconnected from sound.

### Required

- an abstract, minimal, elegant system based on geometry, chromatic fields, rich animated gradients, light, depth, and motion;
- a parametric generative relationship to audio state and speed;
- an optional mode that accelerates and converges into a tunnel/depth sensation;
- an interesting visualization for each sound or layer, sharing a coherent family while supporting different colors, moods, and parameters;
- curated palettes that coordinate the visual field and interface accent without exposing low-level shader parameters;
- progressive degradation when GPU, shaders, or frame budget are unreliable;
- reduced motion that preserves atmosphere and information without aggressive tunnel movement.

Exactly three revised Product Design directions were shown after the luminous-axis rejection. The user selected **Modular Aperture**: an ordered rectangular field with a low black control plane, flat monochrome geometry, and a restrained palette accent. The interface is Braun-influenced, Swiss, minimal, and slightly brutalist, with rectilinear actions softened by the shared `6 px` radius, a locally hosted Space Grotesk variable type system, no circular buttons, and no glassmorphism. The later owner-selected **Road Sheet** direction defines the shared interface anatomy and the LIGHT surface family: warm ivory, quiet control gray, near-black type and actions, vermilion state rails, and hairline structure. DARK must preserve that exact layout, grouping, spacing, typography, and interaction hierarchy while mapping it to near-black, charcoal, dark-gray, warm-light, and vermilion tokens. Space Grotesk uses `400` for reading text, `500` for primary values, `600` for controls and `700` for operational labels. Orbitron is the sole textual exception: exact `sedicivalvole` project wordmarks use weight `750` and restrained `-0.02em` tracking in the Signal Gate, Instrument Deck and owner LAB. The running top bar uses the 16 Road product mark without a textual wordmark. `PLAY THE ROAD` remains Space Grotesk `600` with zero added tracking. The active visual palette also drives the interface accent and persists locally across reloads and later visits; the future product-wide `LIGHT`/`DARK`/`AUTO` appearance remains a separate preference with an explicit reset path. AUTO chooses between the shared LIGHT and DARK grammars without recolouring or replacing the active visual palette.

Framed controls, cards, panels, and standalone buttons use one restrained `6 px` corner radius rather than completely sharp corners. This is a system token, not a per-component styling choice. The speed readout occupies an exact header-grid cell with the same divider stroke while the chrome is awake; when the header retires, the readout remains fixed in place and gains only the exposed lower corner treatment so it reads as a detached module rather than an unrelated overlay. At Tesla width, the running top bar begins with a fixed `68 px` product-mark report trigger and keeps the telemetry lane flexible: the speed module stays pinned to the right while the lane's leading `195 px` at `773 × 601` and `124 px` at `702 × 546` remain available for future low-priority appearance or status controls. X10 must select a contrast-safe mark variant when LIGHT top-bar tokens are implemented.

The selected product identity is **16 Road**: a large path-outlined Orbitron
weight-750 `16` framed by mirrored three-line roads using the Signal Gate's
vermilion and warm-white language. It must remain readable from favicon to
1024 px presentation scale, fill a square canvas without clipping, and retain
dark, warm-light, and genuine-alpha masters. Browser icon adoption is approved;
replacing the existing textual splash hierarchy requires a separate visible
composition review rather than an automatic asset swap.

Modular Aperture is calm and flat at rest. Zero speed uses a complete Swiss mosaic of large square modules, distributed evenly across four tones from the active palette, with no missing cells, black gaps, or central void. That intact mosaic is a rigid end wall: it recedes without deforming from `0–40 km/h`, progressively revealing the existing centered perspective tunnel behind it, then disappears at its terminus. Deceleration reverses the same wall travel so the complete grid returns without a flash. Above `40 km/h`, the approved tunnel, palette, perspective, flow and high-velocity radial compression continue unchanged. Ten curated palettes change both the visual character and interface accent without exposing low-level shader controls. See [`RECOVERED-REQUIREMENTS-2026-08-26.md`](RECOVERED-REQUIREMENTS-2026-08-26.md).

After the later REGISTER rejection, exactly three new directions — PLUMB, SLIP
and WAKE — were presented. PLUMB reached a local Canvas2D prototype, but its
first exact `773 × 601` review triggered the direction's own retirement rule:
the field read as decorative strings/bars and lacked emotional or perceptual
value. It was rejected before publication and removed from the runtime, QA and
active tests. Aperture remains the fresh-session and invalid-preference
fallback. WAKE was subsequently selected and implemented under an exact
reference-fidelity contract, then rejected after repeated live review because
its ribbons read as disordered rain rather than a convincing 3D field. Its
catalog entry, renderer, fallback, tests and QA captures are removed; SLIP
remains proposal-only.

`MERIDIAN 03` follows the selected oblique-blade reference contract: sparse
large red, white and secondary-colour Euclidean planes flank a low, readable
corridor. The continuous field keeps vertical excursion gentle and bounded;
speed raises FOV, depth compression, peripheral stretch, parallax and
longitudinal flow monotonically. Conventional buildings, stacked towers,
balconies, cheap wireframe grids and excessive particles are excluded.

`ATLAS 04` is the passenger-oriented bird's-eye city environment. It presents a
palette-driven 3D OpenFreeMap field, a concise selected-page Wikipedia abstract
with a free thumbnail when available, five local reading choices and a QR for
the selected page. The map runtime is loaded only when ATLAS is selected.
Position is ephemeral, never enters the
diagnostic report or persistence, and third-party map/nearby requests are
disclosed in the interface and privacy documentation. The field centers on each
trusted fix and follows its reported heading; when heading is absent, movement
between successive fixes supplies the bearing while near-standstill jitter keeps
the last reliable direction. Camera pull-back is bounded so the `130 km/h` view
retains an oblique pitch and materially extruded buildings. At `773 × 601`, the
passenger panel reserves `246 px`, uses `12 px` reading text and presents an
`86 px` QR generated from a `192 px` source.
The manual camera accepts one-finger or primary-button mouse drag for bearing
and pitch hard-clamped to `0–85°` without elastic overshoot, two-finger pinch or
wheel/trackpad scroll for bounded extended zoom, and retains every manual
gesture for six idle seconds before easing back to the latest automatic
position and camera. Product chrome is pointer-transparent
only over the map surface; the GPS recovery, telemetry and low control planes
remain interactive.

`DRIVEY 05` embeds the actual Rezmason Drivey road, level, traffic, camera and
rendering runtime pinned at commit
`5104cdade2a3158786b05b9b0680a50e942830cf`. The 51 upstream files remain
byte-identical under a checked SHA-256 manifest. A separate project-authored
iframe shell and bridge map the existing speed, music, performance-effect and
ten-palette state onto controls and material buffers already owned by the
runtime. The bridge uses the upstream automatic `Input`, removes only the
player car's random weaving, and applies the shared frame-rate-independent road
response plus the actual timestamped OPEN, UNDERWATER and BLOOM envelopes. At
commanded zero it holds the player motionless on the current lane centre; motion
resumes from the same road location. Sixteen NPCs are retained only when every
generated car can be deterministically placed and verified in the direction
opposite the player, otherwise the runtime displays no NPC traffic. The former
traffic-count preference is retired. Each theme exposes its native `accent` and
`secondary` colours simultaneously. Its only direct controls are two compact text buttons: one cycles Hood,
Rear and Aerial views; the other cycles Normal and palette-coloured Wire render
modes. Neither control opens a dropdown or panel.

`PRTCL 06` is one environment with three particle families, not three catalog
entries. Its project-authored WebGL2 renderer adapts the directly authorized
Fractal Frequency, Murmuration, and Axiom formulas from PRTCL commit
`2a22f33b975e2c40b7ee0bdd2d1acb4cee4f5060`, preserving the reviewed
`24,000`, `16,000`, and `37,000` draw counts and characteristic compositions
without importing the PRTCL runtime, UI, dependencies, brand, or assets.
Fractal Frequency is the default. One compact `94 × 34 px` text-only `TYPE`
button cycles Fractal, Murmuration, and Axiom directly; it opens no dropdown or
panel and remains separate from the shared `PALETTE` control. Road speed owns
complete-form scale, point size, depth, and travel; both scale responses saturate
at `100 km/h`, while depth and travel continue to `130 km/h`. Musical level owns
colour and luminous pulse. OPEN, UNDERWATER, BLOOM, and reduced motion are
implemented in this native particle grammar, with frame-rate-independent macro
morphs rather than discrete state jumps. Human visual approval and canonical
publication are complete; target-Tesla acceptance remains an explicit gate.

`PRIMORDIAL 08` is retired. The product owner rejected it on 2026-08-30 and its
renderer, fallback, tuner, preference payload, catalog entry, QA path and active
tests are removed. Git and the dated source-admission record retain the decision
history. Its proposed successor is a separate original Gradient Field: before
implementation, exactly three visual directions must be presented and one must
be selected. ShaderGradient, FeralUI Gradients, and ColorFlow are reference
inputs only within their individually audited licence boundaries; no shader,
runtime, preset, export, embed or asset enters the product by implication.

`VERTIGO 02` is the approved second visual environment and must render the original Interstate 7 scene, not an independent visual translation. The vendored files from upstream commit `e58d58520bc0dfde21f9e14e6a1b8c7f0a2a2a9e` remain byte-identical and retain the complete road, repeated side light sticks, opposing car-light trails, bloom, camera, deep distortion, fog, geometry, and bundled Three.js/post-processing pipeline. The sedicivalvole integration keeps the iframe black until the upstream editorial shell is hidden, so only the canvas appears. An external bridge maps `0–130 km/h` to the original `speedUpTarget` and FOV controls and maps the selected theme onto the runtime's existing colour attributes and uniforms without editing the vendor tree.

The module identity must remain visually continuous across the entire speed range: size, aspect ratio, perspective, curvature, and depth may deform, but modules must not be replaced through an opacity fade. The zero-speed endpoint is genuinely two-dimensional and square; the maximum-speed endpoint is the most elongated and deeply projected version of that same field.

## 5. Splash and audio unlock

- The approved Signal Gate splash uses paired vermilion and ice-blue light lanes that bend from the lower edges into a narrow central vertical gate on black. Each lane carries its own short, independently phased travelling interruption so the two flows remain legible, while a restrained perspective-air layer adds depth without becoming a starburst.
- Its single launch action is a compact `360 × 160 px` warm-ivory surface at `773 × 601`: the selected `42 px` 16 Road mark sits to the left of a responsive `26–32 px` lowercase Orbitron `750` wordmark with restrained `-0.02em` tracking, above a full-width black Space Grotesk `600` `PLAY THE ROAD` field with zero added tracking. The horizontal lockup occupies a `64 px` product band while the command keeps the remaining `74 px` inner field. The command carries a continuous horizontal white-to-red colour wave built as an exact repeating spatial period; the animation advances by precisely one period per cycle so its reset cannot produce a visible discontinuity. The whole surface remains one semantic button and must not simulate knobs, switches, vents, latches or other nonfunctional hardware.
- The field is generated in WebGL2, retains a Canvas2D fallback, and stops animating after launch; it is not a static raster or an artificial wait.
- One large `PLAY THE ROAD` gesture opens the selected **Instrument Deck** launch screen in the owner-approved LIGHT Road Sheet language. One open warm-ivory sheet carries a compact left-aligned 16 Road and Orbitron wordmark lockup, hairline header, left-aligned `MUSIC` and `VISUAL` labels, quiet gray direct controls, short vermilion selected-state rails, and one black `START` field. Its direct controls use concise descriptions, and `START` remains disabled until both axes are explicitly selected, including a Visual alongside MUTE. At `773 × 601`, the complete Music and Visual button blocks share an exact `342 px` top-to-bottom span; the `72 px` header, common compact padding and spacing, and title-independent selected rail leave enough room for the registry-derived Visual row count to produce a future third `108.66 px` row without growing the launcher. SOUNDTRACK remains visible but unavailable until the actual player is connected; Illobo's later featured `Signal Border` belongs inside the SOUNDTRACK library, not beside the top-level music modes. `START` then unlocks Web Audio and completes minimum capability checks before the splash fades into the selected live environment.
- Keep the `sedicivalvole` wordmark large and integrated into the launch surface, show the injected build identity discreetly, and center the legible `A project by enuzzo` / Illobo credit below the CTA. Link enuzzo to `github.com/enuzzo`, link Illobo to `github.com/illobo`, and expose the public `github.com/enuzzo/sedicivalvole` source directly beneath the credit. A restrained top-left support control opens the verified `buymeacoffee.com/enuzzo` destination, the supplied QR and an invitation for suggestions independent of payment. Any decorative support-energy number must explicitly say that it is not a purchase count; never fabricate donation or customer totals.
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
- ATLAS may retain the latest reliable point only in session memory and use it
  for disclosed OpenFreeMap tile and coarse Wikimedia Geosearch requests while
  that environment is selected;
- a bounded session-memory flight recorder may retain speed, GPS age/accuracy, input state, audiovisual state, performance, network, and lifecycle evidence, but never position; transmission remains manual and explicit;
- understandable degraded GPS state without intrusive alarms.

### Keyboard simulator

- holding `ArrowUp` applies the estimated Model 3 AWD acceleration curve;
- releasing `ArrowUp`, or pressing `ArrowDown`, applies the nominal regenerative lift-off curve continuously from the exact current speed;
- holding `Space` continuously brakes the simulator from the exact current speed; releasing it preserves a short settle before acceleration resumes;
- no persistent HUD or on-screen simulator toggle;
- after keyboard use, a small bottom-right speed/source hint appears briefly and fades;
- keyboard handlers do not intercept focused inputs, buttons, sliders, or other controls;
- prevent scrolling only when the simulator actually handles the event;
- simulation temporarily overrides GPS and returns only after its speed converges with the observed GPS stream; time-based handoff must not create a discontinuity;
- desktop tests must advance time and input deterministically.

The held simulator brake is a continuous motion input plus one bounded Brake-onset event. The continuous state drives speed; the onset event may drive controlled audio and visual accents without repeated triggers, harsh flashes, or dangerous peaks.

Demo motion is integrated against elapsed time rather than timer ticks. Its acceleration curve is calibrated to Tesla's official `4.4 s` zero-to-100 km/h figure for the current Model 3 Premium Long Range AWD, using the published `1,824 kg` curb mass as the reference vehicle. Braking is an explicit moderate-force product estimate with a progressive pedal ramp, not a claim about Tesla's proprietary calibration.

Lift-off is a separate nominal model: `1.7 m/s²` estimated peak regenerative deceleration, `0.10 m/s²` rolling-resistance allowance, a `0.45 s` release ramp, progressive low-speed taper, and Vehicle Hold capture below `0.8 km/h`. Tesla publishes the behavior but not one invariant deceleration curve: accelerator release slows the vehicle and recovers energy, real regenerative strength varies with battery temperature and state of charge, and regular brakes may compensate when regeneration is limited. UN Regulation No. 13-H requires a stop-lamp signal above `1.3 m/s²` of regenerative deceleration; that regulatory threshold informs the nominal magnitude but is not a Tesla performance measurement.

The same dynamics define three soft GPS plausibility regions: acceleration, ordinary regenerative lift-off, and wider service braking. They may bound an abrupt sensor outlier, but must never fabricate motion, replace the first valid numeric sample, or turn unavailable speed into zero.

## 7. Flux music and speed mapping

The received HTML and the two early synthesized spikes are historical baselines,
not the current product. The current Drive Lab runs the authored FRACTURE score
inside an AudioWorklet. It must still pass a real Tesla listening review; passing
automated tests or sounding acceptable on a desktop does not establish musical
acceptance in the vehicle.

- BPM must not increase nearly linearly into a frantic march.
- The speed-to-tempo curve needs a knee and must asymptotically approach a musical ceiling.
- Beyond the knee, intensity comes mainly from deeper arrangement and environment: layers, harmony/tension, rhythmic density, low end, kick, percussion, timbre, space/reverb, and motion.
- Continuous parameters include speed, energy, filters, dynamics, and effect sends.
- Discrete structural events include layer entry, harmonic change, new section, and Brake.
- Use hysteresis/dwell, bar or beat quantization, and crossfades to avoid nervous switching.
- Acceleration/deceleration may prepare a transition rather than changing everything immediately.
- Sustained acceleration and deceleration must not retrigger transition effects on a timer. A direction change produces one bounded musical gesture, while continuous motion envelopes shape rhythm, low end, timbre, dynamics, and space.
- OPEN is the shared acceleration macro; BLOOM is a rarer event inside it. BLOOM
  may arm only on a rapid hard launch, affects only the `300 Hz–8 kHz` band,
  preserves the sub, observes a long refractory period, and must release before
  the higher-priority UNDERWATER braking gesture proceeds.
- A continuous restrained energy wave remains underneath the mix; its frequency and gain rise smoothly with acceleration.
- Beat rate and rhythmic density must also increase perceptibly with speed while retaining the tempo knee and musical ceiling.
- Flux must behave like a curated adaptive arrangement: kick, low end, percussion, rhythmic detail, harmony, timbre, effects, and spatial depth enter and evolve coherently.
- The first priority environment must reach a recognizable Jungle/D&B identity at high energy through break structure, syncopation, sub/reese movement, riffs, fills, and a genre-appropriate tempo ceiling; a slow soft-club groove at approximately 115 km/h is explicitly rejected.
- The score must retain short-term kinetic memory during deceleration. Brief speed drops preserve transport and the principal groove while changing pressure and space; only sustained lower speed gradually removes layers and then lowers tempo at musical boundaries. Re-acceleration cancels queued removals instead of restarting the score.
- Flux needs an authored synth/sequencer system with independent lanes, patterns, kits, scenes, deterministic variation, and quantized transitions. Samples are optional and must be original or separately licensed.
- Both beat-driven and beatless digital environments are allowed, but each must have an authored musical identity.
- A Flux environment is an authored audiovisual bundle: generative visual system, musical genre/score, palette family, geometry parameters, and speed-response mapping. Users may select an environment and tune its supported palette without exposing low-level renderer or mixer controls while driving.
- The environment system must make variety structural rather than decorative: changing environment may change visual mechanics and musical genre, while every environment consumes the same normalized speed, energy, acceleration, deceleration, Brake, safety, and diagnostic contracts.
- The user-adjustable energy threshold is retired. Visual and score energy normalize against a fixed `130 km/h` legal-road ceiling; Aperture must reveal unmistakable tunnel depth by approximately `40 km/h` and continue deforming progressively into its full Plaid field. Low-level `Atmos`, `Harmonics`, and `Pulse` controls remain excluded from the final driving interface.
- The former threshold area is used for purposeful `VISUAL` and `MUSIC` selection. Both controls place their category above the active choice, open explicit libraries, and carry disclosure carets. The adjacent `PALETTE` control drives both field and UI accent; audio uses one icon without redundant running text. Only authored runnable music may be selected: FRACTURE and JUNCTION are ready; five later directions remain disabled and labelled `IN PREPARATION`.

## 8. Feature decision matrix

| Feature | Status | Note |
|---|---|---|
| Engine mode with synthesized/sampled models | confirmed primary mode | mapping, catalog, quality, and latency require dedicated spike |
| Adaptive synth + sequencer | implemented prototype | FRACTURE runs in the AudioWorklet; real Tesla musical acceptance pending |
| Modular Aperture generative visual | implemented prototype | WebGL2 plus Canvas2D fallback; Tesla performance pending |
| PLUMB inertial-suspension visual | rejected and retired before publication | Exact-viewport review triggered its strings/bars retirement criterion; no active renderer |
| Selectable visual environments | implemented prototype | Aperture, Vertigo, Meridian, Atlas, Drivey, and PRTCL are active with normalized motion, safety, persistence, palette, failure, and diagnostic contracts; PRIMORDIAL and WAKE are retired, the Gradient Field gate is pending, and real-Tesla validation remains open |
| Selectable musical environments | implemented prototype | FRACTURE, JUNCTION, and NIGHTSHIFT ready; four later directions remain pending |
| Open packs | strategic goal | schema and licensing not frozen |
| Offline audio core | implemented prototype | identical score DSP renders and analyses WAV references in Node |
| Offline application cache | planned after capability test | browser persistence unknown |
| ATLAS OpenFreeMap flight | implemented prototype | ephemeral GPS or explicit Milan demo; nearby Wikipedia and QR; bounded point interpolation, rendered-tile road-name extraction and English cardinal-sector models exist, while their high-rate feed and visible point/badge/compass wiring remain gated; Tesla network/memory acceptance pending |
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
- Original sedicivalvole code and documentation first distributed under the
  current policy use `PolyForm-Noncommercial-1.0.0`; commercial use is not
  granted, while original brand/audio/standalone media remain reserved as
  defined in `LICENSE-SCOPE.md`.
- Previously published AGPL versions retain the rights already granted.
  Third-party material keeps its own licence or direct permission and is never
  blanket-relicensed by the project policy.
- Exact legal ownership, trademark policy, contributor terms, and the final mixed-license asset policy remain open for legal review; do not invent an owner.
