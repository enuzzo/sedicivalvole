# Deployment

## Build identification

Every build carries a stamp in the form `20260826-1543` (`YYYYMMDD-HHMM`),
generated at build time and shown on the splash. **Always write the build stamp
when publishing or deploying**, and record it with the evidence for that
publication. It identifies the build; `VERSION` remains the only SemVer source
of truth and is reported separately in the diagnostics.

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
  build `20260828-2249`; Netmilk Studio resolves to `https://netmilk.ch/`, the
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
  identifies build `20260828-2208`, renders the compact `A project by Netmilk
  Studio · with Illobo` and source lines with zero horizontal or vertical
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
  status, `PLAY THE ROAD` control and Netmilk Studio credit all render.

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
- live selected-browser QA at `773 × 601`: **PASS** for the animated Signal Gate, `PLAY THE ROAD`, centered `A project by Netmilk Studio`, launch into Drive Lab, visible speed readout, version `0.0.0`, and zero relevant console warnings/errors.

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
