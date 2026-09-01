# Drive Lab

The current integrated `sedicivalvole` Flux prototype for the verified Tesla split viewport.

## Local run

```bash
npm ci
npm run dev
```

The initial **PLAY THE ROAD** gesture is one flat typographic launch surface with an enlarged `sedicivalvole` wordmark and no simulated hardware. It sits over the animated Signal Gate, unlocks Web Audio, runs capability checks, requests GPS permission, and fades into the scene. Its readable footer identifies the project as created by [enuzzo](https://github.com/enuzzo), credits [Illobo](https://github.com/illobo), and links the public [source repository](https://github.com/enuzzo/sedicivalvole) with a small monochrome GitHub mark. A top-left Buy Me a Coffee control opens the verified `enuzzo` profile, its supplied QR, an explicitly playful project-sparks signal that is not presented as a purchase count, and a runtime-reconstructed suggestion address. Suggestions are invited independently of financial support.

## Implemented

- eight driver-facing Visual choices: seven rendered environments—`APERTURE 01`, byte-identical upstream Interstate 7 `VERTIGO 02`, original `MERIDIAN 03`, lazy OpenFreeMap `ATLAS 04`, source-faithful `DRIVEY 05`, original `PRTCL 06`, and project-owned `GRADIENT 08`—plus the separate `DISCOVER 07` Passenger Index destination. The Instrument Deck arranges them `3–3–2`, and the running Visual library exposes the same destination without persisting it as a renderer;
- a dedicated WebGL2 Signal Gate splash with independently phased travelling lane gaps, restrained perspective airflow, and Canvas2D/reduced-motion fallbacks;
- continuously redrawn Canvas2D fallback and reduced-motion behavior for Aperture; Vertigo retains the original Three.js/post-processing renderer and caps its speed input in reduced-motion mode;
- FRACTURE, a generative AudioWorklet score with ten four-bar sections, a narrow `162–176 BPM` range, tested harmony, staged deceleration memory, and an offline render path;
- the shared OPEN acceleration macro, which briefly widens and brightens either ready score without turning hard acceleration into a volume or tempo jump;
- an honest Music library: generative FRACTURE and the compact adaptive JUNCTION music bank are selectable; five later directions remain disabled and marked `IN PREPARATION`;
- GPS `coords.speed` input with null handling, physics-informed soft outlier tolerance, and Demo fallback;
- a 64 px Tesla footer with touch-first Mute, vehicle FX, Visual and Music libraries, Performance FX, and ten curated body themes shared by all six renderers;
- fixed `130 km/h` energy/velocity ceiling with truthful higher-speed display and visible Aperture tunnel formation by approximately `40 km/h`;
- integrated coordinate-free device report with continuity-safe per-phase FPS/frame-time, a dedicated Aperture morph phase, heap/decoded-audio memory, real output RMS/peak, GPS confidence, musical-family/take exposure, an in-memory driving flight recorder, and explicit gzip-attachment email send;
- a measured 64 px `PALETTE` footer at `773 × 601`: icon-only audio state, vertically ordered Visual/Music choices, truthful disclosure carets, and a theme control shared by field and UI accent; a future approved X2/X9 layout pass will cap and right-anchor its fullscreen width instead of stretching the colour rail;
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
