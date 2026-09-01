# Milestone Checklist — 2026-08-31

This is the recoverable closeout for the autonomous pre-03:00 work window. It
separates completed code, objective gates, publication evidence, and work that
still needs a human or target vehicle.

This file is now the single operational checklist. The complete requirement
provenance remains in
[`reconciliation/COMPLETE-USER-REQUIREMENTS-2026-08-29.md`](reconciliation/COMPLETE-USER-REQUIREMENTS-2026-08-29.md),
the current factual overview in [`CURRENT-STATE.md`](CURRENT-STATE.md), and the
phase dependencies in [`ROADMAP.md`](ROADMAP.md). A historical row in those
sources is not a second active queue.

## Consolidated completed work

| Workstream | Status | What is complete | Remaining acceptance boundary |
|---|---|---|---|
| Recovery and scope | [x] RECONCILED | The conflicting-session inventory, complete user-requirement ledger, single-writer boundary, rejected directions, superseded interpretations, and current main checkout were recovered without reconstructing decisions from memory. | Keep this checklist and the current-state documents synchronized. |
| Licensing and source safety | [x] IMPLEMENTED | PolyForm scope, creator identity, third-party notices, upstream integrity boundaries, ignored source-library policy, secret-safe Jamendo relay, and no-offline-copy rules are documented and tested. | Recheck source terms when a new source or asset is admitted. |
| Signal and diagnostics | [x] IMPLEMENTED · LIVE · DELIVERY VERIFIED | GPS/Demo normalization, bounded signal response, acceleration/braking macros, coordinate-free v3 report, bounded flight recorder, explicit send, and protected owner LAB are implemented. The owner-supplied complete build-`20260831-0853` attachment closes `GPS → SENT → received`. | Repeat only when a new diagnostic defect needs evidence. |
| Product shell and controls | [x] IMPLEMENTED · LIVE | Signal Gate, Instrument Deck, six-visual/six-score catalogue grammar, Title Case editorial labels, compact Tesla footer, global MUTE/FX, ten palettes, REPORT, equal Engine/Flux navigation, and central focus release after completed controls are in place. | Engine itself remains a design/audio milestone. Retest automatic chrome retraction in the target Tesla. |
| Flux visual catalogue | [x] IMPLEMENTED · LIVE | Aperture, byte-identical Vertigo, Meridian, Atlas, source-faithful Drivey, and PRTCL are selectable; WAKE, PLUMB, and PRIMORDIAL are retired from runtime while their decisions remain recorded. | Target-Tesla motion, touch, thermal, and long-session acceptance is incomplete. |
| Adaptive music | [x] IMPLEMENTED · LIVE BASELINE | FRACTURE, JUNCTION, and NIGHTSHIFT have authored low-speed behavior, complete transition contracts, bounded runtimes, measured dynamics, and shared OPEN/UNDERWATER/BLOOM processing. | Full low-volume and real-drive listening remains mandatory. |
| Fixed Soundtrack | [x] HIGH CUT LIVE BUILD `20260901-1943` · TESLA PENDING | The equal **Play the Road** / **Soundtrack** drawer, true 29-track Illobo Featured catalogue, separate Jamendo Library with 15 live-verified genre routes, 30-minute rotation, immediate passenger selection, authored `1×`, three-deck media, and global MUTE/FX are implemented. Checkpoint `0f4a501` replaces Echo with High Cut and groups the three tone/filter controls in the readable `2 × 4` surface; exact local/canonical `773 × 601` QA plus objective browser audio renders pass. | Run `R4-07` in the Tesla, then complete mandatory `10A` and the remaining Soundtrack tests. |
| 2026-08-31 drive corrections | [x] IMPLEMENTED · LIVE | ATLAS retains the complete current-view route through bounded origin-preserving compaction, shows one interpolated pulsing point and ripple, and removes the moving line highlight. GPS shows only `GPS` plus accuracy with green/orange/red state. NIGHTSHIFT shares JUNCTION's `0.72` sample-performance gain; the repeatable bank audit passes; FRACTURE was measured and left unchanged. | Build `20260831-1111` is verified live; route/GPS/audio behavior still needs Tesla acceptance. |

## SOUNDTRACK production prototype

- [x] keep the Jamendo read credential server-side and outside Git, logs, build
  assets, screenshots, and browser responses;
- [x] expose a short-lived, no-store catalogue relay that admits only complete,
  effect-compatible non-ND records;
- [x] expose an exact-track, byte-range audio relay with no arbitrary URL input,
  hosted copy, persistent cache, or offline mode;
- [x] prepare at most three transient previous/current/next media elements and
  release displaced sources;
- [x] preserve authored `1×` rate and keep driving out of track selection,
  transport timing, tempo, and pitch;
- [x] connect OPEN, UNDERWATER, and BLOOM behind a shared footer `EFFECTS`
  master beside MUTE, retaining SOUNDTRACK fresh-session opt-in;
- [x] retain the historical manual flanger, reverb, chorus, and bounded echo
  baseline as superseded evidence;
- [x] replace the four-effect baseline with the mandatory eight-effect
  Performance FX revision: retain Flanger, Reverb, and Echo; remove Chorus;
  add five clearly differentiated effects including progressive manual
  Underwater and deliberate low/high-frequency processors; make `100%`
  unmistakably extreme while remaining level-bounded and click-free;
- [x] supersede Echo with a clean High Cut at the owner's request; group High
  Cut, Radio Cut, and Bass Drive contiguously and mark the shared tone/filter
  family without adding copy noise;
- [x] expand FX Deck to a readable `2 × 4` touch layout, preserve independent
  depth, RESET, cross-source state, `1×` authored playback, and the universal
  limited post-source bus;
- [x] expose Soundtrack selection, preparation, playback, transport, effects,
  artwork, artist, title, licence, Jamendo credit, and direct link in the App;
- [x] expose the same disposable music/effect test path in the protected LAB
  without including any music state in exported visual presets;
- [x] verify a real admitted Jamendo track locally through the App and LAB, with
  analyser activity, EFFECTS enabled, explicit pause, and clean consoles;
- [x] add focused relay, controller, worklet, packaging, and production-endpoint
  checks;
- [ ] audition automatic braking/acceleration effects and all eight final manual
  controls in the physical Tesla cabin;
- [x] connect the modelled 450 ms equal-power transition to audible deck changes;
- [x] add a top-level **Play the Road** / **Soundtrack** switch to the Music
  drawer; never call the complete adaptive branch `Generative`; replace the
  visible pane before awaiting preparation, expose the selected loading state,
  and ignore obsolete asynchronous completions;
- [x] present compact, equal-weight **Illobo Featured** and **Jamendo Library**
  alternatives using both supplied Illobo identity variants as a continuous
  four-second-per-direction crossfade between a white-on-black solid state and
  an original black-on-graphite outline state on an unclipped square field;
- [x] revalidate the official Jamendo `speed` schema and add passenger browsing
  by pace, 15 live-verified genres, and exact track. Every selection starts
  immediately, but pace
  remains discovery metadata only, never vehicle-speed input or retiming;
- [x] rotate the Featured and Jamendo preview ordering on a stable 30-minute
  window and state that refresh cadence in the interface;
- [x] add the compact QR credit handoff.
- [x] replace repeated text PLAY micro-buttons with whole-surface Pace/Genre
  chips and licensed media icons; keep fifteen genres, six tracks, the player,
  and credits visible without scrolling at `773 × 601`;
- [x] show only the three playable adaptive scores, with one concise description
  and one project-authored cover each; map all 29 Illobo recordings to coherent
  title-specific covers and fail deployment when one is missing.
- [x] record and implement owner selection **Generated image 35**: keep the two
  primary music sources horizontal at the top, place sampled JUNCTION and
  NIGHTSHIFT in two first-row cards, and place responsive-generative FRACTURE
  in one full-width row below.

## Final gates and publication

- [x] targeted Soundtrack integration checks;
- [x] production App, protected LAB, and Sites build;
- [x] fresh local App and LAB Browser interaction/console QA;
- [x] deployment and launcher regression checks updated for the production path;
- [x] complete native suite: 418/419 pass; only the unchanged local
  `spawn php ENOENT` diagnostic-mail fixture is unavailable on this host;
- [x] read-only canonical preflight;
- [x] guarded no-delete publication: 107 files / 16,449,992 bytes;
- [x] read-only canonical postflight and byte-identity verification;
- [x] live catalogue/audio-range endpoint verification: 3 schema-valid tracks
  and a 1,024-byte `206 audio/mpeg` range with `Content-Range` and `no-store`;
- [x] live cache-busted Browser interaction and console QA at the available
  `1280 × 720` viewport, ending paused with EFFECTS enabled;
- [x] deployment evidence recorded for build `20260831-0249`; final documentation
  checkpoint pushed with a clean aligned tree.

## Footer control checkpoint

- [x] expose one `EFFECTS` audio master beside MUTE for every music mode;
- [x] keep vehicle macro detection and visual response alive while audio effects
  are off;
- [x] preserve PLAY THE ROAD effects-on and SOUNDTRACK fresh-session effects-off
  defaults;
- [x] show 1.5-second centred `VOLUME ON/OFF` and `EFFECTS ON/OFF` notices;
- [x] compact the far-right palette to `138 px` at exact `773 × 601` and `160 px`
  at `1280 × 720`, with no horizontal or vertical document overflow;
- [x] focused runtime/UI tests and local Browser interaction QA pass;
- [x] publish and verify build `20260831-0315` at the canonical root: guarded
  107-file / 16,451,993-byte no-delete transfer, byte-identical HTML/JS/CSS,
  and exact live Browser QA at both target viewports.

## Control focus recovery checkpoint

- [x] identify the persistent chrome lock as restored/retained DOM focus on a
  control trigger rather than an animation, hover, or GPS-state defect;
- [x] return focus to the neutral running experience after the final pinned
  surface closes and after direct MUTE, FX, or palette actions, while preserving
  focus containment for open surfaces and keyboard navigation;
- [x] pass the focused `27/27` presentation checks, complete `522/522` suite,
  147-module App / 71-module LAB / Sites build, and exact local `773 × 601`
  Music, palette, MUTE, and Performance FX interaction QA;
- [x] publish and verify checkpoint `9daf8f6`, build `20260831-2244`, with
  read-only pre/postflight, 29/29 Illobo hashes, byte-identical canonical
  HTML/JavaScript/CSS, and an empty live Browser console;
- [ ] run `R1-01`: repeat drawer-close and direct-control idle retraction in the target Tesla,
  confirming that header/footer always retract after 4.2 seconds without a tap
  on the visual.

## Equal-path Music drawer publication checkpoint

- [x] verify 89 focused Soundtrack/presentation checks, 9 Sites checks, and 32
  build/deployment/documentation gates;
- [x] retain the known complete-suite host boundary at 426/427: only
  `spawn php ENOENT` in the unchanged diagnostic-mail fixture;
- [x] pass joined reference/implementation Product Design QA and exact local
  Browser QA at `773 × 601` with zero warning/error;
- [x] publish build `20260831-0853` through the guarded 108-file /
  16,975,254-byte no-delete transfer;
- [x] pass read-only preflight/postflight and byte-identity verification for
  live HTML, JavaScript, CSS, and the provisional Illobo asset;
- [x] verify live pace `medium` and genre `rock` filters return admitted records;
- [x] repeat cache-busted live Browser QA at exact `773 × 601` with real cover
  art, equal alternatives, visible 30-minute cadence, and zero warning/error.

## Deliberately not opened after the cutoff

No new feature block may start after `03:00 CEST`. ATLAS implementation was not
opened during this closeout window; finishing, proving, documenting, and
publishing SOUNDTRACK is the final task block.

## Catalogue typography checkpoint

This owner-requested post-cutoff correction is a bounded readability refinement,
not a new autonomous feature block.

- [x] retain uppercase only for compact functional micro-labels;
- [x] use dedicated Title Case display labels for Music, Visual, mode, and
  manual-effect names in the launcher, running footer, and both pickers;
- [x] keep canonical uppercase registry labels and stable identifiers unchanged;
- [x] align each footer catalogue number beside its name on one baseline and at
  the same type size;
- [x] verify zero document overflow and exact name/number baselines locally at
  `773 × 601` and `1280 × 720`;
- [x] publish build `20260831-0333` through the guarded 107-file /
  16,452,947-byte no-delete transfer and repeat byte-identity plus cache-busted
  live Browser QA at both target viewports.

## Authoritative ordered next work

This is the execution order. `OFFICE` means it can be completed without the
vehicle; `TESLA` requires the target car; `OWNER GATE` requires a product or
publication choice before work can continue.

Owner VoiceNotes from 2026-09-01 promote one mandatory `10A` correction insert
without renumbering the established stable rows. Row 4's eight-effect revision
runs first; rows `10A` and `10B` then close the two drive-noted correction
sets before row 11 can begin.

| Order | Gate | Status | Work | What will be done | Completion evidence |
|---:|---|---|---|---|---|
| 1 | OWNER GATE → OFFICE | [x] LIVE 2026-08-31 | Release today's corrections | Owner authorization was received and implementation checkpoint `ac11ed0` plus documentation checkpoint `de62ab7` were pushed. Build `20260831-1111` passed read-only pre/postflight with `remote_writes=NONE`, published with `--preserve-existing`, and passed canonical HTML/asset/cache identity plus exact live `773 × 601` Browser QA. | `main == origin/main` at the recorded checkpoints; build stamp and deployment evidence in `CHANGELOG.md` / `DEPLOY.md`; byte identity and cache-busted Browser PASS. |
| 2 | TESLA | [ ] OWNER WILL TEST WHILE DRIVING | Accept ATLAS route, marker, GPS, and NIGHTSHIFT level | Drive a route long enough to zoom out and confirm that its origin never disappears; confirm one point only, roughly one pulse/ripple per second, and no moving line. Observe green at `≤4 m`, orange above `4 m`, red without GPS. Compare NIGHTSHIFT at matched cabin volume with JUNCTION; recheck FRACTURE without assuming it needs correction. | Photos/video plus listening notes; exact software/viewport; PASS/FAIL for each state and one new report if anything regresses. |
| 3 | TESLA | [x] VERIFIED 2026-08-31 | Close diagnostic delivery | The owner supplied the received complete attachment `sedicivalvole-diagnostic-20260831T070927Z-build-20260831-0853.json.gz`. Its v3 envelope records source `gps`, explicit-gesture full-evidence transport, `serverAcceptedAt 2026-08-31T07:09:27+00:00`, 3,928 numeric fixes at about 10 Hz, 243 flight samples, no coordinates, and zero runtime issues. Full findings are recorded in `DIAGNOSTICS.md`. | `GPS → SENT → received` evidence with coordinate-free payload review: PASS; attachment SHA-256 `24dcf0242f641dd76de448b01cf9f6630033f5b89cbab202d225adf7832fdcf5`. |
| 4 | OFFICE → TESLA | [ ] HIGH CUT LIVE `20260901-1943` · TESLA RETEST | Complete adaptive, Soundtrack, and Performance FX listening | The shared post-source graph contains exactly Flanger, Reverb, Underwater, Phaser, Bitcrush, Bass Drive, Radio Cut, and High Cut; Chorus and Echo are absent. Checkpoint `f48b5b2` retains the smooth `82–100%` stunt zone. Checkpoint `0f4a501` groups Bass Drive / Radio Cut / High Cut behind one cyan family marker and gives High Cut a clean dual-stage top-end roll-off distinct from automatic/manual Underwater. | Deterministic DSP/routing/teardown/stunt-separation checks and the complete `544/544` suite pass. Real-browser tone evidence measures `300 Hz` at `+0.30 dB`, `8 kHz` at `−12.94 dB` on tap and `−59.68 dB` at full; the hostile eight-effect sum remains finite at `0.91672` peak. Build `20260901-1943` passes pre/postflight, canonical byte identity, and exact live `773 × 601` order/family/RESET/focus/overflow/log QA. Run revised `R4-07` across all five music sources in the Tesla. |
| 5 | TESLA | [ ] IN PROGRESS — ATLAS PERFORMANCE + MERIDIAN SURFACING RETEST | Complete visual/performance acceptance | The received report proves ATLAS/JUNCTION at `23.15 FPS` average, `43.75 ms` median and `51.7 ms` p95 against the deliberate 30 FPS ceiling, while Drivey and Vertigo remain near 60 FPS. The owner accepts MERIDIAN's post-`6a90621` smoothness and visual quality, then requested stronger brake and especially renewed-speed surfacing. Checkpoint `e77d939` retains `0.62 s` smooth braking, raises dry FOV `50° → 124°`, makes acceleration respond in `0.22 s`, strengthens UNDERWATER projection/motion/glow/fog contrast, and keeps a complete `0.50 s` surfacing response after `0.24 s` engagement. Build `20260831-2207` passes `520/520`, 147-module App / 71-module LAB / Sites build, exact local `773 × 601` state comparison, protected publication, canonical byte identity and live runtime/console QA. | Run `R5-01`–`R5-05`, especially `R5-02` through `0 → brake/UNDERWATER → renewed acceleration → 130`. Capture exact visual/frame/thermal evidence and no audio degradation; MERIDIAN must show a strong continuous reopening/emergence, and ATLAS must reach stable measured 30 FPS or the target must be explicitly revised. |
| 6 | OFFICE | [x] LIVE 2026-08-31 | Close audio evidence debt | Checkpoint `614872b` replaces the rejected scalar pitch residual with a reproducible phase-aware ADSR/filter/phase-seed/detune/chorus/spectral-slope/saturation/stereo-coherence fixture grid. Valid synthetic cases reach `1.0` recall / `0.0` false-positive rate; every invalid case explicitly returns `unknown`, and real complete mixes remain unauthorized as pitch gates. Real bank sizes plus the observed `1.35 Mbps` / `250 ms` boundary now justify a shared `45 s` transfer limit and `56 s` JUNCTION outer readiness limit. JUNCTION and NIGHTSHIFT abort a true stall, retain a harmonic bed, state the exact reason, cool down ten audio seconds and recover without reselection. | Build `20260831-1143` at `d1e3fb0` passed protected publication, pre/postflight `remote_writes=NONE`, canonical/cache-busted HTML/JS/CSS byte identity and exact live `773 × 601` Browser QA. Tracked artifact, focused 8/8 checks, complete 482/482 tests and 143-module App / 68-module LAB / Sites build pass. Tesla listening remains row 4. |
| 7 | OFFICE + TESLA | [ ] MANDATORY OFFICE EXTENSION · CANONICAL + TESLA RETEST | Finish Soundtrack mechanics and transport access | The existing production deck, source switching, complete Illobo/Jamendo catalogues, three-deck transitions, Music layouts and transport recovery remain the baseline. Add one compact previous / play-pause / next transport that stays directly reachable while the normal visual is running, choosing its exact top/bottom placement from measured Tesla space without hiding the core telemetry or footer controls. Register Media Session `play`, `pause`, `previoustrack`, and `nexttrack` handlers so supported Tesla mini-player controls address the same transactional transport; unsupported actions must fail harmlessly. Every committed track change shows a large bounded notice with title, album/source, and artist without firing for stale or failed targets. | Existing `R7-01`–`R7-09` plus planned `R7-10`–`R7-12`; deterministic Media Session and transition-attribution tests; exact Tesla viewport touch/occlusion QA; real Tesla proof for browser-exposed previous/next controls. |
| 8 | OWNER GATE → OFFICE + TESLA | [ ] MANDATORY ASSET CORRECTION · CANONICAL + TESLA PENDING | Final Illobo identity, playback title, and efficient covers | Both approved supplied marks replace the provisional cover and retain their four-second continuous dissolve. Active fixed playback exposes `16 - Artist - Track title`. In addition, measure every actual Illobo artwork slot, retain the existing HD masters locally for Illobo, and publish optimized WebP derivatives at no more than roughly `2×` the largest rendered dimension—`512 × 512` only where the measured slot justifies it. Update manifests/tests so the browser never downloads the oversized master for the running drawer. | Existing identity evidence plus file-dimension/weight inventory, source-to-WebP mapping, no-upscale and missing-cover tests, network payload comparison, canonical asset identity, `R8-01`–`R8-03` in the Tesla. |
| 9 | OFFICE → TESLA | [ ] MANDATORY STARTUP CORRECTION · CANONICAL + TESLA RETEST | Accept ATLAS Drive Lab | Preserve the selected six-module Drive Lab, shared history ranges, icon-only panel handle, route and DISCOVER separation. Fix the owner-observed black ATLAS cold start: begin map preparation from the best session position available even when accuracy is not yet ideal, render a truthful waiting/degraded state instead of an unexplained black field when no usable position exists, and refine/recenter from later fixes—including the first metres of motion—without restarting or losing the route. | Existing Drive Lab evidence plus cold-start/no-fix/coarse-fix/refinement tests and exact Browser QA. Publish the correction and run `R9-01`–`R9-06`, with `R9-06` covering immediate map/waiting-state behavior before movement. |
| 10 | OWNER GATE → OFFICE → TESLA | [ ] OFFICE + CANONICAL PASS · TESLA PENDING | DISCOVER passenger companion | Direction 1 remains the independent split Passenger Index. Checkpoint `f843ea6` enlarges the complete Discover reading hierarchy, uses a measured `272 px` rail, fills the available fold before an exact inline `+N MORE`, keeps all 15 results in one scroll, loads the complete localized Wikipedia article with chapters/images/infobox inside a scriptless reader, prevents cross-language page-ID collisions, and removes the superseded ATLAS action. Google Maps remains destination-only. Checkpoint `55caa8d` corrects the owner-reported Basilica layout: responsive `150–240 px` infoboxes capped at `38%`, `260 px` uncropped lead imagery and full-width stacking only below `420 px` protect the article's readable measure. Checkpoint `f8f554b` removes the redundant visible language label, compacts the three scope tabs to `38 px`, and enlarges result distance/ETA metadata to `11.5 px`. Checkpoint `e268169` keeps **DISCOVER 07** in both Visual entry points; the splash grid is `3–3–1`, and closing it returns to the unchanged real renderer. The same `0.05°` session-only privacy boundary remains. | Build `20260901-1624` carries documentation checkpoint `fd4b636` and product checkpoints `55caa8d` / `f8f554b`; focused `10/10`, complete `541/541`, protected publication and canonical HTML/JS/CSS byte identity pass. Exact live `773 × 601` QA proves the `165.3 px` responsive infobox, uncropped lead image, label-free accessible language selector, `38 px` scope tabs, `11.5 px` metadata, complete scrolling article, exact `+10 MORE` movement and empty Browser log. Run revised `R10-00A`–`R10-05` in the Tesla. |
| 10A | OFFICE → TESLA | [ ] MANDATORY · NEXT | Close 2026-09-01 drive-note corrections | Row 4's revised eight-effect FX Deck and full-depth stunt zone are live in build `20260901-1943`; now close the cross-cutting notes recorded at 09:01–09:15: ATLAS truthful cold start/refinement; larger Tesla footer palette; persistent previous/play-pause/next transport; Media Session previous/next integration where the Tesla browser exposes it; direction-aware swipe dismissal for every closable drawer/surface with iPhone-like threshold and cancel behavior; large track-change notice; measured WebP Illobo artwork delivery. These are accepted product requirements, not optional future ideas. | Office implementation/tests and canonical publication for every item; planned Tesla codes `R1-02`, `R7-10`–`R7-12`, `R8-03`, `R9-06`, and `R13-00`; no item may disappear merely because row 11 begins. |
| 10B | OWNER DETAIL → OFFICE → TESLA | [ ] MANDATORY · QUEUED AFTER 10A | Close 2026-09-01 17:52–18:07 drive notes | Replace Discover's outbound Maps navigation with an in-place destination QR and concise official Tesla-app sharing guidance; refine Jamendo into a larger, header-light, vertically separated Pace/Genre and clearer Now Playing composition; make the running Visual drawer a two-column description-led no-scroll surface for all admitted choices; diagnose and remove APERTURE's low-speed wall-motion stutter; restore only safe product state across history/reload and expose CLEAR SAVED STATE in splash and settings. Current code has seven catalogue choices, so the owner must identify any intended eighth visual; “position” must be clarified as playback time or UI location because GPS/route persistence remains forbidden. | Planned Tesla codes `R1-03`, `R5-06`–`R5-07`, `R7-13`, and `R10-06`; exact `773 × 601` Browser QA, performance evidence, safe-storage schema/reset tests, canonical publication, then target-Tesla acceptance. |
| 11 | OWNER GATE → OFFICE → TESLA | [ ] BLOCKED BY MANDATORY 10A + 10B | Original Gradient Field | After both 2026-09-01 drive-note correction sets reach office/canonical PASS, present exactly three original Swiss-influenced directions, admit one through fresh licence/performance review, implement it with project-authored rendering, and validate OPEN/UNDERWATER/BLOOM plus full speed range. | Mandatory correction register closed; selected direction, source boundary, performance tests, exact viewport and Tesla PASS. |
| 12 | OWNER GATE → OFFICE | [ ] | Catalogue and audiovisual authorship | Decide intentional visual/score pairings once the expanded catalogue is stable; extend the immediate two-column Visual Library correction from `10B` into intentional grouping without weakening immediate switching or current fallbacks. The shared drawer system retains the direction-aware gesture contract introduced by mandatory row `10A`. | Owner-approved mapping and navigation; deterministic selection/gesture tests; no overflow. |
| 13 | OWNER GATE → OFFICE | [ ] CONFIRMED · NOT IMPLEMENTED | Shared LIGHT/DARK/AUTO appearance and network state | Apply the existing Road Sheet anatomy to DARK and expose the already-prepared independent `LIGHT / DARK / AUTO` model through a direct trigger in the measured free top-rail lane. Manual choices persist; AUTO follows supported browser appearance first and the prepared bounded solar fallback second, without recolouring the active visual palette or storing coordinates. Enlarge the existing footer palette for Tesla before/with this work, while reserving space for the independent appearance trigger, and select the visible quiet-when-healthy network treatment. | `FI-005` / X10 remains PROMOTED; three-state preference/reset/storage/offline/twilight QA, distinct appearance-vs-palette tests, exact Tesla/desktop layouts, planned `R13-00`–`R13-03`. |
| 14 | OFFICE + IPHONE | [ ] | Landscape-first iPhone surface | Cover representative `667 × 375` through `932 × 430` Safari sizes, safe areas, and live rotation; portrait becomes an accessible inert rotate notice while the running audio, selection, and renderer state survive. | Real iPhone viewport/rotation matrix with no Tesla or desktop regression. |
| 15 | OWNER GATE → OFFICE → TESLA | [ ] | Engine mode | Present exactly three Engine-specific visual directions; select one; define the synthetic RPM/load/shift model honestly from normalized speed/acceleration; choose/prove its audio source; implement click-free Engine/Flux switching and alert-safe output. | Selected direction, provenance, mapping tests, build/browser QA, real-car listening. |
| 16 | TESLA + IPHONE | [ ] | Full vehicle QA matrix | Repeat permissions, null/stale GPS, network loss/recovery, cache reset, long session, backgrounding, touch reach, orientation, audio latency, frame pacing, context loss, and safety across the supported Tesla and representative iPhone surfaces. | Visible and audible PASS/FAIL evidence; tests alone cannot close this row. |
| 17 | OWNER GATE → OFFICE | [ ] | Production release | Only after the acceptance matrix, approve the release; update `VERSION`, create the dated release section, synchronize README/status/architecture/licensing, replace screenshots with verified current-build captures, deploy, and verify live identity/cache. | Explicit release approval, SemVer source of truth, immutable evidence, canonical acceptance. |

## Preserved optional queue

These are not allowed to interrupt the ordered core unless the owner promotes
one explicitly:

- [ ] `FI-001` optional iPhone motion/fusion input for other cars;
- [ ] `FI-002` Drivey Aerial camera rising smoothly with speed;
- [ ] `FI-006` exception-led local Conditions context;
- [ ] future authorized-passenger remote controls beyond the current main UI;
- [ ] `DI-001` GPS-free `MOTION` interpretation remains an unapproved agent
  proposal, not owner scope.
