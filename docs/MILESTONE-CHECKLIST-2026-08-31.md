# Milestone Checklist — 2026-08-31

This is the recoverable closeout for the autonomous pre-03:00 work window. It
separates completed code, objective gates, publication evidence, and work that
still needs a human or target vehicle.

## SOUNDTRACK production prototype

- [x] keep the Jamendo read credential server-side and outside Git, logs, build
  assets, screenshots, and browser responses;
- [x] expose a short-lived, no-store catalogue relay that admits only complete,
  effect-compatible non-ND records;
- [x] expose an exact-track, byte-range audio relay with no arbitrary URL input,
  hosted copy, persistent cache, or offline mode;
- [x] prepare at most three transient previous/current/next media elements and
  release displaced sources;
- [x] preserve authored `1×` rate and keep driving out of track selection,
  transport timing, tempo, and pitch;
- [x] connect OPEN, UNDERWATER, and BLOOM behind a shared footer `EFFECTS`
  master beside MUTE, retaining SOUNDTRACK fresh-session opt-in;
- [x] connect independent manual flanger, reverb, chorus, and bounded beat repeat;
- [x] expose Soundtrack selection, preparation, playback, transport, effects,
  artwork, artist, title, licence, Jamendo credit, and direct link in the App;
- [x] expose the same disposable music/effect test path in the protected LAB
  without including any music state in exported visual presets;
- [x] verify a real admitted Jamendo track locally through the App and LAB, with
  analyser activity, EFFECTS enabled, explicit pause, and clean consoles;
- [x] add focused relay, controller, worklet, packaging, and production-endpoint
  checks;
- [ ] audition automatic braking/acceleration effects and all four manual
  controls in the physical Tesla cabin;
- [ ] connect the modelled 450 ms equal-power transition to audible deck changes;
- [ ] add the compact QR credit handoff and broader Soundtrack library browsing.

## Final gates and publication

- [x] targeted Soundtrack integration checks;
- [x] production App, protected LAB, and Sites build;
- [x] fresh local App and LAB Browser interaction/console QA;
- [x] deployment and launcher regression checks updated for the production path;
- [x] complete native suite: 418/419 pass; only the unchanged local
  `spawn php ENOENT` diagnostic-mail fixture is unavailable on this host;
- [x] read-only canonical preflight;
- [x] guarded no-delete publication: 107 files / 16,449,992 bytes;
- [x] read-only canonical postflight and byte-identity verification;
- [x] live catalogue/audio-range endpoint verification: 3 schema-valid tracks
  and a 1,024-byte `206 audio/mpeg` range with `Content-Range` and `no-store`;
- [x] live cache-busted Browser interaction and console QA at the available
  `1280 × 720` viewport, ending paused with EFFECTS enabled;
- [x] deployment evidence recorded for build `20260831-0249`; final documentation
  checkpoint pushed with a clean aligned tree.

## Footer control checkpoint

- [x] expose one `EFFECTS` audio master beside MUTE for every music mode;
- [x] keep vehicle macro detection and visual response alive while audio effects
  are off;
- [x] preserve PLAY THE ROAD effects-on and SOUNDTRACK fresh-session effects-off
  defaults;
- [x] show 1.5-second centred `VOLUME ON/OFF` and `EFFECTS ON/OFF` notices;
- [x] compact the far-right palette to `138 px` at exact `773 × 601` and `160 px`
  at `1280 × 720`, with no horizontal or vertical document overflow;
- [x] focused runtime/UI tests and local Browser interaction QA pass;
- [x] publish and verify build `20260831-0315` at the canonical root: guarded
  107-file / 16,451,993-byte no-delete transfer, byte-identical HTML/JS/CSS,
  and exact live Browser QA at both target viewports.

## Deliberately not opened after the cutoff

No new feature block may start after `03:00 CEST`. ATLAS implementation was not
opened during this closeout window; finishing, proving, documenting, and
publishing SOUNDTRACK is the final task block.

## Ordered next work

1. Physical-Tesla SOUNDTRACK listening: automatic OPEN/UNDERWATER/BLOOM,
   four manual effects, transport, buffering, touch size, and licence card.
2. ATLAS overlay A3/A3b/A4: complete the required exactly-three visual direction
   gate, then render the selected vehicle marker, road badge, and cardinal state.
3. ATLAS target-Tesla profiling at the deliberate 30 FPS map ceiling.
4. DISCOVER: exactly three image-led directions before implementation, reusing
   session-only ATLAS location context and source-correct Wikimedia attribution.
5. Gradient Field only after the ATLAS-derived passenger work above.
6. X10 LIGHT/DARK/AUTO visible controls and DARK token mapping.
7. Landscape-first iPhone presentation and inert portrait rotation notice.
8. Nice-to-have register: iPhone motion input, DRIVEY Aerial speed zoom, local
   CONDITIONS exceptions, grouped Visual Library, and future passenger controls.
