# sedicivalvole

> Current state: **Drive Lab is live and under vehicle validation**. Visual direction 1, the luminous axis, is selected. This is a private development build, not a release.

Public development repository: [github.com/enuzzo/sedicivalvole](https://github.com/enuzzo/sedicivalvole).

## Vision

`sedicivalvole` turns speed, sound, and light into an atmospheric, useful, and memorable in-car experience. It is neither a generic dashboard nor an engine-noise toy: audio, generative visuals, and interaction are designed as one musical system.

The canonical development build is available at [sedicivalvole.app](https://sedicivalvole.app/).

## What exists today

- ✅ a single ignored local reference library under `_references/`;
- ✅ source audit, product requirements, adversarial review, technical direction, and roadmap;
- ✅ visual direction 1 selected after exactly three Product Design directions;
- ✅ touch-first Drive Lab with a WebGL2 luminous field, static/reduced-motion fallback, GPS/demo speed source, Stop, Brake, layer controls, hue control, and an integrated capability report;
- ✅ local-only speed processing: raw coordinates are never displayed, persisted, or transmitted;
- ✅ a synthesized 16-step audio spike with saturating tempo and speed-driven arrangement depth;
- ✅ production build and deterministic signal, diagnostic-model, and packaging tests passing;
- ✅ photographed Tesla split-view evidence at `773 × 601`, screen `1254 × 784`, DPR `1.53`;
- ✅ compact-view diagnostics with direct same-origin email handoff and no coordinates;
- ✅ canonical live deployment verified against local HTML and asset hashes;
- ⏳ speed-to-audio behavior across real motion, audio quality, frame pacing, and physical touch reach still require validation in the target Tesla;
- ⛔ no committed release, PWA/offline cache, final audio pack, or final brand/license package yet.

## Experience

The product is configured while parked. One deliberate **TEST & START** gesture unlocks Web Audio, checks capabilities, requests GPS permission, and fades continuously into the luminous scene. Controls are large and touch-first, remain discoverable at rest, and become fully legible on interaction.

The speed source is an explicit abstraction. GPS and the desktop simulator produce the same normalized stream. `ArrowUp` and `ArrowDown` adjust simulated speed; `Space` triggers a discrete braking accent. Keyboard handling never steals input from focused controls.

## Current modes

- animated abstract WebGL2 field with hue and saturating speed-to-energy mapping;
- local synthesized soundscape with a continuous speed-rising energy wave, Atmos, Harmonics, Pulse, denser speed-gated beats, and Brake layers;
- GPS request using only `coords.speed`, with a visible Demo fallback;
- integrated Tesla capability report, audio status, Stop/Mute, reduced motion, and renderer fallback.

The current audio is a research spike. Its musical quality and relationship to real acceleration remain pending a Tesla listening test.

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
- No analytics or automatic remote telemetry is enabled. A diagnostic report is transmitted only after the user explicitly taps **SEND DIAGNOSTIC**.
- FTP deployment is functional but unencrypted; credentials and content travel in clear text.
- An upload is not considered successful until the canonical URL, HTML, assets, and cache behavior are verified.

## Versioning and changelog

[`VERSION`](VERSION) is the only SemVer source of truth. `0.0.0` means there is no release yet. The build injects that value and displays it discreetly on the splash.

All relevant changes are recorded in [`CHANGELOG.md`](CHANGELOG.md), with work in `Unreleased` until an explicit release is approved.

## Screenshots

No screenshot is published here yet. The repository will include only real, current product captures verified at agreed Tesla viewports. Generated directions, archived prototypes, and obsolete screenshots are not product evidence.

## Roadmap

The next gate is a second real Tesla session using the new compact `DIAG` control: send the report directly from split view, confirm inbox delivery, capture speed samples across real motion, evaluate audio/visual response, measure frame pacing, and check touch reach while parked. Results will drive the next audio and renderer iteration.

See [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Documentation

- [`docs/PRODUCT-SPEC.md`](docs/PRODUCT-SPEC.md) — confirmed requirements, assumptions, and open questions;
- [`docs/ADVERSARIAL-REVIEW.md`](docs/ADVERSARIAL-REVIEW.md) — independent critique of the bootstrap proposals;
- [`docs/TECHNICAL-DIRECTION.md`](docs/TECHNICAL-DIRECTION.md) — recommended architecture and signal model;
- [`docs/SOURCE-AUDIT.md`](docs/SOURCE-AUDIT.md) — archive integrity and source findings;
- [`docs/REFERENCE-LIBRARY.md`](docs/REFERENCE-LIBRARY.md) — local external-material convention;
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — sanitized deployment procedure and verified state;
- [`docs/DIAGNOSTICS.md`](docs/DIAGNOSTICS.md) — verified Tesla measurements and report-delivery architecture;
- [`docs/GITHUB.md`](docs/GITHUB.md) — public-repository and GitHub CLI operating notes;
- [`docs/LICENSING.md`](docs/LICENSING.md) — provisional mixed-license decision.

## License

The decision is prepared but not finalized. The provisional recommendation is AGPL-3.0-or-later for source code, shaders, CSS, and build configuration, with original name, brand, screenshots, and audio outside that grant. No `LICENSE` exists because the exact legal owner and mixed-asset policy are still unresolved. See [`docs/LICENSING.md`](docs/LICENSING.md).
