# Phone integration repair handoff — September 20, 2026

## Assignment and writer ownership

The owner explicitly requested a fresh task with higher reasoning effort to repair
the complete phone integration after a real iPhone trial. Continue in this saved
Dropbox checkout, as its sole writer. The previous task stops writing after this
documentation checkpoint. This is an execution assignment, not a request for a
plan: reproduce, fix, verify and publish the agreed phone work through the normal
delivery gates. Do not resume unrelated backlog work or redesign the approved UI.

Read root and Drive Lab AGENTS, then the affected phone/runtime contracts and
delivery sections. Communicate with the owner in Italian; product/code/docs in
English. Do not inspect, print, copy or version secrets. Do not version private
references or send synthetic diagnostic mail.

## Current evidence and product identity

- Product source: `e82f181`; prior documentation HEAD: `c550478`, clean and synced
  with `origin/main` at handoff preparation.
- Last verified canonical publication: `20260920-1847.e82f181`. This handoff does
  not rebuild or deploy. Recheck current state before subsequent product claims.
- Owner observation: ZERO now completes; the iPhone stays awake during this trial
  and locally displays acceleration and rotation, including small desk vibrations.
- Unresolved: onboarding checks alternate red/gray/red; the receiver reports
  connected/Fresh but acceleration and rotation remain absent. This is not a
  successful end-to-end physical acceptance. Sustained iPhone/Tesla acceptance
  remains open; the receiver in these screenshots is the owner's desktop browser.
- The owner wants a sensible noise threshold considered because typing nearby
  produces visible readings. No measured noise profile or chosen threshold exists.

Private owner screenshots are preserved locally, ignored by Git, under
`_references/phone-integration-2026-09-20/`. Never publish their unrelated background
content. `01-position-delayed.png` shows Position active with only Connect checked;
`02-awake-delayed.png` shows Awake active with only Connect checked. Both say
"Waiting for your phone" / "Connected · Data delayed". The third,
`03-fresh-missing-readings.png`, shows Setup complete, acceleration and rotation
as em dashes, 103 ms round trip, Fresh, and "Fresh motion received".

## Concrete code finding — not fixed in the handoff

At this source revision, `prototype/drive-lab/src/App.jsx` around lines 2457–2469
constructs the receiver session and throttles its React snapshot to approximately
one second unless selected state fields change. Its accepted update returns:

```js
return { ...next, values: undefined };
```

`src/motion/session.js` around line 43 supplies receiver `peer.sample()` as values.
`MotionPanel` receives the stripped App snapshot and passes `snapshot.values` to
`MotionReadings` in `src/motion/motion-ui.jsx`. This explains missing displayed
values even with current readiness. It does not prove the network drops samples,
nor establish that all downstream motion consumers are broken. Trace both paths.
Preserve bounded rendering: simply sending every sensor frame into root App state
could introduce a major performance regression. Prefer an existing focused
subscription/ref boundary, with expiry and cleanup, after inspecting ownership.

The status flicker is not yet diagnosed. Inspect `setupEvidence` and receiver
snapshot throttling: the recent fix retains only the active step index during
gaps, while completion checks still depend on current freshness. Separate the
history of completed user actions from current live health where appropriate.
Never make stale data look fresh, retain expired readings as live, equate an open
channel with receipt, or relax the 250 ms validity bound to hide a transport issue.
The deliberately pulsing active ring is unrelated to unwanted status toggling.

## Preserve the agreed behavior

- ZERO accepts any stable pose: flat, inclined, upright, portrait, landscape and
  inverted. It must not require vehicle-axis calibration or an upright holder.
- Placement confirmation, pose ZERO, explicit wake acquisition and reciprocal
  receipt are distinct. ZERO uses continuous fresh settling (currently 500 ms,
  bounded by 8 seconds). Permission, stale and recovery states remain truthful.
- Optional aligned car motion is default-off in details. Arbitrary phone pose
  provides relative magnitude and vertical rotation; gravity alone cannot infer
  the car's heading. GPS remains the vehicle-response fallback without alignment.
- Keep the approved wizard, compact drawer, 2.4-second active ring (static under
  reduced motion), and Tesla console-tray PNG. The clamp image remains available.
- Existing motion input filters and consumer-specific thresholds must be audited
  before adding another noise floor. Distinguish raw diagnostic data, visible
  readings and actual Engine/Flux/Aperture response. Measure stationary noise and
  verify meaningful small motions/sign/latency; do not guess from the anecdote.

See [phone input contract](PHONE-ROAD-INPUT-2026-09-19.md),
[motion runtime](agent-guide/motion-runtime.md),
[phone interface](agent-guide/interface.md),
[reliability correction](RELIABILITY-CORRECTION-2026-09-20.md), and
[HTTPS transport evidence](PHONE-MOTION-HTTPS-2026-09-19.md).

## Required investigation and acceptance

1. Reproduce missing values in the real compiled App through the real receiver
   session/protocol boundary, not only `qa/phone-onboarding.html`. Add a regression
   that fails before the fix and proves changing valid inputs change actual drawer
   numbers, with correct units and expiry. Trace any bypass used by road consumers.
2. Diagnose the blinking using timed evidence: sender status/sample production,
   relay/channel delivery, accepted sequence/generation, receipts, snapshot updates
   and UI rendering. Preserve monotonic clocks and coordinate-free diagnostics.
3. Repair state presentation so completed actions do not appear randomly undone;
   real loss of validity still shows an explicit current health/recovery state.
   Both screens must agree on readiness only with accepted fresh referenced data.
4. Exercise ZERO in arbitrary poses, re-ZERO/new generation, late receipts,
   hidden/offline/recovery, denied/released wake, STOP/new QR, drawer close/reopen
   and cleanup. Verify bounded root rendering and no unbounded retries/queues.
5. Investigate stationary sensitivity and implement justified bounded filtering
   where appropriate, with evidence for idle rejection and real movement response.
6. Run meaningful source/behavior checks plus required release gates. Verify the
   compiled real App, not just a fixture, at phone and receiver sizes/light/dark.
   Publish with the official preserve-existing workflow after green gates, then
   verify canonical identity, cache, hashes and product behavior.
7. Report implemented/tested/live separately from the owner's physical trial.
   Prepare a short repeatable two-device acceptance sequence. Do not declare the
   integration complete solely because a transport is connected or tests pass.

## Previous verification and the uncovered gap

The previous publication recorded 1,040 unique regression/package cases, 80 final
affected checks, 12 real-sensor-owner synthetic pose/polarity combinations, 30
synthetic UI checkpoints, six compiled-App checks, 834 production hashes, 17
canonical HTTPS checks and four public-browser checks. These are historical
results, not proof of the newly reported integration behavior.

The onboarding fixture supplies values directly, bypassing App's values stripping.
The six compiled-App checks cover phone entry and drawer gesture/focus/disclosure,
not changing real receiver readings. Public checks cover entry/copy/defaults.
Close this coverage gap explicitly; test counts must not substitute for exercising
the actual data path. Earlier one-minute HTTPS continuity trials reached only
110/120 and 111/120 LIVE observations; continuity remains an open issue.

## Local execution notes

- Product commands run from `prototype/drive-lab`; use current package scripts and
  native wrappers. Set `SEDICIVALVOLE_NO_LOCAL_ENV=1` for QA/builds.
- Previous verification-only native copy: `/private/tmp/sv-reliability-20260920`.
  Implementation remains in the saved repository. The copy was missing some docs
  and `qa-phone-drawer.mjs`; reconcile explicit non-secret tracked files before
  trusting it. Never bulk-copy local secret variants or private references.
- Host-local dependency cache was keyed by lock SHA-256
  `a44f544f69cc5a9466bbf543e7c258075790ef4f74c60f9cea2c34a5386504d7`.
  Recheck lock/host instead of reinstalling into Dropbox blindly.
- Python QA needed Python 3.11 rather than the system 3.9. A temporary shim exists
  at `/private/tmp/sv-phone-python/bin/python3`; recheck it before reuse.
- For builds in the QA copy, set `GIT_DIR` and `GIT_WORK_TREE` to the saved
  repository, preserving source identity. Commit product changes before the final
  build. Previous development ports were 5181/5182; both owned servers were stopped.
- Existing browser regression: `prototype/drive-lab/scripts/qa-phone-drawer.mjs`.
  Its prior Playwright module was in the host npm cache. Inspect the script and
  resolve available dependencies rather than assuming temporary paths persist.
- Ephemeral evidence: `/private/tmp/sv-zero-browser/checks.json`,
  `/private/tmp/sv-zero-compiled-browser.txt`, `/private/tmp/sv-zero-canonical.json`,
  `/private/tmp/sv-zero-public-browser.json`. These may disappear.
- A prior Git push hung enumerating a Dropbox-backed internal Codex ref. A bare
  transport-only repository at `/private/tmp/sv-phone-doc-delivery-208a61f.git`
  uses the saved repository object store and existing GitHub origin. It is not a
  worktree or implementation copy. If reused, verify identities, push a normal
  fast-forward, and update the saved remote tracking ref only after confirmed
  success. Do not delete or edit internal Codex refs, force-push or reset work.

The canonical publisher and its full gates are documented in
[Delivery](agent-guide/delivery.md) and [DEPLOY](DEPLOY.md). The standing owner
authorization covers this agreed repair; no repeated publication approval is
needed. Handoff preparation itself is documentation-only and leaves the public
build unchanged.
