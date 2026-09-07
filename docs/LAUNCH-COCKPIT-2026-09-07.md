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
  Feeling lucky selects a genre, excluding the immediately previous genre. Every visit rolls a fresh genre, including after an explicit genre/pace/playlist
  choice. Exact choices remain in force for the current visit. Genre and pace are alternative filters,
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

## Compact Round Instruments refinement — 2026-09-07

The owner chose the second visual study, reduced both circular thumbnails to
64 px, and requested fresh genre/visual choices on every visit. The launcher
keeps two equal music/visual columns at 773 × 601 and stacks them on phones.
Feeling lucky rerolls the genre; Change rerolls the visual without opening a
dialog. Both sides retain Choose for precise selection. Random effects exclude
the previous family, Atlas and Discover; the latter remain deliberate passenger
choices. Gradient has one equal family probability, then selects one of its
three exact variants. Only the last visual identifier is stored for repeat
avoidance; no position is added to preferences.

Preview images are static, so the launcher never boots extra visual renderers.
Eight real visual captures use unchanged build 20260907-1316 at 773 × 601, with
only host controls hidden; their scene renderers match the current build. Music
uses the selected queue's actual cover only when the exact selection is ready,
with a 256 px generated generic music illustration during loading or image failure.
Existing score covers and the Illobo mark retain their established identities.
Atlas/Discover use the existing map icon. Preview failure never blocks START.
The generated generic illustration has no claimed artist/recording identity and
remains excluded original media under LICENSE-SCOPE. Tabler's two pinned MIT
Music/Engine icons extend the synchronized community inventory.

Presentation remains in launch-cockpit.jsx/css; launch-model.js now also owns
family-weighted visual roulette. App owns visit initialization, repeat memory,
exact-queue artwork and the unchanged startup/audio lifecycle.

Validation of this refinement: 655 native tests and 16 browser checks pass at
773 × 601, 390 × 844 and 1280 × 800, including reroll/reload, delayed queue
startup and Engine regression. All effect thumbnails together occupy less than
280 KiB after proportional 192 px export. See [design QA](../design-qa.md) and
[interaction evidence](qa/2026-09-07-round-launch/browser-evidence.json).

Production candidate 20260907-1400, source 7ab630b, implementation 74ea688:
17 post-build package tests and the same 16 actual-browser scenarios pass.

Build **20260907-1400**, source **7ab630b**, implementation **74ea688** is
canonical. All 22 checked HTML/compiled/new-image/icon resources are byte-identical
to the build; root and cache-busted HTML carry no-store/no-cache. Live Chrome
verifies loaded 64 px circles with actual Jazz cover art, immediate Change,
precise visual selection, real Jazz and Lobo playback and Rosso startup. Zero
page exceptions or diagnostic sends; six inherited pre-gesture audio warnings.
See [canonical evidence](qa/2026-09-07-round-launch/canonical-browser.json).

## Intrinsic height correction — 2026-09-07

The owner reported excessive empty vertical space on a tall Mac window. The
absolute top/bottom constraints and nested `1fr` tracks had stretched the sheet
and both choices with the viewport. The splash now lays out the sheet and footer
in normal flow; sheet/body rows use content height. Tall screens do not enlarge
selection groups. Short windows scroll the complete flow, including the footer.
Preset artwork grows from 16 to 36 px without growing the desktop preset row.
The existing 64 px main previews, 48/56 px targets, selectors and audio are intact.

Seventeen actual-browser scenarios pass, including an explicit 1280 × 800 versus
1280 × 1200 height-invariance assertion, 36 px preset geometry, Tesla 773 × 601
and phone 390 × 844 hit testing. See [tall Mac](qa/2026-09-07-launch-sizing/10-tall-mac.png)
and [browser evidence](qa/2026-09-07-launch-sizing/browser-evidence.json).

Production candidate **20260907-1520**, source **05bcf45**, implementation
**9f1f77b** passes the same five-viewport sizing matrix and 17 package checks.
Measured desktop/Tesla sheet: 502 px; choices: 138 px; preset images: 36 px.

Canonical **20260907-1520** / **05bcf45** passes all 22 HTTP byte/cache checks
and the exact five-viewport sizing matrix on the public site. The published
sheet remains 502 px and choices 138 px on tall Mac and Tesla screens; footer
follows the sheet, preset art is 36 px, and short windows scroll. Zero page
exceptions. [Live evidence](qa/2026-09-07-launch-sizing/live-evidence.json).

## Centered sheet and viewport footer — 2026-09-07

Owner follow-up supersedes the flowing footer placement: keep the compact sheet
centered on both viewport axes, independently anchor credits at bottom left and
Support at bottom right, and center Drive responsibly on the viewport. The
splash uses the visible viewport height, independently of the running shell's
legacy minimum height. On short screens the centered sheet scrolls internally;
the footer remains outside its scroll area and always reachable. Content sizes
and audio/selection behavior are unchanged. Five viewport measurements prove
zero center offset and fixed footer bounds; 17 launch scenarios and 655 native
tests pass. [Evidence](qa/2026-09-07-centered-launch/evidence.json).

Production candidate **20260907-1534**, source **e092752**, implementation
**f8e97fa** passes the five-viewport centering/footer matrix and 17 packaging
checks. Main controls and intrinsic sheet dimensions remain unchanged.

Canonical verification: build **20260907-1534**, source **e092752**. All five live viewport cases and 22 byte/cache checks pass; official independent postflight reports `remote_writes=NONE`. Fresh live screenshots and evidence are recorded in `docs/qa/2026-09-07-centered-launch/`. Physical Tesla acceptance remains separate.


## Support header refinement — 2026-09-07

The owner moved Support from the viewport footer to immediately after About,
with the shared yellow Buy Me a Coffee cup button at the same 48 px height.
The transparent light/dark 16 marks retain the existing source paths without
the square background; Drive responsibly sits directly below the wordmark.
Credits stay at the viewport bottom left and the compact sheet stays centered.
On narrow phones the support entry retains the cup and accessible full name.
The same shared button appears in Session report. The centered support dialog
makes the underlying diagnostic panel inert and restores focus to its origin.
Four viewport geometry/interaction checks and the diagnostic open/close path
pass with zero page exceptions. Browser plugin unavailable; isolated headless
Chrome is the established fallback. Local screenshots: /tmp/sv-support-qa/.

Canonical build **20260907-1557**, source **7ea0712**, implementation **ec0f459**
passes all four live viewport cases plus diagnostic support/focus behavior.
All 24 HTTP asset/HTML/cache identity checks pass, including both new transparent
marks. Live screenshots and JSON: `/tmp/sv-support-live/`; byte evidence:
`/tmp/sv-support-canonical/identity.json`.

Canonical 20260907-1557 live validation passes: four viewport cases and diagnostic
support/focus, 24 byte/cache checks, independent postflight `remote_writes=NONE`.
Fresh evidence: `/tmp/sv-support-live/`. Result: passed; physical Tesla remains separate.
