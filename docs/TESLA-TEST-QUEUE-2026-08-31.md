# Tesla test queue — 2026-08-31

This is the stable owner-facing test register for the evening drive. Each ID is
permanent and maps to one row of `MILESTONE-CHECKLIST-2026-08-31.md`. Report a
result as `R7-01 PASS` or `R7-01 FAIL — short observation`; add a photo, video,
or diagnostic attachment when the result depends on motion, timing, or frame
behavior.

Do not begin the run until the final canonical build stamp is recorded below.

- **Final test build:** `20260831-1534` · source `c0a2f78` · Illobo/title implementation `05a754b` · cover correction `6218f98` · Featured correction `1171157` · transition correction `dcb6801`
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
| `R4-04` | NOT RUN | Toggle OPEN, BLOOM, and UNDERWATER across Play the Road selections, then disable global FX. | Each effect is audible but controlled; UNDERWATER retains usable level; disabling FX restores dry output. | Global vehicle FX path. UNDERWATER already had one provisional cabin PASS on build `20260831-0853`. |
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
| `R7-01` | NOT RUN | Play Soundtrack, then use NEXT and PREVIOUS at normal intervals. | Every change is an audible nominal `450 ms` equal-power crossfade with no click or silence. | Published in build `20260831-1241`; audible media-deck transition wiring plus transient gesture ordering. |
| `R7-02` | NOT RUN | While a fade is active, perform `NEXT → PREVIOUS → NEXT` rapidly. | The audible mix never drops; the licence/credit card never names a non-audible track and settles on the final target. | Published in build `20260831-1241`; rapid-retarget transition, atomic queue commit and attribution state. |
| `R7-03` | NOT RUN | Start with a slow connection, observe buffering, then recover; if practical, briefly interrupt connectivity. | Loading/error state is truthful, current audio is not silently replaced, and recovery remains inside Soundtrack. | Browser-owned readiness and error boundary. |
| `R7-04` | NOT RUN | Scan the compact QR for the current track, change track, and scan again. | Each QR opens the exact current public track page; no stream URL or stale prior-track destination is exposed. | Published in build `20260831-1241`; compact direct-content QR handoff. |
| `R7-05` | NOT RUN | From the passenger seat, operate track rows, PREVIOUS/PLAY/NEXT, licence links, and the QR at `773 × 601`. | Controls are comfortably reachable; transport targets are at least `48 px`; the complete licence/artist credit remains legible. | Published in build `20260831-1241`; Soundtrack drawer touch and attribution treatment. |
| `R7-06` | NOT RUN | Set each manual effect, skip in both directions, toggle global OPEN/UNDERWATER/BLOOM, then pause/resume. | Effects remain continuous and attached to the audible tracks; playback stays fixed at `1×`; no stuck processing or level jump occurs. | Published in build `20260831-1241`; shared effects bus across media-deck transitions. |
| `R7-07` | NOT RUN | Start Soundtrack, open Music, note the playing Jamendo Library track, then press `PLAY FEATURED`. | Illobo Featured becomes visibly selected and a different Featured track begins immediately; NOW PLAYING, the highlighted row, credit/QR and Tesla mini-player title all agree. | Fixed by `1171157` in build `20260831-1502`; distinct `library:all` and `featured:signal-border` queues. |

## Illobo identity and Tesla media title — milestone row 8

| ID | Status | Test | PASS condition | Linked work |
|---|---|---|---|---|
| `R8-01` | NOT RUN | On build `20260831-1534`, open Music → Soundtrack and watch the Illobo Featured cover for at least ten seconds. | A clearly white-on-black solid state dissolves into the original black-on-graphite outline state and back. Each full dissolve takes about four seconds, continues without a static hold, and has no flicker, clipped outer line, rounded corner, border, or layout movement. | Milestone row 8 · base `05a754b`; perceptual correction `6218f98`. |
| `R8-02` | NOT RUN | Start one Soundtrack recording, inspect Tesla's browser-labelled mini-player, then pause it. | During play it shows `16 - Artist - Track title`; pausing restores the normal sedicivalvole page title. Audio, QR, and in-drawer credit remain on the same track. | Milestone row 8 · `05a754b`; Tesla browser behavior is the acceptance gate. |

## Evening closeout

After the run, transfer every result into the matching milestone row. A browser
or automated PASS cannot replace the Tesla result for rows marked `TESLA`.
Open a new diagnostic only for a failure that needs timing, GPS, network,
memory, or frame evidence; do not collect coordinates.
