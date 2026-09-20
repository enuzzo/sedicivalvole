# Smartphone connection design review handoff

## Current owner request — September 20, 17:27 Europe/Rome

Continue in a fresh task/context, using the existing saved Dropbox project as the
sole writer. The preceding task finishes its documentation checkpoint before this
one starts. This is a scoped design/copy revision plus verification, not an
invitation to start unrelated backlog work.

The owner rejects the current published Connect your phone drawer as visually
flat, empty, generic and uninspired. Simple must not mean bland. Buttons and text
must share deliberate alignment; the Connection details disclosure appears
unexpectedly indented relative to the left content edge. Verify that observation
in the actual browser rather than guessing a CSS fix. The previous design QA pass
is superseded as aesthetic acceptance; its factual test results remain evidence.

The owner also rejects calling every device iPhone. Prefer smartphone/phone for
generic instructions, and platform names only for genuinely applicable help.
Search the whole active companion copy, including stale/error/recovery states,
not just the visible QR headline. Do not imply verified Android compatibility or
infer Safari/iOS from a generic browser failure. Preserve capability detection.

## Design task and skill

Use the installed `build-web-apps:frontend-app-builder` skill explicitly. There is
no exact `frontend-design` SKILL.md in the installed local catalog; Frontend App
Builder is the available matching design workflow. Read its full SKILL.md. Use
Product Design audit/image-to-code when relevant; do not substitute an automated
functional pass for a visual comparison.

Start by inspecting the live surface in the integrated browser, then compare the
selected combined reference and actual captures. Review the drawer at the actual
preview size and compact Tesla 773 x 601, phone at 390 x 760 and 320 x 568, LIGHT
and DARK. Inspect QR/waiting, connected/live, delayed and recovery states. Never
save/share live QR capabilities in screenshots, logs or docs; use synthetic
fixtures for lasting visual evidence.

The approved starting arrangement remains the first phone concept plus the second
receiver concept, with five numbered steps, evidence-driven checks and collapse
after completed setup. Improve the execution: strong but restrained hierarchy,
intentional spacing/density, coherent alignment of title, copy, primary action,
secondary controls, disclosure and status, well-composed imagery/QR and telemetry.
No filler cards, arbitrary badges, fake traces, decorative metrics, gradients or
new branding just to make it look busy. Use the existing design system, fonts,
semantic colors, genuine generated PNGs and admitted icons.

The standing project rule is exactly TWO carefully developed Image Gen directions
for a genuinely new visual direction, followed by owner selection; never three.
Do not restart that gate unnecessarily for faithful repair of the selected design.
If choosing a materially different composition is necessary, show two real Image
Gen proposals and wait for selection. Implement the selected reference faithfully;
design-system, accessibility and truthful-state constraints override image errors.
Keep core phone onboarding within the tested viewport without scrolling where
possible; optional details and accessibility zoom may scroll instead of clipping.

## Preserve behavior

Sensors -> explicit connect -> secure placement -> mounted ZERO -> explicit
keep-screen-awake -> live readings. A wake request is not success: acquired,
denied, unsupported and released states must remain distinct. Completed setup
collapses; the optional TRACE cube appears only on deliberate disclosure. Keep
250 ms freshness, reciprocal readiness, coordinate-free diagnostics and GPS speed
authority. Use measured round-trip latency, clear stale readings, and actionable
recovery on both screens. Do not weaken sensing/network contracts for visual polish.

## Verified delivery and open acceptance

- Before this handoff, main/origin main was `3c3098f`; app source is `24c955b`.
- Live canonical release: `20260920-1716.24c955b`. Publication completed; no FTP
  upload or build remains running. Recheck current Git/live state when resuming.
- Official preserve-existing FTP: 38 files / 6,508,831 bytes, 831 verified static
  files and 29 recordings reused, one previous asset retained, ROOT_UPLOAD_ONLY.
- Sixteen canonical HTTPS identity/hash/cache/API checks pass. Public browser
  verifies final build, drawer and fresh QR copy, with no observed canonical errors.
- Native baseline 1,034/1,034, final motion checks 50/50, final production 833 exact
  static hashes. Documentation checks 8/8. These do not establish aesthetic approval.
- Physical Safari wake retention, mounted sensor signs and sustained iPhone/Tesla
  continuity remain open. Prior public-relay trials were only 110/120 and 111/120
  LIVE observations, below the unchanged 95% target. First real automatic
  diagnostic inbox receipt remains open. No synthetic mail was sent.
- Integrated browser was left on the canonical drawer with a fresh, expiring QR.
  Inspect current state before changing it; do not interrupt an owner pairing.

## Code, references and practical environment

- `prototype/drive-lab/src/motion/guided-setup.js`: status, step and recovery copy.
- `src/motion/motion-ui.jsx`, `phone.jsx`, `motion.css`: drawer, phone and geometry
  (paths here relative to `prototype/drive-lab`). Preserve shared local-sensor UI.
- `prototype/drive-lab/qa/phone-onboarding.html` and `.jsx`: dev-only synthetic
  fixture; receiver, theme, denied-wake and bad-pose variants. Not production.
- `docs/design/phone-onboarding-2026-09-20/README.md`, `reference/selected-combination.png`,
  prompts and asset inventory; `public/brand/phone-guide/*.png` in Drive Lab.
- `docs/qa/2026-09-20-phone-onboarding/README.md` and release evidence; `design-qa.md`.
- `docs/RELIABILITY-CORRECTION-2026-09-20.md` for unresolved reliability acceptance.
- Read root/local AGENTS and relevant interface/motion/delivery contracts.
- Shared dependencies can have the wrong architecture. Existing verification-only
  mirror: `/private/tmp/sv-reliability-20260920`, with verified host-local Intel
  dependencies. Do not replace shared node_modules blindly or develop in a worktree.
  Source edits stay in the saved project; synchronize only known source changes to
  the verification mirror. Use `SEDICIVALVOLE_NO_LOCAL_ENV=1`, Python 3.11, native
  wrappers and original GIT_DIR for committed-source identity. Re-audit first.
- Build tools briefly stalled at macOS process startup during final delivery and
  then completed normally. Do not disable security protections to address delays.
- Preserve generated dist backups in ignored `prototype/drive-lab/output/`.
  Moving a Dropbox directory outside its provider previously hung; same-provider
  rename worked. No production secrets belong in temporary copies.
- Never read/print/copy `.env` or local secrets. Only the official publisher may
  load configuration internally. No synthetic diagnostic sends or recipient leaks.

## Finish

Carry the authorized revision through meaningful local/browser checks, actual
reference/render comparison, small commits/push and verified canonical publication
under the standing authorization. Keep implementation, tests, live delivery,
owner visual approval and physical acceptance separate. Prepare a fresh QR only
when ready to retry the real smartphone flow with the owner. Explain the visual
changes with concrete evidence, not a self-awarded quality score.
