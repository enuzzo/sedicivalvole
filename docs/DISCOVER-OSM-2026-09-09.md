# Discover: nearby OpenStreetMap points

Discover now blends up to 40 entries from Wikipedia articles and named OSM points. The existing Overpass loader requests selected tourism, historic and amenity node categories within 2 km of a location rounded to two decimal places; this is partial nearby coverage, not worldwide OSM search. Wikipedia retains worldwide text search. OSM search filters its fetched nearby names and categories without extra requests per keystroke.

The providers load independently. OSM retries with bounded backoff, one in-flight request and a 25-second deadline, refreshes no faster than five minutes after success, pauses offline/hidden and recovers online/foreground. Closing the panel cancels its loader. No map renderer or new dependency is required.

Duplicates are removed by linked Wikipedia article identity or matching names within 100 metres. Wikipedia entries retain their article reader; OSM entries show the community category, source and map link, plus an existing Wikipedia tag link when supplied. Both retain the same navigation handoff. No synthetic description or guessed article URL is generated.

Sources: https://wiki.openstreetmap.org/wiki/Overpass_API and https://wiki.openstreetmap.org/wiki/Key:wikipedia. ODbL data attribution remains visible. No server code or additional data service is imported.

Validation: 827 native tests pass. Chrome at 773 x 601 verified both sources, 72 px rows, source-aware card/link, local category search and OSM survival after a simulated Wikipedia 503, with no page exceptions. Fixtures are deterministic test data, not evidence of public POI completeness. Physical Tesla acceptance remains outstanding.
