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

The owner now considers the pauses probably intentional, reports no sudden
uncommanded stop, and confirms interruptions to view Tesla navigation. A02 is
answered; no spontaneous-pause fault is reported. This is not event-by-event
certainty or proof of every native control combination.

The owner also explicitly requested the sanitized competitor/Engine study
review. See [Engine intake](ENGINE-INTAKE-2026-09-07.md) for the exact reading
scope, informed-review boundary, donor recommendation and GPS findings.


## Launch Cockpit and public Music naming

The owner requested first-screen Engine selection, precise or lucky Soundtrack
selection and a simpler Tesla splash, and explicitly delegated design choice.
Cockpit was selected from three presented directions. Public labels are Music /
Engine; internal Flux stays. Genre/pace/Lobo choices persist, while lucky selects
a different genre on the next visit. Implementation and browser proof are in
[the launch record](LAUNCH-COCKPIT-2026-09-07.md); physical acceptance remains open.

## Latest priority — support, then ATLAS / Stats for Nerds

The owner now puts ATLAS / Stats for Nerds immediately after the support header
refinement, ahead of the earlier iPhone slot. Natural pastel cartography, wider
map context and a separate visual stats page are requested. A branded session
PDF with user-chosen email delivery and a resettable remembered recipient is
planned in [the implementation brief](ATLAS-STATS-REPORT-PLAN-2026-09-07.md).
Direction selection is pending; PDF/email is planned, not shipped.

## ATLAS / Stats selection — 2026-09-07

The owner selected the Travel Observatory / Mission Control / Journey Magazine
remix and explicitly requested implementation. ATLAS is the independent natural
map with real-coordinate Wikipedia POIs and an in-page article reader; Stats
is a separate full-screen session sheet combining the selected timelines,
heading/network instruments and speed/elevation summaries. See A13 in the
owner-answer ledger and the implementation/report plan. No visual-choice
question remains open for this work. Physical Tesla acceptance and future
PDF/email implementation remain separate gates.

## Automatic diagnostics activated by owner — evening follow-up

The owner now explicitly requests implementation, default activation and
publication. Dev/AUTO ON is the fresh default for this development phase;
saved OFF/Standard remains respected. Fifteen observed GPS driving minutes is
the current interval, superseding the earlier ten-minute future plan. See
[AUTOMATIC-DIAGNOSTICS-2026-09-07.md](AUTOMATIC-DIAGNOSTICS-2026-09-07.md).
