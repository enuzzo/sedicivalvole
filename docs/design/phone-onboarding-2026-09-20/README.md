# Phone onboarding and receiver drawer

Owner brief: September 20, 2026. Status: two Image Gen directions requested;
selection, implementation and physical acceptance pending. This is a design brief,
not evidence of changed production behavior.

## Shared requirements

- Guide the phone through local sensor permission, connection, placement, ZERO
  calibration and an explicit keep-screen-awake action before showing live data.
- Confirm actual sensor samples, reciprocal pairing, supported placement and
  calibration, and actual wake-lock acquisition separately. Never infer readiness
  from an open channel or locally moving sensors alone.
- A denied, unsupported or released wake lock cannot be displayed as acquired.
  Explain the current limitation and recovery action without promising that the
  browser can override the operating system. See the
  [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API).
- Show interruptions on both surfaces as soon as observable, clear stale values,
  preserve GPS fallback and offer to restart onboarding. A frozen or locked phone
  cannot repaint until it resumes; the receiver must detect missing fresh data.
- After setup, prefer two concise acceleration/rotation rows with recognizable
  icons. Make the TRACE cube an optional detail, not the first onboarding screen.
- Keep the receiver explanation short: GPS owns speed; the optional phone adds
  measured acceleration and rotation. Do not promise improved GPS accuracy.
- While the drawer is open, show measured round-trip latency in milliseconds,
  evidence-based connection quality and available fresh telemetry. Distinguish
  transport quality from calibration, screen-awake and effective motion readiness.
  Do not add continuous hidden-drawer visualization or raw-vector diagnostic logs.
- Put an overall status and an actionable next step beneath the content.
- Replace the existing Scan / Connect / Zero guide SVG illustrations with three
  original, coordinated vector-style PNG assets in two or three colors after the
  direction is selected. Generate each separately; verify genuine RGBA alpha,
  rather than a drawn checkerboard. These assets are not yet delivered.

## Visual constraints

Use the current [design system](../../DESIGN-SYSTEM.md), Space Grotesk UI,
existing piston/Orbitron identity, shared RED roles and LIGHT/DARK inheritance.
Keep flat surfaces, strict grids, restrained corners, 48 px minimum targets and
56 px primary actions. Phone reference: 390 x 844; compact display: 773 x 601.
No glass, decorative hardware, invented branding or smaller inaccessible text.
Generated concepts are visual targets subject to these constraints, not permission
to replace the product's design language.

## Directions to compare

- **One step at a time:** a focused phone wizard with a quiet progress strip,
  one prominent action and generous illustration space; a compact receiver drawer.
- **Guided checklist:** a visible vertical sequence with only the current step
  expanded, completed steps reduced to compact rows, and the same concise receiver
  status and telemetry model.

The two generated images will be numbered in their displayed order. Wait for the
owner's choice before implementation. Any illustrated sample values are mock data,
not measurements or physical acceptance evidence.

## Verification after selection

Implement the selected reference faithfully; document only necessary departures
for the design system, accessibility, truthful state or supported browser behavior.
Compare actual renders with the chosen image at the target viewports. Verify
denied permissions, unsupported/released wake lock, stale data, calibration failure,
disconnect and restart. Keep automated/browser verification distinct from the
owner's real iPhone onboarding, screen-awake, interruption and Tesla acceptance.
