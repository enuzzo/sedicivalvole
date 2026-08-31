# Tesla test queue — 2026-08-31

This is the stable owner-facing test register for the evening drive. Each ID is
permanent and maps to one row of `MILESTONE-CHECKLIST-2026-08-31.md`. Report a
result as `R7-01 PASS` or `R7-01 FAIL — short observation`; add a photo, video,
or diagnostic attachment when the result depends on motion, timing, or frame
behavior.

Do not begin the run until the final canonical build stamp is recorded below.

- **Final test build:** `20260831-1911` · source `0660d71` · reversible Jamendo/Illobo paths `0660d71` · weak-network immediate switch `137ddeb` · transport hardening `57fed11` · Illobo provider mark `2c0f5f8` · track-head guarantee `236f2c9` · true Illobo catalogue `1a47e23` · Featured random-start `61471e8` · Tesla Soundtrack correction `4b36069` · ATLAS Navigator `79d9c9b` · Illobo/title implementation `05a754b` · cover correction `6218f98` · Featured queue correction `1171157` · transition correction `dcb6801` · MUTE/FX parity `c0a2f78`
- **Target viewport:** Tesla split view, nominal CSS `773 × 601`
- **Result states:** `PASS`, `FAIL`, `NOT RUN`, `BLOCKED`
- **Safety:** a passenger operates controls and records evidence; the driver
  only judges the experience when safe.

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
| `R4-04` | FAIL 2026-08-31 · FIX LIVE · RETEST | Toggle OPEN, BLOOM, and UNDERWATER across Play the Road and Soundtrack selections, then disable global FX. | Each effect is audible but controlled; UNDERWATER retains usable level as soon as its badge engages; disabling FX restores dry output. | Owner heard no UNDERWATER on Jamendo in build `20260831-1653`. `4b36069` replaces the inaudible linear-Hz onset with a tested perceptual sweep in build `20260831-1714`; the earlier adaptive-score cabin result remains provisional. |
| `R4-05` | NOT RUN | While music plays, trigger or wait for one normal vehicle alert/navigation prompt. | The vehicle alert remains clearly audible and is not masked by the product. | Alert-safe level and effects boundary. |
| `R4-06` | NOT RUN | Reveal the running footer, compare MUTE with FX, then toggle each one independently in both directions. | Both controls have the same width and `LABEL / ON–OFF / GLOBAL` hierarchy; each state changes immediately without changing the other control. | Shared MUTE/FX control anatomy and equal-width Tesla grid tracks. |

## Visual and performance acceptance — milestone row 5

| ID | Status | Test | PASS condition | Linked work |
|---|---|---|---|---|
| `R5-01` | NOT RUN | APERTURE from `0–40 km/h`, including a gentle acceleration and lift-off. | Motion becomes legible by about `40 km/h`; no blank frame, violent jump, or control obstruction. | Current APERTURE response. |
| `R5-02` | NOT RUN | Run VERTIGO 02 and MERIDIAN through low and medium road speeds. | Both remain fluid, readable, correctly themed, and free of degraded audio. | Current visual runtimes and bridge. |
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
| `R7-03` | NOT RUN | With a cold cache and slow connection, tap **Soundtrack** and immediately tap **Play the Road** before loading ends; repeat in the other direction, then allow each load to settle. If practical, briefly interrupt connectivity while audio is already playing. | The selected pane changes on the tap, states `Loading Soundtrack…` or `Loading Play the Road…` only while needed, and never waits behind the old pane. The outgoing source stops immediately; a late request cannot switch the pane or restart old audio. Existing audible playback survives a failed replacement truthfully, and recovery stays in the selected source. | Final build `20260831-1911` retains optimistic source state and revision guards from `137ddeb`; transactional catalogue/preload recovery remains `57fed11`. |
| `R7-04` | NOT RUN | Scan the compact QR for the current track, change track, and scan again. | Each QR opens the exact current public track page; no stream URL or stale prior-track destination is exposed. | Published in build `20260831-1241`; compact direct-content QR handoff. |
| `R7-05` | NOT RUN | From the passenger seat, operate track rows, PREVIOUS/PLAY/NEXT, licence links, and the QR at `773 × 601`. | Controls are comfortably reachable; transport targets are at least `48 px`; the complete licence/artist credit remains legible. | Published in build `20260831-1241`; Soundtrack drawer touch and attribution treatment. |
| `R7-06` | FAIL 2026-08-31 · FIX LIVE · RETEST | Set each manual effect, skip in both directions, toggle global OPEN/UNDERWATER/BLOOM, then pause/resume. | Effects remain continuous and clearly audible from their visible engagement, stay attached to the audible tracks, retain authored `1×`, and produce no stuck processing or level jump. | Owner saw UNDERWATER engage but heard dry Jamendo playback in build `20260831-1653`. Build `20260831-1714` uses the perceptual low-pass sweep from `4b36069`; cabin audibility is not yet accepted. |
| `R7-07` | FAIL 2026-08-31 · FIX LIVE · RETEST | Start Soundtrack and note the Jamendo Library track and three cover previews. Select Illobo Featured three times at normal intervals, use NEXT/PREVIOUS, then press the complete **Jamendo Library / Choose your route** card to return. Repeat Illobo → Jamendo once quickly before loading settles. | Every Featured press starts a different complete Illobo recording at `0:00`; NOW PLAYING, highlighted row, credit/QR, `LO` footer mark and Tesla mini-player title agree. Both path cards and all three Jamendo cover previews remain visible during Illobo playback. Returning to Jamendo immediately restores pace, genre and all visible album rows, starts a Jamendo recording, changes the footer to `JM`, and a late Illobo response never retakes the pane or audio. NEXT/PREVIOUS remain inside the selected source and one failed source cannot poison later tracks. | `0660d71` restores the Jamendo → Illobo → Jamendo round trip and source-owned artwork; `1a47e23` supplies the separate verified 29-track owner catalogue; `236f2c9` guarantees complete-track head starts; `57fed11` hardens failure/navigation; `2c0f5f8` corrects provider identity. All 29/29 remote Illobo masters were fully reverified for build `20260831-1911`; exact live Browser QA passed both normal and rapid return paths. |

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
