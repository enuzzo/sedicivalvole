# Phone / Tesla road benchmark — September 22, 2026

## Observed drive

Two overlapping owner diagnostic reports cover 08:44:04–08:50:51 Europe/Rome
(406.767 seconds), build `20260920-2231.b696bc4`. This is a retained diagnostic
window, not proof of the entire commute. The gzip payloads and decoded hashes
were verified locally; private raw reports are not committed.

- All 192 transport snapshots used encrypted HTTPS; no direct WebRTC was observed.
- Pairing was connected in 187 snapshots. All 187 had aligned car motion disabled
  (`mountSelected: false`, `roadState: not-selected`).
- Phone sensing was approximately 60 Hz, with no recorded missing axes or
  visibility stops. The recorded wake lock had no release or failure.
- Median sampled protocol round trip was 266.5 ms, above the unchanged 250 ms
  sample lifetime. Only 27/187 connected snapshots were fresh. Reconstructing
  retained stale/recovered events gives 50.745/392.692 seconds fresh (12.9%), with
  the longest stale interval 113.2 seconds. These are different observations,
  not an interchangeable packet-loss estimate.
- There were 1,444 accepted protocol replies, 995 rejects including 842 latency
  drops, and 1,802 expired requests. Counters overlap and replies need not contain
  usable sensor input. Nineteen signalling errors include a sampled 71.4-second
  retry episode.
- Engine was selected 3.2 seconds after launch, before pairing. The retained
  samples contain two Aperture flight states and 202 Engine states. They cannot
  demonstrate active Aperture gyroscope response during this drive.

The owner successfully tested pairing retention under poor reception. Continuous
usable motion was not achieved. Generic acceleration magnitude includes braking
but loses its direction. Signed car-axis acceleration and yaw already existed,
but the explicit aligned mounting gate prevented their use on this drive.
GPS-derived slowing is not evidence of phone braking measurements.

## Implemented response

The existing Position step now exposes optional aligned car motion before ZERO.
The completed phone screen explicitly shows whether car response is off, permits
changing that choice, and requires new ZERO after a change. Generic readings say
“Phone movement”; calibrated readings show signed acceleration/deceleration and
car turn. Gravity measures the tray inclination; no guessed mounting angle is
hard-coded. GPS retains speed authority, with the original mount, calibration,
freshness, reciprocal receipt and consumer gates.

Automatic WebRTC now tries public STUN discovery, categorizes the selected path
without recording addresses, and backs failed upgrades off progressively to
60 seconds. A network change wakes an unproven path while preserving a proven
one. Encrypted HTTPS remains available. STUN is not TURN: restrictive cellular
NATs can still prevent a direct path.

Whole-session bounded counters record connected, fresh, confirmed and eligible
road input duration, selected transport, signed slowing/acceleration/turn sample
counts and eligible input requested by Engine, Flux braking and Aperture curves.
Durations expire with the original sample deadline; execution gaps are unknown.
No coordinates, vectors, candidate addresses, credentials or sample history are
added. Consumer input counters do not prove audible or rendered output.

## Infrastructure decision

The owner has SiteGround. Its [official port policy](https://www.siteground.com/kb/which_ports_are_open_on_siteground_shared_servers/)
does not allow custom incoming ports on ordinary hosting; this does not establish
an available TURN server. Use of the free [Cloudflare STUN service](https://developers.cloudflare.com/realtime/turn/faq/)
was admitted with its network-metadata disclosure and attribution. No account,
subscription or external relay credentials were created. TURN remains an external
service requirement for dependable traversal when direct discovery fails.

## Verification and acceptance

Source checkpoint: `d6348cd`; production build: `20260922-0953.d6348cd`.
Native tests: 1,068 passed; focused final checks: 80 passed. All 834 package hashes
and 189 dependency credits passed. Release-source public hygiene: 1,614 files,
zero findings; a pre-existing unrelated local recovery note was preserved and its
committed bytes used for that release-source check.

The exact compiled build passed 22 forced-HTTPS and 27 automatic-path browser
checkpoints with zero page exceptions. The automatic local path achieved 120/120
mutually fresh observations and 1,205/1,205 usable high-rate observations. Tests
include a 30-second network absence, same-pairing recovery, signed -2 m/s² braking
and -12 degrees/s yaw reaching the receiver, optional mount changes, renewed ZERO,
GPS/Demo exclusion, STOP, a new QR and responsive geometry. Hardware input is
synthetic; transport, encryption, application and local PHP handler are real.
No synthetic diagnostic mail was sent.

Physical acceptance still requires the new build on the real iPhone/Tesla, aligned
motion enabled and ZERO performed while parked. Confirm braking and curves in the
appropriate consumers, and repeat the poor-reception commute. Neither local
browser continuity nor STUN availability establishes cellular road continuity.

## Canonical delivery

Official preserve-existing publication passed: 38 files / 6,535,077 bytes uploaded,
832 static files and 29 recordings hash-verified/reused, two prior assets retained,
`ROOT_UPLOAD_ONLY`. Thirteen canonical HTTPS checks confirm byte-identical bare,
cache-busted and no-cache root, referenced resources and the lazy phone chunk.
All three HTML responses have no-store/no-cache headers and proxy-cache MISS.

The public compiled application and actual motion PHP endpoint passed all
27 browser checkpoints with zero page exceptions: 120/120 mutual-fresh
observations and 1206/1206 usable high-rate observations. This includes
one-way direct failure, fresh HTTPS fallback, restored direct transport, a
30-second browser outage and automatic same-pairing/ZERO recovery, signed braking
and yaw, and STOP. These browsers run on one Mac with synthetic sensors; this
does not test two mobile carriers or the real Tesla. Non-motion API delivery
was blocked throughout. [Evidence](qa/2026-09-22-road-benchmark/README.md).

## Reusable local analysis

Run `python3 scripts/analyze_phone_benchmark.py REPORT.json REPORT.json.gz`
from the repository root. The tool reads local packets only and emits an
allowlisted numeric JSON summary plus the decoded input hash. It does not make
network requests, send mail, copy raw reports or modify the app. Compressed and
decoded inputs are each limited to 32 MiB. No filenames or arbitrary payload
strings are included in its output.

Reports remain separate: automatic and manual snapshots may overlap, and build
identity alone cannot identify a session. Cumulative counters must not be added.
Older reports expose snapshot ratios only; missing whole-session time stays null.
For this drive the manual snapshot ratio is 27/187 = 14.44%, distinct from the
12.9% time reconstruction above. Its median sampled RTT is 266.5 ms and all known
mount states are disabled. The automatic report independently has 22 connected
snapshots, zero fresh snapshots and a 254.45 ms median sampled RTT.

Eight standard-library tests cover missing values, snapshot/time denominators,
privacy allowlisting, invalid ratios, gzip equivalence, bounded decompression
and malformed report structures. Both real packets were analyzed locally. The
raw packets and generated private analysis output remain outside Git.
