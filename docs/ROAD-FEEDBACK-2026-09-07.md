# Evening road feedback — 2026-09-07

## Received evidence

Read Gmail message `1a07cd78a54e89ab`, accepted at 17:08:09 UTC (19:08 local),
from canonical build `20260907-1833`, commit `aecd44e`. Retrieved the complete
RFC2822 message because the connector does not support gzip attachments directly.
Decompressed JSON SHA-256 matches the mail:
`db54c738b35e309c46da19c4ac46b4d83260a4156dfedab634943eafab96e5d9`.

The report has 3,336 numeric GPS observations, maximum 76.0001 km/h, 198 retained
flight samples, and no recorded runtime exception. Engine was selected for the
first approximately 51 seconds; its bank was ready, while shared speed reached
20 km/h. Its sampled RPM, acquisition timestamps and rejection reasons were not
recorded, so the exact in-car Engine failure cannot be established retrospectively.
A standstill watch gap was approximately ten seconds. Nightshift and Soundtrack
were selected later. Frame timing from the 100 ms Engine UI updates must not be
interpreted as continuous WebGL FPS.

## Implemented corrections

- Manual TAMARRO requires ready, unmuted foreground audio but no GPS fix. Actual
  movement cancels the phrase. Upstream engine code and WAVs remain unchanged.
- Engine consumes live watch speed on the same monotonic receive clock as the
  shared road input, avoiding a second provider-clock gate. One-shot position
  refreshes still check acquisition age/replay and cannot poison a current live
  watch on a failed renewal. Speed/accuracy/outlier guards remain. Exact-zero
  live watch evidence is bounded to 12 seconds to bridge the observed stationary
  cadence; it is not renewed by reading a cached snapshot. Lifecycle reset or
  movement cancels blips. Motion transitions now log coordinate-free reason,
  age, accepted speed and clock policy in the existing report.
- NIGHTSHIFT's existing PARK harmony is raised by about 11.6 dB. No rhythm or
  bassline is introduced at rest. Fracture and Junction retain their beds.
- Stats for Nerds is Visual 09 in both catalogues, with its own launch identity
  and no shared Map/Stats tab strip. Random visual selection excludes passenger
  tools. Heading history uses concentric arc bands; more occupied direction time
  fills farther bands, relative to the largest direction in the selected range.
- Atlas combines Wikipedia with named OpenStreetMap point features from already
  loaded OpenFreeMap tiles. It adds no API provider or extra location request.
  Exact tile point coordinates, name/category and source are shown; OSM cards
  link to the map, Wikipedia cards retain the full article. No invented reviews,
  photos, hours or contact information. Coverage depends on tile zoom and data.
- Intro is the first chooser; Splash is its starting transition. Build identity
  comes from the existing build pipeline and is also shown at bottom right.

## POI source assessment

[OpenMapTiles POI schema](https://openmaptiles.org/schema/#poi) includes named
amenities, shops and tourist points. [OpenFreeMap](https://openfreemap.org/quick_start/)
is already the deployed tile provider. Existing
[OpenStreetMap ODbL attribution](https://www.openstreetmap.org/copyright) remains.
The public [Overpass service guidance](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html)
discourages production apps depending on public query instances as their backend;
reuse loaded tiles here. No Google Maps scraping or new commercial Places account.

## Automatic diagnostics status

Not implemented or enabled. The received report explicitly records
`automaticRemoteTelemetry: false` and `transmissionRequiresExplicitGesture: true`.
The approved future plan specifies Standard/Dev, ON within Dev only, at ten-minute
intervals. The owner now remembers fifteen minutes of driving; do not silently
claim that cadence is shipped or activate transmission during development.
No diagnostic email is sent by this work. Future scheduling must reconcile the
interval, driving-time definition, disclosure and visible OFF switch before release.

## Validation boundary

Use tests plus isolated headless Chrome; the Browser plugin is not available.
GPS fixtures, meter readings and real map data verify the integration locally.
No claim of target-Tesla listening, GPU or real-drive acceptance. Raw mail and
screenshots stay in temporary local files rather than public source.

### Local measured evidence

Chrome 773×601: manual no-GPS rev 3,352 RPM, automatic idle peak 1,799 RPM,
60 km/h injected live GPS with a deliberately stale provider timestamp reaches
7,417 RPM. No page exceptions. Intro → Stats, runtime Visual → Stats and a real
loaded-tile OSM Duomo subway card pass; Stats also fits 390×844 with scrolling.
At the final audio facade, unmuted zero-speed RMS measured approximately
0.00360 Fracture, 0.00221 Junction and 0.00731 Nightshift; Nightshift after
45→0 km/h measured 0.01046, with peak below 0.020. These are signal measurements
from the browser, not a calibrated loudness rating or in-car listening test.
