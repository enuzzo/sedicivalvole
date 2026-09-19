# Phone HTTPS relay and Aperture curve — September 19

## Evidence

- Owner road diagnostic build 20260919-1425: two QR admissions/answers, two 30-second connection expiries, zero data packets. Original private attachment stays outside the repository. This does not identify the exact ICE/network failure.
- Native regression: 996/996 pass. Final motion checks: 88/88 pass, including encryption/direction authentication, corrupt packets, cancellation, slow delivery, admission isolation, expiry, legacy signaling and curve bounds.
- `local-relay.json`: real local PHP endpoint plus actual receiver/phone session, AES-GCM and polling protocol. Both peers reach mutual readiness, with no HTTP errors or diagnostic mail. Synthetic inputs, not physical sensors.
- Browser: actual WebGL2 Aperture at 773 × 601, ±30 degrees/second, 42 km/h, stale input and reduced motion. `aperture-left.png`, `aperture-right.png`, `aperture-stale.png`, `aperture-reduced-motion.png`. The shared warped geometry keeps all four wall seams and the dark terminus. Standstill targets zero.
- Silent development-only visual study: `/qa/motion-aperture.html`. Excluded from production. It makes simulated inputs explicit, with no audio, GPS or network transmission.
- Credits: 189 exact lockfile entries pass.

## Canonical publication

Source `11ecca8`, build **20260919-1612.11ecca8**, published through the official preserve-existing gate. Production validates 827 static hashes; the public-source index checks 1,550 text files without findings. Official publication uploads 38 files / 6,482,240 bytes, fully verifies/reuses 825 static files and 29 recordings, preserves one older asset and reports ROOT_UPLOAD_ONLY.

`live-identity.json` records 21 passing bare/cache-busted root and exact asset hash checks with no-store/no-cache root headers. Browser canonical reload shows the same release, no console warnings/errors, automatic diagnostics OFF, muted audio, automatic default HTTPS QR and the explicit local WebRTC alternative. CANCEL removes the test QR; `live-receiver.png` contains no capability. No diagnostic mail or real sensor/location data is sent.

`live-relay.json` records a bounded synthetic exchange through **the real public PHP endpoint**, using actual session owners and AES-GCM: 48 received samples, no rejection or HTTP error, both sides observed reciprocal readiness. Final sample round trip 90.8 ms; maximum accepted round trip 205.7 ms; HTTP median 25 ms. Fresh data was present in 59 of 100 sampled observations, illustrating the deliberately conservative 250 ms gate. These are measurements from this Mac's network, not Tesla/iPhone/mobile-radio results or a guarantee of continuously fresh delivery.

Compiled phone checks at 390 × 844 and 320 × 568 show no horizontal overflow; ZERO and STOP remain visible initially. At 320 px the encrypted-route label wraps, while STOP ends at y=536. Screenshots contain only inert synthetic admission data, with no capability visible.

Physical follow-up: reload both devices to this build, create a new default QR, grant sensors and set ZERO while parked. Observe reciprocal readiness, then test Aperture with the phone fixed in its holder. New transport latency, mount/direction, comfort and sustained operation remain unverified until this check. The owner has already reported that the prior QR/permission flow worked; this does not establish the new relay's mobile performance.
