# Current Project State

This page is the present tense: what exists, what is live, what is verified and
what is still open. It is rewritten, not appended to. The dated section-by-section
history up to September 24, 2026 is preserved verbatim in
[the current-state archive](archive/CURRENT-STATE-HISTORY-2026-09-24.md); its
build, commit and status labels are navigation evidence, not proof of the
current deployment ([Recovery](agent-guide/recovery.md)). Releases are indexed in
the [DEPLOY release table](DEPLOY.md#release-table).

## Live release

- Canonical [https://sedicivalvole.app/](https://sedicivalvole.app/) serves
  **20260924-1934.e0764dd**: Night Instrument, the September 24 structural,
  curve and passenger-remote work listed under
  [Direction and queue](#direction-and-queue), and the predictive, full-body
  Engine with its race cluster ([record](DEPLOY.md#latest-release-records)).
- Rollback: `scripts/rollback-release.sh <tag-or-commit> [--publish]`, with the
  source tags `pre-night-instrument-20260924`, `pre-structural-20260924` and
  `pre-engine-20260924`
  ([DEPLOY / Rollback](DEPLOY.md#rollback)).

## The product

Sedicivalvole is an experimental browser instrument for the Tesla display while
driving — `773 × 601` CSS px beside the vehicle view — with an optional iPhone
passenger remote. GPS speed and heading drive the visuals and the music; firm
braking drives UNDERWATER. The source is public under PolyForm Noncommercial and
the product remains experimental.

## Tesla display

- **Interface.** The owner-selected [Night Instrument](NIGHT-INSTRUMENT-2026-09-24.md):
  plates of keys with LED state, an odometer speed display with a 130 km/h
  gauge, artwork-led footer keys, gallery libraries and a Signal Gate launch.
  Light, Dark and Auto appearance share one geometry; palettes come from the
  shared catalog of **10 themes** (PEARL 01 to SULPHUR 10). Rules:
  [Interface](agent-guide/interface.md), [Design system](DESIGN-SYSTEM.md).
- **Modes.** Music and Engine, chosen in the Launch Cockpit before START.
- **Visuals.** APERTURE, VERTIGO, MERIDIAN, ATLAS, DRIVEY, PRTCL, the GRADIENT
  family (JAPANESE MIST, ACID ORCHARD, CHROMATIC SILK) and AIR ATLAS, plus the
  passenger destinations DISCOVER and STATS FOR NERDS. Aperture, Meridian and
  PRTCL bend with fresh, trusted GPS heading and return to neutral on loss or
  reduced motion. [Visuals](agent-guide/visuals.md).
- **Play the Road.** JUNCTION (sampled Jungle), FRACTURE (generative Jungle / Drum
  and Bass with 10 four-bar sections, `162–176 BPM`) and NIGHTSHIFT (sampled
  Synth-pop, `85–140 BPM`) are ready. CUTWATER, LOWTIDE, NIGHTCAST and
  STILLWATER are preparing and do not appear on the driving surface.
  [Music](agent-guide/music.md).
- **Soundtrack.** Illobo Featured recordings and the Jamendo library by pace
  and genre, with exact-track choice and attribution.
- **Performance FX.** Eight pads — FLANGER, REVERB, UNDERWATER, PHASER,
  BITCRUSH, BASS CUT, MID FOCUS, HIGH CUT — where the three band effects are
  clean fourth-order filters; braking UNDERWATER has its own master.
- **Engine.** Three profiles (Mono, Rosso, Touring) from declared-MIT sample
  banks with a dry full-body voicing, automatic virtual gears, RPM that follows
  a predicted GPS speed between samples, clutch slip on pull-away, a race
  cluster (LED tachometer, closing shift lights, equal plates, oscilloscope
  traces) and one TAMARRO show-off key; the protected LAB compares Refined and
  Full body. [Engine](agent-guide/engine.md).
- **Maps and places.** Atlas and Air Atlas on MapLibre, Discover's nearby
  Wikipedia/OSM index with send-to-navigation, and Stats for Nerds, under the
  scoped [geographic privacy](agent-guide/maps.md#geographic-privacy) rules.
- **Diagnostics.** The integrated coordinate-free report; in Dev mode automatic
  reports reach the project mailbox every 15 active minutes.
  [Diagnostics and reports](agent-guide/diagnostics-reports.md).

## Passenger remote and phone

- **Remote.** QR pairing over the encrypted relay; a Now-on-display hero; tabs
  for Visual, Music, FX and Palette (Engine, FX and Palette in Engine mode);
  Soundtrack browsing by source, pace and genre with a playable track list; a
  momentary XY filter pad; live appearance and palette synchronisation; Forget
  this display.
- **Phone as display.** The September 1 queue item
  “Build the queued landscape-first iPhone presentation” is implemented in
  code: a landscape layout with safe-area insets and an inert portrait rotation
  notice that keeps the running session. Its physical Safari acceptance is
  still open.
- **Phone motion input** (`FI-013`) stays an experimental QR/direct-link path;
  GPS remains the speed source.

## Verification in the repository

| Gate | Command | What it proves |
| --- | --- | --- |
| Native tests | `npm test` in `prototype/drive-lab` | Models, audio graph, protocol, source contracts (1,117 cases on September 24) |
| Visual regression | `npm run qa:visual` | 16 frozen chrome screens at `773 × 601` and `390 × 844`, both appearances |
| Text fit | `npm run qa:text-fit` | No clipped chrome text across 14 running, muted, brake-off, visual and Engine states |
| Interface QA | `scripts/qa-night-instrument.mjs` | Running chrome, surfaces, geometries and a real local display↔phone pairing |
| Curve QA | `scripts/qa-visual-curves.mjs` | Aperture/Meridian through the real geolocation callback |
| Build identity | `npm run build` | 835 exact static hashes, `VERSION` and HTML identity |

Browser and office evidence never closes a physical gate
([Delivery](agent-guide/delivery.md)).

## Open physical acceptance

- Night Instrument legibility and touch in the Tesla cabin, and the GPU cost of
  its transitions and the curved fields during sustained driving.
- iPhone Safari: remote pairing and use on the road, and the landscape display.
- Real-road curve sensitivity for Aperture, Meridian and PRTCL.
- Network continuity when the car leaves the iPhone hotspot for its own cellular
  link.
- Low-volume listening across the three ready scores and braking UNDERWATER;
  JUNCTION real-audio pitch admission stays disabled until source provenance
  passes its gates.
- The standing Tesla test codes in
  [`TESLA-TEST-QUEUE-2026-08-31.md`](TESLA-TEST-QUEUE-2026-08-31.md).

## Direction and queue

- Standing order from [owner decisions](OWNER-DECISIONS-2026-09-07.md):
  reliability, then Engine, then iPhone.
- September 24 owner decisions after the Night Instrument release: structural
  work approved in full (cascade layers and dead-rule removal, `src/app/`
  presentational modules, visual regression gate, one-command rollback,
  this slimmer documentation); Night Instrument on Atlas, Stats, Discover and
  the report; real dark preview frames; one motion system; Soundtrack browsing
  and the XY filter on the remote; a stronger Aperture curve with a smooth
  receding wall; a portal-corridor Meridian that follows curves. Not now:
  personal presets and the end-of-trip summary card (owner, September 24,
  after the stop/end detection proposal). Later: FX hits quantized to the
  score's beat.

## Documentation map

| Kind | Documents | How to use them |
| --- | --- | --- |
| Current | this page, `README.md`, `PRODUCT-SPEC.md`, `TECHNICAL-DIRECTION.md`, `ROADMAP.md`, `MODES.md`, `SESSION-HANDOFF.md` | Describe the repository and verified state now |
| Rules by subsystem | `agent-guide/*.md`, `DESIGN-SYSTEM.md` | Durable decisions and contracts per owner |
| Evidence | `DEPLOY.md`, `DIAGNOSTICS.md`, `CHANGELOG.md`, dated focused records | Release and verification chronology |
| Knowledge | `MUSIC-CRAFT.md`, `LOCAL-SHADERGRADIENT-LAB.md`, licensing and reference studies | Technique, provenance and local instructions |
| Future ideas | `FUTURE-IDEAS.md` | Owner ideas; agent proposals stay separate and unapproved |
| Archive | `archive/` | Verbatim earlier versions of long living documents |

`SESSION_HANDOFF.md` is a retained legacy filename and points to the canonical
hyphenated [`SESSION-HANDOFF.md`](SESSION-HANDOFF.md).
