# Automatic diagnostics — implementation and verification handoff, September 20, 2026

> September 20 follow-up: the owner authorized corrections and canonical publication.
> The earlier optimistic close-time reset is superseded by acknowledgement-based delivery
> and bounded acceptance receipts. See [reliability correction](RELIABILITY-CORRECTION-2026-09-20.md).
> Python 3.11.16 is installed on the Intel host; only the default `python3` selects 3.9.6.
> The previously failing port-redaction test passes with the 3.11 bin directory on PATH.
> The September 19 mailbox and three attachments have now been independently rechecked.

For the next session, whichever assistant picks this up. It covers two sessions: the one that
**implemented** the automatic-diagnostics catch-up work, and the one that **verified** it
adversarially, fixed two defects and recorded the evidence. It also documents the **isolated
verification environment** that had to be built to run the suite and the build at all, because this
repository cannot do either from its own checkout on the Intel Mac.

Status line, kept deliberately separate:
**implemented** yes · **tested** yes (1025 native cases, production build, browser end-to-end) ·
**pushed** yes · **published** no · **physically accepted on the Tesla** no ·
**first real automatic mail received** no.

## 1. What the first session implemented (commit `7fec6ff`)

The owner drove for hours on September 19 and received no automatic diagnostic and no statistics.
The investigation concluded the in-page fifteen-active-minute timer never fired: no session reached
fifteen active minutes, and one 42-minute session contained a silent 32-minute page suspension with
no `visibilitychange`, `pagehide`, `freeze` or `resume` event at all. The "missing statistics" were a
separate matter — the Travel Report is requested by the user and needs email verification, and was
never automatic.

The owner then approved: catch-up sending on wake, persistence across reloads, sending even when the
app is closed (reverse gear switches the car to the camera and the app disappears), more data while
in Dev, and **no** automatic Travel Report. The interval stayed at fifteen active minutes and no new
recipient exists.

Three delivery reasons now exist, each with its own client gate, server proof and server floor. The
authoritative table is in
[the contract](AUTOMATIC-DIAGNOSTICS-2026-09-07.md#september-20-catch-up-persistence-and-close-time-flush);
in short: `interval` (15 active minutes), `catch-up` (15 wall minutes holding at least a minute of
this page's own unsent activity, hidden allowed), `hide-flush` (a compact `keepalive` packet on
hide/pagehide/freeze with 2 active and 5 wall minutes unsent). Progress counters — never a report —
persist under `sedicivalvole.diagnostic-clock.v1` within a 12 h window. The endpoint validates each
reason with its own proof and names it in the mail as a `Reason:` line.

That session ran only the two focused suites (27/27). It did not run the full suite, a build or a
browser, and said so.

## 2. What the second session did

The brief was to break the work, not continue it. Full evidence:
[QA record](qa/2026-09-20-automatic-catch-up/README.md).

**Two defects found, each reproduced with a failing test before being fixed.**

1. `validDiagnosticDelivery` returned early for `trigger: 'manual'` **before** the `deliveryReason`
   whitelist, and the endpoint copies that reason verbatim into the mail summary. A manual packet
   carrying a reason with embedded CRLF produced a forged `Privacy: coordinates were collected and
   stored.` line beside the real one. The whitelist now runs for every trigger, ahead of the manual
   shortcut. Legitimate manual packets never carry a string reason, so nothing legitimate changed.
2. RESET SAVED STATE did not reset the clock. Its button sits in the diagnostic drawer, reachable
   while the session runs; removing the `localStorage` key was undone by the running clock at the next
   persist, five seconds later. The clock now exposes `forget()` and `resetSavedState` calls it.

**What held under attack** — backwards wall clock, a `savedWall` in the future, corrupt or foreign
stored records, rejected-report loops (422 and 429), restored counters trying to send on their own,
two tabs sharing storage, and the server's ordering of validation before both rate limits. Details
and numbers in the QA record.

**What could not be re-measured.** Mailbox access was refused in that session, so the September 19
findings about which mails arrived remain the first session's claims, not independently confirmed
facts. That whole paragraph in the QA record is worth reading before anyone treats the investigation
as settled.

## 3. The isolated verification environment

**Read this before running anything.** Neither the full suite nor a build works from the saved
Dropbox checkout on the Intel Mac, and the obvious fix is the one thing that must not be done.

### Why the checkout cannot run them

`prototype/drive-lab/node_modules` is an ignored symlink into a cache that belongs to the
Apple-silicon Mac and does not exist on the Intel host. `npm test` therefore stops early at
`test:engine-road` with `Cannot find package 'esbuild'`, and nothing after it runs.

**Do not repoint or recreate that symlink.** It is shared through Dropbox with the other Mac, and the
delivery documentation records that Dropbox has already restored stale dependency bytes twice. Build
the isolated copy instead.

### Building the copy

A lockfile-keyed Intel dependency cache lives at
`~/.cache/sedicivalvole/dependencies/darwin-x64/<first 16 hex of sha256(package-lock.json)>/node_modules`.
Verify its `package-lock.json` matches the checkout's before trusting it.

```bash
S=<scratch dir>
mkdir -p "$S/prototype"
rsync -a --exclude '.env*' --exclude '*recipient.local.php' --exclude node_modules --exclude .sample-analysis-venv --exclude .playwright-cli \
  <repo>/prototype/drive-lab "$S/prototype/"
rsync -a <repo>/docs <repo>/scripts <repo>/licenses <repo>/logo <repo>/diagnostics <repo>/tools "$S/"
cp <repo>/README.md <repo>/CHANGELOG.md <repo>/VERSION <repo>/AGENTS.md <repo>/LICENSE \
   <repo>/LICENSE-SCOPE.md <repo>/NOTICE <repo>/PIANO.md <repo>/THIRD_PARTY_NOTICES.md \
   <repo>/design-qa.md <repo>/.gitignore "$S/"
ln -sfn ~/.cache/sedicivalvole/dependencies/darwin-x64/<hash>/node_modules \
  "$S/prototype/drive-lab/node_modules"
```

Things that cost the previous session a lot of time, so they are written down:

- **Exclude `.sample-analysis-venv`.** It is a 216 MB Python virtualenv with tens of thousands of tiny
  files, irrelevant to the JS suite, and it dominates the copy.
- **Copy the repository root files and directories, not just `docs`.** `shadergradient-lab` reads
  `THIRD_PARTY_NOTICES.md`, `LICENSE-SCOPE.md` and `licenses/`; `sample-harmony-tool` reads
  `.gitignore`. Each missing one costs a full suite run to discover.
- **`_references/` is 2.3 GB and must not be copied.** `junction-voicing-selection` only calls
  `readdir` on it and never opens a file. For that read-only inventory, reference the
  existing private directory without copying bytes; do not manufacture empty stand-in assets.
- **rsync can wedge** against the Dropbox file provider while the source itself reads instantly. If
  throughput stalls with rsync idle and no file open, kill it and copy the remaining directories one
  at a time; they complete in seconds.
- **Run the build before the suite.** `sites-worker` and `build-identity` read `dist/`.
- Verify mirrored tracked-source hashes and the dependency lockfile before trusting a result;
  a matching file count alone is not source identity.

### Running it

```bash
cd "$S/prototype/drive-lab"
SEDICIVALVOLE_NO_LOCAL_ENV=1 GIT_DIR=<repo>/.git npm run build:native
PATH=/usr/local/opt/python@3.11/libexec/bin:$PATH npm run test:native
npm run test:sites          # the && chain does not reach it when an earlier group fails
```

`GIT_DIR` matters. The isolated tree deliberately has no `.git`, so `vite.config.mjs` falls back to a
commit of `unknown`, the release key becomes `<stamp>.unknown`, and `verify-session-release.mjs` fails
`BUILD_KEY` (`/^\d{8}-\d{4}\.[a-f0-9]{7,40}$/`) on a perfectly good build. Pointing `GIT_DIR` at the
checkout is read-only — the only git call in the whole build is `git rev-parse --short HEAD`.

The documented copy excluded private configuration in that session. Always exclude `.env*`
and recipient configuration explicitly, and set `SEDICIVALVOLE_NO_LOCAL_ENV=1`; do not rely on
a copy happening to contain no environment file.

### Results to expect on this host

- Suite: **1025 tests, 1024 pass, 1 fail.** The one failure is
  `deploy-audio-identity.test.mjs › an invalid configured FTP port never appears in deployment output`.
  `scripts/deploy_drive_lab_ftp.py` returns `configuration=FAIL reason=python_3_11_or_newer_is_required`
  before it ever evaluates the port, because its default `python3` selected Python 3.9.6. It is a host gate,
  unrelated to any diagnostics change. **Correction:** `python3.11` is available and satisfies the deploy requirement;
  the prior claim that this Mac cannot publish was incorrect.
- Build: both `vite build` passes, the inline LAB package, the Sites build, and
  `PASS release <stamp>.<commit>: 827 exact static hashes`.

### Browser end-to-end without sending mail

Serve `dist/client` statically on loopback and drive it. A static host serves
`api/send-diagnostic.php` as text and never executes it, so **no mail is possible even before
interception** — but intercept anyway. Replace `window.fetch` with a recorder that returns
`202 {ok:true,status:"accepted_by_mail_transport"}` for `send-diagnostic.php` and captures
`init.keepalive` and the body, and replace `Date.now` and `performance.now` with offset-adjustable
versions to simulate a freeze. Afterwards confirm the server log contains **zero POST requests**.

Two environment quirks. The clock only advances while `document.visibilityState` is `visible`, and an
automation pane that is not on screen reports `hidden`, so active time will not accumulate — take a
screenshot to front the pane, then use waits. And service-worker registration does not run in that
pane (two console errors about fetching the script, zero registrations); it is unrelated to
diagnostics.

To get recorded bodies out of the page and through real PHP, POST them from the page with
`XMLHttpRequest` — which the `fetch` patch does not touch — to a small local collector, then pipe each
file through `validDiagnosticDelivery` and `containsForbiddenCoordinateKey`.

The environment is disposable. Nothing in it is versioned and it can be rebuilt from this recipe.

## 4. Boundaries that applied and still apply

- Never read, print, diff or commit `.env` or the diagnostic destination address.
- Never send a synthetic packet to the real mailbox. Intercept delivery in every test.
- The diagnostic packet stays coordinate-free; the stored clock holds counters only.
- The Travel Report stays manual and verified; it is never automatic.
- One writer in the saved Dropbox checkout, and the shared `node_modules` symlink stays untouched.
- `python3 scripts/check_public_hygiene.py` before committing.

## 5. What is open

1. **Publication.** Standing authorization for verified canonical deployment exists in `AGENTS.md`,
   but the owner scoped this work to verify, commit and push, and explicitly asked not to publish in
   the verification session. Nothing has been deployed. When it is: the official gate, and not from a
   Mac with Python 3.9.
2. **First real receipt.** No `catch-up` or `hide-flush` mail has ever arrived in the real mailbox.
   Server acceptance is not inbox delivery, and nothing in the QA record proves receipt.
3. **Physical Tesla acceptance.** Unchanged and open. After publication the owner should drive, then
   the mailbox should be checked for the first automatic mail whose `Reason:` line and
   `deliveryReason`, `wallElapsedMs`, `unobservedMs`, `restored` and `flushes` fields show which path
   fired.
4. **The unresolved unknown.** Whether the Tesla ever emits `visibilitychange`, `pagehide` or `freeze`.
   The decoded evidence says it did not during the 32-minute suspension. Until a real report arrives
   with `reason: hide-flush`, the flush is best-effort and catch-up is the path to trust.
5. **Mailbox re-verification.** The September 19 investigation findings were not independently
   confirmed in the verification session. Anyone with mailbox access should re-check them before
   treating the diagnosis as closed.
