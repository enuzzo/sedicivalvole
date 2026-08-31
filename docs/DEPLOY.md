# Deployment

## Build identification

Every build carries a stamp in the form `20260826-1543` (`YYYYMMDD-HHMM`),
generated at build time and shown on the splash. **Always write the build stamp
when publishing or deploying**, and record it with the evidence for that
publication. It identifies the build; `VERSION` remains the only SemVer source
of truth and is reported separately in the diagnostics.

## True Illobo catalogue and hosted-audio correction — 2026-08-31 17:50

- build stamp: **`20260831-1744`**; deployed source checkpoint:
  **`1a47e23`**;
- source correction: **PASS**. `PLAY FEATURED` now reads only the separate
  owner-authorized Illobo catalogue. Jamendo Library, pace, genre and exact-track
  requests remain on the Jamendo API/audio relay. Source kind and selection ID
  are part of cache identity, so a Featured click cannot reuse Jamendo records;
- local archive gate: **PASS**. The ignored provenance manifest declares 29
  unique MP3 web masters and the deploy gate recomputed every local SHA-256,
  size, safe filename and title before opening the network. Audio and the private
  provenance manifest remain outside Git;
- tests/build: **PASS**. The complete `499/499` suite, 146-module App,
  70-module LAB and Sites packaging pass;
- protected FTP publication: **PASS**. Initial read-only preflight proved there
  was no Illobo directory and made no writes. Publication uploaded 140 files /
  212,284,605 bytes with `--preserve-existing`, then read and hashed every remote
  Illobo recording. The publisher reported `illobo_playlist=PASS tracks=29
  full_hash_verification=true`; read-only postflight passed with eight root
  entries and `remote_writes=NONE`;
- canonical HTTP: **PASS**. The root references
  `assets/index-CuT0aWht.js` and `assets/index-DWieer5Q.css`. The public Illobo
  catalogue returns `200 application/json`, schema
  `sedicivalvole.illobo-public-catalog.v1`, exactly 29 records and only artist
  `Illobo`. Range probes for all **29/29** recordings return `206 audio/mpeg` and
  a total byte size matching the signed catalogue. Target-Tesla playback and
  effects acceptance remain `R7-06`–`R7-07`.

The earlier `20260831-1727` section below remains immutable deployment history.
Its **23/23** evidence verifies the admitted Jamendo relay only; it is not and
must never again be treated as an Illobo playlist audit.

## Illobo Featured random-start and full relay audit — 2026-08-31 17:32

- build stamp: **`20260831-1727`**; deployed source checkpoint:
  **`61471e8`**;
- behavior: **PASS**. Every explicit `PLAY FEATURED` chooses a random start,
  avoids the currently audible track when alternatives exist, retains every
  admitted playlist identity, and leaves the 30-minute editorial ordering plus
  NEXT/PREVIOUS traversal intact;
- tests/build: **PASS**. The complete `496/496` suite, 146-module App,
  70-module LAB and Sites packaging pass;
- exact local Browser QA: **PASS at `773 × 601`**. Three consecutive presses
  started `Lemon Pop`, `Dreams`, and `Boys, Girls, Toys & Words`; row, NOW
  PLAYING and Tesla-facing page title stayed synchronized, document overflow
  remained zero, and no warning/error was observed;
- protected FTP publication: **PASS**. Read-only preflight and postflight both
  passed with eight canonical-root entries, verified the expected API and
  static trees, and reported `remote_writes=NONE`; publication used
  `--preserve-existing`. The publisher returned no retained transfer summary,
  so no file-count claim is invented;
- canonical HTTP identity: **PASS**. Cache-busted root HTML returns `200`,
  no-store/no-cache and `nosniff`, references `assets/index-DjHgzRF4.js` and
  `assets/index-DWieer5Q.css`, and carries build `20260831-1727`. JavaScript
  SHA-256 `5b25064ce5e1bc328077f231b20096eda011f2f0282d5da748505df33580454d`
  and CSS SHA-256
  `0ff677d0cdf1d87665bd0b03254abb509992dba727b85b782a719fd846581ea3`
  are byte-identical local/live;
- complete playlist/relay audit: **PASS**. The live server returned 50 raw
  Jamendo records; policy admitted 23 and correctly rejected 27 ND or
  unrecognized-licence records. Range probes for every admitted identity passed
  **23/23** at `206 audio/mpeg`, with zero retry and zero failure;
- storage boundary: the FTP tree contains the deployed catalogue/audio relay
  code and configuration boundary, not hosted Jamendo MP3 copies. Audio is
  resolved by exact ID and streamed transiently with `no-store`, as required by
  the source policy. Physical-Tesla acceptance remains `R7-07`.

## Tesla Soundtrack playback/effect correction — 2026-08-31 17:19

- build stamp: **`20260831-1714`**; deployed source checkpoint:
  **`4b36069`**;
- field failures: **REPRODUCED AND CORRECTED**. Illobo Featured admitted track
  `1187970`, but the production exact-ID metadata lookup returned no candidate;
  the failed current deck could then remain in a later transition source set.
  Jamendo UNDERWATER visibly engaged at `0.4`, but its linear-Hz sweep still
  left the low-pass near `11 kHz`, making it effectively dry under cabin noise;
- correction: **PASS in code and server probes**. The relay retries exact array
  and scalar ID queries, verifies the returned ID and remains fail-closed.
  Featured reuses the prepared catalogue inside the passenger gesture, and only
  genuinely audible media keys may feed a transition. UNDERWATER retains its
  `18 kHz` and `520 Hz` endpoints but reaches them through a perceptual
  logarithmic sweep, placing visible engagement below `5 kHz`;
- tests/build: **PASS**. The complete `495/495` suite, 146-module App,
  70-module LAB and Sites packaging pass;
- protected publication: **PASS**. Read-only preflight and postflight both
  passed with eight root entries and `remote_writes=NONE`; publication used
  `--preserve-existing`. The publication process returned no retained transfer
  summary to this session, so no file-count claim is invented;
- canonical HTTP identity: **PASS**. Cache-busted root HTML returns `200`,
  no-store/no-cache and `nosniff`, references `assets/index-BeVjpOx1.js` and
  `assets/index-DWieer5Q.css`, and carries build `20260831-1714`. JavaScript
  SHA-256 `f9c571bc5b46caaa7d1502c4d42f86c483be4051ec126a2df87132c18a8190d7`
  and CSS SHA-256
  `0ff677d0cdf1d87665bd0b03254abb509992dba727b85b782a719fd846581ea3`
  are byte-identical local/live;
- production relay: **PASS**. Formerly failing Featured track `1187970` and
  tracks `1321406`, `26736`, and `1165005` each return `206 audio/mpeg` for a
  `0–1023` range; track `1187970` is recognized as an ID3 audio file;
- exact Browser QA: **LOCAL PASS at `773 × 601`**. `PLAY FEATURED` immediately
  selects Illobo, starts `All Rights Reserved`, synchronizes the highlighted
  row, NOW PLAYING and `16 - Anny Sky - All Rights Reserved` page title, keeps
  the document at `773 × 601`, and emits no warning/error. The Browser-control
  client still cannot prove live cabin audio. Physical Tesla listening remains
  `R7-06`, `R7-07`, and `R4-04`.

## ATLAS Navigator Plaque — 2026-08-31 17:01

- build stamp: **`20260831-1653`**; deployed source checkpoint:
  **`79d9c9b`**;
- interface change: **PASS**. The selected Navigator Plaque combines a filled
  dynamic direction arrow, English cardinal, exact degrees and a road name
  taken only from already rendered `transportation_name` vector data. It
  replaces the separate MapLibre compass, unwraps heading continuously across
  north, leaves the accepted route/point behavior unchanged and adds no reverse
  geocoding;
- tests/build: **PASS**. The complete `493/493` suite, 146-module App,
  70-module LAB and Sites packaging pass;
- protected publication: **PASS**. Read-only preflight and postflight both
  passed with eight root entries and `remote_writes=NONE`; publication used
  `--preserve-existing`. The publication process returned no retained transfer
  summary to this session, so no file-count claim is invented;
- canonical HTTP identity: **PASS**. Cache-busted HTML
  SHA-256 `1fcd33ade91b41aec1929e852d4e487407934fe8f00e5eb242fc5fa209203825`,
  JavaScript `assets/index-DT8ziHEU.js` SHA-256
  `e07c48da54658768e4c09553496d2cf8c3e0dd21084a89fd835464cefce26316`,
  CSS `assets/index-DWieer5Q.css` SHA-256
  `0ff677d0cdf1d87665bd0b03254abb509992dba727b85b782a719fd846581ea3`
  and `third-party/tabler-icons/navigation-filled.svg` SHA-256
  `47ec73f7e51d5f0fc128753b7a9d33f75bf21ee65660feab7269c5f8e5c9ce1`
  are byte-identical local/live. Root HTML returns `200`, no-store/no-cache and
  `nosniff`;
- exact live Browser QA: **PASS at `773 × 601`**. The canonical splash reports
  build `20260831-1653`; ATLAS demo resolves `Corso di Porta Romana`, changes
  the plaque from `SE 135°` to `S 184°` while the filled arrow rotates, and
  retains exact `773 × 601` document bounds. No live-origin warning or error
  was observed. Physical-Tesla acceptance remains `R9-01`–`R9-02`.

## Global MUTE / FX control parity — 2026-08-31 15:38

- build stamp: **`20260831-1534`**; deployed source checkpoint:
  **`c0a2f78`**;
- interface correction: **PASS**. MUTE now uses the existing FX control anatomy,
  including `LABEL / ON–OFF / GLOBAL`, the shared active treatment and the same
  responsive width. The controls remain independent and retain truthful
  accessible mute/unmute and effect-enable/disable names;
- tests/build: **PASS**. The complete `491/491` suite, 146-module App,
  70-module LAB and Sites packaging pass;
- protected publication: **PASS**. Read-only preflight and postflight both
  passed with eight root entries and `remote_writes=NONE`; the no-delete
  publication uploaded **113 files / 18,016,843 bytes** and retained two prior
  fingerprinted assets for cache overlap;
- canonical HTTP identity: **PASS**. HTML SHA-256
  `4d3fb3fdb4dba609822ca6d38d844f153e6bac22987e8cd58d07315b367dff88`,
  JavaScript `assets/index-C4yHqBXM.js` SHA-256
  `2d43311d03c1ba9364fce63616d8f6197581c0cf004e98edd2942b7b5a42a37f`,
  and CSS `assets/index-D-oO6VWp.css` SHA-256
  `6d2cc13b7344a511a43d0fb2b56dcbfe55ed07465d22227aa5be0a31278e836f`
  are byte-identical local/live. The cache-busted canonical root returns `200`,
  `no-store, no-cache`, and `nosniff`;
- exact live Browser QA: **PASS at `773 × 601`**. MUTE and FX both measure
  `69 px`, both expose `GLOBAL`, and each changes its own ON/OFF and
  `aria-pressed` state without changing the other. Document overflow is zero
  and no warning or error was observed. Physical Tesla touch/glance acceptance
  remains `R4-06`.

## Illobo Featured launch correction — 2026-08-31 15:09

- build stamp: **`20260831-1502`**; deployed source checkpoint:
  **`1171157`**;
- root cause: **CONFIRMED**. An unqualified Soundtrack load and the explicit
  Illobo button both normalized to `featured:signal-border`. Inside one stable
  half-hour window they therefore reconstructed the same queue and current
  recording, making the explicit click appear inert;
- correction: **PASS**. The initial unfiltered path is now `library:all`, while
  `PLAY FEATURED` requests the independently seeded `featured:signal-border`
  queue and starts it immediately. Pace, genre, track, authored `1×`, effects,
  three-media bound and 30-minute cadence are unchanged;
- tests/build: **PASS**. The complete `491/491` suite, 146-module App,
  70-module LAB and Sites packaging pass;
- protected publication: **PASS**. Read-only preflight and postflight both
  passed with eight root entries and `remote_writes=NONE`; the no-delete
  publication retained the static/legacy tree;
- canonical HTTP identity: **PASS**. HTML SHA-256
  `f4a8bd9786245e70f24a289df0eeb75fa8d249b1b13de0990cc8a221cf093cbe`,
  JavaScript `assets/index-C148Fmup.js` SHA-256
  `957a5008f955ea8ffb0cb5c5dca799265563fc98819e9a6f8c0449250ed0dcde`,
  and CSS `assets/index-hKft6LK2.css` SHA-256
  `6e686f4783e82c13542be3e2862ff5f448f328b17580df11e47e293d83b61f05`
  are byte-identical local/live. Root HTML retains no-store/no-cache and
  `nosniff`; the live API returned six schema-valid catalogue records;
- exact Browser QA: **LOCAL PASS at `773 × 601`**. Jamendo Library is selected
  initially with `Leave and Never Look Back`; the explicit Featured gesture
  selects Illobo, starts `Boys, Girls, Toys & Words`, synchronizes the page
  title and leaves document width exactly `773 px`. The live Browser-control
  client again blocked direct `.php` preparation, so live audio interaction is
  not claimed from that client; canonical byte identity and the independent
  live API probe prove the deployed runtime and server boundary. Physical
  acceptance remains `R7-07`.

## Illobo perceptual endpoint correction — 2026-08-31 14:53

- build stamp: **`20260831-1448`**; deployed source checkpoint:
  **`6218f98`**;
- root cause: **CONFIRMED**. The CSS animation and both network-loaded SVGs were
  healthy, moving naturally from `0.988 / 0.012` through `0.508 / 0.492` to
  `0.004 / 0.996`. Inverting the outline on the near-black field made its shared
  LOBO glyph geometry white like the solid source, leaving almost only the thin
  outer perimeter to change. A valid crossfade therefore read as one fixed cover;
- presentation correction: **PASS**. Both supplied SVGs remain byte-identical.
  The solid source remains white on black; the outline keeps its original black
  paths over a `40%` paper / `60%` ink graphite field. The eight-second linear
  cycle, four-second transitions, square shape, zero border/radius and unclipped
  outer perimeter remain unchanged. Jamendo artwork is untouched;
- tests/build: **PASS**. The complete `490/490` suite, 146-module App,
  70-module LAB, and Sites packaging pass;
- protected publication: **PASS**. Read-only preflight and postflight passed
  with eight root entries and `remote_writes=NONE`; the guarded no-delete upload
  transferred **109 files / 16,513,469 bytes**, retained the static/legacy tree,
  and preserved two prior fingerprinted assets for cache overlap;
- canonical HTTP identity: **PASS**. HTML SHA-256
  `38690d14931a98272a40e1e42c6ab8c3be59d38ab2ae86066dd070fff60fc6a3`,
  CSS `assets/index-hKft6LK2.css` SHA-256
  `6e686f4783e82c13542be3e2862ff5f448f328b17580df11e47e293d83b61f05`,
  and JavaScript `assets/index-DSyIcBTb.js` SHA-256
  `5a2acd9316df03c7e7af808d494e0c2ab4bab715cc8e0563fafb97d01d71d0e1`
  are byte-identical local/live;
- exact live Browser QA: **PASS at `773 × 601`**. Natural-cycle screenshots
  prove visibly different white-on-black solid and black-on-graphite outline
  endpoints. Both images use `filter: none`; the cover remains `64 × 64`, page
  overflow is zero, and no warning or error was observed. Physical Tesla
  acceptance remains `R8-01`–`R8-02`.

## Illobo continuous dark-field correction — 2026-08-31 13:41

- final build stamp: **`20260831-1340`**; deployed source checkpoint:
  **`becc0c2`**. The immediately preceding build `20260831-1337` from
  `1a2acda` was published successfully but superseded after owner review found
  its six-second-per-direction change too subtle;
- presentation: **PASS**. The byte-identical SVGs remain unchanged. Their cover
  now has the product graphite field, no border, no radius, and visible overflow
  so the supplied outer outline cannot be clipped. A linear eight-second cycle
  takes four seconds to dissolve fully in either direction with no static hold;
- tests/build: **PASS**. Focused brand checks, the complete `490/490` suite, the
  146-module App, 70-module LAB, and Sites packaging pass;
- protected publication: **PASS**. Read-only preflight and postflight passed
  with eight root entries and `remote_writes=NONE`; the guarded no-delete upload
  transferred **109 files / 16,513,450 bytes**, retained the static/legacy tree,
  and preserved two prior fingerprinted assets for cache overlap;
- canonical HTTP identity: **PASS**. HTML SHA-256
  `3b021c1a9f09025115f0593ad574e2e50dd3152a5bd6ff6ed7bf4b67cb04f066`,
  CSS `assets/index-eJRhhJpg.css` SHA-256
  `9d2543da4478e7dac8a2eca380e5175d45705a8b79fcb2e5323755c7eedcd9ca`,
  and JavaScript `assets/index-BfLj9x4m.js` SHA-256
  `842e20b77e6d49a7a60d4f152c5dee257c88de2857395d6436912638314bd115`
  are byte-identical local/live;
- exact live Browser QA: **PASS at `773 × 601`**. Opacity changed from
  `0.946 / 0.054` to `0.442 / 0.558` over two seconds; computed cover style is
  dark, square, borderless and unclipped. Page overflow is zero and no warning
  or error was observed. Physical Tesla acceptance remains `R8-01`–`R8-02`.

## Illobo identity and Tesla playback title — 2026-08-31 13:25

- build stamp: **`20260831-1320`**; deployed source/documentation checkpoint:
  **`b59e6ec`**; product implementation: **`05a754b`**; strict retired-asset
  cache-overlap gate: **`edd1a31`**;
- first read-only preflight: **EXPECTED FAIL with no remote writes**. It stopped
  at `unexpected_brand_entry` because the prior provisional Illobo PNG remained
  on the canonical brand tree. The corrective gate admits only that exact
  filename at its recorded SHA-256; mutated or unknown brand entries still abort;
- protected publication: **PASS**. Corrected read-only preflight and final
  postflight passed with eight root entries and `remote_writes=NONE`. The
  `--preserve-existing` upload transferred **109 files / 16,513,466 bytes**,
  retained the static/legacy tree and two prior fingerprinted assets;
- canonical HTTP identity: **PASS**. Cache-busted HTML, JavaScript
  `assets/index-BKsAQQ87.js`, CSS `assets/index-B54LNb_j.css`, and both
  `brand/illobo-featured-*.svg` files return `200` with expected MIME types and
  are byte-identical to local at SHA-256
  `8b18d77b2f90ffce95d0f1d2fa4cde97c5cbb5a5d3ac322a2c4f0f349beda424`,
  `a3e0c95ffaec03626b364d0ad14c26fcaa8b7a558014e3115d1f7149cfd7f974`,
  `5110092d1bb9e96dc6e13759e084b68dd127a2a10ae810e2d242aec3d51cd66e`,
  `e2fec599ff690cc78d599c8941cfacb43f49d39054379e0ab9f5257b1c887ad4`,
  and `d713938e350118727752e7b190b3cad946452dd104f8fcab7d5716b231d3b7cd`.
  Root HTML retains no-store/no-cache and `nosniff`; SVGs report
  `image/svg+xml`;
- exact live Browser QA: **PASS at `773 × 601`**. Build `20260831-1320`
  renders both supplied Illobo variants in alternating states 3.1 seconds
  apart, keeps document dimensions at exactly `773 × 601`, and emits no warning
  or error. A real admitted Jamendo recording changes the title to
  `16 - Modern Pitch - Boys, Girls, Toys & Words`; explicit pause restores
  `sedicivalvole — Adaptive Music for the Road`. Physical Tesla mini-player and
  cabin visual acceptance remain `R8-01`–`R8-02`.

## Soundtrack row 7 corrective test build — 2026-08-31 12:50

- build stamp: **`20260831-1241`**; deployed source/documentation checkpoint:
  **`7feea06`**; transient-user-activation correction: **`dcb6801`**;
- protected publication: **PASS**. Read-only preflight/postflight passed with
  canonical identity, eight root entries and `remote_writes=NONE`. The
  `--preserve-existing` upload transferred **108 files / 17,009,929 bytes**,
  retained the static/legacy tree and one prior fingerprinted asset;
- canonical HTTP identity: **PASS**. Cache-busted HTML returned `200`,
  no-store/no-cache, `nosniff` and cache `MISS`. HTML SHA-256 is
  `6b8faf6103aa088d5e9d14b0f9b3f56a32befbb423129d2a560fdf5cf36a096e`;
  JavaScript `assets/index-IUAUAGqO.js` is
  `1235e0c93d278d9d770a693d85b0062da2272741cfcf6595fd37ede65f0bd771`;
  CSS `assets/index-DhhWIT7Y.css` is
  `fb314622b23c83541168621080bf672902ace02c8f8537a2e63f13bb472c6dde`;
  BLOOM worklet `assets/bloom-processor-D718jG56.js` is
  `6561b35a7ee7c753ee858e4682894adacc7010001f073210844b93bb102f222a`.
  Every digest is byte-identical to local and the checked worklet has JavaScript
  MIME;
- live source endpoints: **PASS by direct HTTP evidence**. The catalogue
  returned schema-valid admitted Jamendo metadata; exact-ID requests for tracks
  `1119654` and `135660` each returned `206 audio/mpeg`, `Content-Range`,
  `Accept-Ranges: bytes`, `Access-Control-Allow-Origin: *` and no-store/no-cache;
- exact `773 × 601` Browser evidence: build identity, launch layout and zero
  observed console warning/error **PASS**. Automated live audio transport is
  **NOT CLAIMED**: both available Browser-control surfaces blocked direct
  `.php` catalogue navigation with `ERR_BLOCKED_BY_CLIENT`, and the Chrome
  control session later detached. Earlier build `20260831-1229` did reproduce
  real first-track playback and the delayed-play failure; `dcb6801` is covered
  by deterministic user-activation ordering plus atomic rollback, transition,
  attribution and full-suite tests. This is the published evening Tesla test
  build, but `R7-01`–`R7-06` remain physical-cabin gates.

## Soundtrack row 7 second rejected candidate — 2026-08-31 12:30

- build stamp: **`20260831-1229`**; deployed source/documentation checkpoint:
  **`051d637`**; atomic playback/credit implementation: **`8f03b34`**;
- protected publication transferred **108 files / 17,009,883 bytes** with
  existing static/legacy material preserved; read-only preflight and postflight
  passed with `remote_writes=NONE`;
- canonical HTML SHA-256
  `ad632296e2b78ce171c07d8a22e822aeb6ca32e504c39c08f7bd2f1c9cc3268e`,
  main JavaScript `assets/index-CKWTEbY8.js` SHA-256
  `4eebac24e9c69a305417353af987dbdb06ada29c7347627114df18d5596eadff`,
  and CSS `assets/index-DhhWIT7Y.css` SHA-256
  `fb314622b23c83541168621080bf672902ace02c8f8537a2e63f13bb472c6dde`
  were byte-identical to local. The BLOOM worklet was also byte-identical;
  every checked asset returned `200` with expected MIME, while root HTML
  retained no-store/no-cache, `nosniff` and cache `MISS`;
- exact clean single-tab `773 × 601` Browser QA started the real Jamendo track
  **Over Me — Jemex** and verified the matching public-track QR and complete
  licence card. A normal NEXT preserved coherent prior metadata on failure but
  stopped playback: the incoming media `play()` was deferred until after the
  effects-readiness await and was rejected by Chromium's autoplay boundary.
  The candidate is **rejected for Tesla testing**. Correction `dcb6801` starts
  incoming playback inside transient transport activation and awaits effects
  readiness in parallel; publication and repeat live proof remain pending.

## Soundtrack row 7 first live candidate — 2026-08-31 12:22

- build stamp: **`20260831-1219`**; deployed source/documentation checkpoint:
  `590ba74`; Soundtrack implementation checkpoint: `2dd3cb5`;
- protected publication: **PASS**. Read-only preflight/postflight passed with
  canonical identity, eight root entries and `remote_writes=NONE`. The
  `--preserve-existing` upload transferred 108 files / 17,008,940 bytes and
  retained the static entry, legacy tree and two prior fingerprinted assets;
- canonical HTTP identity: **PASS**. Bare and cache-busted HTML return `200`,
  no-store/no-cache, `nosniff` and cache `MISS`; HTML, JavaScript
  `assets/index-Cgq3FgyM.js`, and CSS `assets/index-DhhWIT7Y.css` are
  byte-identical at SHA-256 `66a2fa8a906b7a0e2f06414f01b9d2d1fdf3cfece5e22b3e8521aeea51b54714`,
  `a5387afd32cf18a3717ec05cd3de16bb3cdba981ac94132d468d2e469d15a935`,
  and `fb314622b23c83541168621080bf672902ace02c8f8537a2e63f13bb472c6dde`;
- exact live Browser QA: **FAIL for rapid navigation**. At `773 × 601`, real
  Jamendo data, the QR, complete licence card, `48 px` transport and a normal
  NEXT transition all rendered correctly; the fade card showed both CURRENT and
  FADING credits. A later `NEXT → PREVIOUS → NEXT` stress run left the selected
  title/QR on the requested target while the audio-clock card retained the prior
  audible credit after an incoming play failure. The mismatch persisted after
  the nominal fade. Build `20260831-1219` is therefore not approved for the
  evening Tesla queue. Correction `8f03b34` makes queue/credit commit atomic and
  awaits its own publication and repeated live proof.

## Sampled-bank evidence and constrained-network recovery — 2026-08-31 11:49

- build stamp: **`20260831-1143`**; deployed source/documentation checkpoint:
  `d1e3fb0`; audio-evidence implementation checkpoint: `614872b`;
- verification gate: **PASS**. The tracked phase-aware JUNCTION evidence grid
  covers ADSR, filter, phase seed, detune, chorus, spectral slope, saturation
  and stereo coherence. Valid synthetic cases reach `1.0` recall / `0.0`
  false-positive rate, every invalid case explicitly abstains, and complete
  processed mixes remain unauthorized pitch gates. Focused evidence/network
  checks pass `8/8`; the complete suite passes `482/482`, and the 143-module App
  / 68-module LAB / Sites build passes;
- constrained-network recovery: **PASS within the deterministic office
  boundary**. The real `5,812,361`-byte JUNCTION and `5,504,595`-byte
  NIGHTSHIFT banks fit the shared `45 s` budget derived from `1.35 Mbps`,
  `250 ms` RTT and `18%` headroom. Both players abort a genuine stall, state
  the exact timeout, keep a harmonic bed audible, wait ten audio seconds and
  recover without another selection. Bank format and playback rate are
  unchanged;
- guarded publication: **PASS**. Read-only preflight and postflight both report
  network/login/directory/listing/identity PASS, eight expected root entries and
  `remote_writes=NONE`. The protected `--preserve-existing` publication uploaded
  108 files / 16,979,008 bytes, retained the static entry and legacy tree, and
  kept one prior fingerprinted asset for cache overlap;
- canonical HTTP identity: **PASS**. Bare and cache-busted HTML return `200`,
  `text/html`, `no-store, no-cache, must-revalidate, max-age=0`, `nosniff` and
  cache `MISS`; both are byte-identical to local at SHA-256
  `3918327fc364cd6cfffab76512bdd77b566a988a4f37f83ae084fd06b16cfa14`.
  Live JavaScript and CSS return their expected MIME types and are byte-identical
  at `12c989b076f2c59a92ed5b1168d2f5fd390e02b4da8e543c5226ef1e9810bb8f`
  and `9d421d181ec50ea6ca0489727db0dabe88ba071639d55206f8378f7a88282087`;
- exact live Browser QA: **PASS at `773 × 601`**. The cache-busted splash shows
  build `20260831-1143`, loads meaningful content with no framework overlay,
  and emits no warning/error. The complete `PLAY THE ROAD → Play the Road +
  Aperture → START` flow has `773 × 601` document dimensions and zero overflow.
  The running Music drawer changes NIGHTSHIFT to JUNCTION and reports JUNCTION
  `PLAYING`; GPS permission was not accepted during this office-only smoke.
  Real constrained Tesla networking and cabin listening remain rows 16 and 4.

## ATLAS drive corrections and sampled-score calibration — 2026-08-31 11:16

- build stamp: **`20260831-1111`**; deployed implementation checkpoint:
  `ac11ed0`; pre-publication documentation checkpoint: `de62ab7`;
- product change: **PASS within the office boundary**. ATLAS retains the
  complete current-view route through origin-preserving bounded compaction,
  renders one interpolated point with a one-second pulse/ripple, removes the
  moving line highlight, and bounds only its MapLibre framebuffer to `1.25×`.
  GPS presents only `GPS` plus metre accuracy in precise-green,
  imprecise-orange or disconnected-red. JUNCTION and NIGHTSHIFT share the
  measured `0.72` sampled-performance entry gain; FRACTURE remains unchanged;
- verification gate: **PASS**. All 478 tests, the 142-module App / 67-module LAB
  / Sites build, reproducible FFmpeg/EBU R128 public-bank analysis, and exact
  local Browser QA at `773 × 601` pass. The static candidate contains 105 files
  / 16,976,957 bytes;
- guarded publication: **PASS**. Read-only preflight and postflight both report
  network/login/directory/listing/identity PASS, eight expected root entries,
  and `remote_writes=NONE`. Publication used `--preserve-existing`, retaining
  the static entry and legacy tree. The transfer process returned no textual
  file-count summary to this session, so the static candidate count above is
  recorded instead of inventing a transferred-file count;
- canonical HTTP identity: **PASS**. Cache-busted HTML, main JavaScript, CSS,
  ATLAS chunk and MapLibre runtime return `200` with expected MIME types and are
  byte-identical to the verified build. Their matching SHA-256 values are
  `9f7ce3f08a7ad18b478889d4caebd99b10fcc477db6d03be17ad98280144d91e`,
  `5083f08f93eabd29b8ecf50db74273f68eb6e7b08c2d6d8465faa06ac5492473`,
  `9d421d181ec50ea6ca0489727db0dabe88ba071639d55206f8378f7a88282087`,
  `342d285cc8d9473af667c6a63a7f1d08b8659f9a6a59733b48e6c3baa5510553`,
  and `75969ec9f3037f5f6df42b5753d8c6def9de2927831d77fdf734bfee4aa90b58`.
  Root HTML retains `no-store, no-cache, must-revalidate, max-age=0` and
  `nosniff`;
- exact live Browser QA: **PASS at `773 × 601`**. The cache-busted canonical
  build identifies `20260831-1111`; MUTE + ATLAS renders the disconnected red
  `GPS / ±— m` state, one point/ripple, no document overflow, and no observed
  warning/error. Collapsing the passenger panel expands the map to the complete
  `773 × 601`; its `966 × 751` framebuffer proves the intended `1.25×` ceiling.
  Real route continuity, green/orange GPS states, cabin level, touch/thermal
  behavior and stable measured ATLAS 30 FPS remain target-vehicle gates.

## Equal-path Soundtrack library — 2026-08-31 08:59

- build stamp: **`20260831-0853`**; deployed implementation checkpoint:
  `61f356d`; documentation checkpoint before publication: `0e98020`;
- product change: **PASS**. The running Music drawer now switches persistently
  between Play the Road and Soundtrack. Soundtrack gives compact equal hierarchy
  to Illobo Featured and Jamendo Library, rotates its visible mix every 30
  minutes, previews real covers, and starts immediately from passenger pace,
  genre, or exact-track gestures. Fixed recordings remain authored `1×`; MUTE
  and FX remain global across both sources, and FX never suppresses visual macro
  detection. The Illobo mark is explicitly provisional pending the final asset;
- verification gate: **PASS within the local host boundary**. Eighty-nine
  focused Soundtrack/presentation checks, nine Sites checks, thirty-two
  build/deployment/documentation gates, reference/implementation Product Design
  comparison QA, exact local Browser QA at `773 × 601`, and the 141-module App /
  66-module LAB build pass. The complete unit suite passes 426 of 427; only the
  unchanged local `spawn php ENOENT` diagnostic-mail fixture is unavailable;
- guarded publication: **PASS**. Read-only preflight passed with
  `remote_writes=NONE`; the no-delete publisher transferred 108 files /
  16,975,254 bytes, preserved the existing static entry and legacy tree, and
  retained two prior fingerprinted assets for cache overlap. Read-only
  postflight passed with `remote_writes=NONE` and eight expected root entries;
- canonical HTTP identity: **PASS**. Cache-busted live HTML, JavaScript, CSS,
  and provisional Illobo PNG return `200` with their expected MIME types and are
  byte-identical to the verified build. Their SHA-256 values are
  `137fac14a941493db6c30ede7bf804f8a9ff42e1b924592c48dcecb8ca4e3a2a`,
  `ceed11b1c6ab9d7751280c1c2f1887a3bb659b55d55897252ac8d5c7d2953bf4`,
  `0f570ad62fdc4a3d8646cabb8aec2af7524a8235c176431658f9fb54b51ba7c4`,
  and `da6d5086f06dc8a38ea580f3a5c4289363c214cb8736c9e84ffa39a462946e2b`.
  Root HTML carries `no-store, no-cache, must-revalidate, max-age=0`;
- live API boundary: **PASS**. Cache-busted canonical pace `medium` and genre
  `rock` requests each returned six admitted records and echoed only their
  normalized selection metadata;
- exact live Browser QA: **PASS at `773 × 601`**. The complete selected layout,
  real Jamendo metadata/covers, equal alternatives, visible refresh cadence,
  authored `1×` label, pace and genre play actions render without horizontal
  overflow. Evidence:
  `/private/tmp/sedicivalvole-music-drawer-live-773x601.png`. The verified live
  flow emitted no observed warning or error. Physical-Tesla listening, final
  Illobo logo replacement, audible equal-power skips, and QR handoff remain
  open.

## Catalogue display typography — 2026-08-31 03:38

- build stamp: **`20260831-0333`**; deployed source and implementation
  checkpoint: `7656928`;
- product change: **PASS**. The Instrument Deck, running footer, both catalogue
  pickers, source badges, and manual Soundtrack controls use dedicated Title Case
  display labels for editorial names. Compact functional micro-labels remain
  uppercase; stable IDs and canonical uppercase registry labels remain unchanged.
  Footer names and numbers now form one baseline-aligned value at one type size,
  while the disclosure caret remains independently anchored at the far edge;
- verification gate: **PASS within the local host boundary**. Sixty-three focused
  UI/catalogue checks pass. The complete native suite passes 421 of 422 checks;
  only the unchanged local `spawn php ENOENT` diagnostic-mail fixture is
  unavailable. Documentation consistency, the 140-module production build,
  65-module LAB build, protected LAB packaging, and Sites packaging pass;
- guarded publication: **PASS**. Read-only preflight passed with
  `remote_writes=NONE`; the no-delete publisher transferred 107 files /
  16,452,947 bytes, preserved the existing static entry and legacy tree, and
  retained two prior fingerprinted assets for cache overlap. Read-only
  postflight passed with `remote_writes=NONE` and eight expected root entries;
- canonical HTTP identity: **PASS**. Cache-busted live root HTML, JavaScript, and
  CSS are byte-identical to the verified build. Their matching local/live
  SHA-256 values are
  `b8c7161d5317937d1f1b2d7fc29ce5b184df7fd9907e141a8c59facf30cf7f36`,
  `168c538c723ed4ec99abe589d85a7eb3a5aaa52d3b4f6755e8712724e9fe796b`,
  and `edfd79380390f085deebc55c5cd97190568cc9c7b9608ee11a448b7602274b71`;
- exact live Browser QA: **PASS at `773 × 601` and `1280 × 720`**. The
  cache-busted launcher, Visual picker, and Music picker expose readable Title
  Case names. At Tesla size, `Atlas` / `04` and `Fracture` / `◇ 02` are all
  `14 px` at `y = 571.25`; at desktop they are all `17 px` at `y = 686.75`.
  Neither viewport grows the document, and the live page emitted no observed
  warning or error. Physical-Tesla distance legibility remains the perceptual
  acceptance gate.

## Compact footer palette and EFFECTS master — 2026-08-31 03:22

- build stamp: **`20260831-0315`**; deployed source and implementation
  checkpoint: `f5b9ba8`;
- product change: **PASS**. The running footer keeps MUTE and one shared
  `EFFECTS` master adjacent in every music mode. The master gates audible
  OPEN/UNDERWATER/BLOOM processing while vehicle gesture detection and visual
  macro snapshots continue. PLAY THE ROAD starts enabled and SOUNDTRACK retains
  fresh-session opt-in. Both controls announce their state with a centred,
  1.5-second status. The far-right two-row palette is fixed to `138 px` at the
  Tesla breakpoint and `160 px` on desktop;
- verification gate: **PASS within the local host boundary**. Forty-three
  focused runtime/presentation checks pass. The complete native suite passes
  420 of 421 checks; only the unchanged local `spawn php ENOENT`
  diagnostic-mail fixture is unavailable. The 140-module production build,
  65-module LAB build, protected LAB packaging, and Sites packaging pass;
- guarded publication: **PASS**. Read-only preflight passed with
  `remote_writes=NONE`; the no-delete publisher transferred 107 files /
  16,451,993 bytes, preserved the existing static entry and legacy tree, and
  retained two prior fingerprinted assets for cache overlap. Read-only
  postflight passed with `remote_writes=NONE` and eight expected root entries;
- canonical HTTP identity: **PASS**. Cache-busted root HTML, JavaScript, and CSS
  return `200`, proxy `MISS`, the expected MIME types and exact local byte
  lengths. Their live/local SHA-256 values are
  `9ac04aed3f6a49fe1ce280ea160fd2f5c18e130fb7da443dc19f178050583848`,
  `abb48ee0fbc7d3555b524310d4282b32394ccf81ae8abc6f38efee61bb92e1ab`,
  and `1c7f8163d54921a65b4537609c8aa618f4f1a87fe13d0b26e59176afa8efc7e2`.
  Root HTML carries explicit `no-store, no-cache` policy;
- exact live Browser QA: **PASS at `773 × 601` and `1280 × 720`**. The Tesla
  footer is exactly `64 px`, its palette is `138 px` at the right edge and its
  swatches are `15 px` high; desktop retains the same `64 px` footer with a
  `160 px` right-edge palette. Neither viewport grows the document. EFFECTS
  changes `aria-pressed`, audible-master state and `EFFECTS ON/OFF`; MUTE emits
  `VOLUME OFF/ON`. The verified live interaction emitted no warning or error.
  Physical-Tesla audibility, wet balance, glare and touch acceptance remain the
  target-vehicle gate.

## Jamendo SOUNDTRACK production prototype — 2026-08-31 02:58

- build stamp: **`20260831-0249`**; deployed source commit: `9af5156`;
  implementation checkpoint: `7cec946`; live relay corrections: `57fb390` and
  `5c7b0d0`;
- product change: **PASS**. The App and protected owner LAB now prepare three
  transient Jamendo media roles, preserve every fixed recording at authored
  `1×`, expose artist/title/artwork/licence/provider credit and transport, and
  route playback through a same-origin Web Audio graph. `DRIVE FX` controls the
  existing OPEN/UNDERWATER/BLOOM vehicle gestures independently of manual
  flanger, reverb, chorus, and bounded beat repeat. Audio is not persisted or
  offered offline;
- verification gate: **PASS within the local host boundary**. Thirty-nine
  focused SOUNDTRACK integration checks, 42 focused deployment/documentation/
  launcher checks, ten final catalogue/audio-relay checks, both Vite builds,
  protected LAB packaging, and Sites packaging pass. The complete native suite
  passes 418 of 419 checks; only the unchanged local `spawn php ENOENT`
  diagnostic-mail fixture is unavailable;
- guarded publication: **PASS**. Final read-only preflight passed with
  `remote_writes=NONE`; the no-delete publisher transferred 107 files /
  16,449,992 bytes, retained one prior fingerprinted asset for cache overlap,
  did not remove the static entry or legacy tree, and wrote only the canonical
  root. Final read-only postflight passed with `remote_writes=NONE` and eight
  expected root entries;
- canonical HTTP identity: **PASS**. Cache-busted root HTML, JavaScript, and CSS
  return `200` and are byte-identical to the verified build. Their SHA-256
  values are `5283a0af848a3ff22b592814db0a48446293f0464344236428e70d63b7bfeb8b`,
  `be9865e708f17bfcde1a2235fc4a3a55fbb3e7094d7dbdd7036b1e0a49c948e5`,
  and `c1571a14c0f69dc2d1546c13dcd4267ed6626e3b52383bfc287e7fb5212657ba`.
  Root and catalogue responses carry explicit no-store/no-cache policy;
- live API boundary: **PASS**. The canonical catalogue returned three complete
  schema-valid records after the bounded empty-first-page protection. An exact
  admitted track request returned `206`, exactly 1,024 bytes, `audio/mpeg`, a
  `Content-Range`, and explicit no-store/no-cache headers without exposing an
  ID, credential, or upstream audio URL in the evidence;
- live Browser QA: **PASS at the available `1280 × 720` viewport**. A fresh
  cache-busted tab selected SOUNDTRACK + PRTCL, enabled START after preparation,
  played the admitted recording, showed direct artist/licence/Jamendo credit,
  enabled DRIVE FX, exposed all four manual controls, accepted a manual slider
  interaction, and paused cleanly with zero console warning/error. Exact
  `773 × 601` physical-Tesla listening, automatic-effect audibility, wet
  balance, touch ergonomics, and network handoff remain the morning acceptance
  gate.

## Compact Road Sheet lockup and spacing — 2026-08-31 00:14

- build stamp: **`20260831-0006`**; deployed source commit: `1635d6e`;
  implementation checkpoint: `a2bb583`;
- product change: **PASS**. The Road Sheet keeps its approved `724 × 552 px`
  LIGHT anatomy while replacing the separated `112 px` brand band with one
  `72 px` left lockup: the `52 px` 16 Road mark sits beside the `32 px`
  Orbitron wordmark and BACK remains independently anchored at right. Music
  and Visual now share `10 px` card/field padding, `8 px` grid spacing, and a
  `3 px` title/description gap. The selected vermilion rail is `34 × 3 px` at
  `top: 7px` and no longer displaces or crosses its title;
- future-row boundary: **PASS**. The Visual registry continues to derive its
  row count. A temporary, non-committed three-row Browser stress at
  `702 × 546` rendered three exact `90.66 px` tracks inside the fixed `288 px`
  grid with `21.45 px` minimum content clearance, no clipping, no scroll
  growth, and unchanged Music/Visual geometry;
- verification gate: **PASS within the local toolchain boundary**. Twenty-six
  focused presentation/documentation checks, nine Sites checks, sixteen
  deployment-identity checks, and the 130-module production build pass. The
  complete suite retains only the established local `spawn php ENOENT`
  diagnostic-mail fixture limitation;
- guarded publication: **PASS**. Read-only preflight passed with
  `remote_writes=NONE`; the guarded publisher transferred 102 files /
  16,355,793 bytes to the canonical root. Read-only postflight then passed with
  `remote_writes=NONE` and eight expected root entries;
- canonical HTTP identity: **PASS**. Cache-busted HTML returns `200` with
  explicit `no-store` / `no-cache`, `nosniff`, and the selected build stamp.
  Live HTML, JavaScript, CSS, and LIGHT SVG are byte-identical to the clean
  build at SHA-256
  `9b0859bf562b0691c4e3de6e2bd2f1d0e58d48892b4caf2aab79693d19b8d9bc`,
  `d9088b6d245627fc5002b2f958d7e94a186d0e73a1060513ed5cdc3595de6ed5`,
  `1ee235c4db3d6f2cd92a3eab6da1ec568168f9541d4dd096c55f8f45cb050d24`,
  and `210b319522825982589907c213661720abbf7ea94d29b3a53a7fb4a7cec275e5`;
- exact live Browser QA: **PASS at `773 × 601` and the annotated
  `702 × 546` viewport**. At Tesla size, both fieldsets and both grids measure
  `378 px` and `342 px`; selected PLAY THE ROAD and APERTURE keep `27.7 px`
  and `49.63 px` rail/title clearance. At `702 × 546`, both grids remain
  `288 px` and the closest clearance is `11.45 px`. MUTE + APERTURE enters
  `phase-running` with one canvas and no retained launcher. The exact Tesla run
  emits zero warning/error. Physical-Tesla cabin-distance, glare, and touch
  acceptance remain open.

## Road Sheet LIGHT Instrument Deck — 2026-08-30 23:48

- build stamp: **`20260830-2344`**; deployed source commit: `2c36acd`;
  implementation checkpoint: `c89ce51`; exact brand-admission gate: `7be8725`;
  warm-cache recovery: `e914611`;
- product change: **PASS**. Direction 03 Road Sheet now defines the LIGHT
  Instrument Deck and the invariant anatomy for future DARK/AUTO work. The
  `724 × 552 px` open sheet carries the LIGHT 16 Road mark, centered Orbitron
  wordmark, hairline structure, quiet-gray controls, vermilion state rails and
  one black START field. Music and Visual grids both measure exactly `280 px`;
  the registry-derived Visual row count can add a third compact row without
  moving START or changing the launcher height;
- verification gate: **PASS within the local toolchain boundary**. The joined
  selected-reference/current-render and selected-reference/canonical Product
  Design comparisons retain no P0/P1/P2 mismatch after the cache correction.
  Twenty-two focused cache/launcher/brand checks, sixteen deployment-identity
  checks, nine Sites checks and the 130-module production build pass. The
  complete suite passes 345 of 346 checks; only the known local
  `spawn php ENOENT` diagnostic-mail fixture is unavailable;
- guarded publication: **PASS**. The first read-only preflight safely rejected
  the intended dark-to-light stable SVG mismatch with no remote write. The
  exact-hash brand gate then admitted only the prior and selected SVG masters.
  Build `20260830-2334` transferred 102 files / 16,355,716 bytes and exposed the
  browser warm-cache issue without a server-identity defect. The superseding
  cache-safe build `20260830-2344` transferred 102 files / 16,355,725 bytes;
  final read-only postflight passes with `remote_writes=NONE`;
- canonical HTTP identity: **PASS**. Cache-busted HTML returns `200`, explicit
  `no-store` / `no-cache`, `nosniff`, and proxy `MISS`. Live HTML, JavaScript,
  CSS, and LIGHT SVG are byte-identical to the clean build at SHA-256
  `f8ae2f573b0be6368a629e8caee5fc7862685fbf79a74eecaefad999f6481697`,
  `3cd0b1cbdf5740bfb1936ff7a4ac007093cfc419c9eba2ec39dd9036a667acde`,
  `daa8b0d86b06974b1e6279741e341b95a2aff31d52b25bb71fd976ef45853433`,
  and `210b319522825982589907c213661720abbf7ea94d29b3a53a7fb4a7cec275e5`;
- exact warm-cache live Browser QA: **PASS at `773 × 601`**. The same browser
  session that had rendered the old dark master loads
  `/brand/sedicivalvole-mark.svg?build=20260830-2344` at natural `512 × 512`
  and displays the correct LIGHT mark without a black plate. The sheet is
  `724 × 552 px`; Music and Visual share `y=195.5–475.5` and `280 px` height;
  PLAY THE ROAD + APERTURE enable START; MUTE + APERTURE enters the running
  canvas; the document has zero overflow and the console has zero warning/error.
  Physical-Tesla cabin-distance, glare and touch acceptance remain open.

## 16 Road launch lockup and Orbitron wordmarks — 2026-08-30 22:51

- build stamp: **`20260830-2243`**; deployed source commit: `a4d34c8`;
  implementation checkpoint: `3f45354`;
- product change: **PASS**. The approved 16 Road SVG now sits to the left of the
  textual home wordmark inside one `360 × 160 px` launch action. The mark renders
  at `42 × 42 px`; the exact word `sedicivalvole` uses Orbitron `750` with
  `-0.02em` tracking on Signal Gate, Instrument Deck, the running top bar and
  owner LAB only. `PLAY THE ROAD`, controls, telemetry, REPORT and reading copy
  remain Space Grotesk;
- verification gate: **PASS within the local toolchain boundary**. Twenty-eight
  focused splash, brand and LAB checks, forty-one broader presentation and
  documentation checks, nine Sites checks and the 130-module production build
  pass. The complete suite passes 345 of 346 checks; only the known local
  `spawn php ENOENT` diagnostic-mail fixture is unavailable;
- publication boundary: **PASS**. Read-only identity verification passed before
  the guarded publication. The publisher transferred 102 files / 16,352,366
  bytes, retained the expected fingerprinted cache overlap and performed no
  legacy deletion;
- canonical HTTP identity: **PASS**. Cache-busted HTML returns `200`, explicit
  `no-store` / `no-cache`, `nosniff`, and proxy `MISS`. Live HTML, CSS,
  JavaScript, Orbitron WOFF2 and 16 Road SVG are byte-identical to the verified
  build at SHA-256
  `749e2052dca51ea4272ace857e05c077fa3ba4500fa299f6c113a3ea7eed874e`,
  `a1fa0325d6fd43fc38d3db89c477c5e9612d4c25abd2798f79b40ac99e6194b3`,
  `7b89fea5c5ffb4f17f958cc3e9ac892cec11b0951b5c54fff74b2b8a45172d5c`,
  `c25a9f9da5d9f3db1bf2a01474722dc9b377675b7bbab6d0dfda6902794fd1ed`
  and `e47522c4166f6c4f7e8e978b09b9fd2e2835f438732cf67004aede57ff0d8ace`;
- exact live Browser QA: **PASS** at `773 × 601`. The canonical splash reports
  build `20260830-2243`; the launch action computes to `360 × 160 px`, the
  complete SVG reports a `512 px` natural width and renders at `42 px`, the home
  wordmark computes Orbitron `750` with `-0.64 px` tracking, and the page has no
  horizontal overflow. Signal Gate → Instrument Deck → MUTE + APERTURE → START
  succeeds; deck and top-bar wordmarks remain isolated Orbitron treatments, and
  the live page emits no warning or error. Physical-Tesla cabin-distance
  acceptance remains open.

## REPORT top-bar control — 2026-08-30 22:21

- build stamp: **`20260830-2216`**; deployed source commit: `50e837d`;
  implementation checkpoint: `4f3d715`; deployment-diagnostic follow-up:
  `8105c66`;
- product change: **PASS**. The opaque `DIAG` abbreviation is replaced by the
  explicit `REPORT` label with the pinned Tabler `report-analytics` outline
  above it. The real Tesla allocation remains `54 × 67 px`; GPS, telemetry,
  mode switching and the footer do not move, and the page has zero horizontal
  or vertical overflow at `773 × 601`;
- accessibility and interaction: **PASS**. The control exposes `Open session
  report` and dialog semantics, opens the existing `Session report`, places
  initial focus on `Close session report`, and returns focus to the exact
  REPORT trigger when closed. The visible label removes any dependency on a
  tooltip or icon recognition;
- licence boundary: **PASS**. The official Tabler Icons `3.46.0`
  `report-analytics` SVG ships byte-identically at 618 bytes and SHA-256
  `d58847492f890b8beedc7eff543860219e0f382e46d2c2695107d64ae434b9ba`;
  its complete 1,073-byte MIT licence is packaged beside it and the source is
  recorded in `THIRD_PARTY_NOTICES.md`;
- verification gate: **PASS within the local toolchain boundary**. Sixty-two
  focused presentation, ATLAS, launcher, documentation and Sites checks, the
  16 deployment-identity checks, the nine post-build Sites checks, the
  130-module production build and same-input Product Design comparison pass.
  The complete suite retains only the known local `spawn php ENOENT`
  diagnostic-mail fixture;
- publication boundary: **PASS**. The read-only preflight passed and the
  guarded publication completed. The first immediate postflight observed a
  transient third-party content mismatch; with no intervening remote write, a
  repeated read-only identity check passed. Follow-up `8105c66` now includes
  the safe relative path in any future static-tree mismatch while preserving
  the fail-closed gate;
- canonical HTTP identity: **PASS**. Cache-busted HTML returns `200`, 1,095
  bytes, explicit `no-store` / `no-cache`, `nosniff`, and proxy `MISS`. Live
  HTML, JavaScript, CSS, Tabler SVG and Tabler licence are byte-identical to the
  verified build at SHA-256 `697b9fb3eedb16887f5c2fea6afb42bd18c4ff3735304dfb94b3de8a3da26e20`,
  `81a424c1c0cac492a520a728e125d01c42d594a2f90e21c5ed64d9897a2c9d61`,
  `8165f51161b58c3db1c640752fe8784b0dde48a383263fcf21633c2234bdc2ac`,
  `d58847492f890b8beedc7eff543860219e0f382e46d2c2695107d64ae434b9ba`,
  and `b740a1d46122672da62833e97f7e7c8a13fa85cbc7445b584b297cc00dde93db`;
- exact live Browser QA: **PASS** at `773 × 601`. The canonical splash reports
  build `20260830-2216`; MUTE + APERTURE reaches the running surface, loads the
  24-unit SVG, renders REPORT in its 54 px cell, opens and closes the report
  with correct focus restoration, records commit `50e837d`, and emits no
  browser warning or error. Physical-Tesla cabin-distance acceptance remains
  open.

## Instrument Deck section-label spacing — 2026-08-30 21:32

- build stamp: **`20260830-2128`**; deployed source commit: `18aed57`;
  implementation checkpoint: `3d38b9c`;
- visual change: **PASS**. Both Instrument Deck fieldsets now use `16 px` top
  padding while retaining `11 px` on the other edges, giving aligned `MUSIC`
  and `VISUAL` labels more air without changing card dimensions;
- verification gate: **PASS**. All 19 focused splash/launcher checks, all 9
  Sites checks, the 130-module production build, and annotated in-app Browser
  QA at `1297 × 933` pass. Exact live `773 × 601` QA confirms both computed
  top paddings, zero document overflow, complete launcher content, and no
  console warning or error;
- publication boundary: **PASS**. Read-only preflight, 99-file /
  16,321,766-byte guarded publication, and read-only postflight pass, with
  `remote_writes=NONE` after publication;
- canonical HTTP identity: **PASS**. Cache-busted HTML returns `200`, 1,095
  bytes, explicit `no-store` / `no-cache`, `nosniff`, and proxy `MISS`. Live
  HTML and CSS are byte-identical to the verified build at SHA-256
  `9f36131acf2e7cbb64308ed0ad5ffffe6fd78153e789f16145ecf86d89680a6a`
  and `642200d975c169012cdc7161c467e1ad9f40eee73f94cef728786bdda7a18864`.

## Space Grotesk and persistent palette accent — 2026-08-30 21:21

- build stamp: **`20260830-2117`**; deployed source commit: `55d72c4`;
  typography/persistence implementation checkpoint: `2befcc0`; documentation
  checkpoint: `030ef49`;
- verification gate: **PASS within the local toolchain boundary**. All 47
  focused typography, splash, diagnostic, LAB, and deployment-identity checks,
  all 9 Sites checks, both production builds, and 343 of 344 complete-suite
  checks pass. The sole unavailable check is the known local
  `spawn php ENOENT` diagnostic-mail fixture;
- typography: **PASS**. One locally hosted Space Grotesk version 2.000 variable
  TrueType file now carries every live product, LAB, and DIAG surface. Orbitron
  remains credited only for the outlined 16 Road logo asset, and IBM Plex Mono
  is no longer shipped in the current build;
- preference boundary: **PASS**. The active visual palette owns the interface
  accent through `data-palette` and remains an optional versioned local
  preference across reloads and later visits. Future `LIGHT`/`DARK`/`AUTO`
  appearance remains separate and both axes retain an explicit reset path;
- publication boundary: **PASS after one fail-closed preflight follow-up**. The
  first read-only preflight rejected four retired font files retained remotely
  for cache overlap. Follow-up `55d72c4` admits only those exact names and
  SHA-256 identities; arbitrary or modified font files still fail closed. The
  repeated preflight, 99-file / 16,321,756-byte guarded publication, and
  read-only postflight pass, with `remote_writes=NONE` after publication;
- canonical HTTP identity: **PASS**. Cache-busted HTML returns `200`, 1,095
  bytes, explicit `no-store` / `no-cache`, `nosniff`, and proxy `MISS`, and is
  byte-identical to the verified local build at SHA-256
  `77ba838030eb7b3003bb4436a47f09733919f862e3e17127b60a8a248b65d343`.
  The live CSS and Space Grotesk font also match locally at
  `726a0552f99b8ab70334aabf5e791251604fcd317c698888f7d90943907aa516`
  and `acad6de1fc93436f5c0f1f4137751ef04f1aea3063e7036535970ffcfbd79f72`;
- exact live Browser QA: **PASS** at `773 × 601`. The splash and complete
  Music/Visual launcher have zero page overflow, compute Space Grotesk at the
  intended `700` launcher-heading weight, preload the canonical local font,
  expose palette `signal`, and report no console warning or error. Physical
  Tesla typography acceptance remains open.

## Independent LAB audio and PRTCL response — 2026-08-30 20:59

- build stamp: **`20260830-2055`**; deployed source commit: `2a65cca`;
  response/audio implementation checkpoint: `a40cfff`; documentation checkpoint:
  `3aac8e8`;
- verification gate: **PASS within the local toolchain boundary**. All 13
  focused PRTCL checks, all 11 LAB/control checks, all 9 Sites checks, both
  production builds, and the documentation consistency gate pass. The complete
  suite retains only the known local `spawn php ENOENT` diagnostic-mail fixture;
- behavior: **PASS**. PRTCL complete-form and point scale respond to road speed,
  while OPEN, UNDERWATER and BLOOM use continuous frame-rate-independent
  transitions. LAB exposes MUTE/FRACTURE/JUNCTION/NIGHTSHIFT as an independent
  disposable audio bench; visual presets and JSON contain no music association;
- publication boundary: **PASS after one fail-closed follow-up**. The first
  postflight rejected the two newly packaged stable-name AudioWorklet files
  because the remote identity gate had not admitted them. Follow-up `2a65cca`
  added explicit processor-name and runtime-marker recognition plus regression
  coverage. Repeated read-only preflight, guarded publication, and read-only
  postflight then passed with `remote_writes=NONE`;
- authenticated canonical Browser QA: **PASS**. `/lab/` reports build
  `20260830-2055`, all 18 visual/test options remain present, FRACTURE starts as
  independent test audio, MUTE restores the manual AUDIO signal and reports
  `visual preset unchanged`, and the console contains no warning or error.
  Physical-Tesla acceptance remains open.

## Stable owner LAB renderer and keyboard motion — 2026-08-30 20:15

- build stamp: **`20260830-2011`**; deployed source commit: `6893cd3`;
  renderer/keyboard implementation checkpoint: `8c37956`;
- verification gate: **PASS within the local toolchain boundary**. All 17
  focused PRTCL/LAB checks, the 130-module main build, the 33-module protected
  LAB build, and 340 of 341 complete-suite checks pass; only the known local
  `spawn php ENOENT` diagnostic-mail fixture is unavailable;
- renderer lifecycle: **PASS**. Fractal, Murmuration, Axiom, macro, scene and
  signal changes preserve one live WebGL2 renderer instead of repeatedly
  destroying contexts until shader compilation fails white;
- keyboard motion: **PASS**. `ArrowUp` uses the shared production acceleration
  curve, release enters regenerative deceleration, and `ArrowDown` / `Space`
  use service braking; slider, select and button focus remain isolated;
- publication boundary: **PASS**. Read-only preflight passed, guarded
  publication transferred 99 files / 16,115,195 bytes, retained one previous
  content-addressed asset for cache overlap, and read-only postflight passed
  with `remote_writes=NONE`;
- canonical HTTP: **PASS**. The cache-busted root, fingerprinted JavaScript and
  protected `/lab/` route return `200`; the root and LAB send explicit
  `no-store` / `no-cache` headers, and the LAB retains CSP, `DENY` framing,
  strict same-site session and `nosniff` headers;
- JavaScript: `index-D-MQ2_JI.js`, 456,114 bytes, SHA-256
  `50465cf5dcb48337033954883cc5ebd323926e5aec4cb00e3eb5ca498bb7da4d`,
  byte-identical local/live;
- authenticated live Browser QA: **PASS** at the available `1280 × 720`
  viewport. Build `20260830-2011` survives the complete
  Murmuration → Axiom → Fractal switch, BLOOM, brake and accelerator-release
  sequence with a visible non-white canvas, zero page overflow and zero console
  warning/error. The Browser viewport override remained `1280 × 720`, so a new
  exact `773 × 601` capture and physical-Tesla acceptance remain open.

## 16 Road browser-identity publication — 2026-08-30 19:59

- build stamp: **`20260830-1953`**; deployed source commit: `b06e969`;
  identity implementation checkpoint: `c28fa9a`; publication-gate follow-up:
  `da6d97f`;
- verification gate: **PASS within the local toolchain boundary**. Both focused
  brand checks, all 17 focused brand/deployment checks, the 130-module
  production build, and 338 of 339 complete-suite checks pass; only the known
  local `spawn php ENOENT` diagnostic-mail fixture is unavailable;
- publication boundary: **PASS after one fail-closed follow-up**. Read-only
  preflight passed, then guarded publication transferred 99 files / 16,109,834
  bytes and retained one previous content-addressed asset for cache overlap. The
  first postflight correctly rejected the newly introduced `brand/` root because
  it was not yet an explicit identity-gate target. Follow-up `da6d97f` added
  byte-for-byte static-tree verification for that exact directory; all 17
  focused checks and the repeated read-only postflight pass with
  `remote_writes=NONE`;
- canonical root identity: **PASS**. Cache-busted HTML returns `200`, explicit
  `no-store` / `no-cache`, `nosniff`, and proxy `MISS`; its 1,100 bytes are
  byte-identical to the local entry at SHA-256
  `3d7f6388fcebc1ec14996358d48f23855a4e24d8543ac34d89c521526f31591e`;
- browser identity: **PASS**. Live build `20260830-1953` exposes SVG, 32 px PNG,
  ICO, and 180 px Apple touch metadata with zero page overflow. The canonical
  SVG, favicon PNG, and touch PNG are byte-identical to the local build at
  `e47522c4166f6c4f7e8e978b09b9fd2e2835f438732cf67004aede57ff0d8ace`,
  `7bb0bb0dc97d145b4bd30ebbae7e7db4ab40e31dce64e0afdc7095abe5235c2d`,
  and `bc7d754e0009308fc9a8ad079d7dc9b461fa45f072292d3f2f21f83c7dfa9913`.
  The existing textual splash mark is intentionally unchanged pending a
  separate owner-visible composition review.

## Instrument Deck and SOUNDTRACK policy publication — 2026-08-30 19:39

- build stamp: **`20260830-1935`**; deployed source commit: `9856277`;
  launcher implementation checkpoint: `bbc9f19`; SOUNDTRACK admission
  checkpoint: `ad3127d`;
- verification gate: **PASS within the local toolchain boundary**. All 33
  focused launcher/environment/source-policy checks and the 130-module
  production build pass. The complete suite passes 336 of 337 checks; only the
  known local `spawn php ENOENT` diagnostic-mail fixture is unavailable;
- publication boundary: **PASS**. Read-only preflight and immediate postflight
  reported network, login, canonical directory, remote listing, and identity
  PASS; both no-write checks reported `remote_writes=NONE`. Publication
  transferred 93 files / 16,060,225 bytes through the guarded dynamic-root
  workflow and retained two previous content-addressed assets for cache overlap;
- canonical root identity: **PASS**. Cache-busted HTML returns `200`, explicit
  `no-store` / `no-cache`, `nosniff`, and proxy `MISS`; its 788 bytes are
  byte-identical to the local entry at SHA-256
  `b55c804d8bbb51f318c2c914e55f222cc62de461b2048514caa4ef997b7693b2`.
  Main JavaScript and CSS are byte-identical at
  `78962d6fee77eac64ee359deff8b168d5ae585daf9af88fb34d0f1531a3027e0`
  and `b1c57503972df566522ed5a33750e657854ee471becec03e4a4f34380635f3bc`;
- exact live viewport: **PASS at `773 × 601`**. The canonical splash identifies
  build `20260830-1935` with zero page overflow. Instrument Deck measures
  `690 × 405 px` at `(41.5, 98)`, keeps START disabled before both choices, and
  computes `6 px` radii for every tested framed surface. Selecting MUTE + PRTCL
  enables START and enters PRTCL muted with no selector residue or overflow.
  The verified live launcher remains open in the in-app browser for owner review.

## Protected owner LAB publication — 2026-08-30 18:34

- build stamp: **`20260830-1828`**; deployed source commit: `9d82df2`;
  implementation checkpoint: `cfd27dc`;
- verification gate: **PASS within the local toolchain boundary**. The complete
  native suite passes 327 of 328 checks; only the known local `spawn php ENOENT`
  diagnostic-mail fixture is unavailable. All 18 focused LAB/deployment checks,
  all 14 DRIVEY/integrity checks, the 130-module main build and the 43-module
  protected inline LAB build pass;
- publication boundary: **PASS**. Read-only preflight and immediate postflight
  reported network, login, canonical directory, remote listing and identity PASS;
  both no-write checks reported `remote_writes=NONE`. Publication transferred
  93 files / 16,447,876 bytes through the guarded dynamic-root workflow. The
  local output contained only the current referenced bundle before upload;
- canonical root identity: **PASS**. Bare/cache-busted HTML returns `200` with
  `no-store`, `no-cache` and `nosniff`, and is byte-identical to the local entry
  at SHA-256
  `ceed02ec4d1059dcb520c996f468e495394b4c33fecf599c4f62ff1e3008db35`.
  Main JavaScript and CSS are byte-identical at
  `7b28aaeb4146b4a26f57b245e7bf65e200a88bcd9beac8a37fb913f317ff1d9a`
  and `c79a61df7c551f34ebaf6b5e31f61b9c901911d989921898e80f06018fb2fd32`;
- unauthenticated LAB boundary: **PASS**. Canonical `/lab/` returns only the
  owner-code form with no script tag, protected boot object or runtime root.
  Direct `bootstrap.php` returns `404`; unauthenticated `send.php` returns `401`.
  Response headers include no-store/no-cache, `nosniff`, same-origin referrer,
  frame denial, a secure HttpOnly SameSite-Strict `/lab/` session cookie and a
  nonce CSP whose default source is `none`;
- exact live viewport: **PASS for the login surface**. At `773 × 601`, the form
  measures exactly the viewport with no horizontal or vertical overflow and the
  expected accessible textbox and action. Authenticated Focus Canvas behavior,
  logout/session expiry, explicit mail handoff and real-Tesla physical acceptance
  remain open until the owner completes the protected login.

## Phase 1 shared response and DRIVEY publication — 2026-08-30 17:15

- build stamp: **`20260830-1707`**; deployed source commit: `656a07d`;
  implementation checkpoint: `7989443`;
- verification gate: **PASS within the local toolchain boundary**. The complete
  native run passes 319 of 320 checks; only the known local `spawn php ENOENT`
  fixture is unavailable. All 9 Sites checks pass and the production build
  completes with 130 modules. Deterministic checks cover T1 scalar/vector
  mapping, 30/60/120 FPS invariance, slew/no-overshoot behavior, timestamped
  audio macros, DRIVEY's 600-frame zero hold, resume without reposition,
  opposing-only placement, fail-closed zero traffic and all 51 upstream hashes;
- publication boundary: **PASS**. Read-only preflight and immediate postflight
  reported network, login, canonical directory, remote listing and identity
  PASS with `remote_writes=NONE`. Publication transferred 89 files /
  15,780,313 bytes through the guarded dynamic-root workflow;
- canonical identity and headers: **PASS**. Bare and
  `?build=20260830-1707` HTML return `200`, explicit
  `no-store, no-cache, must-revalidate, max-age=0`, `pragma: no-cache` and
  `X-Content-Type-Options: nosniff`. Both are byte-identical to the local entry
  at SHA-256
  `e5369a1d3ae7215238804c16f5afe74fd44aed26c9514921ad94279283b8dab0`;
- asset identity: **PASS**. The local/live main JavaScript, CSS and project-owned
  Drivey shell are byte-identical at SHA-256
  `9377588f5fb25320fdf94433107f63df28f05e72a61401cb4b3b476d4fd9ec38`,
  `c79a61df7c551f34ebaf6b5e31f61b9c901911d989921898e80f06018fb2fd32`
  and `377939a7a175b528e4988a30ca279a35c9acca68a5ec386360fc865286e4b966`;
- muted live product QA: **PASS within the technical contract**. Exact
  `773 × 601` launch and DRIVEY selection report version `0.0.0`, source
  `656a07d`, build `20260830-1707`, a ready original Drivey iframe, a centred
  zero-speed road view, no horizontal overflow and zero browser warning/error.
  Real-Tesla zero-hold, motion resume, lane-direction traffic and cabin
  perception remain the acceptance boundary.

## Phase 0 and M13 publication — 2026-08-30 16:47

- build stamp: **`20260830-1643`**; deployed source commit: `7a026e4`;
  implementation checkpoint: `2642a4a`;
- verification gate: **PASS**. Thirty-seven focused diagnostics, presentation,
  documentation and visual-registry checks pass. The complete native suite
  passes 312 of 313 checks; only the known local `spawn php ENOENT` fixture is
  unavailable. The production build completed with 129 modules using the
  architecture-specific cache without rewriting Dropbox-shared dependencies;
- publication boundary: **PASS**. Read-only preflight and immediate postflight
  reported network, login, canonical directory, remote listing and identity
  PASS with `remote_writes=NONE`. Publication transferred 89 files /
  15,771,162 bytes through the guarded dynamic-root workflow;
- canonical identity and headers: **PASS**. Bare and
  `?build=20260830-1643` HTML return `200`, explicit
  `no-store, no-cache, must-revalidate, max-age=0`, `pragma: no-cache` and
  `X-Content-Type-Options: nosniff`. Both are byte-identical to the local entry
  at SHA-256
  `7673f5e78efe43ef30003511b2f879ea1806faa4f5f07e357dbaee58f041e5e6`;
- asset identity: **PASS**. The local/live main JavaScript and CSS are
  byte-identical at SHA-256
  `07ead922163d4625a3e9f835dbef9262a12d9a258deb2c3ab58f90c8e5f5c6ec`
  and `c79a61df7c551f34ebaf6b5e31f61b9c901911d989921898e80f06018fb2fd32`;
- muted live product QA: **PASS within the technical contract**. Exact
  `773 × 601` launch reports version `0.0.0`, source `7a026e4`, build
  `20260830-1643`, no horizontal overflow, and a six-item Visual library with
  APERTURE, VERTIGO, MERIDIAN, ATLAS, DRIVEY and PRTCL but no PRIMORDIAL. DIAG
  exposes output latency, observed data, current/peak rates, the persistent
  canary and contextual long tasks with zero browser warning/error. Real-Tesla
  persistence, network, long-task and physical-layout acceptance remain open.

## enuzzo identity correction publication — 2026-08-30 14:34

- build stamp: **`20260830-1427`**; deployed source commit: `6326b52`;
  implementation checkpoint: `d90fd33`;
- verification gate: **PASS**. Twenty focused identity/documentation checks
  passed. The complete suite passed all 351 checks available on this Intel Mac;
  the sole unavailable fixture is the known local PHP executable requirement.
  The production build completed with 132 modules. Architecture-specific
  esbuild and Rollup binaries were supplied from `/private/tmp` without
  replacing the Dropbox-shared `node_modules` tree;
- publication boundary: **PASS**. Read-only preflight and immediate postflight
  reported network, login, canonical directory, remote listing and identity
  PASS with `remote_writes=NONE`. Publication uploaded 90 files / 15,774,999
  bytes, passed the dynamic-root and exact legacy-cleanup gates, and retained
  one previous content-addressed asset for cache overlap;
- canonical identity and headers: **PASS**. Bare and
  `?build=20260830-1427` HTML return `200`, 788 bytes,
  `no-store, no-cache, must-revalidate, max-age=0`, `pragma: no-cache`,
  `X-Content-Type-Options: nosniff` and proxy cache `MISS`. Both are
  byte-identical to the local entry at SHA-256
  `ae2431a1824bb774b57cd72b6ebe1fe6a2669827bab2d5dc7d44a5fbd71740d3`;
- asset identity: **PASS**. The local/live main JavaScript bundle is
  byte-identical at SHA-256
  `b387a359ac3446d68b43c0bf4be074365cbfabf151edf8f1facc3c86bc7812d0`;
  the verified local CSS is
  `02a4ab3b626e9d0ce40b425650872f7163a01ee5d978ab1486d2ed0f3a265cf7`;
- muted local and live product QA: **PASS within the technical contract**. At
  exact `773 × 601`, the Signal Gate displayed `A project by enuzzo`, linked
  to `https://github.com/enuzzo`, contained no retired studio identity, and
  produced zero browser warning/error. Launch dismissed the gate and exposed
  DIAG successfully. This text-only identity correction did not require a new
  real-Tesla acceptance run.

## PRIMORDIAL and OPEN publication — 2026-08-30 00:43

- build stamp: **`20260830-0038`**; deployed source commit: `44a3a42`;
  PRIMORDIAL implementation `9b733f6`; OPEN correction `ca5ffe9`;
- gate before upload: **PASS**. The clean pushed source matched `origin/main`,
  all 351 tests passed, and the 132-module build embedded version `0.0.0`,
  commit `44a3a42` and build `20260830-0038`;
- publication boundary: **PASS**. Both read-only preflight and immediate
  postflight reported network, login, canonical directory, remote listing and
  identity PASS with `remote_writes=NONE`. Publication uploaded 90 files /
  15,775,006 bytes, passed dynamic-root and exact legacy-cleanup gates, and
  retained two previous content-addressed assets for cache overlap;
- canonical identity and headers: **PASS**. Bare and
  `?build=20260830-0038` HTML return `200`, 788 bytes,
  `no-store, no-cache, must-revalidate, max-age=0`, `pragma: no-cache`,
  `X-Content-Type-Options: nosniff` and proxy cache `MISS`. Both are
  byte-identical to the local entry at SHA-256
  `0a95a3623264faae4c70bed624a617c1ab7ed5e0e15932353ecbd4087ccd1d8e`;
- asset identity: **PASS**. The local/live main JavaScript, PRIMORDIAL chunk and
  CSS are byte-identical at SHA-256
  `002dfcb451051290e856cb0ec6a023d9bfc4e2d4c031e8e80cadc708a37217f8`,
  `eef0159bf2293eaf8e279ddf7a01e2276972c725798e9e13128cc2025222288b`,
  and `02a4ab3b626e9d0ce40b425650872f7163a01ee5d978ab1486d2ed0f3a265cf7`;
- muted live product QA: **PASS within the technical contract**. At exact
  `773 × 601`, PRIMORDIAL 08 selected successfully, its Scale/Flow/Warp tuner
  opened with the authored defaults, Palette changed to MINT 07, and Browser
  logs contained zero warning/error. DIAG reported `WebGL2 · Primordial fluid
  field`, 59.63 FPS / 18.2 ms p95, zero runtime issues, output muted, and
  identity `v0.0.0 · 44a3a42 · build 20260830-0038`. Real-Tesla motion, touch,
  thermal and listening acceptance remain open.

## PRTCL approval and integrated recovery publication — 2026-08-29 23:37

- build stamp: **`20260829-2337`**; deployed source commit: `b88070c`;
  PRTCL implementation checkpoint: `9f177fa`; integrated recovery checkpoints:
  ATLAS desktop input `fe2a9a5`, DRIVEY automatic steering / dual palettes and
  WAKE retirement `633d526`, bounded bridge-gate correction `f616bd9`;
- gate before upload: **PASS**. The clean source matched `origin/main`, all 51
  upstream Drivey manifest entries remained byte-identical, 10 DRIVEY, eight
  PRTCL, nine NIGHTSHIFT, 303 unit and nine Sites checks passed (339 total), and
  the 128-module build identified version `0.0.0`, commit `b88070c` and build
  `20260829-2337`;
- publication boundary: **PASS**. The read-only preflight reported network,
  login, directory, listing and remote identity PASS with
  `remote_writes=NONE`. The final upload wrote 89 files / 15,756,155 bytes,
  passed dynamic-root and exact-cleanup gates, retained one prior
  content-addressed asset for cache overlap, and the post-publication identity
  gate again returned `remote_writes=NONE`;
- corrective cache boundary: the preceding `a20ff9b` upload was complete over
  FTP, but an uncached HTTPS request to the project-owned Drivey shell still
  received the provider's old response while a cache-busted request received
  the current file. That upload was not accepted as final. Commit `b88070c`
  appends the build stamp to the Drivey iframe URL without modifying any vendor
  file; the complete build was republished and the cache-busted shell now
  matches the local build exactly;
- canonical identity and headers: **PASS**. Bare and
  `?build=20260829-2337` HTML return `200`, explicit
  `no-store, no-cache, must-revalidate, max-age=0`, `pragma: no-cache` and
  `X-Content-Type-Options`; both are byte-identical to the local entry at
  SHA-256 `18232734ebe1fcd3d6744dbf1f4cb928a01ce57471acab32cf8a81e0138a9a61`;
- asset identity: **PASS**. The local/live main bundle, Drivey shell and lazy
  ATLAS chunk match at SHA-256
  `23e78e98805628a7110638cfeb043389a894631f76fa14af83373d5d4e1c1505`,
  `377939a7a175b528e4988a30ca279a35c9acca68a5ec386360fc865286e4b966`,
  and `607d6e7fe2f062fdfa611b78987934833ac027f0a7f750f2b232965056b85bea`.
  CSS, both worklets, upstream Drivey runtime, manifest and three.js module also
  match the verified local build;
- muted live product QA: **PASS within the technical contract**. At exact
  `773 × 601`, PRTCL cycled Fractal → Murmuration → Axiom, Palette changed
  independently to BLUE 04, TYPE measured `94 × 34 px`, the DOM contained zero
  `select` elements, the Visual catalog contained six entries and no WAKE, and
  Browser logs contained zero warning/error. Drivey's iframe source was exactly
  `/third-party/drivey/sedicivalvole.html?build=20260829-2337`; Normal/Wire
  cycled directly and DIAG reported `WebGL · Original Drivey · Wireframe`,
  59.42 FPS / 17.6 ms p95, zero runtime issues, output muted, and identity
  `v0.0.0 · b88070c · build 20260829-2337`. The PRTCL live capture is
  `prtcl-live-axiom-blue-b88070c-773x601.png` in the recovery visualization
  folder. Real-Tesla touch, motion comfort, frame pacing and thermal acceptance
  remain open.

## Source-faithful DRIVEY recovery — 2026-08-29 21:13

- build stamp: **`20260829-2110`**; deployed source commit: `ba215be`;
  implementation checkpoint: `2b9e724`;
- gate before upload: **PASS**. The checkout was clean, `main` matched
  `origin/main`, every one of the 51 Drivey manifest entries passed SHA-256
  verification, all six WAKE, nine DRIVEY, nine NIGHTSHIFT, 302 unit and nine
  Sites checks passed (335 total), and the 128-module production build embedded
  version `0.0.0`, commit `ba215be` and build `20260829-2110`;
- correction boundary: the first upload used the previously verified bundle
  from implementation commit `2b9e724`. Its embedded identity exposed the
  mismatch before final acceptance. The bundle was rebuilt from `ba215be`, its
  identity was inspected locally, and a fresh read-only preflight passed before
  the corrective publication. The transient upload is not the accepted live
  checkpoint;
- final publication: **PASS**. The 89-file / 15,746,290-byte upload passed the
  dynamic-root and exact legacy-cleanup gates and retained one prior
  content-addressed asset for cache overlap. The post-publication FTP identity
  gate returned network/login/directory/listing PASS and
  `remote_writes=NONE`;
- canonical identity and cache behavior: **PASS**. Bare and
  `?build=20260829-2110` HTML return `200`, 788 bytes,
  `no-store, no-cache, must-revalidate, max-age=0`, `pragma: no-cache`, and
  cache `MISS`. Both responses are byte-identical to the local entry at SHA-256
  `a0a1927c7ae969e86d8ea21bbcf34155cfa3878c76e1aa14157f79ea1f73bf69`;
- asset identity: **PASS**. The live main JavaScript, CSS, score worklet, BLOOM
  worklet, Drivey integration shell, Drivey runtime entry, upstream manifest and
  bundled three.js module are byte-identical to the local build at SHA-256
  `5f9bcca8f4aed8c045972e892ec22f367d4ff1139f6444314c6d32a954084b99`,
  `45c422bbd8e9002795cee095346164e17bc8a76ad3a15b07516a09d0087757f6`,
  `16887bddb25913752562789b286612c7e2ed659e4eddf2d3539153cdf06015c8`,
  `0b0aabb6312de3934bdf952e33b610be08a8f38cc12cb23e1676edd02fc2610a`,
  `bd04a170db990106ca77422cd06294213b15b1fd6620947c639d9e07ba7ffcf3`,
  `0ebc9ca3355dc0140571b5b01a1514646ce972ba2eada8e3dcdeb5ae2c5ed14c`,
  `a077ae2d117f118b73dcce9ca1242b547792a0fc6825cef72096326380519323`,
  and `1a6585682579023aa039abf7c70db9b0c042c366297aeacf427a9aa51f944ba0`;
- muted live product QA: **PASS within the technical contract**. At exact
  `773 × 601`, `VIEW` completed Hood → Rear → Aerial → Hood, `RENDER`
  completed Normal → Wire → Normal → Wire, BLUE 04 coloured both modes, both
  text-only controls measured `94 × 34 px`, and the DOM contained no Drivey
  panel or select. DIAG reported `WebGL · Original Drivey · Wireframe`, 59.41
  FPS / 17.5 ms p95, zero runtime issues, `output muted`, and identity
  `v0.0.0 · ba215be · build 20260829-2110`. The Browser log contained four
  informational upstream renderer messages and zero warning/error. Captures are
  `drivey-live-normal-blue-ba215be-773x601.png`,
  `drivey-live-wire-blue-ba215be-773x601.png`, and
  `drivey-live-diag-ba215be-773x601.png` in the recovery visualization folder.
  Real-Tesla touch, motion comfort, frame pacing and thermal acceptance remain
  open.

## DRIVEY 06 publication — 2026-08-29 18:28

- build stamp: **`20260829-1826`**; deployed source commit: `ab7a00e`;
  implementation checkpoint: `5b1696c`;
- gate before upload: **PASS**. The source tree was clean and matched
  `origin/main`; six DRIVEY, six WAKE, nine NIGHTSHIFT, 302 unit and nine Sites
  packaging checks passed. The exact 128-module production build identifies
  version `0.0.0`, commit `ab7a00e` and build `20260829-1826`;
- publication boundary: **PASS**. The authorized preflight verified the
  canonical directory and remote identity with `remote_writes=NONE`. The
  34-file / 14,230,590-byte upload passed dynamic-root and exact legacy-cleanup
  gates, retained two prior content-addressed assets for overlap, and the
  immediate post-publication gate again reported `remote_writes=NONE`;
- canonical identity and cache behavior: **PASS**. Bare and cache-busted HTML
  return `200`, `no-store, no-cache, must-revalidate, max-age=0`, `pragma:
  no-cache` and cache `MISS`. Both 788-byte responses are byte-identical to the
  local entry at SHA-256
  `187096858637f6d2904ca803ef57b531e3c79a467ee12d90d62028d151bd604c`;
- asset identity: **PASS**. The live main JavaScript, CSS, score worklet and
  BLOOM worklet are byte-identical to the verified local build at SHA-256
  `b90e7ec2158aecd2cb2dde421f2c671463b39350346a2cb56e55cb9b6bcd6c0e`,
  `5ff962cb69f009914d684dd688a87e4e0544fc9426e70b00c365d0120e4125f5`,
  `16887bddb25913752562789b286612c7e2ed659e4eddf2d3539153cdf06015c8`
  and `0b0aabb6312de3934bdf952e33b610be08a8f38cc12cb23e1676edd02fc2610a`;
- muted live product QA: **PASS within the technical contract**. Exact
  `773 × 601` Browser interaction selected `DRIVEY 06`, RED 03 and the
  contextual TUNE panel with Driver, Hood, Rear and Structure controls. DIAG
  reported `Canvas2D · Drivey road field`, 55.56 FPS / 18.3 ms p95, zero
  runtime issues, `output muted`, clockless NIGHTSHIFT PARK, version `0.0.0`,
  commit `ab7a00e` and build `20260829-1826`; the live origin emitted no Browser
  warning or error. Real-Tesla motion comfort, touch, thermal and sustained
  frame-pacing acceptance remain open.

## NIGHTSHIFT and integrated Flux checkpoint publication — 2026-08-29 18:15

- build stamp: **`20260829-1810`**; deployed source commit: `2720a0a`;
  implementation checkpoints: `45ab8d9`, `0e563f2`, `f119184`, `fdb63dc` and
  `2ac9ef1`;
- gate before upload: **PASS**. The exact clean commit matched `origin/main`, all
  302 unit checks, six WAKE checks, nine Sites packaging checks and the
  126-module production build passed. The bundle identifies version `0.0.0`,
  commit `2720a0a` and build `20260829-1810`;
- read-only publication boundary: **PASS**. The authorized deployment script's
  preflight verified network, login, canonical directory, root/legacy identity
  and remote listing with `remote_writes=NONE`. No configuration value was
  printed, diffed, copied or placed in a command argument;
- publication: **PASS**, 34 files / 14,219,756 bytes uploaded to the canonical
  root. Dynamic-root and exact legacy-cleanup gates passed, two prior
  content-addressed assets were retained for cache overlap, and the immediate
  post-publication identity gate passed again with `remote_writes=NONE`;
- canonical identity and cache behavior: **PASS**. Bare and cache-busted HTML
  return `200`, `no-store, no-cache, must-revalidate, max-age=0`, `pragma:
  no-cache` and cache `MISS`. Both 788-byte responses are byte-identical to the
  local entry at SHA-256
  `0e58159a1c548f299b96ee433756641fad448fa09c3e5247dcaf0b07f7c41af5`
  and expose the title `sedicivalvole — Adaptive Music for the Road`;
- asset identity: **PASS**. The canonical JavaScript, CSS, score worklet, BLOOM
  worklet, NIGHTSHIFT bank and JUNCTION bank are byte-identical to the verified
  local build at SHA-256
  `ec51466d0d692fdd760b9c67c0b0cef97eb7aad93a1b1d29ba5dcee5be0b571e`,
  `930e63df0091e2ea32acadfb18d19dda4f5274f24d7a219aa4b094f0af983d16`,
  `16887bddb25913752562789b286612c7e2ed659e4eddf2d3539153cdf06015c8`,
  `0b0aabb6312de3934bdf952e33b610be08a8f38cc12cb23e1676edd02fc2610a`,
  `429004d664110d33e9af334f4679811a317dc4a1300c760378b7ec877c617190`
  and `0662ec081d7999c7dd365162d72abc63022d773037f175aac9199a7775fe69b5`;
- muted live product QA: **PASS within the technical contract**. At exact
  `773 × 601`, the canonical product selected `NIGHTSHIFT 03`, reported PARK as
  clockless with no road energy, held audio in `running / output muted`,
  measured 59.99 FPS / 17.8 ms p95 and reported zero runtime issues. DIAG
  exposed `v0.0.0 · 2720a0a` and build `20260829-1810`; the live origin emitted
  no Browser warning or error. Low-volume listening, longitudinal motion in a
  real Tesla and real-vehicle GPS/acceleration acceptance remain open.

## Pending local checkpoint and unchanged live identity — 2026-08-29 17:38

- The WAKE road-flow, acceleration/effect, FRACTURE, JUNCTION PARK, DIAG and
  ATLAS checkpoints through `158eaf7` are local and pushed, but **not deployed**.
  No build stamp is assigned here because this is not publication evidence.
- A read-only canonical request returns `200` from the live root with
  `no-store`, `no-cache`, `must-revalidate`, `max-age=0` and `pragma: no-cache`.
  Bare and cache-busted HTML are byte-identical at SHA-256
  `1548ce734bb8d602b79d8a76d7b0337cd0e8327d775e10a91803291b9c208928`.
  The entry still references `index-D3x2tYVw.js` and `index-z6NZMeRC.css`;
  the 369,461-byte JavaScript asset is `050048ccf6bc672ec90a599a001ce7af053020ce270c98f7b7106d0a5e5bb7c3`
  and embeds version `0.0.0`, commit `5685de3`, build `20260829-1536`.
- Publication is blocked by the current confidentiality boundary, not by a
  claimed upload. `scripts/deploy_drive_lab_ftp.py` unconditionally calls
  `parse_env(ROOT / ".env")` before either `--verify-only` or `--publish` can
  connect. This task expressly forbids reading `.env`, so the script was not
  invoked and no remote write occurred. A compliant deploy requires either a
  deployer whose no-write and publish paths receive credentials without reading
  that file, or an explicit change to the current authorization boundary.
- The canonical response proves the current server header is `nginx`; this is
  observed evidence for this request only and is not treated as a hosting
  configuration assumption.

## Low-speed life and runtime-resilience publication — 2026-08-29

- build stamp: **`20260829-1536`**; deployed commit: `5685de3`;
  implementation checkpoints: `892de32`, `39396c8`, `77da446`, `82fd3bf`,
  `f3f5e82` and `330c503`;
- gate before upload: **PASS**. All 274 unit checks, all nine Sites packaging
  checks and the 116-module production build passed from the deployed commit;
  the lockfile audit reports zero known vulnerabilities, and the locally
  rebuilt Rollup, esbuild and fsevents dependencies are native or universal for
  Apple silicon rather than machine-specific Dropbox copies;
- silent product QA: **PASS within the technical contract**. Exact muted Browser
  checks at `773 x 601`, `601 x 390` and `390 x 844` covered FRACTURE PARK,
  DEPART/CREEP, JUNCTION at displayed `20` and `21 km/h`, responsive controls,
  WebGL2 APERTURE and the six-slot decoded/source-held audio-memory bound. The
  sustained visual pass measured approximately 60 FPS with a `17.6 ms` p95 and
  zero runtime issues; audio was not played during this publication pass;
- audio evidence: **PASS offline, listening gate open**. FRACTURE measures
  `-15.9 LUFS` with PARK near `-46.6 dB RMS`; the reproducible JUNCTION brake
  analyzer passes all 24 complete performances with maximum metric drift
  `0.000002`. The 5,812,361-byte `SVJCTN04` bank is byte-identical at SHA-256
  `0662ec081d7999c7dd365162d72abc63022d773037f175aac9199a7775fe69b5`;
- publication: **PASS**, 30 files / 8,368,023 bytes uploaded to the canonical
  root. Dynamic-root and exact legacy-cleanup gates passed, two prior
  content-addressed assets were retained for cache overlap, and the repeated
  post-publication identity gate passed with `remote_writes=NONE`;
- canonical identity: **PASS**. Bare and cache-busted HTML return `200` with
  `no-store` / `no-cache`, cache `MISS` and byte identity to the local entry.
  HTML, `index-D3x2tYVw.js`, `index-z6NZMeRC.css` and
  `score-processor-BjpRDiNh.js` match the local build at SHA-256
  `1548ce734bb8d602b79d8a76d7b0337cd0e8327d775e10a91803291b9c208928`,
  `050048ccf6bc672ec90a599a001ce7af053020ce270c98f7b7106d0a5e5bb7c3`,
  `413f1dfad8514f1d94d7e0bac8321820b36e20dc16f7d9005fe607a630bd1646`
  and `c56178d2d56ff743662f19ba45bc97f7cd5ef433addd56b4de0438b33c4ef9ed`;
- live publication QA: **PASS for identity, presentation and cache behavior**.
  The visible canonical splash reports version `0.0.0`, build
  `20260829-1536` and commit `5685de3`, exposes the expected support, credits
  and local-privacy copy, and logs no Browser warning or error. The launch
  control was deliberately not activated, so this verification introduced no
  background audio. Low-volume listening and real-Tesla acceptance remain open.

## BLOOM and JUNCTION-analysis publication — 2026-08-29

- build stamp: **`20260829-0200`**; deployed commit: `4ea0bd1`;
  implementation checkpoint: `7e9b2e9`;
- gate before upload: **PASS**. All 19 focused BLOOM, OPEN, selection,
  transition, harmony and voicing checks passed; the production build passed;
  183 of 184 unit checks and all four Sites packaging checks passed. The only
  unavailable check is the unchanged diagnostic-mail fixture on this host,
  which has no `php` executable;
- audio evidence: **PASS within the offline contract**. The delayed 1 kHz path
  measures approximately 1018 Hz, 60 Hz sub energy remains within 0.3 dB,
  in-band peak growth stays below 0.5 dB, and the effect nulls after release.
  The JUNCTION selection audit proves index-zero-only chord reachability; the
  first audio-only transition pass measures 63 ordinary boundaries and flags 22
  for listening under explicitly uncalibrated, non-blocking probes;
- publication: **PASS**, 29 files / 8,316,609 bytes uploaded to the canonical
  root. Dynamic-root and exact legacy-cleanup gates passed, one previous
  content-addressed asset was retained for cache overlap, and the repeated
  post-publication identity gate passed with `remote_writes=NONE`;
- canonical identity: **PASS**. Bare and cache-busted HTML return `200` with
  `no-store` / `no-cache` and cache `MISS`; both are byte-identical to the local
  production entry. HTML, `index-D9pguc-B.js`, `index-f0E-xbVv.css`, and
  `bloom-processor-CKq-AMR3.js` match the local build at SHA-256
  `d6cee62ee9cf3c49a57c4b5eee6c8ac19bc23976a597361569f852d244bccbe1`,
  `aa5d4c93a86696d5eba8afe03e64060233ec8ec13d3af603499c5948bf9b61e3`,
  `647be96d4e05e6691e2658e1e5d6f526487bae00470b76d3f4b1bed96a60942a`,
  and `fcfda65e8fbf0dde43752f81bcb324dd7977eb2679b39182508b158089ab3cbe`;
- live interaction: **PASS for publication identity and ordinary launch**. The
  visible in-app browser reports build `20260829-0200`, enters APERTURE with
  FRACTURE, and exposes the expected primary controls. The BLOOM worklet is
  present byte-for-byte on the canonical host. A real qualifying hard launch
  and target-Tesla listening remain the perceptual acceptance boundary.

## REGISTER removal publication — 2026-08-29

- build stamp: **`20260829-0121`**; deployed commit: `a47142c`;
  implementation checkpoint: `b8dd697`;
- change: **PASS**. The rejected REGISTER study is absent from the active
  catalog, renderer, development harness and unit suite. Its source remains only
  in `archive/visuals/register/`; a stale stored `register` selection falls back
  to APERTURE, while the independent OPEN acceleration macro is unchanged;
- gate before upload: **PASS**, 172 of 173 active unit checks, all 4 Sites
  packaging checks, the archived five-check technical record and the production
  build passed. The sole unavailable active check is the unchanged PHP mail
  fixture on this host without a `php` executable;
- publication: **PASS**, 28 files / 8,308,622 bytes uploaded to the canonical
  root. The final read-only FTP identity gate passed with `remote_writes=NONE`.
  An intermediate upload carried the current removal but a stale prior commit
  stamp; it was not accepted and was immediately superseded by the rebuilt,
  correctly identified bundle;
- canonical identity: **PASS**. Bare and cache-busted HTML return `200` with
  `no-store` / `no-cache` and cache `MISS`; both are byte-identical to the local
  production entry. The referenced JavaScript and CSS are byte-identical to the
  local build, and the live JavaScript contains `20260829-0121` and `a47142c`;
- live interaction: **PASS**. The visible in-app browser launched the canonical
  experience, converted the prior REGISTER selection to APERTURE and exposed
  exactly APERTURE 01, VERTIGO 02, MERIDIAN 03 and ATLAS 04 in the Visual
  library with zero warnings or application errors. Exact `773 × 601` QA
  confirmed the same four-row selector without visible overflow. The only
  console request failure is the pre-existing missing `/favicon.ico`.

## REGISTER boundary-continuity publication — 2026-08-29

- build stamp: **`20260829-0107`**; deployed commit: `f6b6423`;
  continuity checkpoint: `d018907`;
- correction: **PASS**. REGISTER now preserves one page node across musical
  revisions instead of remounting the field. The local eight-bar test observed
  revision `1 → 2` with all eight composed elements present in the first
  captured frame; the new regression check makes a keyed page remount fail;
- gate before upload: **PASS**, 12 focused REGISTER/OPEN/documentation tests,
  all 4 Sites packaging tests, the production build and exact local
  `773 × 601` boundary capture passed. The active suite now contains 178 unit
  checks; its unchanged PHP mail fixture remains unavailable on this host;
- publication: **PASS**, 28 files / 8,314,215 bytes uploaded to the canonical
  root. Dynamic-root and exact legacy-cleanup gates passed, one previous
  content-addressed asset was retained for cache overlap, and the repeated
  post-publication identity gate passed with `remote_writes=NONE`;
- canonical identity: **PASS**. Cache-busted HTML returns `200` with explicit
  `no-store` / `no-cache` behavior and a cache `MISS`. HTML,
  `index-_PAkGTEF.js` and `index-V_3SjLSC.css` are byte-identical to the verified
  local build at SHA-256
  `9a879d169f6e0a79505eb35b1575ce223556e5683432c81f98407578ce90ebb0`,
  `32e336d2e3d18294367231521b978708c3c945ee5ee1d95200740b2186d4d7bf`
  and `569c3b3caec8e40b5ff5398c9ce81c0762db2a085e49080ebddd1a3b2670ce31`;
- live product QA: **PASS at exact `773 × 601`**. The canonical page crossed
  revision `1 → 2` with all eight elements present, retained REGISTER 05 and
  then reported the real OPEN state under held acceleration. The Browser console
  reports zero warnings and the same unrelated missing `/favicon.ico` request.

## REGISTER and OPEN publication — 2026-08-29

- build stamp: **`20260829-0059`**; deployed commit: `09a6c10`;
  implementation checkpoint: `0b9a870`;
- gate before upload: **PASS**, the corrected synthetic harmony fixture enforces
  abstention while preserving the failed residual's `0.666667` false-positive
  rate and `-0.006729` margin, all 15 focused REGISTER/OPEN/harmony/documentation
  checks, 176 of 177 active unit tests, all 4 Sites packaging tests, the
  production build and exact local `773 × 601` Browser QA passed. The one
  unavailable unit check requires a local PHP executable that is not installed
  on this host and is unrelated to the visual, acceleration or harmony changes;
- local product QA: **PASS at exact `773 × 601`**. REGISTER rendered against the
  approved concept with the existing 64 px product footer; separate harness
  captures verified `2–6` physical-pixel plate offsets and braking alignment.
  A clean FRACTURE launch from `20 km/h` reached `43 km/h`, showed the real OPEN
  badge and retained the current REGISTER page until its next musical boundary;
- publication: **PASS**, 28 files / 8,314,218 bytes uploaded to the canonical
  root. Dynamic-root and exact legacy-cleanup gates passed, two previous
  content-addressed assets were retained for cache overlap, and the repeated
  post-publication identity gate passed with `remote_writes=NONE`;
- canonical identity: **PASS**. Bare and cache-busted HTML return `200` with
  explicit `no-store` / `no-cache` behavior and a cache `MISS`. HTML,
  `index-CyLFz9Q8.js`, `index-V_3SjLSC.css` and `bmc_qr-Ceyh0yuM.png` are
  byte-identical to the verified local build at SHA-256
  `b3b680d002c6394410a0035012ff7a3c9436e339b2250c5bec77a3020a761826`,
  `43c5bd5d14daa4845ad0e9f2798ac6f77c56da9760336ca47cf63e5183f11a77`,
  `569c3b3caec8e40b5ff5398c9ce81c0762db2a085e49080ebddd1a3b2670ce31`
  and `2ea4f11b865e760efd41fb4654730f31bf6cc0d348db39c245f96dcf3aac80e6`;
- live product QA: **PASS at exact `773 × 601`**. The canonical launch identifies
  build `20260829-0059`; REGISTER 05 is selected and rendered; held acceleration
  reached `39 km/h` with the real OPEN state, FRACTURE and RED 03 visible. The
  Browser console reports zero warnings and one unrelated pre-existing missing
  `/favicon.ico` request.

## PROJECT SPARKS fixed-duration count publication — 2026-08-29

- build stamp: **`20260828-2359`**, generated immediately before midnight;
  deployed commit: `0bd3af3`; implementation checkpoint: `9d34d1e`;
- gate before upload: **PASS**, all 16 focused splash/support tests, 167 of 168
  active unit tests, all 4 packaging tests, a production build from the deployed
  commit, local Browser interaction QA at `773 × 601` and `390 × 844`, and the
  read-only remote identity gate with `remote_writes=NONE`. The one unavailable
  test requires a local PHP executable that is not installed on this host and
  is unrelated to the static support counter;
- interaction QA: **PASS**. Every panel opening starts visibly at `000`; the
  current `015` target progresses through intermediate integers and reaches its
  exact final value on the model's fixed `4,000 ms` boundary. Deterministic
  coverage proves the same duration for targets `15` and `1,500`; reduced-motion
  users receive the final value without animation, and assistive technology is
  exposed to one stable final-value label rather than every visual step;
- publication: **PASS**, 28 files / 8,306,263 bytes uploaded to the canonical
  root. Dynamic-root, exact legacy cleanup, retained cache overlap and remote
  listing checks passed; the repeated post-publication identity gate passed
  with `remote_writes=NONE`;
- canonical identity: **PASS**. Bare and cache-busted HTML return `200` with
  explicit `no-store` / `no-cache` behavior and a cache `MISS`. HTML,
  `index-I3BCA-L_.js`, `index-f0E-xbVv.css` and `bmc_qr-Ceyh0yuM.png` are
  byte-identical to the local build at SHA-256
  `e4f03541a51021e630fd2f92159d2874a2451521633ab8b66ee444421cb52650`,
  `558f047141e73d911ed5ec66a3f03040d0e0d2505141049c1612255ffa2bb134`,
  `647be96d4e05e6691e2658e1e5d6f526487bae00470b76d3f4b1bed96a60942a`
  and `2ea4f11b865e760efd41fb4654730f31bf6cc0d348db39c245f96dcf3aac80e6`;
- live product QA: **PASS at exact `773 × 601`**. The canonical launch identifies
  build `20260828-2359`; the live counter was observed at `000`, `004`, `008`
  and `015`, the accessible dialog reports the stable final-value/four-second
  contract, and the Browser console has zero warnings or errors.

## Signal Gate support-panel publication — 2026-08-28

- build stamp: **`20260828-2303`**; deployed commit: `557251c`;
  implementation checkpoint: `a18efd7`;
- gate before upload: **PASS**, all 15 focused splash/support tests, 163 of 164
  active unit tests, all 4 packaging tests, a production build from the deployed
  commit, exact local Browser QA at `773 × 601` and `390 × 844`, and the
  read-only remote identity gate with `remote_writes=NONE`. The one unavailable
  test requires a local PHP executable that is not installed on this host and
  is unrelated to the static support panel;
- interaction QA: **PASS**. The accessible panel opens from the top-left control,
  closes through `Escape`, its explicit `CLOSE` button and a backdrop tap, and
  presents the verified support destination, the supplied byte-identical QR,
  the honestly labelled `PROJECT SPARKS` signal and a runtime-reconstructed
  suggestion address. The full address is absent from static source and the
  production JavaScript bundle;
- publication: **PASS**, 28 files / 8,305,641 bytes uploaded to the canonical
  root. Dynamic-root, exact legacy cleanup, retained cache overlap and remote
  listing checks passed; the repeated post-publication identity gate passed
  with `remote_writes=NONE`;
- canonical identity: **PASS**. Cache-busted HTML returns `200` with explicit
  `no-store` / `no-cache` behavior and a cache `MISS`. HTML, the selected
  `index-CdRTsvIu.js`, `index-f0E-xbVv.css` and `bmc_qr-Ceyh0yuM.png` are
  byte-identical to the local build at SHA-256
  `bcc531cae5746561b504686436f7ead49dfeabb18bc1642ef8eabb65bc1d54e0`,
  `2436dbeb12c59d26b7753d75335a970e8f97a0a3ea5e4fabb472dfa46bb7d7a9`,
  `647be96d4e05e6691e2658e1e5d6f526487bae00470b76d3f4b1bed96a60942a`
  and `2ea4f11b865e760efd41fb4654730f31bf6cc0d348db39c245f96dcf3aac80e6`;
- live product QA: **PASS at exact `773 × 601`**. The canonical launch identifies
  build `20260828-2303`; the dialog is visible at `390 × 295 px`, the QR loads
  from its content-addressed asset at a crisp `136 px`, the real profile resolves
  to `https://buymeacoffee.com/enuzzo`, the signal reads `015`, the document has
  zero overflow, and the Browser console has zero warnings or errors.

## Signal Gate credit-link polish publication — 2026-08-28

- build stamp: **`20260828-2249`**; deployed commit: `85aea3b`;
  implementation checkpoint: `3f770cd`;
- gate before upload: **PASS**, all 11 focused splash tests, 159 of 160 active
  unit tests, all 4 packaging tests, a production build from the deployed
  commit, exact local Browser QA at `773 × 601` and `390 × 844`, and the
  read-only remote identity gate with `remote_writes=NONE`. The one unavailable
  test requires a local PHP executable that is not installed on this host and
  is unrelated to the static splash;
- publication: **PASS**, 27 files / 8,203,020 bytes uploaded to the canonical
  root. Dynamic-root, exact legacy cleanup, retained cache overlap and remote
  listing checks passed; the repeated post-publication identity gate passed
  with `remote_writes=NONE`;
- canonical identity: **PASS**. Cache-busted HTML returns `200` with explicit
  `no-store` / `no-cache` behavior and a cache `MISS`. HTML, the selected
  `index-CYLBRSq7.js` and `index-CIK-ac_h.css` are byte-identical to the local
  build at SHA-256 `357def12cff300ba84a5a9d151acd92f7f7765e0ac654f3e2f006ebb0ec7092c`,
  `0ad3c6433e859bace58ddf5f24e01c8e5e16a203542c851da1db0469a7c73ffb`
  and `7b1aec5535068d1b7488bbcd8d4ce29e032eaf130b9703e60822419cdc4ae85d`;
- live product QA: **PASS at exact `773 × 601`**. The canonical launch identifies
  build `20260828-2249`; the then-current, now-retired studio credit resolved to its former external destination, the
  source row renders an `11 × 11 px` monochrome GitHub mark, both text and mark
  retain the light paper colour on hover, the document has zero overflow, and
  the Browser console has zero warnings or errors.

## Signal Gate readability publication — 2026-08-28

- build stamp: **`20260828-2219`**; deployed commit: `e042344`;
  implementation checkpoint: `e5f6164`;
- gate before upload: **PASS**, all 10 focused splash tests, 158 of 159 active
  unit tests, all 4 packaging tests, a production build from the deployed
  commit, local Browser comparison at exact `773 × 601` and the repeated
  read-only remote identity gate with `remote_writes=NONE`. The one unavailable
  test requires a local PHP executable that is not installed on this host and
  is unrelated to the static splash;
- support-link QA: **PASS**. A valid synthetic `buymeacoffee.com` build setting
  renders the prepared `184 × 30 px` support link; the normal build without a
  real profile renders no inert control. Invalid protocols and other hosts are
  rejected by the client build;
- publication: **PASS**, 27 files / 8,202,133 bytes uploaded to the canonical
  root. Dynamic-root, exact legacy cleanup, retained cache overlap and remote
  listing checks passed; the post-publication identity gate passed with
  `remote_writes=NONE`;
- live product QA: **PASS at exact `773 × 601`**. The cache-busted canonical URL
  identifies build `20260828-2219`; the loaded Orbitron face measures the credit
  at `12.5 px` / weight `620`, source at `11.5 px` and privacy copy at `10.5 px`.
  The launch surface begins at `338.43 px`, approximately 27 px higher than the
  prior live layout. The document has zero horizontal or vertical overflow,
  the Browser console has zero warnings/errors, and `PLAY THE ROAD` transitions
  into the active experience successfully.

## Signal Gate credits publication — 2026-08-28

- build stamp: **`20260828-2208`**; deployed commit: `946c035`;
  implementation checkpoint: `3bbe6be`;
- gate before upload: **PASS**, all 8 focused splash tests, 156 of 157 tests in
  the complete local suite, a production build from the deployed commit, exact
  local `773 × 601` Browser QA and the read-only remote identity gate with
  `remote_writes=NONE`. The one unavailable test requires a local PHP executable
  that is not installed on this host; it is unrelated to the static splash;
- publication: **PASS**, 27 files / 8,201,351 bytes uploaded to the canonical
  root. Dynamic-root, exact legacy cleanup, retained cache overlap and remote
  listing checks passed; the repeated post-publication identity gate passed
  with `remote_writes=NONE`;
- live product QA: **PASS at exact `773 × 601`**. The cache-busted canonical URL
  identifies build `20260828-2208`, renders the compact then-current project
  credit with Illobo and source lines with zero horizontal or vertical
  document overflow, and emits zero Browser warnings or errors. Both links are
  visible and enabled; the Illobo target resolves to `github.com/illobo` with
  the page title `illobo · GitHub`.

## Meridian and music correction publication — 2026-08-28

- build stamp: **`20260828-1950`**; deployed commit: `e314704`;
  implementation checkpoints: `b33663b` and `91fd4b8`;
- gate before upload: **PASS**, 156 active unit tests, 4 packaging tests, a
  production build from the deployed commit, exact local `773 × 601` Browser
  comparisons at `0`, `40`, `90` and `130 km/h`, and the read-only remote
  identity verification with `remote_writes=NONE`;
- rendered and runtime QA: **PASS locally**. Meridian's sustained WebGL2 pass
  measured 60.15 FPS / 18.1 ms p95 with zero runtime issues. The production
  JUNCTION engine entered `FULL` / `168 BPM` at the exact `130 km/h` QA state,
  exposed one tonal performance and three controlled layers, and logged no
  Browser warning or error;
- audio QA: **PASS for deterministic behavior and objective measurement**.
  FRACTURE's normal arrangement cannot activate its retired riff/response lanes.
  JUNCTION uses the 5,812,755-byte `SVJCTN04` bank with one harmonic identity,
  one tonal performance at a time, complete boundaries, immediate-repeat
  avoidance, native `127–168 BPM` pacing, four-second rhythm envelopes and a
  six-clip decoded limit. Offline renders measured FRACTURE at -16.0 LUFS / -0.8
  dBFS true peak and JUNCTION at -19.5 LUFS / -2.7 dBFS true peak;
- publication: **PASS**, 27 files / 8,200,466 bytes uploaded to the canonical
  root. Dynamic-root, exact legacy cleanup, retained cache overlap and remote
  listing checks passed; the repeated post-publication identity gate passed
  with `remote_writes=NONE`;
- canonical identity: **PASS**. Bare and cache-busted HTML return `200` with
  `no-store` / `no-cache` behavior and are byte-identical to local at SHA-256
  `c4651bce339c2dea1bd1e959f241aff9ea392d6d6c9f473bc8354a4905e962c3`.
  The live document selects `index-rBa6H7HW.js` and `index-ArFavGwq.css`; their
  byte-identical SHA-256 values are
  `db641731ac0e8bc24b9513fd2e4c5b585f90a3f40f3d0a967d2a4b7c7f2d432b` and
  `6a25a3ebec2eb9fad0d603f63dd79012409fd85488835e3f174b3e9cfe825f0d`.
  The live JUNCTION bank is byte-identical at SHA-256
  `5a4730932b234092f8571b93b82d4c1a974e771c9cf376ce28904cf6fc9e814f`;
- live product QA: **PASS at exact `773 × 601`**. The canonical launch identifies
  build `20260828-1950`, opens into Flux, selects `MERIDIAN 03`, retains
  `JUNCTION` and the palette system, renders the stable rest corridor and emits
  zero Browser warnings or errors. Real-Tesla visual and listening acceptance
  remains the final product boundary.

## LATITUDES retirement publication — 2026-08-28

- build stamp: **`20260828-1745`**; deployed commit: `aa6fdb3`;
  implementation: `b135650`;
- gate before upload: **PASS**, 159 active unit tests, 4 packaging tests, the 13
  historical Latitudes model tests run separately, production build from the
  deployed documentation commit, exact `773 × 601` Browser verification and
  read-only remote identity verification with `remote_writes=NONE`;
- product QA: **PASS**. The active Visual library contains only `APERTURE 01`,
  `VERTIGO 02`, `MERIDIAN 03` and `ATLAS 04`; selecting Aperture from Atlas
  changes the active renderer, Latitudes has no live entry, and the Browser
  console reports zero warnings/errors. A stale stored `latitudes` preference
  resolves to Aperture;
- bundle QA: **PASS**. The rejected renderer is absent from the active import
  graph and production bundle. The main JavaScript shrank by 12.26 kB minified
  and 3.30 kB gzip while the complete source and 13-test model remain available
  only under the explicit historical archive;
- publication: **PASS**, 27 files / 41,099,210 bytes uploaded to the canonical
  root. Dynamic-root, exact legacy cleanup, retained cache overlap and remote
  listing checks passed; the repeated post-publication identity gate passed
  with no writes;
- cache-busted canonical HTML points to `index-D7QH9Ixy.js` and
  `index-ArFavGwq.css`. HTML, main JavaScript and CSS are byte-identical to the
  verified local build; live `773 × 601` Browser QA confirms build
  `20260828-1745`, all four choices, `ATLAS 04`, the working selection change,
  no Latitudes entry and zero console warnings/errors.

## JUNCTION rhythm-envelope publication — 2026-08-28

- build stamp: **`20260828-1736`**; deployed commit: `d048fdd`;
  implementation: `ff3c2b3`;
- gate before upload: **PASS**, 171 unit tests, 4 packaging tests, production
  build from the deployed commit, simulated AudioParam timing and read-only
  remote identity verification with `remote_writes=NONE`;
- transition QA: **PASS**. Rest-to-rhythm rises linearly over four seconds;
  rhythm-to-rest releases toward `0.08` over four seconds, and a reversed road
  decision cancels the descent and recovers smoothly in `1.2 s`. Complete
  eight-bar boundaries, deck balance, BPM mapping and the existing bank remain
  unchanged; telemetry records the transition state;
- publication: **PASS**, 27 files / 41,111,466 bytes uploaded to the canonical
  root. Dynamic-root, exact legacy cleanup, retained cache overlap and remote
  listing checks passed; the repeated post-publication identity gate passed
  with no writes;
- cache-busted canonical HTML points to the expected JavaScript and CSS. Both
  live assets are byte-identical to the verified local build and contain build
  `20260828-1736` / commit `d048fdd`. Real-Tesla listening remains the acceptance
  boundary for the perceived four-second gesture.

## ATLAS selected-place context publication — 2026-08-28

- build stamp: **`20260828-1725`**; deployed commit: `0c106e2`;
  implementation: `b90b255`;
- gate before upload: **PASS**, 170 unit tests, 4 packaging tests, production
  build from the deployed commit, exact `773 × 601` Browser verification and
  read-only remote identity verification with `remote_writes=NONE`;
- content QA: **PASS**. The live Italian Wikipedia response supplies the selected
  page's free-license `320 px` PageImages thumbnail and two-sentence introduction
  in one request. Selection changes update title, image, abstract and QR together;
  the panel fits `465/465 px`, and collapse/reopen retains the full-width map;
- publication: **PASS**, 27 files / 41,109,790 bytes uploaded to the canonical
  root. Dynamic-root, exact legacy cleanup, retained cache overlap and remote
  listing checks passed; the repeated post-publication identity gate passed
  with no writes;
- cache-busted live Browser QA confirms build `20260828-1725`, a visible Wikimedia
  thumbnail, coordinated selection of `Torre di Porta Romana`, zero console
  warnings/errors, and a working link/QR target. The canonical HTML points to
  the expected assets; the main JavaScript, CSS and ATLAS chunk are byte-identical
  to the verified local build.

## Enlarged Signal Gate wordmark publication — 2026-08-28

- build stamp: **`20260828-1613`**; deployed commit: `cac89a5`;
  implementation: `c3f9a91`;
- gate before upload: **PASS**, 162 unit tests, 4 packaging tests, production
  build from the deployed commit, local Browser verification at exact
  `773 × 601` and `390 × 844`, and read-only remote identity verification with
  `remote_writes=NONE`;
- typography QA: **PASS**. The wordmark computes to `38.65 px` at the Tesla
  viewport and `32 px` on compact mobile, retaining Orbitron `750`, zero added
  tracking, centered one-line fit and no horizontal overflow. The product band
  is `68 px`; `PLAY THE ROAD` retains its `78 px` field and seamless wave while
  the whole action remains exactly `390 × 170 px` on Tesla;
- publication: **PASS**, 27 files / 27,436,702 bytes uploaded to the canonical
  root. Dynamic-root, exact legacy cleanup, retained cache overlap and remote
  listing checks passed; the repeated post-publication identity gate passed
  with no writes;
- cache-busted live Browser QA confirms build `20260828-1613`, exact wordmark
  dimensions and weight, complete visible launch copy, zero console warnings or
  errors, and a successful `PLAY THE ROAD` transition into `phase-running`.

## Direction-following ATLAS publication — 2026-08-28

- build stamp: **`20260828-1606`**; deployed commit: `e58ff12`;
  implementation: `2c8f0f6`;
- gate before upload: **PASS**, 162 unit tests, 4 packaging tests, production
  build, exact `773 × 601` rendered verification at `40` and `130 km/h`, and a
  read-only remote identity verification with no writes;
- passenger presentation: **PASS**. The `246 px × 465 px` panel contains its
  `21 px` title, three-line `12 px` context, four `12 px` choices and `86 px`
  QR without horizontal or panel overflow. The QR source is generated at
  `192 px`; local and live Browser checks loaded nearby Italian Wikipedia data;
- camera and travel: **PASS** locally. The `130 km/h` endpoint retains zoom
  `14.65`, pitch `55.5°` and visibly extruded buildings. The Milan test advances
  its center in the active heading and a steering gesture changes the rendered
  view. Deterministic coverage proves real GPS uses reported heading, derives
  east/north bearing from successive fixes when heading is null, and preserves
  the last direction inside the three-metre jitter gate;
- an intermediate `20260828-1604` package contained the correct product code but
  had been built before the final commits, so its embedded commit identity was
  stale. It was immediately superseded and is not accepted as the release;
- final publication: **PASS**, 27 files / 27,436,704 bytes uploaded to the
  canonical root. Dynamic-root, legacy-cleanup, retained-cache-overlap and
  remote-listing checks passed; the repeated post-publication identity gate
  passed with `remote_writes=NONE`;
- cache-busted live Browser QA at `773 × 601` confirms build
  `20260828-1606`, the ATLAS Milan launch, OpenFreeMap field, passenger content,
  exact final typography/QR dimensions and zero console warnings or errors.
  Real Tesla GPS-following and passenger scan distance remain the vehicle
  acceptance boundary.

## Seamless Orbitron launch publication — 2026-08-28

- build stamp: **`20260828-1553`**; deployed commit: `3c85c7b`;
  typography and wave: `0193cac`; token alignment: `c816b75`; overlay isolation:
  `6109f32`;
- gate before upload: **PASS**, 160 unit tests, 4 packaging tests, production
  build, exact `773 × 601` and compact `390 × 844` rendered verification,
  read-only remote identity verification and no preflight writes;
- typography QA: **PASS**. Lowercase `sedicivalvole` computes to Orbitron `750`,
  centered with no added tracking; uppercase `PLAY THE ROAD` computes to `600`
  with no added tracking. Neither line overflows at either verified viewport;
- continuity QA: **PASS**. The white-to-red field repeats every `360 px` and the
  `4.2 s` linear animation advances by exactly `-360 px`. A 12.85-second Browser
  observation captured 222 samples and three wraps; the period-normalized
  maximum visual step was 5.79 px, with no discontinuity at any wrap;
- an intermediate `20260828-1550` upload exposed the persisted ATLAS no-GPS
  overlay above the launch surface. The final build assigns the splash layer
  `20` above ATLAS waiting layer `5`; live QA now shows only the intended launch
  copy before the gesture, then reveals ATLAS normally after launch;
- final publication: **PASS**, 27 files / 27,436,189 bytes uploaded to the
  canonical root; dynamic root, exact legacy cleanup and remote listing passed.
  The repeated post-publication identity gate passed with no writes;
- cache-busted live Browser QA at `773 × 601` confirms build `20260828-1553`,
  local Orbitron, the exact weights and period, no overflow, correct layer order
  and a successful `PLAY THE ROAD` transition into the running experience.

## Orbitron typography publication — 2026-08-28

- build stamp: **`20260828-1538`**; deployed commit: `76f1b63`;
  implementation: `6a6c55e`; deployment-gate follow-up: `fbbb794`;
- gate before upload: **PASS**, 157 unit tests, 4 packaging tests, production
  build, exact `773 × 601` and compact `390 × 844` rendered verification,
  read-only remote identity verification and no preflight writes;
- typography QA: **PASS**. Browser font loading resolves to local `Orbitron`,
  command weight `850`, labels `700`, controls `620`, values `520` and reading
  text `450`. Splash, top bar, footer, Visual, Music and DIAG were inspected;
  primary Tesla chrome has no measured overflow, and the compact wordmark plus
  APERTURE and JUNCTION labels remain complete;
- publication: **PASS**, 27 files / 27,436,204 bytes uploaded to the canonical
  root; dynamic root, retained cache overlap, exact legacy cleanup and remote
  listing passed;
- the first post-publication identity run failed closed on the newly introduced
  `fonts/` root directory. Commit `fbbb794` adds an explicit static-tree check,
  not a generic exception: unknown font entries and content mismatches still
  abort publication. The repeated read-only gate then passed with no writes;
- canonical cache-busted Browser QA confirms build `20260828-1538`, loaded
  Orbitron and the expected computed hierarchy. The live 11,800-byte WOFF2 is
  byte-identical to local at SHA-256
  `c25a9f9da5d9f3db1bf2a01474722dc9b377675b7bbab6d0dfda6902794fd1ed`.

## Adaptive visual refinement publication — 2026-08-28

- build stamp: **`20260828-1520`**; deployed commit: `0d5153b`;
  implementation: `7ab86b2`;
- gate before upload: **PASS**, 156 unit tests, 4 packaging tests, production
  build, exact `773 × 601` rendered verification, read-only remote identity
  verification and no preflight writes;
- local Tesla-viewport visual QA: **PASS**. APERTURE keeps the rigid grid wall
  through its retreat and removes it completely at `40 km/h`; LATITUDES is calm
  at rest and gains continuous oscilloscope deformation with speed; MERIDIAN
  renders Euclidean structures, curved segmented wind and overhead cloud slabs;
- local ATLAS no-GPS QA: **PASS**. `TEST FROM MILAN` receives the tap, the shared
  drive/brake arrows move the demo, steering changes its bearing, and the map,
  nearby Italian Wikipedia choices and locally generated QR render together;
- publication: **PASS**, 25 files / 27,418,687 bytes uploaded to the canonical
  root; dynamic root, retained cache overlap, exact legacy cleanup and remote
  listing passed;
- post-publication read-only identity verification: **PASS**, with no remote
  writes. Live Browser QA at `773 × 601` confirmed build `20260828-1520`, launch,
  the coordinate-free Milan path, 3D map, nearby passenger content, QR and zero
  console warnings/errors;
- deterministic audio coverage confirms that JUNCTION can preload and schedule
  while its score-local movement gain stays silent at launch. A real-Tesla drive
  remains the acceptance boundary for APERTURE frame pacing and audible entry.

## Dense Device evidence publication — 2026-08-28

- build stamp: **`20260828-1255`**; deployed commit: `33529bb`;
  implementation: `11d8def`;
- gate before upload: **PASS**, 154 unit tests, 4 packaging tests, production
  build, exact `773 × 601` rendered verification, read-only remote identity
  verification and no preflight writes;
- local Tesla-viewport layout: **PASS**. Eight Device cards render as four
  exact 139.25 px columns and two rows; the section occupies 153.3 px instead
  of approximately 287 px while every value remains present;
- publication: **PASS**, 25 files / 27,415,542 bytes uploaded to the canonical
  root; dynamic root, retained cache overlap, exact legacy cleanup and remote
  listing passed;
- canonical cache-busted HTML, main JavaScript `assets/index-BvfgC6D3.js` and
  CSS `assets/index-Derl6uhs.css` are byte-identical to local at SHA-256
  `0550e28b4230a87ef035a309eea4a6b39b67e13011cb3f5ee9e5b8765fb2fcb1`,
  `0a597571c8d348159a9c19257dd07491e3d7bd5020d472bc94832beb717a2a62`
  and `b4c59207776664227ce4a4f2bdf766ab277066a8b7955a0bc0e9b086d33066b9`;
- live Browser QA at `773 × 601`: **PASS** for DIAG opening, one Device grid,
  all eight Device cards and zero console warnings/errors.

## Compact diagnostic feedback publication evidence — 2026-08-28

- build stamp: **`20260828-1249`**; deployed commit: `b2357a6`;
  implementation: `81ca742`;
- gate before upload: **PASS**, 153 unit tests, 4 packaging tests, production
  build, exact `773 × 601` rendered verification, read-only remote identity
  verification and no preflight writes;
- local Tesla-viewport failure simulation: **PASS**. The complete connection
  warning occupied two lines / 31.7 px inside a 102.7 px bottom-sticky tray;
  all four controls remained on one 48 px row and the message stayed within the
  601 px viewport;
- publication: **PASS**, 25 files / 27,415,058 bytes uploaded to the canonical
  root; dynamic root, retained cache overlap, exact legacy cleanup and remote
  listing passed;
- canonical cache-busted HTML, main JavaScript `assets/index-B6MkWWXh.js` and
  CSS `assets/index-BKBj-r0Z.css` are byte-identical to local at SHA-256
  `3c93e55f0dfb5aaa0749f067ce4004d78b16f69a788e1730eed04ea49ac28433`,
  `89afba1e14cf517263e79183aa026c41bcd97807a9b29edb6070cfbb2ef70ef5`
  and `b4368207c5f4734ef1e380b794bbcb34e2253277de0a6d4160594d83d240eb23`;
- live Browser QA at `773 × 601`: **PASS** for build identity, launch, DIAG
  opening, compact actions and zero console warnings/errors. No live SEND was
  performed, avoiding an artificial recipient email; the next user gesture is
  the real mail-status acceptance check.

## Long-drive diagnostic transport publication evidence — 2026-08-28

- build stamp: **`20260828-1238`**; deployed commit: `1099581`;
  implementation: `3057796`;
- gate before upload: **PASS**, 151 unit tests, 4 packaging tests, production
  build, read-only remote identity verification and no preflight writes;
- publication: **PASS**, 25 files / 27,414,920 bytes uploaded to the canonical
  root; dynamic root, retained cache overlap, exact legacy cleanup and remote
  listing passed;
- canonical cache-busted HTML, main JavaScript `assets/index-CIqE7xCi.js` and
  CSS `assets/index-CYzepEor.css` are byte-identical to local at SHA-256
  `5d99e85899f6b6d431a41431f976bfaa077c268767c5f3141ba19179f2bdfc44`,
  `e2cefbfa77e4ae03f9234f913e78b5dd6e15b8344733f09103c15c51a5f8e7c1`
  and `b76dd0ae8dfbcdb0f51eab10aa1d53ff725ccf1fba18116f4e3b97257f23cf1c`;
- the live endpoint retains its no-store headers and returns the expected
  `405 method_not_allowed` boundary for a read request;
- a **262,144-byte** intentional invalid-schema POST, larger than the retired
  192 KiB ceiling, reached live schema validation and returned
  **`422 schema_rejected`** instead of `413 payload_size_rejected`. The probe
  could not invoke mail transport and proves that the raised request gate is
  active without sending a diagnostic email;
- a fresh real-Tesla drive remains the acceptance test for long-session fitting,
  mail-transport handoff and recipient-inbox delivery.

## Kinetic visual and ATLAS publication evidence — 2026-08-28

- build stamp: **`20260828-1131`**; deployed commit: `33ae761`;
  implementation: `3cf0eaa`;
- gate before upload: **PASS**, 149 unit tests, 4 packaging tests, production
  build, Product Design comparisons at `773 × 601`, read-only remote identity
  verification and no preflight writes;
- publication: **PASS**, 25 files / 27,414,788 bytes uploaded to the canonical
  root; dynamic root, retained cache overlap, exact legacy cleanup and remote
  listing passed;
- canonical bare and cache-busted HTML: **HTTP 200**, `no-store`, and
  byte-identical to local at SHA-256
  `d42d3c73dceb7e6f7c090b483a2cc3f7b3f874ff41f8f05a2395b1e0c19ee0cf`;
- live main JavaScript `assets/index-lIaethjV.js` and CSS
  `assets/index-CYzepEor.css` are byte-identical at SHA-256
  `6a9746cba7540fdeb3ecb41345213103b05880037fbd8af112caed4e38f39195`
  and `b76dd0ae8dfbcdb0f51eab10aa1d53ff725ccf1fba18116f4e3b97257f23cf1c`;
- live ATLAS component `assets/atlas-field-CycZfcvK.js`, MapLibre
  `assets/maplibre-gl-COOsKdIG.js`, and QR runtime
  `assets/browser-oYWuKH21.js` are byte-identical at SHA-256
  `59f19f81687007890fafa00e85b5611a5a7a905ae51738d1cd27cd4373f52154`,
  `77b6c3c041182f4cc21be2219d4c860bcf8b6428085e8559e39c111dde50500e`
  and `9a05435db031fb6d8cde1af87bed3a198b6b95abcf1f1fb75cb5866240d07ac6`;
- exact local `773 × 601`, `80 km/h` simulation: Meridian **59.99 FPS / 18.0
  ms p95**, Latitudes **59.99 FPS / 17.5 ms p95**, ATLAS **60.00 FPS / 18.3
  ms p95**, and zero frames over 34 ms. ATLAS latest browser-exposed heap was
  55.7 MB, with an 84.9 MB initialization peak;
- live Browser QA at `773 × 601`: **PASS** for build identity, launch, the
  five-entry Visual library, ATLAS selection, privacy-safe reliable-position
  waiting state and zero console warnings/errors. Full live OpenFreeMap,
  Wikipedia and QR behavior passed locally with the explicit development demo
  location; a real GPS fix was deliberately not transmitted during desktop QA;
- real-Tesla acceptance remains open for sustained ATLAS memory/GPU behavior,
  real-position place relevance, passenger QR scanning and the perceived motion
  of Meridian and Latitudes during acceleration and deceleration.

## Tesla-informed Flux refinement publication evidence — 2026-08-28

- build stamp: **`20260828-1001`**; deployed commit: `f788544`;
  implementation: `436e9f9`;
- gate before upload: **PASS**, 142 unit tests, 4 packaging tests, production
  build, deterministic 157-sample MIME/GZIP round trip, read-only remote
  identity verification and no preflight writes;
- publication: **PASS**, 21 files / 26,357,008 bytes uploaded to the canonical
  root; dynamic root, retained cache overlap and exact remote listing passed;
- canonical cache-busted HTML: **HTTP 200**, `no-store`, and byte-identical to
  local at SHA-256
  `ccb04ae1e1f36b21e7c0567d38748ca724e793164a0edb8cb1ece64b359bb95a`;
- live JavaScript `assets/index-kTBVQ78H.js`, CSS
  `assets/index-Bd_TPTR6.css` and AudioWorklet
  `assets/score-processor-B3O5Fcwp.js` are byte-identical to local at SHA-256
  `8963dd8a3f9516f96c776ebcea86e4190db66b9d00b752ed8d8a6da5c6c1c2ed`,
  `670b7c383c78118ebfcb42a8c1dee51b4c5ffa3721fc1ff0e995f7f05be05128`
  and `9e2d612a94bce99733445047d10138d5573e9d425ef56e19ccc7061762f18ab3`;
- live `audio/junction.svb`: **HTTP 200**, 25,044,179 bytes and byte-identical
  to local at SHA-256
  `49c87e66903a34b69d035bac903759fe5c9f4a685053af6dc29e31abdadadf38`;
- live Browser QA at `773 x 601`: **PASS**. The launch transition succeeds;
  the compact 64 px footer exposes icon-only audio, vertically ordered Visual
  and Music selectors, disclosure carets and the `PALETTE` control; the Visual
  library opens and closes correctly. The loaded surface reports build
  `20260828-1001`;
- real-Tesla acceptance remains open for Aperture morph frame pacing, GPS
  confidence handling and the perceived musical variety of the five-family
  JUNCTION bank.

## Complete diagnostic attachment publication evidence — 2026-08-28

- build stamp: **`20260828-0927`**; deployed commit: `2b15fdf`;
  implementation: `76d90d8`;
- gate before upload: **PASS**, PHP syntax, 137 unit tests, 4 packaging tests,
  production build, deterministic MIME/GZIP round trip, read-only remote
  identity verification and no preflight writes;
- publication: **PASS**, 21 files / 26,063,049 bytes uploaded to the canonical
  root; dynamic root, retained cache overlap and exact remote listing passed;
- canonical bare and cache-busted HTML: **HTTP 200**, `no-store`, proxy-cache
  `MISS`, and byte-identical to local at SHA-256
  `aa4bd1a0411ad8d846b59aad7a30f640fc0903adb7251aae2e989bc2de84c19b`;
- live JavaScript `assets/index-bFA5wPdk.js` is byte-identical at SHA-256
  `e2aa21fd5ac9fc5f81f66b3744466bac9bf818aa8928f5433e79f9b893257de1`;
  live CSS `assets/index-5KrYVd1i.css` remains byte-identical at SHA-256
  `79558d905d65c57f8fe1a715c43b83f89c456539db1255af8eaf2ba970d8a549`.
  The JavaScript reports build `20260828-0927` and commit `2b15fdf`;
- endpoint method gate: **PASS**, a live `GET` remains `405
  method_not_allowed`;
- one explicitly authorized coordinate-free synthetic report with 157 flight
  samples: **PASS**, live response `202 accepted_by_mail_transport`. This proves
  that the deployed endpoint handed the multipart message to the configured
  mail transport; recipient-inbox arrival and attachment display remain a
  separate user-visible confirmation.

## Flat Signal Gate publication evidence — 2026-08-28

- build stamp: **`20260828-0127`**; deployed commit: `9d045ff`;
  implementation: `c3c2bdb`; deployment-gate correction: `f84905c`;
- gate before upload: **PASS**, 136 unit tests, 4 packaging tests, production
  build, pixel-normalized Product Design comparison at `773 × 601`, explicit
  argument gate, read-only remote identity verification and no preflight writes;
- publication: **PASS**, 21 files / 26,059,857 bytes uploaded to the canonical
  root. Three retired launch textures and their now-empty `ui/` directory were
  removed only after their names and SHA-256 identities matched the allowlist;
- canonical bare and cache-busted HTML: **HTTP 200**, `no-store`, proxy-cache
  `MISS`, and byte-identical to local at SHA-256
  `ec534393979581420d7cdb11d9c420b03de59a6c5b98d09dc33c54a75c587ed8`.
  Both reference `assets/index-_FdJTv-9.js` and
  `assets/index-5KrYVd1i.css`;
- live JavaScript and CSS are byte-identical to local at SHA-256
  `8d2ff4da0d9057abea9fbeec36ec1ead39797b4828df8ba91a0874de24845268`
  and `79558d905d65c57f8fe1a715c43b83f89c456539db1255af8eaf2ba970d8a549`.
  The JavaScript reports build `20260828-0127` and commit `9d045ff`;
- live Browser QA at `773 × 601`: **PASS**. The launch surface is exactly
  `390 × 170 px`, contains only the enlarged `sedicivalvole` wordmark and
  `PLAY THE ROAD`, transitions into the experience, and emits zero console
  warnings or errors;
- unqualified URLs for the three retired textures can temporarily return stale,
  unreferenced provider-cache copies. A cache-busted request is **HTTP 404** at
  the origin, confirming the exact cleanup without treating edge expiry as a
  publication prerequisite.

## Braun launch and phase-diagnostics publication evidence — 2026-08-28

- build stamp: **`20260828-0100`**; deployed commit: `81824b8`;
  implementation: `5ed9981`;
- gate before upload: **PASS**, 133 unit tests, 4 packaging tests, production
  build, pixel-normalized Product Design comparison at `773 × 601`, read-only
  remote identity verification and no preflight writes;
- publication: **PASS**, 24 files / 26,071,715 bytes uploaded to the canonical
  root; dynamic root and cache-overlap retention passed;
- canonical cache-busted HTML: **HTTP 200**, `no-store`, byte-identical to the
  local build, and references `assets/index-BzWV8UEY.js` plus
  `assets/index-DArx3tJD.css`;
- the live JavaScript, CSS, technical vent, red safety insert and latch are each
  byte-identical to the local build. The bundle reports build `20260828-0100`
  and commit `81824b8`;
- live Browser QA at `773 × 601`: **PASS** for the selected `390 × 170 px`
  Braun instrument plate, integrated wordmark, launch interaction, shadowed
  borderless DIAG drawer and zero console warnings/errors;
- live Demo evidence crossed Signal Gate, Aperture + JUNCTION, Vertigo +
  JUNCTION and the Vertigo/JUNCTION DIAG state. The report recorded five phase
  summaries, **60.38 FPS / 18.4 ms p95**, 12 MB browser-exposed JavaScript heap,
  33.2 MB decoded PCM, zero runtime issues and no coordinate keys;
- one explicitly authorized live diagnostic submission at approximately
  `2026-08-28 01:04` local time: **PASS** with UI state `SENT` and server status
  `accepted_by_mail_transport`. Inbox delivery remains a separate user check.

## JUNCTION 104-clip publication evidence — 2026-08-28

- build stamp: **`20260827-2359`**, generated immediately before midnight and
  published at `2026-08-28 00:00` local time; live commit: `1238cbd`;
  implementation: `532b30e`;
- gate before upload: **PASS**, 132 unit tests, 4 packaging tests, production
  build, read-only remote identity verification, and no preflight writes;
- publication: **PASS**, 21 files / 26,054,733 bytes uploaded to the canonical
  root; dynamic root and exact remote tree checks passed;
- canonical cache-busted HTML references `assets/index-DEvqM5Eh.js`; the live
  bundle reports build `20260827-2359` and commit `1238cbd`;
- `audio/junction.svb?build=20260827-2359`: **HTTP 200**, 24,753,770 bytes and
  byte-identical to the local bank at SHA-256
  `83fe3058d6a5466ecdc8439a61de2a4023d6ce977722407b2fb134798977f314`;
- live Browser QA at `773 x 601`: **PASS**. The report confirms 104 clips built
  from 126 distinct recordings, live pair `8 + 2`, six decoded clips / 34.8 MB
  PCM, one bank fetch, and active playback. Vertigo and JUNCTION sustained
  **60 FPS / 17.4 ms p95** for 35.7 seconds, with no frame above 34 ms, no long
  task, no runtime issue, and 10.4 MB used JS heap;
- GPS permission was denied in desktop QA; real-vehicle GPS and listening
  acceptance remain separate gates.

## JUNCTION live-mixing publication evidence — 2026-08-27

- build stamp: **`20260827-2342`**, confirmed in the cache-busted canonical
  bundle and live diagnostic report; deployed commit: `c17700c`;
  implementation: `da845b3`;
- gate before upload: **PASS**, 132 unit tests, 4 packaging tests, production
  build, read-only remote identity verification, and no preflight writes;
- publication: **PASS**, 21 files / 7,039,010 bytes uploaded to the canonical
  root; the dynamic root and exact remote tree checks passed;
- canonical cache-busted HTML references `assets/index-DUQ4yXsb.js`, whose live
  bundle reports build `20260827-2342` and commit `c17700c`;
- `audio/junction.svb?build=20260827-2342`: **HTTP 200**, 5,738,856 bytes and
  byte-identical to the local bank at SHA-256
  `f2d56e8a8c3e69be4f2b98e6db845b1024ed96487cb9a99ca92fe0e5498d16d6`;
- live Browser QA at `773 x 601`: **PASS**. JUNCTION reported
  `mixing: live-two-deck`, take pair `2 + 3`, sample playback active at a
  beatless 127 BPM rest state, one 17,416,128-byte decoded block, and one bank
  fetch. Vertigo and JUNCTION sustained **60 FPS / 18.5 ms p95** for 36 seconds,
  with no frame above 34 ms, no long task, no runtime issue, and 11.4 MB used JS
  heap;
- GPS permission was denied in the desktop Browser QA; this does not verify the
  target vehicle's GPS path, which remains a separate real-Tesla gate.

## JUNCTION road-energy pacing publication evidence — 2026-08-27

- build stamp: **`20260827-2323`**, confirmed on the canonical splash and in the
  live diagnostic report; deployed commit: `36efdd2`; implementation:
  `019368f`;
- gate before upload: **PASS**, 130 unit tests, 4 packaging tests, focused
  rendered-audio analysis and a production build;
- the bank contains 24 gapless authored sections across native 127, 135, 158,
  160, 164 and 168 BPM recordings. Rest has no break or bassline; the primary
  beat is gain-bounded and enters near 13 km/h through a rising phrase envelope;
- read-only deployment preflight: **PASS**, `remote_writes=NONE`; intentional
  upload: **PASS**, 21 files and 7,026,467 bytes;
- canonical `/`: **HTTP 200**, `no-store`, and byte-identical to local
  `index.html` at SHA-256
  `70ddc9eab773c4dfaf1b58ebdbe6bd5ddd53a68a1577386ae4937fb592cc8fb3`;
- `assets/index-C-Mh8nsL.js`: **HTTP 200**, byte-identical at SHA-256
  `bcb91f6819b1eb6ca54fccdf7d2a9fd7d2d7af6a63fd61f8eae017ffb64b59e4`;
- `audio/junction.svb?build=20260827-2323`: **HTTP 200**, 5,730,210 bytes and
  byte-identical at SHA-256
  `57493dfe0009ef07c518bd9a9e45049bbc9c78735a6e5109fc137d51dde6c4ad`;
- live Browser QA at `773 x 601`: **PASS**. JUNCTION reported build
  `20260827-2323`, commit `36efdd2`, `bankLoaded: true`, `playing: true`, 127 BPM,
  `ambient`, and only `harmony` plus `atmosphere` lanes at rest. The take changed
  from **3 to 2** at the next eight-bar boundary without introducing rhythm;
- simultaneous Vertigo and JUNCTION playback sustained **60 FPS / 17.5 ms
  p95**, with no frame over 34 ms and zero runtime issues. The 30, 40 and 60
  km/h tempo-state mappings are deterministic-test evidence; listening
  acceptance at those speeds remains a real-Tesla gate. No diagnostic was sent.

## JUNCTION authored-variation publication evidence — 2026-08-27

- build stamp: **`20260827-2304`**, confirmed on the canonical splash and in the
  live diagnostic report; deployed commit: `42149f8`; arrangement
  implementation: `ef0c0d0`;
- gate before upload: **PASS**, 129 unit tests, 4 packaging tests and a
  production build;
- JUNCTION now contains 192 rendered bars: three complete takes for each of
  eight energy states, giving 24 eight-bar sections in one bank. The runtime
  chooses only at a section boundary and excludes the take that just played;
- deployment identity correction: **PASS**. The read-only gate recognizes only
  the owned `SVJCTN01` signature and constrained JUNCTION manifest before an
  update; after upload it verifies the complete new audio tree byte-identically;
- the first `20260827-2302` publication exposed a provider-cache discrepancy:
  FTP contained the new bank while the bare HTTP audio URL returned the previous
  1.9 MB object. No false live claim was made. Build `20260827-2304` versions the
  bank request with its generated build stamp;
- canonical `/`: **HTTP 200**, `no-store`, and byte-identical to local
  `index.html` at SHA-256
  `a813138de3df839ae6d2a7870fbd51f5766418b7efd9238bdfc147e7f8056701`;
- `assets/index-Cp9K7P56.js`: **HTTP 200**, byte-identical at SHA-256
  `6f249e31f3eeddc884a8dc558abc35dd2df113e58d886a655f7fa25862713ee7`;
- `audio/junction.svb?build=20260827-2304`: **HTTP 200**, 5,113,449 bytes and
  byte-identical at SHA-256
  `f925a973508794bc5d8e8d11c4112b1565fc48fa6746f79ab6594d74bd0bca21`;
- live Browser QA at `773 x 601`: **PASS**. JUNCTION reports `bankLoaded: true`,
  `playing: true`, 5,111,017 encoded audio bytes and one sampled-production
  runtime. The observed take changed from **3 to 1** across the next eight-bar
  boundary, proving the anti-repeat selection in the published runtime;
- simultaneous Vertigo and JUNCTION playback sustained **60 FPS / 17.6 ms
  p95**, with no frame over 34 ms, no long task and zero runtime issues. No
  diagnostic was sent.

## Vertigo road-scale publication evidence — 2026-08-27

- build stamp: **`20260827-2245`**, confirmed on the canonical splash and in the
  live diagnostic report; deployed commit: `fba4002`; visual implementation:
  `359e6c6`;
- gate before upload: **PASS**, 127 unit tests, 4 packaging tests and a
  production build;
- the first intentional publication attempt stopped at the read-only identity
  gate with `unexpected_canonical-root_entry` and performed no remote write.
  Cause: the previous JUNCTION publication had created the legitimate `/audio/`
  tree, but the next-run allowlist did not yet recognize it;
- deployment gate correction: **PASS**. `/audio/` is accepted only when every
  remote entry exists in the local production tree and is byte-identical. The
  explicit `--verify-only` run reported `remote_writes=NONE` before the final
  intentional publication;
- canonical `/`: **HTTP 200**, `no-store`, and byte-identical to local
  `index.html` at SHA-256
  `e1fe84e661330c25656eea7c92d64888717cea6ad3395f4d599a357722afc879`;
- `assets/index-CKJo1GEj.js`: **HTTP 200**, byte-identical at SHA-256
  `6259d609902cb7c8219e33826c04cbae735d3120e6dba5939fd95d61a6c1f5bd`;
- upstream `js/InfiniteLights.js` remains byte-identical at SHA-256
  `683fc98dac19460d478307bebe92751858456a5414c4834ac8d9caf9741e015e`;
- live Browser QA at `773 x 601`: **PASS**. Vertigo enters with the road filling
  the viewport, reports `WebGL · Original Interstate 7`, sustains **60 FPS / 17.3
  ms p95**, and records zero runtime issues. The console contained no warnings
  or errors. No diagnostic was sent.

## Flux performance publication evidence — 2026-08-27

- build stamp: **`20260827-2232`**, confirmed on the canonical splash and in the
  live diagnostic report;
- deployed commit: `f9bb395`; implementation checkpoints: Aperture `87362c5`,
  Vertigo `e57400d`, compact footer `afc3001`, JUNCTION `023717c`;
- gate before upload: **PASS**, 126 unit tests, 4 packaging tests and a
  production build;
- publication argument gate: **PASS**, `--help` printed usage and performed no
  deployment before the intentional invocation;
- canonical bare `/` and cache-busted `/?build=20260827-2232`: **HTTP 200**,
  `no-store`, and byte-identical to local `index.html` at SHA-256
  `988fdfff96addf5e4f1e4ba3bbd6e470f50614d5f59bfd1b4a2750d220d74780`;
- application JavaScript, CSS and AudioWorklet are live and byte-identical to
  the production build at SHA-256 `65d32784418ac1a9acb1e7ed74d9a290b9b43dbb63ebe4c4d5361186a625539a`,
  `1a3359557b741048d4afcf0f109c0492d3f7a28494832877637fee5e60bb3ccc`
  and `9e2d612a94bce99733445047d10138d5573e9d425ef56e19ccc7061762f18ab3`;
- `audio/junction.svb`: **HTTP 200**, 1,906,749 bytes and byte-identical at
  SHA-256 `82d93e136fd53e6e98143e5b108bcb9904d0508f1f0d9908cfd681be55bf66f8`;
- live raw diagnostics at `773 x 601`: build `20260827-2232`, commit `f9bb395`,
  JUNCTION `bankLoaded: true`, `playing: true`, Web Audio `running`, Aperture
  **59.99 FPS / 17.5 ms p95**, and zero runtime issues;
- live Vertigo QA: **PASS** for editorial-shell removal and the ACID magenta/green
  runtime palette; the inspected console contained no warnings or errors;
- upstream Vertigo `index7.html` and `js/InfiniteLights.js` remain live and
  byte-identical to the pinned local files; development-only QA routes remain
  **HTTP 404**. No diagnostic was sent.

## Documentation-cleanup publication evidence — 2026-08-27

- build stamp: **`20260827-2204`**, confirmed on the live splash and in the
  served bundle;
- deployed commit: `12e2eaa`; documentation alignment: `31f8dc4`; Tesla
  top-bar correction: `e7adfb0`;
- gate before upload: **PASS**, 121 unit tests, 4 packaging tests and a
  production build;
- publication argument gate: **PASS**, `--help` printed usage and performed no
  deployment before the intentional invocation;
- read-only FTP identity gate: **PASS**, `target=canonical_root`;
- upload: **PASS**, 20 files, 1,287,011 bytes; 2 previous assets retained for
  cache overlap; legacy cleanup removed 0 files and 0 directories;
- canonical bare `/`: **HTTP 200**, `no-store`, and byte-identical to the local
  `index.html` at SHA-256 `d29b484b09392e31fdd3ab50002ddbfa17892c1b5fe5daa464cfd9702bfed2d9`;
- `assets/index-9g75xhqi.js`: **HTTP 200**, 300,952 bytes, byte-identical at
  SHA-256 `2fee45b57cafc63313178ffbb948c1f5ff61ff953ac8f9e2f0c6cb1e188d5c1b`;
- `assets/index--Wp7rQBn.css`: **HTTP 200**, 17,814 bytes, byte-identical at
  SHA-256 `85d0da1c2613edc3c2e69ec5c00d78bdb5208b75ff7d61c9df73947bccc8d652`;
- `assets/score-processor-B3O5Fcwp.js`: **HTTP 200**, 92,481 bytes,
  byte-identical at SHA-256
  `9e2d612a94bce99733445047d10138d5573e9d425ef56e19ccc7061762f18ab3`;
- live Chrome QA at the photographed `773 x 601` split viewport: **PASS** for
  Signal Gate launch, WebGL2 Aperture rendering, `FRACTURE`, Web Audio,
  diagnostics access and zero runtime issues; the source readout and mode
  selector have **0 px** horizontal overlap;
- the live raw diagnostic contains both build `20260827-2204` and commit
  `12e2eaa`. No diagnostic was sent.

## Score engine publication evidence — 2026-08-27

This is the first publication in which the authored score actually plays. The
engine in `src/score/` existed but had never been connected; a separate
hardcoded worklet played instead.

- build stamp: **`20260827-2006`**, confirmed present in the served bundle;
- deployed commit: `5d993e3`;
- gate before upload: **PASS**, 117 unit tests, 4 packaging tests, production build;
- read-only FTP identity gate: **PASS**, `target=canonical_root`;
- upload: **PASS**, 20 files, 1,286,988 bytes; 2 previous assets retained for cache overlap;
- legacy cleanup: 0 files, 0 directories;
- canonical bare `/`: **HTTP 200**, 655 bytes, SHA-256 prefix `5a69d37ff49e658e`,
  **byte-identical** to the local build;
- `assets/index-e7PsIBjf.js` and `assets/index-CKjyK-kn.css`: **HTTP 200**, byte-identical local/live;
- `assets/score-processor-B3O5Fcwp.js`: **HTTP 200**, 92,481 bytes, byte-identical.
  This is the bundled AudioWorklet, and its presence live is what proves the
  score engine is the thing being served rather than the previous worklet;
- development-only QA harness correctly absent: `/qa-field.html` and
  `/qa/field-harness.jsx` both **HTTP 404**;
- no sample material published: `/audio/`, `/audio/junction/` and a probe for a
  pack filename all **HTTP 404**;
- live smoke test at `966 × 751` against `https://sedicivalvole.app/`: splash,
  launch, held accelerator to 93 km/h, `FRACTURE` reported in the command bar,
  tempo readout at 169 BPM rising with speed, Aperture tunnel rendering, the
  compact command bar with ten body-colour pills and the mute icon.

Process note: the publication was again triggered by invoking the script with
`--help`, which it ignored — the exact defect the previous entry said "should
grow an explicit argument gate before it is run again". The working tree was
committed and the full suite was green, and the user had just asked for a live
deploy, so the published result is the intended one. The gate now exists:
`parse_arguments` prints usage and publishes nothing for `--help` or for any
unrecognised argument, and the script states that it has no dry-run mode.

## Four-environment publication evidence — 2026-08-27

- deployed commit: `2d28671`;
- build/test gate before upload: **PASS**, 90 unit tests, 4 packaging tests, production build;
- read-only FTP identity gate: **PASS**, canonical root and legacy targets recognized;
- upload: **PASS**, 19 files, 1,184,241 bytes;
- legacy cleanup: 0 files, 0 directories; one previous asset retained for cache overlap;
- canonical bare `/`: **HTTP 200**, 655 bytes, SHA-256
  `3a003cfc6eb477f4e0301351119f254e17ca91e7d34a9f818603a8cace76c0b7`, byte-identical to the local build;
- response headers on `/`: `cache-control: no-store, no-cache, must-revalidate, max-age=0`,
  `x-proxy-cache: MISS`; the observed edge header is `server: nginx`, which identifies the
  responding edge only and says nothing about the provider's origin topology;
- `assets/index-D3N4U_ZA.js` and `assets/index-BDcTDdtP.css`: **HTTP 200**, byte-identical local/live;
- vendored Interstate 7 tree verified live: `js/InfiniteLights.js` and `index7.html` are
  **HTTP 200** and their live hashes match the SHA-256 values pinned in
  `tests/interstate-7-bridge.test.mjs`, so the byte-identical upstream runtime is what is served;
- development-only QA harness correctly absent: `/qa-field.html` and `/qa/field-harness.jsx`
  both **HTTP 404**;
- live smoke test at `773 × 601`: Signal Gate splash, wordmark, `FLUX · APERTURE · 0.0.0`
  status, `PLAY THE ROAD` control and the then-current project credit all render.

This publication carries `MERIDIAN 03` and `LATITUDES 04` alongside the existing
`APERTURE 01` and `VERTIGO 02`. No audio change ships in it: the ported textStep
engine is present in source but is not yet wired to the running experience.

Process note: this deployment was triggered by invoking the publication script
with an unsupported `--help` argument, which the script does not implement and
therefore ignored, running a real publication. The user had just requested a live
deploy and the working tree was committed with the full suite green, so the
published result is the intended one, but the script should grow an explicit
argument gate before it is run again.

## Aperture ring-geometry publication evidence — 2026-08-27

- build stamp: **`20260827-1412`**, confirmed live in the served bundle;
- upload: **PASS**, 19 files, 1,189,274 bytes; canonical root **HTTP 200**;
- `assets/index-DdzZhJgC.js` and `assets/index-BRki9k3i.css`: **byte-identical** local/live;
- restores the ring field so tile edges align across a wall and corners stay
  crisp, tuned so 20 km/h matches the user's reference proportion.

## Splash and Aperture publication evidence — 2026-08-27

- build stamp: **`20260827-1401`**, confirmed live in the served bundle;
- deployed commit: the splash and Aperture continuity pass;
- gate before upload: **PASS**, 90 unit tests, 4 packaging tests, production build;
- read-only FTP identity gate: **PASS**;
- upload: **PASS**, 19 files, 1,188,702 bytes; one previous asset retained for cache overlap;
- canonical bare `/`: **HTTP 200**;
- `assets/index-B3N2PG9G.js` and `assets/index-BRki9k3i.css`: **byte-identical** local/live;
- rendered QA through the development harness at 0, 20, 45 and 115 km/h: no tile
  tearing at any intermediate speed, which is where it previously appeared.

Ships: the build stamp on the splash, the reworked launch control, the animated
splash lanes, and the rebuilt Aperture field. No audio change.

## Current verified state

- provider reported by the user: **SiteGround**;
- configured protocol: **passive FTP on port 21**;
- FTP account home contains `sedicivalvole.app/public_html`;
- configured web root: `sedicivalvole.app/public_html`;
- canonical development URL: [https://sedicivalvole.app/](https://sedicivalvole.app/);
- the previous wrong FTP-home diagnostics tree was removed after exact-name validation and explicit authorization;
- the canonical root now hosts the current Drive Lab build.

## Canonical-root deployment evidence — 2026-08-26

- read-only remote identity gate: **PASS** for the SiteGround placeholder and every legacy build file;
- upload: **PASS**, 4 files, 1,916,503 bytes;
- exact cleanup: **PASS**, 5 files and 3 directories removed;
- root remote listing after publication: 2 entries (`index.html` and `assets/`);
- canonical URL: **HTTP 200**;
- obsolete `/diagnostics/drive-lab/`: **HTTP 404**;
- HTML, JavaScript, CSS, and image: local/live byte counts and SHA-256 hashes all identical;
- selected-browser smoke test: Signal Gate splash, `PLAY THE ROAD`, GPS permission state, audio/visual controls, and integrated report all rendered in English;
- observed HTTP edge header: `server: nginx`; this identifies the responding edge but does not prove the provider's full origin topology.

## Modular Aperture publication evidence — 2026-08-26

- target commit: `487f9ee` plus the deployment-safety follow-up documented below;
- read-only FTP identity gate: **PASS**, 3 recognized canonical-root entries;
- non-destructive upload: **PASS**, 5 files, 247,235 bytes;
- cleanup: **SKIPPED** with `--preserve-existing`; previous assets retained for cache overlap;
- cache-busted HTML and new JavaScript/CSS: **HTTP 200** and byte-identical local/live SHA-256 hashes;
- new JavaScript: `index-B5aZa7cA.js`, 229,774 bytes, SHA-256 `04505443b6b2cb9d17034b30ec09ad082c74e8dd6a91b5e5e5cf4680e4c30e15`;
- new CSS: `index-DlWvHqKL.css`, 11,743 bytes, SHA-256 `492e30abcb5e19e06209b81f3b9ae3f45d47db731a2c89b2bc0a7c7961532ef3`;
- cache-busted HTML: 655 bytes, SHA-256 `a3b80cf30a6d4ccae696953ac5ee2c6e014fb984af4f7d1054b4c22d5268eec0`;
- canonical bare `/`: **FAIL / stale** after two checks, still 587 bytes and still referencing `index-CKjMDFcj.js` plus `index-BbWXMXk1.css`;
- cache-busted `/` and direct `/index.php`: current build; bare-root convergence or an authorized provider cache flush is still required before this publication can be called a successful canonical deployment.

## Split-view diagnostics deployment evidence — 2026-08-26

- commit deployed: `fb2e8d1`;
- read-only remote identity gate: **PASS**, including the existing diagnostic API identity rule;
- upload: **PASS**, 5 files, 1,931,920 bytes;
- canonical root listing: 3 entries (`index.html`, `assets/`, and `api/`);
- cache-busted HTML, JavaScript, CSS, and image: **HTTP 200** with byte-identical local/live SHA-256 hashes;
- selected-browser responsive check: **PASS** at the photographed Tesla split viewport `773 × 601`;
- compact top-bar `DIAG`, full-width scrollable report, and sticky `SEND DIAGNOSTIC` action: **PASS**;
- live endpoint rejection checks: wrong method `405`, foreign origin `403`, coordinate field `422`;
- one authorized live diagnostic: **202 / accepted by the server mail transport**;
- Gmail inbox delivery remains user-confirmed evidence and is not implied by PHP mail handoff.

## Extended diagnostics v3 publication evidence — 2026-08-26

- deployed commits: `d261b57` and `8c5da9d`;
- build/test gate: **PASS**, 11 unit tests, 4 packaging tests, production build, PHP syntax, and diff check;
- read-only FTP identity gate: **PASS**, including the previous v2 endpoint and private recipient structure;
- non-destructive upload: **PASS**, 5 files, 255,482 bytes; no legacy cleanup;
- cache-busted HTML and direct `/index.php`: 655 bytes, SHA-256 `2ca6f6e9b4f3019304d1b22c2c423105de8ff053f14a9681ab12908d9cb91316`, byte-identical to local;
- JavaScript: `index-Qo4012ws.js`, 237,965 bytes, SHA-256 `65c2dee70d131ee22eafb02a8c773e2eaf45b08156ef375094345c40a5af0739`, byte-identical local/live;
- CSS: `index-DlWvHqKL.css`, 11,743 bytes, SHA-256 `492e30abcb5e19e06209b81f3b9ae3f45d47db731a2c89b2bc0a7c7961532ef3`, byte-identical local/live;
- live v3 endpoint checks: wrong method `405`, foreign origin `403`, abbreviated coordinate key `422`, and legacy v2 schema `422`;
- live selected-browser QA at `773 × 601`: **PASS** for WebGL2, Web Audio, v3 JSON, frame/RTT cards, scrollable report, and Demo response;
- one user-authorized live v3 report: **202 / accepted by the server mail transport**; Gmail inbox delivery remains pending user confirmation;
- built-in version reported by the live v3 report: `0.0.0`, matching `VERSION`;
- canonical bare `/`: **FAIL / provider cache still stale**, 587 bytes, SHA-256 `0407fb0914ab6d11655184a54e6ace05523b0ec4d081d8543fc3727de9b57150`, still referencing `index-CKjMDFcj.js` and `index-BbWXMXk1.css`;
- this upload is therefore not recorded as a successful canonical deployment until the provider cache is flushed and bare `/` converges.

## Dark Aperture and resting-chrome publication evidence — 2026-08-26

- deployed commits: `32c9a1d` and `8f70752`;
- build/test gate: **PASS**, 11 unit tests, 4 packaging tests, production build, rendered QA, clean browser console, and diff check;
- non-destructive upload: **PASS**, 5 files, 256,526 bytes; read-only remote identity passed and legacy cleanup was skipped;
- cache-busted HTML and direct `/index.php`: 655 bytes, SHA-256 `0773edc78f40d22e4e381372084eb4827a7fe43972fa18cd0932d7312e12d15a`, byte-identical local/live;
- JavaScript: `index-D7jQ9Ez8.js`, 238,300 bytes, SHA-256 `3293dff33b5889a329ba8a5527ca6d2bcec6c2e7f3eb5e6e8a836ee472079241`, byte-identical local/live;
- CSS: `index-DhSenu4k.css`, 12,452 bytes, SHA-256 `e76f1af600812f20a122b63586dcd4e32e79a99fa951a78c7f74c095e3d96a89`, byte-identical local/live;
- live selected-browser QA at `773 × 601`: **PASS** for the dark terminal void, full off-canvas header/footer, persistent speed-only state, control wake, diagnostics access, and zero relevant console warnings/errors;
- canonical bare `/`: **FAIL / provider cache still stale**, still returning the prior 587-byte `x-proxy-cache: HIT` body and old assets;
- publication is available through the cache-busted root and direct PHP entry, but canonical deployment completion remains pending the SiteGround cache flush.

## Forward Flux motion publication evidence — 2026-08-26

- deployed commits: `5420a3f` and `bead2d7`;
- build/test gate: **PASS**, 14 signal/diagnostic unit tests, 4 packaging tests, production build, rendered comparison, clean browser console, and diff check;
- non-destructive upload: **PASS**, 5 files, 258,113 bytes; read-only remote identity passed and legacy cleanup was skipped;
- cache-busted HTML and direct `/index.php`: 655 bytes, SHA-256 `c88ab460a6c1e4841dc893a01e2e34ffcb150fda5b22250032c2f04f7abf9d40`, byte-identical local/live;
- JavaScript: `index-D_ERyfCr.js`, 239,792 bytes, SHA-256 `6fcf717335b7be9ef17fdde639835f2455649a9f2482937f74f800a5d7622684`, byte-identical local/live;
- CSS: `index-CjkHLkpC.css`, 12,547 bytes, SHA-256 `c5590d7bbba66609f4157e4f84b8a159f5893feabf663f472928cd4318509520`, byte-identical local/live;
- live selected-browser QA at `773 × 601`: **PASS** for forward tunnel response, Demo acceleration, opaque speed frame, diagnostics reachability, and zero relevant console warnings/errors;
- canonical bare `/`: **FAIL / provider cache still stale**, returning the prior 587-byte body, SHA-256 `0407fb0914ab6d11655184a54e6ace05523b0ec4d081d8543fc3727de9b57150`, with `x-proxy-cache: HIT` and the old asset pair;
- publication is verified through `/?qa=bead2d7-forward-motion` and direct `/index.php`, but canonical deployment completion remains pending the SiteGround cache flush.

## Canonical cache convergence — 2026-08-26

- user action: disabled SiteGround NGINX delivery caching and completed the provider cache flush;
- canonical bare `/`: **PASS**, HTTP 200 with `x-proxy-cache: MISS` and `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`;
- canonical HTML: 655 bytes, SHA-256 `c88ab460a6c1e4841dc893a01e2e34ffcb150fda5b22250032c2f04f7abf9d40`, byte-identical local/live;
- canonical asset references: `index-D_ERyfCr.js` and `index-CjkHLkpC.css`, matching the verified Forward Flux build;
- the canonical deployment is now complete; the earlier stale-root entries above remain as historical evidence of the provider-cache incident.

## Flat-grid and Plaid velocity publication evidence — 2026-08-26

- deployed commits: `649216a` and `06350df`;
- build/test gate: **PASS**, 14 signal/diagnostic unit tests, 4 packaging tests, production build, accepted-concept comparison, rendered flat/153 km/h QA, clean browser console, and diff check;
- non-destructive upload: **PASS**, 5 files, 259,397 bytes; read-only remote identity passed and legacy cleanup was skipped;
- canonical bare `/`: **PASS**, HTTP 200 with `x-proxy-cache: MISS` and the current no-store PHP entry;
- canonical HTML: 655 bytes, SHA-256 `43e2e79682ead51d5a406c29ef071bc4a6fce6edf91deb05aa549e5abc2c2666`, byte-identical local/live;
- JavaScript: `index-CyTY513x.js`, 241,076 bytes, SHA-256 `8a294a2f9f3f4d7fa621cf8772baed4431a3bd9368d8233a67b62730246da46b`, byte-identical local/live;
- CSS remains `index-CjkHLkpC.css`; the canonical HTML references the verified current JavaScript and CSS pair;
- live selected-browser smoke test at `773 × 601`: **PASS** for canonical-root load, WebGL rendering, Demo response, speed frame, and zero relevant console warnings/errors.

## Swiss score-field publication evidence — 2026-08-26

- deployed commits: `428a3cd` and `b910160`;
- build/test gate: **PASS**, 14 signal/diagnostic unit tests, 4 packaging tests, production build, accepted-concept comparison, rendered zero/transition/Plaid QA, clean browser console, and diff check;
- non-destructive upload: **PASS**, 5 files, 260,031 bytes; read-only remote identity passed, legacy cleanup was skipped, and the previous content-addressed asset was retained;
- canonical bare `/`: **PASS**, HTTP 200 with `x-proxy-cache: MISS` and `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`;
- canonical HTML: 655 bytes, SHA-256 `e1cb2c0585ea410c0546e4c066e1b0af360156abe6310fd26e1830f7068bffdf`, byte-identical local/live;
- JavaScript: `index-C6Cl7Zl6.js`, 241,710 bytes, SHA-256 `7dab8371e82193bb1767338eafe07df5ffb457def62e31dded86e2afd69e9e14`, byte-identical local/live;
- CSS: `index-CjkHLkpC.css`, 12,547 bytes, SHA-256 `c5590d7bbba66609f4157e4f84b8a159f5893feabf663f472928cd4318509520`, byte-identical local/live;
- live selected-browser QA at `773 × 601`: **PASS** for the ordered zero-speed field, off-canvas resting chrome, persistent speed frame, integrated diagnostics after the wake gesture, and zero relevant console warnings/errors;
- live report version: `0.0.0`, matching `VERSION`.

## Continuous Flux morph publication evidence — 2026-08-26

- deployed commits: `1d11b2b` and `95508b5`;
- build/test gate: **PASS**, 15 signal/diagnostic unit tests, 4 packaging tests, production build, accepted-concept comparison, and rendered acceleration/deceleration QA at `773 × 601`;
- deterministic rendered path: **PASS** for large complete squares at rest, smaller planar squares at city speed, one continuously warped transition field, a full high-speed tunnel, and the same geometric sequence in reverse during deceleration;
- non-destructive upload: **PASS**, 5 files, 259,637 bytes; read-only remote identity passed, legacy cleanup was skipped, and the previous content-addressed asset was retained;
- canonical bare `/` and cache-busted root: **PASS**, HTTP 200 with `x-proxy-cache: MISS` and `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`;
- canonical HTML: 655 bytes, SHA-256 `b9e843e400e991804b7f03a1e3823fa4a704c154234fa5d1f1d6106b6330bfb6`, byte-identical local/live;
- JavaScript: `index-BKVb6CUR.js`, 241,316 bytes, SHA-256 `255c6f54b0306bfafcf293d52d1b72d8b1dc8ed19a961f8fb773dd60f70ae205`, byte-identical local/live;
- CSS: `index-CjkHLkpC.css`, 12,547 bytes, SHA-256 `c5590d7bbba66609f4157e4f84b8a159f5893feabf663f472928cd4318509520`, byte-identical local/live and safely served from its content-addressed cache;
- live selected-browser load at `773 × 601`: **PASS** for the canonical app shell, current controls, WebGL field, and version `0.0.0`; the complete morph path is additionally proven against the byte-identical production bundle in local rendered QA.

## Integrated speed-frame publication evidence — 2026-08-26

- deployed commits: `b5d16ec` and `04484e4`;
- build/test gate: **PASS**, 15 signal/diagnostic unit tests, 4 packaging tests, production build, accepted-concept comparison, and rendered expanded/resting chrome QA at `773 × 601`;
- non-destructive upload: **PASS**, 5 files, 260,248 bytes; read-only remote identity passed, legacy cleanup was skipped, and two previous content-addressed assets were retained;
- canonical bare `/`: **PASS**, HTTP 200 with `x-proxy-cache: MISS` and `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`;
- canonical HTML: 655 bytes, SHA-256 `dae6ddec7adfe85d632c2064af7c5d2d7d938a87c59ac754db97f8043abcd720`, byte-identical local/live;
- JavaScript: `index-DZYwPj3z.js`, 241,316 bytes, SHA-256 `255c6f54b0306bfafcf293d52d1b72d8b1dc8ed19a961f8fb773dd60f70ae205`, byte-identical local/live;
- CSS: `index-C88ToKHS.css`, 13,158 bytes, SHA-256 `f485d7f445415ada6beca32cadc9917f8d498a4da4edd648bb2aa617c05836eb`, byte-identical local/live;
- live selected-browser QA at `773 × 601`: **PASS** for exact speed-cell alignment in expanded chrome, fixed detached placement with exposed 6 px lower corners, shared framed-control radii, diagnostics reachability, version `0.0.0`, and zero relevant console warnings/errors.

## Continuous square-to-tunnel deformation publication evidence — 2026-08-26

- deployed commits: `fd54616` and `1a6ffef`;
- build/test gate: **PASS**, 16 signal/diagnostic unit tests, 4 packaging tests, production build, accepted-concept comparison, and rendered acceleration/deceleration QA at `773 × 601`;
- deterministic morph path: **PASS** for square modules at 0 km/h, planar compaction through 55 km/h, progressive perspective at 80–90 km/h, a full bar-lined tunnel at 115 km/h, and a return to complete squares at 0 km/h without opacity fades;
- non-destructive upload: **PASS**, 5 files, 260,793 bytes; read-only remote identity passed, legacy cleanup was skipped, and the previous content-addressed asset was retained;
- canonical bare `/`: **PASS**, HTTP 200 with `x-proxy-cache: MISS` and `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`;
- canonical HTML: 655 bytes, SHA-256 `6e788ca3d9baf51fef266819a559d6322dce6108bc76123dc16eea2420dd48e7`, byte-identical local/live;
- JavaScript: `index-BZmTH6LF.js`, 241,861 bytes, SHA-256 `8b0775112d5af8fb4104810e916e9b6c9454bdc99e6511d38aca326c9091902f`, byte-identical local/live;
- CSS: `index-C88ToKHS.css`, 13,158 bytes, SHA-256 `f485d7f445415ada6beca32cadc9917f8d498a4da4edd648bb2aa617c05836eb`, byte-identical local/live;
- live selected-browser QA at `773 × 601`: **PASS** for the 0 → 80 → 115 → 0 geometry path, exact square endpoints, diagnostics reachability, version `0.0.0`, and zero relevant console warnings/errors.

## Vertigo environment publication evidence — 2026-08-26

- deployed commit: `98e8729`;
- build/test gate: **PASS**, 18 signal/diagnostic/environment unit tests, 4 packaging tests, production build, source-mechanics comparison, and rendered Tesla-viewport QA;
- non-destructive upload: **PASS**, 5 files, 272,199 bytes; read-only remote identity passed, legacy cleanup was skipped, and two previous content-addressed assets were retained;
- canonical bare `/` and cache-busted root: **PASS**, HTTP 200 with `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`;
- canonical HTML: 655 bytes, SHA-256 `1210c92f77c3f8b5ba6f93300883f48f389fe86ef2e150fcd0a75495ba203ebe`, byte-identical local/live and referencing the current asset pair;
- JavaScript: `index-VHgT5Mvz.js`, 253,085 bytes, SHA-256 `5cf1c7ff92947d77057010da9d486db505a79c8f1f21045ed0b09a1a29f88aea`, byte-identical local/live;
- CSS: `index-vRXZAAZt.css`, 13,340 bytes, SHA-256 `8749c63def17e5e80843114f8a31bb14b37b22014a69067da65339b5fc334913`, byte-identical local/live;
- live selected-browser QA at `773 × 601`: **PASS** for Aperture-to-Vertigo switching, one mounted canvas, persistent Vertigo selection, Demo motion through motorway speed, lateral wave/fold rendering, `WebGL2 · Vertigo`, diagnostics reachability, version `0.0.0`, and zero relevant console warnings/errors.

## Fixed road ceiling and refined Vertigo publication evidence — 2026-08-26

- deployed commit: `82cc321`;
- build/test gate: **PASS**, 18 signal/diagnostic/environment unit tests, 4 packaging tests, production build, Interstate 7 side-by-side comparison, and rendered `0`, `39`, and `130 km/h` QA at `773 × 601`;
- non-destructive upload: **PASS**, 5 files, 270,797 bytes; read-only remote identity passed, legacy cleanup was skipped, and two previous content-addressed assets were retained;
- canonical bare `/` and cache-busted root: **PASS**, HTTP 200 with `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`;
- canonical HTML: 655 bytes, SHA-256 `c239547ca819739693be49014daafdeb4a1dc153f80754f5972a6d30c0fa7635`, byte-identical local/live and referencing the current asset pair;
- JavaScript: `index-COO5GWe-.js`, 252,785 bytes, SHA-256 `7a5544bd183255f1a0b8ee428780e486b368fa1a0d3be2f26c7751be423634c5`, byte-identical local/live;
- CSS: `index-DuXc51GK.css`, 12,238 bytes, SHA-256 `72cced49c7497e2aa9e401997c3e11a32b35612c84388e405a029719af62f701`, byte-identical local/live;
- live selected-browser QA at `773 × 601`: **PASS** for the removed threshold control, `VISUAL` selection, truthful textStep score roadmap, unmistakable Aperture tunnel at `39 km/h`, fixed `130 km/h` diagnostic ceiling, `score: prototype`, one WebGL2 canvas, reachable diagnostics, version `0.0.0`, and zero relevant console warnings/errors.

## Signal Gate splash publication evidence — 2026-08-26

- deployed commit: `78c9a5c`;
- Product Design gate: **PASS** for the selected source-versus-build comparison, requested CTA/credit changes, `773 × 601` primary viewport, and `1254 × 784` expanded viewport;
- build/test gate: **PASS**, 18 signal/diagnostic/environment unit tests, 4 packaging tests, production build, working launch transition, and clean browser console;
- non-destructive upload: **PASS**, 5 files, 276,370 bytes; read-only remote identity passed, legacy cleanup was skipped, and two previous content-addressed assets were retained;
- canonical bare `/`, cache-busted root, and direct PHP entry: **PASS**, HTTP 200 with `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`;
- canonical HTML: 655 bytes, SHA-256 `f5c98e3276af460f827da6ec8c3036edfde74d3a56a461a5b1c6c625a6840e4a`, byte-identical local/live and referencing the current asset pair;
- JavaScript: `index-v8c01CTk.js`, 257,875 bytes, SHA-256 `431ba3083a54dc95050171f0740e8ab1d00cbf4c6051626fee3b78fea36d1d1f`, byte-identical local/live;
- CSS: `index-D32owX6g.css`, 12,721 bytes, SHA-256 `dce6b14fbd3ad6588cfa894e1b724c0f298aae049a5a88f09b3f48659c59d1d0`, byte-identical local/live;
- live selected-browser QA at `773 × 601`: **PASS** for the animated Signal Gate, `PLAY THE ROAD`, the centered then-current project credit, launch into Drive Lab, visible speed readout, version `0.0.0`, and zero relevant console warnings/errors.

## Original Interstate 7 publication evidence — 2026-08-27

- deployed commit: `d640ba7`;
- build/test gate: **PASS**, 20 signal/diagnostic/environment/vendor tests, 4 packaging tests, production build, recursive vendor-deployment identity support, and rendered production-preview QA;
- upstream-integrity gate: **PASS** for commit `e58d58520bc0dfde21f9e14e6a1b8c7f0a2a2a9e`; `index7.html`, `InfiniteLights.js`, `Distortions.js`, Three.js r109, postprocessing 6.8.5, `base.css`, and the upstream README are byte-identical to the official source;
- non-destructive upload: **PASS**, 19 files, 1,137,795 bytes; read-only remote identity passed, legacy cleanup was skipped, two previous content-addressed assets were retained, and the new `third-party` tree was published;
- canonical bare `/` and cache-busted root: **PASS**, HTTP 200 from the evidenced Nginx/PHP path with `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`;
- canonical HTML: 655 bytes, SHA-256 `d819688d51888134c81064ccdcb578555d63f50aa51edadcb1c1444e671dd756`, byte-identical local/live;
- JavaScript: `index-DbQVzxJ1.js`, 249,255 bytes, SHA-256 `efcd996ff5916a6e79fe71fc8db9f5acb0f4028add09d1fd4c353d721efcaf82`, byte-identical local/live;
- CSS: `index-BDcTDdtP.css`, 12,890 bytes, SHA-256 `c9520f5737ae7a26035edae0ea6dea3ebae9ff1d8057afcc78519683d7ef9a3e`, byte-identical local/live;
- all seven checked Interstate 7 vendor files: **PASS**, direct canonical URLs and SHA-256 values match the production build and upstream-integrity test;
- live selected-browser QA at `773 × 601`: **PASS** for `VERTIGO 02`, one `773 × 601` original Interstate canvas, visible road/car trails/repeated side signal, Demo motion around `120 km/h`, hidden upstream editorial shell, `WebGL · Original Interstate 7`, version `0.0.0`, fixed `130 km/h` ceiling, and zero relevant console warnings/errors.

## Held-brake motion publication evidence — 2026-08-27

- deployed commit: `ca21e40`;
- build/test gate: **PASS**, 24 signal/diagnostic/environment/vendor tests, 4 packaging tests, production build, diff check, and byte-identical upstream Interstate 7 integrity;
- reference-motion gate: **PASS** for the `4.4 s` zero-to-100 km/h calibration, time-based Demo integration, progressive held braking from the exact starting speed, standstill without reversal, release settle/resume, and physics-informed GPS outlier tolerance without synthesized GPS motion;
- non-destructive upload: **PASS**, 19 files, 1,141,463 bytes; read-only remote identity passed, legacy cleanup was skipped, and the previous content-addressed asset was retained;
- canonical bare `/` and cache-busted root: **PASS**, HTTP 200 from the evidenced Nginx/PHP path with `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` and `x-proxy-cache-info: DT:1`;
- canonical HTML: 655 bytes, SHA-256 `37183c9e1ead3e2b3f4a521e983ac5ab1a24667f0655a1318e15207aa078b7a7`, byte-identical local/live and referencing the current asset pair;
- JavaScript: `index-J-8dLIyN.js`, 252,923 bytes, SHA-256 `212694ec5d30b9f8dea419e2149ed807b24eea99a74779fedc6072e500cddc63`, byte-identical local/live;
- CSS: `index-BDcTDdtP.css`, 12,890 bytes, SHA-256 `c9520f5737ae7a26035edae0ea6dea3ebae9ff1d8057afcc78519683d7ef9a3e`, byte-identical local/live;
- live selected-browser QA at `773 × 601`: **PASS** for Signal Gate, launch, `WebGL · Original Interstate 7`, split-view diagnostics, the published `1,824 kg` / `4.4 s` reference values, explicit `gpsMotionFabricated: false`, no coordinate collection, version `0.0.0`, and zero canonical-URL console warnings/errors.

## Regenerative accelerator-release publication evidence — 2026-08-27

- deployed commit: `5328fb4`;
- build/test gate: **PASS**, 26 signal/diagnostic/environment/vendor tests, 4 packaging tests, production build, diff check, and byte-identical upstream Interstate 7 integrity;
- lift-off model gate: **PASS** for held acceleration, continuous accelerator release, `0.45 s` regenerative demand ramp, `1.7 m/s²` estimated peak regenerative component, low-speed taper, Vehicle Hold capture, and a deterministic nominal 100-to-zero time of approximately `17.4 s`;
- rendered Arrow release at `773 × 601`: **PASS**, measured `66 → 59 → 47 km/h` across the first three seconds after release with `REGEN RELEASE · SIM`, no zero-speed discontinuity, and no relevant local or canonical console errors;
- non-destructive upload: **PASS**, 19 files, 1,144,761 bytes; read-only remote identity passed, legacy cleanup was skipped, and the previous content-addressed asset was retained;
- canonical bare `/` and cache-busted root: **PASS**, HTTP 200 from the evidenced Nginx/PHP path with `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` and `x-proxy-cache-info: DT:1`;
- canonical HTML: 655 bytes, SHA-256 `c5c17d4653d860683c2f001e237ff9ebe9257c80b68d78943b30e63364888308`, byte-identical local/live and referencing the current asset pair;
- JavaScript: `index-COhLAF3f.js`, 256,221 bytes, SHA-256 `3ebca2c70f10c75869a097d7343457d496156031e68bfa26ca910988532a1194`, byte-identical local/live;
- CSS: `index-BDcTDdtP.css`, 12,890 bytes, SHA-256 `c9520f5737ae7a26035edae0ea6dea3ebae9ff1d8057afcc78519683d7ef9a3e`, byte-identical local/live;
- live diagnostic report: **PASS** for split-view `773 × 601`, `WebGL · Original Interstate 7`, `regenerativeModelStatus: nominal-estimate`, `activeDriveInput: regen`, `batteryRegenerationAvailabilityObserved: false`, `gpsMotionFabricated: false`, no coordinate collection, and version `0.0.0`.

## Driving flight-recorder publication evidence — 2026-08-27

- deployed commit: `d415db8`;
- build/test gate: **PASS**, 28 unit tests, 4 packaging tests, production build, diff check, transport-budget fitting, and byte-identical upstream Interstate 7 integrity;
- rendered local and live QA at `773 × 601`: **PASS** for the reachable scrollable diagnostic drawer, flight-recorder/runtime-issue cards, explicit privacy note, and zero console warnings/errors;
- deterministic motion trace: **PASS**, four samples captured `0 → 36.8 → 81.4 → 116.2 km/h` with corresponding speed rate, Demo source, energy, BPM, score section, frame pacing, audio level, network, and visibility fields;
- non-destructive upload: **PASS**, 19 files, 1,154,138 bytes; read-only remote identity passed, legacy cleanup was skipped, and the previous content-addressed asset was retained;
- canonical bare `/`, cache-busted root, and direct `/index.php`: **PASS**, HTTP 200 with `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` and `x-proxy-cache-info: DT:1`;
- canonical HTML: 655 bytes, SHA-256 `e4569647ca47ed58ef04ba35317c2e63cfaa1f501bd307a9bb79f2b3dc2f2fa8`, byte-identical local/live and referencing the current asset pair;
- JavaScript: `index-I8IcCozA.js`, 265,598 bytes, SHA-256 `a4eca7901e65727e2fd62cee2136dda02a588739e03208e8b98c27c63e675296`, byte-identical local/live;
- CSS: `index-BDcTDdtP.css`, 12,890 bytes, SHA-256 `c9520f5737ae7a26035edae0ea6dea3ebae9ff1d8057afcc78519683d7ef9a3e`, byte-identical local/live;
- one explicitly authorized live report submission: **PASS** at `2026-08-27 08:46 UTC` for the PHP `accepted_by_mail_transport` boundary; Gmail inbox delivery remains pending user confirmation.

## Long Tesla report mail-limit correction — 2026-08-27

- deployed commit: `3d7c64b`;
- vehicle evidence: **FAIL reproduced** from a real `248`-sample, `515 s`, browser-estimated `141 KiB` report that remained safely in session memory after the server rejected it;
- root cause: **CONFIRMED** — the hosting PHP precision setting expanded compact telemetry decimals to 53-digit binary representations during server-side pretty printing, pushing a representative 248-sample report from `120,095` to `215,327` bytes and beyond the `196,608`-byte limit;
- correction: **PASS** — the endpoint now forces shortest-round-trip JSON float serialization; the same 248-sample synthetic request passed the complete local endpoint under an externally forced `serialize_precision=53` runtime and returned `202 accepted_by_mail_transport` with mail delivery safely redirected locally;
- interface: **PASS** at `773 × 601` for sanitized actionable connection/retry copy, retained recorder state, enabled retry control, and zero console warnings/errors;
- non-destructive upload: **PASS**, 19 files, 1,155,132 bytes; read-only remote identity passed, legacy cleanup was skipped, and the previous content-addressed asset was retained;
- canonical bare `/` and cache-busted root: **PASS**, HTTP 200 with `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` and `x-proxy-cache-info: DT:1`;
- canonical HTML: 655 bytes, SHA-256 `43a21e8b0be9f2c0733b1aec911e2044e7654b416236f5a2bac210aa8c8ddc6f`, byte-identical local/live;
- JavaScript: `index-DthICO8o.js`, 266,478 bytes, SHA-256 `ed82142a04f240518ba5abf53303bb2b9fd32132756558588fdd001fce2c2049`, byte-identical local/live;
- live endpoint read-only probe: **PASS**, wrong-method `GET` returned the expected `405 method_not_allowed`; retry and Gmail delivery of the retained real vehicle report remain pending user confirmation.

`.env` is local, user-filled, and ignored. Scripts must parse it as data, keep credentials in memory, and print only sanitized stage results. Never source or evaluate `.env`.

## Security limit

Plain FTP sends credentials and content without encryption. Prefer certificate-validated FTPS or host-key-verified SFTP if SiteGround makes either available. Do not silently change protocol.

## Gate for every development deployment

1. Confirm the intended build, protocol, host account, and exact remote path.
2. Build and pass functional/visual QA locally.
3. Upload and hash-verify every asset, audio bank, font, third-party subtree and
   diagnostic API file before writing the generated live `index.php` entry.
4. Never print credentials or raw FTP errors.
5. Verify the canonical URL after upload:
   - HTTP status;
   - HTML and asset paths;
   - local/live sizes and SHA-256 hashes;
   - current version marker;
   - cache headers after a controlled reload;
   - visible behavior in the selected browser.

The command is fail-closed: choose exactly one of `--verify-only` and
`--publish`. A bare invocation performs no remote operation. Use
`--preserve-existing` only together with `--publish` when publication is
authorized but deletion of legacy remote files is not. This mode uploads and
verifies the complete build before writing the dynamic root entry, preserves
any static entry and legacy tree, and reports cleanup as skipped. Canonical
verification is still mandatory because a preserved `index.html` or edge cache
may continue to win over the new `index.php`.

Use `--verify-only` to run the configuration, connection, exact-directory, and remote-identity gates without uploading, overwriting, or deleting any remote file.

An upload alone is not a successful deployment. The user reports that hosting caches are disabled or cleared, but that statement is context rather than evidence. Do not infer Apache, Nginx, or other server topology from it.

Content-addressed JavaScript and CSS from the immediately previous entry point are retained during cache overlap. SiteGround has served stale canonical HTML briefly even while exposing the new origin timestamp; deleting the previous bundle in the same deployment can therefore break cached clients. Cache-busted verification confirms the new entry point, while the previous bundle remains available until canonical HTML converges.

The canonical SiteGround deployment uses a generated `index.php` entry with
explicit no-store/no-cache response headers. The Vite `index.html` remains the
reproducible build input and stays available to the separate Sites-compatible
package, but it is removed from the FTP root only after the dynamic entry is
uploaded and verified byte-for-byte over FTP. `--publish --stage-php-entry`
round-trips the candidate as the non-executable `index.php.stage` name and then
deletes that candidate; it never writes the live `index.php` and never switches
the static root. A normal `--publish` uploads `index.php.next`, reads it back and
verifies its hash, then replaces `index.php` by a same-directory FTP rename and
verifies the installed bytes. It never streams a partially uploaded payload
directly into the live entry name. The provider must demonstrate support for
replacing the existing target by rename during the real publication; failure
leaves the previous live entry in place and aborts the release.

This final-entry switch does not make the complete FTP publication atomic.
Mutable `audio/junction.svb` and diagnostic API files are uploaded and verified
before the entry rename. The current bank/parser and API contracts therefore
remain backward compatible across that window, and publication still stops
before the entry switch on any mismatch. A future incompatible bank or API
revision should use a content-addressed filename or release directory rather
than claiming whole-release atomicity from the entry rename alone.

The first dynamic-entry activation passed FTP identity and byte verification, but the bare `/` cache key initially continued serving a previously cached 587-byte static entry with `x-proxy-cache: HIT`. This upstream object could not be safely purged with FTP credentials. The user later disabled SiteGround NGINX delivery caching and completed the provider cache flush; the canonical root now returns the current 655-byte no-store PHP entry with `x-proxy-cache: MISS` and byte-identical assets.

For the energy-wave deployment, the canonical unqualified URL continued returning the previous 587-byte HTML body, while a cache-busted query returned the new 658-byte HTML with a byte-identical local/live SHA-256. Both previous and current JavaScript bundles return HTTP 200, so cached clients remain functional. An unauthenticated HTTP `PURGE` request was rejected with 403; do not retry or bypass provider cache controls without an authorized SiteGround mechanism.

## Development policy

During this private development phase, the current verified product build is deployed directly to the canonical root after user approval. Diagnostics remain accessible from the product's integrated report. Do not publish credentials, `_references/`, source archives, or local-only files.
