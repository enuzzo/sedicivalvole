# Astra UI audit — 2026-09-04 office checkpoint

## Scope and status

The owner requested the complete ledger in `ASTRA-UI-HANDOFF-2026-09-04.md` in
the existing saved checkout, with one writer and no canonical deployment.
**This checkpoint is a tested semantic-colour foundation, not the completed UI
revision.** No component consumes the new resolver yet. Existing product pixels
and interactions remain unchanged.

## Start evidence

- The complete AGENTS, CURRENT-STATE, SESSION-HANDOFF and Astra handoff were read.
- HEAD, main, origin/main and a live read-only GitHub `ls-remote` all resolved to
  `dc8444124ddf92bcb48453b05428dfced5720028`; the working tree was clean.
- `fc61033..dc84441` contains only documentation changes. Dropbox was running;
  repeated Git checks were stable and no competing active project task appeared
  in the app inventory. This does not claim visibility into an offline home Mac.
- Host: Apple Silicon, Node 26.7.0, PHP present at `/opt/homebrew/bin/php`.
- Exact native esbuild/rollup cache was ready. A further lockfile comparison
  found stale shared Vite (6.4.2 versus 6.4.3) and PostCSS (8.5.16 versus
  8.5.26). Exact dependencies were installed with `npm ci --ignore-scripts` in
  `/tmp/sedicivalvole-locked-toolchain`; shared node_modules was not rewritten.
- No `.env` contents were inspected. Preview/build used temporary config wrappers
  with explicit environment loading disabled; no `_references/` content was copied.

## Product Design audit evidence

Actual local app: `http://127.0.0.1:5173/?qaMute=1&qaAtlasDemo=1`, viewport
773 × 601. The initial preview identifies documentation baseline dc84441.
Saved and inspected captures are outside Git:

1. `/tmp/sedicivalvole-astra-audit/00-before-atlas-light-resting.png` — LIGHT,
   SIGNAL, explicit Milan demo, panel open, chrome resting. The persistent mark
   is missing, and the panel has compressed uppercase labels/weak secondary ink.
2. `/tmp/sedicivalvole-astra-audit/01-before-atlas-light-awake.png` — same state,
   keyboard-focus wake after the 520 ms transition. Four 24 × 24 icon boxes
   start at y=20, 9.25, 0 and 20 px. This verifies the owner's annotated mismatch.

The earliest transition-time awake capture was rejected and replaced with the
settled capture. Document bounds were 773 × 601; inspected warning/error log
was empty. Palette targets measured about 18.6 × 4 px: visible swatches overflow
their actual hit areas. This fails the touch contract despite passing static tests.
The prior `.app.controls-resting .topbar` selector also overrides the later,
less-specific Balanced Rail selector and hides the mark.

In-app Browser selection, collapse, speed and history actions repeatedly returned
without changing the requested state, including after transition completion and
with the preview visible. Focus could wake chrome; no successful ACID selection
or full interaction audit is claimed. The requested Playwright headless fallback
remains awaiting the owner's answer under Product Design's explicit browser rule.

## Reference provenance

- The attached `SCR-20260904-sxus.png` is primary owner-supplied visual evidence.
- None of the eight Desktop reference filenames listed in the handoff exists
  on this host. No missing image was reconstructed or represented as inspected.
- [Tesla UI](https://www.teslaui.com/) was rendered and inspected. Its community
  implementation exposes #1a1a1a map/surface and #333333 secondary surfaces, with
  darker #000000 bands. These are community-reference observations, not official
  Tesla design specifications. The proposed DARK tokens use #1a1a1a, #0f0f0f,
  #262626 and #333333; LIGHT retains the owner's near-white #f4f4f4 baseline.
- The Figma community reference could not be retrieved. No measurements are
  attributed to that file.
- Authoritative accessibility thresholds come from W3C
  [text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
  and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

## Semantic foundation

`src/semantic-theme.js` centralizes 15 roles for all ten palettes and both
appearances. It preserves passing colours exactly, searches lighter and darker
Oklab lightness at fixed hue, reduces chroma only for sRGB gamut, and selects the
closer passing candidate in Oklab distance. Minimality is within this deterministic
lightness/gamut policy, not a claim of global perceptual optimality across all
colours. Ratios are checked after 8-bit sRGB quantization without threshold rounding.
The resolver is cached by palette object and appearance, outside animation work.

Every result retains raw/resolved colour, variant (`authored` or
`contrast-enhanced`), threshold, raw/resolved minimum ratio and actual background
set. Text/chart-label roles require 4.5; focus, boundaries and indicators require
3. Selected-surface accents and Underwater foreground have separate contexts.
Chart strokes may consume the stricter chart-text colour; translucent chart fills
must not be used as the sole meaningful stroke or data marker.

The reproducible [300-row matrix](ASTRA-SEMANTIC-CONTRAST-2026-09-04.csv) is
generated by `node prototype/drive-lab/scripts/report-semantic-contrast.mjs`.
For ACID secondary chart ink, LIGHT resolves #54ff29 to #1a7000, improving the
worst declared surface ratio from 1.026062 to 4.555543. DARK retains #54ff29 at
9.453719. These are resolver results, not yet rendered UI results.

## Verification at this foundation checkpoint

- Baseline `npm run test:native`: 602/602, including Sites 9/9 and the actual
  PHP diagnostic gzip fixture (no missing-executable exemption on this host).
- New semantic suite: 23/23; complete updated native suite: 625/625, zero skips.
- Automated matrix covers all 300 role variants and all declared backgrounds,
  retained authored values, hue drift under 3 degrees for chromatic derivatives,
  source-palette immutability, exact WCAG reference pairs and invalid contexts.
- ARM64 production build with the exact cached Vite/PostCSS and native tools:
  App 234 modules, protected LAB 154 modules, Sites packaging. Build retains the
  existing large-chunk advisory; it is not a runtime console warning.
- `git diff --check` passes. No deployment or physical-Tesla acceptance.

## Required continuation in this same task

The following work is **pending**, not inferred complete from static tests:

1. Resolve the owner's direction choice: Balanced Rail refinement (recommended,
   closest to the annotation), Instrument Rail, or Quiet Rail. AGENTS explicitly
   requires three directions and selection before a visual build. Resolve the
   headless-browser fallback question; do not request either again after answered.
2. Complete before captures: ACID LIGHT/DARK, awake/resting, ATLAS open/collapsed,
   DISCOVER with long real place names. Keep baseline images separate from after.
3. Wire semantic roles to App, drawers, Report, footer and Atlas canvas. Keep
   visual/artwork palettes and all vendor sources unchanged. Remove ad-hoc red
   selected accents and account for actual composited backgrounds.
4. Replace compressed Atlas uppercase with readable case and deliberate vertical
   spacing; preserve truthful range/chart data, attribution and collapse handle.
5. Remove Discover decorative result numerals, restore two-line names and revise
   the capacity calculation for the measured row height. Preserve native Minerva.
6. Normalize rail icon optics, common baseline and equal cells; fix the resting
   mark; audit footer and make palette targets truly 48/56 px compliant. A full
   5 × 2 board cannot supply ten 48 px targets inside a 64 px-high footer: use a
   full-cell palette trigger and a disclosed target-sized board if approved by
   the chosen direction. Do not silently shrink touch areas.
7. Make Underwater a persistent animated descendant matching the full speed
   badge footprint, with semantic palette surface/foreground and reduced motion.
8. Exercise all preceding regressions: Now Playing suppression/transport, Atlas,
   Discover full surface, drawer close/focus/chrome retraction, splash Jamendo
   warm-up/reuse, contextual controls/radius, Gradient brake frame pacing and
   density restoration, palette selection, Network disclosure/history, absence
   of generic Energy, palette-derived accents and independent appearance.
9. Compare after captures with before in all required states. Record unrounded
   contrast ratios, overflow, focus, touch geometry, console warnings/errors and
   measured performance. Repeat focused/full/Sites/build/diff gates after edits.
10. Append documentation/CHANGELOG evidence, commit verified checkpoints and push
    origin. Keep canonical deployment withheld until explicitly authorized and
    all applicable gates pass. Cabin/glare/touch, GPS, native Media Session,
    real-network first load, sustained GPU/frame/thermal and listening gates
    remain for the target Tesla.

## Completed integration following owner selection and browser authorization

The owner selected refined Balanced Rail and authorized Playwright/Chrome. The
foundation-only status and pending questions above describe the earlier checkpoint.
Implementation and all local gates are now recorded in
[ASTRA-UI-VERIFICATION-2026-09-04.md](ASTRA-UI-VERIFICATION-2026-09-04.md), including
70 rendered checks, the complete integrated colour matrix and portable before/after
captures. Canonical deployment and target-Tesla acceptance remain separate and open.
