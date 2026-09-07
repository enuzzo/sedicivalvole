# Owner acceptance and next work — 2026-09-07

Source: direct owner follow-up to the diagnostic review. This supersedes the
earlier unanswered questionnaire where stated below, without inventing unreported
test results.

## Accepted and clarified

- Flux, Soundtrack, FX, interface and Discover are owner-accepted. Later small
  refinements remain possible; do not require another broad acceptance round.
- The owner travelled with the browser minimized while using Tesla navigation.
  This is consistent with the recorded gaps, not proof of the cause of every
  interval. Preserve observation gaps rather than counting them as slow frames
  or interpolated driving.
- Drivey's failed load was caused by missing network according to the owner.
  It did not retry. Transient load failures should recover automatically until
  success or for several minutes, using bounded backoff, no concurrent attempts,
  online/foreground recovery and cancellation when the user changes intent.
- Endurance is acceptable to the owner so far. This is subjective operational
  acceptance; the interrupted report is not a continuous multi-hour measurement.

## Ordered work

1. Fix measurement attribution/gaps and failed-load recovery; publish verified
   checkpoints under the existing deployment authorization.
2. Review and then incrementally integrate Engine. The owner is happy to try it
   after the fixes. Preserve the study's independent review/source admission
   workflow and shared audio/GPS ownership; no sealed archive is released by this
   general sequencing instruction.
3. Complete the iPhone surface after Engine.
4. Develop travel ATLAS and a separate full-screen statistics environment.
   ATLAS becomes an informative map; the owner delegates the information design
   and suggests precisely positioned Discover POIs. The separate visual expands
   and redesigns the current statistics sidebar. Preserve existing statistics
   until their replacement passes parity checks. Research authoritative POI
   coordinates, source attribution, request costs and privacy; do not fabricate
   positions from article titles or merge the two experiences indiscriminately.
   Present three concrete compositions before the visual implementation gate.

## Future Standard / Dev diagnostics

Approved future direction, not implemented by the current reliability fix:

- Standard: lightweight operational health and manual report access.
- Dev: detailed bounded diagnostic evidence, with a visible automatic-send
  switch. Automatic coordinate-free statistics packets go to the existing
  diagnostic destination every ten minutes; that switch defaults ON within Dev
  and can be disabled. Automatic sending is unavailable in Standard.
- This direct owner request authorizes the future Dev-only periodic transmission
  and supersedes manual-only restrictions for that exact feature. It does not
  authorize mail from this development session or unrelated telemetry.
- Proposed safe default: Standard on ordinary launch, with explicit entry into
  Dev. Do not confuse the automatic-send default with defaulting the whole
  product to Dev.
- Measure collector cost before promising savings. Preserve useful faults,
  explicit gap accounting and no coordinates in either mode. Dev data remains
  bounded and does not enter persistent storage by implication.
- A minimized browser cannot guarantee ten-minute execution. Use observable
  elapsed time, one send at a time, bounded retry, and at most one catch-up packet
  on foreground return; never send a backlog burst. Reconcile client disclosure,
  server validation/rate limits, privacy flags and tests before publishing.

## Remaining interpretation

The owner has not yet said whether the two native Pause invocations were
intentional. Keep that narrow question open; do not reopen accepted surfaces or
infer that every native control combination has been individually tested.
