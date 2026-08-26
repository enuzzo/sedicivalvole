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

## In-app report v2

The main product exposes diagnostics through an always-visible top-bar `DIAG` control, including at `773 × 601`. The report is scrollable and records:

- current inner/document/VisualViewport/screen/available/outer dimensions;
- DPR, orientation, safe-area insets, fullscreen state, and inferred split/expanded mode;
- a bounded history of meaningful viewport changes;
- WebGL2 vendor, renderer, maximum texture/renderbuffer size, and active renderer;
- AudioContext state, sample rate, reported base/output latency, AudioWorklet, and live level;
- GPS state, numeric/null sample counts, interval and accuracy statistics, and min/max/latest speed;
- WebAssembly, service worker, Cache Storage, IndexedDB, localStorage, OffscreenCanvas, WebCodecs, touch points, hardware hints, connection hints, language, and user agent;
- a bounded chronological event log;
- explicit privacy flags proving that coordinates are not collected, stored, or transmitted.

## Send Diagnostic architecture

The UI sends the v2 JSON report to the same-origin endpoint `/api/send-diagnostic.php`.

Server protections:

- `POST` and `application/json` only;
- exact `Origin: https://sedicivalvole.app` requirement;
- `Sec-Fetch-Site` validation when supplied;
- fixed server-side recipient and subject; no user-controlled mail headers;
- 96 KiB body limit and strict schema validation;
- recursive rejection of `latitude` and `longitude` keys;
- per-client hashed temporary rate limit with no raw IP in the email;
- no report persistence or server-side report logging;
- no CORS grant;
- no-cache and `nosniff` response headers.

The mail recipient is not present in public source code. A deployment requires the ignored local file `prototype/drive-lab/public/api/recipient.local.php`, created from `prototype/drive-lab/config/diagnostic-recipient.local.php.example`. The PHP file returns the recipient address without emitting it over HTTP. The deployment identity gate recognizes the file by fixed structural markers and never prints its contents.

A `202 accepted_by_mail_transport` response proves only that PHP `mail()` handed the message to the hosting mail transport. It does not prove Gmail inbox delivery. Delivery requires confirmation in the recipient inbox and, if needed, inspection of message headers/SPF/DKIM behavior.

## Live verification — 2026-08-26

- Compact layout tested at `773 × 601`: **PASS**.
- Always-visible `DIAG` entry and scrollable report: **PASS**.
- Wrong method, foreign origin, and coordinate-field rejection: **PASS** (`405`, `403`, `422`).
- One explicitly authorized report submission: **PASS** at the PHP mail-transport handoff boundary.
- Final delivery to the Gmail inbox: **pending user confirmation**.
