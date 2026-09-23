# Original visual curves — September 23, 2026

## Owner direction

The owner explicitly delegates a more immersive Meridian reinterpretation and
PRTCL treatment, asks Aperture to bend across the whole tunnel, and defers
curve-driven audio because turns are much more frequent than braking. This is
scoped authority for these three original renderers. Shared palette, provenance,
road-input and reduced-motion boundaries remain in force.

## Delivered behavior

| Visual | Curve response | Visual refinement |
| --- | --- | --- |
| Aperture | Modest near translation, progressively stronger middle/far bending; all walls use one warp | Increased curve gain; dark terminus and joined wall seams retained |
| Meridian | One GPS depth field moves architecture, rails, markers and camera aim | Open blades alternate with folded/bridged galleries, palette-lit faces and seams, low shoulders and overhead parallax |
| PRTCL Fractal | View-space banking and depth-varying torsion | Signed response stays consistent while the original camera orbits |
| PRTCL Axiom | Coherent landscape banking and depth displacement | Particle landscape follows the turn without independent random jitter |

All consumers read the same trusted GPS sample without per-frame React state.
Quality, 1,500 ms expiry, speed opening above 8 km/h, full scaling at 50 km/h and
reduced-motion exclusion remain shared. Each renderer eases back to neutral when
input disappears. The earlier 100 ms GPS cadence repair remains intact.
PRTCL translation scales with the form, preserving full braking collapse.
No additional audio coupling, external assets or dependencies are introduced.
Diagnostics name the selected heading consumer, without heading/coordinates.

Meridian keeps its four-pass original WebGL2 pipeline. Multisampling and
analytic bevel filtering reduce edge shimmer; the background triangle now
interpolates its UV across the complete screen. Renderer recreation initializes
from the existing backing canvas dimensions, avoiding a stale 1 × 1 viewport.
The lightweight Canvas2D fallback retains the shared curve field.

## Verification

- Native aggregate: **1,100 passing tests**, including three new shared/depth
  regressions and the updated, owner-requested Aperture bound. Documentation:
  **8 passing checks**. Community credits: **189 exact lockfile entries**.
- Production build: **20260923-2255.0ddd3ce**, **835 exact package hashes**.
- Real component rendering at **773 × 601** covers both turn directions, lost
  input, reduced motion, Meridian at 0/40/70/130 km/h, Blue/Red/Neon palettes,
  and native UNDERWATER on Meridian and both PRTCL variants.
- Actual App geolocation callbacks at **100 ms**, 70 km/h, ±12 degrees/second
  reach Meridian and PRTCL in both development and compiled builds. Their
  observed WebGL curve uniforms settle at **+0.560 / -0.560**, then **0.000**
  after signal loss. Aperture's component uniform settles at **±0.258**.
- Local component frame samples remain approximately **60 fps**, with observed
  p95 intervals approximately **17–19 ms**. These are Mac/IAB observations,
  not vehicle GPU or sustained thermal evidence.
- No inspected runtime warnings/errors in the full-app development or compiled
  checks. Synthetic fixtures disable automatic reports and block API routes.
  Instrumentation and captures stay in the private local QA folder, outside Git.

## Canonical publication

Build **20260923-2255.0ddd3ce** is published through the official
`--publish --preserve-existing` path. All identity gates passed; 39 files /
6,502,957 bytes were uploaded, 832 unchanged static files and 29 recordings were
verified and reused, and one previous fingerprinted asset remains for cache overlap.

All **15 canonical HTTP identity/cache checks pass**, including bare root,
cache-busted root and controlled reload. The 1,445-byte HTML matches local
SHA-256 `4a593ccd0cf2793084ec7b4550e606283884481d898ddd707aa657b5175ae8d0`.
Public IAB at 773 × 601 confirms the new build, Meridian launch and PRTCL switching
between both variants, with automatic reports off and no inspected console
warnings/errors. Public GPS is unavailable in this browser; turn verification
uses the private synthetic callback through the actual local/compiled app.

Real Tesla sensitivity, cabin comfort, sustained GPU behavior and the owner's
judgment of the new Meridian remain physical/aesthetic acceptance.
