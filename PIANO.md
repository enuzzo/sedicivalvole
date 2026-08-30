# Sedicivalvole Work Plan

Status: initial repository-backed map created on 2026-08-30. This is a plan,
not an implementation record. The external request document
`sedicivalvole-richieste-riordinate.md` was treated as proposed product intent;
repository code, tests, licences, and already-recorded decisions were inspected
independently. External service, API, and licence claims in that document have
not yet been re-verified against current primary sources.

## Questions for the product owner

Reply with one short line per number. Each question contains a proposed default
and a concrete acceptance boundary; no dependent implementation should begin
until its answer is recorded here.

1. **M5c — licence evidence:** Have all Magnific per-track licence PDFs already
   been downloaded from the account history and archived privately in two
   backed-up locations? **Answer `yes` or `no`; proposed acceptance: `yes` plus
   the archive date, without placing or naming private account files here.**
2. **Coverage count:** The document says 59 content IDs plus 24 Q IDs, but a
   deterministic parse finds **73 bracketed content IDs plus 24 Q IDs = 97**.
   May this plan use the actual 97-ID set and preserve every one? **Proposed:
   yes; acceptance: the coverage matrix remains 97/97 unless the source document
   is corrected explicitly.**
3. **Q15 / L5 / X6 — command protocol:** Section 11 simultaneously marks this
   as open and instructs the agent to respect it as decided. Do you confirm that
   the LAB and passenger controller must use one typed command protocol, never
   direct scene calls? **Proposed: yes; acceptance: `param`, `command`, and
   `state` messages pass schema, ordering, permission, and reconnect tests.**
4. **T1 — macro envelopes:** Should every visual consume the actual shared audio
   macro envelope for OPEN, UNDERWATER, and BLOOM, rather than inventing a second
   visual attack/release time? **Proposed: yes; acceptance: one envelope per
   macro, identical across scenes, while speed-response attack/release remains a
   separate tunable mapping.**
5. **Q1 / P2 — 100 versus 130 km/h:** Should particle *scale* reach and hold its
   maximum at `100 km/h`, while the product's existing speed/energy ceiling stays
   `130 km/h` for all other responses? **Proposed: yes; acceptance: scale is
   monotonic from 0 to 100 and saturated from 100 to 260 without altering the
   global `ROAD_SPEED_CEILING_KMH`.**
6. **Q10 / D3 — truncated DRIVEY request:** What exact additional behavior must
   occur at `0 km/h` beyond a motionless, road-centred player car? **Acceptance:
   one observable sentence that can become a deterministic test.**
7. **Q4 / A1 — camera ownership:** ATLAS already returns to the live automatic
   camera after six idle seconds. Should that verified behavior remain?
   **Proposed: yes; acceptance: manual pitch/bearing/zoom holds while touched and
   one fresh automatic return begins after `6000 ms`.**
8. **A1 — pitch range and limits:** Is a hard-clamped `0–85°` MapLibre pitch
   acceptable, where `0°` is vertical and `85°` is the near-horizon limit?
   **Proposed: yes, no elastic overscroll; acceptance: touch and mouse reach both
   endpoints without camera jumps.**
9. **Q5 / A2 / X1 — Wikipedia in motion:** May the passenger reading panel be
   opened at any speed? **Proposed: yes; acceptance: it never pauses the
   experience, traps focus correctly, and remains passenger-side in the selected
   shared-overlay direction.**
10. **Q6 / S1 — on-screen macros in motion:** May the central display expose the
    complete macro range while moving? **Proposed: only while parked on the car
    display; full-range control remains available from an authorised passenger
    phone. Acceptance: the motion policy is explicit and testable.**
11. **X1 / X2 — visual gate:** Do you confirm that exactly three shared overlay
    and screen-zone directions must be shown before A2, S1, M2, or S5 changes the
    product UI? **Proposed: yes, as required by `AGENTS.md`; acceptance: one
    direction is selected and recorded before implementation.**
12. **Q14 / S2g — participants:** Should a session admit at most four passenger
    devices, all with the same granted controls, rather than making later devices
    read-only? **Proposed: yes; acceptance: the fifth connection is rejected with
    clear local copy and existing participants remain connected.**
13. **S2e — inactivity:** Should a passenger session die after 15 minutes with no
    connected controller and no command? **Proposed: yes; acceptance: expiry,
    regeneration, revocation, and disconnect invalidate the room token
    immediately.**
14. **S2i — score handoff:** Is this safe boundary acceptable: an outgoing
    adaptive score finishes its current eight-bar phrase; when SOUNDTRACK is the
    outgoing source, the target adaptive score starts at its own phrase zero as
    soon as it is ready; every handoff uses the existing equal-power mix and
    exposes a visible pending state? **Proposed: yes; acceptance: no adaptive
    score starts mid-phrase and no request waits more than one eight-bar phrase
    after preload.**
15. **S3 — passenger feature name:** May the function be named **PATCH**?
    **Proposed: PATCH; acceptance: the same single name is used in UI, protocol,
    documentation, and diagnostics.**
16. **Q21 / S4 — effect-state persistence:** Should the effects master always
    start enabled in a fresh page session rather than persist its last state?
    **Proposed: yes; acceptance: reload resets to enabled and disabling during a
    macro releases through its normal envelope.**
17. **Q17 / M8 — SOUNDTRACK base:** Do you confirm Jamendo plus directly licensed
    Illobo material as the first SOUNDTRACK sources, subject to fresh terms and
    API verification? **Proposed: yes; acceptance: no source enters the catalog
    before M11 passes and notices are recorded.**
18. **Q16 / X8 — ND material:** May ND tracks be excluded at query time by
    default, with no “effects disabled” exception unless measured filtered
    coverage proves the catalog unusable? **Proposed: yes; acceptance: the two
    `fullcount` measurements are preserved and no ND item reaches the engine.**
19. **Q23 / M1d / M1e — rhythm mode:** Should speed-following rhythm bands be the
    default, with a manual band overriding it until the user explicitly restores
    automatic mode? **Proposed: yes; acceptance: the active mode and band are
    always visible and deterministic.**
20. **Q18 / M8 — Freesound:** Should a separate, licence-filtered Freesound study
    be opened for FRACTURE source material? **Proposed: yes, research only;
    acceptance: no audio enters the repository or product during the study.**
21. **Q25 / M8 — StreamBeats:** Should the custom-licence email be deferred until
    SOUNDTRACK works with its confirmed initial sources? **Proposed: yes;
    acceptance: StreamBeats remains absent from code, UI, and notices meanwhile.**
22. **Q9 / M3 — Illobo scope:** Do you already hold a written grant covering
    public web playback, audiovisual use, real-time effects, and any required
    hosting? **Answer `yes` or `no`; acceptance: a private dated copy is archived
    and only its scope, never the private message, is documented publicly.**
23. **M7 — public contact:** Which public contact address may appear in the music
    removal policy? **Acceptance: one explicit non-private address supplied by
    you; no address is inferred from local configuration.**
24. **M1 / M1b — NIGHTSHIFT placement:** Should the current adaptive NIGHTSHIFT
    remain available inside a nested sampled/adaptive collection under JUNCTION,
    while the top level becomes exactly FRACTURE, JUNCTION, and SOUNDTRACK?
    **Proposed: yes; acceptance: no authored score disappears and SOUNDTRACK is
    the only non-adaptive top-level score.**
25. **Q3 / PP2 — PRIMORDIAL reference:** Which exact image/video/file is the
    target, and what licence or direct permission applies? **Acceptance: one
    immutable reference identity and a recorded reuse boundary before any visual
    proposal or code change.**
26. **Q12 / G8 — Strudel source exposure:** Has anyone involved in the planned
    clean implementation already read Strudel source code rather than only its
    public documentation? **Answer `yes` or `no`; acceptance: the research-source
    boundary is recorded before G8 resumes.**
27. **M4 / G3 / X5 — current AGPL reality:** The repository is already
    `AGPL-3.0-or-later`, so client-side keys and decryption logic are public even
    without Strudel. May client obfuscation be abandoned and protected local
    sources use only server-authorised, short-lived segmented delivery?
    **Proposed: yes; acceptance: documentation never calls client delivery
    encryption or protection.**
28. **A3b — street-name source:** May the badge use only client-side
    `queryRenderedFeatures` data from the already displayed OpenFreeMap tiles,
    with no new reverse-geocoding service? **Proposed: yes; acceptance: missing
    names produce no badge and no coordinate leaves through a new request.**
29. **M13 — vehicle software:** No browser API exposes the Tesla software
    version. May the canary record `vehicleSoftware: unavailable` unless the
    platform later provides it, rather than add a manual field? **Proposed: yes;
    acceptance: the report is truthful and never invents a version.**
30. **L4 — preset schema:** Is schema version `1`, ISO-8601 UTC `exportedAt`,
    scene ID, app version, build, commit, and grouped `form/response/macros`
    acceptable? **Proposed: yes; acceptance: export/import round-trips exactly
    and rejects unknown major versions.**
31. **M2 / S2i — SOUNDTRACK skip:** Should normal-track skip use a `450 ms`
    equal-power crossfade, inside the requested `300–600 ms` range?
    **Proposed: yes; acceptance: no click, silence, double playback, or stale
    metadata over rapid repeated requests.**
32. **M13 / baseline — local toolchain:** May implementation first establish an
    architecture-safe local dependency runtime instead of overwriting the
    Dropbox-synchronised `node_modules`? **Proposed: yes; acceptance: Node and
    native packages share one architecture, PHP-dependent tests are explicitly
    available or skipped only as an environment limitation, and Git remains
    clean.**

## Planning conventions

- Estimates are **half-days of engineering work**. Parent rows that summarise
  child rows are inclusive and must not be added to those child estimates.
- `Blocked` means a Q answer, external evidence, or visual selection is required.
- `Recorded` means the document made a decision that needs traceability but no
  implementation by itself.
- Every implementation checkpoint also updates the relevant tests and factual
  documentation. Product changes additionally follow the project changelog,
  commit, push, build-stamp, publication, canonical identity, cache, exact
  viewport, and real-Tesla validation rules.
- No source audio, private licence PDF, credential, `.env`, or `_references/`
  material enters Git or build output.

## Repository discoveries that change or complete the request document

1. **Viewport confirmed.** The compact Tesla browser viewport is genuinely
   `773 × 601` at measured DPR `1.53`; it is not an assumption copied from a mock.
2. **Current source identity.** `main` and `origin/main` are clean and aligned at
   `ec49526`; version remains `0.0.0`.
3. **Current catalogue is larger than the document assumes.** Seven visuals are
   live in source (APERTURE, VERTIGO, MERIDIAN, ATLAS, DRIVEY, PRTCL,
   PRIMORDIAL) and three authored scores are ready (FRACTURE, JUNCTION,
   NIGHTSHIFT).
4. **T1 does not exist yet.** Input GPS is plausibility-bounded and smoothed, but
   visual profiles consume the latest speed and effect state directly. Scene
   mappings therefore have no shared time constant, asymmetric attack/release,
   or per-second slew limiter.
5. **P2 currently disagrees with the request.** PRTCL point scale runs linearly
   from `0.82` to `1.48` over `0–130 km/h`, with immediate uniform updates. It
   does not reach its full scale at `100 km/h`.
6. **Q2 is answered by code.** MURMURATION has one fixed camera profile with
   `zoom: 1.5`; there is no discrete speed-driven zoom ladder. The likely step is
   in shared instantaneous inputs or effect state, not discrete zoom levels.
7. **DRIVEY's likely D1 root is shared.** The untouched upstream `Car.drive()`
   skips road following and speed matching when cruise speed is zero but still
   integrates existing velocity and steering state. The external bridge can
   enforce a zero-speed road hold without altering the integrity-guarded vendor
   tree. Traffic currently defaults to 16.
8. **ATLAS already owns part of A1/A3.** Touch and mouse camera exploration,
   `18–78°` pitch bounds, a six-second automatic return, compass control, and an
   ephemeral directional travel line already pass tests. It lacks the requested
   full pitch range, round pulsing point, street badge, cardinal-only compass,
   and embedded Wikipedia reader.
9. **A3 is not just smoothing.** GPS input is about 10 Hz, but the existing map
   animation updates camera ownership on a `1100 ms` cadence and the travel line
   is a separate representation. A round vehicle point needs its own
   timestamped interpolation buffer, not only generic scalar smoothing.
10. **X1 has a useful base.** `DialogSurface` already supplies backdrop close,
    Escape close, focus trapping, focus restoration, and one-modal ownership.
    It can become the shared overlay primitive after the required three-direction
    visual gate; S5 needs a separate non-modal status surface.
11. **M13 is only partially present.** DIAG records storage estimates and API
    availability once. It does not call `persisted()`/`persist()`, write an
    IndexedDB canary, record canary age, or survive/reconcile app updates.
12. **The local LAB has a seed.** `qa-field.html` already mounts isolated fields,
    held speed, sweeps, effects, and deterministic telemetry. It is correctly
    absent from production, but it is query-string driven and has no command
    protocol, grouped controls, music selector, or JSON export.
13. **No relay or proxy exists.** The Sites worker is a static SPA fallback with
    only an asset binding; the canonical PHP surface currently serves diagnostic
    mail only. Server technology and host capabilities must be selected from
    evidence rather than assumed.
14. **G3/X5 is not resolved by rejecting Strudel.** Source, tests, CSS, and docs
    are already AGPL. Any client decryption scheme is corresponding source and
    cannot be treated as secret. This reopens the M4 architecture decision.
15. **The document's licence/API claims are imported context, not current proof.**
    Magnific terms, Jamendo API behavior/quotas/URLs, Creative Commons treatment,
    Freesound, StreamBeats, and Strudel statements require fresh primary-source
    evidence before they become repository facts.
16. **Current test baseline is environment-limited.** DRIVEY (10/10), PRTCL
    (8/8), PRIMORDIAL (8/8), and NIGHTSHIFT (9/9) focused suites pass. The full
    suite has two environment failures: the installed `esbuild` binary is arm64
    while Node runs x64, and PHP is absent for the diagnostic-mail fixture.
17. **Documentation drift already exists.** The authoritative current-state file
    records PRIMORDIAL as published, while parts of README/roadmap still describe
    it as pending. This needs a separately approved non-ID reconciliation entry.
18. **The source document is external to Git.** `PIANO.md` carries full ID
    coverage, but the original Italian source-of-truth file itself is not
    versioned. Importing or translating it requires explicit approval.

## Phase map

| Phase | Scope | Why this order | Checkpoint |
| --- | --- | --- | --- |
| 0 | M13 and baseline/toolchain gate | The storage canary needs calendar time; reliable tests are needed before product edits. | Canary appears in DIAG with age and truthful capabilities; focused and full baseline status is recorded. |
| 1 | T1, D1, D2; keep D3 blocked | Shared response mechanics must exist before scene tuning; DRIVEY zero hold is independently high-value. | Deterministic curve/envelope/slew tests pass; DRIVEY stays centred and motionless at zero with zero NPC traffic. |
| 2 | L5, L1–L4, X6 | The LAB must speak the future transport-independent protocol before scene-specific tuning. | Local-only LAB drives one scene through typed messages and exports a round-trippable preset. |
| 3 | P1, P2, PF1, PF2, PM1, PA1, PA2, PP1 | These are shared-response consumers and require the LAB to set measured endpoints. | All three PRTCL families and PRIMORDIAL sweep smoothly through 0/40/100/130 and macro attack/release. |
| 4 | X1, X2; A1, A3, A3b, A4 | Screen zones and overlay grammar precede new ATLAS chrome. | Selected three-direction layout passes `773 × 601`; map interaction, point interpolation, road badge, and cardinal compass pass. |
| 5 | A2, S5, S4 | A2 becomes the first modal consumer; S5 is the shared non-modal feedback system; S4 supplies a universal state action. | Reader and status feedback work with touch/keyboard; effect disable releases smoothly across all scores/visuals. |
| 6 | M0, M5, M5b, M5c, M6, M7, M8, M11, Q9/Q16/Q17/Q18/Q22/Q25 evidence | Vocabulary, permissions, service architecture, and source admission must be true before catalogue code. | Primary-source evidence and private grants are archived; public docs contain no secrets and M11 decides every admitted source. |
| 7 | M1, M1b–M1e, M2, M3, M4, M9, M10 | Build SOUNDTRACK only after licences, vocabulary, proxy, cache, and open-source delivery reality are settled. | Seeded/offline metadata, streamed audio, attribution, selectors, skip/shuffle, and cache refresh pass without shipping source audio. |
| 8 | S1, S3, then S2/S2a–S2j, X7 | Local musical macros precede remote control; the server is designed once for proxy plus relay. | Central display revokes immediately; phones sync state, respect grants, release on disconnect, and survive measured latency. |
| 9 | PP2 if Q3 is resolved | Faithful reference work cannot start without identity, licence, and a visual gate. | Exactly three reference-grounded directions are shown; selected result passes source/licence and viewport gates. |
| Deferred | G1–G8 | G7 rejects integration; G8 remains research only after source-exposure clarification. | No Strudel package/source enters the repository; any future language has a separately approved paper-only brief. |

## Content-ID work ledger

### Shared response, DRIVEY, PRTCL, PRIMORDIAL, and LAB

| ID | Status and one-line work | Files | Half-days | Dependencies | Proposed acceptance | Main risk |
| --- | --- | --- | ---: | --- | --- | --- |
| T1 | Planned: add one typed scalar/vector response mapper with curve endpoints, asymmetric time constants, slew limits, and shared macro envelopes. | `src/response-mapping.js` (new), scene models/fields, `tests/response-mapping.test.mjs` (new) | 3 | Q1, Q15, question 4 | Monotonic/property tests, frame-rate invariance, no overshoot, and every listed scene imports the shared mapper. | One abstraction may erase scene character if it owns values rather than response mechanics. |
| D1 | Planned: hold the upstream player car at zero velocity and road-centred state when commanded speed is zero, then resume without a teleport. | `src/environments/drivey/drivey-field.jsx`, `drivey-model.js`, `tests/drivey-model.test.mjs`, QA harness | 1.5 | T1 only for commanded transition | Zero for 10 s produces no longitudinal/lateral drift; 0→20 resumes on-road smoothly in all three cameras. | Vendor physics state may need a narrow bridge reset without touching 51 guarded files. |
| D2 | Planned: remove NPC traffic and retire traffic from persisted/default product settings. | `drivey-model.js`, `drivey-field.jsx`, `App.jsx`, Drivey tests/docs | 0.5 | None | `setNumOtherCars(0)` is stable, no NPC draw/update remains visible, legacy preference migrates to zero. | Old persisted value could silently restore traffic. |
| D3 | Blocked: preserve the missing zero-speed behavior as an explicit unknown. | `PIANO.md`; later DRIVEY files after Q10 | 0 | Q10 | Owner supplies one testable sentence; no inferred implementation. | Reconstructing truncated intent incorrectly. |
| P1 | Planned: route every PRTCL scale/depth response through T1. | `prtcl-model.js`, `prtcl-field.jsx`, `prtcl-renderer.js`, PRTCL tests | 1 | T1 | Abrupt input and macro sequences have continuous bounded output at 30/60/120 FPS. | GPU uniforms currently receive raw profile output every frame. |
| P2 | Planned: make scale minimum at 0, maximum at 100, reversible and monotonic, with explicit >100 policy. | Same PRTCL files plus LAB preset schema | 1 | T1, Q1 | Dense sweep proves equal curve shape up/down and chosen saturation behavior. | Conflict with global 130 km/h ceiling if implemented globally. |
| PF1 | Planned: tune Fractal's rest camera/scale smaller and its speed growth through the shared curve. | `prtcl-model.js`, `prtcl-renderer.js`, LAB config, tests | 0.5 | P2, LAB | Captures at 0/40/100 show continuous identity-preserving scale progression. | “More zoomed out” is perceptual and needs owner approval. |
| PF2 | Planned: feed OPEN/UNDERWATER/BLOOM envelope values, not discrete effect names, into Fractal. | T1 module, `prtcl-model.js`, renderer uniforms, tests | 1 | T1, question 4 | Macro onset/release matches shared envelope samples across all PRTCL types. | Audio and visual clocks may disagree without timestamped snapshots. |
| PM1 | Planned: tune Murmuration's fixed camera and shared scale response; do not invent a nonexistent discrete ladder. | `prtcl-renderer.js`, `prtcl-model.js`, LAB/tests | 0.5 | T1, P2; Q2 resolved by code | Smooth sweep and owner-approved smaller rest state; no frame-to-frame discontinuity. | Symptom may originate in source particle motion rather than camera scale. |
| PA1 | Planned: apply the same shared continuity/progression contract to Axiom. | PRTCL model/renderer/LAB/tests | 0.5 | T1, P2 | Same property tests and exact-viewport sweep as Fractal/Murmuration. | Axiom has terrain and agents with different perceptual scales. |
| PA2 | Planned: separate rain density, fall speed, and wave amplitude as LAB parameters, driven by one live speed curve. | `prtcl-model.js`, `prtcl-renderer.js`, LAB schema/UI, tests | 2 | T1, L1–L5 | LAB controls each axis independently; live preset maps 0–100 monotonically; 0/40/100 captures approved. | Current “agents” are not yet a semantically explicit rain system. |
| PP1 | Planned: route PRIMORDIAL convergence, flow, and macro response through T1 without flattening touch deformation. | `primordial-model.js`, field/renderer, source utilities, tests | 1.5 | T1, L1–L5 | Step/sweep tests prove continuous output and touch remains independent. | Music-level meter itself is noisy and may need a separate response lane. |
| PP2 | Blocked: reproduce only an identified, licensed visual reference, then alter it in a later approved change. | Unknown until Q3; likely PRIMORDIAL renderer/model, notices, source-admission docs | 3+ | Q3, three-direction visual gate | Immutable reference/licence recorded; exactly three directions; selected result passes comparison and clean-source boundary. | Copyright/licence and accidental source copying. |
| L1 | Planned: evolve the existing local `qa-field.html` into a separate non-production calibration app. | `qa-field.html`, `qa/field-harness.jsx`, new `qa/lab-*`, Vite/deploy absence tests | 2 | L5, T1 | Local URL works; production build and canonical site return 404 for LAB assets. | Accidentally shipping development controls. |
| L2 | Planned: add independent speed/BPM, music, visual, and complete scene-specific controls. | LAB UI/schema plus declared per-scene parameter manifests | 3 | L1, T1 | Every active visual is selectable and its declared parameters change without reloading. | An unbounded “everything” panel becomes unusable. |
| L3 | Planned: render shared Form/Response/Macro groups from scene declarations. | LAB components/schema/tests | 1 | L2 | Every scene uses the same group order and no flat orphan control exists. | Scene-specific semantics may be forced into misleading generic labels. |
| L4 | Planned: export schema/version/date/identity and grouped values to clipboard with import/round-trip tests. | LAB preset module/UI/tests | 1 | Q30, L2/L3 | Exact JSON round-trip, unknown-major rejection, visible copy success/failure. | Clipboard permissions in embedded browsers; LAB remains desktop-local. |
| L5 | Pending confirmation: define transport-neutral `param`, `command`, and `state` messages. | `src/control-protocol.js` (new), tests, LAB adapter, later relay adapter | 2 | Q15 | Versioned schema rejects malformed/unauthorised messages; ordering and idempotency tests pass. | Over-designing distributed behavior before local needs are known. |

### ATLAS and shared interface surfaces

| ID | Status and one-line work | Files | Half-days | Dependencies | Proposed acceptance | Main risk |
| --- | --- | --- | ---: | --- | --- | --- |
| A1 | Partial: extend existing manual camera from `18–78°` to approved endpoints and preserve/replace six-second return per Q4. | `atlas-model.js`, `atlas-field.jsx`, `atlas-model.test.mjs`, CSS/QA | 1.5 | Q4, question 8 | Touch/mouse hit endpoints, clamps, and fresh auto-return with no repeated ownership fight. | Near-horizon MapLibre cost and building occlusion. |
| A2 | Planned after visual gate: add Read more and a partial-page Wikipedia iframe reader using the shared modal primitive. | ATLAS field, `App.jsx` shared overlay, `styles.css`, tests/notices | 2 | Q5, X1/X2, selected direction | X and backdrop close, Escape/focus behavior, internal scroll, approved size/opacity at 773×601. | Wikipedia frame policy/network failure and driver distraction. |
| A3 | Partial: add a round luminous blinking vehicle point interpolated between timestamped GPS samples; retain the separate ephemeral path. | `atlas-model.js`, `atlas-field.jsx`, tests | 2 | T1 concept, GPS timestamp data | 10 Hz synthetic fixes produce smooth 60/30 FPS point motion; stale/invalid fixes freeze honestly; no coordinates in DIAG/storage. | Interpolating across bad fixes can visibly cut corners. |
| A3b | Planned: derive current road name from rendered map features and place it in the selected zone map. | ATLAS model/field, CSS, tests | 1 | Q28, X2 | Badge never overlaps compass; no extra network call; absent/multilingual names degrade cleanly. | Tile feature schemas vary by zoom and road class. |
| A4 | Planned: replace degree text with N/NE/E/SE/S/SW/W/NW labels, using product-language direction naming consistently. | `atlas-model.js`, field, tests/CSS | 0.5 | X2 | Eight deterministic sectors including wraparound; no numeric degrees in visible UI. | Italian `O/SO/NO` versus English-source UI requirement must be resolved as English W/SW/NW. |
| X1 | Planned: define one modal manager/primitive plus one non-modal status layer for A2/S1/M2/S5. | `App.jsx` component extraction, `styles.css`, accessibility tests | 2 | three-direction gate, Q5/Q6 | Only one modal owns focus; replacement/close rules are deterministic; status feedback never blocks. | Treating transient feedback as a modal would violate S5. |
| X2 | Planned: produce exactly three screen-zone maps covering compass, road badge, passenger/modal area, status, top bar, and 64 px footer. | Design evidence doc and later CSS/App/ATLAS | 1 | visual gate | Owner selects one map at 773×601 and it remains collision-free in short landscape/mobile QA. | New zones can break existing ATLAS panel and map attribution. |

### Audio controls, SOUNDTRACK, licensing, and server work

| ID | Status and one-line work | Files | Half-days | Dependencies | Proposed acceptance | Main risk |
| --- | --- | --- | ---: | --- | --- | --- |
| S1 | Planned: add two or three musical post-score macros controlled through L5, never raw DSP controls. | `audio-engine.js`, score DSP/worklet, `App.jsx`, protocol, tests, MUSIC-CRAFT | 3 | L5, X1, Q6, licensed-source derivative rules | Objective level/peak/release tests plus human headphone/cabin review; controls show musical names only. | A fun macro can damage authored harmony, dynamics, or licensed ND material. |
| S2 | Planned parent: passenger phone controller over the shared relay/protocol. | New passenger client, relay service, App session UI, protocol/tests/docs | 8 | S1, M1, L5, S2a–S2j, X7 | End-to-end session, grants, reconnect, conflict, latency, expiry, and release tests pass. | First persistent server dependency and mobile-network variability. |
| S2a | Recorded decision: WebSocket relay, no local in-car server. | Server architecture doc, relay implementation/tests | Included in S2 | X7 | Car and phone join only through expiring room credentials; no browser listen socket. | Hosting platform may not support stateful WebSockets. |
| S2b | Recorded decision: phone is remote only; audio remains in car; one session token generation at a time. | Protocol/session model, phone UI, tests | Included | S2a | No phone audio graph; generating a QR invalidates the previous token. | Browser audio accidentally duplicated through preview/media elements. |
| S2c | Recorded decision: passenger may control granted macros, track/library, score, and visual. | Permission model, car/phone UI, protocol tests | 1.5 | S2d, S2i, S2j | Default grants are visible and each category can be toggled in one car tap. | “Everything” without clear grouping becomes unsafe and confusing. |
| S2d | Recorded mandatory rule: central display is authority and can revoke immediately; continuous last-write wins, discrete changes identify peer actor. | Session reducer, UI/status, tests | 1.5 | S2c, S5 | Revocation beats queued commands; peer-origin discrete event is visible only in passenger area. | Network ordering and stale commands after revocation. |
| S2e | Recorded decision: explicit lifecycle and neutral release on loss. | Relay/session state, macro envelopes, phone/car clients, tests | 1.5 | question 13, T1/S1 | Revoke/off/idle disconnects phones and invalidates token; continuous parameters release; discrete state stays. | Detecting “vehicle off” reliably from a browser lifecycle event. |
| S2f | Recorded decision: optimistic local phone UI. | Phone state model/UI/tests | 0.5 | S2a, L5 state sync | Slider renders immediately; authoritative state reconciles without visible snap or blocking. | Optimism can mask rejected permissions without clear feedback. |
| S2g | Partial: rotating token resolved; participant count/control mode remains Q14. | Relay capacity/session tests, phone join UI | 0.5 | Q14 | Approved participant cap and deterministic over-cap response. | Abuse/resource exhaustion. |
| S2h | Recorded dependency row: S1, shared server/M6, and S2a must be complete first. | `PIANO.md` tracking only | 0 | S1, M6, S2a | Phase cannot move to active until dependencies are green. | Parallel implementation could bypass the gate. |
| S2i | Partial decision: SOUNDTRACK skip is immediate; adaptive score changes are boundary-aware; skip remains visible elsewhere with explanation. | Audio engine/crossfade, protocol, App/phone UI, tests | 2.5 | question 14/31, M1/M2 | 450 ms track skip; adaptive start at phrase boundary; visible pending; explanatory non-SOUNDTRACK state. | Current score switching is an immediate four-second crossfade, so this is architectural. |
| S2j | Recorded decision: visual switching is immediate/unlimited and reuses existing transition, with no rate limit. | Protocol command handler, App environment selection, tests | 0.5 | L5, S2d | Repeated commands stay responsive, latest wins, and current fallback/error boundary remains intact. | Heavy lazy loads under rapid scene switching. |
| S3 | Blocked on name choice: rename the passenger feature consistently. | App/phone copy, protocol/docs/tests | 0.5 | question 15 | One approved name everywhere; legacy/internal alias migration tested if needed. | Naming before final feature anatomy may mislead. |
| S4 | Planned: universal effects master beside Mute, on by default, releasing active macros normally. | `App.jsx`, `audio-engine.js`, fields via active envelope, CSS/tests/diagnostics | 2 | Q21, T1, S5 | All three score paths retain dry music; disable/re-enable is click-free and visibly confirmed. | ND licensing policy must not be conflated with user master state. |
| S5 | Planned: large, brief, shared non-blocking state feedback for mute/effects/mood and later commands. | `App.jsx` status component, CSS, accessibility/timer tests | 1.5 | X1/X2 | Consistent location/treatment, auto-dismiss about 2 s, replacement queue deterministic, no focus capture. | Feedback can obscure road/ATLAS information at 773×601. |
| M0 | Planned vocabulary migration: use only SOUNDTRACK/score/source/selection semantics for the music product. | Score registry, App/protocol/server code, docs/tests | 1.5 | M1 architecture | Product-semantic scan passes without renaming unrelated geometric concepts. | Blind global replacements would corrupt Meridian and historical/legal quotations. |
| M1 | Planned: top-level FRACTURE/JUNCTION/SOUNDTRACK selector; nested SOUNDTRACK genre/rhythm/mood. | `score/genres.js` refactor, App controls, audio engine, protocol/tests/docs | 4 | M0, M5/M6/M8/M9, question 24 | Exactly three top-level scores; existing authored work preserved; only SOUNDTRACK exposes track catalog. | Existing NIGHTSHIFT identity and persistence migration. |
| M1b | Recorded decision: third top-level score label is SOUNDTRACK. | Same registry/UI/docs | Included in M1 | question 24 | Visible/coded label exactly SOUNDTRACK; no cosmetic rename without functional split. | Old `genreId` naming leaks obsolete architecture. |
| M1c | Recorded mapping: FRACTURE/JUNCTION music and effects adapt; SOUNDTRACK track is fixed while allowed effects adapt. | Audio routing, score metadata, tests | 1 | M1, S4, X8 | Speed cannot select/re-time current SOUNDTRACK item; effect bus works only where derivative permission allows. | Applying effects to ND or source-restricted tracks. |
| M1d | Planned: use source rhythm/speed metadata only for next-track selection, never mid-track switching. | Catalog selector, protocol/state, tests | 1.5 | M9, Q23 | Driving-band changes affect the next choice only; deterministic seeded tests cover all bands. | Metadata quality may be inconsistent. |
| M1e | Planned: five plain-language driving rhythm bands with automatic/manual modes. | SOUNDTRACK UI/schema/catalog query/tests | 1.5 | Q23, M1d | Every band has visible explanatory copy; manual override and restore-auto are unambiguous. | Italian labels in the request must become approved English product copy. |
| M2 | Planned: skip, shuffle, title/artist and source-aware metadata/attribution surface. | App shared overlay/status, audio controller, CSS/tests | 2.5 | M1, M10, X1, S2i | Controls work at 773×601; Jamendo attribution stays visible while playing; rapid skip metadata never goes stale. | Mandatory attribution cannot hide behind an optional gesture. |
| M3 | Blocked on Q9: prominent Illobo selection inside SOUNDTRACK with written scope. | Catalog seed/source adapter, UI/notices/tests | 1 | Q9, M11 | Only authorised works appear and every item carries source/licence capability flags. | Existing textStep authorisation may not cover separate recordings. |
| M4 | Reopened by AGPL fact: no client-secret claim; use proportionate remote delivery for protected local sources and never Git audio. | Server delivery, client Media Source/blob path, `.gitignore`, docs/tests | 3 | question 27, source-specific grants, M6 | No source audio in Git/static build; expiring authorisation; segmented playback; docs call it delivery control, not protection. | Browser users can always capture decoded audio; network dependence in car. |
| M5 | Verify before relying: archive current Magnific terms and per-track evidence; keep private account data out of Git. | Private archive (user), public `docs/LICENSING.md` summary after verification | 0.5 + user action | M5c | Primary terms/date/plan and allowed use are recorded without private documents. | Terms drift and legal interpretation. |
| M5b | Recorded proposed boundary pending verification: Magnific only as audiovisual soundtrack material, never the SOUNDTRACK browsing catalog. | Catalogue capability metadata, docs/tests | 0.5 | M5 | Magnific items cannot appear in genre/mood browsing or phone track selection. | The attached document's legal conclusion is not independent legal advice. |
| M5c | Persistent user action: download/archive licence PDFs while subscription access exists. | Private storage only; `PIANO.md` reminder state | 0 | Owner confirmation | Explicit owner confirmation with archive date; reminder then removed from session reports. | Evidence becomes unavailable after subscription changes. |
| M6 | Planned source/server strategy: one minimal service for API proxy, catalogue refresh, delivery authorisation, and later relay. | New server project/location after host decision, client adapters, tests/docs | 4 | X7, source verification | Credentials never reach browser/logs; catalogue can start offline; server failure degrades honestly. | No current backend/host capability has been established. |
| M7 | Blocked on contact: add English music/licensing/removal policy and source list. | `README.md`, `docs/LICENSING.md`, `NOTICE`, `THIRD_PARTY_NOTICES.md` | 1 | question 23, M11 evidence | Public contact valid; source/licence list complete; no private evidence or overclaim. | “Remove on request” does not substitute for permission. |
| M8 | Research ledger: re-verify and rank Jamendo, Freesound, FMA, SoundCloud, StreamBeats on primary sources. | `docs/SOURCE-ADMISSION-*`, `THIRD_PARTY_NOTICES.md` only after admission | 1.5 | Q17/Q18/Q25 | Dated source URLs, exact terms/API facts, and M11 answers; no audio downloaded. | Platform terms and API access drift. |
| M9 | Planned Jamendo integration: proxy-populated cache, seed metadata, monthly/manual refresh, stable-URL and ND measurements. | Server adapter, `src/soundtrack/catalog-store.js`, IndexedDB module, seed JSON, tests | 4 | M6, M8, M13, Q16/Q22 | Offline seed boot, versioned cache, stale refresh, 200-item paging, URL-age evidence, no waveform/download URL. | Tesla storage eviction and stream URL expiry. |
| M10 | Planned source-aware visible attribution and Music & Licences settings page. | Track state/UI, settings surface, catalogue schema, tests/notices | 2 | M1/M9, X1/X2 | Artist/title/licence/source link visible per active Jamendo track; settings list matches active sources. | Overlay density versus mandatory visibility. |
| M11 | Planned admission gate: derivatives, in-app selection, and no-host playback answers become typed source capabilities. | `src/soundtrack/source-policy.js`, tests, licensing docs | 1 | Fresh primary evidence | Unknown/false capability prevents admission or effect routing by construction. | Reducing nuanced licences to booleans without preserving evidence. |
| M13 | Planned first implementation: persistent-storage probe and long-lived IndexedDB canary in DIAG. | New storage probe module, `App.jsx`, diagnostics model/UI/tests/docs | 1.5 | question 29/32 | Estimate/persisted/request result, capabilities, canary age/counter/app identity survive reload; never coordinates. | Persistence cannot be proven in one session; `persist()` may be denied. |

### Strudel evaluation and cross-cutting dependency records

| ID | Status and one-line work | Files | Half-days | Dependencies | Proposed acceptance | Main risk |
| --- | --- | --- | ---: | --- | --- | --- |
| G1 | Recorded evaluation request; no integration work. | `PIANO.md`; future research note only if reopened | 0 | G7 | Decision remains traceable. | Treating an evaluation as permission to import. |
| G2 | Corrected fact: Strudel AGPL is not a new whole-app cost because Sedicivalvole is already AGPL; dependency/source licences still require review. | Root licence set, future research note | 0.5 | Primary-source re-verification | No claim that rejecting Strudel changes this repo's AGPL status. | Legal overstatement from the external document. |
| G3 | Reopened architecture conflict: public client logic defeats secret-key obfuscation regardless of Strudel. | M4 plan/licensing docs | Included in M4 | question 27 | M4 records the current AGPL boundary accurately. | False sense of technical protection. |
| G4 | Recorded technical assessment: pattern algebra may fit; scheduler replacement does not. | `PIANO.md`; optional benchmark only if reopened | 0 | G7 | Current sample-accurate worklet remains authoritative. | Future enthusiasm bypassing the scheduler gate. |
| G5 | Recorded musical risk: unconstrained recombination reopens known coherence failures. | `MUSIC-CRAFT.md` only if future experiment yields evidence | 0 | G7 | No runtime random pitch/pattern generation enters current scores. | Tool capability mistaken for product quality. |
| G6 | Recorded options; only external sketching remains allowed by G7. | No repository code | 0 | G7/Q12 | Strudel sketch never enters Git, product, or source-derived implementation. | Reading source would change later clean-room claims. |
| G7 | Recorded decision: do not adopt/fork/rewrite/integrate Strudel. | Dependency tests/package files remain unchanged | 0 | None | No `@strudel` dependency, copied source, or runtime import. | Decision rationale contains an obsolete AGPL premise; outcome still stands. |
| G8 | Deferred: a project-owned constraint-first language may be researched separately from current implementation. | Future approved research doc/tests | 4+ research | Q12, new owner-approved entry | Sources limited to approved papers/project work; harmonic/register constraints are primitives. | Scope explosion and disputed derivation boundary. |
| X3 | Recorded dependency: T1 consumers ship and are rechecked together, not as isolated fixes. | Test plan/phase tracking | 0 | T1 chain | One checkpoint covers D1/P1/P2/PF1/PF2/PM1/PA1/PP1/A3 as applicable. | D1 and A3 need domain-specific mechanics beyond scalar T1. |
| X4 | Recorded dependency: remote passenger audio work follows verified source permission and M1. | Phase tracking | 0 | M5/M1/S1 | S2 audio controls cannot activate before source capability metadata exists. | Licence verification treated as a one-time checkbox. |
| X5 | Reopened: Strudel rejection does not remove AGPL/client-obfuscation limits. | M4/G3 plan and licensing docs | 0.5 | question 27 | Corrected architecture is owner-approved and factual docs stay synchronised. | External document currently labels this resolved. |
| X6 | Recorded high-leverage equivalence: LAB and phone are protocol clients with different transports. | L5 protocol, adapters/tests | Included in L5/S2 | Q15 | Same conformance suite runs against local and WebSocket transports. | UI code bypassing protocol for convenience. |
| X7 | Planned: one server boundary for music proxy/delivery and passenger relay, with separated permissions internally. | Server architecture/implementation/tests | Included in M6/S2 | Host selection, M6/S2a | One deployment, separate routes/scopes/rate limits, no shared secret exposure. | Combining services can enlarge blast radius without isolation. |
| X8 | Planned policy: real-time macros require derivative permission; ND is excluded or effects are enforced off by typed capability. | M11 policy, M9 query, audio routing/tests | 1 | Q16, source evidence | No forbidden source can reach effect-enabled bus; metadata and UI agree. | Creative Commons/legal interpretation requires qualified review. |

## Open-question ledger

| ID | Current state | Files/evidence | Half-days | Blocks | Resolution / acceptance |
| --- | --- | --- | ---: | --- | --- |
| Q1 | Open | PRTCL model versus global `signal-model.js` ceiling | 0 | P2 | Answer question 5; tests encode local 100 km/h behavior without changing 130 global. |
| Q2 | Resolved by code audit | `prtcl-renderer.js: cameraForType()` | 0 | PM1 no longer blocked | No discrete zoom ladder exists; verify symptom through T1/LAB rather than replacing levels. |
| Q3 | Open | No immutable reference supplied | 0 | PP2 | Answer question 25 with reference identity and licence. |
| Q4 | Open/contradicted by existing accepted code | ATLAS six-second lease/tests/docs | 0 | A1 | Answer question 7; preserve or explicitly supersede prior six-second return. |
| Q5 | Open | No Wikipedia iframe reader exists | 0 | A2/X1 | Answer question 9 plus selected visual direction. |
| Q6 | Open | No DJ macro panel exists | 0 | S1/S2 | Answer question 10. |
| Q7 | Resolved in request document | S2a/X7 decision | 0 | None | Shared small server dependency accepted in principle; actual host remains evidence-based. |
| Q8 | Resolved in request document, not independently verified | M5 says Premium | 0 | M5 verification | Preserve private subscription evidence; re-check current terms. |
| Q9 | Open external action | Written Illobo scope absent from repository for recordings | 0 | M3/M5 | Answer question 22 and archive private grant. |
| Q10 | Open | Source sentence truncated | 0 | D3 | Answer question 6. |
| Q11 | Request says decayed; repository proves AGPL remains active | `LICENSE`, `LICENSE-SCOPE.md`, package metadata | 0 | G2/G3/M4 correction | Treat current `AGPL-3.0-or-later` as fact until an explicit relicensing decision. |
| Q12 | Open | No source-exposure record | 0 | G8 | Answer question 26. |
| Q13 | Request says resolved by G7, but M4 still conflicts with current AGPL | Licence files | 0 | M4/X5 | Answer question 27; Strudel remains rejected independently. |
| Q14 | Open | No relay/session implementation | 0 | S2g | Answer question 12 and 13. |
| Q15 | Internally contradictory | Section 11 marks both open and decided | 0 | L5/X6/S2 | Answer question 3. |
| Q16 | Open but measurable | Jamendo API evidence/credentials not in repo | 0.5 research | X8/S1/M1 | Re-verify API, run two counts without exposing credentials, then apply question 18. |
| Q17 | Open | Recommendation only | 0 | M8/M1 | Answer question 17. |
| Q18 | Open | No Freesound code or source admission | 0 | M8 | Answer question 20. |
| Q19 | Resolved in request document | S2i | 0 | None | Skip remains visible outside SOUNDTRACK with concise explanation. |
| Q21 | Open | Current Mute persists only in state; no effects master | 0 | S4 | Answer question 16. |
| Q22 | Open empirical test | No Jamendo adapter | 0.5 | M9 | Sample stream URLs are rechecked immediately and after documented age; redirects/expiry recorded. |
| Q23 | Open with recommendation | No SOUNDTRACK selector | 0 | M1d/M1e | Answer question 19. |
| Q24 | Long-running measurement | DIAG reports API presence only | Included in M13 | M9 confidence | Canary evidence after reload, sleep, storage pressure where feasible, and at least one OTA boundary. |
| Q25 | Open low-priority outreach | No StreamBeats source admission | 0 | M8 | Answer question 21; any future outreach requires user-authored/sent external message. |

## Checkpoints and owner verification

### Phase 0 — Persistence seed and reliable baseline

- Desktop: DIAG shows quota/usage, persisted before/after, capability matrix,
  canary written/read age, counter, app version/build/commit, and truthful
  vehicle-software unavailability.
- Tesla: open once while parked, send no telemetry automatically, then revisit
  after sleep and subsequent software updates. Photograph or send DIAG manually.
- Engineering: resolve the Node/native-package architecture mismatch without
  modifying another machine's dependency state; record PHP fixture availability.

### Phase 1 — Shared response and DRIVEY

- Automated: time-step/property suites at 30/60/120 FPS, abrupt speed/macro
  sequences, zero/maximum bounds, and vendor SHA-256 integrity.
- Screen: synchronized captures or video at 0→40→100→0 for each affected scene.
- Tesla: DRIVEY held at zero for at least 30 seconds in Hood/Rear/Aerial, then a
  gentle departure; no NPCs, drift, snap, or off-road recovery.

### Phase 2 — LAB/protocol

- Desktop only: select each visual/music path, move speed and BPM independently,
  manipulate grouped controls, copy/import JSON, and compare identical replay.
- Production: built/canonical `/qa-field.html`, LAB modules, and preset endpoints
  remain absent/404.

### Phase 3 — Scene tuning

- Exact viewport: owner reviews 0/40/100/130 frames and continuous ascent/descent
  video for Fractal, Murmuration, Axiom, and PRIMORDIAL.
- Tesla: touch, frame pacing, acceleration/braking response, macro entry/release,
  and reduced-motion state; no scene closes until vehicle verification.

### Phase 4/5 — ATLAS and shared overlays

- Before code: exactly three zone/overlay directions at `773 × 601`; owner picks
  one.
- Browser: pitch endpoints, mouse/touch/pinch, six-second return, interpolated
  dot, road badge, compass labels, reader focus/scroll/close, collapsed panel,
  attribution, and short landscape.
- Tesla: physical one/two-finger contact, real GPS cadence, road-name accuracy,
  moving/parked policy, Wikipedia frame behavior, and passenger readability.

### Phase 6/7 — Licences and SOUNDTRACK

- Evidence: primary terms/API pages dated and archived; private grants/PDFs stay
  private; notices and source capability flags agree.
- Offline/network: seed catalog starts without network; refresh, expiry, stream
  failure, stale URL, cache eviction, and manual refresh degrade honestly.
- Listening: mp32 quality in cabin, level matching, effect legality/routing,
  skip/shuffle, metadata timing, artist/licence/source visibility.

### Phase 8 — Passenger control

- Local/network simulation at 50/100/200/500 ms and disconnect/reorder cases.
- Central display: category grants and one-tap revocation always win.
- Phones: QR/token rotation, participant cap, optimistic sliders, state sync,
  actor feedback, score boundary pending, immediate visual switch, neutral release.
- Tesla: real car/phone cellular path while parked; no phone audio and no stale
  controller after sleep/off/revoke.

## Proposed new entries requiring an owner-assigned ID

These were discovered in the repository and are deliberately **not** assigned
invented IDs:

- Establish an architecture-safe local dependency layout for the Dropbox
  checkout; current arm64 `esbuild` and x64 Node prevent a green full suite.
- Reconcile stale README/roadmap statements with the authoritative published
  PRIMORDIAL state.
- Decide whether the external Italian requirements source should be translated
  to English and versioned under `docs/`, or remain private/external.
- Independently verify every external API/licence conclusion in M5/M8/M9/G2
  against current primary sources before committing it as project fact.

## Coverage audit

Deterministic source parse on 2026-08-30:

- bracketed content IDs found: **73**;
- Q IDs found: **24** (`Q1–Q19`, `Q21–Q25`; Q20 absent/retired);
- total stable IDs found: **97**;
- stable IDs represented in this plan: **97**;
- coverage: **97/97**.

Content IDs covered:
`A1 A2 A3 A3b A4 D1 D2 D3 G1 G2 G3 G4 G5 G6 G7 G8 L1 L2 L3 L4 L5 M0 M1 M1b M1c M1d M1e M2 M3 M4 M5 M5b M5c M6 M7 M8 M9 M10 M11 M13 P1 P2 PA1 PA2 PF1 PF2 PM1 PP1 PP2 S1 S2 S2a S2b S2c S2d S2e S2f S2g S2h S2i S2j S3 S4 S5 T1 X1 X2 X3 X4 X5 X6 X7 X8`.

Question IDs covered:
`Q1 Q2 Q3 Q4 Q5 Q6 Q7 Q8 Q9 Q10 Q11 Q12 Q13 Q14 Q15 Q16 Q17 Q18 Q19 Q21 Q22 Q23 Q24 Q25`.

The source document's stated **59 + 24 = 83** reference count does not match its
own stable tokens. This plan does not silently delete 14 IDs to force that
number; question 2 asks the owner to confirm the 97-ID interpretation.

## Short synthesis (maximum 15 lines)

- Sedicivalvole is already a published experimental Flux product, not an empty prototype.
- It has seven active visuals, three authored adaptive scores, shared performance effects, and integrated diagnostics.
- The new request's strongest architectural idea is T1: one response mechanism, with scene-authored endpoints.
- T1 is absent today even though GPS input itself is already smoothed and plausibility-bounded.
- The existing local QA field is the correct seed for LAB, provided L5 makes it a protocol client.
- ATLAS already has substantial camera, compass, travel-line, sidebar, and privacy work to preserve.
- DRIVEY can likely fix zero-speed drift in the external bridge without changing guarded upstream source.
- SOUNDTRACK is a genuine third score type, but NIGHTSHIFT placement must be decided without deleting authored work.
- Passenger control is feasible only after local macros, SOUNDTRACK, typed protocol, and one evidence-based server boundary.
- Source permissions must become machine-enforced capabilities, not prose checked after playback.
- The repository is already AGPL, so client-side audio secrecy is not restored by rejecting Strudel.
- M13 should start first because only elapsed calendar time can prove persistence.
- Visual overlay/zone work must pass the mandatory exactly-three-direction gate before code.
- Real-Tesla touch, motion, storage, network, and listening remain final acceptance boundaries.

## Ordered work list and tracking

1. Record answers to the 32 closed questions directly in this file with date and
   owner decision; change blocked rows only after their answer exists.
2. Resolve the owner-assigned non-ID baseline entries, then implement M13 and
   plant the canary.
3. Deliver T1 with D1/D2, then run the combined X3 regression checkpoint.
4. Deliver L5 and the local-only LAB (L1–L4), preserving production exclusion.
5. Tune PRTCL/PRIMORDIAL consumers in the LAB and obtain viewport plus Tesla
   acceptance.
6. Present exactly three X1/X2 directions; implement the selected ATLAS/shared
   UI path only after selection.
7. Verify external rights/API facts and settle M4/M5/M6/M7/M8/M11 before adding
   any SOUNDTRACK network or catalogue code.
8. Build M1/M2/M3/M9/M10 with source-aware permissions, attribution, cache, and
   failure behavior.
9. Build S1/PATCH locally; only then add S2 through the shared protocol/server.
10. Keep PP2 and G8 blocked until their exact reference/source-boundary answers.

Tracking lives in this file. Each ledger row gains a dated state (`blocked`,
`in progress`, `ready for owner verification`, `verified on screen`, `verified
in Tesla`, `published`) and evidence links. A session interruption leaves the
latest row state, failing command/evidence, current commit, and next safe action
here before handoff. No row becomes `done` until its acceptance criterion and
required owner/vehicle gate are satisfied. The top-level count makes omitted
requirements visible in ten seconds.

## Best value/cost choices

1. **⭐ M13 (1.5 half-days):** immediate code cost is small, but every week of
   earlier canary age increases the value of the persistence evidence.
2. **⭐ T1 (3 half-days):** one implementation resolves the common mechanics
   behind P1/P2/PF1/PF2/PM1/PA1/PP1 and supports A3 conceptually, while giving
   the LAB stable parameters to tune.
3. **⭐ D2 + D1 (2 half-days combined):** the most visible DRIVEY defects are
   narrow, bridge-local, and testable without altering the upstream runtime.
