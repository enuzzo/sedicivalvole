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

## Loading follow-up — source a1316d9

The owner subsequently requested lower new-area stalls without reducing visual
quality. The original 447.8ms Anime/4× event contains about 433ms of synchronous
scenery construction: terrain lookups, lazy vector decoding and merged edge
construction dominate it. The change now prepares scenery in finite cooperative
slices outside the draw callback, targeting 3ms of CPU work per slice. An idle
callback timeout still makes bounded progress; an outstanding worker promise
suspends the queue without polling.

The original pinned Three `computeVertexNormals` and merged
`EdgesGeometry(..., 25)` run in one owned CPU worker with transferable arrays.
The candidate captures its centre/origin/scale/medium. The previous complete
scenery remains active until the new group and geographic origin commit
together. The same commit switches native paints, finish and marker medium.
Tile arrivals coalesce a follow-up revision; hard medium/180m-centre changes,
hide and removal cancel and dispose private work and terminate its worker.
Unchanged markers/materials are reused.

A first sliced run exposed a separate 262ms native `getParameter` call in the
terminal finish. CPU sampling identifies the synchronous GL query but cannot
prove the GPU/driver cause or distinguish the queried enum. The finish now uses
public drawing-buffer dimensions and explicit main-framebuffer bindings. The
pinned MapLibre custom-layer owner invalidates and restores native GL state
after the callback; our pass releases its bindings and leaves scissor disabled.
It no longer queries GL state per frame. No private runtime fields are accessed.
The pinned owner contract has a source test.

Quality gates retain the same geometry, density/caps, exact terrain lookups,
shader, 13 texture samples, patterns, resolution and GPS marker. An independent
in-memory extraction of the original synchronous builder at `4969ee2` matches
the new fixture byte for byte in all three media: geometry attributes/index,
merged edges and all instance transforms/colours/counts. The fixture contains
932 trees / 2,796 canopy lobes and includes polygon holes and road exclusions.
The committed goldens, worker-equivalence, queue budget, timeout progress,
cancellation, late reply, worker-failure and partial-instance disposal tests
pass. The complete suite passes 1,152 tests. Production package
`20261023-1648.a1316d9` passes 840 exact static hashes; compiled chrome remains
16/16 with unchanged baselines and text fit remains 14/14. Screenshots of all
three media retain their prior illustrated treatment; the open artistic
findings remain separate.

The final identified package repeats the same six 10-second moving samples,
with the same desktop/display/GPS setup described above. Timed observations end
before screenshots. Worker start/reply records confirm completed geometry
bakes during travel; full raw profiles and screenshots remain in
`Documents/Codex/2026-10-23/veduta-perf/production-loading*`.

| Medium | Main CPU slowdown | Submissions/s | p95 interval | Maximum interval | Observed long tasks |
| --- | ---: | ---: | ---: | ---: | ---: |
| Anime | 1× | 59.7 | 17.5ms | 74.0ms | 0 |
| Manga | 1× | 59.7 | 17.5ms | 87.1ms | 0 |
| Watercolor | 1× | 59.9 | 17.5ms | 34.2ms | 0 |
| Anime | 4× | 59.7 | 18.3ms | 32.2ms | 0 |
| Manga | 4× | 59.4 | 17.9ms | 97.8ms | 0 |
| Watercolor | 4× | 59.7 | 17.8ms | 22.9ms | 0 |

An immediately preceding post-query-removal run observed a 69.4ms Anime/4×
maximum and a 94.2ms largest interval across the three 4× media, including one
59ms task outside the scenery builder/renderer. The final package's largest
4× interval is 97.8ms, versus the previous release's 447.8ms. This is about a
78% reduction in those observed worst intervals, not a statistical future
bound. Cache/network/browser scheduling differ between runs. A cadence gap
without a long task does not prove the main JavaScript thread was blocked.
The same settled stationary check records zero draws and zero long tasks in
eight seconds. CPU throttling does not model the Tesla GPU, memory, thermal
limits or all worker execution; the physical vehicle trial remains necessary.

### Longer travel check and remaining gaps

A 150-second northbound synthetic journey at 54km/h covers over 2km and crosses
the 2km origin-rebase boundary. At 4× main-thread CPU slowdown, source a1316d9
completes 20 worker bakes, reports no page error, averages 58.8 submissions/s
and has a 16.7ms median / 18.5ms p95. It records 12 long tasks with a 96ms
maximum, compared with 38 tasks / 626ms maximum and 55.8 submissions/s in the
same longer scenario on the prior canonical release 4969ee2.

The longer candidate run also contains a **758.4ms submission gap**; therefore
the short-sample ~98ms maximum is not a bound for travel. Sampling finds no
MapLibre render for about 752ms there: the interval contains idle time plus
React/audio/freshness work, not one 750ms scenery task. GPS/admission timing was
not synchronized in this capture, so its cause remains unresolved. This is a
separate limitation from the shorter scenery CPU tasks and prevents claiming
complete hitch removal. The old release's maximum longer-run interval is
626.9ms. Neither trace establishes physical presented performance.

The longer trace additionally exposes first-draw bounding-sphere calculation.
A follow-up moves the unchanged pinned Three merged-mesh and edge bounds into
the same geometry worker. Tests compare their centres/radii exactly with the
synchronous calculation; no culling bounds are approximated or disabled.

### Final bounds build — 92cd1d7

The final package is **20261023-1706.92cd1d7**, VERSION `0.0.0`, with 1,152
passing tests, 840 exact static hashes, 16/16 unchanged compiled chrome
baselines, 14/14 text-fit states and 189 exact dependency credits. The final
build/test tools use bundled ARM64 Node 24.19.0: Homebrew Node 26.11.0 became
unlaunchable during this session because `libsimdutf.36.dylib` was missing.
No dependency or lockfile reconstruction was needed.

The same 150-second, 54km/h, >2km, CPU4× travel check is repeated on the final
bounds build, with raw frame/GPS-fix/RAF/long-task timestamps retained outside
the repository (`final-journey*` versus `previous-journey*`).

| Longer travel metric | Prior canonical 4969ee2 | Final 92cd1d7 |
| --- | ---: | ---: |
| Draw submissions/s | 55.8 | 59.5 |
| Median interval | 16.7ms | 16.7ms |
| p95 interval | 18.3ms | 18.4ms |
| Maximum submission gap | 626.9ms | 164.5ms |
| Long tasks above 50ms | 38 | 5 |
| Maximum long task | 626ms | 110ms |

Both runs report no uncaught page error. The final run completes 20 geometry
bakes. The observed maximum long task is about 82% shorter and the largest
submission gap about 74% shorter in this comparison. This does not establish
that every loading stall is gone. In particular, the intermediate 758.4ms gap
described above did not recur in the final run and remains an unresolved
outlier rather than an explained/fixed event. These are short desktop stress
observations and physical Tesla acceptance remains open.

Raw synchronized timing confirms 46 → 12 submission intervals above 50ms and
10,120 → 405ms of summed observed long-task durations. The final 164.5ms gap
includes a 150ms RAF gap and no overlapping long task; the aligned profile is
mostly idle, with about 5ms of camera/map work and 1.5ms of scenery work. Its
enclosing synthetic GPS-fix interval is a normal 1,018ms. The second-largest
143.3ms gap includes React DOM work. The final largest CPU tasks follow native
terrain/matrix/uniform paths. These observations do not identify a single
remaining scenery-build bottleneck or prove a GPS-admission fault. The final
main-thread profile contains no merged building/edge bounding-sphere path and
samples no `getParameter`, versus about 5.44 seconds attributed to it across
the prior 150-second profile. Remaining instanced bounds total about 9.6ms in
the final profile. No further geometry/culling approximation was introduced.

### Final publication

Canonical **20261023-1706.92cd1d7** is active. The official preserve-existing
publisher uploads 43 files / 6,724,841 bytes, reuses 833 static files and all
29 full-hash-verified recordings, retains one previous asset and reports
`ROOT_UPLOAD_ONLY`. Twenty actual-browser HTTPS byte/hash/cache checks pass,
including the geometry worker; bare, cache-busted and controlled-reload roots
are HTTP200, byte-identical, no-store/no-cache and proxy MISS. Anime, Manga and
Watercolor render publicly at 773 × 601 with synthetic GPS and no page error.
All three canonical screenshots were visually inspected. The two muted
headless AudioContext autoplay warnings remain recorded; public in-app
Intro/catalogue console is clean. QA diagnostic sending is blocked. Rollback
`pre-veduta-loading-20261023` points to prior live `4969ee2`. Independent
read-only postflight passes with 13 root entries and `remote_writes=NONE`. See the [release record](DEPLOY.md#veduta-loading-follow-up--2026-10-23).
