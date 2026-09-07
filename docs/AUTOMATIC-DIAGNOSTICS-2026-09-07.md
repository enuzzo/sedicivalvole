# Automatic development diagnostics

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
