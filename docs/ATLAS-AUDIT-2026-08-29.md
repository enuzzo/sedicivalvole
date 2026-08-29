# ATLAS Product Design Audit — 2026-08-29

Status: implementation gate opened from fresh local evidence. This audit uses
the active product at the exact Tesla split viewport (`773 × 601`, DPR 2) with
QA audio muted. It does not claim a real-GPS or vehicle result.

## Evidence

- `prototype/drive-lab/qa/atlas-audit-2026-08-29/01-gps-denied-blocking.png`
  captures the denied-permission state after launch.
- `prototype/drive-lab/qa/atlas-audit-2026-08-29/02-demo-active.png` captures
  the active Milan-only demo with RED 03, the passenger panel and mandatory
  attribution.
- Semantic inspection confirmed that the denied state contains one full-field
  waiting surface and one demo action, while the active state exposes four
  nearby entries, a collapsible passenger panel and the existing control plane.

## Blocking findings

| Priority | Finding | Required correction |
| --- | --- | --- |
| P0 | The denied/no-fix state replaces the complete ATLAS experience with a blocking waiting splash. It removes useful navigation context and gives no permission-recovery path. | Keep the control plane and an honest unlocated field available. Put GPS status and accuracy in the top navigation, then expose a compact accessible recovery popup with retry and clearly labelled Milan demo actions. |
| P0 | The automatic `easeTo` loop owns the map every 1.1 seconds. Any native map gesture is immediately overwritten and no six-second return contract exists. | Add an explicit manual-camera lease: one pointer rotates and pitches, two pointers pinch-zoom, and six idle seconds trigger one fresh eased return to the latest live position, bearing, pitch and zoom. |
| P1 | The map shows roads but does not distinguish the segment currently traversed or communicate travel direction. | Add a restrained, direction-aware pulse to a short ephemeral line built only from the latest trusted in-memory fixes. Never persist or diagnose the coordinates. |
| P1 | Heading is implicit in camera rotation; no compact compass is visible. | Use MapLibre's licensed compass control at upper left and pair it with a readable heading value. |
| P1 | The selected Wikipedia image is a `76 × 62 px` thumbnail beside a four-line excerpt. Both are too small at cabin distance and the excerpt is heavily truncated. | Let free imagery span the complete sidebar width, place a larger readable description beneath it, and retain the selected title hierarchy. |
| P1 | Only four nearby entries are exposed although the API already returns more results and the panel can scroll. | Expose a fifth result at the Tesla viewport and up to six when height permits, without shrinking touch targets below the existing compact control scale. |
| P1 | RED 03 produces saturated red building masses against saturated blue roads; several palettes similarly use source colours without map-specific luminance control. | Derive an ATLAS-specific legibility palette from every shared theme, preserving its identity while bounding land/building/road contrast and label halo separation. |
| P2 | The demo keyboard legend competes with map attribution and does not explain touch interaction. | Replace it with a quieter context-aware interaction hint and keep attribution as the lowest mandatory strip above the footer. |
| P2 | The sidebar handles overflow implicitly and can crowd the QR on shorter layouts. | Give the content one intentional scroll context, keep the persistent collapse handle, and let the QR remain subordinate after place choices. |

## Acceptance checks

Implementation is not complete until deterministic tests cover interaction
bounds, six-second return ownership, travel-line privacy and direction, all ten
palette contrast profiles, nearby-result limits and stale request rejection.
Muted browser QA must cover denied permission, retry, timeout/inaccurate labels,
Milan demo, panel collapse/reopen, one- and two-pointer gesture paths, idle
return, keyboard conflicts, all palette controls and responsive sidebar states.
Real Tesla touch response, permission UI wording, live map matching and GPS
recovery remain vehicle-only gates.
