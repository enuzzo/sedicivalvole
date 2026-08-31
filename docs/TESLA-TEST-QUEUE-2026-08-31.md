# Tesla test queue — 2026-08-31

This is the stable owner-facing test register for the evening drive. Each ID is
permanent and maps to one row of `MILESTONE-CHECKLIST-2026-08-31.md`. Report a
result as `R7-01 PASS` or `R7-01 FAIL — short observation`; add a photo, video,
or diagnostic attachment when the result depends on motion, timing, or frame
behavior.

Do not begin the run until the final canonical build stamp is recorded below.

- **Final test build:** `20260831-2244` · control-focus recovery `9daf8f6` · 15-genre Jamendo selector `33687dd` · source/MERIDIAN immersion and surfacing `e77d939` · global audio routing/UNDERWATER `8c53e8d` · selected FX Deck `0993e92` · reversible Jamendo/Illobo paths `0660d71` · weak-network immediate switch `137ddeb` · transport hardening `57fed11` · Illobo provider mark `2c0f5f8` · track-head guarantee `236f2c9` · true Illobo catalogue `1a47e23` · Featured random-start `61471e8` · ATLAS Navigator `79d9c9b` · Illobo/title implementation `05a754b` · cover correction `6218f98` · MUTE/FX parity `c0a2f78`
- **Target viewport:** Tesla split view, nominal CSS `773 × 601`
- **Result states:** `PASS`, `FAIL`, `NOT RUN`, `BLOCKED`
- **Safety:** a passenger operates controls and records evidence; the driver
  only judges the experience when safe.

## Product-shell focus and chrome retraction — milestone row 1

| ID | Status | Test | PASS condition | Linked work |
|---|---|---|---|---|
| `R1-01` | NOT RUN | Open and close Music, Visual, REPORT, GPS help, and Performance FX one at a time. Then change a palette and toggle MUTE and FX. After each completed action, touch nothing for at least five seconds. | Every drawer closes normally; no trigger keeps a white focus stroke or selected state; header and footer retract automatically after about 4.2 seconds without tapping the visual. Keyboard focus remains contained only while a surface is open. | Central post-action focus handoff in `9daf8f6`, live build `20260831-2244`; exact local and canonical Browser QA already pass. |

## Route, GPS, and sampled-score corrections — milestone row 2

| ID | Status | Test | PASS condition | Linked work |
|---|---|---|---|---|
| `R2-01` | NOT RUN | Drive ATLAS for several minutes, then zoom out progressively. | The complete route from the session origin remains visible and highlighted; no earlier segment disappears. | Persistent in-session route accumulation and zoom-independent highlight. |
| `R2-02` | NOT RUN | Observe the ATLAS live position while stopped and moving. | One point exists only at the newest route end; it pulses about once per second with a restrained ripple; no animated line moves along the route. | Single consolidated marker source and pulse/ripple treatment. |
| `R2-03` | NOT RUN | Observe the navbar with accurate GPS, accuracy above `4 m`, and GPS unavailable if safely reproducible. | `GPS` plus accuracy only; green at `≤4 m`, orange above `4 m`, red when disconnected. | GPS confidence copy and thresholds. |
| `R2-04` | NOT RUN | At one fixed cabin volume compare NIGHTSHIFT, JUNCTION, then FRACTURE using representative energetic passages. | No surprise perceived-level jump; NIGHTSHIFT no longer dominates; FRACTURE is measured rather than adjusted by assumption. | Shared sampled-score output gain normalization. |

## Adaptive music and global effects — milestone row 4

| ID | Status | Test | PASS condition | Linked work |
|---|---|---|---|---|
| `R4-01` | NOT RUN | FRACTURE: PARK, smooth ascent, smooth descent, and two speed reversals. | Continuous authored behavior without click, silence, stuck layer, or unexpected level step. | Existing adaptive-score implementation plus normalized shared output. |
| `R4-02` | NOT RUN | JUNCTION: PARK, `20 → 21 km/h`, native-tempo entry, eight-bar changes, descent, and reversal. | PARK remains beat/bass-free; the quiet break enters near `13 km/h`; changes remain complete and click-free. | JUNCTION authored bank and network/readiness safeguards. |
| `R4-03` | NOT RUN | NIGHTSHIFT: PARK, all six tempo families on ascent, then descent and reversal. | Every family becomes reachable without a loud jump, dropout, or stale family. | NIGHTSHIFT family mapping, shared gain correction, and readiness safeguards. |
| `R4-04` | PARTIAL PASS 2026-08-31 · ILLOBO/JAMENDO RETEST IN PROGRESS | Toggle OPEN, BLOOM, and UNDERWATER across FRACTURE, JUNCTION, NIGHTSHIFT, Illobo, and Jamendo, then disable global FX. | Each effect is audible but controlled; UNDERWATER is unmistakably dark from its visible engagement while retaining usable level; disabling FX restores dry output in every source. | The owner now confirms that UNDERWATER decisively enters during braking in the active drive test. Illobo and Jamendo verification is still in progress, so the complete five-source matrix remains open. `8c53e8d` supplies the repaired audio path; `e77d939` changes MERIDIAN visuals only. |
| `R4-05` | NOT RUN | While music plays, trigger or wait for one normal vehicle alert/navigation prompt. | The vehicle alert remains clearly audible and is not masked by the product. | Alert-safe level and effects boundary. |
| `R4-06` | NOT RUN | Reveal the running footer, compare MUTE with FX, then toggle each one independently in both directions. | Both controls have the same width and `LABEL / ON–OFF / GLOBAL` hierarchy; each state changes immediately without changing the other control. | Shared MUTE/FX control anatomy and equal-width Tesla grid tracks. |

## Visual and performance acceptance — milestone row 5

| ID | Status | Test | PASS condition | Linked work |
|---|---|---|---|---|
| `R5-01` | NOT RUN | APERTURE from `0–40 km/h`, including a gentle acceleration and lift-off. | Motion becomes legible by about `40 km/h`; no blank frame, violent jump, or control obstruction. | Current APERTURE response. |
| `R5-02` | PARTIAL PASS 2026-08-31 · AMPLIFIED LIVE `20260831-2207` · RETEST | In MERIDIAN accelerate progressively from rest through urban, medium, motorway and `130 km/h`; brake firmly until UNDERWATER is visually established, then resume speed and watch the complete surfacing. Briefly confirm VERTIGO 02 at low and medium speed afterward. | MERIDIAN widens perspective perceptibly throughout `0–130`; braking visibly compresses/darkens/slows the field without steps; renewed acceleration produces an unmistakable continuous reopening, clearing and return of motion. Both visuals remain fluid, readable, correctly themed, and free of degraded audio. | The owner accepts MERIDIAN's beauty and confirms the first smoothing fix removed the prior braking problem, then requested stronger contrast. `e77d939` raises dry FOV to `124°`, strengthens UNDERWATER to `−11°` with deeper motion/glow/fog contrast, and gives the complete surfacing a frame-rate-independent `0.50 s` response after `0.24 s` engagement. |
| `R5-03` | NOT RUN | Use ATLAS controls, collapse/reopen the passenger panel, pan/zoom, and collect a fresh diagnostic after several minutes. | Touch targets are reliable; attribution remains subordinate; cadence is stably near the explicit 30 FPS target without thermal or audio regression. | Map framebuffer cap, request cancellation, world-copy removal, and marker consolidation. |
| `R5-04` | NOT RUN | Run DRIVEY through low and medium speeds and change its available view/render controls. | Stable interaction, no blank view, no stuck camera, and no audio degradation. | Existing DRIVEY integration; no rejected clean-room variant is reintroduced. |
| `R5-05` | NOT RUN | Exercise every PRTCL type and effect long enough to expose frame or thermal drift. | Each type/effect is reachable and stable; no sustained thermal collapse, blank field, or audio degradation. | Existing PRTCL surface and diagnostics. |

## Degraded-network recovery — milestone row 6

| ID | Status | Test | PASS condition | Linked work |
|---|---|---|---|---|
| `R6-01` | NOT RUN | With a cold cache and intentionally poor connectivity, select JUNCTION once and wait through loading/recovery. | A harmonic safety bed remains; a true stall states the exact reason; playback recovers after cooldown without a second selection. | Shared `45 s` transfer / `56 s` JUNCTION readiness boundary and abort/retry state machine. |
| `R6-02` | NOT RUN | Repeat the same cold-cache degraded-network run with NIGHTSHIFT. | A harmonic safety bed remains; failure is explicit; playback recovers without selecting NIGHTSHIFT again. | NIGHTSHIFT parity for abort, cooldown, retry, and safety bed. |

## Soundtrack mechanics — milestone row 7

These tests are now runnable on the final build recorded above. Office tests
cannot substitute for the audible physical-cabin verdict.

| ID | Status | Test | PASS condition | Linked work |
|---|---|---|---|---|
| `R7-01` | NOT RUN | Play Soundtrack, then use NEXT and PREVIOUS at normal intervals; let one track end naturally. | Every manual change is an audible nominal `450 ms` equal-power crossfade with no click or silence; natural end advances once from the next track's beginning and never replays the ended deck. | Transition wiring plus `57fed11` hard track-end boundary and stale-target restart. |
| `R7-02` | NOT RUN | While a fade is active, perform `NEXT → PREVIOUS → NEXT` rapidly, then pause/resume. | The audible mix never drops; the licence/credit card never names a non-audible track, settles on the final target, and pause/resume does not revive an older timestamp or identity. | Rapid-retarget atomic commit plus deterministic 120-action transport stress in `57fed11`. |
| `R7-03` | NOT RUN | With a cold cache and slow connection, tap **Soundtrack** and immediately tap **Play the Road** before loading ends; repeat in the other direction, then allow each load to settle. If practical, briefly interrupt connectivity while audio is already playing. | The selected pane changes on the tap, states `Loading Soundtrack…` or `Loading Play the Road…` only while needed, and never waits behind the old pane. The outgoing source stops immediately; a late request cannot switch the pane or restart old audio. Existing audible playback survives a failed replacement truthfully, and recovery stays in the selected source. | Final build `20260831-2005` retains optimistic source state and revision guards from `137ddeb`; transactional catalogue/preload recovery remains `57fed11`. |
| `R7-04` | NOT RUN | Scan the compact QR for the current track, change track, and scan again. | Each QR opens the exact current public track page; no stream URL or stale prior-track destination is exposed. | Published in build `20260831-1241`; compact direct-content QR handoff. |
| `R7-05` | NOT RUN | From the passenger seat, operate track rows, PREVIOUS/PLAY/NEXT, licence links, and the QR at `773 × 601`. | Controls are comfortably reachable; transport targets are at least `48 px`; the complete licence/artist credit remains legible. | Published in build `20260831-1241`; Soundtrack drawer touch and attribution treatment. |
| `R7-06` | FAIL 2026-08-31 · FIX LIVE `20260831-2005` · RETEST | In FRACTURE, JUNCTION, NIGHTSHIFT, Illobo, and Jamendo, open footer **MIX** and tap Flanger, Reverb, Chorus, and Echo one at a time. For each, compare ON/OFF, move its depth low/high, then combine all four briefly. Switch Play the Road ↔ Soundtrack with effects active, use NEXT/PREVIOUS, pause/resume, then RESET. | Every pad is immediately obvious and musically useful; its slider changes depth continuously; no click, silence, clipping, runaway feedback, masking, stuck tail, or surprise level step occurs. The `4/4` state persists across sources and tracks, authored playback remains `1×`, and RESET returns a dry `0/4` state. | `0993e92` provides the global non-modal FX Deck and stronger limited graph; `8c53e8d` supplies the shared routing. Exact live QA proves interaction/state persistence, but only this cabin matrix can accept power, balance, and audibility. |
| `R7-07` | FAIL 2026-08-31 · FIX LIVE · RETEST | Start Soundtrack and note the Jamendo Library track and three cover previews. Select Illobo Featured three times at normal intervals, use NEXT/PREVIOUS, then press the complete **Jamendo Library / Choose your route** card to return. Repeat Illobo → Jamendo once quickly before loading settles. | Every Featured press starts a different complete Illobo recording at `0:00`; NOW PLAYING, highlighted row, credit/QR, `LO` footer mark and Tesla mini-player title agree. Both path cards and all three Jamendo cover previews remain visible during Illobo playback. Returning to Jamendo immediately restores pace, genre and all visible album rows, starts a Jamendo recording, changes the footer to `JM`, and a late Illobo response never retakes the pane or audio. NEXT/PREVIOUS remain inside the selected source and one failed source cannot poison later tracks. | `0660d71` restores the Jamendo → Illobo → Jamendo round trip and source-owned artwork; `1a47e23` supplies the separate verified 29-track owner catalogue; `236f2c9` guarantees complete-track head starts; `57fed11` hardens failure/navigation; `2c0f5f8` corrects provider identity. All 29/29 remote Illobo masters were fully reverified for final build `20260831-2005`; exact live Browser QA passed both normal and rapid return paths. |
| `R7-08` | NOT RUN | At `773 × 601`, open Music → Play the Road and inspect all cards; switch to Soundtrack, tap the empty area of several Pace/Genre chips rather than the icon itself, then start two visible tracks. Enter Illobo and use NEXT twice before returning to Jamendo. | Play the Road shows exactly Junction, Fracture, and Nightshift with distinct covers and useful descriptions. Soundtrack shows two complete rows of 15 genres, two rows of six tracks, and the complete player/credit area without scrolling. The whole chip and whole track row respond on one tap; selected, loading, playing, and paused states remain unambiguous. Illobo rows and Now Playing use distinct title-specific covers, while the playlist card retains the animated LOBO identity. | Owner-selected Music drawer refinement `856232b`; `525/525` tests and exact local `601/601 px` no-overflow Browser QA pass. Canonical build stamp will be recorded before the drive. |

## Illobo identity and Tesla media title — milestone row 8

| ID | Status | Test | PASS condition | Linked work |
|---|---|---|---|---|
| `R8-01` | NOT RUN | On the final build recorded above, open Music → Soundtrack and watch the Illobo Featured cover for at least ten seconds. | A clearly white-on-black solid state dissolves into the original black-on-graphite outline state and back. Each full dissolve takes about four seconds, continues without a static hold, and has no flicker, clipped outer line, rounded corner, border, or layout movement. | Milestone row 8 · base `05a754b`; perceptual correction `6218f98`. |
| `R8-02` | NOT RUN | Start one Soundtrack recording, inspect Tesla's browser-labelled mini-player, then pause it. | During play it shows `16 - Artist - Track title`; pausing restores the normal sedicivalvole page title. Audio, QR, and in-drawer credit remain on the same track. | Milestone row 8 · `05a754b`; Tesla browser behavior is the acceptance gate. |

## ATLAS Navigator Plaque — milestone row 9

| ID | Status | Test | PASS condition | Linked work |
|---|---|---|---|---|
| `R9-01` | NOT RUN | Drive with ATLAS through several real changes of direction, including one crossing of north if the route permits. | The filled arrow points in the actual travel direction and moves smoothly; cardinal and degrees agree with it; crossing north takes the short rotation without a near-full spin; the road name follows the current named road and disappears rather than inventing copy when rendered data has no name. | Selected Navigator Plaque, continuous heading unwrapping, eight English cardinal sectors and rendered `transportation_name` lookup in `79d9c9b`. |
| `R9-02` | NOT RUN | From the passenger seat, observe the plaque with the side panel open and collapsed, then pan, rotate, tilt and zoom the map. | Arrow, cardinal, degrees and available road name remain legible and subordinate at a glance; the plaque neither blocks map gestures nor moves with the passenger panel; map interaction, attribution, route and pulsing point remain intact. | Milestone row 9 exact-viewport layout and interaction boundary in build `20260831-1653`. |

## Evening closeout

After the run, transfer every result into the matching milestone row. A browser
or automated PASS cannot replace the Tesla result for rows marked `TESLA`.
Open a new diagnostic only for a failure that needs timing, GPS, network,
memory, or frame evidence; do not collect coordinates.
