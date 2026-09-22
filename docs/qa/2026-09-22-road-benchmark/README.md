# September 22 road benchmark QA

Exact production build: `20260922-0953.d6348cd`.

- Native suite: 1,068 passed; final focused checks: 80 passed.
- Compiled local forced HTTPS: 22 checkpoints; automatic path: 27 checkpoints.
- Zero page exceptions in both paths. Automatic continuity: 120/120 mutual,
  1,205/1,205 usable high-rate observations.
- [Machine-readable checkpoint summary](browser-summary.json).
- [Position choice before ZERO](phone-position-choice.png).
- [Signed slowing and yaw](phone-deceleration.png).
- [Tesla receiver readings](drawer-sensors.png).

The harness supplies synthetic hardware events and uses real compiled code,
encrypted transport, native WebRTC and the PHP handler. Other service requests
are blocked, including diagnostic delivery; no synthetic mail is sent. Expected
fixture resource failures are not app exceptions. These results do not establish
physical iPhone/Safari/Tesla or separate cellular-network continuity.

See [analysis and delivery](../../PHONE-ROAD-BENCHMARK-2026-09-22.md).

Canonical delivery also passed all 27 checkpoints with zero page exceptions.
See [public browser summary](canonical-browser-summary.json) and
[13 byte-identity/cache checks](live-identity.json).
