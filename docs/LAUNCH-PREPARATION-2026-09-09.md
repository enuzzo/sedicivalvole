# Intro preparation and Engine loading — 2026-09-09

The owner requested a prominent aligned Engine loading message and earlier
preparation of Lucky visual, Jamendo track/cover and the first retained engine.
This is a reliability refinement of the selected cockpit and Telemetry design.

## Implemented behavior and architecture

- Engine shows a centered 22 px LOADING + selected name and a 15 px explanation.
  It identifies the continuing previous engine; retry/error states remain explicit.
  Loading the runtime module itself now also produces a loading state.
- Intro prepares Mono immediately and follows an explicitly selected profile.
  Preparation downloads only encoded WAVs; it creates no AudioContext/voice.
  The runtime uses the same cache and still decodes/constructs audio on activation.
- `engine/asset-cache.js` retains at most 40 MiB of SHA-256-checked WAV bytes with
  LRU eviction. Every decode receives a copy; shared transfers are cancelled only
  after their final consumer leaves. Rejected or corrupt responses never enter
  the cache. This encoded budget is additional to existing 64 MiB decoded-bank
  and 128 MiB transition accounting; total browser memory includes other owners.
- Selected ShaderGradient/Atlas/Stats modules can import early, without mounting
  a renderer. Other native fields already ship in the application payload.
  Vertigo/Drivey preparation fetches their pinned local HTML/script/style import
  graphs without executing their iframe scripts or editing upstream material.
  Map tiles, GPS-dependent data and GPU compilation still need the live renderer.
- Each selected preparation has one request sequence, a 60-second attempt limit,
  bounded five-minute exponential retry, online/foreground recovery and disposal
  on selection change/launch. Hidden/offline transitions cancel fetch work.
  JavaScript imports cannot be aborted by the browser; their completion never
  mounts an abandoned renderer. No unbounded hidden polling is added.
- Existing Soundtrack preparation runs in Intro even while viewing Engine; its
  current media role uses preload=auto, with existing adjacent-buffer limits.
  The current cover gets the existing bounded artwork recovery independently of
  the selected music mode. Playback still needs the user's activation gesture.

## Cache limits

Engine encoded bytes survive profile/mode switches in this page, including
network loss, until bounded eviction or page destruction. Ordinary reload also
resets this application-owned memory, not only force reload. Static content can
reuse normal HTTP cache subject to server/browser policy. The page entry remains
fresh for releases. Jamendo relay/catalogue retain their existing no-store and
transient playback policy: this work does not create persistent offline music.
No service worker, persistent media store or whole-library download is added.

Browser HTTP cache can be evicted independently of reload, and media preload is
browser-controlled. See [MDN HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)
and [cache storage limits](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching).

## Validation

Automated tests cover transfer sharing, decoder detachment, consumer cancellation,
SHA-256 rejection, LRU bounds and traversal of both actual pinned visual graphs.
Local Chromium at 773x601 verifies pre-gesture Mono/Jamendo/cover requests,
Vertigo dependencies without an iframe, START reuse, a deliberately delayed
Rosso loading notice above TAMARRO and return to Mono without another WAV request.
QA substitutes local audio/catalogue fixtures and blocks diagnostic mail.
Target-Tesla weak-network, memory endurance and phone-device acceptance remain
physical checks; browser evidence is not a claim of completed offline playback.
