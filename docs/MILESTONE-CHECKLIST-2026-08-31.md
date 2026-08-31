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
| Fixed Soundtrack | [x] OFFICE IMPLEMENTED · CORRECTED LIVE | The equal **Play the Road** / **Soundtrack** drawer, true 29-track Illobo Featured catalogue, separate Jamendo Library with 15 live-verified genre routes in a `5 × 3` selector, 30-minute rotation, immediate passenger selection, authored `1×`, three-deck media, and global MUTE/FX are live. Checkpoint `57fed11` hardens end/skip/restart/preload/catalogue/effects state; `137ddeb` makes weak-network source changes visually immediate, exposes the selected loading state, and prevents obsolete asynchronous work from reclaiming playback. Checkpoint `33687dd` fixes the complete ordered genre set and its selection normalization; build `20260831-2225` passes local/canonical Ambient and Reggae interaction QA. | Retest `R7-06`–`R7-07`; run `R7-01`–`R7-05`, especially degraded-network switch test `R7-03`, plus `R8-01`–`R8-02` in the Tesla. |
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
- [ ] repeat drawer-close and direct-control idle retraction in the target Tesla,
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

| Order | Gate | Status | Work | What will be done | Completion evidence |
|---:|---|---|---|---|---|
| 1 | OWNER GATE → OFFICE | [x] LIVE 2026-08-31 | Release today's corrections | Owner authorization was received and implementation checkpoint `ac11ed0` plus documentation checkpoint `de62ab7` were pushed. Build `20260831-1111` passed read-only pre/postflight with `remote_writes=NONE`, published with `--preserve-existing`, and passed canonical HTML/asset/cache identity plus exact live `773 × 601` Browser QA. | `main == origin/main` at the recorded checkpoints; build stamp and deployment evidence in `CHANGELOG.md` / `DEPLOY.md`; byte identity and cache-busted Browser PASS. |
| 2 | TESLA | [ ] OWNER WILL TEST WHILE DRIVING | Accept ATLAS route, marker, GPS, and NIGHTSHIFT level | Drive a route long enough to zoom out and confirm that its origin never disappears; confirm one point only, roughly one pulse/ripple per second, and no moving line. Observe green at `≤4 m`, orange above `4 m`, red without GPS. Compare NIGHTSHIFT at matched cabin volume with JUNCTION; recheck FRACTURE without assuming it needs correction. | Photos/video plus listening notes; exact software/viewport; PASS/FAIL for each state and one new report if anything regresses. |
| 3 | TESLA | [x] VERIFIED 2026-08-31 | Close diagnostic delivery | The owner supplied the received complete attachment `sedicivalvole-diagnostic-20260831T070927Z-build-20260831-0853.json.gz`. Its v3 envelope records source `gps`, explicit-gesture full-evidence transport, `serverAcceptedAt 2026-08-31T07:09:27+00:00`, 3,928 numeric fixes at about 10 Hz, 243 flight samples, no coordinates, and zero runtime issues. Full findings are recorded in `DIAGNOSTICS.md`. | `GPS → SENT → received` evidence with coordinate-free payload review: PASS; attachment SHA-256 `24dcf0242f641dd76de448b01cf9f6630033f5b89cbab202d225adf7832fdcf5`. |
| 4 | OFFICE → TESLA | [ ] OFFICE + CANONICAL PASS · TESLA RETEST | Complete adaptive and Soundtrack listening | Checkpoint `8c53e8d` fixes the real `audioMacros.values` routing fault, gives Soundtrack and NIGHTSHIFT one two-stage perceptual brake near `1.5 kHz` at visible engagement, and routes four manual effects through one limited global post-source graph. Owner-selected checkpoint `0993e92` implements FX Deck with strong `78 / 72 / 80 / 74` tap states, depth sliders, reset, and cross-source persistence. Build `20260831-2005` passed `517/517`, 147-module App / 71-module LAB / Sites build, protected pre/postflight, 29/29 Illobo hashes, canonical HTML/JS/CSS byte identity, and exact live `773 × 601` interaction QA: `720 × 158 px`, `12 px` footer gap, no drawer duplicates, zero overflow, and no warning/error. | Run `R4-01`–`R4-06` and expanded `R7-06`; record per-mode PASS/FAIL with no click, silence, masking, surprise level jump, inaudible visible effect, clipping, or stuck processing. |
| 5 | TESLA | [ ] IN PROGRESS — ATLAS PERFORMANCE + MERIDIAN SURFACING RETEST | Complete visual/performance acceptance | The received report proves ATLAS/JUNCTION at `23.15 FPS` average, `43.75 ms` median and `51.7 ms` p95 against the deliberate 30 FPS ceiling, while Drivey and Vertigo remain near 60 FPS. The owner accepts MERIDIAN's post-`6a90621` smoothness and visual quality, then requested stronger brake and especially renewed-speed surfacing. Checkpoint `e77d939` retains `0.62 s` smooth braking, raises dry FOV `50° → 124°`, makes acceleration respond in `0.22 s`, strengthens UNDERWATER projection/motion/glow/fog contrast, and keeps a complete `0.50 s` surfacing response after `0.24 s` engagement. Build `20260831-2207` passes `520/520`, 147-module App / 71-module LAB / Sites build, exact local `773 × 601` state comparison, protected publication, canonical byte identity and live runtime/console QA. | Run `R5-01`–`R5-05`, especially `R5-02` through `0 → brake/UNDERWATER → renewed acceleration → 130`. Capture exact visual/frame/thermal evidence and no audio degradation; MERIDIAN must show a strong continuous reopening/emergence, and ATLAS must reach stable measured 30 FPS or the target must be explicitly revised. |
| 6 | OFFICE | [x] LIVE 2026-08-31 | Close audio evidence debt | Checkpoint `614872b` replaces the rejected scalar pitch residual with a reproducible phase-aware ADSR/filter/phase-seed/detune/chorus/spectral-slope/saturation/stereo-coherence fixture grid. Valid synthetic cases reach `1.0` recall / `0.0` false-positive rate; every invalid case explicitly returns `unknown`, and real complete mixes remain unauthorized as pitch gates. Real bank sizes plus the observed `1.35 Mbps` / `250 ms` boundary now justify a shared `45 s` transfer limit and `56 s` JUNCTION outer readiness limit. JUNCTION and NIGHTSHIFT abort a true stall, retain a harmonic bed, state the exact reason, cool down ten audio seconds and recover without reselection. | Build `20260831-1143` at `d1e3fb0` passed protected publication, pre/postflight `remote_writes=NONE`, canonical/cache-busted HTML/JS/CSS byte identity and exact live `773 × 601` Browser QA. Tracked artifact, focused 8/8 checks, complete 482/482 tests and 143-module App / 68-module LAB / Sites build pass. Tesla listening remains row 4. |
| 7 | OFFICE + TESLA | [ ] SOURCE/TRANSPORT/PATH ROUND TRIP CORRECTED · CANONICAL PASS; TESLA RETEST | Finish Soundtrack mechanics | The production deck applies the nominal `450 ms` equal-power model, atomic audio-clock attribution and strict three-element ceiling. `1a47e23` gives Featured its own owner-authorized 29-track catalogue; `236f2c9` guarantees random complete-track starts at `0:00`; `57fed11` makes natural end, explicit restart, dormant preload failure, failed catalogue replacement and effects readiness/rejection transactional; `137ddeb` changes the visible source immediately under weak network; `0660d71` makes Jamendo and Illobo complete reversible controls, retains Jamendo-owned covers during Illobo playback, and rejects stale path completion. Run `R7-01`–`R7-07`. | Current complete `520/520` and 147-module App / 71-module LAB / Sites build PASS. Final build `20260831-2207` retains the prior round-trip proof, passes a 138-file / 212,293,906-byte protected publication, full SHA-256 verification of all **29/29** remote Illobo tracks, canonical HTML/JS/CSS byte identity and read-only postflight. Prior live `773 × 601` QA reaches Soundtrack and preserves the selected FX Deck state. `R7-01`–`R7-07` remain cabin gates. |
| 8 | OWNER GATE → OFFICE + TESLA | [ ] OFFICE + CANONICAL PASS; TESLA PENDING | Final Illobo identity and Tesla playback title | Both approved supplied marks replace the provisional cover. They dissolve continuously over four seconds in each direction between a white-on-black solid state and the original black-on-graphite outline state, on an unclipped square field with no cover border or radius. Active fixed playback exposes `16 - Artist - Track title` through the page title and restores the product title on pause. | Base `05a754b`; perceptual correction `6218f98`; true Illobo source correction `1a47e23`; provider-label correction `2c0f5f8`; final build `20260831-2207`; complete `520/520` suite and 29/29 live audio checks. Run `R8-01`–`R8-02` in the Tesla. |
| 9 | OWNER GATE → OFFICE → TESLA | [ ] OFFICE + CANONICAL PASS; TESLA PENDING | Finish ATLAS road/cardinal overlay | The owner selected direction 1, Navigator Plaque, and requested a dynamic arrow beside the cardinal state. Checkpoint `79d9c9b` implements one compact surface with a filled continuously rotating arrow, English cardinal, exact degrees and a road name read only from rendered `transportation_name` vector data. It replaces the duplicate MapLibre compass, adds no reverse geocoding, and leaves the accepted route/dot treatment unchanged. | Three-direction selection recorded; Navigator-specific `493/493` checkpoint and current complete `520/520` suite pass with 147-module App / 71-module LAB / Sites build; final build `20260831-2207` retains the byte-identical Navigator implementation; prior exact live `773 × 601` QA proves `SE 135° → S 184°`, road copy, zero overflow and no live warning/error. Run `R9-01`–`R9-02` in the Tesla. |
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
