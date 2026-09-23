# Phone road input and automatic-report receipts — September 23, 2026

## Scope and evidence

This is a read-only review of the owner's personal diagnostic mailbox and the
current source. It changes no product behavior. The mailbox contains 30
Sedicivalvole messages from September 19–23: 12 interval, 11 catch-up, one
hide-flush and six manual deliveries. Six complete gzip attachments were
decompressed locally and their compressed and JSON SHA-256 digests matched the
respective message bodies. Raw attachments remain outside Git. Mail receipt
proves delivery to this inbox; it does not by itself prove sensor accuracy or
continuous audio/visual behavior in the Tesla.

| Evidence | Verified observation | Limit |
| --- | --- | --- |
| September 21 hide-flush, build `20260920-2231.b696bc4` | A real automatic mail arrived with `deliveryReason: hide-flush`, `restored: true`, 688 s active against the 900 s interval, and a valid complete attachment. | One receipt proves that path occurred once, not that every browser suspension emits a lifecycle event. The snapshot's `flushes: 0` and `status: sending` precede final mail acceptance. |
| September 21–23 catch-up | Real automatic catch-up mail arrived on both the older and September 22 builds, including restored sessions. | Repeated reports may overlap the same underlying session; count unique observed behavior, not emails, as independent drives. |
| September 22 manual and catch-up, build `20260920-2231.b696bc4` | Phone motion and orientation events were present with zero missing axes in the available receiver summaries. The road input remained `not-selected` throughout the observed history. | These reports cannot judge aligned car motion because that option was off. |
| September 22 catch-up, build `20260922-0953.d6348cd` | Mounted car motion was selected. The lifetime coverage measured 625.472 s of observable intervals, 615.398 s connected, 47.223 s fresh, 38.787 s mutually confirmed and 20.018 s road eligible. The report recorded 36,526 motion events, 36,532 orientation events and zero missing axes near session end. | Fresh time is 7.5% and road-eligible time 3.2% of observed time. These are separate gates; sensor event counts alone cannot prove usable car input. |
| September 23 catch-up, same build | The same session's phone coverage counters did not increase materially; the pairing had expired (`410`). | This is a later report from a carried-over session, not a second independent successful road trial. |

The September 22 report's bounded 300-entry receiver history contains 66
connected direct snapshots and 227 connected HTTPS snapshots. Fresh values occur
in 38 direct and 48 HTTPS snapshots; median conservative sample age in those
snapshots is approximately 231 ms direct and 1,119 ms HTTPS. This is a recent
history sample, not a time-weighted lifetime comparison. The direct path appeared
for 138.489 s of connected observed time; HTTPS for 476.909 s. Twelve retained
upgrade events include repeated `timeout` backoffs after direct activity. The
report does not isolate whether the failing hop is cellular coverage, browser
scheduling, ICE traversal, server response, or a combination.

The road state later shows `needs-zero` and unsuccessful settling with
`tareReason: acceleration`; its tare count stays at four. The report does not
identify the precise event that first invalidated the reference. In source,
`createPhoneSensors` clears the pose reference after a local sensor gap over
250 ms, an incomplete/stale reading at summary time, or a changed placement.
A failed mounted-reading check clears the separate road basis. A fresh stream
arriving afterward cannot silently restore either invalidated reference.
This is a plausible contributor to the owner's
intermittent experience, separate from transport latency; it needs a controlled
reproduction before changing calibration safety behavior.

GPS speed is a distinct input. The recent September 22 road reports include
numeric speed samples and median reported accuracy near 2 m; the later
September 23 report ends with an unavailable accuracy sentinel despite a better
session median. This supports the owner's provisional assessment that GPS often
works, while leaving continuity and real road accuracy for their next trial.

## Decision for the next implementation milestone

Prioritize a measured motion-reliability milestone before adding another
effect. Keep GPS as speed authority and the current 250 ms rule for *using*
remote motion. Test whether a short local sensor scheduling gap can retain a
stationary, unchanged mount calibration while still withholding all stale
samples. Independently compare direct and HTTPS on the same iPhone/Tesla pair,
first on shared Wi-Fi and then across separate networks. Record time-weighted
fresh, confirmed and road-eligible coverage plus the exact cause of each ZERO
invalidation. A change is acceptable only if it improves coverage without
replaying old motion or automatically adopting a changed physical mount.

The existing public STUN discovery can find some direct paths; it cannot
guarantee connectivity across restrictive networks. A TURN relay is a separate
service and cost decision, to be evaluated only after the cross-network
measurement. See [ICE](https://www.rfc-editor.org/rfc/rfc8445.html) and
[TURN](https://www.rfc-editor.org/rfc/rfc8656.html). The browser motion APIs
also retain secure-context and permission requirements; see the
[W3C Device Orientation and Motion specification](https://www.w3.org/TR/orientation-event/).

## Other open milestones

| Work | Current state | Next useful action |
| --- | --- | --- |
| Automatic diagnostics catch-up and hide-flush | Real inbox receipt, complete attachment integrity and reason fields now verified. | Keep longer Tesla lifecycle/endurance acceptance separate; no product change or redeploy follows from this evidence review. |
| Phone/Tesla road input, `N03/N04` | Implemented and published, but physical freshness, calibration retention and cross-network continuity are not accepted. | Run the measured comparison above; review an explicit calibration-policy change after its cause is reproduced. |
| Soundtrack `S04 / R7-14 / R10C-03` | Software recovery and browser gates shipped; physical weak-network and native transport listening remain open. | During the next vehicle drive, note audible gaps and native Play/Pause/Next behavior, then compare the corresponding diagnostic. |
| Sustained Air Atlas/Fly With and `P05` | Browser checks exist; continuous Tesla visibility, GPU/thermal and iPhone Safari acceptance remain open. | Use a sustained visible session and device observations, separate from sensor debugging. |
| Formal security `R06` | Historical scan lacks its artifacts and remains incomplete. | Recover its evidence or make an explicit replacement decision; do not label dependency audit as that scan. |
| Conditions `N02` and production row 17 | Conditions was deferred by the owner; production SemVer is a separate owner decision. | Do not reactivate either from this log review. |
