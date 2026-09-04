# Palette disclosure and Music alignment — 2026-09-05

## Scope and evidence

Owner refinement within the approved Balanced Rail direction. Product source
`ade6c84` follows the moving-touch correction `8dab1b3` and documentation
checkpoint `36d45f8`. Existing moving wake, six-second inactivity, completed-action
retraction, popup pinning and whole-journey diagnostics remain included.

Product Design audit used real before screenshots, then rendered frontend QA.
No frontend builder, new checkout or additional writer was used. Before captures
show the prior source; after captures show this refinement, all at 773 × 601.
The additional narrow check uses 390 × 844. The generative background is live and
may change between captures; comparisons concern the same controls and surfaces.

The owner-attached `.json.gz` decodes to the same report already read from the
received Gmail message, build 20260904-2351. It is not a new post-fix drive report.
No email was sent or modified; neither private attachment nor message is committed.

## Implemented

- One official Tabler Palette icon (28 px) plus a visible 14 px `Palette` label
  replaces the duplicated ten footer swatches. The selected palette remains in
  the accessible button name. The icon uses the active semantic accent.
- Swatches remain in the popup. Names use 13 px Title Case with zero tracking.
  Its width increases from 380 to 400 px so Graphite/Sulphur fit; below 420 px
  it uses four columns. Minimum 48/56 px action geometry is preserved.
- Music heading: 24 → 22 px at the Tesla viewport. Authored selection titles use
  15 px, filter labels/supporting copy 14 px, and Now Playing/credit metadata
  13 px. Track title in Now Playing: 17 → 15 px.
- Artwork (56 px), three text rows and three transport buttons share one vertical
  centre. The redundant `AUTHORED RECORDING · 1×` row is removed; `Crossfading`
  appears only during a real transition. Narrow layouts retain a separate
  full-width transport row. A broad old image rule no longer enlarges the tiny
  Now Playing icon to artwork size.
- Credit role columns size to `Current`/`Fading` content, keeping the title
  separate. Provider and licence links, QR, both audible credits and playback
  behavior remain intact. No audio engine/source change.
- The byte-identical Tabler v3.46.0 palette asset has an appended MIT inventory
  and verified SHA-256 in THIRD_PARTY_NOTICES.md.

## Local verification

- **629 native checks**, including actual PHP fixtures and **Sites 9/9**.
- **69 browser lifecycle checks**: 20 palette/appearance combinations, 180
  rendered text pairs, Atlas, Discover, popup/focus/closure, overflow, and controls
  deliberately reopened while acceleration is held continuously.
- **20 targeted browser checks**: icon/label/targets, all popup names, text
  contrasts, Music card containment/centres, credit non-overlap, page overflow,
  and narrow popup/card/transport geometry. Zero console warnings/errors under
  the established explicit `user-gesture-required` Chrome profile.
- Clean ARM64 production build with locked Vite 6.4.3: App 242 modules, LAB 154,
  then 10 post-build identity/Sites checks. Existing chunk-size advisory remains.
- `git diff --check` passes. Browser muted visual/copy inspection does not prove
  real audio, cabin-distance readability, touch hardware or sustained Tesla GPU.

Measured text minima for the changed controls (opaque/composited CSS sRGB):

| Surface | LIGHT | DARK |
| --- | ---: | ---: |
| Palette names / footer label | 13.96:1 | 13.76:1 |
| Music title / artist / credit text | 4.95:1 | 6.98:1 |

Transport buttons measure at least 49.32 × 48 px at 773 × 601; popup options
exceed 48 × 56 px. Artwork/copy/transport centre deviation is below 1 px.
The checks preserve a 13 px metadata floor instead of shrinking touch geometry.

| Comparison | Before | After |
| --- | --- | --- |
| Palette LIGHT | [Before](qa/2026-09-05-palette-music/before-palette-LIGHT.png) | [After](qa/2026-09-05-palette-music/after-palette-LIGHT.png) |
| Palette DARK | [Before](qa/2026-09-05-palette-music/before-palette-DARK.png) | [After](qa/2026-09-05-palette-music/after-palette-DARK.png) |
| Music LIGHT | [Before](qa/2026-09-05-palette-music/before-music-LIGHT.png) | [After](qa/2026-09-05-palette-music/after-music-LIGHT.png) |
| Music DARK | [Before](qa/2026-09-05-palette-music/before-music-DARK.png) | [After](qa/2026-09-05-palette-music/after-music-DARK.png) |

[Targeted measurements](qa/2026-09-05-palette-music/local-targeted.json),
[full matrix](qa/2026-09-05-palette-music/local-matrix.json),
[narrow Music](qa/2026-09-05-palette-music/after-music-narrow.png), and
[narrow Palette](qa/2026-09-05-palette-music/after-palette-narrow.png).
Publication proof is appended only after canonical verification.


## Canonical publication — 2026-09-05 00:57

Canonical **build 20260905-0051**, VERSION **0.0.0**, source **ade6c84**,
is verified at https://sedicivalvole.app/. The source checkpoint was pushed before
publication. Appended documentation is a later Git checkpoint; the product build
continues to identify its exact source commit.

Protected publication: **184 files / 215,962,935 bytes**, all 29 Illobo recordings
fully hash-verified, two preceding assets retained for cache overlap, no legacy
files/directories deleted. Read-only preflight and independent postflight passed.
**13 HTTP checks** confirm identical bare/cache-busted HTML, CSS, all emitted
JavaScript and the new palette icon. HTML remains no-store/no-cache; fingerprinted
assets may be cached only with byte identity verified. Diagnostic GET still returns
405 and protected LAB responds with its login surface. No diagnostic was sent.

Main JS: `index-CViWKRZs.js`, SHA-256
`a92bd81954c1e5af013a9e960b56371c24ec07ffdebc92ebd190fc9a9a1cd045`.
HTML SHA-256:
`bc667931f06d84f3ccd71bd12ff719cb944db63cc4d0db06a445dcc32f21bcd1`.

All **20 targeted browser checks** also pass against the canonical URL, with zero
console warnings/errors under the explicit user-gesture policy. **Four additional
live motion checks** confirm Vertigo wake across speed updates, usable/pinned Music,
close/visual-selection retraction followed by another successful wake, and the
six-second deadline while movement continues. Browser movement is synthetic.
Cabin readability, native touch/media, sustained GPU and an actual multi-hour
journey remain vehicle acceptance gates. The earlier default-Chrome AudioContext
startup warning remains a separate known follow-up; this change does not alter audio.

[Live targeted checks](qa/2026-09-05-palette-music/live-targeted.json),
[live moving checks](qa/2026-09-05-palette-music/live-moving.json),
[canonical identity](qa/2026-09-05-palette-music/canonical-evidence.json),
[publication](qa/2026-09-05-palette-music/publication.txt),
[postflight](qa/2026-09-05-palette-music/postflight.txt),
[live Palette DARK](qa/2026-09-05-palette-music/live-palette-DARK.png), and
[live Music LIGHT](qa/2026-09-05-palette-music/live-music-LIGHT.png).
