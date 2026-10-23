# Veduta — performance and real-car trial

## Scope and authority

After inspecting the local illustrated view, the owner requested publication
for a real Tesla trial that evening and asked for the best practical frame
rate first. This authorizes an experimental trial despite the recorded open
artistic findings. It does not establish physical performance or final art
acceptance. The horizon composition, three media, GPS dot, resolution and
scenery density are retained.

## Changes

- The camera RAF now requests the public synchronous MapLibre `redraw()`, as
  Atlas already does. This cancels the second deferred map RAF and submits the
  current pose in the camera frame. Idle rendering remains demand-driven.
- Nearby tree exclusions use conservative 64m polygon buckets, followed by the
  original exact geographic containment. A 100,000-entry cap and global
  fallback preserve exclusions if a polygon is too large or cannot be indexed.
  A dense deterministic fixture preserves all placement decisions while using
  fewer than 1/20 of the linear scan's exact predicates. This is algorithmic
  evidence, not a measured claim about total renderer speed.
- Render telemetry keeps actual MapLibre-render timestamps but declares the
  real 60Hz target. The observed interval is no longer passed as its own target,
  which had hidden missed-frame estimates.

## Desktop benchmark

The Browser profiling plugin is unavailable; the in-app browser exposes no
CPU-throttle/profiling capability. The owner's explicit profiling request was
run with the installed Playwright/CDP toolchain in isolated Chrome, leaving the
visible preview open. Only synthetic public-location observations were used;
diagnostic sending was blocked. No dependencies or copied renderer code added.

Environment: Mac Apple M4 Max, Chrome ANGLE Metal, compiled production package,
773 × 601 CSS pixels and drawing buffer, DPR 1, muted audio, 1Hz synthetic GPS
at 18km/h. Each medium/rate has a 10-second moving sample after loading and
style settling. Native CPU and relative 4× CPU slowdown use the same sequence.
Network/tile timing and cache history are not identical; this is one comparison,
not a statistical endurance certification.

The benchmark counts browser refresh timestamps with actual Veduta WebGL draw
submissions, not RAF callbacks alone. It does **not** measure compositor-presented
frames, GPU duration or the Tesla display. CPU profiles/long-task observation
and hooks also add measurement overhead. Raw evidence remains outside the
repository under `Documents/Codex/2026-10-23/veduta-perf/`.

| Medium | CPU slowdown | Before submissions/s | After submissions/s | Before p95 interval | After p95 interval |
| --- | --- | ---: | ---: | ---: | ---: |
| Anime | 1× | 30.5 | 58.1 | 34.0ms | 17.5ms |
| Manga | 1× | 31.1 | 60.0 | 34.0ms | 17.3ms |
| Watercolor | 1× | 30.9 | 59.3 | 34.1ms | 17.6ms |
| Anime | 4× | 28.3 | 55.8 | 35.0ms | 19.3ms |
| Manga | 4× | 28.7 | 57.4 | 35.3ms | 19.0ms |
| Watercolor | 4× | 29.9 | 59.7 | 34.4ms | 18.9ms |

Both runs had no uncaught page errors. The new camera submission path removes
the observed approximately 30Hz cadence ceiling in this environment. Occasional
loading/rebuild stalls remain: after Anime's maximum interval was 132.3ms at
native CPU and 447.8ms at 4×. The corresponding before maxima were 73.1ms and
319.4ms. Manga/Watercolor maxima in the 4× after sample were 36.2/25.4ms.
Therefore this work does not claim that all hitches were removed; the remaining
near-field rebuild bursts warrant evidence from actual travel/new tile loads.
An additional settled, stationary production sample recorded zero WebGL draw
submissions and zero long tasks over eight seconds, with no page error. It
confirms demand-driven idle behavior for that loaded scene.

Chrome explicitly documents that [CPU throttling does not simulate the GPU,
memory bandwidth or thermal behavior](https://developer.chrome.com/blog/devtools-grounded-real-world).
It is a desktop stress test, not Tesla processor emulation. MapLibre's public
[`redraw()`](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#redraw)
boundary is used without private map state or source modifications.

## Release evidence

Source `4969ee2`, package `20261023-1537.4969ee2`, VERSION `0.0.0`.
Full package tests pass 1,143 cases; focused spatial/model/finish/diagnostic
tests pass 50. Package identity passes 839 exact static hashes and matching
VERSION/HTML. Community credits pass 189 exact lockfile entries. Compiled
chrome regression passes 16/16 without baseline changes; text fit passes 14/14.
Canonical publication uploads 43 files / 6,651,338 bytes while reusing 832
static files and all 29 full-hash-verified recordings. Nineteen HTTPS checks
through normal browser fetches match local bytes: bare/cache-busted/reloaded
root, emitted critical chunks/worker/styles, fonts, thumbnail and exact release
manifest. All roots return HTTP200, `no-store` and proxy `MISS`. A standalone
Python client receives403 for the JSON manifest while the actual same-origin
browser fetch receives200 with the exact hash; no hosting policy was changed.
The canonical app loads all three media with synthetic GPS and no page error;
the console retains two AudioContext autoplay warnings in the muted headless
run. The in-app canonical Intro/catalogue has no warning/error. Independent
read-only postflight passes with 13 root entries and `remote_writes=NONE`.
Diagnostic delivery remains blocked in QA. Publication and browser checks do
not establish physical acceptance. See the [release record](DEPLOY.md#veduta-realtime-trial--2026-10-23).

## Physical trial

Select Music → Visual → Veduta, then STYLE for the three media. Keep the
identified build, medium, actual browser/device and test duration with the
owner's observations. Existing coordinate-free reports already retain phase,
canvas size, render-event intervals, long tasks, GPS freshness/accuracy/cadence,
network/visibility and runtime issues. Their render cadence is not a measurement
of display presentation; stationary demand-driven gaps are not travel jank.
Separate sessions per medium make comparisons easier because phase aggregates
currently group all three media. No precise coordinates are added to reports.
