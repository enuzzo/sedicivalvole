# ATLAS, Stats for Nerds and session reports

September 7 night precedence: the owner selected Travel Report direction 1.
PDF preview/download and verified-recipient email are now implemented and
locally verified; see [implementation and publication status](NIGHT-IMPLEMENTATION-2026-09-07.md).
Earlier design-only labels below preserve the preceding checkpoint.

Status: owner-selected remix implemented and canonically verified, build 20260907-1833 / source aecd44e.
PDF generation and recipient-email delivery remain design work, not shipped features.

## Three compositions presented

1. **Travel Observatory — recommended.** A generous natural map with a compact
   location/nearby-place strip. A separate full-screen stats page with a dominant
   synchronized speed/elevation timeline, large trip totals, heading rose and
   speed-duration bands. Select a time to inspect the measurements together.
2. **Mission Control.** A quieter map and a dense instrument page with aligned
   GPS, audio, frame pacing and network timelines. Best for technical inspection;
   more labels and smaller individual charts than option 1.
3. **Journey Magazine.** Places and journey outline anchor a travel narrative;
   large distance/time values and editorial chart plates translate directly into
   report pages. Less emphasis on simultaneous live instruments than option 1.

Owner response — 2026-09-07: **approved remix; proceed**. ATLAS and Stats are
separate views. Use Travel Observatory's map and POIs; Journey Magazine's compact
photo/place card opens a full Wikipedia reader over the same map. Stats combines
Travel Observatory's headline values, speed bands and elevation totals with
Mission Control's heading/network instruments and Journey Magazine's synchronized
speed/altitude chart. The owner's incidental "Discover" in the graph paragraph
is interpreted as Stats; Discover remains the independent place library.

All three retain natural pastel and product-palette map modes, deliberate access
from either Engine or Music, verified Discover coordinates, a separate stats
surface and an on-demand branded PDF. The choice determines hierarchy, not which
measurements are available. The owner is not being asked to redesign the controls
already specified for the support header.

## Verified starting point

- `atlas-field.jsx` currently combines MapLibre and `AtlasDriveLabCanvas` inside
  the map's collapsible panel. The standard appearance already exists but its
  `ATLAS_STANDARD_MAP_COLORS` are dark; adding another identical switch would
  not satisfy the requested natural-light map.
- `App.jsx` owns `atlasSessionJourneyRef` across environment changes. It stores
  recent/session samples and bounded travel points; it is not persistent storage.
- Existing bounds: 2 s journey sampling, 1800 recent samples, 720 reduced session
  samples and 4096 route points. Simplification preserves route endpoints but
  these reduced arrays must not become the authoritative source for exact totals.
- Current samples contain speed, heading and optional GPS altitude. GPS accuracy
  exists at the location boundary but is not carried through every chart sample.
  Terrain elevation is fetched separately and is not GPS altitude.
- Discover already normalizes Wikipedia pages with coordinates. Its request and
  selection state lives inside its panel and should be extracted into a reusable
  bounded query layer instead of starting another per-frame lookup in ATLAS.
- The diagnostic PHP endpoint packages a gzip JSON attachment for a configured
  recipient using the existing mail transport. It does not accept arbitrary
  recipients or PDF files. Do not silently repurpose this endpoint as a public
  arbitrary-attachment mail relay.

## ATLAS implementation sequence

1. Separate map and stats presentation while keeping one session owner. Mount
   only the active renderer. Preserve current metric parity before retiring the
   sidebar charts; retain a small persistent Map / Stats switch.
2. Replace the current dark standard colors with **Natural**: pale warm land,
   muted green parks/forests, blue water, neutral buildings, white local roads,
   restrained amber major roads and dark labels with light halos. Keep **Palette**
   as a deliberate alternative. Natural should be the first-use map appearance;
   preserve an explicit saved palette choice.
3. Start wider and flatter: prototype roughly zoom 14.5 at rest and 12.8 on faster
   roads, pitch 0–25 degrees. Tune against real tiles at 773 × 601, not arbitrary
   screenshots. Add Follow / Area / Trip framing: Area shows nearby context;
   Trip fits the observed route with padded bounds and a maximum zoom. A manual
   overview must remain selected until Follow is requested rather than snapping
   back after the old six-second camera timer.
4. Show a bounded set of nearby/ahead Discover places with their actual supplied
   coordinates; cluster at wide zoom, open a compact place card on selection,
   and provide the existing Discover article path. No inferred article positions.
   Requery on meaningful distance/time changes with cancellation, expiry and
   bounded backoff, not camera animation frames. Coordinates go only to the
   already documented map/Discover providers when that feature is used.
5. Keep attribution readable at the bottom, control targets at least 48 px,
   and retain reduced-motion, context-loss and offline states. Separate GPS-unavailable
   and explicit demo states from real travel. No turn-by-turn or road-limit claim.

## Stats for Nerds data and visual contract

- **Journey:** observed distance, elapsed time, moving/stopped time, average moving
  speed, observed peak and number/duration of stops. Show the observation coverage.
- **Motion:** synchronized speed/elevation tracks, speed-band duration, heading
  rose and changes in speed. Derived acceleration is a GPS estimate, never a CAN
  measurement. Reject noisy/out-of-order samples and break traces across gaps.
- **Landscape:** GPS altitude and terrain elevation separately named. Only report
  ascent/descent after accuracy filtering and a tested hysteresis threshold;
  otherwise show unavailable rather than a plausible noisy total.
- **System:** frame rate/p95 frame time, long tasks, audio state and mode changes,
  retries and observed resource traffic. Browser-visible transfer excludes opaque,
  cached or unobservable bytes; it is not a vehicle data-plan total.
- **Engine:** simulated RPM, gear and load explicitly identified as simulated.
  Preserve dry sound and the existing upstream engine runtime.
- Keep charts bounded and refresh visible readouts at a low cadence. Stream exact
  scalar accumulators before sample compaction; preserve start/end, extrema and
  time buckets in chart reduction. No background WebGL renderer for a hidden map.
- Tests must cover stationary noise, GPS dropout, browser minimization, midnight,
  antimeridian route bounds, multi-hour compaction, missing altitude, source changes
  and an entirely empty session. A gap is unknown time, not a flat speed segment.

## PDF and email design

The user-facing flow is **Export session → Preview PDF → Download or Send email**.
The export snapshots one immutable session revision so all pages agree even if
new GPS samples arrive while the report is being built.

- Four adaptable report plates: (1) logo, session date, source/coverage and headline
  totals; (2) motion/elevation timeline and speed distribution; (3) optional route
  outline/places and heading; (4) system/audio appendix. Collapse empty plates and
  label missing data. Use vector text and chart paths, embedded local type and the
  transparent mark; avoid a screenshot of the dashboard or external image fetches.
- Generate only on demand in a lazy module/worker. Candidate: jsPDF, subject to
  dependency/license inventory before admission. No library added in this plan.
  Retain an immediately usable local PDF download if mail or connectivity fails.
- Default report contains statistics, without precise route coordinates. An
  explicit Include route switch adds the route/places to the preview and attachment.
  Its choice must be visible before sending. Do not add coordinates to technical
  diagnostics or automatic debug packages.
- Recipient is an editable email field persisted under a dedicated versioned local
  preference, cleared by Reset Saved State. No report, PDF or route is persisted
  just because the address is remembered. Handle blocked/full storage gracefully.
- A separate same-origin report endpoint must validate the recipient, fixed report
  schema, size and origin; generate or accept only a validated product report,
  never arbitrary attachments/HTML. Add aggregate and per-recipient rate limits,
  bounded request sizes and an idempotency key per explicit send. Before exposing
  chosen-recipient delivery publicly, require recipient verification or another
  proven abuse control; CORS/Origin alone is not protection against a mail relay.
- Keep the existing configured sender; user input must never become a raw header.
  Do not change the diagnostics destination. Retain only the minimum temporary
  delivery/idempotency data with expiry, not a permanent trip archive.
- States: Preparing / Ready / Sending / Accepted by mail transport / Failed.
  Transport acceptance is not proof of inbox receipt. Automatic retries reuse
  the same idempotency key and stop on rejection, cancellation or bounded timeout.
  Network failure keeps the preview/download available and offers retry.
- Verification: PDF page render and text extraction, clipped-chart/font checks,
  snapshot parity, zero/long sessions, local recipient reset, mocked delivery,
  duplicate-send/invalid-input tests. A real email test requires the owner's
  chosen destination and explicit send request; no email is sent during this plan.

## Sources checked on 2026-09-07

- [OpenFreeMap quick start](https://openfreemap.org/quick_start/): existing hosted
  cartography options and MapLibre integration; use as a natural-map reference,
  not a claim to use Google/Apple data or styles.
- [MapLibre bounds and padding](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/PaddingOptions/):
  route/area fitting can reserve real space for controls without cropping content.
- [jsPDF repository](https://github.com/parallax/jsPDF): browser-side PDF generation
  candidate. Verify the pinned version and exact transitive inventory at admission.
- Existing source: `App.jsx`, `environments/atlas/atlas-field.jsx`,
  `environments/atlas/atlas-model.js`, `public/api/send-diagnostic.php`.

## Acceptance and handoff

The remix is selected. Verify map and stats with real browser captures at Tesla 773 × 601,
wide Mac and short-window sizes. Physical Tesla frame pacing/readability and real
mail receipt remain separate acceptance layers. No three-direction gate is waived
by this architecture plan, and no pending feature is described as live.


## Rendered starting point

Current build captured at 773 × 601 with explicit Milan demo, zero speed and
standard map appearance: `/tmp/sv-atlas-baseline/current-standard.png`.
The map occupies about 59% of the field while the statistics panel occupies the
remaining 41%; the chart stack needs vertical scrolling. Standard colors are
brown/charcoal despite the surrounding light shell. The camera is close and
pitched, emphasizing nearby extruded buildings over travel context. This supports
moving charts out, widening the frame and introducing genuinely light land/water
colors. Demo capture is reference evidence, not a new design or real journey.

## Implemented architecture — selected remix

- `atlas-field.jsx` owns only the active map, map framing, place overlays and
  coarse terrain lookup. The old 320 px chart sidebar and Canvas instrument
  are removed. Natural (existing stored `standard` key) is first-use/reset;
  explicit saved Palette remains respected. Follow uses zoom 13.4–11.9 and
  pitch 15–25; Area and Trip retain their framing until Follow is requested.
- `atlas-places.jsx` reuses Discover's Wikipedia query builder and normalizer.
  Up to 12 source-coordinate places are retained, at most eight non-overlapping
  48 px markers are drawn. Screen collisions are suppressed rather than
  inventing cluster coordinates. Queries are separated by at least a minute,
  refreshed after meaningful travel or expiry, aborted on unmount, timed out
  at 15 seconds and retried with capped backoff. The card links the complete
  localized Wikipedia article through the same sandbox/URL builder as Discover.
- `stats-panel.jsx` is lazy, full-screen and independently reachable from Atlas
  and Session report in Music/Engine. Opening it unmounts the visual renderer;
  audio/session ownership stays in App. The map can also open over Engine without
  changing its audio mode. Recent-hour and averaged whole-session traces are
  separate from full-session scalar totals. Gaps remain explicit.
- `session-stats.js` streams distance estimated from accepted GPS speeds, duration,
  movement/stops, speed-band time, heading time, peak and filtered elevation
  before chart compaction. Only fixes with horizontal accuracy at most 50 m enter
  totals; altitude requires accuracy at most 15 m and hysteresis of at least 4 m.
  Unknown time is excluded from moving/stopped shares. Session storage/reset and
  diagnostics keep the existing privacy boundary: no journey is added to mail.
- Network traces show observed application download/upload KB/s; opaque and cache
  traffic is excluded. Frame rate/p95 and audio state reuse existing diagnostics.
  Terrain is explicitly the last coarse Open-Meteo/Copernicus observation, not GPS
  altitude. Source coverage and stale/unavailable values stay visible.
- No new dependency, generated geographic image, external message, PDF endpoint
  or arbitrary-recipient mail capability is introduced in this checkpoint.

## Publication evidence — 2026-09-07 18:41

661 native tests, 17 package checks, 196 dependency credits and 25 canonical
byte/cache checks pass. Full reader/card/back and separate Stats navigation pass
in canonical Chrome at 773×601, 1440×900, 773×440 and 390×844. Engine retains the
same running AudioContext through Stats/Atlas; light/dark colors are verified.
See [DEPLOY](DEPLOY.md) and [current evidence](qa/2026-09-07-atlas-stats/).
This does not close physical Tesla, long real-drive or future PDF/email gates.
