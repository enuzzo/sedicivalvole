# Diagnostics and report contracts

Read capture/automatic delivery for technical packets; Travel Report for PDF, recipient or route export. For time/freshness changes also use [motion/runtime](motion-runtime.md); for geographic data use [maps](maps.md#geographic-privacy). Technical diagnostics remain accessible in the main experience.

## Capture and presentation

The product entry is **REPORT**: pinned Tabler report-analytics outline icon above an explicit visible label in the compact top-bar cell. Do not replace it with a gear, icon-only control or hover tooltip. Internal names may remain technical. Use [shared geometry](interface.md#shared-geometry-and-palette) and support dialog conventions.

Extended diagnostics may aggregate frame pacing, connection changes, GPS accuracy/cadence, audio/runtime state, memory, storage, navigation/resource timings and bounded events. No coordinates. Retain bounded phase-specific summaries for Splash, active Visual/Music combinations and report-open state: FPS/frame-time distributions, browser-exposed JS heap, decoded PCM and bank sizes, without per-frame React state. Unsupported memory APIs are unavailable, never zero or invented.

The driving flight recorder is bounded and in session memory: speed, GPS age/accuracy, input, score, frame pacing, network and visibility outside React state. Preserve whole-session aggregates as old samples rotate. Debug interaction ledger records every semantic activation/media command with sequence, timestamp, source, safe identity, before/after transport snapshots, latency, browser lifecycle, Media Session registration/invocation, playback confirmation and bounded failure. Never record pointer coordinates, typed searches, GPS coordinates or media URLs. The old manual-only delivery restriction is superseded only by the explicitly bounded automatic contract below; this is not unrestricted telemetry permission. Read [Interaction/media recorder](../DIAGNOSTICS.md#exhaustive-interactionmedia-flight-recorder--2026-09-03) for capture details when changing it.

Phone motion adds the bounded aggregate `phoneMotion` report and safe `motion.*`
events. The HTTPS refinement adds an allowlisted transport name; direct diagnostics add ICE/peer state enums. Never include raw vectors, pose, signaling, encrypted envelopes, QR capabilities or encryption keys. A separate
phone download records failures before pairing. TRACE adds wake-lock state and
request/release/failure counts, renderer state/context losses, observed rendering
FPS, trace point count and axis range; never include the points themselves or
raw platform error text. See the
[exact contract](../PHONE-MOTION-COMPANION-2026-09-18.md#signaling-privacy-and-diagnostics).

## Automatic delivery

The owner explicitly enabled automatic diagnostic mail during experimental development. Fresh preferences use **Dev / AUTO ON**, preserving an explicit saved pause or Standard. Selecting **Dev** always enables automatic reporting. Session report separates the non-interactive **AUTO REPORTS · ON/OFF** state from the **PAUSE SENDING / ENABLE SENDING** action; Standard offers **ENABLE DEV REPORTS**. Intro shows the state and the explicit next action in its compact control. Keep disclosure, server validation and tests aligned. The local synthetic QA entry mirrors Dev/ON while its request boundary still blocks diagnostic delivery. The existing fixed destination stays in ignored local configuration, never command lines or public docs. Do not send synthetic QA packets to the real mailbox; intercept delivery or use local fixtures when exercising sending.

Count **fifteen minutes of observable active session time**, including stops, absent GPS, simulated input and offline operation. Hidden time and execution gaps **over five seconds** are unobserved. Reload starts a fresh session clock. This explicitly supersedes ten-minute/future-only and later fifteen-minute driving-only rules. It does not promise timers while minimized/backgrounded.

Use `timeBasis: active-visible-session`, `intervalActiveMs`, `activeMs` and `totalActiveMs`. At most one due report waits **in memory** for online/foreground recovery; no persistent outbox. Construct a fresh bounded coordinate-free snapshot when actually sending. One in-flight send, bounded transport retry, existing destination and fifteen-minute server floor remain. Server validates the new clock and accepts the older driving clock for already-open clients. At threshold log `diagnostic-send.due`, including offline state, then `requested`, `accepted` or `failed` with automatic/manual attribution. Acceptance means mail-transport acceptance, not verified inbox receipt.

**September 20 extension (owner: more data while in Dev).** The active-visible clock alone never fires when the browser freezes the page: the Tesla suspended a running session for 32 minutes with no `visibilitychange`, `pagehide`, `freeze` or `resume` event, so sessions observed at 9.8, 1.9 and 5.6 active minutes never reached fifteen. Automatic delivery therefore also has: (1) **catch-up** — once fifteen wall minutes since the last accepted report hold at least one minute of unsent observed activity, the first running tick sends, even hidden (`deliveryReason: catch-up`, `wallElapsedMs`); (2) **persisted counters** — `sedicivalvole.diagnostic-clock.v1` stores only progress numbers (never a report, 12 h window, cleared on OFF/Standard/Reset Saved State) so a reload continues the count; (3) **close-time flush** — on `visibilitychange`→hidden, `pagehide` or `freeze`, with two active minutes and five wall minutes unsent, a compact packet (≤ 60,000 bytes, last events and samples only, `keepalive`) is sent best-effort (`deliveryReason: hide-flush`). The September 20 reliability correction below supersedes the original optimistic reset. The server accepts each reason only with its own proof (catch-up: 60 s active and 900 s wall; flush: 120 s active and 300 s wall; both `active-visible-session` basis), keeps a 900 s floor for interval/catch-up and 300 s for a flush, and the mail names the reason. Because that `Reason:` line is copied verbatim into the mail summary, the reason whitelist runs before the manual shortcut, for every trigger. Travel Report delivery is unchanged and never automatic. Details and evidence: [September 20 extension](../AUTOMATIC-DIAGNOSTICS-2026-09-07.md#september-20-catch-up-persistence-and-close-time-flush). Verification status and review brief: [handoff](../AUTOMATIC-DIAGNOSTICS-HANDOFF-2026-09-20.md).

For changes to scheduling/transport/server validation read [Active-session correction](../AUTOMATIC-DIAGNOSTICS-2026-09-07.md#active-session-clock--owner-correction-2026-09-08), rather than its historical driving-only description. Inspect `src/automatic-diagnostics.js` and the matching endpoint/clock tests under Drive Lab. GPS-specific reporting is not the session clock.

## Email attachment

Email body stays a concise human summary; attach the **complete accepted report** as gzip-compressed JSON. Filename includes build and accepted timestamp; summary records compressed/uncompressed SHA-256. Retain the deterministic decompress-and-compare round-trip test. Read [Complete attachment packaging](../DIAGNOSTICS.md#complete-attachment-packaging--2026-08-28) for packaging changes. Historical browser/mail results are not proof of current inbox delivery.

## Travel Report

The owner selected **Travel Report direction 1**: compact cover, journey summary, graphs and technical appendix. Preserve immutable preview/download identity and verified chosen-recipient handling. Precise route inclusion is an explicit export option; it does not alter coordinate-free technical diagnostics. Optional email is user-requested, to a remembered recipient cleared by Reset Saved State; technical auto-mail is not authorization to send travel reports to arbitrary people.

For implementation work read [Night implementation / Report data and delivery contract](../NIGHT-IMPLEMENTATION-2026-09-07.md#report-data-and-delivery-contract), [PDF/email design](../ATLAS-STATS-REPORT-PLAN-2026-09-07.md#pdf-and-email-design) and `src/reports/session-report-model.js` as relevant. Earlier plan-only/pending-selection labels are superseded by the later owner selection and implementation record. Altitude labeling follows [Altitude](maps.md#altitude); drawn estimated chart connections must not alter exported observations. Browser PDF/email tests remain separate from physical device download and actual chosen-recipient inbox acceptance.

The September 11 Travel Report refinement uses four chapters plus an optional
fifth route/map page: journey, route, combined rhythm, atmosphere and details. Capture attributed cartography only for an explicitly
included immutable route; retain the exact bounded JPEG in the reviewed snapshot
so preview and email hashes agree. A twelve-second capture failure falls back to
an honest outline. Do not add coordinates to technical packets or refetch a map
while sending. The owner confirmed the supplied report's recipient verification
and PDF delivery flow; new renderer/physical acceptance remains separate. See
[road refinement](../ROAD-REFINEMENT-2026-09-11.md).

The atmosphere summary observes visible session time and confirmed advancing audio clocks. Muted, paused, stalled and hidden time is excluded from listening; preference rankings use observed time, with a separate listening-time denominator for genre. Only bounded whitelisted titles, artists, genre/visual/palette labels, palette hex colours and durations join the immutable optional `experience` field. No listening history is inferred for older snapshots. The PDF embeds derived Space Grotesk weights and uses the same six heading waves as Stats. [Infographic contract and evidence](../TRAVEL-REPORT-INFOGRAPHIC-2026-09-11.md).

## Session report navigation

The September 19 owner refinement removes the redundant Open Stats for Nerds
button from Session report. The existing Visuals entry owns navigation to Stats.

## Mounted phone response — September 19

Coordinate-free roadMotion records effective source/status and named consumers. Engine records responseSource. The motion summary allowlist admits only mountSelected and roadState (strict enum), never the road vector payload or raw histories. Synthetic QA still blocks automatic mail. See [the implementation contract](../PHONE-ROAD-INPUT-2026-09-19.md).

## Acknowledged delivery correction — September 20

A close-time request shares the ordinary single send owner and validates the response.
It never clears progress merely because `fetch` started. Persist cadence counters plus a
random delivery identity/reason and the first-attempt activity boundary, never a report.
Retry the same identity after failure/reload; a new page still needs one minute of its own
observations. Preserve activity collected after the first attempt, including when a retry
confirms the older packet. Three short retries are followed by a fifteen-minute cooldown;
failures retain progress. OFF, Standard and Reset Saved State invalidate pending identity
and late callbacks. `accepted` means a confirmed server mail-transport acceptance;
`flushes` counts attempts, never inbox receipt.

The endpoint stores private, locked acceptance timestamps under SHA-256 delivery-ID names
outside the web root, independent of IP changes. It keeps no report, recipient or sensor data
in receipts. Confirmed retries return success without another mail or rate-limit charge.
Client IDs expire after twelve hours; receipt cleanup removes files older than 24 hours on
subsequent traffic and caps storage at 4,096 files. Legacy clients retain existing validation
and server floors. SMTP handoff and receipt persistence are not a transactional queue: a
server crash between them remains an ambiguous-delivery edge case. Never claim exactly-once
inbox delivery. See [implementation and verification](../RELIABILITY-CORRECTION-2026-09-20.md).

## September 22 benchmark coverage

`phoneMotion.coverage` adds bounded numeric whole-session duration/count aggregates, independent of the bounded history. It distinguishes connected, fresh, reciprocal receipt and road eligibility, with per-transport duration and named consumer-input request durations. Forward/slowing/turn counts classify only distinct admitted samples and never store vectors. Consumer input does not prove audible output. Freshness attribution is capped by the existing 250 ms sample deadline; intervals over five seconds are unobserved. Upgrade state/reason and candidate route category are strict enums; no SDP, IPs, keys or credentials enter reports.
