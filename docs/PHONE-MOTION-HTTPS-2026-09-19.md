# Phone motion: road connection and Aperture refinement

## Owner evidence and decision

The September 19 road report from build 20260919-1425 shows two successful QR admissions and accepted phone answers, followed by 30-second connection expiry. Both attempts gathered one candidate without reporting completed ICE gathering. No channel-open event or received/sent sample appears. This establishes failure after signaling, not the exact network/browser cause. The owner reports successful QR opening and apparent iPhone permission/sensor operation; the receiver log cannot independently verify phone sensors.

The owner requests a same-site transport solution, considers the iPhone hotspot, and explicitly asks for gyro-driven Aperture curvature. This supersedes the earlier direct-only/no-renderer scope, without authorizing external ICE services or replacing GPS speed.

## Transport

The default product QR uses HTTPS on the existing site's ordinary port. It needs no WebRTC API and works independently of local peer reachability. Connection details retains an explicit local WebRTC QR for comparison; it replaces the old attempt. This is an explicit transport choice, not an automatic switch during a session.

The existing PHP endpoint remains backward-compatible with legacy direct signaling. HTTPS admission is one-use, expires after three minutes and exchanges independent receiver/phone capabilities. After joining, the lease is 15 seconds of inactivity with a hard one-hour ceiling. Client STOP/hide/offline tears down and deletes the session; transient transport faults are bounded to three failures, with 1.5-second request timeouts. No background reconnect or admission reuse occurs.

A random 256-bit AES-GCM key stays in receiver memory and the QR fragment. The phone removes the fragment before rendering/logging. Only the admission token, never this key, is sent in API bodies. Each envelope gets a fresh random 96-bit nonce and authenticates its sender role. The server stores capability hashes and at most one ciphertext slot per direction; packets cease being served after two seconds. Session files are private (0700 directory / 0600 file) outside the web root; STOP deletes them, expired inactive files are removed on subsequent traffic cleanup. No promise of physical deletion at an exact wall-clock instant is made. No plaintext vectors, coordinates, encryption keys, envelopes or raw history enter reports.

Requests are serial per peer, bounded in body/response size and server cadence, without queued history or sleeping PHP workers. Real traffic is answered promptly; idle polling waits 40 ms. This is a bounded experimental shared-hosting relay, not a WebSocket/TURN service or a demonstrated fleet-scale backend.

The same conservative receiver-clock freshness protocol remains: full request round trip plus phone sample age must fit 250 ms. No clock subtraction between devices, guessed latency compensation or stale replay. Mutual readiness still requires a returned generation/sequence receipt. Transport success does not imply suitable latency; slow data pauses and is excluded from the visual. The phone's local TRACE remains at local sensor cadence.

## Inputs and Aperture

GPS/Demo owns absolute speed and the 130 km/h energy boundary. Gyro supplies prompt angular rate; acceleration is measured in the tare-relative frame. Neither is integrated into invented speed, position, heading or a vehicle-forward vector.

Aperture reads fresh samples from the existing sensor/session owner on each render frame, independently of the slower React diagnostics refresh. Quantized turn rate about the captured vertical drives a bounded 0.32 normalized horizontal depth warp, with a 0.6 degrees/second deadband and smooth attack/release. It appears as the tunnel opens above 5 km/h, reaches full available response at 40 km/h, and is disabled for reduced motion. All walls share the same warped coordinates, keeping their seams and the dark terminus. The Canvas2D fallback offsets its perspective rings consistently. Missing/expired samples target zero and relax to straight; no new animation owner or audio coupling is introduced.

Phone rotation in the hand also counts. ZERO is a pose reference, not a mount/vehicle identification algorithm. Direction, strength, comfort, actual mobile-network latency and sustained Tesla/iPhone operation require physical acceptance.

## Technical references

- [WebRTC peer connections](https://webrtc.org/getting-started/peer-connections) and [TURN](https://webrtc.org/getting-started/turn-server): direct reachability is not universal; relay infrastructure is normally needed across restrictive networks. The current local choice deliberately uses no external ICE service.
- [W3C Device Orientation and Motion](https://www.w3.org/TR/orientation-event/): distinct orientation, acceleration, gravity and angular-rate observations. These do not constitute an absolute vehicle-speed sensor.

## Verification

See [QA evidence](qa/2026-09-19-phone-relay/README.md). The owner attachment stays outside the repository. Tests, local PHP exchange, browser visual inspection, canonical publication and physical acceptance are separate evidence layers.
