# sedicivalvole

> **Sequencer foundation — credit to Lobo.** The current Flux music system is
> built in part from [textStep](https://github.com/illobo/textStep),
> the step sequencer, synthesizer, and original DSP project created by
> [illobo](https://github.com/illobo). Its sequencer and performance architecture
> are Lobo's work. `sedicivalvole` translates the relevant transport, synthesis,
> and DSP into a browser AudioWorklet so vehicle speed can arrange musical
> layers. The exact derived files, modifications, license, and direct reuse
> authorization are recorded in `THIRD_PARTY_NOTICES.md`.

> Current state: **Flux Drive Lab runs the authored FRACTURE and JUNCTION music with four
> selectable visual environments and is under vehicle validation**. This is a
> development build, not a release.

Public development repository: [github.com/enuzzo/sedicivalvole](https://github.com/enuzzo/sedicivalvole).

## Vision

`sedicivalvole` turns speed, sound, and light into an atmospheric, useful, and memorable in-car experience. It is not a generic dashboard. Two equal primary modes share one motion signal and safety model while offering deliberately different audio and visual identities.

The canonical development build is available at [sedicivalvole.app](https://sedicivalvole.app/).

## What exists today

- ✅ a single ignored local reference library under `_references/`;
- ✅ source audit, product requirements, adversarial review, technical direction, and roadmap;
- ✅ Modular Aperture selected after exactly three revised Product Design directions;
- ✅ four selectable Flux visuals: procedural Aperture, byte-identical upstream Interstate 7 Vertigo, and the original Meridian and Latitudes environments;
- ✅ GPS/Demo speed source, Stop/Mute, a fixed `130 km/h` energy ceiling, 10 curated themes, and an integrated capability report;
- ✅ local-only speed processing: raw coordinates are never displayed, persisted, or transmitted;
- ✅ FRACTURE, a production AudioWorklet score with ten four-bar sections, a narrow tempo knee, quantized transitions, hysteresis, dwell, crossfades, speed-driven arrangement depth, and tested harmony/braking/voice output;
- ✅ JUNCTION, a sampled production that mixes two of 13 authored clips per energy state live at each eight-bar boundary: 104 clips built from 126 distinct recordings, native 127–168 BPM pacing, beatless ambient rest, one 24.8 MB segmented Opus bank, and no loose source samples;
- ✅ production build and deterministic signal, diagnostic-model, and packaging tests passing;
- ✅ photographed Tesla split-view evidence at `773 × 601`, screen `1254 × 784`, DPR `1.53`;
- ✅ compact-view v3 diagnostics with aggregated frame pacing, network history, runtime/resource evidence, direct same-origin email handoff, and no coordinates;
- ✅ the canonical bare root, direct PHP entry, and content-addressed assets are live and byte-identical after the SiteGround cache flush;
- ⏳ speed-to-audio behavior across real motion, audio quality, frame pacing, and physical touch reach still require validation in the target Tesla;
- ⛔ no committed release, PWA/offline cache, final audio pack, or final brand/license package yet.

## Experience

The product is configured while parked. One deliberate **PLAY THE ROAD** gesture on the animated Signal Gate splash unlocks Web Audio, checks capabilities, requests GPS permission, and enters the selected Flux environment. The interface is flat, monospace, Braun-influenced, Swiss, and slightly brutalist; the generative field supplies the visual contrast.

The speed source is an explicit abstraction. GPS and the desktop simulator produce the same normalized stream. Hold `ArrowUp` as an accelerator; releasing it enters a progressive nominal Model 3 AWD regenerative slowdown instead of dropping to zero. `ArrowDown` explicitly requests that lift-off state. Holding `Space` applies the stronger estimated service-brake curve from the exact current speed. Reference acceleration, lift-off, and braking dynamics define soft GPS plausibility bands without creating or replacing real motion samples. Keyboard handling never steals input from focused controls.

## Current modes

Confirmed product modes:

- **Engine** — selectable engine-sound emulation with a dedicated instrument-inspired visual language. Audio modeling, catalog, and final visual direction are not implemented yet.
- **Flux** — adaptive music driven by speed and motion, paired with four selectable visual environments. Aperture morphs a flat square field into a centered tunnel. Vertigo embeds the original Codrops/Tympanus Interstate 7 runtime unchanged behind an external speed/FOV and palette bridge. Meridian is an original ruled light corridor; Latitudes is an original temporal field that carries recent motion upward through stacked strata. This is the mode currently implemented as Drive Lab.

Shared foundations include the GPS/Demo speed source, integrated diagnostics, master Stop/Mute, reduced motion, renderer fallback, and touch-first safety behavior. The mode switch will remain clearly identifiable and reachable from both experiences.

The current music library has two selectable authored works: generative
AudioWorklet score **FRACTURE** and sampled adaptive production **JUNCTION**.
Five later directions remain `IN PREPARATION`. Their musical quality and
relationship to real acceleration remain pending a Tesla listening test.

## Quick start

```bash
cd prototype/drive-lab
npm install
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
engine, WebGL2 renderers with progressive fallbacks, and the same DSP core in
Node for offline listening renders. This does not freeze a future release stack.

See [`docs/TECHNICAL-DIRECTION.md`](docs/TECHNICAL-DIRECTION.md).

## Safety and privacy

- Use and configure the experience only while parked; do not adjust the touchscreen while driving.
- Raw coordinates are discarded immediately and never transmitted.
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

The next gate is a real Tesla session at the verified split viewport: compare all
four visuals across acceleration and deceleration, verify Aperture's 60 FPS
desktop gain on the vehicle, listen critically to FRACTURE and JUNCTION, test
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
- [`docs/SESSION-HANDOFF.md`](docs/SESSION-HANDOFF.md) — current implementation handoff and remaining work;
- [`docs/GITHUB.md`](docs/GITHUB.md) — public-repository and GitHub CLI operating notes;
- [`docs/LICENSING.md`](docs/LICENSING.md) — active mixed-license decision and open legal work.

## License

Source code, shader source, CSS, build and deployment configuration, and project documentation are licensed under [GNU AGPL v3.0 or later](LICENSE). The `sedicivalvole` name, future logo and marks, brand assets, screenshots, original audio, and standalone visual/media assets are excluded from that grant. See [LICENSE-SCOPE.md](LICENSE-SCOPE.md), [NOTICE](NOTICE), and [`docs/LICENSING.md`](docs/LICENSING.md) for the exact scope and remaining legal decisions.
