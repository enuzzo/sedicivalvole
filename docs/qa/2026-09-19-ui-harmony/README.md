# UI harmony — September 19, 2026

The owner rejected the previous layout and the workaround that hid the logo on
maps. The current contract keeps logo and instantaneous speed adjacent at the
left. Contextual actions share a reserved lane at the right; whole groups wrap
when space runs out. Global chrome and contextual actions remain complementary.
Modal drawers retain their own focus boundary.

## Findings resolved

| Observed problem | Implemented correction |
| --- | --- |
| Variant labels or map controls occupied the logo cell | Shared `ContextualRail` with explicit identity reservation |
| Logo disappeared on maps or while moving | Persistent logo and speed in the actual topbar grid |
| Brand was too small | 52 px mark, 48 px on compact/phone layouts; existing 64/56 px bar height |
| First logo/speed tap could activate an action or immediately rest again | Consume the first pointer click before activation and post-action focus |
| Fly With could programmatically scroll the entire app and crop the scene | Clip the app viewport; keep deliberate drawer scrolling |
| Short Fly With card lost lower telemetry or collided with return | Reserve card width, shorten its awake minimap and clear attribution |
| Short Engine instrument collided with the header or TAMARRO | Measured crest, graph and vertical spacing; all values remain present |
| Reference specimens did not represent the current control state | Shared context provider includes visual and Atlas specimens |

## Rendered evidence

Actual browser screenshots accompany read-only DOM geometry in
[geometry.json](geometry.json). The 30 recorded final application checkpoints
have no pairwise overlap among visible topbar/contextual buttons, no such button
outside the viewport, and no target below 48 px (0.5 px rounding tolerance).
Every recorded app viewport has `scrollTop: 0`. These measurements complement
visual inspection; they are not a blanket accessibility or performance audit.

| Scenario | Evidence |
| --- | --- |
| Previous canonical collision, 773 × 601 | [Before](01-before-gradient-tesla.png) |
| Drivey NORMAL / WIRE, LIGHT / DARK | [LIGHT](final-drivey-tesla-light.png), [DARK](final-drivey-tesla-dark-wire.png) |
| Prtcl, both type choices exercised | [DARK](final-prtcl-tesla-dark.png), [LIGHT](final-prtcl-tesla-light.png) |
| All three Gradient variants | [Mist](final-gradient-mist-tesla-dark.png), [Orchard](final-gradient-orchard-tesla-dark.png), [Silk](final-gradient-silk-tesla-light.png) |
| Moving 42 km/h input, reduced-motion preference, compact Tesla | [Drivey](final-drivey-moving-reduced-tesla.png), [Atlas](final-atlas-moving-reduced-tesla.png), [Vertigo](final-vertigo-moving-reduced-tesla.png) |
| Other visual families, compact Tesla | [Aperture](final-aperture-moving-tesla.png), [Meridian](final-meridian-moving-tesla.png) |
| Tablet 768 × 1024, resting/awake and FX | [Atlas](final-atlas-tablet-dark.png), [Awake](final-tablet-awake-dark.png), [FX](final-fx-tablet-dark.png) |
| Desktop 1440 × 900, both appearances | [Atlas DARK](final-atlas-desktop-dark.png), [Atlas LIGHT](final-atlas-desktop-light.png) |
| Phone 852 × 393, both control states | [Atlas](final-atlas-phone-light.png), [Awake](final-phone-awake-light.png) |
| Phone 667 × 375, wrapping and readable detail | [Atlas LIGHT](final-atlas-phone-narrow.png), [Atlas DARK](final-atlas-phone-narrow-dark.png), [Radar](final-radar-phone-narrow-dark.png), [Aircraft detail](final-radar-detail-phone-narrow.png) |
| Fly With 667 × 375, complete telemetry | [Resting](final-flywith-phone-narrow-dark.png), [Awake](final-flywith-phone-awake.png) |
| Engine stationary, retained central instrument | [Tesla](final-engine-tesla-dark.png), [Phone LIGHT](final-engine-phone-narrow-light.png), [Phone DARK](final-engine-phone-narrow-dark.png), [Awake](final-engine-phone-awake-light.png) |
| Modal boundary and shared component reference | [Stats](final-stats-tesla.png), [Reference LIGHT](final-reference-resting.png), [Reference DARK](final-reference-dark.png) |

Local production candidates used the existing source baseline `9865048` plus the
reviewed changes, with stamps through `20260919-1504`. Final narrow Engine and
Fly With screenshots use the last candidate. The reference page uses Vite and
imports the actual production control components. Canonical evidence is recorded
separately after the committed-source release.

## Interaction verification

- NORMAL/WIRE, both Prtcl types and all three Gradient variants change through
  their real buttons; the contextual action does not unexpectedly wake chrome.
- The first pointer click on a resting logo wakes chrome with zero dialogs. A
  second deliberate click opens the report. Speed remains GPS / 42 during the
  corresponding wake check. No report was sent.
- Tab wakes global controls. Atlas contextual groups then have both `inert` and
  `aria-hidden="true"`; hidden controls are excluded from interaction.
- Atlas drag enters manual camera behavior without waking chrome. Camera
  framing, appearance, zoom/reset and flight return remain operable.
- Radar list → aircraft detail → Fly With and return use actual UI controls.
  The phone flight card retains altitude, ground speed, distance and age.
- Engine at 667 × 375 has a 375 px scroll/client height. Awake graphs end at
  y=250; TAMARRO begins at y=255, below the instrument and above the footer.
- FX, Visual library, report, Stats and Discover opening/closing were exercised.
  Discover article-provider content is not an acceptance claim in this pass.

## Reproduction and boundaries

From `prototype/drive-lab`, build with `SEDICIVALVOLE_NO_LOCAL_ENV=1 npm run
build:native`, then run `node scripts/serve-ui-harmony-qa.mjs`. Open
`http://127.0.0.1:5176/?speed=42&reduced=1` for moving/reduced-motion or
`http://127.0.0.1:5176/?phone=1&speed=0` for coarse-pointer landscape checks.
Choose Play the Road before START MUSIC to avoid requiring a live soundtrack
catalogue. Set the browser viewport explicitly, then use real controls.

The loopback-only server serves the compiled package without modifying it and
loads a separate QA fixture. GPS and aircraft observations are synthetic; map
background/POI providers may load for that fixed fictional test session. Both
modes are muted, automatic diagnostics are OFF, diagnostic requests are blocked,
and the local server refuses API requests. No synthetic mail was sent. These QA
files are outside `public/` and are not imported by the production app.

Native regression: **984/984**. After the first-touch correction, focused
presentation, phone and road-recovery checks: **43/43**. Production packaging
verifies **827 exact static hashes**. Community credits: **189**. Final identity,
publication and documentation checks are recorded below at closeout.

This is browser/compiled-product evidence, not physical Tesla/iPhone/iPad touch,
GPS reception, cabin listening, sensor pairing, Tidal coexistence, or sustained
GPU/endurance acceptance. Audio, sensor, QR, cache and diagnostic owners were
preserved. The pre-existing recovery-prompt edit remains outside this task.
