# Current Project State

Status: **authoritative working overview**. Updated on 2026-08-27.

This page is the shortest reliable answer to “what exists now?”. Product
requirements remain in [`PRODUCT-SPEC.md`](PRODUCT-SPEC.md), architecture in
[`TECHNICAL-DIRECTION.md`](TECHNICAL-DIRECTION.md), deployment evidence in
[`DEPLOY.md`](DEPLOY.md), and historical decisions in `CHANGELOG.md` and the
dated study documents.

## Product surface

- `Flux` is the implemented primary mode. `Engine` remains an equal confirmed
  mode, visible but disabled until its own audio model and one of exactly three
  Engine-specific visual directions are selected.
- The live Flux catalog contains four visual environments: **APERTURE 01**,
  **VERTIGO 02**, **MERIDIAN 03**, and **LATITUDES 04**.
- All four environments use the shared catalog of **10 themes**. Vertigo keeps
  the upstream Interstate 7 files byte-identical while an external runtime
  bridge maps the selected theme onto its existing colour channels.
- Speed, BPM, and energy remain visible together. The fixed road-energy ceiling
  is `130 km/h`, with Aperture visibly forming a tunnel near `40 km/h`.
- The main experience retains Stop/Mute, GPS/Demo source selection, compact
  Music and Visual libraries, body themes, and coordinate-free diagnostics.

## Music

- **FRACTURE 02** is a selectable score. It is a generative Jungle / Drum
  & Bass composition rendered by the production AudioWorklet.
- FRACTURE has **10 four-bar sections**, ten themes played across four melodic
  timbres, a narrow `162–176 BPM` transport range, half-time interpretation at
  rest, arrangement density, deceleration memory, and the measured UNDERWATER
  brake effect.
- **JUNCTION 01** is selectable sampled Jungle / Rave music. Its eight energy
  states each have three complete authored takes: 24 rendered sections in one
  5.1 MB Opus bank. The browser uses one decoder, chooses a non-repeating take
  at each eight-bar boundary, and never shuffles source sounds mid-phrase.
- **PULSE 03**, **CUTWATER 04**, **LOWTIDE 05**, **NIGHTCAST 06**, and
  **STILLWATER 07** are declared honestly as `IN PREPARATION` and are disabled.
- `docs/MUSIC-CRAFT.md` records the musical defects and techniques already
  learned. Assertable musical rules belong in tests.

## Verified boundaries

- Local gate: `npm test` and `npm run build` from `prototype/drive-lab/`.
- Current suite: 129 unit checks plus 4 Sites packaging checks.
- Canonical development URL: <https://sedicivalvole.app/>. The most recent
  canonical publication evidence and build stamp are always the first entry in
  [`DEPLOY.md`](DEPLOY.md).
- The target Tesla split viewport is `773 × 601` CSS pixels on a
  `1254 × 784` logical screen at DPR `1.53`.
- No sample pack file is committed or published. JUNCTION ships only the mixed,
  processed production permitted by the source terms. The development QA
  harness is excluded from production builds.
- Diagnostic telemetry contains no coordinates and is sent only after the
  explicit `SEND DIAGNOSTIC` action.

## Open work

1. Complete a real Tesla listening and performance session for FRACTURE,
   JUNCTION and all
   four visual environments, including touch reach, frame pacing, GPS cadence,
   braking behavior, and long-session stability.
2. Send a fresh real-drive v3 diagnostic from the still-open drawer, observe
   `SENT`, confirm Gmail delivery, and inspect the received report.
3. Design Engine only after exactly three Engine-specific directions are shown
   and one is selected.
4. Keep `VERSION` at `0.0.0` until an explicit release is approved.

## Documentation map

| Kind | Documents | How to use them |
|---|---|---|
| Current | this page, `README.md`, `PRODUCT-SPEC.md`, `TECHNICAL-DIRECTION.md`, `ROADMAP.md`, `MODES.md`, `SESSION-HANDOFF.md` | Must describe the current repository and verified product state |
| Evidence | `DEPLOY.md`, `DIAGNOSTICS.md`, `CHANGELOG.md` | Append-only chronology; older failures remain true historical evidence |
| Knowledge | `MUSIC-CRAFT.md`, licensing and reference studies | Durable technique, provenance, and decision records |
| Historical | `RECOVERED-REQUIREMENTS-2026-08-26.md`, `ADVERSARIAL-REVIEW.md`, `SOURCE-AUDIT.md`, dated work plans | Preserve the reasoning and rejected baselines; do not treat their “current” wording as current product state |

`SESSION_HANDOFF.md` is a retained legacy filename and points to the canonical
hyphenated [`SESSION-HANDOFF.md`](SESSION-HANDOFF.md).
