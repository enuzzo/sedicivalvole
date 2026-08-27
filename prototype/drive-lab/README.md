# Drive Lab

The current integrated `sedicivalvole` Flux prototype for the verified Tesla split viewport.

## Local run

```bash
npm install
npm run dev
```

The initial **PLAY THE ROAD** gesture sits over the animated Signal Gate, unlocks Web Audio, runs capability checks, requests GPS permission, and fades into the scene.

## Implemented

- selectable `APERTURE 01` and `VERTIGO 02` environments; Vertigo is the byte-identical upstream Interstate 7 WebGL runtime with an external speed/FOV bridge;
- a dedicated WebGL2 Signal Gate splash with Canvas2D and reduced-motion fallbacks;
- continuously redrawn Canvas2D fallback and reduced-motion behavior for Aperture; Vertigo retains the original Three.js/post-processing renderer and caps its speed input in reduced-motion mode;
- saturating speed-to-energy and speed-to-BPM mappings;
- GPS `coords.speed` input with null handling, physics-informed soft outlier tolerance, and Demo fallback;
- touch-first Stop/Mute, visual environment, score-roadmap, and curated body-color surfaces;
- fixed `130 km/h` energy/velocity ceiling with visible Aperture tunnel formation by approximately `40 km/h`;
- integrated device report with no coordinates;
- time-based Model 3 AWD Demo acceleration calibrated to the official zero-to-100 km/h figure;
- desktop simulator: `ArrowUp`, `ArrowDown`, and held `Space` for progressive braking from the exact current speed;
- `VERSION` injected at build time;
- deterministic signal and packaging tests.

## Verify

```bash
npm run build
npm test
```

The verified build is published to [https://sedicivalvole.app/](https://sedicivalvole.app/) after each approved checkpoint. GPS behavior, the rejected audio score, renderer frame pacing, and touch reach remain pending validation in the target Tesla.
