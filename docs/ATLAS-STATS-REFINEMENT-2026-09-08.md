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

Host validation setup: the deployment script needs Python 3.11+ for
`hashlib.file_digest`; the system `python3` was 3.9. The guarded entry now rejects
unsupported Python before reading configuration and reports only the class of
unexpected exceptions. Use the existing `python3.11` executable on this Mac.
All 23 deployment-script tests pass under that runtime. PHP was absent; PHP 8.5.10 CLI and its post-install configuration now work.
The complete suite uses real PHP with fake mailers; no background service was started.

## Canonical publication — 2026-09-08 19:48 local

Build **20260908-1934**, source **4f049ed**, VERSION **0.0.0**. All **798 native
tests**, **17 focused package/documentation checks** and **196 dependency credits**
pass. Official publication verifies **232 files / 254,890,462 bytes**, all **29
Illobo recordings**, two retained overlap assets, and no retired file removals.
Independent postflight reports `remote_writes=NONE` and twelve root entries.

All **21 HTTPS checks** pass: exact bare/cache-busted HTML, all fourteen top-level
fingerprinted JS/CSS assets, protected LAB, and bare/conditional main JS/CSS.
Root and LAB are no-store; fingerprinted assets have validators without explicit
Cache-Control. This is observed behavior, not a claimed immutable cache policy.

Final compiled and canonical Chrome flows pass at 773 x 601 and 844 x 390:
late GPS acquisition, blocked first tile request then online recovery with real
OpenFreeMap tiles, OSM fixture card links, drawer without numbers/SELECT, ACTIVE
retained, Stats legend and continuity, and no horizontal overflow. No page
exceptions or diagnostic sends. Actual component fixtures additionally cover
short/long chart gaps and light/dark palettes. The isolated source fixture had
a local Vite HMR WebSocket warning; compiled/canonical checks use no Vite runtime.
Browser plugin was unavailable; existing Chrome/Playwright provided validation.

A real browser request from the canonical origin to Overpass returns HTTP 200,
100 bounded source nodes and no partial-response remark, verifying CORS and
normal browser identification. The normalized subset is capped at 80.
Mailbox recheck still finds no September 8 diagnostic. Next owner acceptance:
ATLAS recovery on the Tesla's connection, gap legibility in the cabin, and a
15-observed-driving-minute Dev/AUTO ON session followed by real inbox receipt.
