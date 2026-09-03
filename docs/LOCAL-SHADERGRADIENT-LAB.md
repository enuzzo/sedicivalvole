# Local ShaderGradient Lab

## Purpose and boundary

The ShaderGradient Lab is the product owner's complete tuning and comparison
environment for the official ShaderGradient React renderer. The same reusable
workbench is available standalone in development and inside the authenticated
protected `/lab`.

The owner promoted its three registered starting points as Japanese Mist, Acid
Orchard, and Chromatic Silk variants of one public `GRADIENT 08` family and
retired the former project-owned renderer. `shadergradient-lab.html` remains
absent from the public App entry list, while the public product imports only the
selected renderer and exact starting-point registry through a separate lazy
chunk. LAB-only tuning controls and URL import never enter the public surface.

## Run locally

From `prototype/drive-lab/`:

```bash
npm ci
npm run dev:shadergradient
```

Open <http://127.0.0.1:5180/lab/>. The local Vite server maps this canonical
route to the owner LAB entry, matching the production path without exposing a
development filename in normal use.

The normal `npm run dev` server also serves the same route at its current local
port, for example <http://127.0.0.1:5173/lab/>. The standalone comparison entry
remains available at `/shadergradient-lab.html` for isolated renderer work.

Inside the existing owner LAB, choose `SHADERGRADIENT / LAB` from the
first header selector. Choose any `PRTCL / …` option in the same selector to
return to the calibration surface. The embedded layout keeps a full-height
side inspector on desktop and at the agreed `773 × 601` Tesla viewport; the
inspector scrolls independently without moving or shrinking the shader stage.
Both standalone and embedded layouts share Swiss Compact's semantic
`14 / 15 / 16 / 18 / 24 / 34 px` hierarchy, `48 px` action targets, and
`56 px` primary targets, so dense parameter evidence remains subordinate to
the editorial speed and section readouts without weakening touch geometry.

## Complete control inventory

- three intentionally different sedicivalvole starting points: Japanese Mist,
  Acid Orchard, and Chromatic Silk;
- all ten presets exported by the pinned package: Halo, Pensive, Mint,
  Interstella, Nighty night, Viola, Universe, Sunset, Mandarin, and Cotton Candy;
- all three geometries (`plane`, `waterPlane`, and `sphere`) and all four shader
  families actually registered in `2.4.20` (`defaults`, `positionMix`, `cosmic`,
  and `glass`), for all twelve possible combinations;
- all three colours, animation/manual time, rate, strength, density, frequency,
  sphere amplitude, grain and its blend, wireframe, loop duration, and bounded
  non-loop range;
- `3d` lighting with brightness, or the official `city`, `dawn`, and `lobby`
  HDR environments with reflection and an optional custom environment base path;
- object position and rotation on all three axes;
- field of view, geometry-appropriate distance or sphere zoom, azimuth, polar
  angle, camera smoothing, wide view, axis guide, smooth/instant transitions,
  touch camera control, and camera-value synchronization;
- pixel density, WebGL power preference, drawing-buffer retention, lazy loading,
  visibility threshold, and observer root margin. Context-creation changes
  rebuild only the WebGL canvas rather than resetting it on creative edits;
- safe import of supported values from a full `shadergradient.co` URL or query;
- `FREE`, `ROAD`, and `ROAD + AUDIO` response previews;
- a bounded `0–130 km/h` road input and a separate normalized audio-energy
  input;
- local persistence, reset, and a JSON copy action for recording a promising
  configuration.

The default `lightType="3d"` avoids ShaderGradient's remotely hosted HDR
environment maps, so the core playground remains local after installation.
Selecting `env` is intentionally marked `REMOTE HDR`; the package downloads its
three official maps unless a valid local `envBasePath` is supplied.

The lab does not turn Framer-only property-panel state, React `children`, CSS
`style`/`className`, raw spring-option objects, hover plumbing, or callback
functions into fake creative choices. Camera-update callback wiring is supplied
internally by the lab when synchronization is enabled. This is the complete
useful visual/runtime surface, not a dump of implementation internals.

## Exact dependency set

| Package | Version | Role | Licence |
| --- | ---: | --- | --- |
| `@shadergradient/react` | 2.4.20 | renderer and canvas helper | MIT |
| `@react-three/fiber` | 9.7.0 | React/Three renderer | MIT |
| `three` | 0.169.0 | WebGL scene runtime | MIT |
| `three-stdlib` | 2.36.1 | Three ecosystem helpers | MIT |
| `camera-controls` | 2.9.0 | camera control peer | MIT |

All five are exact production dependencies in `package.json` and locked with
integrity hashes in `package-lock.json`. The public App loads them only from the
separate ShaderGradient chunk when one of the three selected visuals is active.

## Modification and integration boundary

ShaderGradient's MIT licence permits use, modification, merging,
redistribution, sublicensing, and commercial distribution. The product uses the
published package without copying or changing upstream source. If a future
owner decision adapts upstream code, the ShaderGradient copyright and permission
notice must remain with every copied or substantial modified portion. Those
portions stay MIT and are not relicensed as original PolyForm-covered
sedicivalvole code.

The current promotion records exact selected parameters, retains the dependency
notice inventory, isolates bundle cost in a lazy chunk, provides reduced-motion
and Canvas2D fallbacks, and passes exact desktop/Tesla-viewport WebGL QA. The
physical-vehicle GPU, sustained frame-pacing, and thermal gates remain open. The
retained upstream notice is
[`../licenses/ShaderGradient-MIT.txt`](../licenses/ShaderGradient-MIT.txt).
