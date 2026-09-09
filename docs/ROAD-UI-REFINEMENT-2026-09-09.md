# iPhone, Discover and Atlas refinement — 2026-09-09

## Implemented

- Palette focus dismissal now ignores an unknown focus destination. Safari can blur a focused swatch without focusing the tapped button; the document's existing outside-pointer listener still closes the menu, and known keyboard focus departures/Escape retain dismissal.
- Landscape phone footer cells extend through the bottom safe area. Their content retains inset protection; there is no separate padding strip below the footer. The viewport and session/rotation ownership are unchanged.
- Discover result rows are 72 px instead of 88 px, with 15 px two-line names and 13 px metadata. The capacity model uses the same row height. Each result states Wikipedia, the actual provider of this index; Atlas separately labels its Wikipedia/OpenStreetMap cards.
- Atlas numbered circles are 32 px inside unchanged 48 px targets. Camera controls provide zoom in, reset to speed-based follow framing, zoom out, and independent north-up/heading-up selection. North lock and relative follow zoom last for this mounted map; reset clears relative zoom and restores follow without silently changing orientation preference.
- One frame-time-based camera owner replaces the recurring 1.1-second `easeTo` restarts. Heading/dateline interpolation takes the shortest arc, elapsed time is bounded after execution gaps, and settled cameras stop submitting redundant camera changes. Hidden state skips camera/source work. Road-name and route work remain sampled independently.
- POI positions update with actual map render events through bounded DOM transforms, replacing eight-Hz React list reconstruction. Camera readout publication is limited to five Hz. The public `map.redraw()` draws the new camera in the same frame instead of scheduling a second animation owner. No new map renderer, dependency, or upstream modification.

## Validation and limits

The local Chrome flow uses 773x601 and simulated phone touch at 874x402,
956x440 and 667x375. Palette blue/mint/red selections survive an explicit
null-destination focus departure; all phone footer cells end at the exact viewport
bottom with a simulated 21 px safe area. No overflow or page exceptions.

Atlas north lock reaches zero degrees, zoom changes the actual camera, and reset
returns to the speed-derived zoom. Discover retrieves 15 real Wikipedia results
for a public Milan test coordinate, with verified 72/15/13 px row/title/meta
geometry and working selection. Screenshots remain temporary QA artifacts.

The initially installed Playwright client rejected WebKit 2272 with
`Page.overrideSetting: Unknown setting: PushAPIEnabled`. A temporary, matching
Playwright 1.59.0 client resolved the harness mismatch without changing project
dependencies or downloading a browser. WebKit 2272 then passed all three phone
formats, three palette taps per format, null-destination blur and exact footer
bottom geometry with 21 px simulated safe area, with no page exceptions.
Installed iPhone webapp safe areas/touch and Tesla sustained 60 FPS remain
physical acceptance; desktop rendering measurements are not vehicle GPU evidence.
Automatic diagnostic mail is disabled/intercepted in QA.

### Measured camera/render scheduling correction

At 773x601 in local headless Chrome on this Intel Mac, the same moving Atlas
fixture at simulated 80 km/h with eight heading changes over four seconds
measured 59.76 browser RAF Hz but only 31.62 actual MapLibre render FPS with the
separate queued draw (129 frames, median 33.2 ms). Drawing in the camera frame
through public `redraw()` measured 59.72 MapLibre FPS (245 frames, median 16.7 ms,
95th-percentile 23 ms). These are actual `render` events instrumented only by the
temporary QA harness, not a target-FPS constant. The 31.62 FPS baseline is the first in-session continuous-camera candidate,
not a measurement of the earlier production release. This isolates the scheduling
bottleneck on this host; it does not guarantee vehicle GPU/endurance performance.

## Radar preparation, inactive

The owner requested study of sibling Meguru. Its `docs/research/radar.md` and
`docs/research/live-traffic.md` describe the ADSB.lol point API and explicit data
age/unknown telemetry handling. No Meguru or other upstream code/assets copied.
An original, unregistered radar model now validates geographic queries, rounds
the request centre to two decimals, limits range to 50 NM, normalizes at most 32
nearest aircraft, deduplicates hex identities, rejects malformed/expired/future
snapshots, and preserves unknown track, altitude and speed. Its four unit tests
pass. No request, background timer, renderer, catalogue entry or diagnostic field
is enabled; the module is not imported into the shipped runtime.

Exactly three directions were presented to the owner:
A. Air Atlas — reuse the map with aircraft and a tapped detail card (recommended).
B. Radar Scope — circular range field without a map.
C. Sky Split — map and flight list side by side.
Selection is pending. Once selected, add one lazy field, bounded 5–10 second
polling, one request at a time, bounded body/timeouts/backoff and Retry-After,
online/foreground recovery, explicit provider/observation age and geographic
request disclosure. Never invent continued flight after data stops. Keep the
feed outside static asset caches and automatic technical diagnostics. Verify
CORS/coverage, source attribution and GPU cost before publication. Aircraft
detail/enrichment and worldwide following are separate scope.

## Primary research

- [MDN button focus behavior](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button).
- [MapLibre camera animation](https://maplibre.org/maplibre-gl-js/docs/examples/animate-map-camera-around-a-point/).
- [ADSB.lol API](https://www.adsb.lol/docs/open-data/api/): public API, data ODbL 1.0. Software licensing and data attribution are distinct. Provider documentation was verified in this session; no live aircraft query was made.

## Verified source and build

Source `71ad14e`, build `20260909-2155`, VERSION `0.0.0`. All 826 native tests
(including real PHP), 182 static release SHA-256 identities and 196 exact
community dependency credits pass. Build uses lockfile Vite 6.4.3, PostCSS
8.5.26, Rollup 4.62.2 and esbuild 0.25.12 through the existing native wrapper;
the two stale Dropbox development packages were not rewritten. The existing
large-chunk advisory remains. Publication follows compiled-browser validation.

## Canonical publication — 2026-09-09 evening

Build **20260909-2155**, source **71ad14e**, is verified at
https://sedicivalvole.app/. Official publication verified **235 files /
254,944,380 bytes**, all **29 Illobo recordings** by full hash, and retained two
preceding assets with `ROOT_UPLOAD_ONLY`. Independent read-only postflight passes.

All **19 canonical HTTPS checks** pass: bare and cache-busted HTML identify the
same release with no-store, and every current root JS/CSS chunk, worker and
release manifest matches local bytes. Python's default request received 403 for
the JSON manifest; normal browser User-Agent/Referer receives 200 with identical
bytes for both current and prior manifests. No server configuration was changed.

Compiled and canonical Chrome verify Atlas north-up, zoom in/out and reset, and
phone palette selection plus footer geometry. Canonical WebKit 2272 / Playwright
1.59.0 also verifies phone palette taps and safe-area footer geometry. Final
WebKit console is empty. One earlier WebKit attempt reported an unidentified
transient resource 503; it did not recur in the instrumented repeat. Chrome logs
existing autoplay warnings in Visuals-only launch and an existing MapLibre
missing numeric-property warning; there are no page exceptions, blank screens or
framework overlays. This checkpoint does not claim those existing warnings fixed.

Temporary screenshots: `/tmp/sedicivalvole-live-atlas.png`,
`/tmp/sedicivalvole-live-phone.png`, and
`/tmp/sedicivalvole-live-webkit-phone.png`. No diagnostic QA email was sent.
The inactive radar endpoint is absent from all compiled JS chunks.

Next: owner checks installed iPhone landscape palette/footer and Tesla map
smoothness while turning; select Air Atlas / Radar Scope / Sky Split before
constructing the new radar visual. No fresh deployment approval is needed.
