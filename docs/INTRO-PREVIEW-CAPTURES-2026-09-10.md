# Actual Intro preview captures


## Intro preview and preset refinement — 2026-09-10

Four missing previews now use actual 773 x 601 Chrome captures: Atlas, Air Atlas, Discover and Stats for Nerds. Existing eight renderer previews remain unchanged. Capture location was explicitly set to central Milan for reproducibility, not acquired from the owner. Map/POI and aircraft content came from the real services; Stats shows a newly opened stationary session, not invented journey data. Air Atlas was captured from canonical build 20260910-1348.9f498a6; other surfaces from the same current renderer source locally. No generated artwork was used. Screenshots are unchanged PNG captures; thumbnail presentation uses CSS cover cropping.

Ten coherent presets include Sky Radio (Air Atlas / Blue / Ambient) and City Jazz (Atlas / Graphite / Jazz). The icon-only Random presets control refreshes suggestions without applying them, avoids the previous suggestions and preserves a selected preset. Presets sit together in bounded columns; the separate palette group retains its vertical divider. Both media action rows gain 5 px top margin with existing 48 px touch regions.

Verification: 862 native tests, preview decoding and preset shuffle at 773 x 601, 874 x 402 and 956 x 440 pass without page errors. Browser plugin unavailable; installed Chrome and Playwright used. Physical touch acceptance remains separate.

- `discover.png` SHA-256 `9b3b7bd1e1727ebc8032114fe2766574211bf78c8b37c095436263befd3506f6`
- `stats.png` SHA-256 `1a7ca5497fac7c61db6f9502cc5a4f17d5cbcaead2f47b87c12af1099df44bbe`
- `atlas.png` SHA-256 `b1660dbf929f8936a4c2036adc4bfd21922ca85afde8ca8ddf857d7a5da91fed`
- `air-atlas.png` SHA-256 `a3ceb02db3f7fcc7b33ad84c7035670c83b816eae26accc4a95d3d718c5a7abd`

Source credits: OpenFreeMap / OpenMapTiles / OpenStreetMap contributors (map data ODbL), ADSB.lol and RexKramer1 aircraft shapes, Wikipedia contributors (rendered Policlinico of Milan article, https://en.wikipedia.org/wiki/Policlinico_of_Milan, CC BY-SA). Source notices remain in the full captures. Product screenshot assets remain excluded from the original software licence; underlying third-party rights remain applicable.


## Intro preview publication — 2026-09-10 14:08

Canonical build **20260910-1402.243cc86** verified. Official preserve-existing upload: 42 files / 18,012,891 bytes; 811 static manifest hashes, 796 reused assets, 29 verified audio masters and two previous assets retained. All 24 canonical identity/cache checks and four additional screenshot SHA-256 comparisons pass. Canonical browser checks confirm four PNG previews, suggestion shuffle, 5 px spacing and 773 x 601 / 874 x 402 / 956 x 440 layouts without page errors. All 862 native tests, 196 credits and the complete local Intro interaction regression pass. Physical Tesla acceptance remains separate.
