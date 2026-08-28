# Current Project State

Status: **authoritative working overview**. Updated on 2026-08-29.

This page is the shortest reliable answer to “what exists now?”. Product
requirements remain in [`PRODUCT-SPEC.md`](PRODUCT-SPEC.md), architecture in
[`TECHNICAL-DIRECTION.md`](TECHNICAL-DIRECTION.md), deployment evidence in
[`DEPLOY.md`](DEPLOY.md), and historical decisions in `CHANGELOG.md` and the
dated study documents.

## Product surface

- `Flux` is the implemented primary mode. `Engine` remains an equal confirmed
  mode, visible but disabled until its own audio model and one of exactly three
  Engine-specific visual directions are selected.
- The Flux catalog contains four visual environments: **APERTURE 01**,
  **VERTIGO 02**, **MERIDIAN 03**, and **ATLAS 04**.
  All four are published on the canonical experience.
- All four environments use the shared catalog of **10 themes**. Vertigo keeps
  the upstream Interstate 7 files byte-identical while an external runtime
  bridge maps the selected theme onto its existing colour channels.
- Meridian keeps one deterministic low corridor beneath sparse, large oblique
  blades and longitudinal shoulder planes. Its shared travel field has tightly
  bounded vertical motion; FOV, depth compression, peripheral stretch,
  parallax and flow rise monotonically with speed. Conventional buildings,
  stacked towers, high cloud slabs and scene-wide particles are absent.
- ATLAS dynamically loads MapLibre only when selected, draws a minimal
  palette-owned OpenFreeMap vector style with 3D buildings, and pairs it with a
  selected-page Italian Wikipedia abstract and free thumbnail, four passenger
  choices and a local QR.
  Without reliable GPS, an explicit Milan-only test button enables keyboard
  steering and the same speed-driven bird's-eye camera without entering demo
  coordinates into diagnostics. The camera remains oblique and building-rich at
  `130 km/h`; it centers on trusted fixes and follows reported heading or a
  bearing inferred from successive positions. The `246 px` passenger panel uses
  compact image-and-reading context and an `86 px` QR at the Tesla split viewport, collapses
  behind a persistent midpoint handle to return the complete field to the map,
  and keeps mandatory attribution in a tiny translucent strip above the footer.
- REGISTER was rejected after live review because its static print composition
  was inexplicable in motion and outside the product mood. Its source remains
  only in the rejected-visual archive; the runtime, QA harness and active tests
  do not import it. A stale stored `register` preference falls back to Aperture.
- Speed, BPM, and energy remain visible together. The fixed road-energy ceiling
  is `130 km/h`, with Aperture visibly forming a tunnel near `40 km/h`.
- The main experience retains an icon-only Mute control, GPS/Demo source
  selection, vertically ordered Music and Visual libraries, a shared `PALETTE`
  control, and coordinate-free diagnostics in a measured 64 px footer.
- Signal Gate launches through the approved `390 × 170 px` flat typographic
  surface at the Tesla split viewport. Its enlarged wordmark and full-width
  `PLAY THE ROAD` field form one semantic gesture with no simulated controls.
  The readable credit beneath it links Netmilk Studio to `netmilk.ch` and links
  Illobo, followed by a monochrome GitHub-marked link to the public
  `enuzzo/sedicivalvole` repository. Splash links retain light text on hover.
  A compact top-left support control opens the verified `buymeacoffee.com/enuzzo`
  destination, the supplied QR, an honestly labelled playful project-sparks
  signal and a runtime-reconstructed suggestion address; suggestions are
  explicitly welcome without a purchase.
- All product chrome uses the locally packaged Orbitron variable font. Reading
  text, telemetry, controls, operational labels and the launch command occupy a
  deliberate `450–750` weight hierarchy rather than falling back to device fonts.
- The centered lowercase launch wordmark uses weight `750`; `PLAY THE ROAD` uses
  weight `600`, and neither adds tracking. The wordmark scales from `32–40 px`
  (`38.65 px` at `773 × 601`) inside a `68 px` product band, while the complete
  action remains `390 × 170 px`. The command carries a seamless
  repeating white-to-red horizontal wave whose terminal frame is its first frame.
  The launch surface stays above every preloaded environment overlay, including
  ATLAS's no-GPS waiting state, until the gesture completes. Every Signal Gate
  lane owns a short independently phased travelling gap, with restrained
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
- FRACTURE has **10 four-bar sections**, a narrow `162–176 BPM` transport range,
  half-time interpretation at rest, an atmosphere-only launch, arrangement
  density, deceleration memory, and the measured UNDERWATER brake effect. Its
  live arranger now builds only atmosphere, harmony, sub/reese and rhythm: the
  recurring `riff` and `response` lanes are retired from normal playback and
  remain reachable only through the parked development audition path.
- **JUNCTION 01** is selectable sampled Jungle music. Its eight energy states
  each have three complete authored clips: 24 rendered sections built from 76
  distinct recordings in one 5.8 MB segmented Opus bank. Every section shares
  the exact `Emin9 – Cmaj7 – Amin7 – Bmin9` grammar and contains its own vertical
  atmosphere, harmony, bass and break layers. There is no automatic lead, rave
  multisample, tonal second deck, or simultaneous independent identity. Rest is
  harmony and atmosphere without a break or bassline;
  rhythm fades in near `13 km/h`, moves through native `127`, `135`, `158` and
  `164 BPM` recordings, and reaches `168 BPM` only at high energy. The `127 BPM`
  state now covers 40 km/h and `135 BPM` covers 60 km/h; `158 BPM` begins above
  approximately 65 km/h. The browser
  lazily retains at most six individual clips, finishes the current eight-bar
  phrase, then starts one different self-contained performance on the
  sample-accurate boundary. The primary take does not immediately repeat.
  A rhythm entrance from rest rises for four seconds; a decision to return to
  rest releases the active performance toward a near-silent floor over four
  seconds, with cancellable recovery if road energy returns.
  Source sounds are never exposed or shuffled mid-phrase.
- JUNCTION is preloaded but inaudible after `PLAY THE ROAD` while stationary. Its
  score-local movement gate fades from silence at `4 km/h` to full level at
  `10 km/h`, before the existing quiet break threshold near `13 km/h`.
- The shared post-score **OPEN** macro responds to sustained hard acceleration:
  it opens stereo width and air while removing low-mid density and applying a
  small level trim. Two qualifying readings arm it above `15 km/h`; it holds no
  longer than four seconds, releases over one second, and yields to UNDERWATER
  whenever braking is detected.
- **PULSE 03**, **CUTWATER 04**, **LOWTIDE 05**, **NIGHTCAST 06**, and
  **STILLWATER 07** are declared honestly as `IN PREPARATION` and are disabled.
- `docs/MUSIC-CRAFT.md` records the musical defects and techniques already
  learned. Assertable musical rules belong in tests.
- A development-only sample-harmony pilot now inventories the eight chord hits
  reachable by JUNCTION, records byte identity, envelope shape, tuning and
  high-recall Basic Pitch proposals plus review-only harmonic-residual evidence.
  Its first three-note synthetic C-sharp collision grid passed at `1.0` recall
  and `0.0` false-positive rate but with a narrow `0.012246` separation margin.
  Adding the missing F-sharp2 source falsified that result: false-positive rate
  rose to `0.666667` and the margin became `-0.006729`. The residual is therefore
  removed from classifier input and remains descriptive review data only. A separate
  review-only spectrum pass searches possible lower fundamentals independently;
  it now records calculated hypotheses separately from measured spectral peaks.
  No authoritative pitch set or chord label is admitted. The ignored Python
  environment and reports never enter the product build or redistribute source
  audio.

## Verified boundaries

- Local gate: `npm test` and `npm run build` from `prototype/drive-lab/`.
- Current suite: 173 unit checks plus 4 Sites packaging checks.
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

1. Validate Aperture's `0–40 km/h` rigid wall retreat, OPEN's level
   compensation, the no-lead FRACTURE and
   single-performance JUNCTION arrangements, the selected-concept Meridian
   rebuild and the ATLAS flight camera in the Tesla.
2. Send the new real-drive gzip attachment and compare the dedicated wall-retreat
   phase plus JUNCTION section/take exposure counters against the first complete report.
3. Show exactly three new Flux visual directions before selecting a REGISTER
   replacement, and design Engine only after exactly three Engine-specific
   directions are shown and one is selected.
4. Replace the failed magnitude-residual decision with a three-way evidence
   stack. Validate shared ADSR/filter envelopes, phase seeds, detune, chorus,
   spectral slope and saturation; add stereo and phase-coherence evidence with
   explicit invalidity reasons before any detected pitch set can gate JUNCTION
   material.
5. Keep `VERSION` at `0.0.0` until an explicit release is approved.

## Documentation map

| Kind | Documents | How to use them |
|---|---|---|
| Current | this page, `README.md`, `PRODUCT-SPEC.md`, `TECHNICAL-DIRECTION.md`, `ROADMAP.md`, `MODES.md`, `SESSION-HANDOFF.md` | Must describe the current repository and verified product state |
| Evidence | `DEPLOY.md`, `DIAGNOSTICS.md`, `AUDIO-QA-2026-08-28.md`, `CHANGELOG.md` | Append-only chronology; older failures remain true historical evidence |
| Knowledge | `MUSIC-CRAFT.md`, licensing and reference studies | Durable technique, provenance, and decision records |
| Historical | `RECOVERED-REQUIREMENTS-2026-08-26.md`, `ADVERSARIAL-REVIEW.md`, `SOURCE-AUDIT.md`, dated work plans | Preserve the reasoning and rejected baselines; do not treat their “current” wording as current product state |

`SESSION_HANDOFF.md` is a retained legacy filename and points to the canonical
hyphenated [`SESSION-HANDOFF.md`](SESSION-HANDOFF.md).
