# Diagnostic delivery and iPhone motion reliability

## Scope and evidence

The owner approved correcting the September 20 diagnostics implementation, retaining its
verified catch-up/persistence decisions, repairing iPhone acceleration/gyroscope reception,
and publishing after verification. The approved TRACE design, 250 ms motion deadline,
GPS speed authority, manual Travel Report and coordinate-free diagnostic boundary remain.

Independent Gmail verification found five September 19 diagnostic mails, all manual.
The decoded 10:38, 13:10 and 15:42 UTC attachments contain respectively 588460.9,
116016.1 and 338036 active milliseconds; the first has 1931556.8 unobserved milliseconds.
The 13:10 report records direct WebRTC expiry without received samples. The 15:42 report
contains no phone attempt. These reports support the missed active-time threshold, but
neither identify the cause of the execution gap nor prove the subsequent HTTPS path worked.
Private emails and attachments remain outside the repository.

## Changes

- Keep wall-time catch-up, bounded progress persistence, close-time keepalive, explicit OFF,
  and the two reviewed fixes for delivery-reason validation and Reset Saved State.
- Replace optimistic close-time success with shared response validation and a single send
  owner. Persist a random delivery identity before dispatch; retain unconfirmed progress.
  Short retries are bounded, then cool down for fifteen minutes. Only server confirmation
  increments acceptance. Preserve observations made after the first attempt, including when
  a retry confirms an earlier packet. OFF/Standard/reset invalidate late completions.
- Server acceptance receipts contain timestamps only under hashed delivery-ID filenames,
  in private files outside the web root. Confirmed retries do not mail again, even after an
  IP change. Receipts expire after 24 hours on traffic cleanup, with a 4,096-file cap; client
  identities expire after twelve hours. No report/outbox or recipient is persisted there.
  Mail handoff and receipt writes cannot be made one transaction: a server crash between
  them remains an ambiguous-delivery edge case, not an exactly-once inbox guarantee.
- Measure compact request bytes after all transport metadata is written.
- Separate transport CONNECTED from fresh sensor evidence. HTTPS pipelines up to eight
  matching requests, retaining the 250 ms receiver-clock upper bound and strict replay,
  generation and receipt checks. HTTP exchanges remain serial; pacing includes their
  duration; a 22 ms post-response backoff applies only after HTTP 429, retaining the rejected
  response. Eight consecutive refusals stop the session. No new provider, server transport or plaintext sensor storage is introduced.
- Preserve GPS fallback when motion is late, missing, uncalibrated, or mount-invalid.
  Direct WebRTC and old wire envelopes remain compatible.

## Verification environment corrections

The saved Dropbox `node_modules` symlink targets the other Mac's absent Apple-silicon
directory. The existing Intel cache matches the current lockfile (`a44f544f69cc5a94`).
Implementation remains in the saved checkout, with one writer. A temporary test/build
mirror copies tracked files, explicitly excludes secret variants, uses that Intel cache,
and sets `SEDICIVALVOLE_NO_LOCAL_ENV=1`. Private reference bytes are not copied or replaced
with empty imitations; the read-only filename inventory test reaches the original path.

Python 3.11.16 is installed. The previous test failure selected Python 3.9.6 through
`python3`; selecting the 3.11 bin directory on PATH fixes that test. Publication uses the
official `python3.11` deployment command. The shared dependency symlink stays untouched.

## Verification status

Regression tests reproduced the original intermediate-latency status/cadence fault and
the lost unconfirmed flush before the fixes. Focused clock/endpoint checks pass 34/34;
motion protocol/companion checks pass 53/53. The final complete native suite passes
1,030/1,030, credits pass 189 entries, and the production package passes 827 exact static
hashes. Public hygiene and whitespace checks pass.

Actual Chromium pages at 773 x 601 and 390 x 844 use the real local PHP encrypted relay,
with explicitly synthetic permission/sensor/GPS fixtures. Both peers reach mutual ZERO
readiness; the receiver stays LIVE for 30/30 observations. The captured coordinate-free
manual report identifies phone-motion as the Engine response source while speed remains
GPS: 98 received samples, 68.6 ms latest / 111.2 ms maximum RTT, and zero signaling errors.
Added relay delay causes GPS fallback; STOP terminates phone sensing. Neither page records
a page exception. These are browser/fixture results, not physical sensor measurements.

A separate rendered diagnostic test injects a 503 close-send failure, reloads, then confirms
a retry with the same identity. Acceptance stays zero until the 202 response, and 65 seconds
of newly observed activity remain available afterward. All browser diagnostic requests are
intercepted. A real local PHP endpoint test returns 202 for first acceptance, 202 for the
same confirmed identity, 429 for a new identity within the rate limit and 422 for an invalid
identity; the local mail-capture process receives exactly one message, with no SMTP delivery.
Final committed build identity and canonical publication are the next gate.

Physical iPhone permissions, mounted acceleration/gyro signs, actual mobile-network
continuity, cabin response, and the first real automatic mailbox receipt remain separate
acceptance checks. Synthetic verification must never send mail to the real destination.

## Canonical verification and pacing follow-up

The first correction was published as `20260920-1521.cb0255f`: 38 files / 6,503,773 bytes,
825 static files and 29 full-hash recordings reused, one previous entry asset retained,
ROOT_UPLOAD_ONLY. Official preflight/postflight pass with no writes; ten HTTPS identity,
asset, bare/cache-busted/reload and API checks pass. A first preflight timed out without
writes; unreadable old Dropbox build output was preserved under ignored `output/` and the
fresh build was copied and fully hash-verified. No source/dependency symlink was replaced.

Browser probes during the concurrent FTP integrity download had interrupted usable motion,
including 20/30 and 5/30 LIVE observations. Those continuity checks did not pass. With native
browser networking and no concurrent FTP transfer, both peers reached mutual readiness and
30/30 LIVE observations passed: 50 samples, latest 155.9 ms / maximum 193.7 ms RTT, no rejected
samples or signaling errors, Engine source phone-motion, then delayed-data GPS fallback.
Network load is a contributing-condition inference, not proof of every physical failure.

A controlled 50 ms HTTP latency regression also exposed an avoidable fixed-delay cost in
this first correction. The follow-up removes the unconditional 22 ms wait and uses bounded
HTTP 429 backoff instead, preserving the pending reply after rejection. Both the 50 ms
continuity case and three consecutive rate refusals failed before this follow-up and pass
afterward. Server limits, encrypted envelopes and 250 ms freshness remain unchanged. Final
follow-up production/browser checks and publication are pending.
