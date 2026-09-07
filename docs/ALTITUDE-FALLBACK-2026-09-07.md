# Stats altitude and terrain fallback — 2026-09-07

## Observed defect and owner decision

The owner reported that the blue GPS altitude trace never appeared, then explicitly
requested approximate map-derived elevation whenever GPS height is missing.
Canonical build 20260907-2243 reproduced the chart defect: finite 120–135 m heights
with vertical accuracy 25 m or null produced no blue stroke in either time range.
The chart had incorrectly reused the <=15 m ascent/descent precision gate.
The received Tesla diagnostics omitted both height fields, so they cannot prove
that the vehicle supplied no altitude.

## Implemented behavior

- Preserve every finite, bounded reported GPS height for the solid blue curve,
  including zero and negative heights. Use a padded local scale and visible
  isolated points. Keep the strict GPS accuracy/hysteresis filter for totals.
- Fall back to dashed terrain elevation from Open-Meteo / Copernicus GLO-90.
  GPS takes precedence. Tooltips identify GPS or MAP; source changes and missing
  observations break the line. Mixed-source compacted bins preserve speed but
  remain height gaps instead of inventing an averaged source.
- A running-session controller owns terrain independently of Atlas mounting.
  Only known horizontal accuracy of 0–250 m and finite geographic coordinates
  qualify. Recheck freshness within 15 seconds; cancel on invalid fixes, return
  of GPS height, source change, hidden/offline state or session destruction.
- Query 0.01-degree rounded cells (approximately 1 km), never precise fixes.
  Keep 128 cells in session memory, one request at a time, at least 30 seconds
  between starts, an eight-second deadline and retries bounded to five minutes.
  Cache/backfill only the matching validated cell. Online/foreground recovery
  resumes the current eligible request; no background execution is promised.
- PDF snapshots optionally retain groundElevationM separately from altitudeM,
  with solid/dashed source distinctions and fixed linked attribution. No terrain
  cell key enters the export. Terrain never contributes to GPS gain/loss.
- Technical diagnostics add only availability/precision/eligibility counts;
  old unspecified evidence remains unknown. They contain no heights or cells.
  Existing Dev/AUTO ON defaults and fifteen observed driving minutes are unchanged.

The API receives the rounded query coordinate and ordinary network metadata; its
privacy policy permits request logging. Session retention does not imply that the
external provider stores nothing. README and the Stats footer disclose the lookup.
The 90 m source raster is distinct from our coarser query grid. GPS ellipsoid height
and terrain elevation are different measurements; no datum conversion or bridge/
tunnel correction is claimed.

## Verification before publication

- Full native suite: 733 passing tests; the deployment identity regression also
  verifies known old/new renderer admission and rejects unknown/vendor changes.
- All 196 lockfile community credits and Git whitespace checks pass.
- Isolated Chrome at 667×375: nine fixtures in Recent hour and Whole session,
  including coarse/unknown precision, missing height, zero/negative height, gaps,
  terrain, GPS return and offline failure. All 18 comparisons pass, no page error.
  A separate same-cell, continuous-observation check confirms source separation.
- FPDF fixtures cover dense dashed paths, source precedence, bounds, optional
  routes and fixed attribution. All mixed/map-only pages were rendered and read.
- Real public Milan fixture 45.46,9.19 returned HTTP 200, elevation 138 m and
  Access-Control-Allow-Origin: *. This is a service check, not a vehicle sample.
- Both mail endpoints were intercepted in browser fixtures; PDF mail tests used
  a fake transport. No synthetic email was sent.

Browser tooling used isolated Playwright because the preferred plugin browser
skill was unavailable. Evidence is in /tmp/sv-altitude-{before,after}.json and
matching captures, /tmp/sv-altitude-source-transition-after.json, and
/tmp/sv-travel-report-map*.pdf. Physical Tesla/iPhone GPS and legibility acceptance
remain separate. Publication evidence will be appended after canonical validation.

## Primary sources

- [W3C Geolocation](https://www.w3.org/TR/geolocation/): nullable altitude and
  altitudeAccuracy, with separate semantics.
- [Open-Meteo elevation API](https://open-meteo.com/en/docs/elevation-api): GLO-90
  source, input/output and CC BY 4.0 attribution.
- [Terms](https://open-meteo.com/en/terms) and [privacy](https://open-meteo.com/en/privacy):
  noncommercial public service limits and provider-side request handling.

## Compiled checkpoint

Source **c6c16c4**, build **20260907-2328**, version from VERSION (0.0.0).
Source is pushed. All 18 built-package checks pass. Repeated production-browser
fixtures at 667×375 pass all nine cases in both time ranges with zero exceptions.
Exact 773×601 Tesla QA retains the 48 px Export/Close targets and readable chart
caption; the lower footer shows linked terrain attribution and query disclosure.
Evidence: /tmp/sv-altitude-compiled.json and /tmp/sv-altitude-compiled-tesla.json.

## Altitude correction publication — 2026-09-07 23:40 Europe/Rome

Canonical **20260907-2328**, source **c6c16c4**, version from VERSION (0.0.0).
[Behavior, source semantics and privacy](ALTITUDE-FALLBACK-2026-09-07.md).

- Official publication verifies **229 files / 254,829,937 bytes**, all **29 Illobo
  recordings**, and two retained cache-overlap assets. Independent official
  postflight passes with **remote_writes=NONE**; root has twelve expected entries.
- **733 native tests**, **18 built-package checks**, **196 dependency credits**
  and **27 canonical HTML/asset/cache checks** pass.
- Nine browser fixtures in both time ranges pass on the compiled and canonical
  build at 667×375; exact 773×601 header, chart, caption and attribution pass.
  Four additional compiled integration cases verify eligibility/backfill,
  invalid-position and restored-height cancellation, and a 6.104-second response.
  No page exceptions or synthetic email. The final browser harness uses native
  keyboard activation to avoid a synthetic-clock pointer/chrome timing race.
- Exactly two fresh real PHP preview requests return the same **27,056-byte**
  mixed GPS/map PDF, SHA-256
  `2df6eafcc1c0a077bac3986283ebbadf21a27f54c07db521eb83a348968165e4`.
  Decoded streams, metadata, resources, annotations and both rendered pages match
  local output. Cross-host compressed bytes differ; repeated canonical bytes do
  not. Fixed attribution, no-store and cookie flags pass. No route or mail action.

Evidence: /tmp/sv-altitude-{preflight,publish,postflight}.log,
/tmp/sv-altitude-canonical/identity.json, /tmp/sv-altitude-live.json,
/tmp/sv-altitude-live-tesla.json, /tmp/sv-terrain-integration.json and
/tmp/sv-altitude-report-live/evidence.json. Physical Tesla/iPhone altitude and
legibility, plus actual automatic diagnostic inbox receipt, remain separate.
