# Veduta — frame pacing after the Lanterne release

## Scope

The owner reported that live build `20261024-1349.c145da1` (Lanterne night
landscape, DARK appearance) looks right on the Tesla but is choppy. The task was
to diagnose and reduce per-frame cost without changing the selected look, then
publish if verified. Physical Tesla acceptance stays with the owner; everything
below is desktop evidence.

## Cause

The Lanterne release introduced Veduta's first `symbol` layers: the street-lamp
pools and heads (`veduta-lamp-pools`, `veduta-lamp-heads`). They are present by
day too, at zero opacity, so the medium switch stays a paint change. The map was
created with `fadeDuration: 0`, copied from Atlas before Veduta had symbols. In
pinned MapLibre 6.7 that value forces a **full symbol placement on every frame**
(`style.ts`: `forceFullPlacement ||= … || fadeDuration === 0`). Each placement
projects every lamp's collision box against the terrain (`_projectCollisionBox`,
`getElevation`, `sampleBilinear`) even though the lamps allow overlap and ignore
placement. A CPU profile of a moving camera at 10× throttle attributed 42% of
main-thread time to `_updatePlacement`, by day and by night.

Separately, the pools were `map`-rotated and line-placed. That makes MapLibre
re-project every pool along its line on the CPU each frame (`updateLineLabels`).

## Changes

- `fadeDuration: 300` (the MapLibre default). Placement now runs at most every
  300ms in budgeted slices. Lamps on newly loaded tiles fade in over 300ms
  instead of popping; lamps already visible are unaffected.
- Lamp pools use `icon-rotation-alignment: viewport` and keep
  `icon-pitch-alignment: map`. Both lamp images are radially symmetric, so the
  rendered pools are unchanged while the per-frame line re-projection stops.
- The finish evaluates its three-octave paper wash only for Anime and
  Watercolor; Manga never used it. Output is bit-identical.

No public API boundary changed and no private map state is accessed at runtime.
A test pins the MapLibre placement rule and the field's non-zero fade.

## Measurements

Environment: Mac Apple M4 Max, headless Chrome (ANGLE Metal), Vite dev server,
`qa-veduta.html` synthetic GPS, 773 × 601 CSS px at DPR 1.25 (966 × 751 canvas),
muted. Throwaway CDP scripts count RAF ticks that submitted WebGL draws (not
compositor presentation), long tasks and the main-thread span between the first
and last draw call of a frame. Chrome closed through `Browser.close`; profiles
removed.

### Journeys at 6× CPU throttle, 15s moving samples

Old configuration (fadeDuration 0, map-rotated pools) against the new one, same
source otherwise. "Missed" counts submission intervals over 20ms.

| Sample | Before submissions/s | After | Before p95 / max | After p95 / max | Before missed | After missed |
| --- | ---: | ---: | --- | --- | ---: | ---: |
| Anime day 15 m/s | 37.6 | 59.9 | 33.4 / 50.1ms | 16.7 / 33.4ms | 314 | 3 |
| Anime night 15 m/s | 33.1 | 59.9 | 49.9 / 66.7ms | 16.8 / 33.3ms | 374 | 2 |
| Anime day 28 m/s | 44.4 | 59.7 | 33.4 / 50.1ms | 16.7 / 33.4ms | 208 | 6 |
| Anime night 28 m/s | 40.9 | 56.2 | 50.0 / 66.7ms | 33.3 / 50.0ms | 241 | 56 |
| Watercolor night 28 m/s | 37.9 | 57.3 | 50.0 / 66.7ms | 16.8 / 33.4ms | 236 | 41 |
| Manga night 28 m/s | 42.4 | 58.4 | 50.0 / 50.1ms | 16.8 / 50.0ms | 221 | 24 |

Median submission interval is 16.7ms in every "after" sample (33.3ms for both
15 m/s "before" samples). One 52ms long task occurred in the Anime night 28 m/s
"after" run; none elsewhere. At 4× throttle the old configuration still held
about 58–60 submissions/s on this Mac, so the fault only shows once the CPU is
slow enough, as on the car.

### Fixed scene, moving camera, 10× CPU throttle

Parked, settled scene; the camera alternates bearing by ±0.02° every frame so
MapLibre treats it as moving over the same tiles. Milliseconds per rendered
frame (two repeats where shown):

| Configuration | Anime night | Anime day |
| --- | --- | --- |
| Old (fadeDuration 0) | 57.8, 49.7 | 52.4, 48.4 |
| Lamp layers hidden | 9.9 | 9.5 |
| fadeDuration 300 | 16.7, 15.5 | 10.0, 10.4 |
| fadeDuration 300 + viewport pools | 15.1, 13.1 | — |

After the change no single JavaScript function dominates the profile; placement
falls to about 9% of samples.

### Parked and look

Parked (settled, no GPS movement) samples still submit zero frames and record no
long task in all six media. Parked screenshots at 773 × 601 are pixel-identical
between two runs of the old build. Against the new build, every day medium is
identical. Night media differ on at most 1.3% of pixels, almost all by 1–4/255;
at most 179 pixels per image (0.03%) exceed 4/255, with a maximum of 13/255. These are
the soft edges of the resampled lamp pools; mean absolute difference is 0.01/255.

## GPU observations, not changed

`gl.finish()` timing reports no usable GPU duration in Chrome. A SwiftShader
(software Vulkan) run was used only as a rough weak-GPU proxy: moving samples
there are dominated by tile loading and too noisy for before/after claims. On
the fixed scene it attributes about 60 of roughly 100ms per frame to terrain.
MapLibre redraws a 128 × 128 mesh for each of 13–19 terrain tiles in a depth
pass and a colour pass whenever the camera moves. While driving at 28 m/s, about
every 2–3 seconds one frame also re-renders 4–7 draped tiles into
1024 × 1024 textures (terrain `qualityFactor` 2). Mesh size and texture quality
are internal to pinned MapLibre and were left alone. The finish, Three scenery
and native extrusions each sit within that proxy's noise. SwiftShader
over-weights vertex work, so these shares are not Tesla GPU numbers.

## Remaining and follow-ups

- A real parked car still redraws for about a second after each GPS sample while
  the camera eases toward fix jitter. This is cost, not choppiness, and was left
  unchanged.
- Atlas (`atlas-place-labels`) and Air Atlas (`radar-airports`) also combine
  symbol layers with `fadeDuration: 0`. They were not measured here.
- Physical Tesla evidence: identify build, medium, DARK/LIGHT and speed with the
  owner's observation; coordinate-free diagnostics already carry render-event
  intervals and long tasks.
