# ATLAS / Stats approved remix — design QA, 2026-09-07

final result: passed

## Selected reference and scope

Owner explicitly selected a remix of Travel Observatory (natural map/POIs and
summary bands), Mission Control (heading/network instruments), and Journey
Magazine (photo place card and synchronized speed/altitude). These are two
separate views. The existing product shell, English UI, 48 px controls and real
provider data remain authoritative. PDF/email is a separate planned capability.
Reference boards are the generated images ending `08be0b93`, `d4dee68a` and
`d817d301` in the current task's generated_images directory.

The Travel Observatory board and current 773 × 601 map/stats/place captures were
opened together in one comparison input. The generated board contains two
stacked screens; comparison uses their respective content regions, not the full
board as a single viewport. Mock route/distance/altitude/POI positions are not
production facts; the browser evidence uses explicitly simulated GPS and real
Wikipedia place responses. No claim of identical geographic content is made.

## Iterations and fixes

- P2: initial map remained too close. Follow now starts at zoom 13.4 and widens
  to 11.9; Area gives a wider overview and manual framing stays selected.
- P2: waking chrome moved persistent controls between pointer down/up. Persistent
  map controls now keep their geometry and execute on the first tap.
- P2: old map/sidebar wasted the field. The sidebar renderer is removed; Stats
  owns the entire passenger sheet and unmounts MapLibre while active.
- P2: lower summary consumed extra rows. Moving-average/terrain detail no longer
  expands the primary grid; network follows the speed bands/elevation/heading row.
- P2: place photo needed an actual load check. Final card capture waits for a
  decoded image; failed thumbnails have the existing Wikipedia icon fallback.

## Final visual and interaction evidence

`/tmp/sv-atlas-interaction/`: map.png, place.png, reader.png, stats-773.png,
stats-system-773.png, stats-1440x900.png, stats-773x440.png, stats-390x844.png,
map-return.png and evidence.json. Final comparison confirms full-width pastel
cartography, source-coordinate markers, compact image-led card, large summary
numbers, paired red/blue timeline, speed bands/elevation/heading and network.
The sheet scrolls vertically on short screens; no horizontal overflow or clipped
primary controls at tested sizes. The source's unimplemented Export PDF button
is deliberately absent, rather than represented as a working capability.

POI → complete Wikipedia iframe → same selected place passes. Area persists
beyond six seconds; Stats unmounts the map and Close restores it. Engine →
report → Stats → Atlas → Engine retains the same running AudioContext; evidence
is in `/tmp/sv-atlas-engine/evidence.json`. No diagnostic email was sent.

P3: physical Tesla readability, touch and GPU acceptance remain a separate
owner check. A short synthetic trace is not an endurance or real-drive test.

## Canonical closeout — 2026-09-07 18:41

Final production **20260907-1833 / aecd44e**. The final map and Stats captures
were opened after the canonical checks. Persistent controls, natural map,
separate statistics hierarchy, source data and no horizontal overflow all pass.
A final P2 dark-appearance contrast issue was fixed with distinct light/dark
red/blue chart inks and themed controls; the corrected dark capture is verified.
Durable current-build map/stats captures and identity/browser JSON are in
`docs/qa/2026-09-07-atlas-stats/`. Full place/photo/reader captures remain in
`/tmp/sv-atlas-live/`; no third-party article photography was bundled as a new
repository asset. 25 canonical byte/cache checks and independent no-write
postflight pass. Final result remains **passed** with physical Tesla P3 acceptance
separate from this browser/release gate.
