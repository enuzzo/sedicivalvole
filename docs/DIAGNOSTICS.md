# Tesla Diagnostics

## Verified vehicle evidence — 2026-08-26

The first real Tesla session produced the following photographed values:

| Signal | Verified value |
|---|---|
| Split-view CSS viewport | `773 × 601` |
| VisualViewport | `773 × 601` |
| Logical screen | `1254 × 784` |
| Device pixel ratio | `1.5299999713897705` |
| Touch points | `16` |
| WebGL2 | available and active |
| Web Audio | running |
| AudioWorklet | available |
| WebAssembly | available |
| Service Worker API | available |
| Cache Storage | available |
| localStorage / IndexedDB | available |
| Browser language | `it` |
| GPS speed field | numeric/live |
| Photographed GPS accuracy | approximately `±10000 m` |
| User agent | Linux x86_64; Chrome `148.0.0.0`; AppleWebKit `537.36` |

The compact viewport is the relevant driving layout because Tesla retains vehicle/navigation content on the left and the browser on the right. `1254 × 784` is not the browser viewport in that state. DPR explains why fine graphic detail and small text remain visually crisp, but physical touch targets must still be large.

## Exhaustive interaction/media flight recorder — 2026-09-03

Checkpoint `c869f1d` is canonical in build `20260903-0843`, built from
source/documentation checkpoint `bbc7bb9`. Focused checks pass `73/73`, the
complete unit group passes `498/498`, all feature/Sites suites and the
production build pass. Exact local Play → Next → Previous → raw-REPORT QA
contains sequenced UI, correlated media request/outcome, browser lifecycle, and
Media Session publication event families with no Browser warning/error.
Canonical HTML, main JavaScript, and CSS are byte-identical to that candidate;
the physical Tesla Media Session result and received fresh attachment remain
open under `R10C-03`.

Local source checkpoint `6cda7ee` extends that evidence without changing the
privacy boundary. Every native Play, Pause, Previous, and Next invocation now
receives a monotonic action ID and records synchronous receipt plus its ordered,
correlated completion or failure. The same stable handlers serve Play the Road
and Soundtrack. The report distinguishes committed audible state from pending
buffer work, and its Media Session publication remains truthful for metadata,
artwork, playback state, and valid position state. Physical-Tesla native-control
receipt and listening remain open; office tests do not close `R10C-03`.

## In-app report v3

The main product exposes diagnostics through an always-visible top-bar `REPORT` control, including at `773 × 601`. Its official Tabler report-analytics icon sits above the explicit label in the existing compact navigation cell; the control opens the scrollable session report.

At the Tesla split viewport, four compact health cells lead a two-column instrument grid for motion, rendering, audio/resources, and session/transport evidence. The actions stay in normal report flow instead of covering metrics; below `620 px`, health returns to two columns, instrument sections to one column, and actions to two columns. The explicit send control retains a `48 px` touch target, and an empty status consumes no height.

- current inner/document/VisualViewport/screen/available/outer dimensions;
- DPR, orientation, safe-area insets, fullscreen state, and inferred split/expanded mode;
- a bounded history of meaningful viewport changes;
- WebGL2 vendor, renderer, maximum texture/renderbuffer size, and active renderer;
- aggregate canvas frame pacing: average FPS, median/p95/maximum frame time, slow-frame counts, estimated missed target frames, render size, renderer, and configured target cadence;
- phase-specific frame pacing for the Signal Gate, every active Visual/Music combination, the Aperture `0–40 km/h` wall-retreat band, and the same combination with the session report open;
- bounded main-thread long-task evidence when the browser exposes it, including
  observed start time, duration, active phase, renderer, Visual/Music, speed,
  coordinate-free GPS age/state, audio state, network hint, and visibility;
- AudioContext state, sample rate, reported base/output latency, AudioWorklet,
  and live level; output-latency samples distinguish unavailable, reported zero,
  and reported positive values instead of treating zero as proven timing;
- GPS state, numeric/null sample counts, interval and accuracy statistics, and min/max/latest speed;
- WebAssembly, service worker, Cache Storage, IndexedDB, localStorage,
  OffscreenCanvas, WebCodecs, touch points, hardware hints, storage quota/usage,
  battery state, connection hints, language, and user-agent details when exposed;
- a versioned IndexedDB storage canary with creation time, last-seen time,
  observation count, current app identity, truthful `persisted()`/`persist()`
  outcomes, and an explicitly unavailable vehicle-software field when the
  browser exposes no supported source;
- navigation, paint, resource-count/byte aggregates, and JavaScript heap metrics when exposed;
- per-phase JavaScript heap minimum/latest/maximum plus JUNCTION bank and decoded-PCM memory, with unsupported browser fields reported as unavailable rather than estimated;
- bounded connection history plus online/offline, document-visibility,
  throttled GPS, viewport, source, control, Media Session, and browser-media events; interactions, significant events, and
  high-rate GPS samples use separate bounded channels so sampling cannot evict
  earlier user actions or failures;
- session-bounded network observations: browser-exposed resource transfer bytes,
  successful app-known upload payload bytes, rolling current rates, peaks,
  active transfers, failures, and recoveries;
- a deterministic network-notice state in the raw report that prioritizes the
  browser's offline hint, recent unrecovered instrumented failure, active app
  transfer, recent recovery, constrained Network Information estimate, quiet
  online hint, and unavailable evidence without presenting any of them as a
  device-wide traffic measurement;
- a two-second coordinate-free driving trace containing displayed/raw GPS speed, GPS age/accuracy/confidence, input mode, energy/BPM, active Visual/Music, JUNCTION section/harmonic identity/single take/bank state, frame pacing, real output RMS/peak, network state, and visibility;
- session exposure counts for unique visuals, scores, JUNCTION sections, harmonic identities, and performances;
- full-session duration, estimated distance, moving/stationary time, source/input durations, speed/rate extrema, and GPS-accuracy aggregates even after old trace samples rotate;
- bounded runtime errors, unhandled promise rejections, and WebGL context loss/restoration evidence;
- explicit privacy flags proving that the diagnostic payload contains, stores,
  and transmits no coordinates, plus separate booleans disclosing whether the
  ephemeral ATLAS location feature and its third-party requests are active.

High-frequency frame observations and the flight recorder accumulate outside React state. Phase records retain aggregate counters and at most 300 recent frame intervals per phase; memory is sampled every two seconds, never per frame. A phase that disappears and later returns starts a new continuity segment, so the intervening time is not misreported as a dropped frame or low FPS. Debug interaction events have their own 1,200-entry channel; significant state/failure/recovery events retain 800 entries and ordinary GPS samples retain 1,200. Every event carries a monotonic sequence number in addition to its wall-clock and elapsed timestamps, so equal-time actions remain exactly ordered. The recorder samples every two seconds and retains at most 1,800 compact tabular samples, or approximately one hour, while its small aggregate and exposure counters cover the complete open session. The trace exists only in memory and is cleared by a reload or closed page. It does not retain every frame, resource URL, route, pointer coordinate, typed search string, or GPS coordinate. Runtime issue messages and stacks are truncated and bounded.

The interaction channel records each semantic button/link/control activation and each non-text value change. Soundtrack actions use correlated IDs across requested/completed/failed events and distinguish launch, persistent on-screen transport, Music drawer, and native Media Session sources. Their before/after snapshots include current/previous/next track keys, public title/artist identity, transition state, current audible key, prepared/playable deck counts, `readyState`, `networkState`, buffered-ahead seconds, pause/end state, media error, duration and explicit playback confirmation. Browser lifecycle observations retain `loadstart`, metadata, progress, readiness, playing, waiting, stalled, suspend, pause, ended and error transitions. Media Session publication records API availability, metadata, artwork, playback-state and valid-position success, plus the registration result and monotonic invocation ID/order/outcome for Play, Pause, Previous and Next. Text inputs record length only; typed content is deliberately excluded.

Network totals are deliberately narrower than a device or carrier meter. They
include exact application payload bytes only where the application owns the
transfer and the browser's `PerformanceResourceTiming.transferSize` only where
the browser exposes it. They exclude unrelated Tesla traffic, unavailable TLS
and protocol overhead, opaque cross-origin bodies, and cache activity the API
does not reveal. Browser `downlink` and `rtt` values remain labelled estimates,
not measured application throughput. Cellular RSSI is unavailable to ordinary
Web applications. Active download/upload counts cover only application requests
that sedicivalvole explicitly instruments; Resource Timing becomes observable
after completion and therefore cannot prove that an arbitrary browser resource
is currently moving. The visible quiet-when-healthy navbar notice remains gated
by the selected interface direction; the raw REPORT model is already available.

## Send Diagnostic architecture

The UI sends the v3 JSON report to the same-origin endpoint `/api/send-diagnostic.php` only after an explicit tap on **SEND DIAGNOSTIC**. There is no automatic remote telemetry.

Server protections:

- `POST` and `application/json` only;
- exact `Origin: https://sedicivalvole.app` requirement;
- `Sec-Fetch-Site` validation when supplied;
- fixed server-side recipient and subject; no user-controlled mail headers;
- 1.875 MiB request-body limit (ten times the original budget) and strict schema validation;
- client-side recent-first fitting against the exact compact request envelope, with an 8 KiB safety margin and original/transmitted counts recorded when pathological event volume requires trimming; this avoids comparing the browser's two-space JSON with PHP's larger four-space diagnostic attachment;
- explicit shortest-round-trip PHP float serialization so server-side pretty printing preserves compact browser numbers instead of expanding their binary representation;
- a compact multipart email body plus one complete `.json.gz` attachment named with the accepted timestamp and build; the body records the JSON/GZIP byte counts and both SHA-256 digests;
- deterministic PHP round-trip coverage that extracts the MIME attachment, decodes Base64, decompresses GZIP, validates both digests, and compares the complete report rather than a shortened preview;
- recursive rejection of common coordinate keys, including latitude/longitude and abbreviated variants;
- per-client hashed temporary rate limit with no raw IP in the email;
- no report persistence or server-side report logging;
- no CORS grant;
- no-cache and `nosniff` response headers.

The user-confirmed mail recipient is configured in the ignored local file
`prototype/drive-lab/config/diagnostic-recipient.local.php`. It stays outside
both `public/` and `dist/`, so neither the Vite development server nor any
static package can serve it. The file is created from
`prototype/drive-lab/config/diagnostic-recipient.local.php.example`, returns the
recipient address without printing it, and is copied to the private remote API
location only during explicit publication. The deployment identity gate
recognizes the file by fixed structural markers and never prints its contents.

A `202 accepted_by_mail_transport` response proves only that PHP `mail()` handed the multipart message and complete gzip-compressed JSON report, including the flight-recorder trace, to the hosting mail transport. It does not prove Gmail inbox delivery. Delivery requires confirmation in the recipient inbox and, if needed, inspection of message headers/SPF/DKIM behavior. Gmail may shorten the displayed text of a long message; the attachment is the authoritative complete report and is independent of that presentation limit.

The accepted report is always encoded as a level-9 GZIP attachment, regardless of whether it is small or close to the request ceiling. In-memory retention is independently bounded to the latest 1,800 two-second drive samples, 1,200 interactions, 800 significant events, 1,200 ordinary sample events and 24 runtime issues. Older details rotate within their own channels while full-session aggregates, extrema, exposure counts and discard counters remain available. If an unusually verbose report still approaches the transport ceiling, the client removes ordinary sample events first, then non-interaction events, runtime issues and old drive samples before touching the protected interaction history; exact before/after counts remain recorded in `transport`.

Sanitized endpoint failures are shown in the drawer. The page keeps the recorder in memory after a failed send, so the same report can be retried after a transient connection, rate-limit, recipient, transport, or server-formatting correction as long as the page is not closed or reloaded.

## Live verification — 2026-08-26

- Compact layout tested at `773 × 601`: **PASS**.
- Always-visible `DIAG`, scrollable v3 JSON, frame-pacing card, and network card: **PASS**.
- Wrong method, foreign origin, abbreviated coordinate-field, and legacy-v2 rejection: **PASS** (`405`, `403`, `422`, `422`).
- One explicitly authorized v3 report submission: **PASS** at the PHP mail-transport handoff boundary.
- Final delivery to the Gmail inbox: **pending user confirmation**.

## Flight-recorder mail verification — 2026-08-27

- Live build and asset identity: **PASS** for deployed commit `d415db8` and JavaScript `index-I8IcCozA.js`.
- Split-view diagnostics at `773 × 601`: **PASS** with four dynamic samples, a 7-second session summary, a 12 KiB pretty-printed report, and zero captured runtime issues.
- Motion evidence: **PASS** for `0 → 36.8 → 81.4 → 116.2 km/h`, including displayed-speed rate, source, input, energy, BPM, score section, audio level, frame pacing, network, and visibility.
- One explicit live `SEND DIAGNOSTIC` gesture at approximately `2026-08-27 08:46 UTC`: **PASS** with UI state `SENT` and `accepted_by_mail_transport` semantics.
- Final delivery to the configured Gmail inbox: **pending user confirmation**.

## Long real-vehicle report recovery — 2026-08-27

- A real Tesla session retained `248` samples across `515 s`; the drawer estimated a `141 KiB` report with zero runtime issues and preserved it after the failed send.
- The endpoint rejection was traced to provider PHP float expansion after browser-side fitting, not to GPS telemetry, the browser connection, or loss of recorder data.
- A representative 248-sample report measured `215,327` bytes with the provider-equivalent precision and `120,095` bytes after shortest-round-trip serialization.
- The corrected endpoint passed the complete local request path with `202 accepted_by_mail_transport` while real mail delivery was redirected to a harmless local sink.
- The corrected endpoint is live. Retrying the still-open Tesla page requires no reload and preserves the original driving trace; successful transport and Gmail receipt remain pending user confirmation.

## Phase-telemetry mail verification — 2026-08-28

- Live build `20260828-0100`, commit `81824b8`, at `773 × 601`: **PASS**.
- The explicit Demo path covered Signal Gate, Aperture + JUNCTION, Vertigo + JUNCTION, and DIAG-open state; the report retained five distinct performance phases.
- Current Vertigo/JUNCTION DIAG phase: **60.38 FPS**, **18.4 ms p95**, **12 MB** browser-exposed JavaScript heap, and **33.2 MB** decoded PCM.
- Runtime issues and coordinate keys: **zero**; browser console warnings/errors: **zero**.
- Explicit `SEND DIAGNOSTIC`: **PASS** with `SENT` and `accepted_by_mail_transport`. This proves server mail-transport acceptance, not inbox delivery.

## Complete attachment packaging — 2026-08-28

- The first real-Tesla report reached the configured Gmail inbox, proving the
  full user-gesture → endpoint → mail-transport → inbox path for build
  `20260828-0127`. Copying the displayed message exposed Gmail's clipping
  boundary, not evidence that the server lost the accepted report.
- The endpoint now keeps only an integrity summary in the visible body and
  attaches the complete accepted schema/report envelope as `.json.gz`.
- Deterministic packaging verification: **PASS**. A 157-sample fixture crossed
  PHP JSON encoding, GZIP, Base64 and multipart MIME, then decompressed to a
  report structurally identical to the input with matching JSON and GZIP
  SHA-256 digests.
- Live build `20260828-0927`: one explicitly authorized coordinate-free
  157-sample validation report returned **`202 accepted_by_mail_transport`**.
  Confirmation that Gmail displays the `.json.gz` attachment remains a
  separate recipient-inbox check.

## First complete Tesla report — 2026-08-28

- The Gmail `Show entire message` export contained all **157 / 157** flight
  samples and **240 / 240** bounded events: no transport fitting or server-side
  report loss occurred. The copied visible message was Gmail presentation
  clipping; the `.json.gz` attachment is now the authoritative artifact.
- The 314.4-second drive covered an estimated 3.629 km, with 292 seconds moving,
  20 seconds stationary, 90.2 km/h maximum displayed speed and 92 km/h maximum
  raw GPS speed.
- Overall rendering was healthy on AMD Vega / Chromium: **60.04 FPS**, **16.7 ms
  median**, **16.8 ms p95**, and only **4** frames above 34 ms. The earlier
  7.62 / 33.37 FPS phase readings were telemetry defects caused by counting a
  phase re-entry gap as one frame, not proof of sustained GPU failure.
- GPS delivered 2,965 samples at approximately 10 Hz with 2 m median accuracy.
  One isolated 10,000 m accuracy collapse sat between 2 m and 3 m samples; the
  runtime now records such evidence but holds the previous trusted speed rather
  than allowing it to command score or geometry.
- The 240-event ring was almost entirely filled by ten-hertz `gps.sample`
  events, retaining only the final 25.7 seconds. Ordinary GPS events are now
  sampled at two-second cadence while anomalies remain immediate.
- JUNCTION was not stuck at 135 BPM near the final stop: the vehicle had
  reaccelerated to 23.2 km/h only about ten seconds earlier, shorter than the
  eight-bar quantization window. The score boundary behaved as authored.
- The report exposed two semantic gaps now fixed: JUNCTION's string section was
  discarded by a numeric-only check, and `audio` duplicated road energy rather
  than measuring the output. Section/harmonic-identity/take state and a real analyser
  RMS/peak meter are now recorded.

## Received real-drive attachment — 2026-08-31

The owner supplied the complete received attachment
`sedicivalvole-diagnostic-20260831T070927Z-build-20260831-0853.json.gz` from the
representative drive completed before the office session. The GZIP is valid and
has SHA-256
`24dcf0242f641dd76de448b01cf9f6630033f5b89cbab202d225adf7832fdcf5`.
It identifies schema `sedicivalvole.tesla-diagnostic.v3`, source commit
`61f356d`, build `20260831-0853`, the canonical URL, GPS input, an explicit
send gesture, full-evidence transport, and server acceptance at
`2026-08-31T07:09:27+00:00`. The owner-supplied received attachment closes the
end-to-end `GPS → SENT → received` diagnostic-delivery gate.

| Signal | Received evidence |
|---|---|
| Display | exact `773 × 601`, DPR `1.53`, split mode, `1254 × 784` logical screen |
| GPS | `3928` numeric / `0` null samples, approximately `10 Hz`, `2.5 m` median accuracy, `84.0001 km/h` maximum |
| Drive trace | `243` samples across `485.9 s`, approximately `4.078 km`, `384 s` moving and `100 s` stationary |
| Exposure | Drivey, Atlas and Vertigo; JUNCTION and NIGHTSHIFT; BREAK/FULL/ENTER/CRUISE/GLIDE/PARK |
| Audio | `48 kHz`, AudioWorklet available, `42.667 ms` base latency, `184–208 ms` positive output-latency history, six decoded NIGHTSHIFT clips / `49.3 MB` decoded PCM, no fallback |
| Network | changing `3g`/`4g` estimate, `1.35–1.5 Mbps`, `100–250 ms` RTT; no failed instrumented application request |
| Safety/privacy | zero runtime issues; coordinates collected/stored/transmitted all `false` |

Non-ATLAS rendered phases remain healthy: Drivey/JUNCTION averages `59.9 FPS`,
Vertigo/JUNCTION `59.85 FPS`, and Vertigo/NIGHTSHIFT `59.9 FPS`. ATLAS/JUNCTION
is a repeatable performance defect rather than a session-pause artefact:
`23.15 FPS` average, `43.75 ms` median, `51.7 ms` p95, `100.1 ms` maximum,
`4967` frames above `34 ms`, and `934` frames above `50 ms` across `248.2 s`.
Eight long tasks total `881 ms` with a `354 ms` maximum; no prior 12-second
pause recurs. Local mitigation therefore reduces only the MapLibre framebuffer
and repeated marker/style work. A new target-vehicle report must prove stable
30 FPS before ATLAS performance acceptance can close.
