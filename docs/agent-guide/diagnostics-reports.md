# Diagnostics and report contracts

Read capture/automatic delivery for technical packets; Travel Report for PDF, recipient or route export. For time/freshness changes also use [motion/runtime](motion-runtime.md); for geographic data use [maps](maps.md#geographic-privacy). Technical diagnostics remain accessible in the main experience.

## Capture and presentation

The product entry is **REPORT**: pinned Tabler report-analytics outline icon above an explicit visible label in the compact top-bar cell. Do not replace it with a gear, icon-only control or hover tooltip. Internal names may remain technical. Use [shared geometry](interface.md#shared-geometry-and-palette) and support dialog conventions.

Extended diagnostics may aggregate frame pacing, connection changes, GPS accuracy/cadence, audio/runtime state, memory, storage, navigation/resource timings and bounded events. No coordinates. Retain bounded phase-specific summaries for Splash, active Visual/Music combinations and report-open state: FPS/frame-time distributions, browser-exposed JS heap, decoded PCM and bank sizes, without per-frame React state. Unsupported memory APIs are unavailable, never zero or invented.

The driving flight recorder is bounded and in session memory: speed, GPS age/accuracy, input, score, frame pacing, network and visibility outside React state. Preserve whole-session aggregates as old samples rotate. Debug interaction ledger records every semantic activation/media command with sequence, timestamp, source, safe identity, before/after transport snapshots, latency, browser lifecycle, Media Session registration/invocation, playback confirmation and bounded failure. Never record pointer coordinates, typed searches, GPS coordinates or media URLs. The old manual-only delivery restriction is superseded only by the explicitly bounded automatic contract below; this is not unrestricted telemetry permission. Read [Interaction/media recorder](../DIAGNOSTICS.md#exhaustive-interactionmedia-flight-recorder--2026-09-03) for capture details when changing it.

## Automatic delivery

The owner explicitly enabled automatic diagnostic mail during experimental development. Fresh preferences use **Dev / AUTO ON**, preserving saved OFF or Standard. Keep visible OFF in Intro and Session report, matching disclosure, server validation and tests. The existing fixed destination stays in ignored local configuration, never command lines or public docs. Do not send synthetic QA packets to the real mailbox; intercept delivery or use local fixtures when exercising sending.

Count **fifteen minutes of observable active session time**, including stops, absent GPS, simulated input and offline operation. Hidden time and execution gaps **over five seconds** are unobserved. Reload starts a fresh session clock. This explicitly supersedes ten-minute/future-only and later fifteen-minute driving-only rules. It does not promise timers while minimized/backgrounded.

Use `timeBasis: active-visible-session`, `intervalActiveMs`, `activeMs` and `totalActiveMs`. At most one due report waits **in memory** for online/foreground recovery; no persistent outbox. Construct a fresh bounded coordinate-free snapshot when actually sending. One in-flight send, bounded transport retry, existing destination and fifteen-minute server floor remain. Server validates the new clock and accepts the older driving clock for already-open clients. At threshold log `diagnostic-send.due`, including offline state, then `requested`, `accepted` or `failed` with automatic/manual attribution. Acceptance means mail-transport acceptance, not verified inbox receipt.

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
