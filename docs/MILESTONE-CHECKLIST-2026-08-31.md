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
| Product shell and controls | [x] IMPLEMENTED · LIVE | Signal Gate, Instrument Deck, six-visual/six-score catalogue grammar, Title Case editorial labels, compact Tesla footer, global MUTE/FX, ten palettes, REPORT, and equal Engine/Flux navigation contract are in place. | Engine itself remains a design/audio milestone. |
| Flux visual catalogue | [x] IMPLEMENTED · LIVE | Aperture, byte-identical Vertigo, Meridian, Atlas, source-faithful Drivey, and PRTCL are selectable; WAKE, PLUMB, and PRIMORDIAL are retired from runtime while their decisions remain recorded. | Target-Tesla motion, touch, thermal, and long-session acceptance is incomplete. |
| Adaptive music | [x] IMPLEMENTED · LIVE BASELINE | FRACTURE, JUNCTION, and NIGHTSHIFT have authored low-speed behavior, complete transition contracts, bounded runtimes, measured dynamics, and shared OPEN/UNDERWATER/BLOOM processing. | Full low-volume and real-drive listening remains mandatory. |
| Fixed Soundtrack | [x] OFFICE IMPLEMENTED · BASELINE LIVE | The equal **Play the Road** / **Soundtrack** drawer, Illobo Featured, Jamendo Library, 30-minute rotation, immediate passenger pace/genre/track selection, authored `1×`, transient three-deck media, and global MUTE/FX are live. Checkpoint `2dd3cb5` adds audible equal-power transition wiring, audio-clock attribution, and the compact QR. | Publish `2dd3cb5`; run `R7-01`–`R7-06` in the Tesla; final Illobo logo remains a separate owner gate. |
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
- [x] connect independent manual flanger, reverb, chorus, and bounded beat repeat;
- [x] expose Soundtrack selection, preparation, playback, transport, effects,
  artwork, artist, title, licence, Jamendo credit, and direct link in the App;
- [x] expose the same disposable music/effect test path in the protected LAB
  without including any music state in exported visual presets;
- [x] verify a real admitted Jamendo track locally through the App and LAB, with
  analyser activity, EFFECTS enabled, explicit pause, and clean consoles;
- [x] add focused relay, controller, worklet, packaging, and production-endpoint
  checks;
- [ ] audition automatic braking/acceleration effects and all four manual
  controls in the physical Tesla cabin;
- [ ] connect the modelled 450 ms equal-power transition to audible deck changes;
- [x] add a top-level **Play the Road** / **Soundtrack** switch to the Music
  drawer; never call the complete adaptive branch `Generative`;
- [x] present compact, equal-weight **Illobo Featured** and **Jamendo Library**
  alternatives with a provisional generated Featured mark pending the supplied
  final Illobo logo;
- [x] revalidate the official Jamendo `speed` schema and add passenger browsing
  by pace, genre, and exact track. Every selection starts immediately, but pace
  remains discovery metadata only, never vehicle-speed input or retiming;
- [x] rotate the Featured and Jamendo preview ordering on a stable 30-minute
  window and state that refresh cadence in the interface;
- [ ] add the compact QR credit handoff.

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

| Order | Gate | Status | Work | What will be done | Completion evidence |
|---:|---|---|---|---|---|
| 1 | OWNER GATE → OFFICE | [x] LIVE 2026-08-31 | Release today's corrections | Owner authorization was received and implementation checkpoint `ac11ed0` plus documentation checkpoint `de62ab7` were pushed. Build `20260831-1111` passed read-only pre/postflight with `remote_writes=NONE`, published with `--preserve-existing`, and passed canonical HTML/asset/cache identity plus exact live `773 × 601` Browser QA. | `main == origin/main` at the recorded checkpoints; build stamp and deployment evidence in `CHANGELOG.md` / `DEPLOY.md`; byte identity and cache-busted Browser PASS. |
| 2 | TESLA | [ ] OWNER WILL TEST WHILE DRIVING | Accept ATLAS route, marker, GPS, and NIGHTSHIFT level | Drive a route long enough to zoom out and confirm that its origin never disappears; confirm one point only, roughly one pulse/ripple per second, and no moving line. Observe green at `≤4 m`, orange above `4 m`, red without GPS. Compare NIGHTSHIFT at matched cabin volume with JUNCTION; recheck FRACTURE without assuming it needs correction. | Photos/video plus listening notes; exact software/viewport; PASS/FAIL for each state and one new report if anything regresses. |
| 3 | TESLA | [x] VERIFIED 2026-08-31 | Close diagnostic delivery | The owner supplied the received complete attachment `sedicivalvole-diagnostic-20260831T070927Z-build-20260831-0853.json.gz`. Its v3 envelope records source `gps`, explicit-gesture full-evidence transport, `serverAcceptedAt 2026-08-31T07:09:27+00:00`, 3,928 numeric fixes at about 10 Hz, 243 flight samples, no coordinates, and zero runtime issues. Full findings are recorded in `DIAGNOSTICS.md`. | `GPS → SENT → received` evidence with coordinate-free payload review: PASS; attachment SHA-256 `24dcf0242f641dd76de448b01cf9f6630033f5b89cbab202d225adf7832fdcf5`. |
| 4 | TESLA | [ ] PARTIAL — UNDERWATER PASS | Complete adaptive and Soundtrack listening | The owner confirmed that UNDERWATER worked in the real cabin on build `20260831-0853`, but the old sampled-score level mismatch invalidates a final comparative listening verdict. After publication of the shared gain correction, exercise FRACTURE ascent/descent/PARK, JUNCTION PARK/native boundaries and reversals, NIGHTSHIFT all six tempo families, OPEN, BLOOM, UNDERWATER, global FX, and Soundtrack flanger/reverb/chorus/beat repeat. Confirm vehicle alerts remain audible. | Per-mode PASS/FAIL matrix; no click, silence, masking, surprise level jump, or stuck processing. |
| 5 | TESLA | [ ] IN PROGRESS — ATLAS DEFECT MEASURED | Complete visual/performance acceptance | The received report proves ATLAS/JUNCTION at `23.15 FPS` average, `43.75 ms` median and `51.7 ms` p95 against the deliberate 30 FPS ceiling, while Drivey and Vertigo remain near 60 FPS. The local mitigation caps only the MapLibre framebuffer at `1.25×`, disables world copies during this city view, cancels obsolete zoom-tile requests, and consolidates the pulsing marker into one 8 Hz source update; local `773 × 601` QA renders the full-width map at `966 × 751` with zero warning/error. The owner still needs to validate Aperture `0–40`, Vertigo, Meridian, ATLAS touch/readability and measured cadence, Drivey, and all PRTCL types/effects in the car. | Exact `773 × 601` visual evidence, new frame/thermal report, touch/reach notes, no audio degradation; ATLAS must reach stable measured 30 FPS or the target must be explicitly revised. |
| 6 | OFFICE | [x] LIVE 2026-08-31 | Close audio evidence debt | Checkpoint `614872b` replaces the rejected scalar pitch residual with a reproducible phase-aware ADSR/filter/phase-seed/detune/chorus/spectral-slope/saturation/stereo-coherence fixture grid. Valid synthetic cases reach `1.0` recall / `0.0` false-positive rate; every invalid case explicitly returns `unknown`, and real complete mixes remain unauthorized as pitch gates. Real bank sizes plus the observed `1.35 Mbps` / `250 ms` boundary now justify a shared `45 s` transfer limit and `56 s` JUNCTION outer readiness limit. JUNCTION and NIGHTSHIFT abort a true stall, retain a harmonic bed, state the exact reason, cool down ten audio seconds and recover without reselection. | Build `20260831-1143` at `d1e3fb0` passed protected publication, pre/postflight `remote_writes=NONE`, canonical/cache-busted HTML/JS/CSS byte identity and exact live `773 × 601` Browser QA. Tracked artifact, focused 8/8 checks, complete 482/482 tests and 143-module App / 68-module LAB / Sites build pass. Tesla listening remains row 4. |
| 7 | OFFICE + TESLA | [ ] OFFICE PASS AT `2dd3cb5`; PUBLICATION + TESLA PENDING | Finish Soundtrack mechanics | The production deck now applies the tested nominal `450 ms` equal-power model through normal changes, reversals and third-deck retargets while preserving the strict three-element ceiling. Audio-clock attribution shows every genuinely audible credit, and the compact QR opens the exact current public track page without exposing the stream URL. Publish and run stable Tesla checks `R7-01`–`R7-06` for buffering, rapid controls, touch size, transport, licence card, QR and effects. | Focused `35/35`, complete `484/484`, and 145-module App / 70-module LAB / Sites build PASS. Canonical/live Browser QA and target-cabin PASS remain open. |
| 8 | OWNER GATE → OFFICE | [ ] | Final Illobo identity | Replace the provisional Featured mark only after the owner supplies or approves the final logo and its exact usage boundary. | Approved asset, notice/provenance update, build and canonical identity verification. |
| 9 | OWNER GATE → OFFICE → TESLA | [ ] | Finish ATLAS road/cardinal overlay | Present exactly three focused treatments for the still-unwired rendered-tile road name and English cardinal state. Implement only the selected treatment without adding reverse geocoding, then validate legibility and map interaction in the car. The already specified route/dot correction is not reopened. | Three-direction selection record, model/UI tests, exact viewport QA, Tesla PASS. |
| 10 | OWNER GATE → OFFICE | [ ] | DISCOVER passenger companion | Present exactly three image-led directions using session-only ATLAS context and source-correct Wikimedia attribution; implement only the selected direction with bounded loading/failure behavior. | Selection record, licensing/attribution checks, responsive Browser QA. |
| 11 | OWNER GATE → OFFICE → TESLA | [ ] | Original Gradient Field | After DISCOVER, present exactly three original Swiss-influenced directions, admit one through fresh licence/performance review, implement it with project-authored rendering, and validate OPEN/UNDERWATER/BLOOM plus full speed range. | Selected direction, source boundary, performance tests, exact viewport and Tesla PASS. |
| 12 | OWNER GATE → OFFICE | [ ] | Catalogue and audiovisual authorship | Decide intentional visual/score pairings once the expanded catalogue is stable; design the grouped direct-selection Visual Library without weakening immediate switching or current fallbacks. | Owner-approved mapping and navigation; deterministic selection tests; no overflow. |
| 13 | OWNER GATE → OFFICE | [ ] | Shared appearance and network state | Apply the existing Road Sheet anatomy to DARK, expose LIGHT/DARK/AUTO using the prepared preference/solar model, and select the visible quiet-when-healthy network treatment without recolouring the active visual. | Three-state appearance QA, offline/twilight/storage tests, exact Tesla/desktop layouts. |
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
