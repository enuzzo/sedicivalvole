# Soundtrack seek readiness — September 18, 2026

## Scope and result

Milestones 7 / 10C: targeted follow-up to the automatic-track waits in the
[September 18 health review](HEALTH-CHECK-2026-09-18.md). Three confirmed software
defects are corrected: redundant exact-zero seeks, premature playback commitment
after a necessary rewind, and nonzero initial-selection gain during preparation.
Target-device listening remains open; historical event intervals are not measured
audible-gap durations and do not establish a complete network/decoder diagnosis.

All start paths retain the six-second buffer floor and one ten-second deadline,
including the post-seek wait. A prepared target is admitted only when its seek
has finished and decoded future data is available. A manual transition retains
the outgoing programme and metadata until admission. Initial selection remains
silent. Pause, replacement and destruction promptly cancel stale starts;
timeout rollback discards the incomplete target and remains retryable. No
crossfade duration, recording speed, source rights or persistent cache changes.
The established current-first thirty-second NEXT prefetch policy is unchanged;
the concise music contract's stale six-second prefetch wording is corrected.

## Evidence

- Two regressions were first observed failing on the previous implementation:
  exact-zero advancement performed an unnecessary seek, and a deferred manual
  rewind reported playback while still seeking.
- Seven added regression cases cover exact-zero automatic advancement, delayed
  manual/initial/automatic admission, autoplay warm-up, shared deadline and
  retry, and cancellation with late completion. Existing stale-play cancellation
  additionally resolves the newer operation before the abandoned native promise.
  The media test double now correctly supports multiple listeners per event.
- Focused media/preview/boundary/Media Session checks: **68/68**. Complete native
  functional/source/regression suite: **883/883**, zero skipped or cancelled,
  with Python 3.11 and credential-free QA configuration.
- Codex internal-browser fixture: actual production preview/deck/effects
  controllers, real HTMLAudioElements and Web Audio, generated silent forty-second
  PCM WAV, muted output, local synthetic catalogue. No location, remote catalogue,
  third-party recording or diagnostic sending. The temporary fixture is excluded
  from production; its source and output are session-local QA material.
- **12/12 browser assertions**: silent preparation, initial playback, running
  effects graph, advancing media clock, actual warm-up seeking/seeked, manual
  Next, stopped paused clock, position-preserving resume, real ended-triggered
  automatic advancement, advancing next clock, decoded readiness at every
  target commit and at most three attached media roles. Zero console warnings/errors.
  The fixture briefly delays effects readiness and seeks the outgoing element
  near its end to exercise real media events without waiting a whole recording.
- All three target commits had `seeking=false`, `readyState=4`, with native
  positions approximately **0.000558 s**, **0.001212 s**, and **0 s**. Native
  rewind events exposed `readyState=1`, `seeking=true` while forty seconds remained
  buffered, directly demonstrating the missing readiness boundary.

The [HTML media seeking algorithm](https://html.spec.whatwg.org/multipage/media.html#seeking)
is the supporting platform contract. Browser event/gain assertions are not
acoustic listening, weak cellular reception, physical Tesla media integration,
or iPhone acceptance.

## Delivery and next acceptance

Implementation and local checks pass. Production-package and canonical delivery
evidence will be recorded after the official publication gates complete.

On the published candidate, record device/software/build and listen through at
least three natural completions, then run **R10C-03 / R7-14** for native
play/pause/previous/next and artwork. Include one constrained-connection recovery
and pause/retry during preparation. Report audible continuity separately from
`waiting` telemetry, and preserve outgoing audio/metadata during manual waits.
Continuous visible Air Atlas/Fly With, physical iPhone and remaining Engine
acceptance follow; R06's incomplete historical scan remains separate.
