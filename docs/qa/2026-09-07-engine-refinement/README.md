# Engine listening refinement — September 7, 2026

Implementation: `acfbd21`. Built source: `65a4a22`, build `20260907-1151`.
Captures 01–06 use the current-source Vite development session; capture 07
verifies the deployed production build and its REPORT identity.

- 655 native regression checks and 10 post-build checks pass; 196 locked dependency credits verified.
- `browser-evidence.json`: real Chrome/Web Audio, actual WAVs, controlled GPS and Demo input. Covers offline bank retry, all profiles, acceleration/braking, two stationary rev controls after chrome retraction, automatic idle blips, quiet-watch GPS renewal, stale/fresh control transitions, mute and Engine/Flux switching in one AudioContext. No diagnostic sent or page exception.
- `sample-levels.json`: 27 three-second stereo OfflineAudioContext renders, using unchanged shipped WAVs at 1,000/3,500/6,500 RPM with zero, idle and full drive demand. Across nine matched-RPM comparisons, overrun versus powered level is -0.531 to +0.292 dB. This measures signal energy, not equal perceived loudness across different timbres or a vehicle listening approval.
- `04b-resting-controls.png`: current 773 × 601 resting chrome, two prominent 60 px controls, no profile overlap; geometry is asserted in the browser script.
- `lab-evidence.json` / `06-lab.png`: protected LAB can still request and commit manual third gear.
- `05-phone-layout.png`: records the inherited unfinished phone shell. It is not iPhone acceptance.

Canonical HTTPS and browser verification are recorded after publication in
`canonical-hashes.json`, `canonical-browser.json`, `07-canonical.png` and
[DEPLOY.md](../../DEPLOY.md). GPS evidence in these automated runs is synthetic;
physical Tesla audition of the requested refinement remains open.
