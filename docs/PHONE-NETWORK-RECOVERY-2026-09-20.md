# Phone network recovery — September 20, 2026

## Owner correction and behavior

The owner reports repeated mountain-road coverage gaps lasting roughly thirty
seconds or kilometers. Losing a network link must not eject a functioning phone.
This explicitly supersedes the earlier offline teardown, three transport failures,
five seconds without a peer packet and fifteen-second server inactivity lease.
It does not relax the 250 ms maximum sample age or claim continuous reception.

- Keep an admitted HTTPS pairing until its original absolute one-hour expiry.
  Unused QR admission is still three minutes and single-use. Initial admission
  failure still needs a new attempt; no automatic reuse of a consumed QR occurs.
- Network-only gaps keep foreground local sensors, placement, valid ZERO and wake
  ownership. Actual missing/incomplete sensor data still invalidates ZERO. Browser
  wake release remains observable and requires its explicit retry gesture.
- Exclude expired phone input. Engine/Flux use their existing GPS motion fallback
  when GPS is fresh; Aperture relaxes to straight without a valid gyro sample.
  GPS remains the sole real speed source. An absent GPS fix is never shown as
  usable, and Demo remains independent of phone input.
- Phone/display explain retained pairing and automatic recovery. A sustained
  transport interruption or sustained data delay also uses the existing running status notice outside
  the receiver drawer, remaining visible when driving controls rest. Manual
  restart remains in details; a transient delay no longer solicits a new QR.
- STOP, hiding/locking a page, expiry or invalid/revoked capabilities remain
  terminal. An online event cannot resurrect a stopped owner. Temporary local
  WebRTC disconnection can recover; a failed/closed peer remains terminal.

## Bounded transport and storage

The HTTPS owner has at most one in-flight exchange per peer. Failed requests back
off from 250 ms to two seconds; brief 429 arrival jitter gets three 22 ms retries
before the same bounded backoff. A peer absent for over one second slows successful
polling to 500 ms, below the two-second mailbox serving limit even at integer
server-second boundaries. This prevents two recovering peers from repeatedly
missing each other. Known offline state makes no exchange requests and
keeps only a lease timer. Online wakes this same owner, never a second loop.
Request timeout remains 1.5 seconds. Recovery retries end at the original lease.

An offline transition clears pending challenges, received values and reciprocal
receipts immediately, preserving sequence monotonicity. Late in-flight completion
cannot repopulate them. A phone response waiting over 250 ms is discarded. Normal
250 ms protocol checks, sender age plus measured round trip, reference-generation
checks and mutual confirmation all remain in force. No old backlog is replayed.

PHP preserves the existing 64-session cap, separate hashed bearer capabilities,
AES-GCM ciphertext-only slots, same-origin restrictions and private temporary
storage outside the web root. A joined record expires at its creation-time
one-hour ceiling; exchanges never renew it. Opportunistic cleanup respects that
expiry instead of deleting active capabilities by 180-second file age. Packets
older than two seconds are never served. At most one ciphertext per direction
may remain on disk until a later exchange/expiry cleanup; physical erasure at an
exact time is not promised. Local STOP attempts immediate server deletion; an
offline client cannot guarantee that request arrives. Absolute expiry still
bounds abandoned metadata. No credentials or sensor history are persisted in the
browser, and diagnostics add only an allowlisted network-state enum.

The endpoint remains backward compatible with older direct/HTTPS clients. The
publisher admits its new exact reviewed SHA-256 while retaining known previous
identities for cache overlap. No deploy gate is bypassed.

## Verification and acceptance

Focused source tests cover network loss without a browser offline signal,
backpressure/retry bounds, no concurrent request loops, discarded late completion,
30-second offline retention, one-hour terminal expiry, local ZERO continuity,
actual sensor-gap invalidation, protocol replay rejection, temporary WebRTC
disconnection, session teardown, truthful GPS copy and PHP survival after 30 seconds
and several minutes with expired ciphertext excluded.

The compiled two-browser regression adds an actual browser offline interval of at
least 30 seconds on both pages. Synthetic platform sensors and GPS remain active;
real App/session/protocol/cipher and an isolated real PHP worker remain in use.
It passes sixteen checkpoints, including same pairing/reference recovery without
clicks, visible outage/GPS states, missing GPS and the established LIGHT/DARK,
phone portrait/landscape, reduced-motion and lifecycle checks. No page exceptions
occur. Evidence: `/private/tmp/sv-phone-recovery-browser-final`. Screenshots confirm
the running outage notice remains visible when the driving controls rest and the
phone retains completed setup and wake while values are withheld. One initial
browser failure exposed opposite retry phases missing the integer-second mailbox
expiry; the corrected 500 ms idle cadence and a deterministic regression cover it.
The test teardown now also closes idle HTTP connections explicitly. Publication
identity follows the clean committed release build.

The earlier canonical 97/120 mutual-fresh observations still fail the unchanged
95 percent continuity target. Keeping a pairing through outages does not make
slow packets fresh. Physical iPhone/Tesla reception, OS lifecycle, cabin response
and endurance remain separate acceptance; retry the actual road route with a
passenger, and perform setup/recalibration while parked.


Local release gates pass: 1,053/1,053 native tests across all eleven script groups,
189 exact dependency credits and a clean public-hygiene scan of 1,607 text files.
The initial full run caught the existing static UI selector contract; it was
preserved in product markup, without weakening the test, and the complete rerun
passes. No dependency, third-party bytes or environment file was changed.
