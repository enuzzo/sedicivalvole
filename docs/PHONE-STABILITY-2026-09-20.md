# Phone transport and presentation stability — September 20, 2026

## Observed failure and causal evidence

The owner reports a real Mac/iPhone desk session with completed setup, stable
admission and repeated fresh/delayed readings on both screens. POSITION and ZERO
instructions also alternate with Waiting before completion. The owner separately
requests calmer readings and invariant cell/panel geometry; brief packet gaps must
not look like repeated disconnections.

The existing owner tab was initially unavailable to this task. After it became
accessible, read-only DOM/screenshot inspection confirmed the loaded build
`20260920-2044.7ba2b1c`, retained Setup complete, and alternating numeric versus
Delayed/blank telemetry. No reload, stop or permission change was performed. The
phone state comes from the owner, not from an unobserved device inspection.

A fresh controlled canonical run of that build reached only **96/120 mutually
fresh observations**, below the unchanged **114/120 (95%)** gate. Admission survived
and both contexts recovered after thirty seconds offline. Hardware inputs were
synthetic; App, session, cipher, protocol and canonical PHP were real. Evidence:
`/private/tmp/sv-phone-stability-before/evidence.json`.

Two independent causes are established:

- Receiver setup history saved checks and the step index, but `receiverSetup`
  still replaced every instruction with Waiting whenever status expired. Previous
  tests explicitly expected that oscillation. The accepted instruction must also
  survive a transport gap; actual invalidation and terminal state remain distinct.
- Each HTTPS sample needs receiver → server → phone → server → receiver, then a
  further exchange for mutual confirmation. Conservative sample age includes the
  full challenge round trip and continues increasing after arrival. Individual
  slow serial requests can exhaust the 250 ms budget without closing admission.
  HTTP timings also contain browser scheduling; they do not isolate the provider.

## Transport decision

An admitted HTTPS session now opportunistically establishes a host-only WebRTC
path. Capability negotiation leaves legacy peers on the original envelope. Offer
and answer are authenticated/encrypted with the existing QR key and carried in
bounded wrappers through the same latest-only PHP mailbox. The server never sees
plaintext SDP from this upgrade. Attempt numbers reject duplicates and obsolete
answers; stale promises cannot close a newer attempt. Unsupported/oversized SDP
falls back without truncation. No camera/microphone permissions, external ICE,
TURN provider, new service, account or cost is introduced.

The active owner supplies values, summary and receipts together. Direct selection
requires reciprocal calibrated evidence; it is not inferred from an open socket.
A valid direct path runs the existing 20 Hz challenge protocol. Its HTTPS owner
remains serial in 500 ms standby. Missing reciprocal progress for a second wakes
HTTPS on both sides, including asymmetric failures where the phone can still send.
RTC failure abandons only the child path; it does not reset pairing, sensors or
ZERO. Offline immediately clears transport evidence. The original absolute lease
wins over RTC lifetime: receiver timing starts before create, and phone admission
receives a conservative remaining TTL (with a conservative legacy fallback).
STOP, hidden-page teardown, sensor invalidation and expiry retain their boundaries.

This removes server round trips from motion delivery **when direct connectivity
is actually available**. It cannot guarantee that different networks, hotspot
isolation, Safari policy or a particular Tesla browser permit a direct route. HTTPS
fallback retains its measured latency limitations; no deadline is relaxed.

Alternatives were assessed using primary sources:

- [SiteGround Node support](https://www.siteground.com/kb/node-js-available) now
  documents plan-dependent Node projects (updated September 3, 2026), while its
  older [WebSocket policy](https://www.siteground.com/kb/can-host-websocket-server)
  says socket servers are unsupported and suggests long polling. The actual
  account plan/runtime and Upgrade support are unverified; a new socket server
  cannot be assumed available.
- SSE/long polling retain network hops and can occupy PHP workers. PHP explicitly
  documents that [flush cannot override every server buffer](https://www.php.net/manual/en/function.flush.php).
  No verified unbuffered persistent response exists for this host.
- [RFC 8835](https://www.rfc-editor.org/rfc/rfc8835.html#section-3.3) specifies the
  SCTP/DTLS/ICE data path; [RFC 8828](https://www.rfc-editor.org/rfc/rfc8828.html#section-7)
  explains connectivity/privacy limits and TURN's role across networks. The
  [WebKit data-only mDNS fix](https://bugs.webkit.org/show_bug.cgi?id=174500)
  rules out relying on the obsolete claim that camera permission is always needed.

## Presentation contract

Completed setup shows **Recent phone motion** and **1 s average · display only**.
Acceleration and rotation use one-second bounded averages of distinct samples
accepted fresh by the existing protocol, updated at most four times per second.
The window uses conservative sample age, not arrival time alone. Rounding removes
microscopic digit churn. This is historical presentation, never a motion source.
No fresh sample for a second clears numbers; new ZERO, explicit sensor invalidation,
offline or terminal state clears immediately. A receiver's derived transport-stale
summary alone is not misread as explicit local ZERO invalidation.

CURRENT INPUT remains instantaneous, with the unchanged 250 ms and reciprocal
receipt rules; it can show Delayed while the clearly labelled recent average is
still visible. The primary Connected / Screen awake status describes connection
and wake ownership, independent of an individual packet deadline. Fixed numeric
columns, tabular figures and reserved text heights prevent fresh/delayed content
from resizing the panel. GPS authority, Demo exclusion and all road consumers are
unchanged. No sample history, SDP, addresses or pairing secrets enter diagnostics.

## Verification and acceptance

Source checkpoint **3936555** is committed and pushed. Production build
**20260920-2153.3936555** verifies **834** exact static hashes. The full native
regression gate passes **1,061/1,061**, final focused companion/display checks
**65/65**, dependency credits **189**, and public hygiene **1,612** text files.

The complete final compiled automatic-path run passes **21 checkpoints**:
**119/120** mutually fresh half-second observations and **1,158/1,160** fresh,
confirmed, numeric, completed receiver observations at the requested 20 Hz cadence
(62.87 seconds including browser scheduling). All high-rate observations use the
actual native direct path. Both exceed the unchanged 95% continuity gate. Numbers and completed setup remain
visible in all **1,160/1,160** high-rate observations, including the two brief
losses of strict current-input validity; connection stays connected/direct.
It covers pre-ZERO instruction retention, an added 450 ms HTTPS delay, unilateral
RTC loss and automatic HTTPS/direct recovery with the same pairing and ZERO,
changing values/signs, bounded root metadata, wake denial/reacquisition, strict
250 ms current-input expiry versus one-second historical-display expiry, invariant
panel height, thirty-second offline recovery, GPS notices, drawer teardown,
LIGHT/DARK compact Tesla and phone layouts, reduced motion, sensor invalidation,
STOP and a new QR. The separately forced HTTPS path passes **16 checkpoints**;
this is functional fallback evidence, not a sustained canonical HTTPS latency pass.

Both final runs have **zero page exceptions**. Expected console resource failures
are retained: automatic path has 33 rate-limit 429s, two teardown 410s and eleven
unavailable-fixture 503s; forced HTTPS has 41 rate-limit 429s, two teardown 410s,
eight fixture 503s and one induced offline error. No synthetic diagnostic mail is
sent. Sensor input, permission, screen-wake and GPS evidence are browser fixtures;
App, session, cipher, protocol, PHP and native WebRTC are real.

Evidence:

- `/private/tmp/sv-phone-stability-final-complete/evidence.json`
- `/private/tmp/sv-phone-stability-https-browser/evidence.json`
- `/private/tmp/sv-phone-stability-full.log`
- `/private/tmp/sv-phone-stability-focused-final.log`
- `/private/tmp/sv-phone-stability-release-build.log`

The earlier partial automatic run recorded 120/120 and 1,219/1,219, then stopped
at the appearance-menu gesture. Those numbers remain historical, not the final
release result (`/private/tmp/sv-phone-stability-auto/evidence.json`). The final
harness performs the normal chrome-wake gesture and waits independently for both
averaged numeric rows and instantaneous phone freshness.

The owner confirms that the physical Mac/iPhone are on the same Wi-Fi. That makes
a host-only route plausible, but no direct Safari/Tesla connection has yet been
observed. Canonical publication and physical acceptance are separate gates.

## Canonical publication and final evidence

Canonical **20260920-2153.3936555**, source **3936555**, is published at
https://sedicivalvole.app/. The official read-only preflight passes with
`remote_writes=NONE`. Preserve-existing publication passes: **38 files /
6,525,888 bytes** uploaded, **832** unchanged static files and **29** recordings
fully verified/reused, two previous entry assets retained, thirteen root entries,
`ROOT_UPLOAD_ONLY` and no legacy deletion.

All **17** canonical HTTPS checks pass: bare root, cache-busted root and explicit
no-cache reload are byte-identical to the local build; current entry/phone/motion
assets, release manifest, worker, illustrations and icons match their local bytes;
pairing method/origin bounds return the expected 405/400/403. Root HTML is 1,445
bytes, SHA-256 `27832a31b761bd6af3fd42fa68f449c5061304da75fb2d60fd3f6a022001e76d`,
with no-store/no-cache and `x-proxy-cache: MISS`. An initial manifest request with
the default Python user agent returned 403; repeating the exact URL with a browser
user agent returns the correct 200 bytes. Final checks use browser-compatible
headers; no server policy was changed.

The actual public compiled App/phone and canonical PHP pass **six browser
checkpoints**, with no asset substitution: changing acceleration and signed
rotation, native direct selection, sixty-second continuity, thirty seconds with
both browser networks offline, and automatic recovery with the same admission
and ZERO generation **1 → 1**, without gestures. Continuity is **120/120** mutually
fresh observations against the unchanged **114/120** target, all using actual
native WebRTC. There are zero page exceptions and no synthetic diagnostic sends.
Screenshots verify the final public receiver and phone. Sensors/permission/wake
are still simulated; this is not physical Safari/Tesla acceptance, nor proof of
sustained direct connectivity across different networks.

Evidence:

- `/private/tmp/sv-phone-stability-preflight.log`
- `/private/tmp/sv-phone-stability-publish.log`
- `/private/tmp/sv-phone-stability-canonical-verify.json`
- `/private/tmp/sv-phone-stability-canonical-browser/evidence.json`

Physical retry: reload both pages on this build, start a new QR, complete ZERO and
explicit screen wake, inspect Connection details for `LOCAL · WEBRTC` versus
`HTTPS · ENCRYPTED`, then observe one minute stationary and two deliberate movements.
Record the device/browser, selected transport, stable geometry and any remaining
freshness interruptions. The owner's already-open old-build session was not
reloaded or stopped by this task. Physical acceptance remains open.
