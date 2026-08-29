# sedicivalvole

> **Sequencer foundation — credit to Lobo.** The current Flux music system is
> built in part from [textStep](https://github.com/illobo/textStep),
> the step sequencer, synthesizer, and original DSP project created by
> [illobo](https://github.com/illobo). Its sequencer and performance architecture
> are Lobo's work. `sedicivalvole` translates the relevant transport, synthesis,
> and DSP into a browser AudioWorklet so vehicle speed can arrange musical
> layers. The exact derived files, modifications, license, and direct reuse
> authorization are recorded in `THIRD_PARTY_NOTICES.md`.

> Current state: **Flux Drive Lab runs the authored FRACTURE, JUNCTION and
> NIGHTSHIFT music with seven selectable visual environments in the source
> checkout and is under vehicle validation**. PRTCL 07 is locally verified and
> awaiting human visual approval before push or deployment. This is a
> development build, not a release.

Public development repository: [github.com/enuzzo/sedicivalvole](https://github.com/enuzzo/sedicivalvole).

## Vision

`sedicivalvole` turns speed, sound, and light into an atmospheric, useful, and memorable in-car experience. It is not a generic dashboard. Two equal primary modes share one motion signal and safety model while offering deliberately different audio and visual identities.

The canonical development build is available at [sedicivalvole.app](https://sedicivalvole.app/).

## What exists today

- ✅ a single ignored local reference library under `_references/`;
- ✅ source audit, product requirements, adversarial review, technical direction, and roadmap;
- ✅ Modular Aperture selected after exactly three revised Product Design directions;
- ✅ seven selectable Flux visuals in the source checkout: procedural Aperture, byte-identical upstream Interstate 7 Vertigo, the original architectural Meridian environment, the lazy-loaded OpenFreeMap ATLAS city field, the approved project-authored WAKE ribbon field, the source-faithful Rezmason Drivey runtime with three focused cameras and normal/wire rendering, and PRTCL with Fractal Frequency, Murmuration, and Axiom particle families;
- ✅ WAKE's seven broad material sheets retain soft velvet draping at low speed while their geometry streams longitudinally like roads, then crosses and knots more quickly as speed rises; its blocking Product Design comparison passes locally and real-Tesla visual acceptance remains open;
- 🛑 PLUMB failed its first exact-viewport visual acceptance and is retired from the runtime; SLIP remains proposal-only, while Aperture remains the accepted fresh-session fallback;
- ✅ GPS/Demo speed source, icon-only Mute, a fixed `130 km/h` energy ceiling, 10 curated palettes, and an integrated capability report;
- ✅ local-only speed processing and coordinate-free diagnostics; ATLAS alone keeps a reliable current position plus a short directional travel pulse in session memory while selected, never copies either into DIAG, and discloses its OpenFreeMap tile and Wikimedia nearby-reading requests;
- ✅ ATLAS touch exploration with one-pointer bearing/pitch, two-pointer extended pinch zoom and a fresh six-second eased return; a compass, top-navigation GPS status/accuracy and non-blocking permission-recovery popup replace the old waiting splash, while full-width Wikipedia imagery and five nearby choices improve passenger reading;
- ✅ FRACTURE, a production AudioWorklet score with an ambience-only launch, ten four-bar harmonic sections, a narrow tempo knee, quantized transitions, hysteresis, dwell, crossfades, and three authored half-time rhythm families that grow from sparse velvet pulse to weave before the full break is permitted at `88 km/h`; no automatic riff or response lane plays in normal playback;
- ✅ JUNCTION, a sampled production built as one synchronous performance at a time: 24 complete eight-bar clips from 76 distinct recordings, one stable E-minor harmonic grammar, native 127–168 BPM pacing, six slowly evolving clockless PARK voicings without beat or bass, four-second rhythm entrances/releases, one 5.8 MB segmented Opus bank, recent-take avoidance, and no rave lead, tonal second deck, or loose source samples;
- ✅ NIGHTSHIFT, the third adaptive score: 18 complete eight-bar synth-pop
  performances, one project-authored A-minor grammar and native 85–140 BPM
  MusicRadar drum families. Its clockless PARK form has six quiet voicings with
  no beat or bass; fast drumming cannot enter before `82 km/h`. The browser
  retains at most six decoded mixed performances and publishes no source loop;
- ✅ shared acceleration performance effects: OPEN widens and brightens either
  score, while the rarer BLOOM event bends only the `300 Hz–8 kHz` band through
  a bounded `8 → 0.8 ms` feed-forward delay and always yields to UNDERWATER;
- ✅ production build and deterministic signal, diagnostic-model, and packaging tests passing;
- 🧪 a development-only harmony inventory now analyses the eight chord hits
  reachable by JUNCTION with byte identity, envelope/tuning measurements and
  high-recall note proposals, audits the recordings the renderer really selects,
  and measures printed transitions directly from audio; authoritative pitch
  sets remain deliberately unknown until independent evidence passes ground truth;
- ✅ photographed Tesla split-view evidence at `773 × 601`, screen `1254 × 784`, DPR `1.53`;
- ✅ compact-view v3 diagnostics redesigned as a readable IBM Plex Mono instrument with a health strip, aligned evidence groups, one-scroll raw JSON, and a dedicated telemetry/privacy/provenance/licensing/source README; no coordinates are retained, and the explicit same-origin email handoff attaches the complete report as verified gzip-compressed JSON;
- ✅ the canonical bare root, direct PHP entry, and content-addressed assets are live and byte-identical after the SiteGround cache flush;
- ✅ the first complete Tesla report confirms 60.04 FPS overall, 16.8 ms p95, four slow frames, 33.2 MB peak decoded PCM, and no runtime issue during a 314-second drive;
- ⏳ Aperture's `0–40 km/h` wall-retreat budget, the simplified FRACTURE/JUNCTION arrangements, the rebuilt Meridian speed corridor, and the ATLAS flight camera still require acceptance in the target Tesla;
- ⛔ no committed release, PWA/offline cache, final audio pack, or final brand/license package yet.

## Experience

The product is configured while parked. One deliberate **PLAY THE ROAD** gesture on the animated Signal Gate splash unlocks Web Audio, checks capabilities, requests GPS permission, and enters the selected Flux environment. The gesture is a single flat typographic surface: a prominent responsive `32–40 px` lowercase `sedicivalvole` wordmark at Orbitron `750` above `PLAY THE ROAD` at `600`, both centered without added tracking and with no simulated appliance controls. The command's white-to-red wave translates by one exact repeating period, so every loop joins continuously. The interface remains Braun-influenced, Swiss, and slightly brutalist while the generative field supplies the visual contrast.

The speed source is an explicit abstraction. GPS and the desktop simulator produce the same normalized stream. Hold `ArrowUp` as an accelerator; releasing it enters a progressive nominal Model 3 AWD regenerative slowdown instead of dropping to zero. `ArrowDown` explicitly requests that lift-off state. Holding `Space` applies the stronger estimated service-brake curve from the exact current speed. Reference acceleration, lift-off, and braking dynamics define soft GPS plausibility bands without creating or replacing real motion samples. Keyboard handling never steals input from focused controls.

## Current modes

Confirmed product modes:

- **Engine** — selectable engine-sound emulation with a dedicated instrument-inspired visual language. Audio modeling, catalog, and final visual direction are not implemented yet.
- **Flux** — adaptive music driven by speed and motion, paired with seven selectable visual environments in the source checkout. Aperture is the accepted default and begins as a rigid square wall that recedes and disappears at the existing tunnel terminus by `40 km/h`. Vertigo embeds the original Codrops/Tympanus Interstate 7 runtime unchanged behind an external speed/FOV and palette bridge. Meridian is a low, stable corridor of sparse oblique palette-lit blades and longitudinal shoulder planes. ATLAS follows the trusted position and travel bearing above an OpenFreeMap city. WAKE streams seven velvet-like material roads and progressively tangles them with speed. DRIVEY embeds the original Rezmason road, levels, traffic, cameras and rendering pipeline behind a narrow palette/performance bridge; compact text-only controls cycle Hood, Rear and Aerial views and Normal/Wire rendering without a menu. PRTCL adapts the authorized Fractal Frequency, Murmuration, and Axiom formulas into one bounded WebGL2 field; a single compact text-only `TYPE` button cycles those families while the existing `PALETTE` control remains separate. This is the mode currently implemented as Drive Lab.

Shared foundations include the GPS/Demo speed source, integrated diagnostics, master Stop/Mute, reduced motion, renderer fallback, and touch-first safety behavior. The mode switch will remain clearly identifiable and reachable from both experiences.

The current music library has three selectable authored works: generative
AudioWorklet score **FRACTURE** and sampled adaptive productions **JUNCTION**
and **NIGHTSHIFT**. Four later directions remain `IN PREPARATION`. Their musical quality and
relationship to real acceleration remain pending a Tesla listening test.

## Quick start

```bash
cd prototype/drive-lab
npm ci
npm run dev
```

Production verification:

```bash
npm run build
npm test
```

The standalone technical harness remains in `diagnostics/tesla-capabilities/`; equivalent high-value readings are accessible from the main Drive Lab report.

## Architecture

The current prototype uses React, Vite, a sample-accurate AudioWorklet score
engine, authored WebGL2 and Canvas2D renderers with progressive fallbacks, a
lazy MapLibre city field, and the same DSP core in Node for offline listening
renders. This does not freeze a future release stack.

See [`docs/TECHNICAL-DIRECTION.md`](docs/TECHNICAL-DIRECTION.md).

## Safety and privacy

- Use and configure the experience only while parked; do not adjust the touchscreen while driving.
- Speed and diagnostic processing never persist or transmit coordinates. ATLAS keeps the latest reliable point only in session memory; while ATLAS is selected, OpenFreeMap receives the tile area needed to draw the city and Wikimedia receives a coarse `0.05°` nearby-search cell. Neither the diagnostic report nor local storage contains the position.
- No analytics or automatic remote telemetry is enabled. Extensive local diagnostics are aggregated with bounded overhead and transmitted only after the user explicitly taps **SEND DIAGNOSTIC**.
- FTP deployment is functional but unencrypted; credentials and content travel in clear text.
- An upload is not considered successful until the canonical URL, HTML, assets, and cache behavior are verified.

## Versioning and changelog

[`VERSION`](VERSION) is the only SemVer source of truth. `0.0.0` means there is
no release yet. The build injects the version into diagnostics; the splash shows
the separate `YYYYMMDD-HHMM` build stamp used for publication evidence.

All relevant changes are recorded in [`CHANGELOG.md`](CHANGELOG.md), with work in `Unreleased` until an explicit release is approved.

## Screenshots

No screenshot is published here yet. The repository will include only real, current product captures verified at agreed Tesla viewports. Generated directions, archived prototypes, and obsolete screenshots are not product evidence.

## Roadmap

The next gate is human visual approval of the locally verified PRTCL candidate,
followed by a real Tesla session at the verified split viewport: compare all
seven implemented visuals across acceleration and deceleration, verify
Aperture's 60 FPS desktop gain on the vehicle,
listen critically to FRACTURE, JUNCTION and NIGHTSHIFT, test
the Music/Visual/theme controls, and check touch reach while parked.

See [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Documentation

- [`docs/CURRENT-STATE.md`](docs/CURRENT-STATE.md) — authoritative working overview and documentation map;
- [`docs/PRODUCT-SPEC.md`](docs/PRODUCT-SPEC.md) — confirmed requirements, assumptions, and open questions;
- [`docs/ADVERSARIAL-REVIEW.md`](docs/ADVERSARIAL-REVIEW.md) — independent critique of the bootstrap proposals;
- [`docs/TECHNICAL-DIRECTION.md`](docs/TECHNICAL-DIRECTION.md) — recommended architecture and signal model;
- [`docs/SOURCE-AUDIT.md`](docs/SOURCE-AUDIT.md) — archive integrity and source findings;
- [`docs/REFERENCE-LIBRARY.md`](docs/REFERENCE-LIBRARY.md) — local external-material convention;
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — sanitized deployment procedure and verified state;
- [`docs/DIAGNOSTICS.md`](docs/DIAGNOSTICS.md) — verified Tesla measurements and report-delivery architecture;
- [`docs/MODES.md`](docs/MODES.md) — confirmed Engine/Flux product architecture and open decisions;
- [`docs/REFERENCE-STUDY-TEXTSTEP.md`](docs/REFERENCE-STUDY-TEXTSTEP.md) — Lobo's textStep credit, provenance, mechanics, and authorized adoption plan;
- [`docs/MUSIC-CRAFT.md`](docs/MUSIC-CRAFT.md) — accumulated musical knowledge, failures, tests, and production technique;
- [`docs/AUDIO-QA-2026-08-28.md`](docs/AUDIO-QA-2026-08-28.md) — current FRACTURE/JUNCTION reference renders, objective mix measurements, and listening boundary;
- [`docs/SESSION-HANDOFF.md`](docs/SESSION-HANDOFF.md) — current implementation handoff and remaining work;
- [`docs/GITHUB.md`](docs/GITHUB.md) — public-repository and GitHub CLI operating notes;
- [`docs/LICENSING.md`](docs/LICENSING.md) — active mixed-license decision and open legal work.

## License

Source code, shader source, CSS, build and deployment configuration, and project documentation are licensed under [GNU AGPL v3.0 or later](LICENSE). The `sedicivalvole` name, future logo and marks, brand assets, screenshots, original audio, and standalone visual/media assets are excluded from that grant. See [LICENSE-SCOPE.md](LICENSE-SCOPE.md), [NOTICE](NOTICE), and [`docs/LICENSING.md`](docs/LICENSING.md) for the exact scope and remaining legal decisions.
