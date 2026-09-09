# Discover: nearby OpenStreetMap points

Discover now blends up to 40 entries from Wikipedia articles and named OSM points. The existing Overpass loader requests selected tourism, historic and amenity node categories within 2 km of a location rounded to two decimal places; this is partial nearby coverage, not worldwide OSM search. Wikipedia retains worldwide text search. OSM search filters its fetched nearby names and categories without extra requests per keystroke.

The providers load independently. OSM retries with bounded backoff, one in-flight request and a 25-second deadline, refreshes no faster than five minutes after success, pauses offline/hidden and recovers online/foreground. Closing the panel cancels its loader. No map renderer or new dependency is required.

Duplicates are removed by linked Wikipedia article identity or matching names within 100 metres. Wikipedia entries retain their article reader; OSM entries show the community category, source and map link, plus an existing Wikipedia tag link when supplied. Both retain the same navigation handoff. No synthetic description or guessed article URL is generated.

Sources: https://wiki.openstreetmap.org/wiki/Overpass_API and https://wiki.openstreetmap.org/wiki/Key:wikipedia. ODbL data attribution remains visible. No server code or additional data service is imported.

Validation: 827 native tests pass. Chrome at 773 x 601 verified both sources, 72 px rows, source-aware card/link, local category search and OSM survival after a simulated Wikipedia 503, with no page exceptions. Fixtures are deterministic test data, not evidence of public POI completeness. Physical Tesla acceptance remains outstanding.

Production candidate: build `20260909-2221`, source `609f8b8`; 182 exact release asset hashes verified. The same provider/failure checks pass in WebKit at 874 x 402 and compiled Chrome at 773 x 601. This is browser viewport evidence, not installed-iPhone or vehicle acceptance.

Public-service check: Chrome fetched the exact existing Overpass query for the public Milan centre and received HTTP 200 with 100 nodes and no incomplete-result remark. A preceding command-line fetch received HTTP 406; it is not evidence of browser failure. Official publication preflight passed without remote writes.

Canonical publication: build `20260909-2221` / source `609f8b8`, 235 files / 254946841 bytes, 29 full audio hashes, preserved previous assets. All 19 independent HTTPS checks passed for canonical HTML, cache headers, JavaScript/CSS, worker and release manifest. The mixed-provider/search/failure Chrome scenario also passed on the live origin with no page exceptions; a separate real Overpass call from that origin returned HTTP 200 and 100 nodes. No synthetic diagnostic mail was sent.

Official postflight also passed: canonical/legacy identity verified, no remote writes. Source and release evidence are committed and pushed.
