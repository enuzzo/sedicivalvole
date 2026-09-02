# Drive Lab

The current integrated `sedicivalvole` Flux prototype for the verified Tesla split viewport.

## Local run

```bash
npm ci
npm run dev
```

The standalone ShaderGradient development workbench is available at
`http://127.0.0.1:5173/shadergradient-lab.html` from the normal dev server. To
give it a dedicated stable port instead, run:

```bash
npm run dev:shadergradient
```

and open `http://127.0.0.1:5180/lab/`. This matches the canonical production
path while Vite maps it to the local owner-LAB entry. The page persists its
own local settings, can copy the current parameter JSON, imports official
ShaderGradient URLs, and simulates bounded road plus audio response. It exposes
all ten official presets, every registered geometry/shader combination, and the
complete useful public visual/runtime control surface for the pinned version.
The same workbench is selectable inside the authenticated `/lab/`; its wide
inspector remains beside the stage on desktop and in the `773 × 601` Tesla
layout. The three exact registered starting points also power one public
`GRADIENT 08` family; its persistent `VARIANT` control cycles Japanese Mist,
Acid Orchard, and Chromatic Silk through a separate lazy chunk. See
[`../../docs/LOCAL-SHADERGRADIENT-LAB.md`](../../docs/LOCAL-SHADERGRADIENT-LAB.md).

The initial **PLAY THE ROAD** gesture is one flat typographic launch surface with an enlarged `sedicivalvole` wordmark and no simulated hardware. It sits over the animated Signal Gate, unlocks Web Audio, runs capability checks, requests GPS permission, and fades into the scene. Its readable footer identifies the project as created by [enuzzo](https://github.com/enuzzo), credits [Illobo](https://github.com/illobo), and links the public [source repository](https://github.com/enuzzo/sedicivalvole) with a small monochrome GitHub mark. A top-left Buy Me a Coffee control opens the verified `enuzzo` profile, its supplied QR, an explicitly playful project-sparks signal that is not presented as a purchase count, and a runtime-reconstructed suggestion address. Suggestions are invited independently of financial support.

## Implemented

- a local and authenticated-LAB ShaderGradient workbench plus one public lazy
  `GRADIENT 08` family using exact MIT-licensed
  `@shadergradient/react@2.4.20` and pinned rendering peers; the LAB retains ten
  upstream presets and exhaustive organized visual/runtime controls;
- eight driver-facing Visual choices: seven rendered environment families—`APERTURE 01`, byte-identical upstream Interstate 7 `VERTIGO 02`, original `MERIDIAN 03`, lazy OpenFreeMap `ATLAS 04`, source-faithful `DRIVEY 05`, original `PRTCL 06`, and `GRADIENT 08`—plus the separate `DISCOVER 07` Passenger Index destination. The Instrument Deck and running Visual library expose the complete catalogue without persisting Discover as a renderer, state the available Drivey views/renders, PRTCL types and Gradient variants, and retain the selected Gradient variant;
- DRIVEY keeps its byte-identical upstream road and vehicle runtime while the external bridge reuses VERTIGO's quadratic speed response, compensates Drivey's nonlinear cruise physics, and aligns both the player and opposing traffic with the smoothed GPS-derived world velocity before the iframe is shown;
- a dedicated WebGL2 Signal Gate splash with independently phased travelling lane gaps, restrained perspective airflow, and Canvas2D/reduced-motion fallbacks;
- continuously redrawn Canvas2D fallback and reduced-motion behavior for Aperture; all four tunnel planes share one longitudinal grid origin so their cuts meet cleanly at the corners. Vertigo retains the original Three.js/post-processing renderer and caps its speed input in reduced-motion mode;
- FRACTURE, a generative AudioWorklet score with ten four-bar sections, a narrow `162–176 BPM` range, tested harmony, staged deceleration memory, and an offline render path;
- the shared OPEN acceleration macro, which briefly widens and brightens either ready score without turning hard acceleration into a volume or tempo jump;
- an honest Music library with ready adaptive JUNCTION, NIGHTSHIFT and FRACTURE scores plus fixed Soundtrack recordings; remote Soundtrack preparation never blocks visual START, its three transient previous/current/next media roles and adjacent covers are prefetched, and supported browser Media Session previous/next actions stay attached to the committed queue;
- GPS `coords.speed` input with null handling, physics-informed soft outlier tolerance, and Demo fallback;
- a 64 px Tesla footer with touch-first Mute, vehicle FX, Visual and Music libraries, Performance FX, and ten curated body themes shared by the applicable renderers. In Soundtrack the upper black readout contains speed only and the previous/play-pause/next transport retracts with the footer. The dark Music drawer renders its unchanged black Tabler Now Playing source icon through a white presentation filter and keeps the label on one line, preserving the source asset for future LIGHT appearance. GPS/demo motion and passive pointer movement never wake resting chrome; a deliberate pointer press/touch does;
- fixed `130 km/h` energy/velocity ceiling with truthful higher-speed display and visible Aperture tunnel formation by approximately `40 km/h`;
- integrated coordinate-free device report with continuity-safe per-phase FPS/frame-time, a dedicated Aperture morph phase, heap/decoded-audio memory, real output RMS/peak, GPS confidence, musical-family/take exposure, an in-memory driving flight recorder, and explicit gzip-attachment email send;
- a measured 64 px footer at `773 × 601`: icon-only audio state, direct Visual/Music libraries, truthful disclosure carets, a compact right-anchored palette, and a theme control shared by field and UI accent. The top bar includes a browser-estimated `NET` state rather than invented cellular strength or an active ping meter;
- a compact Discover composition with a `38 px` heading, `246 px` rail and
  `16 px` result-number track at the Tesla viewport. Its navigation QR opens
  exploratory Google Maps place search without fixing an origin or starting a
  route automatically;
- time-based Model 3 AWD Demo acceleration calibrated to the official zero-to-100 km/h figure;
- desktop simulator: hold `ArrowUp` to accelerate, release it or press `ArrowDown` for progressive regenerative slowdown, and hold `Space` for stronger braking from the exact current speed;
- owner LAB calibration with 18 visual/test parameters, smooth PRTCL macro transitions, speed-responsive complete-form scale, and independent MUTE/FRACTURE/JUNCTION/NIGHTSHIFT test audio that is never serialized into a visual preset;
- `VERSION` injected at build time;
- deterministic signal, score, documentation-consistency, and packaging tests.
- a Git-ignored Python harmony-analysis environment that inventories the eight
  JUNCTION-reachable chord hits and keeps Basic Pitch output as proposals until
  independent evidence can accept or reject the observed pitch set. The current
  residual feature is excluded from classifier input; a separate spectrum pass
  searches lower source hypotheses without trusting the proposer, distinguishes
  hypotheses from measured peaks, and remains explicitly review-only.

## Verify

```bash
npm run build
npm test
```

The verified build is published to [https://sedicivalvole.app/](https://sedicivalvole.app/) after each approved checkpoint. GPS cadence, music/effect listening acceptance, simultaneous audio/rendering frame pacing across the seven rendered visuals, and touch reach remain pending validation in the target Tesla.
