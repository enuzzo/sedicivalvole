# sedicivalvole

> **Sequencer direction — credit to Lobo.** The next-generation Flux music
> system is being shaped around [textStep](https://github.com/illobo/textStep),
> the step sequencer, synthesizer, and original DSP project created by
> [illobo](https://github.com/illobo). Its sequencer and performance architecture
> are Lobo's work. `sedicivalvole` plans to adapt that foundation so vehicle
> speed can arrange musical layers, manage energy, and move between authored
> genres. The current browser prototype still uses its earlier independent
> scheduler; no textStep source is shipped yet. When derived code is integrated,
> the exact files, changes, license, and attribution will be recorded explicitly.

> Current state: **Flux Drive Lab now includes the selectable Aperture and Vertigo visual environments and is under vehicle validation**. This is a development build, not a release.

Public development repository: [github.com/enuzzo/sedicivalvole](https://github.com/enuzzo/sedicivalvole).

## Vision

`sedicivalvole` turns speed, sound, and light into an atmospheric, useful, and memorable in-car experience. It is not a generic dashboard. Two equal primary modes share one motion signal and safety model while offering deliberately different audio and visual identities.

The canonical development build is available at [sedicivalvole.app](https://sedicivalvole.app/).

## What exists today

- ✅ a single ignored local reference library under `_references/`;
- ✅ source audit, product requirements, adversarial review, technical direction, and roadmap;
- ✅ Modular Aperture selected after exactly three revised Product Design directions;
- ✅ touch-first Flux prototype with selectable procedural WebGL2/Canvas2D Aperture and Vertigo fields, GPS/demo speed source, Stop/Mute, a fixed `130 km/h` energy ceiling, five body-color themes, and an integrated capability report;
- ✅ local-only speed processing: raw coordinates are never displayed, persisted, or transmitted;
- ✅ a four-section authored audio spike with a tempo knee, quantized transitions, hysteresis, dwell, crossfades, and speed-driven arrangement depth;
- ✅ production build and deterministic signal, diagnostic-model, and packaging tests passing;
- ✅ photographed Tesla split-view evidence at `773 × 601`, screen `1254 × 784`, DPR `1.53`;
- ✅ compact-view v3 diagnostics with aggregated frame pacing, network history, runtime/resource evidence, direct same-origin email handoff, and no coordinates;
- ✅ the canonical bare root, direct PHP entry, and content-addressed assets are live and byte-identical after the SiteGround cache flush;
- ⏳ speed-to-audio behavior across real motion, audio quality, frame pacing, and physical touch reach still require validation in the target Tesla;
- ⛔ no committed release, PWA/offline cache, final audio pack, or final brand/license package yet.

## Experience

The product is configured while parked. One deliberate **TEST & START** gesture unlocks Web Audio, checks capabilities, requests GPS permission, and enters the selected Flux environment. The interface is flat, monospace, Braun-influenced, Swiss, and slightly brutalist; the generative field supplies the visual contrast.

The speed source is an explicit abstraction. GPS and the desktop simulator produce the same normalized stream. `ArrowUp` and `ArrowDown` adjust simulated speed; `Space` triggers a discrete braking accent. Keyboard handling never steals input from focused controls.

## Current modes

Confirmed product modes:

- **Engine** — selectable engine-sound emulation with a dedicated instrument-inspired visual language. Audio modeling, catalog, and final visual direction are not implemented yet.
- **Flux** — adaptive music driven by speed and motion, paired with selectable procedural environments. Aperture morphs a flat square field into a centered tunnel; Vertigo folds continuous light bands from a plane into a laterally undulating vertical flow. Both reverse coherently during deceleration. This is the mode currently implemented as Drive Lab.

Shared foundations include the GPS/Demo speed source, integrated diagnostics, master Stop/Mute, reduced motion, renderer fallback, and touch-first safety behavior. The mode switch will remain clearly identifiable and reachable from both experiences.

The current audio is an authored research spike rather than an exposed oscillator/noise layer mixer. Its musical quality and relationship to real acceleration remain pending a Tesla listening test.

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

The current prototype uses React and Vite because it came from the verified Product Design build workflow. This does not freeze the production stack. The recommended production direction remains TypeScript, a small component shell, AudioWorklet for stable real-time scheduling, WebGL2 with progressive fallback, and an offline core after Tesla validation.

See [`docs/TECHNICAL-DIRECTION.md`](docs/TECHNICAL-DIRECTION.md).

## Safety and privacy

- Use and configure the experience only while parked; do not adjust the touchscreen while driving.
- Raw coordinates are discarded immediately and never transmitted.
- No analytics or automatic remote telemetry is enabled. Extensive local diagnostics are aggregated with bounded overhead and transmitted only after the user explicitly taps **SEND DIAGNOSTIC**.
- FTP deployment is functional but unencrypted; credentials and content travel in clear text.
- An upload is not considered successful until the canonical URL, HTML, assets, and cache behavior are verified.

## Versioning and changelog

[`VERSION`](VERSION) is the only SemVer source of truth. `0.0.0` means there is no release yet. The build injects that value and displays it discreetly on the splash.

All relevant changes are recorded in [`CHANGELOG.md`](CHANGELOG.md), with work in `Unreleased` until an explicit release is approved.

## Screenshots

No screenshot is published here yet. The repository will include only real, current product captures verified at agreed Tesla viewports. Generated directions, archived prototypes, and obsolete screenshots are not product evidence.

## Roadmap

The next gate is a real Tesla session at the verified split viewport: compare Aperture and Vertigo across acceleration/deceleration, measure frame pacing, confirm visible tunnel formation around `40 km/h`, test the visual and body-color controls, and check touch reach while parked. The compact `DIAG` report remains available for technical evidence. The current shared audio score is still rejected; Lobo's textStep-informed, selectable Jungle-capable sequencer remains the next major product milestone.

See [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Documentation

- [`docs/PRODUCT-SPEC.md`](docs/PRODUCT-SPEC.md) — confirmed requirements, assumptions, and open questions;
- [`docs/ADVERSARIAL-REVIEW.md`](docs/ADVERSARIAL-REVIEW.md) — independent critique of the bootstrap proposals;
- [`docs/TECHNICAL-DIRECTION.md`](docs/TECHNICAL-DIRECTION.md) — recommended architecture and signal model;
- [`docs/SOURCE-AUDIT.md`](docs/SOURCE-AUDIT.md) — archive integrity and source findings;
- [`docs/REFERENCE-LIBRARY.md`](docs/REFERENCE-LIBRARY.md) — local external-material convention;
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — sanitized deployment procedure and verified state;
- [`docs/DIAGNOSTICS.md`](docs/DIAGNOSTICS.md) — verified Tesla measurements and report-delivery architecture;
- [`docs/MODES.md`](docs/MODES.md) — confirmed Engine/Flux product architecture and open decisions;
- [`docs/REFERENCE-STUDY-TEXTSTEP.md`](docs/REFERENCE-STUDY-TEXTSTEP.md) — Lobo's textStep credit, provenance, mechanics, and adoption gate;
- [`docs/GITHUB.md`](docs/GITHUB.md) — public-repository and GitHub CLI operating notes;
- [`docs/LICENSING.md`](docs/LICENSING.md) — active mixed-license decision and open legal work.

## License

Source code, shader source, CSS, build and deployment configuration, and project documentation are licensed under [GNU AGPL v3.0 or later](LICENSE). The `sedicivalvole` name, future logo and marks, brand assets, screenshots, original audio, and standalone visual/media assets are excluded from that grant. See [LICENSE-SCOPE.md](LICENSE-SCOPE.md), [NOTICE](NOTICE), and [`docs/LICENSING.md`](docs/LICENSING.md) for the exact scope and remaining legal decisions.
