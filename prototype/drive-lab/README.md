# Drive Lab

The first integrated `sedicivalvole` prototype, derived from visual direction 1 selected on 2026-08-26.

## Local run

```bash
npm install
npm run dev
```

The initial **TEST & START** gesture unlocks Web Audio, runs capability checks, requests GPS permission, and fades into the scene.

## Implemented

- selected luminous-axis source asset animated through WebGL2;
- CSS/static fallback and reduced-motion behavior;
- saturating speed-to-energy and speed-to-BPM mappings;
- GPS `coords.speed` input with null handling and Demo fallback;
- touch-first Stop, Brake, Atmos, Harmonics, Pulse, and Hue controls;
- integrated device report with no coordinates;
- desktop simulator: `ArrowUp`, `ArrowDown`, and `Space` for Brake;
- `VERSION` injected at build time;
- deterministic signal and packaging tests.

## Verify

```bash
npm run build
npm test
```

The build is live at [https://sedicivalvole.app/](https://sedicivalvole.app/). GPS behavior, audio quality, frame pacing, and touch reach remain pending validation in the target Tesla.
