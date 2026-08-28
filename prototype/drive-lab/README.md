# Drive Lab

The current integrated `sedicivalvole` Flux prototype for the verified Tesla split viewport.

## Local run

```bash
npm install
npm run dev
```

The initial **PLAY THE ROAD** gesture is one flat typographic launch surface with an enlarged `sedicivalvole` wordmark and no simulated hardware. It sits over the animated Signal Gate, unlocks Web Audio, runs capability checks, requests GPS permission, and fades into the scene. Its readable footer links [Netmilk Studio](https://netmilk.ch), credits [Illobo](https://github.com/illobo), and identifies the public [source repository](https://github.com/enuzzo/sedicivalvole) with a small monochrome GitHub mark. Setting a valid `VITE_SUPPORT_URL` for a `buymeacoffee.com` profile enables the prepared `BUY ME A COFFEE` link; without one, no inert control is rendered.

## Implemented

- four selectable environments: `APERTURE 01`, byte-identical upstream Interstate 7 `VERTIGO 02`, original `MERIDIAN 03`, and lazy OpenFreeMap `ATLAS 04`;
- a dedicated WebGL2 Signal Gate splash with independently phased travelling lane gaps, restrained perspective airflow, and Canvas2D/reduced-motion fallbacks;
- continuously redrawn Canvas2D fallback and reduced-motion behavior for Aperture; Vertigo retains the original Three.js/post-processing renderer and caps its speed input in reduced-motion mode;
- FRACTURE, a generative AudioWorklet score with ten four-bar sections, a narrow `162–176 BPM` range, tested harmony, staged deceleration memory, and an offline render path;
- an honest Music library: generative FRACTURE and the compact adaptive JUNCTION music bank are selectable; five later directions remain disabled and marked `IN PREPARATION`;
- GPS `coords.speed` input with null handling, physics-informed soft outlier tolerance, and Demo fallback;
- a 64 px Tesla footer with touch-first Stop/Mute, Visual and Music libraries, disclosure carets, and ten curated body themes;
- fixed `130 km/h` energy/velocity ceiling with visible Aperture tunnel formation by approximately `40 km/h`;
- integrated coordinate-free device report with continuity-safe per-phase FPS/frame-time, a dedicated Aperture morph phase, heap/decoded-audio memory, real output RMS/peak, GPS confidence, musical-family/take exposure, an in-memory driving flight recorder, and explicit gzip-attachment email send;
- a measured 64 px `PALETTE` footer at `773 × 601`: icon-only audio state, vertically ordered Visual/Music choices, truthful disclosure carets, and a theme control shared by field and UI accent;
- time-based Model 3 AWD Demo acceleration calibrated to the official zero-to-100 km/h figure;
- desktop simulator: hold `ArrowUp` to accelerate, release it or press `ArrowDown` for progressive regenerative slowdown, and hold `Space` for stronger braking from the exact current speed;
- `VERSION` injected at build time;
- deterministic signal, score, documentation-consistency, and packaging tests.

## Verify

```bash
npm run build
npm test
```

The verified build is published to [https://sedicivalvole.app/](https://sedicivalvole.app/) after each approved checkpoint. GPS cadence, FRACTURE/JUNCTION listening acceptance, simultaneous audio/WebGL frame pacing, and touch reach remain pending validation in the target Tesla.
