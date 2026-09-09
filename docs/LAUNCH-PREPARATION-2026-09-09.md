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
  the cache. When a cache hit outruns the preceding fade, a bounded 160 ms wait
  lets retiring PCM leave before reserving the next bank; the memory limits stay
  unchanged and this preparation does not require a network retry. This encoded budget is additional to existing 64 MiB decoded-bank
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
Local phone emulation at 667x375 also verifies loading/control separation.
A rapid Rosso-to-Mono return succeeds offline without WAV requests; a regression
test checks the same retirement boundary and unchanged 128 MiB transition cap.
Target-Tesla weak-network, memory endurance and phone-device acceptance remain
physical checks; browser evidence is not a claim of completed offline playback.


## Release validation — build 20260909-0911, source d30769d

813 native tests, production App/LAB packaging and 196 dependency credits pass.
Compiled Chromium repeats the complete Tesla flow with pre-gesture preparation
and offline cached return; page errors and console errors are absent. Two
pre-gesture AudioContext warnings belong to the existing launch unlock flow;
START activates the context successfully. Browser plugin is not available in
this session, so the repository-compatible installed Playwright/Chrome runtime
provides the browser evidence. Phone 667x375 is Chromium emulation, not Safari.

Canonical publication completed 2026-09-09 09:24 Europe/Rome: 233 files / 254,902,094
bytes, ROOT_UPLOAD_ONLY, 29 verified Illobo tracks and two retained prior assets.
All ten HTTP byte comparisons and the canonical Chrome interaction flow pass.
No synthetic diagnostic packet reached the mailbox. [Deployment evidence](DEPLOY.md).

| Canonical path | SHA-256 |
| --- | --- |
| `/` | `aa80e5d13f368b361dfa89a98e11b005f609d43092966a74b5c49387eb3492e4` |
| `?verify=20260909-0911` | `aa80e5d13f368b361dfa89a98e11b005f609d43092966a74b5c49387eb3492e4` |
| `assets/index-dQHtfU7N.js` | `16183703f12dd46f37bccf11a8487fbc8bdae13061bc01c25bee753daf38fdd6` |
| `assets/index-DPP-dqmn.css` | `0a94f9eacc73366cb5e1c1bed97b9d2b116cf8fba690b57440e3313a61616cdb` |
| `assets/runtime-DbkoRhjY.js` | `e13e0cd3026726fb3f6595616fba7a37b43a6d6a6f5da254b1a5dd15044cadea` |
| `assets/profiles-dP29TflP.js` | `8201fb9752d9a13dda1ab88ebbac669c7899cf749745f830646ba2ccbdedc05b` |
| `assets/procedural-voice-o77N7yh1.js` | `f6b55a930881e0e0fb771fed33a38ec29a414b77b98280484eff667bdc1dec7e` |
| `assets/procedural-processor-DhZI11xm.js` | `51039c683c12d94dc0aad8d260d5686dd173ea7cf2c70f15267cc1da873eae38` |
| `assets/shadergradient-field-CkbyVaeQ.js` | `1a3f0e3d500cac6837380930fa3291dac2a5f473f21d45a4fe2ea7c0e5ab7831` |
| `engine-audio/f4e5a7f8e96fa64a.wav` | `f4e5a7f8e96fa64a715ba8ac1c9c9378f0f431cf2775a53c51e9afd652905835` |
