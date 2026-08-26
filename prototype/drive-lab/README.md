# Drive Lab

The current integrated `sedicivalvole` Flux prototype for the verified Tesla split viewport.

## Local run

```bash
npm install
npm run dev
```

The initial **TEST & START** gesture unlocks Web Audio, runs capability checks, requests GPS permission, and fades into the scene.

## Implemented

- selectable `APERTURE 01` and `VERTIGO 02` procedural WebGL2 environments;
- continuously redrawn Canvas2D fallbacks and reduced-motion behavior;
- saturating speed-to-energy and speed-to-BPM mappings;
- GPS `coords.speed` input with null handling and Demo fallback;
- touch-first Stop/Mute, environment, full-energy threshold, and curated body-color controls;
- integrated device report with no coordinates;
- desktop simulator: `ArrowUp`, `ArrowDown`, and `Space` for the deterministic Brake event;
- `VERSION` injected at build time;
- deterministic signal and packaging tests.

## Verify

```bash
npm run build
npm test
```

The verified build is published to [https://sedicivalvole.app/](https://sedicivalvole.app/) after each approved checkpoint. GPS behavior, the rejected audio score, renderer frame pacing, and touch reach remain pending validation in the target Tesla.
