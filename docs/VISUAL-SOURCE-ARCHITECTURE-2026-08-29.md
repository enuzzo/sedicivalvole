# Visual Source Architecture — 2026-08-29

Status: **implementation contract**.

This document turns the admitted Drivey, PRTCL, InfiniteTubes, and Primordial
studies into one Sedici Valvole interaction and renderer architecture. Source
and licence boundaries are defined in
[`SOURCE-ADMISSION-2026-08-29.md`](SOURCE-ADMISSION-2026-08-29.md).

## Catalog shape

After WAKE's retirement, the admitted source studies occupy these catalog slots:

| Number | Environment | Contextual variants |
|---:|---|---|
| `05` | `DRIVEY` | Hood, Rear, Aerial cameras; Normal/Wire render modes |
| `06` | `PRTCL` | Fractal Frequency, Murmuration, Axiom |
| `07` | `INFINITE` | Particles, Star Wars, Triangle |
| `08` | `PRIMORDIAL` | one fluid-field environment |

Variants belong to their environment. They are not separate demo dumps and do
not expand the primary visual picker into duplicated source entries.

## Measured Tesla control placement

At `773 × 601`, the existing top bar occupies `68 px`, the low control plane
occupies `64 px`, and the persistent speed module owns the upper-right
`280 × 68 px`. DRIVEY and PRTCL use the measured open area at the upper left
for direct controls:

- a two-column rail starts `16 px` from the left and `82 px` from the top;
- each text-only control is `94 × 34 px`; `VIEW` cycles Hood, Rear and Aerial,
  while `RENDER` cycles Normal and Wire;
- pressing a control changes state directly; neither control opens a dropdown,
  disclosure panel, range, or icon menu.
- PRTCL uses one button with the same `94 × 34 px` geometry; `TYPE` cycles
  Fractal Frequency, Murmuration, and Axiom and always prints the current family.

The implemented PRIMORDIAL tuner and the future INFINITE tuner share the
previously measured outer placement:

- collapsed trigger: `16 px` from the left, `82 px` from the top, minimum
  `44 px` touch height;
- open panel: `232 px` wide, directly below the trigger, vertically bounded
  above the low control plane;
- tall mobile: the panel's bottom bound moves above the existing `224 px`
  two-row footer and becomes internally scrollable;
- the tuner is not rendered for APERTURE, VERTIGO, MERIDIAN, ATLAS, DRIVEY, or
  PRTCL, so
  it cannot collide with the ATLAS compass, map attribution, or passenger panel;
- the tuner exists only in the running experience, so it cannot collide with
  the Signal Gate support panel;
- opening it keeps the retracting header and footer awake; closing it restores
  the normal retreat timing.

The trigger is named `TUNE`, not `Settings`, because it edits the current
visual performance rather than application preferences. Every range has an
explicit accessible name and visible value. DRIVEY and PRTCL
deliberately use the smaller always-visible cycling controls selected in product
review.

## Contextual controls

| Environment | Controls |
|---|---|
| DRIVEY | View cycle, Render cycle |
| PRTCL | Particle Type cycle; shared Palette remains separate; speed/music own the low-level response |
| INFINITE | Variant, Curvature, Depth |
| PRIMORDIAL | Scale, Flow, Warp |

There is deliberately no generic `Intensity` slider. Every control maps to one
visible authored property, and each range is clamped before persistence or
rendering.

## Input separation

Road speed and music enter every renderer through different model inputs:

- road speed owns forward travel, perspective/FOV, convergence, spatial depth,
  and PRTCL particle size;
- musical output level and transport phase own colour motion, pulse, flock
  breath, highlight timing, and local agitation;
- OPEN, UNDERWATER, and BLOOM are named performance macros with native geometry
  or material responses rather than one shared post-effect;
- at rest, transport pulse is suppressed and only slow harmonic/timbral life is
  retained; muted QA may render a deterministic zero-level musical input;
- reduced motion freezes road travel and periodic agitation while preserving a
  legible static composition and touch controls.

## Renderer boundaries

- DRIVEY embeds the byte-identical modern Rezmason runtime pinned at
  `5104cdade2a3158786b05b9b0680a50e942830cf`. A project-authored same-origin
  iframe shell and parent bridge update only the runtime's existing controls,
  cameras, materials and colour buffers. The 51-file integrity manifest is a
  publication gate; vendor source is not patched.
- PRTCL uses a bounded project-authored WebGL2 point renderer that adapts the
  three directly authorized formulas pinned at PRTCL commit `2a22f33b`. It
  preserves their reviewed `24,000`, `16,000`, and `37,000` particle budgets,
  characteristic forms, and camera composition while replacing the native
  palette/UI layer with Sedici Valvole state. A `1.25` pixel-ratio cap, fixed
  draw counts, context-loss path, and explicit GPU cleanup protect the Tesla
  viewport. No fallback may substitute the rejected coarse Canvas2D prototype.
- INFINITE uses one bounded project-authored Canvas2D tunnel engine. Its three
  variants share path, convergence, touch, palette, macro, and cleanup logic.
  Star Wars is procedural and imports no galaxy texture.
- PRIMORDIAL uses one full-screen project-authored WebGL2 shader with a
  Canvas2D failure path. Its noise and domain warping are independently authored
  and do not copy the Pen or its attributed noise fragment.

Every field reports renderer identity and frames through the existing
diagnostic callbacks, handles context or frame failure once, cancels animation
frames and pointer listeners on cleanup, caps pixel ratio, and remains inside
the shared environment error boundary.

## Acceptance boundary

Implementation is blocked from publication until deterministic tests, muted
browser performance/console checks, and source-versus-runtime Product Design
comparisons pass at `773 × 601`. Those checks can establish implementation and
machine evidence only. Human visual/listening review and real-Tesla touch,
readability, frame pacing, thermal behaviour, and motion comfort remain explicit
acceptance gates.

## 2026-09-02 current-catalog addendum

This dated study retains retired INFINITE/PRIMORDIAL decisions as provenance;
the active source architecture now uses `GRADIENT 08` in the eighth slot.
Gradient is a project-owned direct WebGL2 tessellated 3D surface with a
Canvas2D fallback. One indexed draw call combines coherent displacement, smooth
analytical normals, spatial three-colour mixing, bounded lighting, and a fine
fragment-stage grain term. It continuously morphs from Tension Plane to
Chromatic Fold across the smoothed `0–130 km/h` range; the speed readout may
truthfully exceed that ceiling without unlocking further response. Play the
Road admits bounded audio breadth/radiance and Soundtrack remains speed-only.
No ShaderGradient, FeralUI, ColorFlow, or Three.js code, preset, shader, embed,
asset, or dependency entered that production runtime. A 2026-09-02 addendum
admits exact MIT ShaderGradient/Three/R3F packages only as development
dependencies for the isolated `shadergradient-lab.html` comparison page and
authenticated protected-LAB workbench. The stack remains absent from the public
App entry and cannot silently change the source architecture recorded here.
