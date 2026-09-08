# Automatic development diagnostics

Current contract: the September 8 active-session correction at the end of this
document supersedes the historical driving-only implementation below.


## Owner decision

2026-09-07 evening: implement now, Dev with automatic delivery ON by default,
and publish for the next drive. This supersedes the earlier future-only Dev
plan and proposed Standard default. The interval is fifteen minutes of driving,
matching the owner's current road-feedback request instead of the old ten-minute
plan. A saved OFF or Standard choice remains respected. Reset Saved State returns
to the disclosed development defaults.

## Behaviour and privacy

- The first Intro screen exposes DEV / AUTO REPORT ON and a toggle. Session
  report exposes Standard / Dev and AUTO SEND ON/OFF. OFF is persisted locally.
- Only observed GPS movement >=1 km/h with a received speed sample <=3 seconds
  old and accuracy <=250 m advances the fifteen-minute clock. Demo, stops and
  unknown speed do not count. Only adjacent visible observations <=5 seconds
  apart count; background/minimized gaps are recorded as unobserved, not driving.
- Offline driving can accrue a due packet. One pending packet can send on online
  or foreground recovery, even if the vehicle is then stopped. Never replay a
  backlog. Reload starts a new in-memory driving clock; preferences persist.
- Existing bounded full session reports remain in both levels. Standard changes
  delivery to manual-only; no reduced collector cost is claimed. Packets reuse
  the existing fitting, gzip mail attachment, coordinate rejection and fixed
  recipient. No recipient or route is introduced into preferences.
- One shared synchronous transfer lock covers manual and automatic sends.
  Requests time out after 25 seconds. Automatic failures retry after 30, 60 and
  120 seconds, then wait for the next driving period. Permanent HTTP rejection
  ends that cycle. OFF aborts an active automatic request where possible; it
  cannot recall a packet already accepted by the server.
- Wire reports identify manual/automatic trigger, mode, automatic setting,
  observed driving and unobserved milliseconds, attempts and accepted count.
  Privacy flags reflect the active setting. The endpoint validates automatic
  mode/flags/900000 ms interval and driving evidence before recipient access.
- Existing per-client 20-second rate protection remains. Successful automatic
  packets also have a fifteen-minute per-client-IP server floor, with only a
  timestamp retained. Failed mail attempts do not consume that successful-send
  floor. Server acceptance is not proof of inbox delivery.

## Verification

Unit tests exercise default/saved settings, observed driving versus stops/gaps,
no overlap, online catch-up, OFF and bounded retry. Actual PHP tests validate
Dev/automatic fields and reject Standard, short intervals and inconsistent flags.
An isolated Chrome fixture advances the receiver clock through fifteen minutes,
intercepts every HTTP request, simulates a 503 then 202, and verifies exactly two
attempts, no backlog, OFF suppression and OFF persistence. No synthetic diagnostic
is sent to the real mailbox. Screenshots use 773×601 and 390×844. Vehicle receipt
will be verified separately from a real drive.


## Canonical activation — 2026-09-07 20:13

Live **build 20260907-2004**, source **b27975d**, VERSION 0.0.0 unchanged.
Official publication and independent read-only postflight pass: 218 files /
254,680,450 bytes, 29 Illobo full hashes and two retained cache-overlap assets.
All 25 canonical HTML/asset/cache checks, 669 native tests and 18 compiled-package
checks pass. Dev/AUTO ON, fifteen observed driving minutes, one retry after a
503, accepted completion, OFF suppression and saved OFF pass in the live browser
with intercepted requests. Viewports: 773×601, 390×844 and 773×440. No page
exceptions or synthetic mail. Live PHP rejects Standard automatic delivery
and forbidden coordinate keys with HTTP 422 before mail; this verifies the
new server path without dispatching an artificial packet.

Fresh launches show DEV / AUTO REPORT ON; previously saved OFF/Standard remains
respected. Reload is required for an already-open older build. A real fifteen-
minute driving packet and inbox receipt remain vehicle acceptance, not simulated
QA evidence. Local evidence: `/tmp/sv-auto-qa.json`, `/tmp/sv-auto-canonical/identity.json`,
`/tmp/sv-auto-{tests,package,build,preflight,publish,postflight}.log` and
`/tmp/sv-auto-{intro,off,mobile,short}.png`.

## Active-session clock — owner correction, 2026-09-08

This supersedes the September 7 driving-only trigger: count fifteen minutes of
observable active session time, including stops, absent GPS, simulated input and
offline operation. Keep Dev/AUTO ON defaults and saved OFF/Standard. Hidden time
and execution gaps over five seconds remain unobserved; reload starts a fresh
session clock. At most one due report waits in memory for online/foreground
recovery; construct a fresh bounded coordinate-free snapshot when sending.
There is no persistent outbox or background execution promise.

Use `timeBasis: active-visible-session`, `intervalActiveMs`, `activeMs` and
`totalActiveMs` in new diagnostic delivery metadata. The server validates the new
clock explicitly and still accepts the older driving clock for already-open
clients. Preserve the fifteen-minute server floor and bounded transport retries.
Log `diagnostic-send.due` at the threshold, including offline state, then
`requested`, `accepted` or `failed` with automatic/manual attribution. Acceptance
means server mail-transport acceptance, not verified inbox delivery.

### September 8 active-session release evidence

Published build **20260908-2008**, source **e249423**. All 801 native tests and
196 exact dependency credits pass. Actual Chrome (Browser plugin unavailable;
regular Playwright fallback), local source, compiled and canonical app at
773 x 601 / 844 x 390 verifies: no GPS fix, fifteen offline active minutes with
zero requests, exactly one due event, reconnect, simulated 503 then bounded
retry/202, manual request and seven correctly attributed log events. No page
exceptions or horizontal document overflow; real mail requests are intercepted.
The generated active-clock packet passes PHP delivery/coordinate validation and
mail packaging without transmission.

Official publication verifies 232 files / 254,891,091 bytes, 29 unchanged Illobo
tracks by full hash, and one retained cache-overlap asset. Seventeen independent
canonical HTTPS checks verify bare/cache-busted root HTML, all 14 fingerprinted
JS/CSS assets, build/source identity and protected LAB. HTML remains no-store.
Physical Tesla acceptance and first real automatic inbox receipt remain open.

Independent official postflight passes with 12 canonical root entries and
`remote_writes=NONE`. Eight final documentation consistency checks pass.
