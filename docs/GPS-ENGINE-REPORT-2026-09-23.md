# GPS, muted Engine and passenger remote — September 23, 2026

## New drive evidence

The owner's two additional coordinate-free mailbox attachments were checked
against the compressed and JSON SHA-256 values in their messages. Both use
build `20260922-0953.d6348cd`. Raw attachments remain outside Git. These are
two separate short sessions, not an extension of the September 22 drive.

| Mail and report | GPS evidence | Phone/transport evidence | App outcome |
| --- | --- | --- | --- |
| 07:44 UTC catch-up, generated 07:43:49 UTC | `live`; 683/683 numeric speed samples, median accuracy 4.2 m, report speed 43.1 km/h from GPS. First GPS sample arrived before phone pairing started. | 62.308 s observed, 24.960 s HTTPS connected, 1.507 s fresh, 0.766 s confirmed, 0 road-eligible; direct upgrade timed out. | Engine audio was muted/idle, and its audio snapshot said `motion: lost`. The running speed readout and Engine speed card used that audio snapshot to hide a valid GPS value. This display diagnosis follows from the source at `d6348cd`; the mail cannot prove what the driver saw on screen. |
| 07:47 UTC manual, generated 07:47:15 UTC | `live`; 940/940 numeric speed samples, median accuracy 3 m, latest raw speed about 24 km/h. | 105.400 s observed, 92.665 s HTTPS connected, 4.809 s fresh, 4.737 s road-eligible; all three direct upgrades timed out. No active consumer used phone road input while Engine was muted. | At 07:45:27 UTC a trusted touch activated `Speed source GPS. Tap to switch`; the next event set `source: DEMO`. The report then shows Demo speed 0 despite live GPS. |

Both reports therefore show a functioning browser geolocation watch. The
missing GPS presentation has two concrete causes: a speed display coupled to
muted Engine audio state, and an easy-to-hit source toggle on speed numerals.
Neither is evidence that pairing disables GPS. Reception in other conditions
still needs separate real-car evidence.

## Focused repair

Source checkpoint `fd3d148` uses the GPS receiver's own accepted/fresh/degraded
motion evidence for both speed displays and Engine speed animation. Engine
audio state continues to govern only its acoustic and gear indications. The
speed numerals are read-only; Demo/GPS selection remains an explicit report
action. The compact topbar adds `SIM` when Demo owns speed. A missing or lost GPS
speed still displays a dash, never a fabricated zero.

The complete native test suite and production package passed. A local development
browser with synthetic 43 km/h GPS and muted Engine displayed 43 in both
readouts with `GPS SPEED` and `AUDIO PAUSED`; tapping either readout did not
change source. The explicit report buttons switched to Demo and back to GPS.
There were no page exceptions or diagnostic sends. This is software evidence,
not a physical Tesla/iPhone trial.

## Canonical publication

Build `20260923-1008.fd3d148` is published at
`https://sedicivalvole.app/`. Official preflight and postflight both verified
network, login, canonical directory and root identity with no remote writes.
The preserve-existing publisher uploaded 38 files / 6,534,771 bytes, verified
or reused 832 static files and all 29 Illobo recordings, retained two prior
assets for cache overlap and activated the dynamic root.

Real Chrome requests to the bare root, cache-busted root and explicit reload
all returned HTTP 200 with `no-store, no-cache`, proxy `MISS`, the exact build
marker and the same local/live 1,445-byte SHA-256
`07d1c853fe4b6e227e01174f1c343e6f5c92cf071504617568db46231127ddff`.
The referenced main JavaScript, CSS and lazy phone chunk matched local bytes
and hashes. Canonical Chrome with synthetic 43 km/h geolocation and muted Engine
displayed `43` in both speed locations and `GPS SPEED` in the instrument, with
zero page exceptions. No synthetic diagnostic was sent. Physical Tesla/iPhone
presentation and real reception remain open.

## Recommended next product milestone

The owner proposes retiring vehicle response driven by phone accelerometer and
gyroscope, including Engine demand, Flux braking and Aperture curve, and using
the QR connection for a portrait passenger remote. This is a promising
direction, pending selection of one of two visual concepts under the project
design gate. The measured phone road-eligible fractions remain too low for a
dependable continuously coupled effect in the available drives; GPS has remained
independent. GPS-derived speed change can drive bounded acceleration/braking
response; turn curvature cannot be promised from speed alone and needs a
separately qualified GPS heading/position signal or a speed-only Aperture mode.

The current QR code grants one admission to an expiring, at most one-hour
motion session. The HTTPS relay carries encrypted, latest-only samples; the
optional direct path repeatedly timed out in these two sessions. Neither
existing one-use admission nor latest-only semantics is a durable command
channel. Reuse the cryptographic admission and same-origin transport mechanics,
then create a separate allowlisted command protocol with command ID, bounded
retry, receiver acknowledgement, applied-state feedback, replay protection and
reconnect state. Initially pair one phone per drive. Remembering a phone across
future drives requires an explicit persistent trust and revocation design;
do not imply that a scan today gives permanent control. Commands can tolerate
more delay than road samples but still require a live route between devices.

Keep the current receiver and phone UI until the selected remote replaces it.
The implementation order after selection is: remove all phone road consumers
and sensor onboarding/diagnostics, retain GPS/Demo ownership, implement the
command channel and receiver actions, implement the chosen portrait remote,
then verify real iPhone/Tesla connection, music, visuals and reconnect behavior.
Do not present visual concepts as an implemented companion.

## Later drive: 08:40–08:56 UTC

Four more coordinate-free diagnostic mails arrived from the released
`20260923-1008.fd3d148` build. Their gzip and JSON SHA-256 values matched the
mail bodies. The reports at 08:40 (automatic catch-up), 08:51 (manual), 08:55
(automatic interval) and 08:56 (manual) are cumulative snapshots of **one**
session, not four independent trials. The last report was generated at
08:56:12 UTC; its gzip SHA-256 is
`a51b990f4f40473b1e1b3fb05320ef4a532c2cd258549f62118ed6e2cb3f7309`.
Raw attachments remain outside Git.

| Last cumulative report | Observed | HTTPS connected | Phone fresh | Road eligible | GPS numeric samples |
| --- | ---: | ---: | ---: | ---: | ---: |
| 08:51 UTC | 676.010 s | 642.054 s | 53.385 s (7.9%) | 37.160 s (5.5%) | 7,062 / 7,062 |
| 08:55 UTC | 941.909 s | 907.953 s | 62.928 s (6.7%) | 40.697 s (4.3%) | 9,807 / 9,807 |
| 08:56 UTC | 996.367 s | 962.411 s (96.6%) | 64.174 s (6.4%) | 41.943 s (4.2%) | 10,220 / 10,220 |

The final snapshot happened to say `dataFresh: true`. It describes that
instant, while the cumulative coverage captures how rarely the 250 ms
freshness requirement was met. The full event recorder counted 315 `stale`
and 315 `recovered` transitions. The phone reported 57,372 motion events,
57,379 orientation events, no missing axes and no visibility stops, so the
recorded bottleneck is delivery/age of the samples at the receiver, not an
observed absence of sensor events. The HTTPS protocol recorded 4,150 expired
poll requests, 1,199 latency drops and 1,652 rejected packets. No direct
transport time was recorded; 19 of 23 upgrade attempts had failed by the
final snapshot, and the remainder were not confirmed as recovered.

Browser network hints changed between `4g`, `slow-2g` and `3g`, with some
reported RTT hints up to 3,000 ms; these are hints rather than a measured
cellular signal or proof of a single root cause. During the same journey the
app stayed on the GPS speed source, and its geolocation telemetry reported
10,220 numeric speed samples. This supports the GPS-only product direction
for continuous road response. It does not establish that GPS is perfect in
every location or that speed alone provides a turn signal. Keeping the phone
for lower-frequency passenger commands remains a design proposal until its
separate acknowledged command channel and real-device acceptance exist.
