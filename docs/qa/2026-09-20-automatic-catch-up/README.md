# Automatic diagnostics catch-up — adversarial verification, September 20

> Follow-up correction: this is historical evidence for the earlier checkpoint.
> Python 3.11.16 is installed; the failing test selected the default Python 3.9.6.
> The mailbox findings have since been independently verified. Optimistic flush reset is
> superseded by confirmed delivery and server receipts. See the
> [September 20 reliability correction](../../RELIABILITY-CORRECTION-2026-09-20.md).

Verification pass over the September 20 commit `7fec6ff` (catch-up on wake, reload-surviving
progress counters, close-time keepalive flush). The brief was to break the work, not continue it:
[verification handoff](../../AUTOMATIC-DIAGNOSTICS-HANDOFF-2026-09-20.md),
[contract](../../AUTOMATIC-DIAGNOSTICS-2026-09-07.md#september-20-catch-up-persistence-and-close-time-flush).

No real mail was sent. No synthetic packet reached any server.

## Defects found, reproduced and fixed

Each was reproduced with a failing test before the fix.

1. **`deliveryReason` escaped validation on manual packets.** `validDiagnosticDelivery` returned
   early for `trigger: 'manual'` *before* the reason whitelist, and `buildDiagnosticMail` copies the
   reason verbatim into the mail summary as a `Reason:` line. A manual packet carrying
   `"burst\r\nPrivacy: coordinates were collected and stored."` was accepted and produced a forged
   `Privacy:` line beside the real one in the diagnostic mail. Legitimate manual packets never carry a
   string reason, so the whitelist now runs for every trigger, ahead of the manual shortcut.
   Tests: `a manual packet cannot smuggle free text into the mail through deliveryReason`,
   `the mail summary keeps exactly one Reason line and no injected lines`.

2. **RESET SAVED STATE did not reset the clock.** The button lives in the diagnostic drawer, which is
   reachable while the session is running. The commit removed the `localStorage` key directly, but the
   running clock kept its in-memory counters and rewrote the same record at the next persist, five
   seconds later — so neither the stored progress nor the cadence was actually reset. The clock now
   exposes `forget()` (clears the record, drops unsent progress, restarts the wall anchor) and
   `resetSavedState` calls it. Tests: `RESET SAVED STATE forgets the persisted clock instead of
   rewriting it seconds later`, `the reset control clears the clock through the clock, not only
   through storage`.

## Investigation claims: what was re-measured and what was not

- **Measured.** The reason the full suite could not run in the shared Dropbox checkout: `npm test`
  stops at `test:engine-road` with `Cannot find package 'esbuild'`, because the ignored `node_modules`
  symlink points at the Apple-silicon cache. In the isolated Intel copy the same two files pass 15/15.
  The shared symlink was not repointed or recreated.
- **Not re-measured.** The September 19 mailbox findings (five manual diagnostics, last automatic mail
  September 12, the decoded 9.8 / 1.9 / 5.6 active-minute sessions and the silent 32-minute
  suspension). Mailbox access was refused in this session, so those remain the previous session's
  claims. They are consistent with the code but were not independently confirmed here.
- **Still inference, not proof.** That the Tesla freezes pages when the browser leaves the foreground
  or after a media pause. The freeze was measured; its cause was not. Whether the Tesla ever emits
  `visibilitychange`, `pagehide` or `freeze` is unknown — the decoded evidence says it did not during
  the 32-minute suspension, so the flush stays best-effort and catch-up is the dependable path.

## Adversarial review: what held

Probed directly against the clock, with results recorded rather than assumed.

- Wall clock moving **backwards** mid-session collapses `wallElapsed` to 0 and sends nothing; no storm.
- A restore whose `savedWall` lies in the **future** is discarded (`away < 0`); counters stay at zero.
- Corrupt or foreign stored records (`v: 2`, non-JSON, string counters) are rejected and the session
  starts clean.
- A **permanently rejected** report (422, non-retryable) sends once and then waits for a fresh period:
  1 send in the following 600 s. A **retryable** 429 gives 3 bounded retries (30 / 60 / 120 s) and then
  restarts the period — roughly 4 attempts per 900 s, not a storm. This retry behaviour predates the
  commit and is unchanged.
- **Restored counters alone never send.** A clock restored at 880 s of saved progress first sends at
  exactly 60 s of the new page's own activity, and `canFlush` stays false until the new page holds its
  own two minutes.
- **Two tabs** sharing `localStorage` resolve last-writer-wins; a third page restores one tab's
  progress, never the sum.
- `ownMs` is zeroed on every path that zeroes `activeMs` (disabled, accepted, failed, flushed, and the
  new `forget`).
- The `-auto` server floor is stamped only after `mail()` succeeds, so failed attempts never consume it;
  `validDiagnosticDelivery` and the coordinate check both run before either rate limit.

Two observations that are not defects and were left alone: `restored` stays true for the rest of the
clock's life once a restore happened, and `intervalDue()` implies `catchUpDue()`, which makes the
`&& input.visible` guard on the interval path reachable only when wall time is unavailable.

## Full native suite and production build

Run from an isolated copy on this Intel host, against a lockfile-keyed Intel dependency cache. See
[`native-suite.txt`](native-suite.txt) and [`build.txt`](build.txt).

- Suite: **1025 tests, 1024 pass, 1 fail**. The single failure is a host gate unrelated to the change —
  `scripts/deploy_drive_lab_ftp.py` refuses with `python_3_11_or_newer_is_required` before it evaluates
  the FTP port, because this Mac has only Python 3.9.6. Commit `7fec6ff` touches neither that script nor
  its test. The same host limit means canonical publication cannot run from this Mac.
- Build: both `vite build` passes, the protected inline LAB package and the Sites build all succeed, and
  release verification passes — **827 exact static hashes**, VERSION and HTML identity match.

## Browser end-to-end, delivery intercepted

The production build was served statically on loopback and driven in a real browser. The static host
serves `api/send-diagnostic.php` as text and never executes it, so no mail was possible even before
interception; `window.fetch` was additionally replaced with a recorder returning
`202 {ok:true,status:"accepted_by_mail_transport"}`. The server log shows **zero POST requests**.
Recorded packets: [`delivery-packets.json`](delivery-packets.json).

- **Persistence.** `sedicivalvole.diagnostic-clock.v1` appeared at the first tick after START and
  carried counters only (`activeMs`, `totalActiveMs`, `anchorWall`, `savedWall`) — never a report.
- **Catch-up after a silent freeze.** With 167 s of active time, shifting both `Date.now` and
  `performance.now` forward 20 minutes produced exactly one request: `deliveryReason: "catch-up"`,
  `keepalive: false`, `activeMs` 179 204, `wallElapsedMs` 1 409 000, `unobservedMs` 1 229 797.
- **Restore across a reload.** The stored record survived a full page reload; after START the clock
  resumed at exactly its pre-reload `activeMs` (68 000.09 ms) with `anchorWall` intact, sent nothing
  until the new page held its own minute, and the next catch-up carried `restored: true`.
- **Close-time flush.** After 135 s of fresh active time and a six-minute wall shift, dispatching
  `pagehide` twice plus `freeze` produced exactly **one** request — the re-arm guard works —
  with `keepalive: true`, `deliveryReason: "hide-flush"`, 43 625 bytes, `activeMs` 155 000,
  `wallElapsedMs` 515 904. `completeFlush()` cleared the stored record, as designed.
- **Server acceptance.** Both recorded bodies pass `validDiagnosticDelivery` in real PHP, are
  coordinate-free under `containsForbiddenCoordinateKey`, draw the right floor (900 s / 300 s) and
  produce the correct `Delivery:` and `Reason:` mail lines.
- **Keepalive budget, measured.** The flush packet reports `requestBodyBytes` 43 604 while the body is
  actually 43 625 bytes — the 21-byte gap is the `transport.original*` and `compactClose` fields
  written after measurement. Against the 64 KiB browser cap the 60 000-byte limit leaves 5 536 bytes of
  margin, so the gap is harmless. It was confirmed, not assumed.
- **Disclosure copy.** The three updated texts, the clock key, `forget()` and `compactClose` are all
  present in the shipped production bundle.

Environment limits of this browser check: service-worker registration does not run in the automation
pane (zero registrations, two console errors about fetching the script), and wall-clock travel was
simulated by replacing `Date.now` and `performance.now`. Neither touches the diagnostic clock's logic.

## Still open

Publication, the first real inbox receipt of a `catch-up` or `hide-flush` mail, and physical Tesla
acceptance. Nothing here proves inbox delivery; server acceptance is not receipt.
