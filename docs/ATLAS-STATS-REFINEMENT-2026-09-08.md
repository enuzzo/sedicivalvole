# Atlas and Stats road-note refinement — 2026-09-08

## Owner decisions and implementation

The owner requested reliable Atlas recovery, visible OpenStreetMap places,
a quieter running Visual drawer and aesthetically continuous Stats traces.
The owner explicitly selected dashed connections for both short and long gaps,
with distinct palette-derived shades and an Estimated legend below. These
connections are presentation only: raw samples, cumulative statistics, PDF
source observations and automatic coordinate-free packets are not interpolated.
Leading/trailing missing data cannot be joined without two observations.

The main chart now has four vertical-axis values and three/five time labels
according to width. Speed and altitude use the semantic palette's two contrast-
checked chart colours; estimated segments mix each with the current ink.
A cursor over a gap identifies an estimated connection instead of presenting
its nearest recorded value as an observation at that time. Network is followed
by moving/stopped/unobserved duration bars and observed GPS coverage.

The running Visual drawer retains entire touchable cards and ACTIVE, with a
compact arrow for inactive entries. Catalogue IDs remain stable internally.

## Recovery and nearby sources

A failed visual gets a five-minute backoff episode. After exhaustion, online,
foreground or first recovered Atlas position can start a fresh episode. Hidden
and offline views do not retry. Engine's passenger Atlas now owns the same
recovery path and remount key. Map initialization has a 45-second deadline;
post-load tile errors also enter recovery. Frames cannot report success before
map load, and Atlas's frame telemetry argument order is corrected.

Wikipedia and OSM own independent cancellable requests. Each has one in-flight
request, a 25-second deadline, 30-second to five-minute failure backoff, and
online/foreground recovery. Successful OSM searches are spaced by five minutes;
Wikipedia retains its one-minute floor and distance/time refresh. OSM searches
named nodes within 2 km of a position rounded to two decimals, limited to 100
returned elements and 80 retained normalized points. Polygons/centroids are not
invented as point locations. Loaded OpenFreeMap POIs remain a fallback. Providers
alternate before screen collision filtering. Cards offer outbound Google Maps,
OSM and Wikipedia when an explicit language:title tag exists. No new npm package.
The About disclosure, complete README credits, notices and unsent thanks agree.

Sources: [OpenMapTiles POI schema](https://openmaptiles.org/schema/),
[MapLibre source queries](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/),
[Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API),
[Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started).
Public Overpass availability is not guaranteed; the service is throttled and
loaded-tile fallback remains available. No runtime/source code was imported.

## Verification and remaining evidence

Focused model tests cover long/short/null/compacted gaps, no observation mutation,
OSM bounds/coordinates/safe links/provider priority, request overlap/disposal,
and recovery exhaustion/reconnection. Chrome fixtures exercise the actual Stats
component at 773 x 601 and 844 x 390, light/dark palette changes, and Atlas's
GPS acquisition, failed first tile request, reconnect and OSM card links.
Synthetic diagnostic requests are blocked; no test email is sent.

The native Engine test fixture previously waited a fixed 80 ms for asynchronous
bank recovery. On this Intel host it asserted before recovery completed. It now
waits for terminal state with a two-second bound; all 44 Engine tests pass.

Mailbox inspection on September 8 found no new automatic report in either
connected account, including spam/trash. Latest diagnostic receipt was September
7 at 18:04:41 UTC, build 1936, before automatic delivery activation. Therefore
first real automatic delivery remains unverified; absence alone does not identify
which driving-time, saved preference, connectivity or delivery condition applied.

Physical Tesla map recovery, chart legibility and first actual automatic mail
remain owner acceptance. Publication evidence is appended after canonical checks.

Focused final checks: 129/129; Engine: 44/44. Real Overpass verification with
the documented project identity returned HTTP 200, 80 normalized Milan nodes,
80 Maps links and 23 explicit Wikipedia tags. A first unidentified Node request
was rejected with 406, confirming the provider's identification requirement.
The product browser supplies its origin Referer; no provider bypass is used.
