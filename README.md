# sedicivalvole

`sedicivalvole` is created and maintained solely by
[enuzzo](https://github.com/enuzzo). No studio or company identity is claimed;
third-party work retains the credits and licences recorded below.

> **Sequencer foundation — credit to Lobo.** The current Flux music system is
> built in part from [textStep](https://github.com/illobo/textStep),
> the step sequencer, synthesizer, and original DSP project created by
> [illobo](https://github.com/illobo). Its sequencer and performance architecture
> are Lobo's work. `sedicivalvole` translates the relevant transport, synthesis,
> and DSP into a browser AudioWorklet so vehicle speed can arrange musical
> layers. The exact derived files, modifications, license, and direct reuse
> authorization are recorded in `THIRD_PARTY_NOTICES.md`.

> Current state: **Flux Drive Lab runs the authored FRACTURE, JUNCTION and
> NIGHTSHIFT music with six selectable visual environments in the source
> checkout and is under vehicle validation**. PRTCL 06 and the revised OPEN
> intake are published on the canonical root. The rejected PRIMORDIAL field has
> been removed from the product; its history remains in Git. This is a
> development build, not a release.

Public development repository: [github.com/enuzzo/sedicivalvole](https://github.com/enuzzo/sedicivalvole).

## Vision

`sedicivalvole` turns speed, sound, and light into an atmospheric, useful, and memorable in-car experience. It is not a generic dashboard. Two equal primary modes share one motion signal and safety model while offering deliberately different audio and visual identities.

The canonical development build is available at [sedicivalvole.app](https://sedicivalvole.app/).

## What exists today

- ✅ a single ignored local reference library under `_references/`;
- ✅ source audit, product requirements, adversarial review, technical direction, and roadmap;
- ✅ Modular Aperture selected after exactly three revised Product Design directions;
- ✅ six selectable Flux visuals in the source checkout: procedural Aperture, byte-identical upstream Interstate 7 Vertigo, the original architectural Meridian environment, the lazy-loaded OpenFreeMap ATLAS city field, the source-faithful Rezmason Drivey runtime with automatic road following, lane-centred zero hold, opposing-only traffic, three focused cameras and normal/wire rendering, and PRTCL with Fractal Frequency, Murmuration, and Axiom particle families;
- 🛑 PRIMORDIAL and WAKE were rejected after visual review and have been removed from the catalog, runtime, tests, and current QA surface. PLUMB remains retired, SLIP remains proposal-only, and Aperture remains the accepted fresh-session fallback;
- ✅ GPS/Demo speed source, icon-only Mute, a fixed `130 km/h` energy ceiling, 10 curated palettes, and an integrated capability report;
- ✅ local-only speed processing and a coordinate-free session report; while selected, ATLAS keeps the complete driven route in bounded session memory, compacts older detail without deleting the trip origin, and never copies the route into the report. It discloses its OpenFreeMap tile and Wikimedia nearby-reading requests;
- ✅ ATLAS touch and desktop exploration with one-pointer or primary-mouse bearing/pitch hard-clamped to `0–85°`, wheel/trackpad and two-pointer extended zoom, and a fresh six-second eased return; a single pulsing vehicle point with a one-second ripple replaces the former moving line highlight. The top-navigation GPS control shows only `GPS` plus metre accuracy and communicates precise, imprecise-over-4-metre, and disconnected states in green, orange, and red. A Tesla-evidence-driven performance pass caps only the MapLibre framebuffer at `1.25×` and consolidates marker updates; fresh vehicle proof of the 30 FPS target remains open;
- ✅ ATLAS has tested, session-only A3/A3b/A4 navigation: a high-cadence ref feed keeps eight monotonic GPS samples even when numeric speed is unavailable, timestamp-based interpolation is identical at 30/60 FPS with stale-data freeze and no extrapolation, and the interpolated feed drives the visible point. The owner-selected Navigator Plaque reads the road name only from already rendered OpenMapTiles data and combines it with an English cardinal, exact degrees, and a filled direction arrow whose continuous rotation avoids a long spin across north. It adds no reverse-geocoding request; target-Tesla legibility and motion acceptance remain open;
- ✅ FRACTURE, a production AudioWorklet score with an ambience-only launch, ten four-bar harmonic sections, a narrow tempo knee, quantized transitions, hysteresis, dwell, crossfades, and three authored half-time rhythm families that grow from sparse velvet pulse to weave before the full break is permitted at `88 km/h`; no automatic riff or response lane plays in normal playback;
- ✅ JUNCTION, a sampled production built as one synchronous performance at a time: 24 complete eight-bar clips from 76 distinct recordings, one stable E-minor harmonic grammar, native 127–168 BPM pacing, six slowly evolving clockless PARK voicings without beat or bass, four-second rhythm entrances/releases, one 5.8 MB segmented Opus bank, recent-take avoidance, and no rave lead, tonal second deck, or loose source samples;
- ✅ NIGHTSHIFT, the third adaptive score: 18 complete eight-bar synth-pop
  performances, one project-authored A-minor grammar and native 85–140 BPM
  MusicRadar drum families. Its clockless PARK form has six quiet voicings with
  no beat or bass; fast drumming cannot enter before `82 km/h`. The browser
  retains at most six decoded mixed performances and publishes no source loop;
- ✅ shared acceleration performance effects: OPEN makes hard acceleration
  unmistakable by sweeping a soft-limited score-derived focus band from
  `480 → 3200 Hz`, with only restrained supporting EQ and width; the rarer
  BLOOM event bends only the `300 Hz–8 kHz` band through a bounded
  `8 → 0.8 ms` feed-forward delay, and both always yield to UNDERWATER;
- ✅ production build and deterministic signal, diagnostic-model, and packaging tests passing;
- 🧪 a development-only harmony inventory now analyses the eight chord hits
  reachable by JUNCTION with byte identity, envelope/tuning measurements and
  high-recall note proposals, audits the recordings the renderer really selects,
  and measures printed transitions directly from audio; authoritative pitch
  sets remain deliberately unknown until independent evidence passes ground truth;
- ✅ photographed Tesla split-view evidence at `773 × 601`, screen `1254 × 784`, DPR `1.53`;
- ✅ compact-view v3 diagnostics redesigned as a readable Space Grotesk instrument with a health strip, aligned evidence groups, tabular numerals, one-scroll raw JSON, and a dedicated telemetry/privacy/provenance/licensing/source README; no coordinates are retained, and the explicit same-origin email handoff attaches the complete report as verified gzip-compressed JSON;
- 🧱 bounded network telemetry now supplies the raw REPORT with a deterministic, non-visual notice state that separates browser connectivity estimates from observed app transfers, failures and recoveries; the quiet-when-healthy navbar treatment remains behind the three-direction interface gate;
- ✅ SOUNDTRACK now discovers eligible fixed recordings through a short-lived, server-side Jamendo catalogue relay, prepares previous/current/next as three transient browser media elements, and streams the selected track through a same-origin no-store audio relay into the production Web Audio graph. The App and owner LAB expose real artist, title, artwork, licence, Jamendo credit, and direct source links without persisting audio or exposing the credential;
- ✅ the running Music drawer is now a complete no-scroll `773 × 601` driving surface: two persistent horizontal top selectors switch Play the Road/Soundtrack immediately, Pace occupies one vertical column, fifteen readable Jamendo genres occupy a `5 × 3` grid, six tracks occupy two rows, and the compact player and non-overlapping QR credits remain visible together. The Lobo card identifies a featured artist and original Illobo recordings, while the active player gains a restrained animated activity mark. The owner-selected Play the Road composition follows Generated image 35: JUNCTION and NIGHTSHIFT are two sampled cards on the first row, FRACTURE is one full-width responsive-generative card below, and all three retain distinct covers and listener-facing descriptions. All 29 Illobo recordings have title-specific artwork from one coherent dark Swiss-modernist family;
- ✅ DISCOVER is a separate passenger index rather than permanent ATLAS chrome: its selected split layout keeps up to five image-led places visible on the left and one article reader always open on the right, follows the first supported browser language, provides an internal language selector and search, paginates safely to at most 15 Wikipedia sources with `+N MORE`, estimates local distance/time, and hands the selected destination to Google Maps or back to ATLAS. Location remains session-only and only the same coarse `0.05°` cell already used by ATLAS reaches localized Wikipedia;
- ✅ fixed recordings remain at authored `1×` playback and driving never selects or retimes them. Equal-width footer MUTE and FX controls share one `LABEL / ON–OFF / GLOBAL` hierarchy; FX gates only the audible OPEN/UNDERWATER/BLOOM processing while road macros continue to animate the visuals. One shared two-stage perceptual UNDERWATER model serves Soundtrack and NIGHTSHIFT, reaches approximately `1.5 kHz` at the visible engagement threshold and approximately `460 Hz` at full depth, and preserves bounded pressure and output level. PLAY THE ROAD starts enabled and SOUNDTRACK still requires fresh-session opt-in. Four independent passenger controls—flanger, reverb, chorus, and bounded echo—live in a compact footer-launched FX Deck, use deliberately strong tap states plus individual depth controls, and share one limited wet graph across both music sources. Licences that disallow effects and all ND/unknown records fail closed before playback;
- ✅ the performance footer now reserves a compact, fixed-width two-row palette at the far right—`138 px` at the Tesla breakpoint and `160 px` on desktop—and uses the recovered centre span for the global `MIX` / FX Deck control. Volume and vehicle-audio effect changes confirm themselves with a short centred status notice;
- ✅ completed footer actions and the final closed drawer hand focus back to the neutral running visual, so no stale trigger selection can keep the header/footer awake; open surfaces and keyboard navigation retain accessible focus, while idle chrome retracts after 4.2 seconds;
- ✅ editorial Music and Visual names now use dedicated Title Case display labels in the launcher, running footer, and both pickers while compact functional labels remain uppercase. Footer names and catalogue numbers share one baseline and one type size at both verified viewports; canonical uppercase registry labels remain unchanged for diagnostics and stable identity;
- ✅ the canonical bare root, direct PHP entry, and content-addressed assets are live and byte-identical after the SiteGround cache flush;
- ✅ the owner-selected **16 Road** identity ships as dark, light, and genuine-alpha SVG masters, 512/1024 px PNGs, favicon/touch/product icons, and browser icon metadata; its large Orbitron-outline `16` is framed by mirrored vermilion and ivory roads that fill the square canvas;
- ✅ the first complete Tesla report confirms 60.04 FPS overall, 16.8 ms p95, four slow frames, 33.2 MB peak decoded PCM, and no runtime issue during a 314-second drive;
- ⏳ Aperture's `0–40 km/h` wall-retreat budget, the simplified FRACTURE/JUNCTION arrangements, the rebuilt Meridian speed corridor, and the ATLAS flight camera still require acceptance in the target Tesla;
- ⛔ no committed release, PWA/offline cache, final audio pack, or final mixed-license package yet.

## Experience

The product is configured while parked. One deliberate **PLAY THE ROAD** gesture
on the animated Signal Gate splash opens the compact Instrument Deck. Its two
visible sections require an explicit initial **MUSIC** choice—PLAY THE ROAD,
SOUNDTRACK, or MUTE—and one **VISUAL** before **START** can unlock Web Audio,
check capabilities, request GPS permission, and enter the experience. Selecting
SOUNDTRACK prepares three eligible Jamendo roles before START is enabled; actual
playback still begins only after that explicit user gesture. Every choice carries
a short description; Illobo's featured treatment belongs inside the running
SOUNDTRACK library rather than this top-level launcher. The running Music drawer
uses two horizontal top selectors for **Play the Road** and **Soundtrack**—the
adaptive branch is not called generative because it also contains sampled
scores—then presents compact, equal-weight **Illobo Featured** and **Jamendo
Library** alternatives. Both complete path cards remain enabled and visible at
the Tesla breakpoint, so selecting one never removes the route back to the
other. Jamendo cover previews remain owned by the last real Jamendo catalogue
while Illobo is active rather than being derived from the active queue. The Jamendo branch previews real cover art and starts
immediately from a selected pace, one of 15 verified genre routes, or an exact
track. Pace and genre use full-surface one-tap chips with standard media icons;
Pace occupies a narrow vertical rail and the fifteen genres use the remaining
space as a readable `5 × 3` grid at the Tesla viewport, while six track rows,
the player, and complete credit remain visible without scrolling.
Play the Road lists only JUNCTION, FRACTURE, and NIGHTSHIFT, each with its own
cover and listener-facing description. JUNCTION and NIGHTSHIFT occupy the two
sampled cards on the first row; FRACTURE occupies the full-width responsive-
generative row below. Its deterministic fresh mix changes every 30 minutes;
every explicit Featured press chooses a different random Illobo recording when
alternatives exist and starts it from `0:00`. An unfiltered Soundtrack start belongs explicitly to
Jamendo Library; `PLAY FEATURED` switches to and immediately starts Illobo's
independently seeded half-hour queue instead of reloading the same selection.
That gesture reuses its prepared catalogue before transient playback activation
expires; exact-track relay lookup verifies the returned ID across compatible
metadata query forms, and a failed deck cannot poison the next replacement.
Illobo Featured uses both owner-supplied LOBO identity
variants byte-identically as its cover on an unclipped square dark field. A
continuous eight-second CSS cycle takes four seconds to dissolve fully from one
variant to the other, with no hold between them. The solid state remains white
on black; the original outline remains black on a graphite field, so the two
endpoints are perceptually distinct without recolouring either SVG. Pace remains passenger-selected discovery metadata and
never follows road speed or retimes audio; every recording remains at authored
`1×`. Manual track changes use a nominal `450 ms` equal-power transition across
at most three transient decks. The visible credit follows the audio-clock mix
during rapid retargeting, while a compact QR always hands the passenger the
current public track page rather than an audio stream URL. During active fixed-
recording playback, the document title exposes `16 - Artist - Track title` for
Tesla's browser-labelled media surface and returns to the product title on pause.
The launcher now
establishes the owner-selected LIGHT **Road Sheet** language: one warm-ivory open
sheet, a compact left-aligned 16 Road and Orbitron wordmark lockup, hairline
structure, quiet-gray controls, short vermilion state rails, and one black action
field. At `773 × 601`, the complete Music and Visual button areas have exactly
the same top, bottom, and `342 px` height; a registry-derived Visual row count
lets a future third row divide that fixed block into three `108.66 px` tracks.
The `72 px` header, `3 px` title/description gap, shared `10 px` card padding and
`8 px` grid gap preserve legibility while reserving vertical and horizontal
space. The same anatomy is reserved for future DARK using near-black, charcoal,
dark-gray, warm-light, and vermilion tokens. X10 now has a separate tested
LIGHT/DARK/AUTO preference/reset and offline solar fallback model, but its
visible control and product-wide tokens remain deliberately unwired and never
recolour the selected visual palette. The opening gesture remains one compact
`360 × 160 px` flat surface: the selected 16 Road mark sits beside a responsive
lowercase `sedicivalvole` wordmark in Orbitron `750` with restrained `-0.02em`
tracking, above the Space Grotesk `600` `PLAY THE ROAD` field. The same isolated
Orbitron treatment identifies the Instrument Deck and owner LAB; the running
top bar instead uses the transparent 16 Road mark alone in a fixed `68 px`
report trigger. This leaves `195 px` of measured room at `773 × 601` and
`124 px` at `702 × 546` for later appearance or status controls without moving
telemetry, GPS, or REPORT. Every other live product and report surface remains
Space Grotesk. The command's white-to-red wave translates by one exact repeating
period, so every loop joins continuously. The interface remains Braun-influenced,
Swiss, and slightly brutalist while the generative field supplies the visual
contrast. Visible controls and framed surfaces use the shared restrained `6 px`
corner radius; sharp standalone corners are not part of the product language.
The active palette also owns the interface accent and is retained as an optional
local preference across reloads and later visits.

The speed source is an explicit abstraction. GPS and the desktop simulator produce the same normalized stream. Hold `ArrowUp` as an accelerator; releasing it enters a progressive nominal Model 3 AWD regenerative slowdown instead of dropping to zero. `ArrowDown` explicitly requests that lift-off state. Holding `Space` applies the stronger estimated service-brake curve from the exact current speed. Reference acceleration, lift-off, and braking dynamics define soft GPS plausibility bands without creating or replacing real motion samples. Keyboard handling never steals input from focused controls.

## Current modes

Confirmed product modes:

- **Engine** — selectable engine-sound emulation with a dedicated instrument-inspired visual language. Audio modeling, catalog, and final visual direction are not implemented yet.
- **Flux** — adaptive music driven by speed and motion, paired with six selectable visual environments in the source checkout. Aperture is the accepted default and begins as a rigid square wall that recedes and disappears at the existing tunnel terminus by `40 km/h`. Vertigo embeds the original Codrops/Tympanus Interstate 7 runtime unchanged behind an external speed/FOV and palette bridge. Meridian is a low, stable corridor of sparse oblique palette-lit blades and longitudinal shoulder planes. ATLAS follows the trusted position and travel bearing above an OpenFreeMap city. DRIVEY embeds the original Rezmason road, levels, traffic, cameras and rendering pipeline behind a narrow bridge that retains upstream automatic curve following, holds the player lane-centred at zero, keeps only deterministically opposing NPC traffic, and renders every theme's native accent/secondary pair; compact text-only controls cycle Hood, Rear and Aerial views and Normal/Wire rendering without a menu. PRTCL adapts the authorized Fractal Frequency, Murmuration, and Axiom formulas into one bounded WebGL2 field; road speed changes both its complete form and point scale, while OPEN, UNDERWATER and BLOOM move through continuous envelopes instead of snapping. A single compact text-only `TYPE` button cycles those families while the existing `PALETTE` control remains separate. The next original Gradient Field is planned but cannot enter implementation until exactly three visual directions are presented and one is selected. This is the mode currently implemented as Drive Lab.

Shared foundations include the GPS/Demo speed source, integrated diagnostics, master Stop/Mute, reduced motion, renderer fallback, and touch-first safety behavior. The mode switch will remain clearly identifiable and reachable from both experiences.

The current music library has three selectable authored works: generative
AudioWorklet score **FRACTURE** and sampled adaptive productions **JUNCTION**
and **NIGHTSHIFT**. Four later directions remain `IN PREPARATION`. Their musical quality and
relationship to real acceleration remain pending a Tesla listening test.

## Quick start

```bash
cd prototype/drive-lab
npm ci
npm run dev
```

Production verification:

```bash
npm run build
npm test
```

The standalone technical harness remains in `diagnostics/tesla-capabilities/`; equivalent high-value readings are accessible from the main Drive Lab report.

The owner calibration surface is developed locally at `/lab.html` and packaged
for a server-authenticated canonical `/lab/`. It is deliberately separate from
the public driving flow. Production access requires ignored local configuration;
no password, password verifier, mail recipient, coordinate, or raw credential is
included in the client bundle or repository.

## Architecture

The current prototype uses React, Vite, a sample-accurate AudioWorklet score
engine, authored WebGL2 and Canvas2D renderers with progressive fallbacks, a
lazy MapLibre city field, and the same DSP core in Node for offline listening
renders. This does not freeze a future release stack.

See [`docs/TECHNICAL-DIRECTION.md`](docs/TECHNICAL-DIRECTION.md).

## Safety and privacy

- Use and configure the experience only while parked; do not adjust the touchscreen while driving.
- Speed and diagnostic processing never persist or transmit coordinates. ATLAS and DISCOVER keep the latest reliable point only in session memory; OpenFreeMap receives only the tile area needed to draw the city and localized Wikipedia receives only a coarse `0.05°` nearby-search cell while the related surface is selected. Neither the diagnostic report nor local storage contains the position.
- No analytics or automatic remote telemetry is enabled. Extensive local diagnostics are aggregated with bounded overhead and transmitted only after the user explicitly taps **SEND DIAGNOSTIC**.
- FTP deployment is functional but unencrypted; credentials and content travel in clear text.
- An upload is not considered successful until the canonical URL, HTML, assets, and cache behavior are verified.

## Versioning and changelog

[`VERSION`](VERSION) is the only SemVer source of truth. `0.0.0` means there is
no release yet. The build injects the version into diagnostics; the splash shows
the separate `YYYYMMDD-HHMM` build stamp used for publication evidence.

All relevant changes are recorded in [`CHANGELOG.md`](CHANGELOG.md), with work in `Unreleased` until an explicit release is approved.

## Screenshots

No screenshot is published here yet. The repository will include only real, current product captures verified at agreed Tesla viewports. Generated directions, archived prototypes, and obsolete screenshots are not product evidence.

## Roadmap

The next visual gate is exactly three project-authored Gradient Field
directions informed by the separately audited reference boundaries for
ShaderGradient, FeralUI Gradients, and ColorFlow. After one is selected, a real
Tesla session at the verified split viewport will compare the six current visuals across
acceleration and deceleration, verify
Aperture's 60 FPS desktop gain on the vehicle,
listen critically to FRACTURE, JUNCTION and NIGHTSHIFT, test
the Music/Visual/theme controls, and check touch reach while parked.
The responsive queue also includes a landscape-first iPhone pass with safe-area
handling and an accessible portrait rotation notice that preserves the running
session when the device turns to landscape.

See [`docs/ROADMAP.md`](docs/ROADMAP.md).

Long-horizon owner ideas and deliberately divergent proposals are preserved in
the canonical [`docs/FUTURE-IDEAS.md`](docs/FUTURE-IDEAS.md) register. Entries
there are not implementation promises; promoted work links back to the roadmap.

## Documentation

- [`docs/CURRENT-STATE.md`](docs/CURRENT-STATE.md) — authoritative working overview and documentation map;
- [`docs/FUTURE-IDEAS.md`](docs/FUTURE-IDEAS.md) — canonical recoverable register for owner ideas and clearly separated agent proposals;
- [`docs/PRODUCT-SPEC.md`](docs/PRODUCT-SPEC.md) — confirmed requirements, assumptions, and open questions;
- [`docs/ADVERSARIAL-REVIEW.md`](docs/ADVERSARIAL-REVIEW.md) — independent critique of the bootstrap proposals;
- [`docs/TECHNICAL-DIRECTION.md`](docs/TECHNICAL-DIRECTION.md) — recommended architecture and signal model;
- [`docs/SOURCE-AUDIT.md`](docs/SOURCE-AUDIT.md) — archive integrity and source findings;
- [`docs/REFERENCE-LIBRARY.md`](docs/REFERENCE-LIBRARY.md) — local external-material convention;
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — sanitized deployment procedure and verified state;
- [`docs/DIAGNOSTICS.md`](docs/DIAGNOSTICS.md) — verified Tesla measurements and report-delivery architecture;
- [`docs/MODES.md`](docs/MODES.md) — confirmed Engine/Flux product architecture and open decisions;
- [`docs/REFERENCE-STUDY-TEXTSTEP.md`](docs/REFERENCE-STUDY-TEXTSTEP.md) — Lobo's textStep credit, provenance, mechanics, and authorized adoption plan;
- [`docs/MUSIC-CRAFT.md`](docs/MUSIC-CRAFT.md) — accumulated musical knowledge, failures, tests, and production technique;
- [`docs/AUDIO-QA-2026-08-28.md`](docs/AUDIO-QA-2026-08-28.md) — current FRACTURE/JUNCTION reference renders, objective mix measurements, and listening boundary;
- [`docs/SESSION-HANDOFF.md`](docs/SESSION-HANDOFF.md) — current implementation handoff and remaining work;
- [`docs/GITHUB.md`](docs/GITHUB.md) — public-repository and GitHub CLI operating notes;
- [`docs/LICENSING.md`](docs/LICENSING.md) — active mixed-license decision and open legal work.
- [`docs/LICENSE-MIGRATION-2026-08-30.md`](docs/LICENSE-MIGRATION-2026-08-30.md) — prospective PolyForm migration, historical AGPL boundary, and file-family audit.

## License

Original sedicivalvole source code and documentation are available under the
[PolyForm Noncommercial License 1.0.0](LICENSE). This is source-visible
noncommercial software, not open source: commercial use is not granted. Public
versions already received under AGPL retain their earlier rights. Third-party
material keeps its own licence or direct permission case by case; original
brand, screenshots, audio, and standalone media remain reserved unless a file
says otherwise. See [LICENSE-SCOPE.md](LICENSE-SCOPE.md), [NOTICE](NOTICE),
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), and
[`docs/LICENSING.md`](docs/LICENSING.md).
