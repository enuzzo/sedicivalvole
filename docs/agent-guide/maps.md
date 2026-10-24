# Geographic and passenger contracts

Read the affected surface, plus Geographic privacy for data-boundary changes. Shared chrome/targets are in [Interface](interface.md#shared-geometry-and-palette); GPS, lifecycle and retry ownership are in [Motion/runtime](motion-runtime.md). These contracts cross frontend maps, service adapters, statistics and exports, so directory-local instructions alone are insufficient.

## Geographic privacy

Actual map, Wikipedia/OSM and Air Atlas features use disclosed geographic requests, bounded local state and real source coordinates. This is a scoped exception to the original universal coordinate prohibition, **not permission to add coordinates to technical diagnostics**. Route inclusion in Travel Report is explicit opt-in; reports use [verified-recipient delivery](diagnostics-reports.md#travel-report). Keep positions/heights out of automatic technical packets.

Air Atlas rounded-location forwarding to the fixed same-origin ADSB.lol adapter was explicitly authorized in [Air Atlas's decision and source record](../AIR-ATLAS-2026-09-09.md). Do not infer permission for another destination or an arbitrary proxy. Use rounded request cells and existing provider bounds/cancellation. Aircraft feeds, geographic tiles, remote imagery and private/dynamic APIs stay outside the static app cache. Exact Discover POIs use actual source coordinates, never invented centroids or clustered positions. Permissions API absence must not prevent real geolocation callbacks from working.

## Map renderer compatibility

MapLibre GL JS is pinned to 6.7.0 after the September 12 attribution sanitizer advisory. All map imports go through the lazy `src/maplibre-runtime.js` adapter, which configures the same-origin bundled worker. WebGL2 is required; ATLAS/Air Atlas fallback and report-map omission must remain truthful when GPU initialization fails. Fly With shares this runtime. Keep context attributes nested under `canvasContextAttributes`, including the report capture buffer. Browser checks do not establish physical Tesla/iPhone compatibility.

## ATLAS and Stats

ATLAS is an informative wider map; Stats for Nerds is a separate full-screen visual, Visual 09 in launch/running catalogues. Remove shared Map/Stats tabs. Preserve metrics and verify replacement parity before retiring an old view. The owner-selected remix combines Travel Observatory's pastel map/POIs and summary bands, Mission Control heading/network instruments, and Journey Magazine photo place card plus speed/altitude timeline. Heading bands curve outward. Natural and Palette remain distinct; manual/Area/Trip framing persists until Follow. Switching passenger views preserves audio mode.

ATLAS uses actual Discover-source POIs. Read more opens the full localized Wikipedia article over Atlas and returns to the same place. This supersedes the old prohibition on Atlas place cards/Wikipedia; it does **not** add an Atlas shortcut or return link to the separate Discover index. See [selected remix](../ATLAS-STATS-REPORT-PLAN-2026-09-07.md#implemented-architecture--selected-remix). Earlier plan-only selection and PDF status there are historical; [Travel Report](diagnostics-reports.md#travel-report) has its own later selected scope.

Keep mandatory map attribution immediately above the footer: tiny, low, translucent text, never a large white pill. Preserve its explicit `14 px` readable high-contrast type requirement as a surface-specific value, not an instruction to change the generic 13 px metadata role. ATLAS suppresses Now Playing and expands the available field when chrome rests. Use readable case and deliberate vertical spacing.

**Sidebar applicability remains unresolved.** The root instruction requires a collapsing passenger-*location* sidebar with a persistent right-edge midpoint handle and full-field expansion. The local September 7 approved remix explicitly retires the former *chart* handle, `320 px` chart sidebar and `340 px` Canvas instrument. These descriptions do not prove revocation of a distinct location-sidebar requirement. For a task adding/removing/redesigning that location sidebar, resolve whether a separate handle is still intended; preserve its specified icon-only `36 x 30 px` tab inside `48 x 48 px` target, accessible name, same-handle reopen and no full-height rail if retained. Do not resurrect the retired chart panel or block unrelated map fixes. Conflict sources: root Product and validation / ATLAS; local Durable product direction / ATLAS and ATLAS / Stats approved remix (preserved in the migration originals); [explicit selected-remix replacement](../ATLAS-STATS-REPORT-PLAN-2026-09-07.md#implemented-architecture--selected-remix).

For metric parity work, the former instrument's required information remains: Speed, Distance, Moving time, Average speed; Accel/Braking balance, Speed-band distribution, Heading history, Moving/Stopped; full-width Elevation; shared `15 MIN / 1 H / SESSION` ranges. Preserve information through the new Stats surface without restoring the superseded panel geometry. Gaps can have dashed palette-derived alternate-shade connections for **short and long** missing intervals, with a visible Estimated legend; connections never change observations, totals or exported data. Below Network show useful observed session continuity. For the exact accepted metric pipeline consult [Stats for Nerds data and visual contract](../ATLAS-STATS-REPORT-PLAN-2026-09-07.md#stats-for-nerds-data-and-visual-contract) and [September 8 refinement](../ATLAS-STATS-REFINEMENT-2026-09-08.md#owner-decisions-and-implementation).

The September 12 owner correction puts map appearance in the same camera row as
zoom/reset/orientation, using the existing palette icon inside a 48 px target.
Retain an accessible current/next name, selected state and keyboard/pointer parity.
Remove the separate MAP COLOR plaque. Align camera and framing rows when width
permits. The September 19 stable identity lane supersedes the fixed 620 px
threshold: wrap whole groups according to the remaining width at the right of
logo and speed, without shrinking controls or hiding the logo. The actual
camera component is shared with the [interface reference](../DESIGN-SYSTEM.md).

Recover Atlas after network/location restoration; nearby OSM places are independent of map zoom, with Maps/Wikipedia links where supported and truthful Wikipedia/OpenStreetMap provider labels. Keep camera travel/rotation smooth, shortest heading/dateline path, north lock, zoom in/out/reset and bounded frame-time work. Numbered POI discs are `32 px` inside unchanged `48 px` targets. Reset restores speed-follow zoom without silently changing orientation preference. Use [road UI implementation](../ROAD-UI-REFINEMENT-2026-09-09.md#implemented) for camera/marker ownership and [source-specific recovery](../ATLAS-STATS-REFINEMENT-2026-09-08.md#recovery-and-nearby-sources) for request limits. Desktop render timing cannot prove sustained Tesla 60 FPS.

## Veduta

The October 23 owner-selected first direction adds a standalone illustrative
view with an elevated horizon-facing follow camera, Anime/Manga/Watercolor and
optional original Model 3 Highland / Model Y / point markers with body colours.
The owner's live preview correction makes a fixed 12 CSS-pixel GPS dot the
default. Optional cars retain approximate metre dimensions; do not restore the
rejected 3.4× symbol enlargement.
Use the existing admitted GPS sample buffer, MapLibre worker and geographic
providers; never integrate speed into invented travel. Hold stale/missing fixes,
keep source coordinates out of diagnostics and retain all map/DEM attribution.
The view is illustrative, with no Atlas POI/article/statistics panels.
The owner's subsequent style correction requires the medium across the whole
landscape, including terrain/water/native fallback geometry. Keep the final
original GPU treatment in the public custom-layer boundary, with no CPU pixel
readback or second canvas/context; DOM controls and credits remain crisp.

The camera's look-ahead target is separate from measured vehicle coordinates.
Vehicle dimensions, roof/window details, vegetation and road/terrain alignment
are approximate visual representations, not surveyed data. Use one shared GL
context, bounded scenery and stable global marks. Map retries cannot clear GPS
or session journey history. A failed tile is not recovered merely because the
map is idle. Preserve pending vehicle changes across source/style loading.
See [selected scope and implementation](../VEDUTA-2026-10-23.md). Local and
physical Tesla acceptance remain separate; do not equate the private Image Gen
target or the synthetic development fixture with real-car evidence.
See the [whole-scene art iteration](../VEDUTA-ART-2026-10-23.md) for current
resource limits and the distinction from GeoPoster's semantic/depth renderer.
The owner explicitly authorized the subsequent real-Tesla trial/publication.
Camera updates may use the same public synchronous `redraw()` boundary as Atlas
to avoid a second deferred camera RAF. Near-field tree exclusion uses bounded
conservative polygon buckets followed by unchanged exact geographic tests;
density, geometry and geographic marks must remain unchanged. Report intervals
against the declared 60Hz target, never the observed interval as its own target.
Desktop CPU throttling is stress evidence, not Tesla GPU or physical acceptance.
Scenery preparation is a finite cooperative job outside the draw callback. Keep
its point/origin/scale/medium immutable; retain the last complete scenery until
an atomic commit also switches native paints, finish and geographic origin.
Tile arrivals coalesce a subsequent revision; medium/180m-centre changes and
hide cancel the candidate (its pending bake is rejected and a late reply is
dropped). The owned CPU worker survives cancellation and is terminated only on
removal or replaced after a worker failure. Feature snapshots pass class
filters so MapLibre skips classes the builder ignores. The worker runs the
unchanged pinned Three normal/merged-edge/bounding-sphere algorithms on
transferred buffers, including exact bounds for the first visible draw.
The terminal finish draws to the public main framebuffer and releases its own
bindings. Pinned MapLibre restores native state after custom rendering; do not
reintroduce synchronous per-frame GL state queries or runtime private access.
The soft 3ms CPU budget is not a guaranteed bound on MapLibre or driver calls.
October 24 polish (refinement within the selected Veduta, no new direction):
the GPS dot keeps its fixed 12 CSS px but carries the PALETTE accent, darkened
until it holds 3:1 against the medium ground, with a white ring and dark
hairline. VIEW shows the marker (Dot / Model 3 / Model Y) and opens a Night
Instrument popover: CAMERA zoom keys and MARKER radio rows with the indicator
bar, colour swatches only for car shapes. The status line appears only when
not nominal. Credits follow Atlas: one quiet 13 px strip, links underlined only
on focus/hover. DARK appearance still leaves the landscape in daylight; a night
landscape is a new visual direction awaiting the two-direction gate.

## Discover

Discover is a separate passenger index and complete localized Wikipedia reader. It must not open, switch to or link back to ATLAS. Free-text search is global in the selected Wikipedia language, works without GPS and preserves Wikipedia relevance. Location/heading apply only to empty-search NEARBY / AHEAD / REGION scopes. Keep the language selector understandable without a visible LANGUAGE label and compact scope rows.

At `773 x 601`, retain the `52 px` heading band, `24 px` title, `48 px` tools and `246 px` searchable language-aware rail unless a specific owner change replaces them. Result rows now use `72 px`, `15 px` names over at least two lines and `13 px` distance/ETA metadata with actual provider labels. This replaces the earlier `64 px` rhythm and later `88 px` implementation, per [September 9 owner refinement](../ROAD-UI-REFINEMENT-2026-09-09.md#implemented). Remove decorative result numbers. Fill the available height before exact `+N MORE`, preserving every loaded result in the same scroll.

Render the complete selected article in its sandbox with chapters, images and infoboxes. Keep the desktop two-column relationship; cap floated infoboxes responsively and bound lead-image height without cropping, stacking only when the reader itself is narrow. An infobox/image cannot compress the lead to a word-column. QR opens exploratory Google Maps search for the selected place, never starts navigation automatically; the passenger can refine, explore, share or explicitly request Directions. Source expansion details belong in [Discover OSM](../DISCOVER-OSM-2026-09-09.md) when that provider work is affected.

## Altitude

Show reported GPS altitude even when it fails the stricter ascent/descent accuracy filter. Prefer GPS whenever present; use the existing Open-Meteo/Copernicus terrain estimate only when GPS altitude is absent and label it separately in Stats/PDF. Rounded request cells, bounded session cache, spacing and lifecycle recovery remain mandatory. Do not overwrite a GPS reading with terrain or add heights/positions to automatic diagnostics. For exact calculation/caching rules use [Altitude fallback](../ALTITUDE-FALLBACK-2026-09-07.md).

## Air Atlas

Air Atlas direction A is selected; the old unselected Meguru-study-only status is superseded by [Air Atlas's owner selection](../AIR-ATLAS-2026-09-09.md). Use the first valid geographic fix even when stationary or coarser than `250 m`, label approximate accuracy and refine with trusted fixes. Keep trusted motion, terrain and journey gates unchanged. Distinguish granted-awaiting-fix, denied, unavailable API and last known position; do not equate permission with satellites or require movement for the initial fix.

Only selected aircraft have one contrasting `54 px` ring around the `42 px` silhouette, roughly `4 px` inner clearance, with ground distance below. Shape availability cannot depend on ground track. Prefer exact model artwork; otherwise use identified category silhouettes, never a neutral dot for a known rotorcraft or civil aircraft. Keep unknown telemetry honest and separate actual position age from message age. Follow visible radar area on zoom/pan within bounded provider coverage; the nearest-32 display cutoff is removed. Manual and selected-aircraft refresh obey backoff and cannot make old observations fresh.

Interpolate measured positions through a shared **five-second delayed playback**, never extrapolate unobserved paths or move stale targets indefinitely. Understated dashed received-flight trails are bounded to `5 km / five minutes / 256 samples` per aircraft, end at the delayed display sample and break on missing/implausible observations. The selected subtle spherical **display lens A** keeps geographic coordinates unchanged, aligns aircraft/home hit regions with warped map/trails, leaves controls flat and falls back to the ordinary map if GPU context is unavailable. It is not a real globe or inclined-terrain redesign.

Radar transport shows major roads, preserving lakes and airport/runway context while reducing minor water detail. True airways require a current verified licensed aeronautical source; never draw guessed routes. This source remains open only for an airway task. Poll/detail requests stay bounded, cancellable, non-overlapping and subject to lifecycle/backoff; only selected-aircraft enrichment is requested. For the exact affected limits use [symbols and measured playback](../AIR-ATLAS-2026-09-09.md#air-atlas-owner-refinement--2026-09-10), [first fix/trails/lens](../AIR-ATLAS-2026-09-09.md#first-location-observed-trails-and-subtle-lens--2026-09-10) or [visible-area traffic](../AIR-ATLAS-2026-09-09.md#air-atlas-visible-area-traffic--2026-09-10), alongside `src/environments/radar/`. The latter sets the 250 NM provider bound and at most 4,096 validated records; its coverage/age/refresh changes supersede older fixed-radius/nearest-32 descriptions in the document's Runtime section. Read source attribution separately when artwork/providers change.

The September 11 owner refinement adds a contrasting current-location dot and a
separate session-only measured home trail bounded to `1 km / two minutes / 128
samples`. Keep last-known styling honest and reject coarse/stale/missing-speed
connections. Lift palette cartography, retain natural colors, and draw only real
source administrative boundaries. UPDATE refreshes traffic; the target control
recenters and resumes Follow. Map retries preserve framing/selection and use the
existing bounded recovery owner. See [road refinement](../ROAD-REFINEMENT-2026-09-11.md).

The September 12 credit refinement uses a single translucent row with 14 px
source links. Keep every attribution, allow keyboard/touch horizontal scrolling
when needed, and retain the visible rounded-area disclosure with expandable
photo-request details. Disclosure interaction must not trigger the field.

## Fly With

The owner selected **A+C**: a nose-mounted oblique view over real 3D terrain at exaggeration **1.25**, with one corner card combining minimap and compact telemetry. Keep direct return to radar and shared five-second measured playback. Camera updates every animation frame without waiting for each new tile. Preserve last terrain height when a DEM sample is missing instead of dropping to zero. Never invent motion after signal loss; stale/missing-data holds are honest.

Keep optical zoom in/out/reset reachable, preserving the aircraft camera position, including while held. FLY WITH is prominent and palette-colored with an original outline view/flight icon. Label approximate altitude reference; do not imply onboard video or exact terrain clearance. See [Nose-mounted terrain view](../AIR-ATLAS-2026-09-09.md#nose-mounted-terrain-view--ac-implemented-2026-09-10) and [continuous camera/optical controls](../AIR-ATLAS-2026-09-09.md#fly-with-continuous-camera-and-optical-controls--2026-09-10) for data and camera ownership. Browser simulation remains separate from physical Tesla/iPhone acceptance and sustained dual-map GPU performance.
