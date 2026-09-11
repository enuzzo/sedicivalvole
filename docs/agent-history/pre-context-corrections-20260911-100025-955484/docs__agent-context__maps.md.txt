# Atlas, Stats, Discover and Air Atlas

Read only for the named subsystem. These are active owner constraints, not proof of implementation or live acceptance. Paths below are repository-relative unless linked. Later explicit owner decisions supersede older studies.

## ATLAS / Stats approved remix — 2026-09-07

ATLAS and Stats for Nerds are separate passenger views, not a map plus statistics
sidebar. The owner selected Travel Observatory's pastel map/POIs and summary
bands, Mission Control's heading/network instruments, and Journey Magazine's
photo place card plus speed/altitude timeline. POIs use actual Discover source
coordinates; Read more opens the full Wikipedia article over Atlas and returns
to the selected place. Natural and Palette remain distinct. Manual/Area/Trip
framing persists until Follow. Preserve audio mode while changing passenger
views. The former midpoint chart handle/320 px sidebar is superseded by this
explicit selection. PDF/email remains the separate documented design scope.

Stats for Nerds is Visual 09 in launch and running catalogues, separate from Atlas; no shared Map/Stats tabs. Keep outward curved heading bands. Preserve metric replacement parity, common time ranges and totals. Dashed palette-derived chart-gap connectors have a visible Estimated legend and never alter observations/exports. Add observed session continuity below Network. Natural/palette cartography, north lock, zoom/reset and smooth travel/rotation remain available. Map attribution is mandatory, tiny, low and translucent above the footer, never a large white pill. Location sidebars collapse/reopen with a persistent midpoint handle and return the field to the map; do not restore the retired combined map/statistics sidebar.

Atlas recovers on network/location return and offers nearby OSM places independently of zoom, with supported Maps/Wikipedia links. Discover is a separate complete localized Wikipedia reader with global language-specific free-text search independent of GPS, preserving Wikipedia relevance; location/heading apply only to empty-query NEARBY/AHEAD/REGION. Compact real names and row padding, permit at least two name lines, omit decorative numbering and label actual providers. Keep a 246 px searchable rail, complete scrollable results and exact +N MORE when needed. QR opens exploratory Google Maps search, not automatic navigation. Preserve full sandboxed articles with responsive bounded infoboxes/uncropped lead images, readable distance/ETA, compact scopes and a self-explanatory language selector.

## Owner Air Atlas refinement — 2026-09-10

Only selected aircraft have one contrasting ring, with ground distance below it. Shape availability must not depend on ground track. Retain exact model artwork where available and use clearly identified category silhouettes otherwise, with no neutral dots for known rotorcraft or civil aircraft. Buffer measured positions by five seconds for continuous interpolation; never claim an unobserved path or move stale targets indefinitely. Filter map transport to major roads; preserve lakes and airport/runway context while reducing minor water detail. True airways need a verified aeronautical source, not guessed routes. The later A+C selection below resolves the nose-view gate.

## Owner Air Atlas nose-camera selection — 2026-09-10

The owner selects A+C: an oblique nose-mounted view over real 3D terrain, exaggeration 1.25, with one corner card combining a minimap and compact telemetry. This resolves the earlier A/B/C gate. Keep direct return to the radar, shared five-second measured playback, honest stale/missing-data states and explicit approximate altitude reference. Do not imply onboard video or exact terrain clearance.

## Owner Air Atlas location and lens refinement — 2026-09-10

Use the first valid geographic fix for Air Atlas even when stationary or coarser than 250 m; label approximate accuracy and refine as trusted fixes arrive. Keep the existing trusted motion, terrain and journey gates unchanged. Distinguish granted location awaiting a fix, denied permission, unavailable API and last known position. Permissions API absence must not prevent actual geolocation callbacks from working. Do not equate permission with confirmed satellite reception or require movement for an initial position.

Show understated dashed received-flight trails, bounded to 5 km / five minutes / 256 samples per aircraft; stop at the delayed display sample and break on missing or implausible observations. The owner selected A, a subtle spherical display lens, over a real globe or inclined terrain. Keep geographic coordinates unchanged, align aircraft/home hit regions with the warped map and trails, retain flat controls, and fall back to the ordinary map if the lens GPU context is unavailable. Physical Tesla acceptance remains separate from browser simulation.

## Owner Fly With continuity and controls — 2026-09-10

Fly With updates the camera every animation frame from the measured five-second delayed track, without waiting for every new map tile. Preserve the last terrain height during missing DEM samples instead of dropping to zero. Do not invent motion after signal loss. Keep optical zoom in/out/reset reachable in the flight view, preserving the aircraft camera position; a held pose can still be zoomed. Give Fly With a prominent palette-colored action and original outline view/flight icon. The selected aircraft has one 54 px ring around its 42 px silhouette, with approximately 4 px inner clearance and the distance below it.

## Owner radar coverage refinement — 2026-09-10

Air Atlas traffic must follow the visible radar area on zoom and pan. Preserve bounded provider coverage, remove the nearest-32 display cutoff, and distinguish actual position age from message age. Manual and selected-aircraft refresh must respect backoff and never make old observations appear fresh.

Use [Air Atlas](../AIR-ATLAS-2026-09-09.md), [Atlas/Stats refinement](../ATLAS-STATS-REFINEMENT-2026-09-08.md) or [Discover OSM](../DISCOVER-OSM-2026-09-09.md) only for the affected feature. Read [diagnostics constraints](diagnostics.md) for altitude/report export changes.
