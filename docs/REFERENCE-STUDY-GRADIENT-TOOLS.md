# Reference Study: Gradient Authoring Tools

## Provenance and scope

This companion study compares two live gradient-authoring products with the
existing ShaderGradient study:

| Reference | Product | Primary evidence | Licence boundary |
| --- | --- | --- | --- |
| FeralUI Gradient Builder | <https://feralui.dev/gradients> | Live Studio, Mesh, Aurora, and Export interfaces inspected on 2026-08-30; site terms at <https://feralui.dev/terms> | The Gradient Builder is not among the site's MIT npm packages. FeralUI's terms say unpublished demos are shown as work and are not licensed for copying or redistribution. |
| ColorFlow | <https://colorflow.ls.graphics/> | Live editor and official introduction at <https://www.ls.graphics/ideas/introducing-color-flow-create-professional-mesh-gradients-in-minutes>, inspected on 2026-08-30; provider terms at <https://www.ls.graphics/terms-of-service> | The product says generated work is free for personal and commercial use. This is not an open-source licence for its editor, WebGL runtime, presets, effects, or embed implementation; the provider's general terms retain ownership and restrict redistribution and replication. |
| ShaderGradient | <https://shadergradient.co/> | Existing live and official-source study | The upstream package is MIT, but no source or dependency is admitted yet. See [`REFERENCE-STUDY-SHADERGRADIENT.md`](REFERENCE-STUDY-SHADERGRADIENT.md). |

This is a browser-and-primary-source study only. No preset, export, embed,
image, video, JSON, source, shader, package, or runtime from either newly
inspected tool has entered sedicivalvole.

## FeralUI Gradient Builder

### What the live editor proved

FeralUI is strongest as a visual-authoring grammar. Its editor groups distinct
families—Flow, Sky, Aurora, Mesh, Forms, Lines, Bars, and Columns—behind a
consistent surface rather than treating every result as one generic gradient.
The inspected states exposed:

- draggable colour points or bands and named four-colour palettes;
- family-specific controls such as scale, distortion, swirl, fold, drift,
  direction, and speed;
- finish controls for softening and noise;
- explicit colour-balance explanations and AA/AAA contrast indications;
- saved, shared, preview, and fullscreen states;
- PNG, JPG, SVG, MP4, CSS, and JSON export choices, including sRGB, Display P3,
  OKLCH, Linear sRGB, and CMYK profiles.

The Aurora state used a live canvas. The CSS export explicitly reduced that
state to a linear-gradient fallback plus an optional grain tile and warned that
CSS could not reproduce the actual field. That distinction is useful: the
valuable product idea is not a CSS snippet, but a controlled authoring language
for colour balance, motion, texture, and family identity.

### What to carry forward

Use FeralUI as a quality reference for the future LAB authoring surface:

- palettes should explain the role of each colour, not expose unexplained hex
  values alone;
- perceptual colour-space previews and contrast checks should happen during
  authoring;
- motion, geometry, palette, and finish should remain separate parameters;
- a family should preserve a recognisable rest state before speed is applied.

Do not copy its presets, family implementations, exports, UI, or unpublished
demo code. If a similar control is needed, specify it from the project's own
renderer and independently authored parameter model.

## ColorFlow

### What the live editor and official material proved

ColorFlow is the most directly relevant runtime reference of the three. The
editor exposes a rectangular or circular colour mesh with configurable grid
size, draggable points, Bezier-style handles, fixed-edge behaviour, and several
interpolation modes: RGB, Linear RGB, Lab, Lch, OKLab, and HSL. The live product
renders its field and effects in WebGL and keeps an SVG editing overlay above
the canvas.

Its procedural layer can animate point position, handles, saturation,
lightness, and hue with bounded duration, speed, randomness, easing, and loop
controls. A separate interaction layer offers attract, repel, wave, colour
shift, bulge, and swirl behaviours. Optional post effects include grain,
chromatic aberration, progressive blur, glass distortion, halftone, pixelation,
watercolour, and VHS treatments. The inspected export surface offered static
PNG, JPG, and WEBP plus video; the product also exposes a real-time embed path.

### What to carry forward

The strongest transferable mechanics are generic rather than product-specific:

- a small project-authored control mesh gives broad, legible forms without a
  heavy 3D scene;
- perceptual interpolation can avoid muddy transitions between distant hues;
- point motion and handle motion can be independent, creating calm drift at
  rest and directional flow under speed;
- edge locking prevents the field from exposing background gaps;
- animation and interaction should be separate envelopes rather than one
  cursor-driven effect.

The first project spike should not use ColorFlow's embed snippet, presets,
exports, effect stack, or runtime. It should not recreate the ColorFlow editor.
Any colour-space math must come from independently documented specifications or
project-authored conversions, with provenance recorded before admission.

## Combined recommendation

⭐ Keep the planned project-owned direct-WebGL2 field, but broaden its design
brief beyond a ShaderGradient clone:

| Reference contribution | Project translation |
| --- | --- |
| ShaderGradient | Optional depth through restrained displacement, lighting, and camera framing. |
| FeralUI | Authored family identity, palette roles, perceptual colour review, and finish discipline. |
| ColorFlow | Lightweight control-mesh topology, curved flow, perceptual interpolation, and separable procedural/interactive response. |

The preferred baseline is a one-pass 2D mesh field rather than an imported
Three.js scene or hosted embed. JavaScript can precompute a small palette in a
perceptual colour space and upload the result as uniforms or a tiny LUT; the
fragment shader then performs bounded piecewise sampling. This keeps conversion
cost out of every pixel while preserving better colour transitions. A later 3D
direction may add restrained displacement only if the exactly-three-direction
comparison proves that depth earns its GPU and maintenance cost.

Speed must act through T1's smoothed `0–130 km/h` state:

- sustained speed increases bounded control-point/phase travel;
- positive acceleration briefly tightens one flow seam;
- deceleration releases asymmetrically without reversing the field;
- audio energy changes breadth and palette emphasis, not raw animation speed;
- OPEN, UNDERWATER, and BLOOM retain distinct timestamped envelopes;
- touch interaction may perturb the field while parked or passenger-operated,
  but speed response must not masquerade as a cursor effect.

Grain, blur, chromatic aberration, glass, halftone, and other post effects remain
off in the first spike. Each additional pass or sample-heavy treatment requires
separate Tesla profiling and must preserve reduced-motion and non-WebGL
fallbacks.

## Decision state

- **Collected:** yes.
- **Live editors explored:** yes.
- **Licence boundary checked:** yes; neither new tool is approved as product
  source or runtime.
- **Source, embed, export, preset, or dependency admitted:** no.
- **Product view implemented:** yes, as project-owned direct WebGL2
  `GRADIENT 08`; no studied tool runtime, source, shader, preset, export, embed,
  or asset was admitted.
- **Selected direction:** one continuous low-speed Tension Plane to high-speed
  Chromatic Fold hybrid with bounded in-pass grain.
- **Remaining gate:** target-Tesla motion, frame pacing, grain, audio/source
  boundary and thermal acceptance.
