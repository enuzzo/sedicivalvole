# Open-session static cache and updates — 2026-09-09

The owner requests at least a week of asset retention in an open page and a way
to refresh old sessions as frequent new builds are published, preserving saved
preferences. This expands the September 9 page-memory preload work.

## Product behavior

- Check the published **build stamp plus commit**, not just VERSION, every five
  minutes while visible/online and on online/foreground return. Fetch the small
  root HTML with no-store; no audio or whole application update is downloaded
  merely to check. The current root is published atomically after asset checks.
- A different build produces UPDATE AVAILABLE. An unchanged session open for
  seven calendar days produces SESSION REFRESH DUE after a successful check.
- Automatic reload needs thirty observed quiet seconds in Intro, or muted audio
  and fresh **exact-zero GPS** evidence during a running session. Movement,
  interaction, a passenger modal, hidden state or execution gaps over five
  seconds reset the quiet window. Unknown/stale/simulated speed cannot authorize
  a running-session reload. A visible UPDATE button permits explicit user action.
- Recheck immediately before applying. Offline state, failed/invalid HTML or an
  unavailable release identity leave the session intact. There is no promise of
  background timer execution; a suspended browser recovers when visible again.
- Reload returns to Intro and keeps the existing saved preferences. It does not
  clear localStorage, diagnostic OFF/Standard choices, owner LAB notes or site
  storage globally. Normal Intro Lucky selection behavior remains unchanged.
  Audio activation and session counters/journey observations restart; the notice
  states "Saved choices stay. Session restarts."

## Static cache architecture

The Vite release plugin emits a versioned manifest at
`/assets/release-<build>.<commit>.json`, exact static byte sizes/SHA-256 hashes and
an identifying root HTML meta tag. `verify-session-release.mjs` compares every
manifest entry with the final packaged bytes and VERSION; it runs on every build.
No additional third-party runtime dependency is installed.

The original `session-cache.js` service worker caches only used, manifest-admitted
same-origin static resources. Each generation gets its own CacheStorage namespace.
Original owned audio banks/WAVs, scripts, styles, fonts, artwork and pinned visual
files are eligible; downloaded responses must match their declared bytes/hash.
Initial scripts/resources fetched before first worker control are warmed from
observed resource URLs, without mounting a hidden renderer. Unused visual families
are not all eagerly downloaded. The existing 40 MiB encoded Engine memory cache
still accelerates reuse/decoding within the page; CacheStorage is a separate tier.

Root clients bind to a generation through a same-origin message. The binding is
stored so worker suspension/restart does not forget it. Embedded visual URLs carry
the host generation, allowing their unchanged script/import graphs to select the
same cache. New and old tabs can therefore retain different bytes at one static
URL. Worker updates use the browser's normal waiting lifecycle: no forced
skipWaiting replaces the controller beneath every open tab.

Expiry headers do not age out this managed cache. A generation is eligible for
cleanup only **after seven days and when no open client uses it**. An unbound
starting client makes cleanup conservative. Cleanup touches only project-owned
cache namespaces and stale client bindings, never preferences or unrelated stores.
There is no whole-site purge at a release. Old content-addressed assets also stay
on the server under the existing preserve-existing deployment policy.

## Explicit boundaries

- CacheStorage availability, privacy modes, quota, eviction, browser/OS process
  destruction and user-cleared storage remain outside the app's control. No site
  can promise absolute seven-day storage. Cache failure falls back to network;
  it must not evict a live generation to make room for a speculative one.
- Remote Jamendo recordings/covers, Illobo recording transport, map tiles, POIs,
  dynamic APIs, diagnostic/report payloads and protected LAB responses retain
  their existing policy. No persistent remote music library, coordinates or
  private response cache is introduced. Range requests use normal media/network
  handling rather than manufacturing incomplete cached recordings.
- Only already-downloaded/admitted static resources can be reused offline. This
  is not an offline navigation/PWA promise: root HTML stays network-first and
  automatic renewal waits for successful fresh online verification.
- Cache retention is distinct from keeping decoded PCM/GPU state in RAM. The
  browser may terminate a tab; saved choices survive only while its normal
  preference storage remains available.

## Verification

Unit tests cover five-minute polling, different build identities with unchanged
SemVer, malformed/failed fresh checks, exactly-once reload, week-old sessions,
quiet-window resets, hidden/offline recovery, fresh exact GPS/mute/modal gates,
public/private path admission and inactive-only retention cleanup.

Compiled Chrome at 773x601 uses a local server returning HTTP no-store. It verifies
initial scripts and Mono are stored, clears HTTP cache, stops the worker, then
reads an actually used WAV offline through the restarted worker. With a simulated
new release, active Engine remains running for more than thirty seconds; UPDATE
performs a real navigation while saved preference fields remain intact.

Two separate open fixture pages bind to different manifests for one static URL:
each gets its own bytes. An eight-day-old generation survives while its client
is open, then is removed after that client closes. This is an accelerated expiry
fixture, not a seven-day device endurance claim. Music/diagnostic endpoints are
local QA fixtures, with no real diagnostic email. Browser errors are checked.
The complete native suite passes 821 tests; all 182 final static manifest hashes
and 196 dependency credits pass. Chrome phone emulation at 667x375 verifies
the update notice fits and Intro/Engine controls remain reachable. The network
fixture enters offline before stopping the worker: doing those CDP operations in
the reverse order intermittently stalls Playwright network emulation.
Target-Tesla service-worker/storage support, Safari and physical week-long use
remain device acceptance.

## Research and provenance

[MDN Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache),
[storage/eviction limits](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching),
[Chrome lifecycle](https://developer.chrome.com/docs/workbox/service-worker-lifecycle)
and [update handling](https://developer.chrome.com/docs/workbox/handling-service-worker-updates)
informed the design. These are documentation studies, not imported runtime code.
README, THIRD_PARTY_NOTICES and COMMUNITY-THANKS contain synchronized credits and
unsent acknowledgements.

## Canonical publication — 2026-09-09 10:12 Europe/Rome

Published **20260909-1001**, source **00e8e18**. Official preflight/publication
verification, 235 files / 254,940,357 bytes and all 29 Illobo hashes pass; prior
assets remain. Twelve canonical HTTP byte comparisons include root HTML, worker
and the release manifest. Canonical Chrome stores 24 used static assets in this
fixture and retrieves a 401,388-byte WAV offline after HTTP cache clear and
worker restart. Matching build checks are quiet; a simulated future build shows
UPDATE without interrupting active Engine. Zero page exceptions/diagnostic sends;
two existing pre-gesture AudioContext warnings remain. One first reload is needed
for pages opened before this feature. [Full publication evidence](DEPLOY.md).
