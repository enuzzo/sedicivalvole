# Atlas, Air Atlas and Fly With — symbol placement cost

## Scope

Follow-up to [Veduta frame pacing](VEDUTA-PERFORMANCE-2026-10-24.md). Atlas
(`atlas-place-labels`), Air Atlas and Fly With (`radar-airports`, plus place
labels when LABELS is on and always in Fly With) combine symbol layers with
`fadeDuration: 0`. In pinned MapLibre 6.7 that forces a full symbol placement on
every frame. The task was to measure whether that cost is real and change it
only if so, keeping the look. Everything below is desktop evidence; physical
Tesla acceptance stays with the owner.

## Result

The cost is real but much smaller than Veduta's: placement took 11–15% of
main-thread time in Atlas and Fly With and about 6% in Air Atlas (Veduta: 42%,
because every lamp was projected against terrain). The labels here collide, so
any non-zero `fadeDuration` also makes them fade in and out over that duration.

All three maps now use `fadeDuration: 100`. Placement runs at most ten times per
second, and a label that appears or disappears fades over about six frames
instead of swapping instantly. Settled maps are unchanged. The report map keeps
`fadeDuration: 0`: it is static and its capture needs every label on the first
frame.

## Measurements

Environment: Mac Apple M4 Max, headless Chrome (ANGLE Metal), Vite dev server,
773 × 601 CSS px at DPR 1.25, muted, 10× CPU throttle, 15s samples, CPU profile
sampled every 0.5ms. Atlas and Air Atlas run on `qa-veduta.html` synthetic GPS
(Lugano, 12 or 28 m/s); Fly With runs on `qa/air-atlas-quality.html` with the
synthetic aircraft moving at 350 kt so the camera follows new observations.
"Placement" is the share of non-idle profile samples under `_updatePlacement`.
Throwaway CDP scripts, Chrome closed through `Browser.close`, profiles removed.

| Sample | Placement at 0 | at 300 | at 100 | Submissions/s at 0 | at 300 | at 100 |
| --- | --- | ---: | --- | --- | ---: | --- |
| Atlas 28 m/s | 11.2, 10.9% | 2.6% | 4.0, 4.3% | 43.3, 40.1 | 45.3 | 42.1, 46.0 |
| Atlas 12 m/s | 12.9, 15.4% | 3.6% | 5.1, 5.5% | 36.4, 57.6 | 57.6 | 55.0, 53.7 |
| Air Atlas 28 m/s | 5.6, 6.4% | 2.1% | 2.8, 2.5% | 13.1, 16.8 | 21.3 | 18.2, 18.9 |
| Fly With | 13.8, 14.0% | 4.3% | 6.2, 6.0% | 32.6, 44.5 | 46.8 | 45.3, 44.7 |

Placement share falls by about 60% at 100ms and repeats closely between runs.
Submission rates do not: two runs of the same build differ by up to 21 frames/s
(Atlas 12 m/s), so these samples cannot show a frame-rate gain. Air Atlas only
renders while its camera eases after each GPS update, so its rate is not a
pacing measure. The rest of the frame is MapLibre rendering (terrain in Fly
With), React rendering and Atlas's own place-marker projection, unchanged here.

At 6× throttle and before the change, Atlas at 28 m/s already held 59 frames/s
and Fly With 60. These maps were not choppy in the way Veduta was.

## Look

Moving screenshots at 773 × 601 before and after show Atlas place labels and
Air Atlas placed in the same way; they were taken at different moments of the
journey and were not pixel-compared. By construction a settled map is identical;
the difference is the 100ms fade when a label enters, leaves or loses a
collision. 300ms (MapLibre's default, as in Veduta) saves a little more
placement time but turns that into a clearly visible fade; 100ms was chosen to
keep the near-instant label behaviour.

## Not changed

- Air Atlas's own `animate` loop (aircraft markers) is its largest single
  JavaScript cost in these profiles, 7–22% self time. It is not related to
  symbol placement.
- Atlas's `project` in `atlas-places.jsx` (numbered place discs) takes 6–9%
  self time while following.
