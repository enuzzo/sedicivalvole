# Phone HTTPS relay and Aperture curve — September 19

## Evidence

- Owner road diagnostic build 20260919-1425: two QR admissions/answers, two 30-second connection expiries, zero data packets. Original private attachment stays outside the repository. This does not identify the exact ICE/network failure.
- Native regression: 996/996 pass. Final motion checks: 88/88 pass, including encryption/direction authentication, corrupt packets, cancellation, slow delivery, admission isolation, expiry, legacy signaling and curve bounds.
- `local-relay.json`: real local PHP endpoint plus actual receiver/phone session, AES-GCM and polling protocol. Both peers reach mutual readiness, with no HTTP errors or diagnostic mail. Synthetic inputs, not physical sensors.
- Browser: actual WebGL2 Aperture at 773 × 601, ±30 degrees/second, 42 km/h, stale input and reduced motion. `aperture-left.png`, `aperture-right.png`, `aperture-stale.png`, `aperture-reduced-motion.png`. The shared warped geometry keeps all four wall seams and the dark terminus. Standstill targets zero.
- Silent development-only visual study: `/qa/motion-aperture.html`. Excluded from production. It makes simulated inputs explicit, with no audio, GPS or network transmission.
- Credits: 189 exact lockfile entries pass.

Production build, canonical publication and server exchange results will be appended after verification. New transport performance, phone mounting/direction, comfort and sustained physical Tesla/iPhone operation remain unverified until the next road check.
