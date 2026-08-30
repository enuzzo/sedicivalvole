# Reference Study: ShaderGradient

## Provenance

- project: ShaderGradient v2;
- product URL: <https://shadergradient.co/>;
- source URL: <https://github.com/ruucm/shadergradient>;
- authors credited upstream: `ruucm` and `stone-skipper`;
- inspected branch: `main`;
- inspected on: 2026-08-30;
- public licence: MIT;
- package observed in the current repository manifest: `@shadergradient/react`
  `2.4.24`.

This is a browser-and-source study only. No ShaderGradient package, shader,
asset, preset, environment map, or source file has entered sedicivalvole. An
exact upstream commit and full transitive notice inventory remain mandatory if
the project later admits any upstream code.

## What the live customizer proved

The live `Try on web` customizer exposes a real-time scene rather than a video
or baked texture. The inspected `Halo` preset can be varied through four groups:

- **Shape:** plane, sphere, or water; noise strength, noise density, and pixel
  density;
- **Colors:** three colours, optional grain, environmental lighting,
  reflection, and brightness;
- **Motion:** animation, speed, and an optional bounded time range;
- **View:** camera azimuth/polar angle, distance, field of view, object position,
  and object rotation.

The export control serializes the complete state as a React component. The
inspected preset produced one `ShaderGradient` element whose props correspond
directly to the customizer state, including `uSpeed`, `uStrength`, `uDensity`,
the three colours, lighting, grain, camera, position, and rotation. The same
state is also encoded in the customizer URL, so a preset is configuration rather
than a rendered media asset.

## How the effect is built

The official source separates the renderer into mesh, lighting, camera controls,
and post-processing:

1. React Three Fiber owns a Three.js canvas and render loop.
2. A subdivided plane, sphere, or water plane supplies enough vertices to deform.
3. The default plane vertex shader samples classic coherent 3D noise. Time is
   multiplied by `uSpeed`; mesh position is scaled by density; the resulting
   noise displaces each vertex along its normal by the configured strength.
4. The fragment shader mixes three colours from the deformed object position.
   The colour is then passed through Three.js physical-material lighting,
   reflection, tone-mapping, fog, and related chunks.
5. Optional environmental lighting gives the surface its reflective depth.
6. Optional visible grain is a separate EffectComposer/HalftonePass render pass,
   not simply a colour-noise term inside the main fragment shader.
7. Camera distance, polar/azimuth angles, FOV, object translation, and rotation
   change which part of the moving surface fills the viewport.

The visual character therefore comes from the coordination of four systems:
deformed geometry, three-colour spatial mixing, physical lighting, and camera
framing. Merely animating a CSS gradient would reproduce none of that depth.

## Licence and dependency boundary

The upstream repository and `@shadergradient/react` package declare MIT. That
licence permits inclusion when its copyright and permission notice are retained;
it does not make the upstream work project-authored or place it under this
repository's PolyForm terms. Any
admission must first record the exact version/commit, upstream notice,
modifications, dependency licences, and shipped location in
`THIRD_PARTY_NOTICES.md`.

The current renderer expects React, React DOM, Three.js, React Three Fiber, and
in documented setups `three-stdlib` plus `camera-controls`. The sedicivalvole
prototype currently has React 19 but deliberately uses project-owned direct
WebGL2 renderers rather than Three/R3F. Adding the component would therefore be
an architectural and GPU-budget decision, not a free visual preset. The public
package is local runtime code: there is no per-view API charge or listener-based
service cost.

## Recommended sedicivalvole translation

⭐ Build a project-authored **shader field** as a new `FIELD / ABSTRACT` visual,
using the existing direct WebGL2 renderer pattern. Treat ShaderGradient as a
mechanics reference, not as the default dependency.

This preserves the strongest idea while keeping control of bundle size, render
passes, context loss, Canvas2D/static fallback, diagnostics, and Tesla-specific
quality scaling. It also avoids importing a complete scene framework for one
field when the product already has its own shared visual lifecycle.

The first implementation spike should use:

- one tessellated plane and one project-authored coherent-noise deformation;
- three authored colours mixed from deformed position;
- one restrained directional/specular lighting model, with no HDR environment
  map in the baseline;
- no grain post-pass in the baseline; if later selected, grain must be subtle,
  optional, and independently profiled;
- direct uniforms driven by T1's timestamped, smoothed response state;
- static reduced-motion and non-WebGL fallbacks that keep the chosen palette.

### Driving response contract

Raw GPS must never be written directly into shader time or geometry. The view
consumes the shared `0–130 km/h` normalized T1 state and authors its own bounded
endpoints:

| Input | Shader response |
| --- | --- |
| Sustained speed | Increases time rate and apparent longitudinal flow through a bounded curve; maximum visual travel is reached without runaway motion. |
| Speed energy | Adds moderate deformation strength and density, preserving broad calm forms at rest instead of collapsing to a flat colour. |
| Positive acceleration | Briefly narrows and brightens a travelling seam and adds a small deformation/reflection impulse; it does not permanently raise base speed. |
| Deceleration | Releases motion and depth asymmetrically toward the current sustained-speed target; it never reverses time or snaps the field still. |
| OPEN | Expands the colour seam and raises luminous depth for the shared envelope. |
| UNDERWATER | Slows local phase, deepens the palette, and broadens the surface without obscuring the entire field. |
| BLOOM | Produces one short, level-safe radiance/reflection pulse, not a permanent bloom layer. |

Exact endpoints belong in LAB presets after the renderer exists. Three candidate
visual identities must be shown at `773 × 601` and selected by the owner before
the product visual is built or named permanently.

## Tesla performance gate

The spike is acceptable only if it is measured alongside audio at the real
Tesla viewport rather than judged from desktop screenshots:

- baseline pixel density is `1`, not raw device pixel ratio;
- one render pass is the starting budget;
- measured frame time, dropped frames, context loss, long tasks, and memory are
  reported in DIAG;
- automatic quality reduction may lower internal resolution or shader detail,
  but may not change colour identity or driving-response semantics;
- the selected target is a stable measured frame rate on the target vehicle;
  desktop smoothness is not acceptance evidence;
- no new package or source is admitted until the direct-WebGL2 spike is compared
  against the official component on appearance, bundle cost, GPU time, and
  maintenance burden.

## Decision state

- **Collected:** yes.
- **Reference mechanism understood:** yes.
- **Source or dependency admitted:** no.
- **Product view implemented:** no.
- **Next gate:** assign a stable owner ID, then present exactly three visual
  directions before implementation.
- **Companion comparison:** FeralUI Gradient Builder and ColorFlow are evaluated
  in [`REFERENCE-STUDY-GRADIENT-TOOLS.md`](REFERENCE-STUDY-GRADIENT-TOOLS.md).
