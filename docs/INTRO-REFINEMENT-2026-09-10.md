# Compact Intro refinement — 2026-09-10

The owner selected A, then explicitly rejected its oversized covers and broad restyling. The implementation preserves the current Intro shell and palette instead: 80 px square artwork, 6 px corners, two equal content columns and compact icon actions to the right. Existing 48/56 px targets and START styling remain; short screens scroll within the bounded existing sheet.

## Behavior

- Soundtrack is the default for missing, invalid or reset preferences. An explicit saved Play the Road source is preserved. No audio starts before START.
- Mute replaces Visuals only and still starts the selected visual without music.
- The prepared track title and artist use the same readiness/signature gate as its cover. Loading a different selection clears the old metadata and shows Finding a track. Genre remains visible; long titles use ellipsis with full title text available.
- Choose uses original small music/grid outline glyphs. Both random actions use an original die icon and the existing non-repeating selection helpers. Random has lower visual emphasis and no disclosure arrow.
- Eight genre-linked presets reuse existing shipped visual artwork and themes. The original two definitions remain unchanged. Two unique recommendations are sampled once on Intro mount and remain stable during interaction; the selected preset stays visible.
- Palette cycles the existing theme catalogue immediately, showing its current swatch and an accessible current-name title. It does not open a dialog or reroll recommendations.

## Fidelity and verification

Compared the current canonical baseline and revised browser capture at 773 x 601: exact semantic surface/text/line/accent values match (`#f4f4f4`, `#171a20`, `#60636a`, `#c50005`); the shell, mode/source controls, font families and START are preserved. Covers change from 64 px circles to 80 px squares, and the content/action row remains below 140 px rather than scaling with tall screens. The rejected Image Gen artwork is not imported. Owner-authorized deviations from concept A are smaller artwork, original palette/START, original compact container and no Random disclosure carets.

852 native tests pass. `scripts/qa-launch-refinement.mjs` verifies real handlers using controlled catalogue/audio fixtures: fresh Soundtrack, prepared title/artist, genre choice, non-repeating music/visual randomization, palette without dialogs, stable recommendations, coherent presets, Mute, no pre-START playback and no browser errors. Chromium screenshots cover 773 x 601, 874 x 402, 956 x 440, 390 x 844 and 1280 x 800/1200; tall windows do not expand the selection row and all controls retain 48 px minimum heights. Browser fixture mail requests are blocked. Physical Tesla/iPhone acceptance remains separate.

Publication evidence follows after the verified build is deployed.

Transparent black SVG previews retain the previous light backing in dark mode; the original artwork remains unchanged. The 20260910-1113 candidate was not activated: publication was cancelled to include this contrast correction, and the prior canonical identity was verified afterward. Eight browser user-flow checks now pass, including dark Air Atlas preview and saved-source persistence.

## Compact Intro published — 2026-09-10 11:26

Canonical build **20260910-1118.653acea**, source **653acea**, passed official preserve-existing complete-upload verification: 38 files / 17,052,516 bytes uploaded, 796 verified unchanged files and all 29 audio masters reused, two previous assets retained. No legacy deletion. The release manifest verifies 807 exact static hashes; 24 independent canonical HTTPS identity/hash/cache checks pass.

Eight controlled Chrome user-flow checks pass on the canonical build, including matching track metadata, 80 px square artwork, exact original UI colors, two stable preset recommendations, immediate palette, independent random actions, Mute, saved-source persistence, dark SVG contrast and compact responsive geometry. Live unmocked catalogue evidence at 773 x 601: World / CD1 07 About the Skies / PeerGynt Lobogris, matching cover and original Aperture preview, with no page errors. All 852 native tests and 196 dependency credits pass. No synthetic diagnostic mail. Physical Tesla/iPhone acceptance remains separate.

The accepted result is an incremental correction of the existing Intro; oversized generated concepts are rejected and no generated artwork is shipped. Implementation, changelog and publication evidence are committed and pushed.
