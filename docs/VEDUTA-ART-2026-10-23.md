# Veduta — whole-scene illustration iteration

## Owner correction

The owner accepted the small GPS point, then rejected the candidate's ordinary
3D-map appearance and requested the Anime, Manga and Watercolor language of
the separate GeoPoster laboratory. The selected horizon-facing composition
and real GPS following remain unchanged. Controls must use Sedicivalvole's
existing interface language; the preview remains open during development.

## Rendering change

The previous medium shader affected custom nearby meshes only. Native terrain,
water, roads, distant buildings and sky still read as flat cartography. A final
public MapLibre custom layer now copies the completed framebuffer into one
owned RGBA8 texture and draws one fullscreen medium pass in the same context.
It uses nine paint samples, four softly variance-weighted neighbourhoods and
four additional one-pixel structural samples (13 total), followed by a
medium-specific response. No pixels leave the GPU, no new geographic owner
or provider is added, and DOM controls/credits retain their normal rendering.

- Anime uses broad colour abstraction, geometry-normal-based two-value warm
  light/cool shade and selective contours. Instance normals compensate for
  nonuniform canopy scaling. Water ink is reduced to preserve light marks.
- Manga uses paper, dark ink, controlled middle tones and anti-aliased halftone
  and hatching across the landscape. It is more than desaturation.
- Watercolor uses broader abstraction, two-scale wash density, reserved paper,
  optical-density pigment response, edge pooling and fine paper texture.
- Structural edges use the local one-pixel gradient, separately from the broad
  paint kernel. Strong boundaries retain centre colour to avoid doubled roofs
  and road edges. The final inspected correction removes most of that ghosting.
- Geographic pigment marks retain a stable Mercator phase across the 2km local
  origin rebase. Printed paper/halftone may remain fixed to the screen.
- Original brush tiles affect mapped vegetation only; unknown ground is not
  converted to forest. Trees are decorative symbols, not observed tree records.

The pass has colour/gradient input. It does not claim GeoPoster's semantic,
depth/normal-guided reconstruction. Thin-surface mixing and architectural
simplification remain visual checks; a colour pass cannot invent real detail.
The implementation is original. The [research record](../THIRD_PARTY_NOTICES.md#veduta-whole-scene-illustration-studies--october-23-2026)
distinguishes ideas from copied code/assets.

## Source geometry and resource ownership

Near buildings are ranked by proximity and count against the cap only after
usable elevation is available. A completed new batch replaces the previous
batch atomically. Native geometry remains fallback; custom facades use depth
offset so coincident ordinary faces do not cover their illustration materials.

Mapped wood/grass/garden symbols use stable density tiers and varied rounded/
slender silhouettes. Pitches, playgrounds, buildings and indexed road clearances
exclude tree positions. These are illustrative approximations, not a survey.
Accepted trees remain capped at 1,400, candidates at 8,000; the road index also
has explicit segment and entry caps. No people/animal/lab assets are imported.

World materials remain owned across batch replacements and medium changes, so
discarding geometry does not repeatedly discard their shader programs. Removal
disposes the bounded material cache. Instance meshes emit their own disposal
event to release instance attributes as well as ordinary geometry/materials.
The terminal pass releases its bindings and lets the pinned MapLibre custom-layer
owner invalidate/restore native state. The October 23 loading follow-up removes
per-frame synchronous GL state queries; it still reallocates only on
viewport resize and deletes only its owned program, texture and VAO.

## Interface change

STYLE and VIEW use the shared `visual-cycle-button` and `visual-cycle-rail`
geometry and Night Instrument material. STYLE cycles the three media directly;
VIEW uses the same extracted disclosure caret as the footer because it opens a
surface. The options plate uses the shared popover material and semantic states.

The existing outside-dismiss hook consumes an external tap and distinguishes
it from scrolling/pinching. CLOSE/Escape restore trigger focus. Tab inside the
open contextual panel retains its keyboard lane rather than waking and hiding
it. Known outside focus departure closes it; a native select's null blur does
not. The default point remains fixed at 12 CSS pixels.

## Evidence boundary

The full package suite passed 1,141 tests. Shared chrome regression passed 16/16
and text fit 14/14 with no baseline changes. Actual browser checks covered
medium changes, same-GPS exit/re-entry through Atlas, panel keyboard navigation,
Model Y/red selection, Escape/focus restoration and consumed outside dismissal.
Private current captures are kept under `Documents/Codex/2026-10-23/veduta-art/`:
the three `*-tesla-final.png` files share a 773 × 601 viewport and stationary
GPS; `three-media-final.jpg` combines them for direct comparison. Actual phone
390 × 844 checks cover the options panel in LIGHT and DARK. A subsequent
40-metre synthetic observation sequence moves the entire camera/landscape;
pause holds the last position and resume restores GPS follow. This does not
measure physical-GPS performance or sustained frame pacing.

After the last shader refinement, 16 focused renderer/model tests passed.
The earlier full suite/chrome gates remain separate evidence; final production
package `20261023-1458.9d4821b` passes 839 exact static hashes and matching
VERSION/HTML identity. Source checkpoint `9d4821b` is pushed to `origin/main`.
The package is not published. Independent image review
confirms clearer Watercolor boundaries, stronger Anime volume and finer Manga
retino. Full GeoPoster richness remains unmet: repeated schematic houses and
windows, generic vegetation, uniform water and limited material-specific brush
hierarchy. These checks do not establish owner artistic acceptance, canonical
publication or physical Tesla endurance.
