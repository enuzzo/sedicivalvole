# Drive Lab

The current integrated `sedicivalvole` Flux prototype for the verified Tesla split viewport.

## Local run

```bash
npm install
npm run dev
```

The initial **PLAY THE ROAD** gesture sits over the animated Signal Gate, unlocks Web Audio, runs capability checks, requests GPS permission, and fades into the scene.

## Implemented

- four selectable environments: `APERTURE 01`, byte-identical upstream Interstate 7 `VERTIGO 02`, original `MERIDIAN 03`, and original `LATITUDES 04`;
- a dedicated WebGL2 Signal Gate splash with Canvas2D and reduced-motion fallbacks;
- continuously redrawn Canvas2D fallback and reduced-motion behavior for Aperture; Vertigo retains the original Three.js/post-processing renderer and caps its speed input in reduced-motion mode;
- FRACTURE, a generative AudioWorklet score with ten four-bar sections, a narrow `162–176 BPM` range, tested harmony, staged deceleration memory, and an offline render path;
- an honest score library: FRACTURE is selectable, while sampled JUNCTION and five later directions remain disabled and marked `IN PREPARATION`;
- GPS `coords.speed` input with null handling, physics-informed soft outlier tolerance, and Demo fallback;
- touch-first Stop/Mute, visual environment, score library, and ten curated body-theme surfaces;
- fixed `130 km/h` energy/velocity ceiling with visible Aperture tunnel formation by approximately `40 km/h`;
- integrated coordinate-free device report with a bounded in-memory driving flight recorder, runtime issue capture, and explicit email send;
- time-based Model 3 AWD Demo acceleration calibrated to the official zero-to-100 km/h figure;
- desktop simulator: hold `ArrowUp` to accelerate, release it or press `ArrowDown` for progressive regenerative slowdown, and hold `Space` for stronger braking from the exact current speed;
- `VERSION` injected at build time;
- deterministic signal, score, documentation-consistency, and packaging tests.

## Verify

```bash
npm run build
npm test
```

The verified build is published to [https://sedicivalvole.app/](https://sedicivalvole.app/) after each approved checkpoint. GPS cadence, FRACTURE listening acceptance, simultaneous AudioWorklet/WebGL frame pacing, and touch reach remain pending validation in the target Tesla.
