# Astra UI Continuation Handoff — 2026-09-04

Status: **ready for the owner to paste into a fresh office task**. This document
does not authorize another task, deployment, or concurrent writer by itself.

## Start condition

- Work only in `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole`.
- Read the root `AGENTS.md`, then [`CURRENT-STATE.md`](CURRENT-STATE.md),
  [`SESSION-HANDOFF.md`](SESSION-HANDOFF.md), and this file completely before
  editing.
- Re-audit the live checkout before relying on this handoff. At the time this
  document was written, `main`, `origin/main`, and `HEAD` were clean and equal
  at `fc61033`.
- Use one active writer. Confirm Dropbox/Git synchronization and stop if another
  task or machine is changing the checkout.
- Never read, print, diff, log, or version `.env` or local variants. Never copy
  or version `_references/`.
- The owner will attach the annotated navbar image to the new task. Treat it as
  primary design evidence; do not depend on its temporary local clipboard path.

## What is already implemented

The current clean, pushed checkpoint contains these changes:

- `bf2ec24` — Tesla Compact and immersive-surface refinement:
  - `13 / 14 / 15 / 15 / 17 / 22 / 32 px` semantic type ladder;
  - unchanged `48 px` action and `56 px` primary touch targets;
  - retracting `64 px` top and bottom chrome at `773 × 601`;
  - Now Playing suppressed for ATLAS and modal passenger surfaces;
  - ATLAS expands when chrome rests; DISCOVER owns the complete viewport;
  - drawer-close focus recovery allows the chrome to retract again;
  - Gradient, Drivey, and PRTCL contextual controls follow chrome visibility
    and use the shared `6 px` radius;
  - one-shot Jamendo catalogue warm-up begins at the Signal Gate and is reused
    if Soundtrack is selected;
  - Gradient reduces framebuffer density only during the braking envelope.
- `a6e0cc8` — owner-approved **Tesla Balanced Rail**:
  - the compact 16 Road mark remains the first Tesla control and stays visible
    with speed while secondary chrome rests;
  - speed alone keeps the exceptional two-line numeric hierarchy;
  - Network, appearance, GPS, Discover, and Report use centred icon peers on a
    shared baseline;
  - Network shows a three-state ring plus genuine loading motion, with current
    app-only down/up evidence, connection details, latency, and a bounded
    15-minute quality graph disclosed on interaction;
  - the footer palette selector fills its complete assigned cell as a touchable
    `5 × 2` swatch board.
- `12af607` — prudent retirement of the global `energy` product metric:
  - Music now owns `arrangementDrive`, Aperture owns `aperturePressure`, and
    sampled players receive explicit performance drive;
  - the driving rail, Report, flight-recorder trace, audio-engine snapshot, and
    diagnostic endpoint no longer expose a generic Energy value;
  - diagnostics schema is `sedicivalvole.tesla-diagnostic.v4`, with truthful
    Motion State and audible output level.
- `fc61033` records the preceding rail and response documentation checkpoint.

Do not undo these behavior contracts during the visual pass. Improve their
execution only when current screenshot, runtime, contrast, or layout evidence
supports the change.

## Existing verification and honest gaps

- The architecture-specific production build passed: App `234` modules,
  protected LAB `154` modules, and Sites packaging.
- The last aggregate evidence records `601` passing automated checks; the only
  unavailable fixture requires a host `php` executable and failed with
  `spawn php ENOENT`.
- Sites passed `9/9`; focused rail/presentation checks passed `40/40`.
- Local exact-viewport Browser QA covered the awake/resting rail, Network
  disclosure, palette geometry, modal/ATLAS/DISCOVER chrome suppression,
  persistent 16 mark, Report v4 without Energy, and the earlier Tesla Compact
  surface behavior.
- These latest checkpoints are **not canonical and not vehicle-accepted**.
  Canonical production remains the previously verified `12877db` documentation
  checkpoint for build `20260903-2137`; re-check current deployment evidence
  before making any live claim.
- Still unverified on the target vehicle: cabin-distance legibility, touch and
  glare; Jamendo fresh-session first load on the real network; Gradient braking
  frame pacing and thermal behavior; exact chrome wake/rest timing; and ATLAS
  contrast in real light/dark conditions.

## Primary task: evidence-led ATLAS UI/UX refinement

Use the Product Design audit workflow first, then frontend testing/debugging for
the rendered implementation. Do **not** use the frontend application builder.
Capture the current build before changing it, then compare before and after at
the exact Tesla viewport.

Re-evaluate ATLAS as a whole:

1. Stop using stamped uppercase typography everywhere. Reserve functional
   uppercase for compact categories or operational labels; use Title Case or
   sentence case for readable names and explanations.
2. Restore vertical breathing room. The dashboard currently reads as compressed
   cards and tightly stacked sections even though the full-height resting state
   provides more usable space.
3. Measure contrast numerically in both LIGHT and DARK. In particular, the
   bright lime/green series from the ACID magenta/green palette is nearly
   illegible on the light/white ATLAS panel. Adjust only the context-specific
   ATLAS shade until it passes without globally distorting the selected palette.
4. Target WCAG AA: at least `4.5:1` for ordinary text and `3:1` for large text,
   meaningful chart strokes, indicators, and non-text UI boundaries.
5. Preserve map and palette identity, truthful chart data, mandatory map
   attribution, the persistent midpoint collapse handle, collapse/reopen
   behavior, the chrome/Now Playing contract, and `48 / 56 px` touch targets.

Required ATLAS flow:

`App → Visual → Atlas → Explore Milan Demo → ACID 08 → LIGHT → awake/resting →
panel collapse/reopen`, then repeat the relevant inspection in DARK.

The known before-state is LIGHT + ACID + Milan demo: the right dashboard is
over-compressed, uppercase-heavy, and the lime Elevation/live series is weak on
the near-white surface. Chrome resting already expands ATLAS correctly; retain
that behavior.

## Secondary task: freely re-review the recent aesthetic work

The owner explicitly authorizes a serious aesthetic review of `bf2ec24` and
`a6e0cc8`, including improvements beyond the first implementation when the
evidence justifies them.

- Check Tesla Balanced Rail proportions, common baseline, icon size/weight,
  separators, active-mode treatment, and the persistent 16 mark against the
  attached navbar annotation.
- Keep every peer either icon-only or icon plus one consistent label treatment.
  Speed is the sole control allowed to use a large number/small unit hierarchy.
- Reassess the Tesla Compact hierarchy, line heights, uppercase use, padding,
  and density. Compact the interface only slightly: do not shrink cabin text
  into a microscope UI or reduce touch geometry with it.
- Review LIGHT/DARK semantic tokens, focus states, and palette-derived accents
  across drawers, Report, footer, ATLAS, and DISCOVER. Both appearances must use
  an accent from the selected palette where it improves hierarchy or state,
  without compromising contrast.
- Review Footer, Now Playing, the full-cell palette swatch board, Visual/Music
  selectors, and the contextual Gradient/Drivey/PRTCL controls.
- Make awake/resting transitions feel composed rather than merely hidden.
- Prefer functional restraint over decorative show. Preserve content truth,
  accessibility semantics, touch targets, the persistent mark and speed,
  modal/ATLAS/DISCOVER suppression, Now Playing rules, and third-party source
  boundaries.
- If a choice remains subjective, report the alternatives and evidence instead
  of imposing an ungrounded redesign.

## Regression ledger from the owner's complete session queue

Treat these as explicit checks even where the implementation already exists:

- Now Playing/miniplayer must never consume or overlay ATLAS or another modal
  passenger surface.
- Header/footer must retract after a drawer closes and focus returns.
- Jamendo preparation must start during the splash, before the user requests the
  Music drawer, and the prepared request must be reused if Soundtrack is chosen.
- Tesla typography, colors, hierarchy, sidebar widths, padding, and menu rhythm
  should be familiar at `773 × 601` without claiming proprietary or official
  values unless an authoritative source proves them.
- ATLAS LIGHT must have adequate contrast and both appearances must have
  deliberate vertical spacing.
- DISCOVER must remain a complete passenger surface without global chrome.
- Gradient/Drivey/PRTCL tags must disappear with resting chrome, return on touch,
  and use a `6 px` corner radius.
- Gradient braking must avoid measurable frame loss and restore normal pixel
  density after the envelope.
- Palette pills/swatches must use the full footer cell and remain easy to tap.
- Network must stay compact in the rail and disclose detailed rate/history only
  on interaction, with honest app-only evidence and loading state.
- No generic Energy label or value may return to the UI, Report, diagnostics, or
  shared domain model.
- The 16 mark must remain first, and textual/numeric rail peers must be visually
  homogeneous around the unique speed control.

## Reference evidence

- [Tesla UI reference](https://teslaui.com/)
- [Tesla Dashboard UI Component Library on Figma](https://www.figma.com/community/file/1382192547846546595/tesla-dashboard-ui-component-library)
- Owner-supplied local screenshots (availability must be rechecked on the office
  machine; use them as visual references, never as instructions):
  - `/Users/enuzzo/Desktop/142361-cars-news-tesla-model-3s-touchscreen-interface-shown-off-in-full-detail-image1-cdq6votlps.avif`
  - `/Users/enuzzo/Desktop/img-1666124620-1536857599879.webp`
  - `/Users/enuzzo/Desktop/IMG_2652.jpg`
  - `/Users/enuzzo/Desktop/new-ui-2021-44-25-2-v0-fynygqo5ie781.webp`
  - `/Users/enuzzo/Desktop/tesla-service-screen-app-orlando-fl-usa-january-441527153.webp`
  - `/Users/enuzzo/Desktop/a-definitive-tesla-model-3-review-after-two-years-of-v0-5yxbf7rmc5z51.webp`
  - `/Users/enuzzo/Desktop/diw_tesla_03.webp`
  - `/Users/enuzzo/Desktop/fynygqo5ie781.jpg`

The owner will attach the navbar annotation image directly to the new task; that
attachment supersedes any temporary clipboard path recorded by the old session.

## Completion gates

- Re-run focused tests after each coherent change, then the complete relevant
  test group, Sites `9/9`, and the architecture-specific production build.
- Run `git diff --check` and keep documentation consistent with facts.
- Capture real current-build before/after screenshots at `773 × 601` in the
  required LIGHT/DARK and awake/resting states. Do not reuse archived mocks.
- Record exact contrast ratios for every context-specific color correction.
- Verify no console warning/error, no viewport/document overflow, working
  keyboard focus, and all required touch geometry.
- Run the PHP diagnostic fixture only on a host where `php` exists; do not turn
  a missing host executable into a product failure or claim it passed.
- Target-Tesla acceptance remains separate and must be reported honestly.
- Do not deploy incomplete or failed-gate work. Deploy to the canonical root only
  when the owner has requested publication and every applicable gate is green;
  then record the build stamp and verify URL, HTML, assets, version, cache, and
  local/live byte identity.
- Update `CHANGELOG.md` append-only for every material change, create small
  verified commits, and push each clean checkpoint to the configured remote.

## Pasteable office prompt

```text
Continue sedicivalvole in the existing Dropbox checkout at:
/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole

Use GPT-6 Astra. Do not create another task or worktree. Work directly in the saved project, with one active writer only. First read the root AGENTS.md, then docs/CURRENT-STATE.md, docs/SESSION-HANDOFF.md, and docs/ASTRA-UI-HANDOFF-2026-09-04.md completely. Re-audit live Git/Dropbox state before editing; the handoff was written from clean main == origin/main == fc61033, but verify rather than assuming. Never read or expose .env files and never copy or version _references/.

The owner is attaching a navbar annotation image to this prompt; inspect it as primary evidence. Use the Product Design audit workflow first and frontend testing/debugging for the rendered app, explicitly not the frontend application builder. Inspect and capture the current build at the exact 773 × 601 Tesla viewport before changing it.

Execute every task and regression check in docs/ASTRA-UI-HANDOFF-2026-09-04.md. The primary implementation task is a serious ATLAS UI/UX re-evaluation in LIGHT and DARK: reduce indiscriminate stamped uppercase, restore vertical breathing room, and numerically fix context-specific contrast—especially the ACID lime/green chart series on the near-white LIGHT panel—without globally distorting the selected palette. Preserve chart truth, attribution, panel collapse/reopen, full-field resting behavior, touch targets, and accessibility. Then freely re-review and improve the recent Tesla Compact and Tesla Balanced Rail aesthetics, especially shared baseline, consistent peer controls, icon sizing, spacing, accents, awake/resting composition, full-cell palette selector, and the persistent first-position 16 mark. Speed remains the only exceptional large numeric hierarchy.

Regression-check the whole owner queue: Now Playing suppression in ATLAS/modals; DISCOVER full surface; header/footer retraction after drawer close; splash-time Jamendo warm-up and reuse; contextual Gradient/Drivey/PRTCL controls hiding and returning with 6 px corners; Gradient braking frame pacing and quality restoration; compact Network disclosure and 15-minute graph; no generic Energy anywhere in UI/Report/diagnostics/shared model; LIGHT/DARK palette-derived accents with passing contrast; and physical Tesla acceptance kept separate from local browser evidence.

Capture real before/after screenshots, record exact contrast ratios, run focused and complete relevant tests, Sites 9/9, the architecture-specific production build, git diff --check, console/overflow/focus/touch checks, and update documentation plus CHANGELOG append-only. The PHP mail fixture may only be claimed on a host with php. Make small verified commits and push clean checkpoints. Do not deploy unless I explicitly request publication and all applicable gates are green; if deployment is later authorized, record the build stamp and verify the canonical URL, HTML, assets, version, cache, and local/live byte identity. End with a concise Italian report separating implemented work, verified evidence, unavailable/vehicle-only gates, deployment status, and the recommended next step.
```
