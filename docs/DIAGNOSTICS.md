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

## In-app report v3

The main product exposes diagnostics through an always-visible top-bar `DIAG` control, including at `773 × 601`. The report is scrollable and records:

- current inner/document/VisualViewport/screen/available/outer dimensions;
- DPR, orientation, safe-area insets, fullscreen state, and inferred split/expanded mode;
- a bounded history of meaningful viewport changes;
- WebGL2 vendor, renderer, maximum texture/renderbuffer size, and active renderer;
- aggregate canvas frame pacing: average FPS, median/p95/maximum frame time, slow-frame counts, estimated missed target frames, render size, renderer, and configured target cadence;
- aggregate main-thread long-task counts and durations when the browser exposes them;
- AudioContext state, sample rate, reported base/output latency, AudioWorklet, and live level;
- GPS state, numeric/null sample counts, interval and accuracy statistics, and min/max/latest speed;
- WebAssembly, service worker, Cache Storage, IndexedDB, localStorage, OffscreenCanvas, WebCodecs, touch points, hardware hints, storage quota/usage, battery state, connection hints, language, and user-agent details when exposed;
- navigation, paint, resource-count/byte aggregates, and JavaScript heap metrics when exposed;
- bounded connection history plus online/offline, document-visibility, GPS, viewport, source, and control events;
- a two-second coordinate-free driving trace containing displayed/raw GPS speed, GPS age and accuracy, input mode, energy/BPM/score section, frame pacing, audio level, network state, and visibility;
- full-session duration, estimated distance, moving/stationary time, source/input durations, speed/rate extrema, and GPS-accuracy aggregates even after old trace samples rotate;
- bounded runtime errors, unhandled promise rejections, and WebGL context loss/restoration evidence;
- explicit privacy flags proving that coordinates are not collected, stored, or transmitted.

High-frequency frame observations and the flight recorder accumulate outside React state. The recorder samples every two seconds and retains at most 300 compact tabular samples, or approximately ten minutes, while its small aggregate counters cover the complete open session. The trace exists only in memory and is cleared by a reload or closed page. It does not retain every frame, resource URL, route, or coordinate. Runtime issue messages and stacks are truncated and bounded. Cellular RSSI is not available to ordinary Web applications; connection quality is represented only by browser-exposed effective type, downlink, RTT, online state, and changes over time.

## Send Diagnostic architecture

The UI sends the v3 JSON report to the same-origin endpoint `/api/send-diagnostic.php` only after an explicit tap on **SEND DIAGNOSTIC**. There is no automatic remote telemetry.

Server protections:

- `POST` and `application/json` only;
- exact `Origin: https://sedicivalvole.app` requirement;
- `Sec-Fetch-Site` validation when supplied;
- fixed server-side recipient and subject; no user-controlled mail headers;
- 192 KiB body limit and strict schema validation;
- client-side recent-first fitting below the pretty-printed mail limit, with original/transmitted counts recorded when pathological event volume requires trimming;
- explicit shortest-round-trip PHP float serialization so server-side pretty printing preserves compact browser numbers instead of expanding their binary representation;
- recursive rejection of common coordinate keys, including latitude/longitude and abbreviated variants;
- per-client hashed temporary rate limit with no raw IP in the email;
- no report persistence or server-side report logging;
- no CORS grant;
- no-cache and `nosniff` response headers.

The user-confirmed mail recipient is configured in the ignored local file `prototype/drive-lab/public/api/recipient.local.php` and is not present in public source code. The file is created from `prototype/drive-lab/config/diagnostic-recipient.local.php.example`, returns the recipient address without emitting it over HTTP, and is copied to the same private server location during deployment. The deployment identity gate recognizes the file by fixed structural markers and never prints its contents.

A `202 accepted_by_mail_transport` response proves only that PHP `mail()` handed the complete JSON report, including the flight-recorder trace, to the hosting mail transport. It does not prove Gmail inbox delivery. Delivery requires confirmation in the recipient inbox and, if needed, inspection of message headers/SPF/DKIM behavior.

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
