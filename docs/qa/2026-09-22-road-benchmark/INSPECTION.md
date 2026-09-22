# Follow-up inspection — September 22, 2026

Scope: adaptive HTTPS/WebRTC ownership, deadlines and retry lifecycle, protocol
receipt/freshness gates, network-listener teardown, motion coverage, the local
benchmark analyzer, repository scope, native tests, packaging and public identity.
This is a focused maintenance review, not an exhaustive security audit or physical
vehicle acceptance.

## Findings and changes

1. The local benchmark analyzer could raise an overflow on a large integer, or
   produce a non-finite percentage/median from otherwise finite numeric inputs.
   It now rejects nonrepresentable integers and uses overflow-safe arithmetic.
   Deep JSON parsing errors follow the same sanitized failure path as corrupt
   gzip. Regression tests cover numeric extremes and CLI failure privacy.
   The two real diagnostic summaries are unchanged, including decoded hashes.
2. The wall-clock HTTPS continuity test failed under full-suite load at 55/60
   fresh observations, below its existing 57/60 threshold, then passed in
   isolation. It now uses a controlled clock and asynchronous identity cipher
   specifically for scheduling assertions. Thresholds and delayed-input rejection
   are unchanged. Adjacent tests still exercise real authenticated WebCrypto and
   real timers. No production timing, freshness or transport code was altered.

## Final evidence

- Complete native suite: 1,068 tests passed, zero failures after the test repair.
- Local analyzer: 10 tests passed; both real packets still produce exactly the
  previous numeric summaries. Raw packets remain outside Git.
- Production packaging: successful local build `20260922-1209.360c33d`, with
  all 834 exact static hashes and version/HTML identity checks passing.
- Canonical public release checked before rebuilding local artifacts:
  `20260922-0953.d6348cd`, all 13 bare/query/reload/asset identity checks passed.
- Dependency credits: 189 exact entries, README credits at the end.
- Whitespace gate passed; unrelated pre-existing recovery-note edits preserved.

The local build is verification only and was not deployed. The published product
is unchanged, keeping the road trial comparable. Prior exact-build browser tests
remain recorded in this directory; no new browser or physical acceptance is
claimed for this maintenance-only change.
