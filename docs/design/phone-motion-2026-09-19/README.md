# Phone motion visual concepts — September 19, 2026

These are generated design mockups with illustrative data, not screenshots of
implemented behavior. Created with the built-in imagegen tool using the existing
owner-supplied piston mark as the brand reference. No new external dependency or
third-party asset was admitted. Original project licensing applies.

## Owner selection

The owner selected **TRACE**, specifically the opaque presentation with the
trail contained in a wireframe cube, then requested these changes:

- Add the small phone orientation indicator from VECTOR.
- Move the ZERO button below the graph so it cannot obscure the visualization.
- Replace SET REFERENCE with the exact lowercase subtitle **recalibrate**.

[trace-selected.png](trace-selected.png) is the resulting implementation target.
This selection supersedes the earlier central-over-plot TARE placement for the
companion instrument. Preserve the surrounding Sedicivalvole identity and
portrait-first behavior. Responsive implementation must retain legible values
and touch targets and may scroll; it must not reproduce placeholder data as real
measurements. The source logo remains authoritative over generated approximations.

The selected feature is implemented in `src/motion/` with the existing Three.js
WebGL2 renderer, truthful wake-lock states and aggregate diagnostics. These
images remain concepts; see the [implementation and release evidence](../../PHONE-MOTION-COMPANION-2026-09-18.md#trace-instrument--september-19) for current product facts.

## Deliverables

- [VECTOR](vector.png): fixed XYZ cross, acceleration vector with a fading dotted
  history, and a small phone orientation indicator.
- [GYRO](gyro.png): gimbal rings, angular marks, phone orientation and an
  acceleration arrow with an angular trace.
- [TRACE](trace.png): cubic measurement grid and a fading red ribbon history.
- [Selected TRACE revision](trace-selected.png): unobstructed cube, small phone,
  and ZERO / recalibrate below the chart.

## Generation prompt brief

Shared brief: a flat, portrait iPhone companion screenshot, opaque matte #0f0f0f
background, off-white typography, fine grey rules, restrained vermilion accent,
piston logo, lowercase geometric sedicivalvole wordmark and Space Grotesk-like
numerals. Keep connection/screen-wake indicators, identical demonstration XYZ
readouts, reference/trail status and expandable help/diagnostics. Clearly label
CONCEPT / DEMO DATA. Avoid glass, smoke, textured backgrounds and decorative UI.

Variant prompts: VECTOR uses a sparse isometric cross and short dotted red
acceleration-tip trail; GYRO uses intersecting angular rings and a wireframe
phone; TRACE uses a thin cubic grid and narrow red temporal ribbon. A correction
pass removed unwanted transparency and normalized PHONE COMPANION copy.

Selected edit prompt: preserve the opaque TRACE design; restore the complete
cube/grid/trail behind the former central button; add VECTOR's small wireframe
phone with XYZ triad at the upper left without overlapping labels; put one
large off-white ZERO button in its own row below the full graph, above the
acceleration values, with exact subtitle recalibrate. Preserve other controls,
brand, sample values and portrait legibility.
