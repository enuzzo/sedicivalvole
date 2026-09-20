# Automatic diagnostics catch-up — verification handoff, September 20, 2026

**Status: implemented and committed locally, NOT pushed, NOT built, NOT published.**
Focused tests pass (27/27 across the clock and endpoint suites). The full native suite,
a production build and a real-browser end-to-end check were **not** run in the session
that wrote this (see [Why the full suite did not run](#why-the-full-suite-did-not-run)).
This document is a brief for a fresh session, whose job is to **challenge** the work,
fix what is wrong, and only then push. Treat every claim below as something to re-check,
not as proof.

## Prompt for the verifying session

> Read `AGENTS.md` and `prototype/drive-lab/AGENTS.md`, then this handoff. You are not
> continuing the work; you are trying to break it. Reproduce the investigation
> conclusions from the evidence described, review the diff commit by commit against
> the [review checklist](#adversarial-review-checklist), run the full native suite and a
> real production build from an isolated copy, drive the built app in a browser with
> the delivery request intercepted, and report each check as pass/fail with evidence.
> Fix defects test-first. If everything holds: append the final commit hash to the
> CHANGELOG entry, commit, and push. Talk to the owner in Italian; write code, commits
> and documentation in English. Keep implemented, tested, pushed, published and
> physically accepted as separate statements.

## Owner request and decisions

Owner (Italian), September 20: after several hours of driving on September 19 no
automatic diagnostic and no statistics arrived by email. They asked why, and asked to
check the mailbox (Gmail label `Sedicivalvole`). After the findings below they approved:

1. catch-up sending when the page wakes from a freeze;
2. persisting the clock across reloads;
3. sending even when the app is "closed" — for example engaging reverse gear
   switches the car to the camera and the app disappears; the report must still arrive;
4. "In Dev, the more data we capture the better";
5. **no automatic Travel Report** — only the technical diagnostic.

The interval was **not** changed (still 15 active minutes) and no new recipient exists.
The existing owner-authorized destination is unchanged; its address lives only in
ignored local configuration and must not be copied into documentation, logs or commits.

## Investigation evidence (September 19 sessions)

Method: mailbox search, then the raw MIME of each diagnostic mail was fetched with the
Gmail connector (`get_message` with `messageFormat: RAW`; large results are saved to a
file), base64url-decoded, the `.json.gz` attachment extracted and gunzipped:

```python
import json, base64, email, gzip, sys
from email import policy
src, out = sys.argv[1], sys.argv[2]
d = json.load(open(src))
raw = base64.urlsafe_b64decode(d['raw'] + '=' * (-len(d['raw']) % 4))
msg = email.message_from_bytes(raw, policy=policy.default)
for part in msg.walk():
    if part.get_filename():
        open(out, 'wb').write(gzip.decompress(part.get_payload(decode=True)))
```

Findings (all UTC):

- Five diagnostics arrived on September 19 (07:58, 10:38, 11:06, 13:10, 15:42), every one
  `Delivery: manual / dev`, i.e. sent with SEND DIAGNOSTIC. Two (10:38, 11:06) are in Trash.
  Nothing after 15:42. Nothing in Spam. The last **automatic** mail was September 12 09:02
  (also in Trash); earlier automatic mails arrived September 10 (two, 17 minutes apart),
  September 11 and 12. So the automatic path worked before.
- No Travel Report since September 11 and no verification-code mail on September 19.
  The Travel Report is requested by the user and needs email verification; it was never
  automatic. That explains the missing "statistics" and is by design.
- The three attachments decoded (10:38, 13:10, 15:42) come from the Tesla browser
  (Chromium 148, Linux x86, viewport 773 × 601, screen 1254 × 784, DPR 1.53, real GPS).
  None reached fifteen active minutes:

  | Mail | Session length | Active minutes counted | Notes |
  | --- | --- | --- | --- |
  | 10:38 | 42 min | 9.8 | 296 flight samples all `visible`; one 1,932 s gap |
  | 13:10 | 2 min | 1.9 | phone-motion pairing test, GPS accuracy 10 km |
  | 15:42 | 5.6 min | 5.6 | 5.7 km at up to 100 km/h |

- In the 10:38 session the last event before the gap is a Media Session `pause` at
  10:06:26; the next activity is 10:38:37 (viewport resize, stalled media). The report
  contains **no** `document.freeze`, `document.pagehide`, `document.resume` or
  `document.visibility` event although the app logs all of them. Conclusion: the Tesla
  suspended the page silently, without lifecycle events. An in-page timer cannot fire
  during that time and lifecycle handlers cannot be relied on. The 07:58 and 11:06
  attachments were **not** decoded.
- What is inference, not proof: that the Tesla freezes pages when the browser is not in
  the foreground or after a pause. The freeze itself is measured; its cause is not.
  The hours of driving the owner describes do not appear in any decoded report.

## What was implemented

Files (see `git show --stat HEAD`):

- `prototype/drive-lab/src/automatic-diagnostics.js` — the clock. New options
  (`storage`), `wallNow` input, wall anchor, catch-up, `isPending`, persistence
  (`persist`, key `sedicivalvole.diagnostic-clock.v1`), `canFlush` / `beginFlush(wallNow)` /
  `abortFlush` / `completeFlush`, snapshot fields `deliveryReason`, `wallElapsedMs`,
  `restored`, `flushes`, and `ownMs` gating (unsent activity observed by *this* page
  instance).
- `prototype/drive-lab/src/diagnostics-model.js` — `DIAGNOSTIC_KEEPALIVE_BODY_BYTES`
  (60,000) and `fitDiagnosticReportForKeepalive` (last 40 non-sample events, 4 runtime
  issues, 30 samples, then the existing fitting; returns `null` if it cannot fit).
- `prototype/drive-lab/src/App.jsx` — clock created with `localStorage`, `wallNow` in the
  tick, `isPending`-based due logging, `flushDiagnosticOnClose` plus a lifecycle effect
  (`visibilitychange`→hidden, `pagehide`, `freeze`; `pageshow`/`resume` re-arm),
  Reset Saved State removes the clock key, three disclosure texts updated.
- `prototype/drive-lab/public/api/send-diagnostic.php` — `deliveryReason` validation,
  `automaticFloorSeconds`, mail line `Reason: …`.
- Tests: `tests/automatic-diagnostics.test.mjs` (17 new) and
  `tests/diagnostic-endpoint.test.mjs` (4 new). Written first and watched failing.
- Docs: `docs/agent-guide/diagnostics-reports.md`, `docs/AUTOMATIC-DIAGNOSTICS-2026-09-07.md`
  (contract table + evidence), `README.md`, `CHANGELOG.md`, `docs/CURRENT-STATE.md`.

Contract summary (authoritative table: `docs/AUTOMATIC-DIAGNOSTICS-2026-09-07.md`):

| Reason | Sent when | Server proof | Floor |
| --- | --- | --- | --- |
| `interval` | 15 active minutes and 60 s of this page's own activity | `activeMs ≥ 900000` | 900 s |
| `catch-up` | ≥ 900 s wall since last accepted/anchor, ≥ 60 s unsent activity in this page, first tick that runs, hidden allowed | `activeMs ≥ 60000`, `wallElapsedMs ≥ 900000` (number) | 900 s |
| `hide-flush` | app hidden/closed, ≥ 120 s active and ≥ 300 s wall unsent, `keepalive` compact packet | `activeMs ≥ 120000`, `wallElapsedMs ≥ 300000` | 300 s |

A failed or permanently rejected send resets the wall anchor so a rejected report cannot
loop. A flush is optimistic: the request cannot report back, so the clock restarts at once.

## Verification already done (and its limits)

- `node --test tests/automatic-diagnostics.test.mjs tests/diagnostic-endpoint.test.mjs`
  from `prototype/drive-lab`: 27 pass, 0 fail (PHP `validDiagnosticDelivery`,
  `automaticFloorSeconds` and mail packaging are exercised through real `php`).
- `esbuild` (native binary) parses `App.jsx`, `automatic-diagnostics.js` and
  `diagnostics-model.js` without errors. That is syntax only.
- The pre-existing suites that could run passed before the last edits (eight groups of
  13/16/14/18/10/8/4/11 tests). Engine suites cannot run on this host (below).
- **Not verified:** the App wiring (hooks, effect, refs, `keepalive` request, disclosure
  text) has no unit test and was never executed; no build; no browser; no full suite;
  no physical Tesla; no real inbox receipt of a catch-up or flush mail.

## Why the full suite did not run

The session's host is an Intel Mac; `prototype/drive-lab/node_modules` is an ignored,
Dropbox-visible symlink to a cache that belongs to the Apple-silicon Mac and does not
exist here. Consequence: `engine-comparison` and `engine-road-gearing` fail with
`Cannot find package 'esbuild'` — the same on a clean `HEAD`. `npm run native:check`
only reports the native binaries. **Do not repoint or recreate that symlink**: it is
shared through Dropbox and the delivery docs warn that Dropbox already restored stale
dependency bytes twice.

A lockfile-keyed Intel cache exists at
`~/.cache/sedicivalvole/dependencies/darwin-x64/<first 16 hex of sha256(package-lock.json)>/node_modules`
(it matched the lockfile when checked). Isolated verification recipe:

```bash
S=<scratch dir>; mkdir -p $S/prototype
rsync -a --exclude node_modules prototype/drive-lab $S/prototype/
rsync -a docs README.md CHANGELOG.md VERSION $S/
ln -s ~/.cache/sedicivalvole/dependencies/darwin-x64/<hash>/node_modules $S/prototype/drive-lab/node_modules
cd $S/prototype/drive-lab && npm run test:native && npx vite build
```

Copying from the Dropbox checkout was very slow the first time (files hydrate on demand;
about 150 MB took over twenty minutes) — run it in the background. If the isolated copy
is impractical, ask the owner rather than touching the shared symlink.

## Adversarial review checklist

Try to falsify each; add a failing test before fixing anything.

1. **Clock arithmetic.** Wall vs monotonic time: device clock changes, `wallNow` going
   backwards, restore when `savedWall` is in the future (`away < 0` discards), two tabs
   sharing `localStorage` (last writer wins; is anything harmful?), `persist` throttle
   (5 s) versus the 12 h window, `unobservedMs += away` on restore.
2. **Catch-up gates.** Confirm `ownMs` resets on every path that zeroes `activeMs`
   (disabled, accepted, failed, flushed) and that a paused → re-enabled session cannot
   send an empty report. Can catch-up fire while a manual send is in flight, or twice?
3. **Flush payload.** `fitDiagnosticReportForKeepalive` overwrites `transport.original*`
   *after* measuring `requestBodyBytes`; the final size check therefore ignores those few
   bytes — confirm the margin (60,000 vs the 64 KiB `keepalive` cap, which also counts
   other in-flight keepalive requests). Build a realistic report (the decoded reports had
   37–52 KB without events/samples: `audio` 11 KB, `performance` up to 19 KB,
   `phoneMotion` up to 19 KB) and confirm it fits or returns `null` cleanly.
4. **Privacy.** The compact and normal packets must stay coordinate-free
   (`containsForbiddenCoordinateKey`); `deliveryReason`, `wallElapsedMs`, `restored`,
   `flushes` carry no location. The stored clock holds counters only.
5. **Server.** Order of checks in `validDiagnosticDelivery` (manual returns before the
   reason check), `is_int`/`is_float` versus numeric strings, the shared 20 s limiter and
   the `-auto` floor file (a flush also stamps it; is the 900 s catch-up floor after a
   flush what you want?), failed mail attempts not consuming the floor.
6. **Lifecycle.** The effect depends on `[phase]` and reads refs; `handled` is re-armed by
   `pageshow`/`resume`/visible. Does a `visibilitychange`→hidden immediately followed by
   `pagehide` send once? Does the flush respect Standard/OFF and offline?
7. **Disclosure vs behaviour.** The three UI texts (Support, Session report, Submit
   evidence) must match what the code does; README and the contract table must match too
   (the table row for `catch-up` in the AUTOMATIC doc says "this page").
8. **Rejected-report loop.** Force `422`/`429` and confirm no send storm (bounded retries,
   anchor reset on give-up, retries after `retryAt`).
9. **Unknowns to resolve honestly.** Whether the Tesla ever fires `visibilitychange`,
   `pagehide` or `freeze` — the evidence says it did not during the 32-minute freeze.
   Report `flush` as best-effort until a real report shows `reason: hide-flush`.

## Browser end-to-end recipe (no real mail)

Real mail must never be sent (see `AGENTS.md`). Serve the production build, open it in
the browser pane, press START, then in the page console: replace `window.fetch` with a
recorder that returns `202 {ok:true,status:"accepted_by_mail_transport"}` for
`/api/send-diagnostic.php` and records `init.keepalive` and the body; wait about 65 s of
real running time; shift `Date.now` forward 20 minutes (and `performance.now` forward,
to imitate a freeze) and confirm one recorded request with
`diagnosticDelivery.deliveryReason === "catch-up"`. Then, after more than two active
minutes and a wall shift of six minutes, dispatch `pagehide` and confirm one request with
`keepalive: true`, `deliveryReason === "hide-flush"` and a body ≤ 60,000 bytes. Pipe each
recorded body through PHP to prove the endpoint would accept it:

```bash
php -r "define('SEDICIVALVOLE_DIAGNOSTIC_LIBRARY_ONLY', true); require 'public/api/send-diagnostic.php'; \
\$p=json_decode(stream_get_contents(STDIN),true); echo validDiagnosticDelivery(\$p['report'])?'yes':'no';" < body.json
```

Also reload the page mid-run and confirm `restored: true` in the next snapshot.

## Remaining work and gates

1. Run the isolated full native suite and production build; record counts.
2. Browser end-to-end above; record the evidence under `docs/qa/` like the September 19
   automatic-report evidence.
3. Fix anything found; keep the CHANGELOG entry honest (it currently says
   `[checkpoint pending hash]` — replace with the real short hash when committing).
4. Push (the owner asked for commit and push after verification).
5. **Publication is a separate step.** Standing authorization for verified canonical
   deployment exists in `AGENTS.md`, but this handoff's request from the owner was
   verify, commit and push; state clearly whether you deployed. Deployment needs the
   official script (never read `.env`) and a working dependency tree; do not disturb the
   shared symlink.
6. After publication the owner should drive with the Tesla; then check the mailbox for
   the first automatic mail whose `Reason:` line and `diagnosticDelivery` fields
   (`deliveryReason`, `wallElapsedMs`, `unobservedMs`, `restored`, `flushes`) show which
   path fired. Physical Tesla acceptance and first real receipt are open.

## Hazards and boundaries to keep

- Never read, print or commit `.env` or the destination address; do not send synthetic
  packets to the real mailbox; intercept delivery in every test.
- Preserve the coordinate-free contract and the Travel Report boundary (manual only).
- One writer in the saved Dropbox checkout; no worktree; run
  `python3 scripts/check_public_hygiene.py` before committing (no local paths in docs).
