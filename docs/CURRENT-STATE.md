# Current Project State

Status: **authoritative working overview**. Updated on 2026-08-28.

This page is the shortest reliable answer to “what exists now?”. Product
requirements remain in [`PRODUCT-SPEC.md`](PRODUCT-SPEC.md), architecture in
[`TECHNICAL-DIRECTION.md`](TECHNICAL-DIRECTION.md), deployment evidence in
[`DEPLOY.md`](DEPLOY.md), and historical decisions in `CHANGELOG.md` and the
dated study documents.

## Product surface

- `Flux` is the implemented primary mode. `Engine` remains an equal confirmed
  mode, visible but disabled until its own audio model and one of exactly three
  Engine-specific visual directions are selected.
- The Flux catalog contains five visual environments: **APERTURE 01**,
  **VERTIGO 02**, **MERIDIAN 03**, **LATITUDES 04**, and **ATLAS 05**. ATLAS is
  implemented locally and remains pending canonical publication.
- All five environments use the shared catalog of **10 themes**. Vertigo keeps
  the upstream Interstate 7 files byte-identical while an external runtime
  bridge maps the selected theme onto its existing colour channels.
- Meridian now grows deterministic Euclidean portals, blades, cantilevers and
  stepped monoliths beneath high geometric cloud slabs, with segmented curved
  wind; Latitudes turns its existing eight-second motion history into eighteen
  continuously phased oscilloscope contours whose distortion grows with speed.
- ATLAS dynamically loads MapLibre only when selected, draws a minimal
  palette-owned OpenFreeMap vector style with 3D buildings, and pairs it with a
  short nearby Italian Wikipedia reading, four passenger choices and a local QR.
  Without reliable GPS, an explicit Milan-only test button enables keyboard
  steering and the same speed-driven bird's-eye camera without entering demo
  coordinates into diagnostics.
- Speed, BPM, and energy remain visible together. The fixed road-energy ceiling
  is `130 km/h`, with Aperture visibly forming a tunnel near `40 km/h`.
- The main experience retains an icon-only Mute control, GPS/Demo source
  selection, vertically ordered Music and Visual libraries, a shared `PALETTE`
  control, and coordinate-free diagnostics in a measured 64 px footer.
- Signal Gate launches through the approved `390 × 170 px` flat typographic
  surface at the Tesla split viewport. Its enlarged wordmark and full-width
  `PLAY THE ROAD` field form one semantic gesture with no simulated controls.
- The command carries a continuous white-to-red horizontal wave. Every Signal
  Gate lane owns a short independently phased travelling gap, with restrained
  perspective airflow behind the road field.
- Diagnostics separate FPS/frame time, browser-exposed heap and decoded-audio
  memory by splash, active Visual/Music pairing, the Aperture wall-retreat pressure
  band and DIAG-open state. Re-entry gaps are not counted as slow frames.
- An explicit diagnostic send keeps the email body concise and attaches the
  complete accepted report as gzip-compressed JSON, named by build and server
  timestamp with uncompressed and compressed SHA-256 evidence.

## Music

- **FRACTURE 02** is a selectable score. It is a generative Jungle / Drum
  & Bass composition rendered by the production AudioWorklet.
- FRACTURE has **10 four-bar sections**, ten themes played across four melodic
  timbres, a narrow `162–176 BPM` transport range, half-time interpretation at
  rest, arrangement density, deceleration memory, and the measured UNDERWATER
  brake effect.
- **JUNCTION 01** is selectable sampled Jungle / Rave music. Its eight energy
  states each have 13 complete authored clips: 104 rendered sections built from
  142 distinct recordings in one 25.0 MB segmented Opus bank. Five harmonic and
  colour families rotate without immediate family repetition. Rest is harmony
  and atmosphere without a break or bassline;
  rhythm fades in near `13 km/h`, moves through native `127`, `135`, `158` and
  `164 BPM` recordings, and reaches `168 BPM` only at high energy. The `127 BPM`
  state now covers 40 km/h and `135 BPM` covers 60 km/h; `158 BPM` begins above
  approximately 65 km/h. The browser
  lazily retains at most six individual clips, starts two distinct takes on the
  same sample-accurate boundary, and mixes their level, tone, stereo and space
  live. The primary take does not immediately repeat, and source sounds are
  never exposed or shuffled mid-phrase.
- JUNCTION is preloaded but inaudible after `PLAY THE ROAD` while stationary. Its
  score-local movement gate fades from silence at `4 km/h` to full level at
  `10 km/h`, before the existing quiet break threshold near `13 km/h`.
- **PULSE 03**, **CUTWATER 04**, **LOWTIDE 05**, **NIGHTCAST 06**, and
  **STILLWATER 07** are declared honestly as `IN PREPARATION` and are disabled.
- `docs/MUSIC-CRAFT.md` records the musical defects and techniques already
  learned. Assertable musical rules belong in tests.

## Verified boundaries

- Local gate: `npm test` and `npm run build` from `prototype/drive-lab/`.
- Current suite: 156 unit checks plus 4 Sites packaging checks.
- Canonical development URL: <https://sedicivalvole.app/>. The most recent
  canonical publication evidence and build stamp are always the first entry in
  [`DEPLOY.md`](DEPLOY.md).
- The target Tesla split viewport is `773 × 601` CSS pixels on a
  `1254 × 784` logical screen at DPR `1.53`.
- No sample pack file is committed or published. JUNCTION ships only the mixed,
  processed production permitted by the source terms. The development QA
  harness is excluded from production builds.
- Diagnostic telemetry contains no coordinates and is sent only after the
  explicit `SEND DIAGNOSTIC` action. ATLAS location is a separate ephemeral
  feature: the latest reliable point stays in session memory; OpenFreeMap tile
  requests and a coarse Wikimedia nearby-search cell occur only while selected.

## Open work

1. Validate Aperture's `0–40 km/h` rigid wall retreat, silent JUNCTION launch,
   oscilloscope Latitudes, Euclidean Meridian and the ATLAS flight camera in the Tesla.
2. Send the new real-drive gzip attachment and compare the dedicated wall-retreat
   phase plus family/take exposure counters against the first complete report.
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
