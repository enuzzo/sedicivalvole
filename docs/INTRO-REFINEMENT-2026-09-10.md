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
