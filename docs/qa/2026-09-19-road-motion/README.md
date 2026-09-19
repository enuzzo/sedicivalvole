# Mounted phone road-input verification — September 19

## Local evidence

- Native functional/regression suite: **1006/1006** cases pass. Final sensor
  recalibration refinement: **46/46** affected cases pass.
- Synthetic axis/sign tests cover five inclines and five car headings, positive
  acceleration, braking, lateral rejection, unsupported poses and handling.
- Consumer tests exercise Engine snapshots and its real demand estimator, plus
  the actual audio facade/Underwater macro at constant GPS speed. Lost input
  releases the effect; source reset removes phone response before Demo.
- Protocol tests retain the conservative 250 ms deadline and quantized optional
  road payload. Existing generation/sequence, lifecycle and QR coverage remains.
- Browser `browser-integration.json` uses a test-only intercepted receiver module,
  never a production hook. It verifies actual App selection, real Engine load and
  deceleration, source UI, expiry, moved mount and Demo exclusion. Synthetic GPS
  comes from the existing local fixture. Diagnostic requests are blocked.
- `browser-initial.json` and screenshots verify the existing 773×601 Tesla rail,
  receiver panel and 390×844 phone controls. ZERO, RECENTER VIEW and STOP remain
  within the phone viewport; navbar dimensions are unchanged. No page exceptions.
- Production App/LAB/package build passes with **827** exact static hashes.
  Final source identity and canonical publication are recorded below after delivery.
- Community credits: **189** exact lockfile credits pass. No new third-party
  code, dependency, media, service or source bank is introduced.

Reproduce browser integration with an existing Playwright installation:
`PLAYWRIGHT_MODULE=<module-path> node prototype/drive-lab/scripts/qa-road-motion.cjs`.
Run the local Vite preview on 5175 with `SEDICIVALVOLE_NO_LOCAL_ENV=1` first.

These are explicit synthetic/browser checks, not iPhone sensor accuracy, relay
continuity, physical mounting, cabin sound or Tesla acceptance. See the
[implementation and physical protocol](../../PHONE-ROAD-INPUT-2026-09-19.md).

## Delivery

Pending canonical publication and verification.
