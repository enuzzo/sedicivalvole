# Launch Cockpit — 2026-09-07

## Decision and scope

The owner requested immediate Engine/Music selection, precise Soundtrack choices
and a lucky option, and explicitly delegated the design decision and implementation.
Three directions were presented: Cockpit, Two Paths, and Quick Start. Cockpit was
selected under that delegation. This supersedes the older introductory brand click
and the extra selection-approval gate for this specific redesign.

The public mode name is **Music**; **Flux** remains the internal identifier and
historical creative name. Music contains Soundtrack, Play the Road and Visuals only.
Engine is an equal first-screen choice with Mono, Rosso and Touring profiles.

## Behavior

- One immediate screen and one contextual START action. Preserve the Signal Gate
  artwork, real brand mark, palette tokens, source/creator links and support dialog.
- Soundtrack: choose one of 15 genres, one of three pace filters, or Lobo Playlist.
  Feeling lucky selects a genre, excluding the immediately previous genre. New
  installations use lucky mode; explicit genre/pace/playlist choices persist.
  Lucky mode rolls again on the next visit. Genre and pace are alternative filters,
  not simultaneous criteria. Pace never changes a recording's playback rate.
- Night Glass and Neon Groove still bind existing music, visual and appearance.
  All eight visual choices and three exact Gradient variants remain reachable.
  Play the Road lists only the three implemented scores.
- Preparation remains silent. START begins the visual independently of catalogue
  latency. The exact selected queue resumes when ready; a retained old queue must
  never play while the replacement selection is loading. Saved mute is respected.
- Engine has no music picker or Flux effects. Its bank retry, shared AudioContext,
  stationary controls and dry audio path remain unchanged. Repeated START is guarded.
- About contains build identity, local-check/privacy copy and RESET SAVED STATE.
  Modal keyboard focus, Escape and return focus use the existing dialog owner.

## Design and architecture

A generated Cockpit reference informed the single-panel hierarchy; actual product
screenshots below are browser captures. The implementation keeps native typography,
real brand assets and 48/56 px targets. The preset label shares its row to preserve
those targets at 773 × 601. The phone layout stacks Engine profiles and selection
controls; this does not close the separate running iPhone control-shell milestone.

`launch-cockpit.jsx` owns presentation and local picker disclosure. `App.jsx` retains
preferences, selected experience, one audio lifecycle and catalogue recovery.
`launch-model.js` owns random genre selection and exact-queue startup checks.
No dependency, upstream renderer, sample or recording was added or changed.

Research: [NN/g progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
informed deferring genre/pace lists; [MDN Web Audio practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
and [autoplay guidance](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
informed retaining the explicit START gesture. These are studies, not copied code.

## Verification

- 650 native regression tests pass. Ten retired assertions described the removed
  two-screen markup; five behavioral launch-model tests and actual-browser coverage
  replace that implementation-specific coverage.
- Headless Chrome: 15 end-to-end checks including exact delayed-genre startup,
  repeat START, saved mute, reload policy, presets, picker focus and zero diagnostic
  sends. Geometry/hit testing covers Music and Engine at Tesla 773 × 601, both
  phone layouts at 390 × 844 and a 1280 × 800 viewport.
- Screenshots are inspected in light/dark appearances against the selected layout.
  The standalone Vite server lacks the production Lobo catalogue; local QA supplies
  explicit synthetic metadata/audio fixtures. Real public catalogue verification
  is a separate publication gate.
- Chrome's default autoplay policy emits inherited AudioContext warnings during
  silent preparation. The tests require zero media play before START and successful
  playback after it; no unexpected resource failure or page exception is accepted.
- Physical Tesla touch, native media behavior and listening remain owner checks.
  Browser viewport verification is not target-vehicle acceptance.

Evidence: [browser checks](qa/2026-09-07-launch-cockpit/browser-evidence.json),
[Music](qa/2026-09-07-launch-cockpit/01-music.png),
[Engine](qa/2026-09-07-launch-cockpit/05-engine.png).


## Canonical publication

Build **20260907-1238**, source **4e8ee1f**, implementation **4612da6**, is live.
Official preflight/publication/postflight and 28 public byte-identity checks pass.
Public Chrome verifies actual Jazz and Lobo playback, shared context and direct
Rosso Engine startup; no page exception or diagnostic transmission. Six inherited
pre-gesture AudioContext warnings remain recorded. The browser test explicitly
observes detached media elements and non-empty playback-rate evidence.
[Publication details](DEPLOY.md#launch-cockpit--2026-09-07-1249).
