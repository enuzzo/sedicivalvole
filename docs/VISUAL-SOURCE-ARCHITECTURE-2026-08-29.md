# Visual Source Architecture — 2026-08-29

Status: **implementation contract**.

This document turns the admitted Drivey, PRTCL, InfiniteTubes, and Primordial
studies into one Sedici Valvole interaction and renderer architecture. Source
and licence boundaries are defined in
[`SOURCE-ADMISSION-2026-08-29.md`](SOURCE-ADMISSION-2026-08-29.md).

## Catalog shape

The Flux visual library adds four entries after `WAKE 05`:

| Number | Environment | Contextual variants |
|---:|---|---|
| `06` | `DRIVEY` | Driver, Hood, Rear cameras |
| `07` | `PRTCL` | Fractal Frequency, Murmuration, Axiom |
| `08` | `INFINITE` | Particles, Star Wars, Triangle |
| `09` | `PRIMORDIAL` | one fluid-field environment |

Variants belong to their environment. They are not separate demo dumps and do
not expand the primary visual picker into duplicated source entries.

## Measured Tesla control placement

At `773 × 601`, the existing top bar occupies `68 px`, the low control plane
occupies `64 px`, and the persistent speed module owns the upper-right
`280 × 68 px`. The contextual tuner therefore uses the measured open area at
the upper left:

- collapsed trigger: `16 px` from the left, `82 px` from the top, minimum
  `44 px` touch height;
- open panel: `232 px` wide, directly below the trigger, vertically bounded
  above the low control plane;
- tall mobile: the panel's bottom bound moves above the existing `224 px`
  two-row footer and becomes internally scrollable;
- the tuner is not rendered for APERTURE, VERTIGO, MERIDIAN, ATLAS, or WAKE, so
  it cannot collide with the ATLAS compass, map attribution, or passenger panel;
- the tuner exists only in the running experience, so it cannot collide with
  the Signal Gate support panel;
- opening it keeps the retracting header and footer awake; closing it restores
  the normal retreat timing.

The trigger is named `TUNE`, not `Settings`, because it edits the current visual
performance rather than application preferences. Every select group and range
has an explicit accessible name and value. Variant buttons and the close button
retain at least `44 px` touch targets.

## Contextual controls

| Environment | Controls |
|---|---|
| DRIVEY | Camera, Structure |
| PRTCL | Variant, Zoom, Particles, Colour Speed, Size |
| INFINITE | Variant, Curvature, Depth |
| PRIMORDIAL | Scale, Flow, Warp |

There is deliberately no generic `Intensity` slider. Every control maps to one
visible authored property, and each range is clamped before persistence or
rendering.

## Input separation

Road speed and music enter every renderer through different model inputs:

- road speed owns forward travel, perspective/FOV, convergence, spatial depth,
  and — for Fractal Frequency — particle size;
- musical output level and transport phase own colour motion, pulse, flock
  breath, highlight timing, and local agitation;
- OPEN, UNDERWATER, and BLOOM are named performance macros with native geometry
  or material responses rather than one shared post-effect;
- at rest, transport pulse is suppressed and only slow harmonic/timbral life is
  retained; muted QA may render a deterministic zero-level musical input;
- reduced motion freezes road travel and periodic agitation while preserving a
  legible static composition and touch controls.

## Renderer boundaries

- DRIVEY uses a bounded project-authored Canvas2D perspective road. Camera
  variants change horizon, dashboard crop, and look direction without using an
  upstream level or car asset.
- PRTCL uses a bounded project-authored Canvas2D particle engine. Fixed maximum
  arrays and point-size caps protect the Tesla viewport; each variant owns its
  own parametric form.
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
