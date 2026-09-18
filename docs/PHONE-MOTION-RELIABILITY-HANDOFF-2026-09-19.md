# TRACE reliability and first-use review handoff — September 19, 2026

**Completed:** the bounded review is delivered as canonical **20260919-0131.c75c921**.
Use [Current state](CURRENT-STATE.md) and the [updated user guide](PHONE-MOTION-USER-GUIDE.md).
The instructions below are the historical task brief, not a new queued session.
Physical iPhone/Tesla acceptance remains the owner's next step.

## Current owner authorization

The owner explicitly requests a **new task**, after closing the parent work, to
review only errors and implementation improvements in the phone companion,
exercise operation and adverse scenarios, and make missing connections and
reconnection understandable and smooth. Correct relevant defects, run
appropriate tests, document, commit, push and deploy the verified improvements.
Conclude in Italian with plain explanations separated by topic. The owner plans
to approach the app from the car as a first-time user in the morning.

This is not permission to start unrelated backlog work or redesign TRACE. The
selected opaque cube, orientation phone, ZERO below the graph and lowercase
recalibrate remain approved. Scoped copy/state/recovery refinements are part of
this request; do not ask the owner to select the same design again.

## Baseline and single-writer handoff

Parent implementation is **e8beb93**, release record **ede86ca**, canonical
**20260919-0049.e8beb93**, VERSION **0.0.0**. Parent rechecked HTTP 200, release
identity, a clean saved checkout and HEAD/upstream parity before this handoff.
Read current Git/live state again: these facts are a baseline, not a permanent
assertion. The parent stops all writes before launching the successor task.

Continue directly in the saved Sedicivalvole checkout identified by the task
project context; its local path must not be copied into public documentation.
Keep one writer; do not create another checkout/worktree or run parallel writers.
Read root and `prototype/drive-lab/AGENTS.md`, then the applicable contract sections.
The previous full native suite passed 946/946; focused motion/PHP 15/15,
production integrity 828 hashes, final Sites 9/9, credits 189 and hygiene 1,495.
Canonical HTTPS/browser checks passed. None proves physical iPhone/Tesla support.

## Review objective and scenarios

First inspect the rendered first-use UI without using technical documentation
to excuse missing guidance. Then trace behavior to code and reproduce defects.
Keep findings separate from merely hypothetical concerns. Useful scenarios:

- Entry from the Tesla nav, QR creation/loading failure, long waiting, expiry,
  duplicate scan, reload, one-use token rejection, stale tab and double taps.
- Direct phone-page local mode versus a genuinely paired receiver. Never let a
  local moving trace or a connected transport imply usable remote sensors.
- Denied/partial permissions, unsupported APIs, missing axes/orientation, first
  samples delayed, motion during ZERO, changing mount/screen orientation and
  freshness loss. Retrying must not revive a stale calibration.
- Offline start, setup timeout or non-JSON response, transient loss, disconnected
  peer, backpressure and delayed callbacks. Avoid stuck disabled buttons,
  unexplained spinners, stale promises changing a new session, or retry storms.
- STOP, DISCONNECT, refresh, back navigation, hiding either page, screen lock,
  browser resume and one-hour expiration. Provide an explicit understandable
  recovery path; do not silently reuse consumed QR tokens or stale references.
- Wake lock unavailable/denied/released, late acquisition after stopping and
  explicit retry. SCREEN AWAKE must always represent an actual held lock.
- WebGL2 unavailable/context loss/recovery, reduced motion, absent data, narrow
  portrait and landscape. Graph failure must not break valid numeric sensing.
- Safe diagnostics on both devices, including failures before pairing. Verify
  actionable state/stage/counters without raw sensor traces, SDP, coordinates,
  bearer keys or unfiltered exception text. Do not send synthetic mail.

Check the current direct WebRTC/no-STUN-or-TURN boundary. Shared Wi-Fi is an
initial test path, not proof that clients can communicate; separate cellular
connections and actual Tesla/Safari interoperability remain unverified. Do not
add a new relay/account/provider or weaken permissions/security implicitly.
Preserve GPS/Demo speed and audio ownership; Aperture steering remains queued.

## Evidence, delivery and closeout

Use deterministic fixtures for adverse cases and the available browser for
actual interaction/rendered outcomes. Label synthetic input and emulation;
never present them as physical acceptance. Strengthen behavior tests for real
fixes, not implementation-mirroring tests. Test current software, do not simply
quote parent results. Preserve source/licensing/privacy and release gates.

Follow `docs/agent-guide/delivery.md` and the exact DEPLOY gate. Use credential-
free QA/builds with `SEDICIVALVOLE_NO_LOCAL_ENV=1`. Native tests need Python 3.11:
`PATH=/usr/local/opt/python@3.11/libexec/bin:$PATH SEDICIVALVOLE_NO_LOCAL_ENV=1 npm run test:native`
from `prototype/drive-lab`. No .env inspection; only the official deploy script's
existing internal-loading exception applies. Keep technical AUTO OFF and audio
muted during browser QA; preserve the existing actual delivery contract.

Update `PHONE-MOTION-USER-GUIDE.md`, the companion contract, relevant agent
references, current state/handoff and changelog for actual changes. Commit/push
verified checkpoints. If product code changes, build from committed source and
publish using the official preserve-existing workflow; do not rebuild during
FTP verification. Verify bare/cache-busted HTML, referenced assets/hashes,
controlled reload and live behavior before claiming success. If no runtime
change is needed, document that result and why no redundant deploy is needed.

Final response: plain Italian, clearly separated topics for what was found and
fixed, what the user now sees/does, tests and actual deployment/build, remaining
physical acceptance and a short updated first-time car test. No vague claim
that everything will work on untested hardware. Do not launch another task
without a new owner request.

References: [User guide](PHONE-MOTION-USER-GUIDE.md),
[Companion contract and release evidence](PHONE-MOTION-COMPANION-2026-09-18.md),
[selected design](design/phone-motion-2026-09-19/README.md).
