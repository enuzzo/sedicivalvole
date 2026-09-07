# Launch Cockpit verification — 2026-09-07

The numbered screenshots are actual Chrome renders, not generated design mocks.
Local development captures 01–07 show the 773 × 601 Tesla layout, picker and dark
preset, plus the 390 × 844 launch layout. The running phone control shell remains
a separate unfinished milestone. Engine regression images show the unchanged
runtime after starting through the new splash.

- [Local browser evidence](browser-evidence.json): 15 functional checks, five
  viewport/state geometry checks, no page exceptions, failed responses or sends.
- [Engine regression](engine-regression/browser-evidence.json): actual WAVs,
  induced failure/retry, profiles, shared context, dry braking, stopped rev controls,
  fresh/stale GPS renewal and automatic idle blip.
- `qa-launch-cockpit.mjs` uses explicit synthetic catalogue/audio fixtures for
  deterministic delayed-selection and silence checks. Its Lobo fixture compensates
  for the standalone Vite server's absent production catalogue endpoint.
- The public verification uses the real Jazz and 29-track Lobo catalogues/audio;
  only GPS is synthetic. No diagnostic is sent. Autoplay-policy warnings during
  silent preparation are recorded, with actual post-START playback checked.

Implementation and acceptance boundaries: [Launch Cockpit](../../LAUNCH-COCKPIT-2026-09-07.md).


## Published build

**20260907-1238**, source **4e8ee1f**, implementation **4612da6**, version **0.0.0**.

- [Public Music](08-canonical-music.png) and [public Engine](09-canonical-engine.png).
- [Canonical browser report](canonical-browser.json): real catalogue and playback,
  build/source identity, synthetic stationary GPS only; zero diagnostic sends.
- [28 canonical hashes](canonical-hashes.json), [preflight](preflight.txt),
  [publication](publish.txt), [independent no-write postflight](postflight.txt).
- Public playback: Jazz "Captain Hugo" by Hugo 'Droopy' Contini and "Lots of Bells"
  by Illobo. Track titles are transient verification identities, not fixed defaults.
- Six inherited autoplay-policy warnings; zero page exceptions. The first public
  probe timed out because detached audio elements were absent from DOM queries.
  The corrected probe observes the actual player elements; playback and non-empty
  native-rate evidence pass. This was a test-observer correction, not a runtime fix.
