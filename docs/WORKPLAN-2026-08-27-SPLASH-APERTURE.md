# Work Plan: Splash polish and Aperture continuity — 2026-08-27

Status: **complete**, build `20260827-1401` deployed and verified. Written before any code was touched, so this work can be
handed to another session or another tool mid-flight. Update the checkpoint table
as each one lands; each checkpoint is its own commit.

Scope is exactly the five items the user requested. Nothing else is in scope for
this pass: the textStep audio work and the Meridian quality pass are both parked
and recorded in [`SESSION-HANDOFF.md`](SESSION-HANDOFF.md).

## Checkpoints

| # | Checkpoint | Commit | State |
|---|---|---|---|
| CP1 | Splash shows the build version top-right instead of `FLUX · APERTURE` | `see below` | **done** |
| CP2 | Splash lanes: faster, glow, scrolling, broken laminarity | `see below` | **done** |
| CP3 | `PLAY THE ROAD` given a strong, deliberate treatment | `see below` | **done** |
| CP4 | Aperture: one continuous coordinate system, no tearing | `see below` | **done** |
| CP5 | Aperture: stable per-tile colour, rest-only recolour | `see below` | **done** |
| CP6 | Full suite, build, rendered QA at 773x601, deploy and verify | `see DEPLOY.md` | **done** |

## CP1 — Version readout on the splash

Today the splash status line reads `FLUX · {environment} · {version}`. The user
wants the build version alone, top right.

- `src/App.jsx`, the `.splash-status` element.
- `APP_VERSION` is already injected from the root `VERSION` file by the Vite
  `define` block. Do not hard-code it; `VERSION` stays the only SemVer source.
- The environment name moves out of the splash. It is still shown in the live
  header and in the diagnostic report, so nothing truthful is lost.

## CP2 — Splash lane animation

`src/splash-signal-gate.jsx`, fragment shader. Twelve lanes per side bend from
the lower edges into the central gate. Current behaviour and what changes:

| Aspect | Now | Target |
|---|---|---|
| Lateral wave | `sin(u_time * 0.42 …) * 0.008` | faster and slightly wider |
| Longitudinal signal | `0.88 + 0.12 * sin(u_time * 0.9 - v_uv.y * 21.0 …)` | becomes a travelling, broken pattern rather than an even shimmer |
| Glow | `exp(-d * 32..58) * 0.07` | stronger, wider, and with a hotter core |
| Laminarity | every lane is a clean unbroken line | lanes carry travelling gaps and intensity breaks so the scroll direction is legible |

The important one is the last: an unbroken line has no visible longitudinal
motion however fast it scrolls, because there is no feature to track. Breaking
each lane into travelling segments is what makes the movement readable.

The splash must still freeze after launch — it is not allowed to leave a hidden
animation loop running behind the live experience. Keep the reduced-motion path.

## CP3 — `PLAY THE ROAD`

`src/styles.css`, `.launch-button`. Currently a plain off-white slab. It must
stay Braun-influenced, Swiss and slightly brutalist: square, flat, strict
monospace, no circular buttons, no glassmorphism, no decorative chrome. Strength
has to come from proportion, weight, contrast and a considered pressed state,
not from ornament.

## CP4 — Aperture tears when speed rises

**This is the substantial one.** The reported symptom is tiles splitting along
diagonals as the tunnel forms.

### Root cause

`src/flux-field.jsx` blends two different coordinate systems:

```glsl
vec2 flatGrid   = v_uv * vec2(10.0, 7.0);                       // Cartesian
vec2 tunnelGrid = vec2(perimeter * perimeterDensity,            // ring topology
                       depth * depthFrequency + u_flow);
vec2 fieldGrid  = mix(flatGrid, tunnelGrid, warp);
vec2 fieldCell  = floor(fieldGrid);
```

`squarePerimeter` walks the square ring and switches branch on the diagonals
where `|x| == |y|`. That is a genuine discontinuity in `tunnelGrid.x`. At
`warp = 0` and `warp = 1` each system is self-consistent, but at every value in
between the blend carries a *fraction* of that discontinuity across the
diagonals, so `floor()` cuts cells along them. Those are the diagonal tears in
the screenshot.

This cannot be tuned away. A Cartesian mosaic and a square tunnel are different
topologies and no continuous map exists between them across the whole frame.

### Fix

Use **one** coordinate system at every speed:

- the angular coordinate `perimeter * perimeterDensity` is used unchanged at all
  warps, so its discontinuity is never blended and never lands inside a cell;
- only the **radial** coordinate interpolates, between a linear reading of
  `majorAxis` and the perspective reading `depthFrequency / majorAxis`. Both are
  monotonic in `majorAxis`, so their blend stays monotonic and cannot fold.

Speed then deforms one field instead of crossfading two.

### What was actually built

The first attempt kept ring coordinates at all speeds and blended only the
radial term. It removed the tearing and produced an excellent tunnel, but ring
topology converges toward the centre by construction, so the resting state became
a static tunnel and there was no flat end of the range left at all. That was
worse than the defect being fixed, so it was replaced.

The shipped fix keeps a **Cartesian grid at every speed** and produces the tunnel
by displacing that grid radially:

```glsl
float radius      = max(majorAxis, R_FLOOR);
float tunnelMapped = log(radius / R_FLOOR) * TUNNEL_SCALE;
float mapped      = mix(radius, tunnelMapped, warp) + u_flow * 0.05 * warp;
vec2  displaced   = screen * (mapped / radius);
vec2  fieldGrid   = displaced * GRID_SCALE;
```

The remap is monotonic in `majorAxis`, so it is continuous and invertible and
`floor()` can never cut a tile. Cell size in screen space goes as
`dr / d(mapped)`, so the logarithmic branch shrinks tiles toward the centre and
builds the vanishing point, while at rest the remap is the identity and the field
is a plain flat mosaic. The grid scale is anisotropic so resting tiles read square
on a wide viewport.

Both ends are therefore correct — a genuine flat Cartesian mosaic at a standstill
and a deep tunnel with a dark terminus at speed — and the whole range is one
continuous deformation of the same objects.

`squarePerimeter` is no longer used for the field, so the corner-alignment
quantisation from `1e9f741` is obsolete and has been removed with it.

The corner-alignment quantisation from commit `1e9f741` stays: corners must
continue to land exactly on a tile edge.

## CP5 — Aperture colours

Two separate problems behind the "disco" reading.

1. **Tile identity.** Colour is keyed to `fieldCell`, whose radial component
   includes `u_flow`. A tile travelling outward must keep a constant world index
   as it moves, so its colour never changes while it is on screen. Verify this
   holds after CP4 rather than assuming it: if the visual travel and the flow
   term disagree even slightly, tiles recolour under the eye.
2. **Brightness flicker.** `breath = 0.94 + 0.06 * sin(u_flow * 7.0 + …)`
   modulates every panel's luminance from the same clock. At rest this reads as
   an unmotivated shimmer. Reduce or remove it.

Then add what the user asked for: at a standstill the flat tiles may occasionally
change colour, and that must stop as soon as the vehicle moves.

- a rest-only recolour phase that advances only while speed is effectively zero
  and steps in discrete jumps every few seconds, added into the colour hash;
- above roughly 1 km/h the phase is frozen, so every tile's colour is fixed for
  as long as it is in the scene.

## CP6 — Verification and delivery

- `npm test` and `npm run build` green;
- rendered QA through `qa-field.html` at rest, 1, 40, 90 and 130 km/h, checking
  specifically for tears at intermediate speeds, which is where they appear;
- confirm frame pacing has not regressed;
- show the user the new resting state before deploying;
- deploy and verify canonical HTML, assets, version and cache behaviour.

**Note on the deploy script.** `scripts/deploy_drive_lab_ftp.py` does not
implement `--help` and ignores unknown arguments, so any invocation performs a
real publication. Give it an explicit argument gate before running it again, or
run it only when a publication is actually intended.

## Out of scope for this pass

- the textStep worklet, offline reference render and score selector;
- the Meridian quality pass (glow, wind, particles);
- anything touching Vertigo or the vendored upstream tree.
