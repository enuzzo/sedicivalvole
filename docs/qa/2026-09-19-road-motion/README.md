# Mounted phone road-input verification — September 19

## Local evidence

- Native functional/regression suite: **1006/1006** cases pass. Final sensor
  recalibration refinement: **46/46** affected cases pass; final compact-phone
  checks **48/48** and source/documentation checks **14/14** pass.
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
  within the phone viewport; navbar dimensions are unchanged. The final compiled
  check adds 320×568: STOP ends at y=552. No page exceptions.
- Production App/LAB/package build passes with **827** exact static hashes.
  Final source is **ea8712b**, build **20260919-1722.ea8712b**.
- Community credits: **189** exact lockfile credits pass. No new third-party
  code, dependency, media, service or source bank is introduced.

Reproduce browser integration with an existing Playwright installation:
`PLAYWRIGHT_MODULE=<module-path> node prototype/drive-lab/scripts/qa-road-motion.cjs`.
Run the local Vite preview on 5175 with `SEDICIVALVOLE_NO_LOCAL_ENV=1` first.

These are explicit synthetic/browser checks, not iPhone sensor accuracy, relay
continuity, physical mounting, cabin sound or Tesla acceptance. See the
[implementation and physical protocol](../../PHONE-ROAD-INPUT-2026-09-19.md).

## Delivery

Source checkpoints **9b8871b** and **ea8712b** are pushed to `origin/main`.
A read-only preflight overlapped the final local rebuild and failed closed while
local static-file validation, before any remote write. The final build is now
held stable during the official publication gate; no deployment runs concurrently.
Canonical publication **PASS**: 38 uploaded files / 6,492,554 bytes, 825 verified
static files and 29 fully verified recordings reused, two previous assets
retained, `ROOT_UPLOAD_ONLY`, no legacy deletion. Official safe gate output is
recorded in `publication.txt`.

`live-identity.json` records **21** exact HTTPS identity/hash checks, including
bare and cache-busted root plus a final bare-root recheck. All match the local
build; root headers remain no-store/no-cache.

`browser-live.json` confirms **20260919-1722.ea8712b** before and after reload,
the unchanged 64 px rail, GPS fallback when fresh speed is unavailable and
unchecked-by-default holder selection. Phone controls end at y=716 in 390×844.
There are no page exceptions, no diagnostic requests and no synthetic mail.
The final 320×568 compiled check has STOP ending at y=552. All browser inputs
remain synthetic or absent; no hardware acceptance is claimed.

Scoped public hygiene inspects the 30 changed committed text files, with no
findings; the unrelated pre-existing historical file is excluded throughout.
