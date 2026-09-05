# Night Glass — first curated experience, 2026-09-05

## Product

The owner explicitly delegated creative selection and implementation of a
surprise experience. This superseded the three-direction selection gate for this
bounded work. The first implemented experience is **Night Glass**:

- The unchanged **Vertigo** / Infinite Lights runtime.
- **Graphite**: silver and restrained blue light against black.
- **DARK** appearance.
- The existing **Ambient** Jamendo selection, with continuous native-tempo music
  at rest and in motion. This is a rotating genre selection, not a newly authored
  recording or a guarantee of a fixed track sequence.

A real-render comparison rejected Japanese Mist for this particular mood: the
observed chromatic grain was too aggressive for a quiet night composition. That
observation is not a proven upstream defect or target-Tesla result. No ShaderGradient
setting or dependency was changed. The real Vertigo/Graphite capture became the
preview image; no generated mock or external reference material entered the repo.

## How to try

From the splash, press **PLAY THE ROAD**, choose **Night Glass**, then **START**.
The choice prepares its catalogue silently; START owns playback. In the running
app, open **Visual → Play Night Glass**. This selects the composition, starts music
through the existing explicit playback handler, closes Visual and retracts chrome.

Music, palette, appearance and visual controls remain independent. Changing one
removes the experience's selected indication when the complete combination no
longer matches. Reload restores individual preferences and derives the indication
from those settings. No new preference schema, audio engine or renderer is created.
A failed catalogue request does not block the visual or trap controls: Music remains
available for recovery, and a retained old music selection cannot claim a matching
complete experience. Media availability and real listening remain separate gates.

## Architecture and boundaries

`src/curated-experiences.js` is a small immutable registry plus pure apply/match
functions. It returns one coherent set of existing selection fields and preserves
unrelated settings (mute, effects, score and tuning). App owns the actual state
updates; the Soundtrack controller retains its existing cancellation, buffering,
transition and failure behavior. The shared `ExperienceCard` is rendered in launch
and the existing Visual drawer; no new drawer or background animation was added.
The launch diagnostic includes the requested experience ID; semantic selection
events also retain the experience and entry source without personal data.

The layout keeps the 773 × 601 launch music/visual grid aligned. The 82 px curated
launch target is above that grid; descriptions compact to the existing 13 px
metadata role. The running card uses 22 px title / 14 px description / 13 px
metadata and the centralized LIGHT/DARK semantic colours. On narrow screens,
15 px choice titles wrap without reducing the touch targets.

## Local verification

- **632 native checks**, including the actual PHP fixtures and **Sites 9/9**.
  Three new checks cover real registry targets, atomic immutable selection with
  preserved preferences, and removal of a false match after independent changes
  or a failed music selection. The existing Gradient source assertion now accepts
  clearing the experience label while retaining the remembered Gradient variant.
- **69 browser regression checks**: palette/appearance matrix, Atlas, Discover,
  focus/closure, retraction, no overflow and deliberate control access during
  continuously changing speed.
- **16 experience checks** at 773 × 601 and 390 × 844: all launch targets fit;
  no media `play()` before START; actual media time advances after START; exact
  visual/palette/music/appearance selection; inactivity; running selection and
  closure; independent customization; moving wake; and restored preferences.
- **Two controlled failure checks**: a 3.5-second late catalogue cannot start
  playback after choosing Mute; an explicit Ambient HTTP 503 leaves the visual
  running and Music reachable. The 503 is a deliberate fixture, not a production
  failure. No diagnostic/email was sent.
- Chrome headless with `user-gesture-required`; process audio output muted while
  media playback/time continued. Main experience and regression runs report zero
  warnings/errors. This does not establish listening quality or Tesla-native media.
- ARM64 production: App **244** modules, LAB **154**; **10** post-build identity/
  Sites checks. Existing chunk-size advisory remains. Main JS **754,951 bytes**,
  an increase of **2,813 bytes** over 0051. The real preview PNG is **194,784 bytes**.
  No additional render loop or audio graph; no wall-clock endurance/FPS claim.
- `git diff --check` passes. Code checkpoint: **604b24c**.

[Before launch](qa/2026-09-05-night-glass/before-launch.png),
[launch](qa/2026-09-05-night-glass/local-launch.png),
[selected](qa/2026-09-05-night-glass/local-launch-selected.png),
[Visual library](qa/2026-09-05-night-glass/local-visual-library.png),
[resting](qa/2026-09-05-night-glass/local-resting.png),
[narrow](qa/2026-09-05-night-glass/local-launch-narrow.png),
[experience checks](qa/2026-09-05-night-glass/local-experience.json),
[failure checks](qa/2026-09-05-night-glass/failure-checks.json), and
[regression matrix](qa/2026-09-05-night-glass/local-matrix.json).

Publication evidence is appended after canonical verification. Morning acceptance:
try the full composition on the target Tesla, judge the Ambient selection and the
new entry's legibility, and confirm touch wake remains usable during the journey.
Multi-hour Sunday acceptance, travel ATLAS/statistics and Engine study review remain
separate work; this change does not implement those drafts.

## 2026-09-05 01:47 — Publication and owner-directed refinement

Build **20260905-0116**, source **604b24c**, was published: 185 files / 216,162,700 bytes, all 29 Illobo recording hashes verified. Fourteen canonical HTTP/asset identity checks and 16 live experience checks passed with no console warnings/errors. Initial independent FTP postflight rejected the new `experiences` root directory; the verifier now admits that exact directory only through the existing recursive byte-identity guard, with altered/unknown-preview tests. This is a verifier correction, not a waived identity gate.

The owner then requested the two supplied round Lobo marks, a shorter UNDERWATER badge, a more song-oriented Night Glass and a livelier second experience. The new marks are byte-identical replacements under the existing public filenames; root inputs were relocated into these asset paths, and their old/new deployment identities are explicitly recorded. The eight-second light/dark crossfade and reduced-motion behavior are unchanged. UNDERWATER is now 32 px tall beneath the unchanged 64 px speed control, with its palette-safe colors and reveal/retract animation retained.

Night Glass now selects **Vertigo / Graphite / DARK / Lounge**. **Neon Groove** selects **Aperture / Neon / DARK / Funk**. Both appear as equal, compact cards in the launch selector and Visual library, using real renderer captures. One coherent selection still flows through the existing music and visual owners. The cards introduce no autoplay before START, new audio graph, renderer, catalogue schema or dependency. No claim of individually auditioned recordings is made; genre catalogues vary and Tesla listening remains required.

The earlier Ambient musical acceptance note is superseded by this owner feedback and the appended MUSIC-CRAFT entry. Travel ATLAS, a separate statistics visual, Engine work and the real Sunday endurance drive remain pending.

### Refinement validation before publication

634 native checks pass, including Sites 9/9 and the actual PHP 24-hour gzip round-trip. The local browser matrix passes 69 checks with zero warnings/errors; Night Glass and Neon Groove each pass 16 end-to-end checks, including actual advancing media time, silent preparation, persistence, moving wake and retraction. Slow catalogue/Mute and catalogue-failure fixtures pass. LIGHT/DARK geometry proves a 32 px UNDERWATER badge immediately below a 64 px speed control. Both supplied SVGs load and crossfade at the unchanged 0/4/8-second keyframes. Evidence is under `docs/qa/2026-09-05-groove/`.

### 2026-09-05 01:59 — Canonical publication verified

Live at **https://sedicivalvole.app/**: build **20260905-0152**, source **202e100**. Official publication verified **186 files / 216,249,308 bytes**, all **29 Illobo tracks** by full hash, and retained two prior assets for cache overlap. Preflight and independent read-only postflight pass. Seventeen public HTTP checks prove bare/cache-busted canonical HTML, all JS/CSS bytes, both round SVGs, both experience previews, LAB availability and diagnostic method boundary. HTML remains no-store. Night Glass and Neon Groove each pass 16 live browser checks with zero warning/error output. Live capture scripts await image decoding to avoid treating a pending request as missing artwork.

The automatic review initially rejected the official script's internal configuration access despite recovered earlier consent. The owner directly renewed the narrow exception for official preflight/publication/postflight without displaying or logging configuration; the official flow then completed. No alternative credential route was used. No diagnostic email was sent.

Changed card text measures at least **4.95:1 LIGHT / 6.98:1 DARK**, with 357 × 82 px targets and a visible 3 px focus outline at 773 × 601. The build has a pre-existing large-chunk advisory; real Tesla GPU, listening quality and multi-hour journey acceptance remain open.
