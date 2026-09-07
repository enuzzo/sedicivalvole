# September 7 night implementation

Status: implementation and local verification complete; final publication
identity will be appended after canonical verification. The starting live build
was **20260907-2004**, source **b27975d**, version read from `VERSION`.

## Decisions and delivered behavior

The owner selected **Compact Cockpit**, direction 1, for iPhone 17 Pro and
iPhone 17 Pro Max, and **Travel Report**, direction 1, for the session PDF.

| Area | Behavior |
|---|---|
| Engine motion | Poor-accuracy moving readings preserve the last trusted speed until its original five-second deadline. They cannot renew trust, trigger shifts or add acceleration. Genuine loss, invalid speed and lifecycle loss remain conservative. |
| Engine bank changes | Preparing a replacement bank keeps the old audible graph and truthful Media Session playback. The preparing label names the requested profile. Failed preparation does not falsely report silence. |
| Engine sound | Transmission layers are silent at zero, Neutral/TAMARRO and uncertain movement; fresh creep introduces them smoothly by 5 km/h. Core sound, limiter, master level and dry routing are preserved. Three exceptional Mono loop seams receive a ten-millisecond complementary blend in decoded memory. |
| Diagnostics | The existing default Dev/AUTO ON fifteen-minute observed-GPS-driving schedule is unchanged. Flight records now include simulated Engine RPM, gear, load, profile, status, motion quality, rejection reason and gesture state. No coordinates are added. |
| Stats | Moving average, cumulative speed-gain/loss shares, optional long tasks, retained retry/mode events and simulated Engine RPM/gear/load complete the approved separate visual. Missing evidence remains missing; gaps are not interpolated into travel. |
| iPhone | Thin retracting 56 px top/bottom bars retain 48/56 px actions and safe-area offsets. The portrait rotation notice makes underlying/portal controls inert while keeping audio and selected visual mounted. Flux variant controls never overlay Engine. |
| Travel Report | Stats offers a frozen report revision with summary, speed/altitude traces, speed bands, direction totals and technical appendix. The default two-page PDF excludes precise coordinates. Explicit route inclusion adds a third page. Preview, download and chosen-recipient email use the same reviewed bytes. |

Intro remains the initial chooser; Splash is the loading transition. The Intro
build stamp, separate Atlas/Stats entries, OSM/Wikipedia places and stationary
Play the Road beds were already published before this checkpoint.

## Real diagnostic evidence

The additional Tesla message received at 20:04 local was produced by **build
20260907-1936**, source **7285ecb**, before automatic delivery build 2004. Its
verified gzip report contains 3,287 numeric GPS observations, a maximum near
115 km/h, thirty scheduled and committed virtual gear changes, no captured
runtime issue and a final fresh 600-RPM stop. A brief 10,000-m accuracy report
caused the avoidable Engine idle transition fixed here. First profile preparation
took roughly 14 seconds for Rosso and 12 seconds for Touring, while observed
audio remained active; the fault was misleading playback state, not proven
silence. This distinction is preserved in the fix and acceptance record.

## Report data and delivery contract

`src/reports/session-report-model.js` whitelists one immutable GPS session
revision. Technical fields cannot introduce route coordinates. Bounds include
24 hours, 720 trace points and 1,024 optional route points. Missing intervals
remain explicit. The first preview needs the canonical PHP endpoint; once
prepared, its local Blob can be downloaded without another server request.

`public/api/session-report.php` admits only same-origin JSON actions and a fixed
schema. Original renderer/delivery helpers live in `public/report-support/`;
FPDF 1.9 and two Helvetica metrics are unmodified with exact attribution/hashes.
Rendering is deterministic for the frozen creation time. The server stores no
trip/PDF archive. A browser session holds the recipient proof; the locked
delivery ledger stores hashed keys, counters and outcomes rather than the trip.

Email is an explicit action after reviewing the PDF. A six-digit code verifies
the recipient, expires after fifteen minutes and allows five attempts. Proof
lasts eight hours and can be restored through the read-only verification-status
action. Reset Saved State clears the saved address and requests server proof
removal. Offline reset still clears the local address.

The mail action regenerates the reviewed PDF and requires its SHA-256. A stable
delivery key survives retries. Atomic locked state is persisted before mail;
an uncertain outcome never automatically resends. A definite transport failure
permits bounded same-key retries. Mail acceptance is not inbox confirmation.
Request/preview/delivery limits are enforced by recipient, IP and globally.
Synthetic tests use a fake mailer or intercept the endpoint; they send no mail.

## Local evidence and remaining acceptance

- Native tests exercise actual WAV hashes and signal seams, motion expiry,
  transmission/core ownership, bank failure continuity, Stats gaps, phone
  classification and report snapshot/privacy/delivery behavior.
- Actual PHP renders match the JavaScript snapshot contract; default and route
  PDFs are A4 with two/three pages. Real local HTTP preview bytes match CLI PDF
  bytes, advertised SHA-256 and no-store headers. OTP/idempotency tests use fake
  transport, including concurrent delivery attempts.
- Isolated Chrome verifies real decoded Engine WAVs and AudioParam ownership,
  report controls/retry/offline download, notch offsets, portrait inert/focus
  restoration and audio-clock continuity. No synthetic email leaves the browser.
- Research measures all twelve active core WAVs and records six further source
  leads. No new external recording or procedural implementation enters the
  product. See [the acoustic study](ENGINE-ACOUSTICS-STUDY-2026-09-07.md).

The canonical publication, actual automatic diagnostic inbox receipt and a
physical Tesla/iPhone run remain distinct gates. Chrome dimensions and injected
GPS do not establish Safari audio, native media controls, cabin listening,
background execution, GPU temperature or endurance. This remains an experimental
development build; a SemVer production release is a separate owner decision.

Temporary local evidence: `/tmp/sv-night-engine-qa/`,
`/tmp/sv-night-engine-qa-44100/`, `/tmp/sv-phone-qa.json`,
`/tmp/sv-phone-engine-visual-qa.json`, `/tmp/sv-session-report-qa.json` and
`/tmp/sv-travel-report{,-route}.pdf`. Synthetic fixture plots are never presented
as a real journey or published product screenshot.
