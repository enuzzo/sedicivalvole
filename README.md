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
> NIGHTSHIFT music with six selectable visual environments plus the DISCOVER 07
> passenger destination in one Visual catalogue and is under vehicle validation**. PRTCL 06 and braking
> UNDERWATER are published on the canonical root. The rejected PRIMORDIAL field has
> been removed from the product; its history remains in Git. This is a
> development build, not a release.

Public development repository: [github.com/enuzzo/sedicivalvole](https://github.com/enuzzo/sedicivalvole).

## Vision

`sedicivalvole` turns speed, sound, and light into an atmospheric, useful, and memorable in-car experience. It is not a generic dashboard. Two equal primary modes share one motion signal and safety model while offering deliberately different audio and visual identities.

The canonical development build is available at [sedicivalvole.app](https://sedicivalvole.app/).
The current canonical identity is version `0.0.0`, commit `4ffd707`, build
`20260903-2137`; exact browser QA at `773 × 601` passes Road Sheet
LIGHT/DARK/AUTO, the restored compact Music layout, deferred inactive score
worklets, the Underwater-only vehicle response, palette isolation, focus, and
on-screen transport, plus compact speed/network telemetry and the shared
Gradient/Drivey/PRTCL contextual-control grammar. Native Tesla Media
Session remains open, and the Jamendo/Illobo stutter correction now requires
continuous physical listening after build `20260903-1752` failed despite
measured network headroom. Diagnostic-driven checkpoint `26c4043` now requires
observable contiguous buffer rather than trusting optimistic browser readiness,
delays adjacent audio preload until the current track owns `30 s` of headroom,
and attributes every media lifecycle event to its emitting deck. The correction
is canonical and browser-verified; physical listening remains a separate gate.

## What exists today

- ✅ a single ignored local reference library under `_references/`;
- ✅ source audit, product requirements, adversarial review, technical direction, and roadmap;
- ✅ the exact MIT `@shadergradient/react@2.4.20` stack now powers one public `GRADIENT 08` family with the owner-selected Japanese Mist, Acid Orchard, and Chromatic Silk variants through one separate lazy product chunk. The standalone `/shadergradient-lab.html` and authenticated `/lab` workbenches remain available with the same three registered studies, all ten official presets, all geometries and registered shader families, and the complete useful public control surface;
- ✅ Modular Aperture selected after exactly three revised Product Design directions;
- ✅ eight choices in the shared Flux Visual catalogue: seven rendered environment families—procedural Aperture, byte-identical upstream Interstate 7 Vertigo, the original architectural Meridian environment, lazy-loaded OpenFreeMap ATLAS, source-faithful Rezmason Drivey, PRTCL, and the lazy `GRADIENT 08` family—plus the separate DISCOVER 07 Passenger Index destination. A persistent in-visual `VARIANT` control cycles Gradient through Japanese Mist, Acid Orchard, and Chromatic Silk. The catalogues state Drivey's three views/two renders, PRTCL's three types, and Gradient's three variants without fabricating counts for single-state visuals. Aperture uses one longitudinal grid origin across all four tunnel planes so their depth cuts meet at the corners. The initial Instrument Deck and running Visual library fit the complete catalogue at `773 × 601` without pretending that Discover is a renderer;
- 🛑 PRIMORDIAL and WAKE were rejected after visual review and have been removed from the catalog, runtime, tests, and current QA surface. PLUMB remains retired, SLIP remains proposal-only, and Aperture remains the accepted fresh-session fallback;
- ✅ GPS/Demo speed source, icon-only Mute, a fixed `130 km/h` audiovisual response ceiling with truthful higher-speed display, 10 curated palettes, and an integrated capability report;
- ✅ local-only speed processing and a coordinate-free session report; while selected, ATLAS keeps the complete driven route in bounded session memory, compacts older detail without deleting the trip origin, and never copies the route into the report. It discloses its OpenFreeMap tile and rounded-cell Open-Meteo/Copernicus terrain-elevation requests; Wikimedia reading belongs only to the separate DISCOVER surface;
- ✅ ATLAS touch and desktop exploration with one-pointer or primary-mouse bearing/pitch hard-clamped to `0–85°`, wheel/trackpad and two-pointer extended zoom, and a fresh six-second eased return; a single pulsing vehicle point with a one-second ripple replaces the former moving line highlight. The top-navigation GPS control shows only `GPS` plus metre accuracy and communicates precise, imprecise-over-4-metre, and disconnected states in green, orange, and red. A Tesla-evidence-driven performance pass caps only the MapLibre framebuffer at `1.25×` and consolidates marker updates; fresh vehicle proof of the 30 FPS target remains open;
- ✅ ATLAS has tested, session-only A3/A3b/A4 navigation: a high-cadence ref feed keeps eight monotonic GPS samples even when numeric speed is unavailable, timestamp-based interpolation is identical at 30/60 FPS with stale-data freeze and no extrapolation, and the interpolated feed drives the visible point. The owner-selected Navigator Plaque reads the road name only from already rendered OpenMapTiles data and combines it with an English cardinal, exact degrees, and a filled direction arrow whose continuous rotation avoids a long spin across north. The owner-selected `320 px` Drive Lab uses a `340 px` Canvas2D instrument and keeps Speed, Distance, Moving time and Average speed above a vertical instrument: full-width Accel/Braking, one proportional five-band speed strip, an eight-sector Direction History rose with up to five outward time-share tiles, compact Open-Meteo/Copernicus GLO-90 Elevation, and a low Moving/Stopped strip. Only headings captured at or above `2 km/h` enter the rose, and bounded weighted rollups preserve exact sector counts rather than averaging them into a false direction. Larger, higher-contrast direct labels retain the no-scroll Tesla composition. Every chart cycles through `15 MIN / 1 H / SESSION`; bounded weighted rollups preserve all-session truth. ATLAS contains no Wikipedia/Discover duplication. A persistent ATLAS-only `MAP COLOR` control switches the existing map in place between product `PALETTE` and dark semantic `STANDARD` cartography; water, vegetation, buildings, and road classes separate without recolouring the route or interface, and the choice is part of safe resettable browser preferences. An accessible `48 × 48 px` target presents the icon-only `36 × 30 px` midpoint tab and gives the complete field back to the map. No reverse-geocoding request is added; target-Tesla legibility, colour, touch, and motion acceptance remain open;
- ✅ FRACTURE, a production AudioWorklet score with an ambience-only launch, ten four-bar harmonic sections, a narrow tempo knee, quantized transitions, hysteresis, dwell, crossfades, and three authored half-time rhythm families that grow from sparse velvet pulse to weave before the full break is permitted at `88 km/h`; no automatic riff or response lane plays in normal playback;
- ✅ JUNCTION, a sampled production built as one synchronous performance at a time: 24 complete eight-bar clips from 76 distinct recordings, one stable E-minor harmonic grammar, native 127–168 BPM pacing, six slowly evolving clockless PARK voicings without beat or bass, four-second rhythm entrances/releases, one 5.8 MB segmented Opus bank, recent-take avoidance, and no rave lead, tonal second deck, or loose source samples;
- ✅ NIGHTSHIFT, the third adaptive score: 18 complete eight-bar synth-pop
  performances, one project-authored A-minor grammar and native 85–140 BPM
  MusicRadar drum families. Its clockless PARK form has six quiet voicings with
  no beat or bass; fast drumming cannot enter before `82 km/h`. The browser
  retains at most six decoded mixed performances and publishes no source loop;
- ✅ one vehicle-reactive effect: firm braking drives the shared perceptual
  UNDERWATER gesture. OPEN and BLOOM are retired from detection, audio graphs,
  visual mappings, the public build, and the protected LAB; ordinary
  acceleration adds no separate reactive effect;
- ✅ production build and deterministic signal, diagnostic-model, and packaging tests passing;
- 🧪 a development-only harmony inventory now analyses the eight chord hits
  reachable by JUNCTION with byte identity, envelope/tuning measurements and
  high-recall note proposals, audits the recordings the renderer really selects,
  and measures printed transitions directly from audio; authoritative pitch
  sets remain deliberately unknown until independent evidence passes ground truth;
- ✅ photographed Tesla split-view evidence at `773 × 601`, screen `1254 × 784`, DPR `1.53`;
- ✅ compact-view v3 diagnostics redesigned as a readable Space Grotesk instrument with a health strip, aligned evidence groups, tabular numerals, one-scroll raw JSON, and a dedicated telemetry/privacy/provenance/licensing/source README. Debug sessions retain a dedicated long-lived sequenced interaction ledger: every safe control activation plus Soundtrack/Media Session request, browser-media lifecycle transition and correlated outcome records source, before/after state, latency, buffer/readiness and playback confirmation. No coordinates, pointer positions, typed text or media URLs are retained, and the explicit same-origin email handoff attaches the fitted report as verified gzip-compressed JSON;
- ✅ bounded network telemetry supplies the raw REPORT with a deterministic notice state that separates browser connectivity estimates from observed app transfers, failures and recoveries. The navbar keeps one hollow ring plus an always-visible rate in green/good, orange/medium, or red/poor. The rate prefers a browser-observed application download sample (`OBS`), retains the latest measurable sample, and falls back explicitly to the Network Information estimate (`EST`)—never invented cellular strength, `NET ONLINE` filler, or a continuous ping score. START remains available with explicit constrained/offline or pending-music copy;
- ✅ SOUNDTRACK now discovers eligible fixed recordings through a short-lived, server-side Jamendo catalogue relay and maps previous/current/next onto exactly three transient browser media elements. The current recording loads first; adjacent roles start metadata-only, and only the next role promotes after the current deck exposes at least `30 s` of contiguous forward buffer. A healthy retained previous deck is rewound and reused instead of discarded. Initial, manual, and automatic changes start silently, require an observable six-second contiguous floor inside the existing ten-second wall-clock transaction, rewind, then become audible; browser `readyState` is only a fallback when `TimeRanges` is unavailable. Failure atomically preserves the prior track and retry. Soundtrack and the adaptive macro detector share one playback-oriented `AudioContext` in either launch order, while inactive Play the Road AudioWorklets remain deferred until an explicit switch. The App and owner LAB expose real artist, title, artwork, licence, Jamendo credit, and direct source links without persisting audio or exposing the credential;
- ✅ on-screen and browser-native Play, Pause, Previous, and Next now share stable Media Session handlers across Play the Road and Soundtrack. The native surface publishes metadata, artwork, playback state, and position only when each value is observed and valid. One serialized intent queue cancels stale queued work after a newer source, track, score, or reset choice; repeated Play while a fixed recording buffers shares one activation, and Pause then Play resumes from the observed position. The flight recorder correlates every native invocation ID, sequence, and outcome without retaining media URLs;
- ✅ the running Music drawer preserves the Swiss Compact semantic hierarchy at `773 × 601`: two persistent horizontal top selectors switch Play the Road/Soundtrack immediately; Lobo/Jamendo remain paired, with Pace as the narrow left rail and all 15 genres in the adjacent `5 × 3` board. Tracks, player, and credits scroll vertically when their touch-first controls no longer fit. The owner-selected Play the Road composition follows Generated image 35. All 29 Illobo recordings have title-specific artwork from one coherent dark Swiss-modernist family; the browser receives compact matched WebP derivatives while the 512 px PNG masters remain local for the artist;
- ✅ the owner-selected **Tesla Compact** refinement applies one shared semantic scale to the public product, owner LAB, ShaderGradient workbench, diagnostics, Discover, and ATLAS: `13 px` metadata, `14 px` labels, `15 px` body/action copy, `17 px` active names, `22 px` titles, and `32 px` primary values. Its `48 px` action and `56 px` primary targets stay independent from type, while the Tesla navbar, Now Playing band, and footer each use `64 px`. The running shell retains artwork, title, artist/source and previous/play-pause/next transport, but mounts the lower Now Playing overlay only on the unobstructed visual field: passenger drawers and DISCOVER suppress it, and ATLAS reserves the full field for map and telemetry. Stable session-lifetime Media Session handlers and a serialized transport queue remove handler gaps and rapid Back/Forward races. Shared drawers accept cancelable down/right swipe dismissal without weakening CLOSE, Escape, scroll or focus behavior, and restored trigger focus is released back to the experience so chrome can retract normally;
- ✅ the owner-selected Direction 2 **Road Sheet** appearance applies that same anatomy to the shared shell. LIGHT is the default; a direct top-rail control uses the official Tabler sun, moon, and sun-moon icons for persisted LIGHT, DARK, and AUTO choices. AUTO follows an observable system scheme first, then uses solar phase only when the running app already has a consented session position, and otherwise falls back safely without triggering a permission prompt or storing coordinates. Appearance changes semantic chrome only: the active Flux palette, canvases, iframes, map pixels, and authored visual colour remain independent;
- ✅ DISCOVER is an independent passenger index, not ATLAS chrome: its selected split layout uses a `52 px` heading band with a `24 px` title, `48 px` tools, `64 px` result rows and a `246 px` rail, fills the available fold before an exact inline `+N MORE`, keeps all at-most-15 image-led sources in one scroll, and leaves one complete localized Wikipedia article open at right with readable chapters, images and infoboxes inside a sandbox. It follows the first supported browser language and provides an internal language selector. An empty query keeps session-only `NEARBY / AHEAD / REGION`; free text searches the selected Wikipedia edition globally, preserves Wikipedia relevance order and works without GPS. The destination-only Google Maps QR remains in place with Tesla-app handoff guidance, never setting an origin or starting navigation automatically, and there is no ATLAS action;
- ✅ fixed recordings remain at authored `1×` playback and driving never selects or retimes them. Equal-width footer MUTE and FX controls retain direct `LABEL / ON–OFF` hierarchy while obsolete `GLOBAL` and active-count microcopy is removed to protect the compact `72 px` control plane. FX gates only the audible braking UNDERWATER processing while its shared envelope continues to animate the visuals. One shared two-stage perceptual UNDERWATER model serves Soundtrack and NIGHTSHIFT, reaches approximately `1.5 kHz` at the visible engagement threshold and approximately `460 Hz` at full depth, and preserves bounded pressure and output level. PLAY THE ROAD starts enabled and SOUNDTRACK still requires fresh-session opt-in. Eight independent passenger controls—Flanger, Reverb, Underwater, Phaser, Bitcrush, Bass Drive, Radio Cut, and High Cut—live in a footer-launched `2 × 4` FX Deck, use deliberately strong tap states plus individual depth controls, and share one limited wet graph across both music sources. Bass Drive, Radio Cut, and High Cut form one visually marked tone/filter family; licences that disallow effects and all ND/unknown records fail closed before playback;
- ✅ the performance footer now reserves a compact, enlarged two-row palette at the far right and uses the recovered centre span for the global `MIX` / FX Deck control. Safe versioned preferences restore palette, visual, Music mode/selection, mute/FX and manual depths after reload; both launch and REPORT expose RESET SAVED STATE, while GPS and routes remain session-only;
- ✅ completed footer actions and the final closed drawer hand focus back to the neutral running visual, so no stale trigger selection can keep the header/footer awake; open surfaces and keyboard navigation retain accessible focus, while idle chrome retracts after 4.2 seconds. GPS updates, demo acceleration/braking and passive pointer movement never wake it; a deliberate pointer press/touch does;
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
space. The same anatomy now serves DARK through near-black, charcoal, dark-gray,
warm-light, and vermilion tokens. LIGHT is the fresh-install default, and the
running top rail exposes an official-icon LIGHT/DARK/AUTO menu. Manual choices
persist independently from the active Flux palette. AUTO prioritizes a browser
scheme only when that signal can actually be observed, then uses solar phase
from an already-consented session position, and otherwise falls back without a
new GPS prompt or coordinate persistence. The opening gesture remains one compact
`360 × 160 px` flat surface: the selected 16 Road mark sits beside a responsive
lowercase `sedicivalvole` wordmark in Orbitron `750` with restrained `-0.02em`
tracking, above the Space Grotesk `600` `PLAY THE ROAD` field. The same isolated
Orbitron treatment identifies the Instrument Deck and owner LAB; the running
top bar instead uses the transparent 16 Road mark alone in a fixed `68 px`
report trigger on wide layouts. At `773 × 601`, the seven top tracks are
`164 / 104 / 112 / 86 / 84 / 116 / 107 px` for mode, speed, network,
appearance, GPS, Discover, and Report. Every other live product and report surface remains
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
- **Flux** — adaptive music driven by speed and motion, currently with eight driver-facing Visual choices: seven selectable rendered environment families plus the DISCOVER 07 Passenger Index destination. Aperture is the accepted default and begins as a rigid square wall that recedes and disappears at the existing tunnel terminus by `40 km/h`. Vertigo embeds the original Codrops/Tympanus Interstate 7 runtime unchanged behind an external speed/FOV and palette bridge. Meridian is a low, stable corridor of sparse oblique palette-lit blades and longitudinal shoulder planes. ATLAS follows the trusted position and travel bearing above an OpenFreeMap city. DRIVEY embeds the original Rezmason road, levels, traffic, cameras and rendering pipeline behind a narrow bridge that retains upstream automatic curve following, uses VERTIGO's quadratic road response to compensate Drivey's nonlinear cruise physics, holds the player lane-centred at zero, keeps only deterministically opposing GPS-speed-matched NPC traffic, and renders every theme's native accent/secondary pair; compact text-only controls cycle Hood, Rear and Aerial views and Normal/Wire rendering without a menu. PRTCL adapts the authorized Fractal Frequency and Axiom formulas into one bounded WebGL2 field; Murmuration is temporarily outside the active product. Road speed changes both its complete form and point scale, while braking UNDERWATER moves through one continuous envelope instead of snapping; Fractal's deepest brake state is 25% larger than the previous minimum. A compact text-only `TYPE` button cycles the two active families while the existing `PALETTE` control remains separate. `GRADIENT 08` is one ShaderGradient family whose persistent in-visual `VARIANT` control cycles Japanese Mist, Acid Orchard, and Chromatic Silk. Gradient, Drivey, and PRTCL share one top-left `112 px` switch column, `48 px` minimum touch geometry, padding, and label/value hierarchy so the control location remains learned across visuals; Drivey adds its second Render column beside View. Each Gradient variant retains its selected geometry and motion, adopts the active product palette with one derived third colour, and visibly folds and densifies during braking before restoring on release. Splash and running Visual catalogues omit internal-choice counts; the running drawer alone keeps stable `01–08` catalogue numbering. Selecting Discover opens its passenger surface over Aperture and closing it returns to that real field. This is the mode currently implemented as Drive Lab.

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

The owner calibration surface is developed locally at the canonical `/lab/`
route, which Vite maps to its private development entry, and is packaged for
the same server-authenticated `/lab/` path. It is deliberately separate from
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
- Speed and diagnostic processing never persist coordinates. ATLAS and DISCOVER keep the latest reliable point only in session memory; OpenFreeMap receives only the tile area needed to draw the city, DISCOVER sends localized Wikipedia a coarse `0.05°` cell only for empty-query nearby scopes, and its global free-text search sends no position. ATLAS sends Open-Meteo an approximately `0.001°` rounded cell only to return 90 m-resolution Copernicus ground elevation while selected. Neither the diagnostic report nor local storage contains the position or journey history.
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

The earlier project-owned Gradient experiment is retired. The owner instead
promoted the three exact ShaderGradient LAB starting points as variants of one
public `GRADIENT 08` family under the retained MIT notice: Japanese Mist, Acid
Orchard, and Chromatic Silk. The upstream package is unmodified and isolated in a
lazy product chunk; project code owns the response mapping and Canvas2D fallback.
A real Tesla session at the verified split viewport will compare the seven rendered families and all three Gradient variants across
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
- [`docs/LOCAL-SHADERGRADIENT-LAB.md`](docs/LOCAL-SHADERGRADIENT-LAB.md) — exact local run, controls, production boundary, and MIT modification rules for the ShaderGradient playground;
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

### Astra UI audit foundation — 2026-09-04

The [office audit](docs/ASTRA-UI-AUDIT-2026-09-04.md) records the tested semantic colour resolver and the full outstanding UI/regression ledger. Its 300 palette/appearance/role variants have reproducible contrast evidence. Component integration and visual acceptance are still pending; this foundation is not a canonical deployment.

## Refined Balanced Rail and semantic palettes — 2026-09-04

The shared interface now couples Now Playing to the retracting footer, closes
unpinned chrome after completed actions or six seconds of inactivity, and leaves
only speed/effect readout visible while moving. Real open menus and drawers retain
control access. ATLAS uses readable case and resolved chart ink; DISCOVER wraps
real place names. Ten palettes share sixteen contrast-tested LIGHT/DARK roles.
The [completed office verification](docs/ASTRA-UI-VERIFICATION-2026-09-04.md)
supersedes the earlier integration-pending foundation checkpoint. It includes
real before/after captures, 625 native tests, 70 browser checks and explicit
physical-Tesla gates. This checkpoint has not been canonically deployed.


### Canonical verification — 2026-09-04 23:59

Build **20260904-2351**, VERSION **0.0.0**, source **6c362ac** is verified live
at [sedicivalvole.app](https://sedicivalvole.app/). Native checks pass 626/626
(including actual PHP and Sites 9/9); canonical HTML/assets/cache and 64 live
browser lifecycle checks pass. Physical Tesla acceptance remains separate.
See the [publication evidence](docs/ASTRA-UI-VERIFICATION-2026-09-04.md).


### Long-trip diagnostic publication — 2026-09-05 00:20

Canonical build **20260905-0012** (source **41721eb**, VERSION **0.0.0**) adds
bounded whole-journey diagnostic context. It retains early-trip observations
without coordinates or automatic transmission. Native tests pass 629/629 with
actual PHP; canonical identity and live report integration pass.
See the [weekend handoff](docs/WEEKEND-HANDOFF-2026-09-05.md) for evidence,
owner-approved drafts, study limitations and the real-vehicle acceptance queue.


### Moving-touch correction — 2026-09-05 00:35

Canonical build **20260905-0028**, source **8dab1b3**, restores deliberate
navbar/footer wake while moving and retains automatic retraction. Live browser
verification passes; target-Tesla confirmation remains separate. See the
[weekend handoff](docs/WEEKEND-HANDOFF-2026-09-05.md) for current evidence.


### Palette disclosure and Music alignment — 2026-09-05 00:57

Canonical build **20260905-0051**, source **ade6c84**, uses one labelled Palette
icon, readable popup names, compact Music typography and aligned Now Playing
artwork, credits and transport. Moving controls remain deliberately accessible.
629 native checks, 69 local lifecycle checks, 20 targeted live checks, four live
moving checks and canonical byte verification pass; real Tesla acceptance remains
open. [Measurements and comparisons](docs/PALETTE-MUSIC-VERIFICATION-2026-09-05.md).

### 2026-09-05 — Curated entry points

Night Glass combines Vertigo, Graphite, DARK and the Lounge catalogue; Neon Groove combines Aperture, Neon, DARK and Funk. Choose either in the launch selector before START or from the running Visual library. Selection composes the existing visual, palette and soundtrack controls; recordings retain their native tempo and the catalogue may vary. The Lobo playlist now uses the owner's round light/dark marks. See [implementation and evidence](docs/NIGHT-GLASS-2026-09-05.md) and the appended current-state/handoff records for publication status and vehicle acceptance.

### Contextual control alignment — 2026-09-05

Prtcl, Drivey and Gradient now align both the functional label and current value to one left edge. Their shared 112 × 52 px controls retain the existing cycle actions and automatic chrome visibility. [Measured before/after verification](docs/CONTEXT-CONTROL-ALIGNMENT-2026-09-05.md).

<!-- COMMUNITY-CREDITS:START -->
## Community thanks — 2026-09-05

A heartfelt thank-you to the people who share the code, type, music, data and experiments that make this project possible. Your names and original projects deserve to travel with the work. The table distinguishes what we actually use from studies and development tools; all upstream rights remain with their authors.

| People / project | Original source | Contribution to sedicivalvole |
|---|---|---|
| 🎵 Lobo (illobo) — textStep / Lobo recordings and marks | [Project](https://github.com/illobo/textStep) | **Integrated code and artist-authorized media.** Transport clock, hex patterns and drum/synth/bus DSP translated into src/score/; 29 separately authorized recordings and the supplied playlist marks. |
| 🌌 Daniel Velasquez (Anemolo), Codrops/Tympanus — Infinite Lights / Interstate 7 | [Repository](https://github.com/Anemolo/Infinite-Lights) · [Daniel Velasquez](https://tympanus.net/codrops/author/anemolito/) · [Original Codrops article](https://tympanus.net/codrops/2019/11/13/high-speed-light-trails-in-three-js/) · [Original demo](https://tympanus.net/Tutorials/InfiniteLights/) | **Integrated vendor runtime.** Byte-identical e58d585 Interstate 7 snapshot in public/third-party/infinite-lights/, with an external speed/FOV/palette bridge for Vertigo. |
| 🛣️ Rezmason; original Drivey by Mark Pursey — Drivey.js | [Project](https://github.com/Rezmason/drivey) | **Integrated vendor runtime.** 51 unchanged runtime files at 5104cda in public/third-party/drivey/, behind a separate integration shell and bridge. |
| 🎨 ruucm and stone-skipper — ShaderGradient | [Project](https://github.com/ruucm/shadergradient) | **Production dependency.** Unmodified @shadergradient/react 2.4.20 in the lazy Gradient family and protected LAB; project-owned starting points, response and fallback. |
| ✒️ Paweł Kuna and contributors — Tabler Icons | [Project](https://github.com/tabler/tabler-icons) | **Integrated assets.** Unchanged v3.46.0 SVGs in public/third-party/tabler-icons/; project CSS supplies optical sizing, masks and semantic colour. |
| 🌈 Björn Ottosson — Oklab reference conversion | [Project](https://bottosson.github.io/posts/oklab/) | **Adapted numeric implementation.** Forward/inverse conversion matrices translated into src/semantic-theme.js; contrast search and role resolution are project-owned. |
| ⚛️ Meta and React contributors — React / React DOM | [Project](https://github.com/facebook/react) | **Production dependencies.** React 19.2.0 and React DOM power the interface and component lifecycle in src/. |
| 🧊 Ricardo Cabello (mrdoob) and contributors — Three.js | [Project](https://github.com/mrdoob/three.js) | **Production and upstream-bundled dependency.** 0.169.0 for ShaderGradient, r109 inside Infinite Lights and r115 inside Drivey; upstream copies remain separate. |
| 🧊 Paul Henschel and Poimandres contributors — React Three Fiber / three-stdlib | [Project](https://github.com/pmndrs/react-three-fiber) | **Production dependencies.** Unmodified R3F 9.7.0 and three-stdlib 2.36.1 support the lazy ShaderGradient renderer; [three-stdlib repository](https://github.com/pmndrs/three-stdlib). |
| 🎥 Yomotsu and contributors — camera-controls | [Project](https://github.com/yomotsu/camera-controls) | **Production dependency.** Unmodified 2.9.0 peer of ShaderGradient; no independent camera-controls fork. |
| 🗺️ MapLibre contributors — MapLibre GL JS | [Project](https://github.com/maplibre/maplibre-gl-js) | **Production dependency.** Lazy ATLAS map rendering and the project-owned palette style in src/environments/atlas/. |
| 🔳 Ryan Day (soldair) and contributors; QR algorithm lineage includes Kazuhiko Arase — node-qrcode | [Project](https://github.com/soldair/node-qrcode) | **Production dependency.** qrcode 1.5.4 generates local passenger handoff links. Public email is from the installed package author metadata. |
| ✒️ Simple Icons contributors — Simple Icons | [Project](https://github.com/simple-icons/simple-icons) | **Integrated icon.** GitHub source-link mark in App.jsx. |
| 🔤 Florian Karsten and project authors — Space Grotesk | [Project](https://github.com/floriankarsten/space-grotesk) | **Bundled font.** Unmodified variable font in public/fonts/, used for reading text, values and controls. Public email is published in the upstream README. |
| 🔤 Matt McInerney and project authors — Orbitron | [Project](https://github.com/theleagueof/orbitron) | **Bundled font.** Unmodified font for the exact sedicivalvole wordmark; selected 16 mark includes outlined glyphs. |
| ✨ Raoul van Rüschen and contributors — postprocessing | [Project](https://github.com/pmndrs/postprocessing) | **Upstream-bundled dependency.** Unmodified 6.8.5 inside the Infinite Lights snapshot; not a newly installed current release. |
| 🧮 Matthew Crumley — expr-eval | [Project](https://github.com/silentmatt/expr-eval) | **Upstream-bundled dependency.** Unchanged 2.0.2 expression evaluator included with the Drivey snapshot. |
| 🎨 Devine Lu Linvega / Hundred Rabbits — Hundred Rabbits Themes | [Project](https://github.com/hundredrabbits/Themes) | **Upstream-bundled dependency.** Unchanged theme support bundled with Drivey; this is not the implementation of our separate semantic palette resolver. |
| 🛠️ Evan You and Vite contributors — Vite / plugin-react | [Project](https://github.com/vitejs/vite) | **Build tools.** Vite 6.4.3 and plugin-react 5.0.4 build the app and protected LAB; [React plugin repository](https://github.com/vitejs/vite-plugin-react). |
| 🥁 MusicRadar, Cyclick Samples and credited Future Music / Computer Music creators — MusicRadar / SampleRadar | [90s jungle — Cyclick Samples](https://www.musicradar.com/news/sampleradar-free-90s-jungle-samples) · [90s synth](https://www.musicradar.com/news/sampleradar-free-90s-synth-samples) · [80s pop drums — Future Music](https://www.musicradar.com/news/sampleradar-free-80s-pop-drums-samples) · [80s construction kits — Computer Music](https://www.musicradar.com/news/sampleradar-free-80s-samples-1) | **Source material for rendered music.** Four packs are listed in THIRD_PARTY_NOTICES.md. Only finished JUNCTION/NIGHTSHIFT arrangements are served; source samples stay excluded. |
| 🎶 Jamendo and each credited recording artist — Jamendo and recording artists | [Project](https://developer.jamendo.com/v3.0) | **Runtime music service.** Catalogue/audio relay plus runtime title, artist, license and source links; individual recordings are not a bundled universal-license music pack. |
| 🗺️ Zsolt Ero (hyperknot) and contributors — OpenFreeMap | [Project](https://github.com/hyperknot/openfreemap) | **Runtime map service.** ATLAS uses the public vector-tile instance; no OpenFreeMap server is vendored. Public email is listed on https://openfreemap.org/. |
| 🌍 OpenMapTiles and OpenStreetMap contributors — OpenMapTiles / OpenStreetMap | [Project](https://github.com/openmaptiles/openmaptiles) | **Runtime data lineage.** OpenFreeMap-delivered map schema/data and in-map attribution; https://www.openmaptiles.org/ and https://www.openstreetmap.org/copyright. |
| ⛰️ Open-Meteo and the European Union Copernicus programme — Open-Meteo / Copernicus elevation | [Project](https://github.com/open-meteo/open-meteo) | **Runtime elevation data.** ATLAS requests session-only GLO-90 terrain elevation for a rounded location cell; no API implementation is copied. |
| 📚 Wikimedia communities and individual article/media authors — Wikipedia / Wikimedia | [Project](https://www.mediawiki.org/wiki/API:Main_page) | **Runtime content service.** DISCOVER uses localized search, abstracts, PageImages and native articles; no encyclopedia content is bundled. |
| ☕ Buy Me a Coffee / Coffee Inc. — Buy Me a Coffee | [Project](https://www.buymeacoffee.com) | **Service identity.** User-supplied QR and cup identity in the support entry; no service code copied. |
| 🌀 Louis Hoebregts (Mamboleoo), Codrops/Tympanus — InfiniteTubes | [Project](https://github.com/Mamboleoo/InfiniteTubes) | **Study only — no copied code.** Particles, Star Wars and Triangle mechanics were studied; project-owned implementation only, upstream assets excluded. |
| 🧪 Liam Egan; embedded noise credited upstream to Inigo Quilez — GLSL: Primordial Soup | [Project](https://codepen.io/shubniggurath/pen/NXGbBo) | **Retired study — no copied code.** Fluid mechanics were studied; the independent experiment was retired. No Pen or attributed noise source is shipped. |
| 🎹 Spotify and Basic Pitch contributors — Spotify Basic Pitch | [Project](https://github.com/spotify/basic-pitch) | **Development only.** Machine-local harmony-analysis note proposals; no package, model or generated report enters the product bundle. |

### 🛠️ Offline analysis and verification tools

These credited tools support development and verification; they do not enter the browser bundle. The analysis requirements and notices record the supported pins. This is the named analysis stack, not a frozen inventory of every machine-local Python environment.

| People / project | Original source | Contribution to sedicivalvole |
|---|---|---|
| 🔢 NumPy contributors — NumPy | [Repository](https://github.com/numpy/numpy) | **Development only.** Numerical arrays for offline music analysis. |
| ⚙️ Numba contributors — Numba | [Repository](https://github.com/numba/numba) | **Development only.** Accelerates the offline numerical analysis stack. |
| ⚙️ Numba / llvmlite contributors — llvmlite | [Repository](https://github.com/numba/llvmlite) | **Development only.** LLVM interface used by Numba; no native compiler enters the app. |
| 📊 scikit-learn contributors — scikit-learn | [Repository](https://github.com/scikit-learn/scikit-learn) | **Development only.** Analysis and model-conversion dependency; version bounded in the analysis requirements. |
| 📦 Python Packaging Authority and contributors — setuptools | [Repository](https://github.com/pypa/setuptools) | **Development only.** Python environment packaging and legacy pkg_resources compatibility. |
| 🧠 Apple and Core ML Tools contributors — Core ML Tools | [Repository](https://github.com/apple/coremltools) | **Development only.** Model inference/conversion support in the macOS Basic Pitch stack. |
| 🎼 librosa development team and contributors — librosa | [Repository](https://github.com/librosa/librosa) | **Development only.** Audio features, loading and preprocessing for analysis. |
| 🔬 SciPy contributors — SciPy | [Repository](https://github.com/scipy/scipy) | **Development only.** Scientific and signal-processing routines used by the analysis stack. |
| 🎚️ Brian McFee and contributors — Resampy | [Repository](https://github.com/bmcfee/resampy) | **Development only.** Audio sample-rate conversion during analysis. |
| 🎹 Colin Raffel and contributors — Pretty MIDI | [Repository](https://github.com/craffel/pretty-midi) | **Development only.** MIDI/note representation in the transcription toolchain. |
| 📏 Colin Raffel, Daniel P. W. Ellis and contributors — mir_eval | [Repository](https://github.com/craffel/mir_eval) | **Development only.** Music-information-retrieval evaluation dependency of Basic Pitch. |
| 🔊 Bastian Bechtold and contributors — SoundFile | [Repository](https://github.com/bastibe/python-soundfile) | **Development only.** Audio file I/O through libsndfile in the offline analysis stack. |
| 🔊 Erik de Castro Lopo and libsndfile contributors — libsndfile | [Repository](https://github.com/libsndfile/libsndfile) | **Development only.** Native audio file decoding behind SoundFile; development only. |
| 🧪 Microsoft and contributors — Playwright | [Repository](https://github.com/microsoft/playwright) | **Development only.** Browser automation used for real-render visual and interaction regression checks; not an application dependency. |

PRTCL's authorized formulas are enuzzo's own prior work. Per-recording Jamendo and per-article Wikipedia credits remain attached to the actual content in the product, where the correct artist, author, license and original page can follow a changing catalogue.

Public contacts, precise usage boundaries and unsent personalized release messages are maintained in [COMMUNITY-THANKS.md](docs/COMMUNITY-THANKS.md). Full terms, pinned source versions and exclusions remain in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [LICENSE-SCOPE.md](LICENSE-SCOPE.md). Original sedicivalvole code remains PolyForm Noncommercial; thanking open-source contributors does not relicense their work or our project.


### Keeping every contribution visible

Every source deserves credit, including a small utility, adapted formula, icon, font, article, demo, data service or study without a Git repository. Keep this complete community section **at the end of the README**; insert future product updates above it. For each new, replaced or retired source, update its author/project, original repository and article/demo where applicable, exact use and status here, and update the notices and outreach register in the same checkpoint. Use a restrained emoji for each credit.

The exact npm inventory below is generated from public release metadata and checked against `prototype/drive-lab/package-lock.json`. Run `python3 scripts/readme_dependency_credits.py --refresh` after dependency changes and `python3 scripts/readme_dependency_credits.py --check` before publishing. This checks lockfile coverage and the footer position; authorship, non-npm sources and usage descriptions still require human review.

<!-- NPM-CREDITS:START -->
<details>
<summary>🧩 Every locked npm dependency — 196 entries, including transitive and optional platform packages</summary>

These are exact lockfile entries, not a claim that every package ships in the browser or runs on this Mac. Build/development and optional platform packages are identified separately. Author names and descriptions come from each exact release's public npm metadata; a missing author is stated explicitly, never inferred from a maintainer account. Nested versions are credited separately. Repository/homepage links preserve upstream metadata and may redirect. Package descriptions explain their general purpose; the curated table above explains our direct integrations.

| Package / exact version | Published author | Original source | Dependency role / purpose |
|---|---|---|---|
| 🧩 @babel/code-frame `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Project page](https://babel.dev/docs/en/next/babel-code-frame) · [Release metadata](https://registry.npmjs.org/%40babel%2Fcode-frame/7.29.7) | Build / development. Generate errors that contain a code frame that point to source locations. |
| 🧩 @babel/compat-data `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Release metadata](https://registry.npmjs.org/%40babel%2Fcompat-data/7.29.7) | Build / development. The compat-data to determine required Babel plugins |
| 🧩 @babel/core `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Project page](https://babel.dev/docs/en/next/babel-core) · [Release metadata](https://registry.npmjs.org/%40babel%2Fcore/7.29.7) | Build / development. Babel compiler core. |
| 🧩 @babel/generator `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Project page](https://babel.dev/docs/en/next/babel-generator) · [Release metadata](https://registry.npmjs.org/%40babel%2Fgenerator/7.29.7) | Build / development. Turns an AST into code. |
| 🧩 @babel/helper-compilation-targets `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Release metadata](https://registry.npmjs.org/%40babel%2Fhelper-compilation-targets/7.29.7) | Build / development. Helper functions on Babel compilation targets |
| 🧩 @babel/helper-globals `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Release metadata](https://registry.npmjs.org/%40babel%2Fhelper-globals/7.29.7) | Build / development. A collection of JavaScript globals for Babel internal usage |
| 🧩 @babel/helper-module-imports `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Project page](https://babel.dev/docs/en/next/babel-helper-module-imports) · [Release metadata](https://registry.npmjs.org/%40babel%2Fhelper-module-imports/7.29.7) | Build / development. Babel helper functions for inserting module loads |
| 🧩 @babel/helper-module-transforms `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Project page](https://babel.dev/docs/en/next/babel-helper-module-transforms) · [Release metadata](https://registry.npmjs.org/%40babel%2Fhelper-module-transforms/7.29.7) | Build / development. Babel helper functions for implementing ES6 module transformations |
| 🧩 @babel/helper-plugin-utils `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Project page](https://babel.dev/docs/en/next/babel-helper-plugin-utils) · [Release metadata](https://registry.npmjs.org/%40babel%2Fhelper-plugin-utils/7.29.7) | Build / development. General utilities for plugins to use |
| 🧩 @babel/helper-string-parser `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Project page](https://babel.dev/docs/en/next/babel-helper-string-parser) · [Release metadata](https://registry.npmjs.org/%40babel%2Fhelper-string-parser/7.29.7) | Build / development. A utility package to parse strings |
| 🧩 @babel/helper-validator-identifier `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Release metadata](https://registry.npmjs.org/%40babel%2Fhelper-validator-identifier/7.29.7) | Build / development. Validate identifier/keywords name |
| 🧩 @babel/helper-validator-option `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Release metadata](https://registry.npmjs.org/%40babel%2Fhelper-validator-option/7.29.7) | Build / development. Validate plugin/preset options |
| 🧩 @babel/helpers `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Project page](https://babel.dev/docs/en/next/babel-helpers) · [Release metadata](https://registry.npmjs.org/%40babel%2Fhelpers/7.29.7) | Build / development. Collection of helper functions used by Babel transforms. |
| 🧩 @babel/parser `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Project page](https://babel.dev/docs/en/next/babel-parser) · [Release metadata](https://registry.npmjs.org/%40babel%2Fparser/7.29.7) | Build / development. A JavaScript parser |
| 🧩 @babel/plugin-transform-react-jsx-self `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Project page](https://babel.dev/docs/en/next/babel-plugin-transform-react-jsx-self) · [Release metadata](https://registry.npmjs.org/%40babel%2Fplugin-transform-react-jsx-self/7.29.7) | Build / development. Add a __self prop to all JSX Elements |
| 🧩 @babel/plugin-transform-react-jsx-source `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Project page](https://babel.dev/docs/en/next/babel-plugin-transform-react-jsx-source) · [Release metadata](https://registry.npmjs.org/%40babel%2Fplugin-transform-react-jsx-source/7.29.7) | Build / development. Add a __source prop to all JSX Elements |
| 🧩 @babel/runtime `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Project page](https://babel.dev/docs/en/next/babel-runtime) · [Release metadata](https://registry.npmjs.org/%40babel%2Fruntime/7.29.7) | Application dependency tree. babel's modular runtime helpers |
| 🧩 @babel/template `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Project page](https://babel.dev/docs/en/next/babel-template) · [Release metadata](https://registry.npmjs.org/%40babel%2Ftemplate/7.29.7) | Build / development. Generate an AST from a string template. |
| 🧩 @babel/traverse `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Project page](https://babel.dev/docs/en/next/babel-traverse) · [Release metadata](https://registry.npmjs.org/%40babel%2Ftraverse/7.29.7) | Build / development. The Babel Traverse module maintains the overall tree state, and is responsible for replacing, removing, and adding nodes |
| 🧩 @babel/types `7.29.7` | The Babel Team | [Repository](https://github.com/babel/babel) · [Project page](https://babel.dev/docs/en/next/babel-types) · [Release metadata](https://registry.npmjs.org/%40babel%2Ftypes/7.29.7) | Build / development. Babel Types is a Lodash-esque utility library for AST nodes |
| 🧩 @esbuild/aix-ppc64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Faix-ppc64/0.25.12) | Build / development; optional / platform-specific. The IBM AIX PowerPC 64-bit binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/android-arm `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Fandroid-arm/0.25.12) | Build / development; optional / platform-specific. A WebAssembly shim for esbuild on Android ARM. |
| 🧩 @esbuild/android-arm64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Fandroid-arm64/0.25.12) | Build / development; optional / platform-specific. The Android ARM 64-bit binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/android-x64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Fandroid-x64/0.25.12) | Build / development; optional / platform-specific. A WebAssembly shim for esbuild on Android x64. |
| 🧩 @esbuild/darwin-arm64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Fdarwin-arm64/0.25.12) | Build / development; optional / platform-specific. The macOS ARM 64-bit binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/darwin-x64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Fdarwin-x64/0.25.12) | Build / development; optional / platform-specific. The macOS 64-bit binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/freebsd-arm64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Ffreebsd-arm64/0.25.12) | Build / development; optional / platform-specific. The FreeBSD ARM 64-bit binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/freebsd-x64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Ffreebsd-x64/0.25.12) | Build / development; optional / platform-specific. The FreeBSD 64-bit binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/linux-arm `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Flinux-arm/0.25.12) | Build / development; optional / platform-specific. The Linux ARM binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/linux-arm64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Flinux-arm64/0.25.12) | Build / development; optional / platform-specific. The Linux ARM 64-bit binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/linux-ia32 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Flinux-ia32/0.25.12) | Build / development; optional / platform-specific. The Linux 32-bit binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/linux-loong64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Flinux-loong64/0.25.12) | Build / development; optional / platform-specific. The Linux LoongArch 64-bit binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/linux-mips64el `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Flinux-mips64el/0.25.12) | Build / development; optional / platform-specific. The Linux MIPS 64-bit Little Endian binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/linux-ppc64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Flinux-ppc64/0.25.12) | Build / development; optional / platform-specific. The Linux PowerPC 64-bit Little Endian binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/linux-riscv64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Flinux-riscv64/0.25.12) | Build / development; optional / platform-specific. The Linux RISC-V 64-bit binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/linux-s390x `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Flinux-s390x/0.25.12) | Build / development; optional / platform-specific. The Linux IBM Z 64-bit Big Endian binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/linux-x64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Flinux-x64/0.25.12) | Build / development; optional / platform-specific. The Linux 64-bit binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/netbsd-arm64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Fnetbsd-arm64/0.25.12) | Build / development; optional / platform-specific. The NetBSD ARM 64-bit binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/netbsd-x64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Fnetbsd-x64/0.25.12) | Build / development; optional / platform-specific. The NetBSD AMD64 binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/openbsd-arm64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Fopenbsd-arm64/0.25.12) | Build / development; optional / platform-specific. The OpenBSD ARM 64-bit binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/openbsd-x64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Fopenbsd-x64/0.25.12) | Build / development; optional / platform-specific. The OpenBSD 64-bit binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/openharmony-arm64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Fopenharmony-arm64/0.25.12) | Build / development; optional / platform-specific. A WebAssembly shim for esbuild on OpenHarmony ARM64. |
| 🧩 @esbuild/sunos-x64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Fsunos-x64/0.25.12) | Build / development; optional / platform-specific. The illumos 64-bit binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/win32-arm64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Fwin32-arm64/0.25.12) | Build / development; optional / platform-specific. The Windows ARM 64-bit binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/win32-ia32 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Fwin32-ia32/0.25.12) | Build / development; optional / platform-specific. The Windows 32-bit binary for esbuild, a JavaScript bundler. |
| 🧩 @esbuild/win32-x64 `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/%40esbuild%2Fwin32-x64/0.25.12) | Build / development; optional / platform-specific. The Windows 64-bit binary for esbuild, a JavaScript bundler. |
| 🧩 @jridgewell/gen-mapping `0.3.13` | Justin Ridgewell | [Repository](https://github.com/jridgewell/sourcemaps) · [Project page](https://github.com/jridgewell/sourcemaps/tree/main/packages/gen-mapping) · [Release metadata](https://registry.npmjs.org/%40jridgewell%2Fgen-mapping/0.3.13) | Build / development. Generate source maps |
| 🧩 @jridgewell/remapping `2.3.5` | Justin Ridgewell | [Repository](https://github.com/jridgewell/sourcemaps) · [Project page](https://github.com/jridgewell/sourcemaps/tree/main/packages/remapping) · [Release metadata](https://registry.npmjs.org/%40jridgewell%2Fremapping/2.3.5) | Build / development. Remap sequential sourcemaps through transformations to point at the original source code |
| 🧩 @jridgewell/resolve-uri `3.1.2` | Justin Ridgewell | [Repository](https://github.com/jridgewell/resolve-uri) · [Project page](https://github.com/jridgewell/resolve-uri#readme) · [Release metadata](https://registry.npmjs.org/%40jridgewell%2Fresolve-uri/3.1.2) | Build / development. Resolve a URI relative to an optional base URI |
| 🧩 @jridgewell/sourcemap-codec `1.5.5` | Justin Ridgewell | [Repository](https://github.com/jridgewell/sourcemaps) · [Project page](https://github.com/jridgewell/sourcemaps/tree/main/packages/sourcemap-codec) · [Release metadata](https://registry.npmjs.org/%40jridgewell%2Fsourcemap-codec/1.5.5) | Build / development. Encode/decode sourcemap mappings |
| 🧩 @jridgewell/trace-mapping `0.3.31` | Justin Ridgewell | [Repository](https://github.com/jridgewell/sourcemaps) · [Project page](https://github.com/jridgewell/sourcemaps/tree/main/packages/trace-mapping) · [Release metadata](https://registry.npmjs.org/%40jridgewell%2Ftrace-mapping/0.3.31) | Build / development. Trace the original position through a source map |
| 🧩 @mapbox/geojson-rewind `0.5.2` | Tom MacWright | [Repository](https://github.com/mapbox/geojson-rewind) · [Project page](https://github.com/mapbox/geojson-rewind) · [Release metadata](https://registry.npmjs.org/%40mapbox%2Fgeojson-rewind/0.5.2) | Application dependency tree. enforce winding order for geojson |
| 🧩 @mapbox/jsonlint-lines-primitives `2.0.3` | Zach Carter | [Repository](https://github.com/mapbox/jsonlint) · [Project page](https://github.com/mapbox/jsonlint#readme) · [Release metadata](https://registry.npmjs.org/%40mapbox%2Fjsonlint-lines-primitives/2.0.3) | Application dependency tree. Validate JSON |
| 🧩 @mapbox/point-geometry `1.1.0` | Tom MacWright | [Repository](https://github.com/mapbox/point-geometry) · [Project page](https://github.com/mapbox/point-geometry) · [Release metadata](https://registry.npmjs.org/%40mapbox%2Fpoint-geometry/1.1.0) | Application dependency tree. a point geometry with transforms |
| 🧩 @mapbox/tiny-sdf `2.2.0` | Vladimir Agafonkin | [Repository](https://github.com/mapbox/tiny-sdf) · [Project page](https://github.com/mapbox/tiny-sdf#readme) · [Release metadata](https://registry.npmjs.org/%40mapbox%2Ftiny-sdf/2.2.0) | Application dependency tree. Browser-side SDF font generator |
| 🧩 @mapbox/unitbezier `0.0.1` | Project contributors (no author field published) | [Repository](https://github.com/mapbox/unitbezier) · [Project page](https://github.com/mapbox/unitbezier) · [Release metadata](https://registry.npmjs.org/%40mapbox%2Funitbezier/0.0.1) | Application dependency tree. unit bezier curve interpolation |
| 🧩 @mapbox/vector-tile `2.0.5` | Project contributors (no author field published) | [Repository](https://github.com/mapbox/vector-tile-js) · [Project page](https://github.com/mapbox/vector-tile-js#readme) · [Release metadata](https://registry.npmjs.org/%40mapbox%2Fvector-tile/2.0.5) | Application dependency tree. Parses vector tiles |
| 🧩 @mapbox/whoots-js `3.1.0` | Bryan Housel | [Repository](https://github.com/mapbox/whoots-js) · [Project page](https://github.com/mapbox/whoots-js#readme) · [Release metadata](https://registry.npmjs.org/%40mapbox%2Fwhoots-js/3.1.0) | Application dependency tree. Request tiles from WMS servers that support EPSG:3857 |
| 🧩 @maplibre/maplibre-gl-style-spec `23.3.0` | MapLibre | [Repository](https://github.com/maplibre/maplibre-gl-style-spec) · [Project page](https://maplibre.org/maplibre-style-spec/) · [Release metadata](https://registry.npmjs.org/%40maplibre%2Fmaplibre-gl-style-spec/23.3.0) | Application dependency tree. a specification for maplibre styles |
| 🧩 @maplibre/vt-pbf `4.3.2` | Anand Thakker | [Repository](https://github.com/maplibre/vt-pbf) · [Project page](https://github.com/maplibre/vt-pbf#readme) · [Release metadata](https://registry.npmjs.org/%40maplibre%2Fvt-pbf/4.3.2) | Application dependency tree. Serialize mapbox vector tiles to binary protobufs in javascript. |
| 🧩 pbf `5.1.2` | Konstantin Kaefer | [Repository](https://github.com/mapbox/pbf) · [Project page](https://github.com/mapbox/pbf) · [Release metadata](https://registry.npmjs.org/pbf/5.1.2) | Application dependency tree. a low-level, lightweight protocol buffers implementation in JavaScript |
| 🧩 @react-three/fiber `9.7.0` | Paul Henschel | [Repository](https://github.com/pmndrs/react-three-fiber) · [Project page](https://github.com/pmndrs/react-three-fiber#readme) · [Release metadata](https://registry.npmjs.org/%40react-three%2Ffiber/9.7.0) | Application dependency tree. A React renderer for Threejs |
| 🧩 @rolldown/pluginutils `1.0.0-beta.38` | Project contributors (no author field published) | [Repository](https://github.com/rolldown/rolldown) · [Project page](https://github.com/rolldown/rolldown#readme) · [Release metadata](https://registry.npmjs.org/%40rolldown%2Fpluginutils/1.0.0-beta.38) | Build / development. A utility library for building flexible, composable filter expressions that can be used in plugin hook filters of Rolldown/Vite/Rollup/Unplugin plugins. |
| 🧩 @rollup/rollup-android-arm-eabi `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-android-arm-eabi/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-android-arm64 `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-android-arm64/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-darwin-arm64 `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-darwin-arm64/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-darwin-x64 `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-darwin-x64/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-freebsd-arm64 `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-freebsd-arm64/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-freebsd-x64 `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-freebsd-x64/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-linux-arm-gnueabihf `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-linux-arm-gnueabihf/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-linux-arm-musleabihf `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-linux-arm-musleabihf/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-linux-arm64-gnu `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-linux-arm64-gnu/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-linux-arm64-musl `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-linux-arm64-musl/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-linux-loong64-gnu `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-linux-loong64-gnu/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-linux-loong64-musl `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-linux-loong64-musl/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-linux-ppc64-gnu `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-linux-ppc64-gnu/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-linux-ppc64-musl `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-linux-ppc64-musl/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-linux-riscv64-gnu `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-linux-riscv64-gnu/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-linux-riscv64-musl `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-linux-riscv64-musl/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-linux-s390x-gnu `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-linux-s390x-gnu/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-linux-x64-gnu `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-linux-x64-gnu/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-linux-x64-musl `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-linux-x64-musl/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-openbsd-x64 `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-openbsd-x64/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-openharmony-arm64 `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-openharmony-arm64/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-win32-arm64-msvc `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-win32-arm64-msvc/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-win32-ia32-msvc `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-win32-ia32-msvc/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-win32-x64-gnu `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-win32-x64-gnu/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @rollup/rollup-win32-x64-msvc `4.62.2` | Lukas Taegert-Atkinson | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/%40rollup%2Frollup-win32-x64-msvc/4.62.2) | Build / development; optional / platform-specific. Native bindings for Rollup |
| 🧩 @shadergradient/react `2.4.20` | ruucm | [Release metadata](https://registry.npmjs.org/%40shadergradient%2Freact/2.4.20) | Application dependency tree. No package description published. |
| 🧩 @types/babel__core `7.20.5` | Project contributors (no author field published) | [Repository](https://github.com/DefinitelyTyped/DefinitelyTyped) · [Project page](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/babel__core) · [Release metadata](https://registry.npmjs.org/%40types%2Fbabel__core/7.20.5) | Build / development. TypeScript definitions for @babel/core |
| 🧩 @types/babel__generator `7.27.0` | Project contributors (no author field published) | [Repository](https://github.com/DefinitelyTyped/DefinitelyTyped) · [Project page](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/babel__generator) · [Release metadata](https://registry.npmjs.org/%40types%2Fbabel__generator/7.27.0) | Build / development. TypeScript definitions for @babel/generator |
| 🧩 @types/babel__template `7.4.4` | Project contributors (no author field published) | [Repository](https://github.com/DefinitelyTyped/DefinitelyTyped) · [Project page](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/babel__template) · [Release metadata](https://registry.npmjs.org/%40types%2Fbabel__template/7.4.4) | Build / development. TypeScript definitions for @babel/template |
| 🧩 @types/babel__traverse `7.28.0` | Project contributors (no author field published) | [Repository](https://github.com/DefinitelyTyped/DefinitelyTyped) · [Project page](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/babel__traverse) · [Release metadata](https://registry.npmjs.org/%40types%2Fbabel__traverse/7.28.0) | Build / development. TypeScript definitions for @babel/traverse |
| 🧩 @types/draco3d `1.4.10` | Project contributors (no author field published) | [Repository](https://github.com/DefinitelyTyped/DefinitelyTyped) · [Project page](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/draco3d) · [Release metadata](https://registry.npmjs.org/%40types%2Fdraco3d/1.4.10) | Application dependency tree. TypeScript definitions for draco3d |
| 🧩 @types/estree `1.0.9` | Project contributors (no author field published) | [Repository](https://github.com/DefinitelyTyped/DefinitelyTyped) · [Project page](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/estree) · [Release metadata](https://registry.npmjs.org/%40types%2Festree/1.0.9) | Build / development. TypeScript definitions for estree |
| 🧩 @types/geojson `7946.0.16` | Project contributors (no author field published) | [Repository](https://github.com/DefinitelyTyped/DefinitelyTyped) · [Project page](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/geojson) · [Release metadata](https://registry.npmjs.org/%40types%2Fgeojson/7946.0.16) | Application dependency tree. TypeScript definitions for geojson |
| 🧩 @types/geojson-vt `3.2.5` | Project contributors (no author field published) | [Repository](https://github.com/DefinitelyTyped/DefinitelyTyped) · [Project page](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/geojson-vt) · [Release metadata](https://registry.npmjs.org/%40types%2Fgeojson-vt/3.2.5) | Application dependency tree. TypeScript definitions for geojson-vt |
| 🧩 @types/offscreencanvas `2019.7.3` | Project contributors (no author field published) | [Repository](https://github.com/DefinitelyTyped/DefinitelyTyped) · [Project page](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/offscreencanvas) · [Release metadata](https://registry.npmjs.org/%40types%2Foffscreencanvas/2019.7.3) | Application dependency tree. TypeScript definitions for offscreencanvas |
| 🧩 @types/react `19.2.18` | Project contributors (no author field published) | [Repository](https://github.com/DefinitelyTyped/DefinitelyTyped) · [Project page](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react) · [Release metadata](https://registry.npmjs.org/%40types%2Freact/19.2.18) | Application dependency tree. TypeScript definitions for react |
| 🧩 @types/react-reconciler `0.28.9` | Project contributors (no author field published) | [Repository](https://github.com/DefinitelyTyped/DefinitelyTyped) · [Project page](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react-reconciler) · [Release metadata](https://registry.npmjs.org/%40types%2Freact-reconciler/0.28.9) | Application dependency tree. TypeScript definitions for react-reconciler |
| 🧩 @types/supercluster `7.1.3` | Project contributors (no author field published) | [Repository](https://github.com/DefinitelyTyped/DefinitelyTyped) · [Project page](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/supercluster) · [Release metadata](https://registry.npmjs.org/%40types%2Fsupercluster/7.1.3) | Application dependency tree. TypeScript definitions for supercluster |
| 🧩 @types/webxr `0.5.24` | Project contributors (no author field published) | [Repository](https://github.com/DefinitelyTyped/DefinitelyTyped) · [Project page](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/webxr) · [Release metadata](https://registry.npmjs.org/%40types%2Fwebxr/0.5.24) | Application dependency tree. TypeScript definitions for webxr |
| 🧩 @vitejs/plugin-react `5.0.4` | Evan You | [Repository](https://github.com/vitejs/vite-plugin-react) · [Project page](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#readme) · [Release metadata](https://registry.npmjs.org/%40vitejs%2Fplugin-react/5.0.4) | Build / development. The default Vite plugin for React projects |
| 🧩 ansi-regex `5.0.1` | Sindre Sorhus | [Repository](https://github.com/chalk/ansi-regex) · [Project page](https://github.com/chalk/ansi-regex#readme) · [Release metadata](https://registry.npmjs.org/ansi-regex/5.0.1) | Application dependency tree. Regular expression for matching ANSI escape codes |
| 🧩 ansi-styles `4.3.0` | Sindre Sorhus | [Repository](https://github.com/chalk/ansi-styles) · [Project page](https://github.com/chalk/ansi-styles#readme) · [Release metadata](https://registry.npmjs.org/ansi-styles/4.3.0) | Application dependency tree. ANSI escape codes for styling strings in the terminal |
| 🧩 base64-js `1.5.1` | T. Jameson Little | [Repository](https://github.com/beatgammit/base64-js) · [Project page](https://github.com/beatgammit/base64-js) · [Release metadata](https://registry.npmjs.org/base64-js/1.5.1) | Application dependency tree. Base64 encoding/decoding in pure JS |
| 🧩 baseline-browser-mapping `2.10.42` | Project contributors (no author field published) | [Repository](https://github.com/web-platform-dx/baseline-browser-mapping) · [Project page](https://github.com/web-platform-dx/baseline-browser-mapping#readme) · [Release metadata](https://registry.npmjs.org/baseline-browser-mapping/2.10.42) | Build / development. A library for obtaining browser versions with their maximum supported Baseline feature set and Widely Available status. |
| 🧩 browserslist `4.28.5` | Andrey Sitnik | [Repository](https://github.com/browserslist/browserslist) · [Project page](https://github.com/browserslist/browserslist#readme) · [Release metadata](https://registry.npmjs.org/browserslist/4.28.5) | Build / development. Share target browsers between different front-end tools, like Autoprefixer, Stylelint and babel-env-preset |
| 🧩 buffer `6.0.3` | Feross Aboukhadijeh | [Repository](https://github.com/feross/buffer) · [Project page](https://github.com/feross/buffer) · [Release metadata](https://registry.npmjs.org/buffer/6.0.3) | Application dependency tree. Node.js Buffer API, for the browser |
| 🧩 camelcase `5.3.1` | Sindre Sorhus | [Repository](https://github.com/sindresorhus/camelcase) · [Project page](https://github.com/sindresorhus/camelcase#readme) · [Release metadata](https://registry.npmjs.org/camelcase/5.3.1) | Application dependency tree. Convert a dash/dot/underscore/space separated string to camelCase or PascalCase: `foo-bar` → `fooBar` |
| 🧩 camera-controls `2.9.0` | Yomotsu | [Repository](https://github.com/yomotsu/camera-controls) · [Project page](https://github.com/yomotsu/camera-controls#readme) · [Release metadata](https://registry.npmjs.org/camera-controls/2.9.0) | Application dependency tree. A camera control for three.js, similar to THREE.OrbitControls yet supports smooth transitions and more features. |
| 🧩 caniuse-lite `1.0.30001803` | Ben Briggs | [Repository](https://github.com/browserslist/caniuse-lite) · [Project page](https://github.com/browserslist/caniuse-lite#readme) · [Release metadata](https://registry.npmjs.org/caniuse-lite/1.0.30001803) | Build / development. A smaller version of caniuse-db, with only the essentials! |
| 🧩 cliui `6.0.0` | Ben Coe | [Repository](https://github.com/yargs/cliui) · [Project page](https://github.com/yargs/cliui#readme) · [Release metadata](https://registry.npmjs.org/cliui/6.0.0) | Application dependency tree. easily create complex multi-column command-line-interfaces |
| 🧩 color-convert `2.0.1` | Heather Arthur | [Repository](https://github.com/Qix-/color-convert) · [Project page](https://github.com/Qix-/color-convert#readme) · [Release metadata](https://registry.npmjs.org/color-convert/2.0.1) | Application dependency tree. Plain color conversion functions |
| 🧩 color-name `1.1.4` | DY | [Repository](https://github.com/colorjs/color-name) · [Project page](https://github.com/colorjs/color-name) · [Release metadata](https://registry.npmjs.org/color-name/1.1.4) | Application dependency tree. A list of color names and its values |
| 🧩 convert-source-map `2.0.0` | Thorsten Lorenz | [Repository](https://github.com/thlorenz/convert-source-map) · [Project page](https://github.com/thlorenz/convert-source-map) · [Release metadata](https://registry.npmjs.org/convert-source-map/2.0.0) | Build / development. Converts a source-map from/to  different formats and allows adding/changing properties. |
| 🧩 csstype `3.2.3` | Fredrik Nicol | [Repository](https://github.com/frenic/csstype) · [Project page](https://github.com/frenic/csstype#readme) · [Release metadata](https://registry.npmjs.org/csstype/3.2.3) | Application dependency tree. Strict TypeScript and Flow types for style based on MDN data |
| 🧩 debug `4.4.3` | Josh Junon | [Repository](https://github.com/debug-js/debug) · [Project page](https://github.com/debug-js/debug#readme) · [Release metadata](https://registry.npmjs.org/debug/4.4.3) | Build / development. Lightweight debugging utility for Node.js and the browser |
| 🧩 decamelize `1.2.0` | Sindre Sorhus | [Repository](https://github.com/sindresorhus/decamelize) · [Project page](https://github.com/sindresorhus/decamelize#readme) · [Release metadata](https://registry.npmjs.org/decamelize/1.2.0) | Application dependency tree. Convert a camelized string into a lowercased one with a custom separator: unicornRainbow → unicorn_rainbow |
| 🧩 dijkstrajs `1.0.3` | Project contributors (no author field published) | [Repository](https://github.com/tcort/dijkstrajs) · [Project page](https://github.com/tcort/dijkstrajs) · [Release metadata](https://registry.npmjs.org/dijkstrajs/1.0.3) | Application dependency tree. A simple JavaScript implementation of Dijkstra's single-source shortest-paths algorithm. |
| 🧩 draco3d `1.5.7` | Google Draco Team | [Repository](https://github.com/google/draco) · [Project page](https://github.com/google/draco#readme) · [Release metadata](https://registry.npmjs.org/draco3d/1.5.7) | Application dependency tree. Draco is a library for compressing and decompressing 3D geometric meshes and point clouds. It is intended to improve the storage and transmission of 3D graphics. |
| 🧩 earcut `3.2.3` | Volodymyr Agafonkin | [Repository](https://github.com/mapbox/earcut) · [Project page](https://github.com/mapbox/earcut#readme) · [Release metadata](https://registry.npmjs.org/earcut/3.2.3) | Application dependency tree. The fastest and smallest JavaScript polygon triangulation library for your WebGL apps |
| 🧩 electron-to-chromium `1.5.389` | Kilian Valkhof | [Repository](https://github.com/Kilian/electron-to-chromium) · [Project page](https://github.com/Kilian/electron-to-chromium#readme) · [Release metadata](https://registry.npmjs.org/electron-to-chromium/1.5.389) | Build / development. Provides a list of electron-to-chromium version mappings |
| 🧩 emoji-regex `8.0.0` | Mathias Bynens | [Repository](https://github.com/mathiasbynens/emoji-regex) · [Project page](https://mths.be/emoji-regex) · [Release metadata](https://registry.npmjs.org/emoji-regex/8.0.0) | Application dependency tree. A regular expression to match all Emoji-only symbols as per the Unicode Standard. |
| 🧩 esbuild `0.25.12` | Project contributors (no author field published) | [Repository](https://github.com/evanw/esbuild) · [Project page](https://github.com/evanw/esbuild#readme) · [Release metadata](https://registry.npmjs.org/esbuild/0.25.12) | Build / development. An extremely fast JavaScript and CSS bundler and minifier. |
| 🧩 escalade `3.2.0` | Luke Edwards | [Repository](https://github.com/lukeed/escalade) · [Project page](https://github.com/lukeed/escalade#readme) · [Release metadata](https://registry.npmjs.org/escalade/3.2.0) | Build / development. A tiny (183B to 210B) and fast utility to ascend parent directories |
| 🧩 fdir `6.5.0` | thecodrr | [Repository](https://github.com/thecodrr/fdir) · [Project page](https://github.com/thecodrr/fdir#readme) · [Release metadata](https://registry.npmjs.org/fdir/6.5.0) | Build / development. The fastest directory crawler & globbing alternative to glob, fast-glob, & tiny-glob. Crawls 1m files in &lt; 1s |
| 🧩 fflate `0.6.11` | Arjun Barrett | [Repository](https://github.com/101arrowz/fflate) · [Project page](https://101arrowz.github.io/fflate) · [Release metadata](https://registry.npmjs.org/fflate/0.6.11) | Application dependency tree. High performance (de)compression in an 8kB package |
| 🧩 find-up `4.1.0` | Sindre Sorhus | [Repository](https://github.com/sindresorhus/find-up) · [Project page](https://github.com/sindresorhus/find-up#readme) · [Release metadata](https://registry.npmjs.org/find-up/4.1.0) | Application dependency tree. Find a file or directory by walking up parent directories |
| 🧩 fsevents `2.3.3` | Project contributors (no author field published) | [Repository](https://github.com/fsevents/fsevents) · [Project page](https://github.com/fsevents/fsevents) · [Release metadata](https://registry.npmjs.org/fsevents/2.3.3) | Build / development; optional / platform-specific. Native Access to MacOS FSEvents |
| 🧩 gensync `1.0.0-beta.2` | Logan Smyth | [Repository](https://github.com/loganfsmyth/gensync) · [Project page](https://github.com/loganfsmyth/gensync) · [Release metadata](https://registry.npmjs.org/gensync/1.0.0-beta.2) | Build / development. Allows users to use generators in order to write common functions that can be both sync or async. |
| 🧩 geojson-vt `4.0.3` | Vladimir Agafonkin | [Repository](https://github.com/mapbox/geojson-vt) · [Project page](https://github.com/mapbox/geojson-vt) · [Release metadata](https://registry.npmjs.org/geojson-vt/4.0.3) | Application dependency tree. Slice GeoJSON data into vector tiles efficiently |
| 🧩 get-caller-file `2.0.5` | Stefan Penner | [Repository](https://github.com/stefanpenner/get-caller-file) · [Project page](https://github.com/stefanpenner/get-caller-file#readme) · [Release metadata](https://registry.npmjs.org/get-caller-file/2.0.5) | Application dependency tree. [![Build Status](https://travis-ci.org/stefanpenner/get-caller-file.svg?branch=master)](https://travis-ci.org/stefanpenner/get-caller-file) [![Build status](https://ci.appveyor.com/api/projects/status/ol2q94g1932cy14a/branch/master?svg=true)](https://ci.a |
| 🧩 get-stream `6.0.1` | Sindre Sorhus | [Repository](https://github.com/sindresorhus/get-stream) · [Project page](https://github.com/sindresorhus/get-stream#readme) · [Release metadata](https://registry.npmjs.org/get-stream/6.0.1) | Application dependency tree. Get a stream as a string, buffer, or array |
| 🧩 gl-matrix `3.4.4` | Project contributors (no author field published) | [Repository](https://github.com/toji/gl-matrix) · [Release metadata](https://registry.npmjs.org/gl-matrix/3.4.4) | Application dependency tree. Javascript Matrix and Vector library for High Performance WebGL apps |
| 🧩 ieee754 `1.2.1` | Feross Aboukhadijeh | [Repository](https://github.com/feross/ieee754) · [Project page](https://github.com/feross/ieee754#readme) · [Release metadata](https://registry.npmjs.org/ieee754/1.2.1) | Application dependency tree. Read/write IEEE754 floating point numbers from/to a Buffer or array-like object |
| 🧩 is-fullwidth-code-point `3.0.0` | Sindre Sorhus | [Repository](https://github.com/sindresorhus/is-fullwidth-code-point) · [Project page](https://github.com/sindresorhus/is-fullwidth-code-point#readme) · [Release metadata](https://registry.npmjs.org/is-fullwidth-code-point/3.0.0) | Application dependency tree. Check if the character represented by a given Unicode code point is fullwidth |
| 🧩 its-fine `2.0.0` | Cody Bennett | [Repository](https://github.com/pmndrs/its-fine) · [Project page](https://github.com/pmndrs/its-fine) · [Release metadata](https://registry.npmjs.org/its-fine/2.0.0) | Application dependency tree. A collection of escape hatches for React. |
| 🧩 js-tokens `4.0.0` | Simon Lydell | [Repository](https://github.com/lydell/js-tokens) · [Project page](https://github.com/lydell/js-tokens#readme) · [Release metadata](https://registry.npmjs.org/js-tokens/4.0.0) | Build / development. A regex that tokenizes JavaScript. |
| 🧩 jsesc `3.1.0` | Mathias Bynens | [Repository](https://github.com/mathiasbynens/jsesc) · [Project page](https://mths.be/jsesc) · [Release metadata](https://registry.npmjs.org/jsesc/3.1.0) | Build / development. Given some data, jsesc returns the shortest possible stringified & ASCII-safe representation of that data. |
| 🧩 json-stringify-pretty-compact `4.0.0` | Simon Lydell | [Repository](https://github.com/lydell/json-stringify-pretty-compact) · [Project page](https://github.com/lydell/json-stringify-pretty-compact#readme) · [Release metadata](https://registry.npmjs.org/json-stringify-pretty-compact/4.0.0) | Application dependency tree. The best of both `JSON.stringify(obj)` and `JSON.stringify(obj, null, indent)`. |
| 🧩 json5 `2.2.3` | Aseem Kishore | [Repository](https://github.com/json5/json5) · [Release metadata](https://registry.npmjs.org/json5/2.2.3) | Build / development. JSON for Humans |
| 🧩 kdbush `4.1.0` | Vladimir Agafonkin | [Repository](https://github.com/mourner/kdbush) · [Project page](https://github.com/mourner/kdbush#readme) · [Release metadata](https://registry.npmjs.org/kdbush/4.1.0) | Application dependency tree. A very fast static 2D index for points based on kd-tree. |
| 🧩 locate-path `5.0.0` | Sindre Sorhus | [Repository](https://github.com/sindresorhus/locate-path) · [Project page](https://github.com/sindresorhus/locate-path#readme) · [Release metadata](https://registry.npmjs.org/locate-path/5.0.0) | Application dependency tree. Get the first path that exists on disk of multiple paths |
| 🧩 lru-cache `5.1.1` | Isaac Z. Schlueter | [Repository](https://github.com/isaacs/node-lru-cache) · [Project page](https://github.com/isaacs/node-lru-cache#readme) · [Release metadata](https://registry.npmjs.org/lru-cache/5.1.1) | Build / development. A cache object that deletes the least-recently-used items. |
| 🧩 maplibre-gl `5.7.1` | Project contributors (no author field published) | [Repository](https://github.com/maplibre/maplibre-gl-js) · [Project page](https://maplibre.org/) · [Release metadata](https://registry.npmjs.org/maplibre-gl/5.7.1) | Application dependency tree. BSD licensed community fork of mapbox-gl, a WebGL interactive maps library |
| 🧩 minimist `1.2.8` | James Halliday | [Repository](https://github.com/minimistjs/minimist) · [Project page](https://github.com/minimistjs/minimist) · [Release metadata](https://registry.npmjs.org/minimist/1.2.8) | Application dependency tree. parse argument options |
| 🧩 ms `2.1.3` | Project contributors (no author field published) | [Repository](https://github.com/vercel/ms) · [Project page](https://github.com/vercel/ms#readme) · [Release metadata](https://registry.npmjs.org/ms/2.1.3) | Build / development. Tiny millisecond conversion utility |
| 🧩 murmurhash-js `1.0.0` | Gary Court | [Repository](https://github.com/mikolalysenko/murmurhash-js) · [Project page](https://github.com/mikolalysenko/murmurhash-js) · [Release metadata](https://registry.npmjs.org/murmurhash-js/1.0.0) | Application dependency tree. Native JS murmur hash implementation |
| 🧩 nanoid `3.3.18` | Andrey Sitnik | [Repository](https://github.com/ai/nanoid) · [Project page](https://github.com/ai/nanoid#readme) · [Release metadata](https://registry.npmjs.org/nanoid/3.3.18) | Build / development. A tiny (116 bytes), secure URL-friendly unique string ID generator |
| 🧩 node-releases `2.0.50` | Sergey Rubanov | [Repository](https://github.com/chicoxyzzy/node-releases) · [Project page](https://github.com/chicoxyzzy/node-releases#readme) · [Release metadata](https://registry.npmjs.org/node-releases/2.0.50) | Build / development. Node.js releases data |
| 🧩 p-limit `2.3.0` | Sindre Sorhus | [Repository](https://github.com/sindresorhus/p-limit) · [Project page](https://github.com/sindresorhus/p-limit#readme) · [Release metadata](https://registry.npmjs.org/p-limit/2.3.0) | Application dependency tree. Run multiple promise-returning & async functions with limited concurrency |
| 🧩 p-locate `4.1.0` | Sindre Sorhus | [Repository](https://github.com/sindresorhus/p-locate) · [Project page](https://github.com/sindresorhus/p-locate#readme) · [Release metadata](https://registry.npmjs.org/p-locate/4.1.0) | Application dependency tree. Get the first fulfilled promise that satisfies the provided testing function |
| 🧩 p-try `2.2.0` | Sindre Sorhus | [Repository](https://github.com/sindresorhus/p-try) · [Project page](https://github.com/sindresorhus/p-try#readme) · [Release metadata](https://registry.npmjs.org/p-try/2.2.0) | Application dependency tree. `Start a promise chain |
| 🧩 path-exists `4.0.0` | Sindre Sorhus | [Repository](https://github.com/sindresorhus/path-exists) · [Project page](https://github.com/sindresorhus/path-exists#readme) · [Release metadata](https://registry.npmjs.org/path-exists/4.0.0) | Application dependency tree. Check if a path exists |
| 🧩 pbf `4.0.2` | Konstantin Kaefer | [Repository](https://github.com/mapbox/pbf) · [Project page](https://github.com/mapbox/pbf) · [Release metadata](https://registry.npmjs.org/pbf/4.0.2) | Application dependency tree. a low-level, lightweight protocol buffers implementation in JavaScript |
| 🧩 picocolors `1.1.1` | Alexey Raspopov | [Repository](https://github.com/alexeyraspopov/picocolors) · [Project page](https://github.com/alexeyraspopov/picocolors#readme) · [Release metadata](https://registry.npmjs.org/picocolors/1.1.1) | Build / development. The tiniest and the fastest library for terminal output formatting with ANSI colors |
| 🧩 picomatch `4.0.5` | Jon Schlinkert | [Repository](https://github.com/micromatch/picomatch) · [Project page](https://github.com/micromatch/picomatch) · [Release metadata](https://registry.npmjs.org/picomatch/4.0.5) | Build / development. Blazing fast and accurate glob matcher written in JavaScript, with no dependencies and full support for standard and extended Bash glob features, including braces, extglobs, POSIX brackets, and regular expressions. |
| 🧩 pngjs `5.0.0` | Project contributors (no author field published) | [Repository](https://github.com/lukeapage/pngjs) · [Project page](https://github.com/lukeapage/pngjs) · [Release metadata](https://registry.npmjs.org/pngjs/5.0.0) | Application dependency tree. PNG encoder/decoder in pure JS, supporting any bit size & interlace, async & sync with full test suite. |
| 🧩 postcss `8.5.26` | Andrey Sitnik | [Repository](https://github.com/postcss/postcss) · [Project page](https://postcss.org/) · [Release metadata](https://registry.npmjs.org/postcss/8.5.26) | Build / development. Tool for transforming styles with JS plugins |
| 🧩 potpack `2.1.0` | Vladimir Agafonkin | [Repository](https://github.com/mapbox/potpack) · [Project page](https://mapbox.github.io/potpack/) · [Release metadata](https://registry.npmjs.org/potpack/2.1.0) | Application dependency tree. A tiny library for packing 2D rectangles (for sprite layouts) |
| 🧩 protocol-buffers-schema `3.6.1` | Mathias Buus | [Repository](https://github.com/mafintosh/protocol-buffers-schema) · [Project page](https://github.com/mafintosh/protocol-buffers-schema) · [Release metadata](https://registry.npmjs.org/protocol-buffers-schema/3.6.1) | Application dependency tree. No nonsense protocol buffers schema parser written in Javascript |
| 🧩 qrcode `1.5.4` | Ryan Day | [Repository](https://github.com/soldair/node-qrcode) · [Release metadata](https://registry.npmjs.org/qrcode/1.5.4) | Application dependency tree. QRCode / 2d Barcode api with both server side and client side support using canvas |
| 🧩 quickselect `3.0.0` | Vladimir Agafonkin | [Repository](https://github.com/mourner/quickselect) · [Project page](https://github.com/mourner/quickselect#readme) · [Release metadata](https://registry.npmjs.org/quickselect/3.0.0) | Application dependency tree. A tiny and fast selection algorithm in JavaScript. |
| 🧩 react `19.2.0` | Project contributors (no author field published) | [Repository](https://github.com/facebook/react) · [Project page](https://react.dev/) · [Release metadata](https://registry.npmjs.org/react/19.2.0) | Application dependency tree. React is a JavaScript library for building user interfaces. |
| 🧩 react-dom `19.2.0` | Project contributors (no author field published) | [Repository](https://github.com/facebook/react) · [Project page](https://react.dev/) · [Release metadata](https://registry.npmjs.org/react-dom/19.2.0) | Application dependency tree. React package for working with the DOM. |
| 🧩 react-refresh `0.17.0` | Project contributors (no author field published) | [Repository](https://github.com/facebook/react) · [Project page](https://react.dev/) · [Release metadata](https://registry.npmjs.org/react-refresh/0.17.0) | Build / development. React is a JavaScript library for building user interfaces. |
| 🧩 react-use-measure `2.1.7` | Paul Henschel | [Repository](https://github.com/pmndrs/react-use-measure) · [Project page](https://github.com/pmndrs/react-use-measure) · [Release metadata](https://registry.npmjs.org/react-use-measure/2.1.7) | Application dependency tree. Utility to measure view bounds |
| 🧩 require-directory `2.1.1` | Troy Goode | [Repository](https://github.com/troygoode/node-require-directory) · [Project page](https://github.com/troygoode/node-require-directory/) · [Release metadata](https://registry.npmjs.org/require-directory/2.1.1) | Application dependency tree. Recursively iterates over specified directory, require()'ing each file, and returning a nested hash structure containing those modules. |
| 🧩 require-main-filename `2.0.0` | Ben Coe | [Repository](https://github.com/yargs/require-main-filename) · [Project page](https://github.com/yargs/require-main-filename#readme) · [Release metadata](https://registry.npmjs.org/require-main-filename/2.0.0) | Application dependency tree. shim for require.main.filename() that works in as many environments as possible |
| 🧩 resolve-protobuf-schema `2.1.0` | Mathias Buus | [Repository](https://github.com/mafintosh/resolve-protobuf-schema) · [Project page](https://github.com/mafintosh/resolve-protobuf-schema) · [Release metadata](https://registry.npmjs.org/resolve-protobuf-schema/2.1.0) | Application dependency tree. Read a protobuf schema from the disk, parse it and resolve all imports |
| 🧩 rollup `4.62.2` | Rich Harris | [Repository](https://github.com/rollup/rollup) · [Project page](https://rollupjs.org/) · [Release metadata](https://registry.npmjs.org/rollup/4.62.2) | Build / development. Next-generation ES module bundler |
| 🧩 rw `1.3.3` | Mike Bostock | [Repository](https://github.com/mbostock/rw) · [Project page](https://github.com/mbostock/rw) · [Release metadata](https://registry.npmjs.org/rw/1.3.3) | Application dependency tree. Now stdin and stdout are files. |
| 🧩 scheduler `0.27.0` | Project contributors (no author field published) | [Repository](https://github.com/facebook/react) · [Project page](https://react.dev/) · [Release metadata](https://registry.npmjs.org/scheduler/0.27.0) | Application dependency tree. Cooperative scheduler for the browser environment. |
| 🧩 semver `6.3.1` | GitHub Inc. | [Repository](https://github.com/npm/node-semver) · [Project page](https://github.com/npm/node-semver#readme) · [Release metadata](https://registry.npmjs.org/semver/6.3.1) | Build / development. The semantic version parser used by npm. |
| 🧩 set-blocking `2.0.0` | Ben Coe | [Repository](https://github.com/yargs/set-blocking) · [Project page](https://github.com/yargs/set-blocking#readme) · [Release metadata](https://registry.npmjs.org/set-blocking/2.0.0) | Application dependency tree. set blocking stdio and stderr ensuring that terminal output does not truncate |
| 🧩 source-map-js `1.2.1` | Valentin 7rulnik Semirulnik | [Repository](https://github.com/7rulnik/source-map-js) · [Project page](https://github.com/7rulnik/source-map-js) · [Release metadata](https://registry.npmjs.org/source-map-js/1.2.1) | Build / development. Generates and consumes source maps |
| 🧩 string-width `4.2.3` | Sindre Sorhus | [Repository](https://github.com/sindresorhus/string-width) · [Project page](https://github.com/sindresorhus/string-width#readme) · [Release metadata](https://registry.npmjs.org/string-width/4.2.3) | Application dependency tree. Get the visual width of a string - the number of columns required to display it |
| 🧩 strip-ansi `6.0.1` | Sindre Sorhus | [Repository](https://github.com/chalk/strip-ansi) · [Project page](https://github.com/chalk/strip-ansi#readme) · [Release metadata](https://registry.npmjs.org/strip-ansi/6.0.1) | Application dependency tree. Strip ANSI escape codes from a string |
| 🧩 supercluster `8.0.1` | Vladimir Agafonkin | [Repository](https://github.com/mapbox/supercluster) · [Project page](https://github.com/mapbox/supercluster#readme) · [Release metadata](https://registry.npmjs.org/supercluster/8.0.1) | Application dependency tree. A very fast geospatial point clustering library. |
| 🧩 suspend-react `0.1.3` | Paul Henschel | [Repository](https://github.com/pmndrs/suspend-react) · [Project page](https://github.com/pmndrs/suspend-react#readme) · [Release metadata](https://registry.npmjs.org/suspend-react/0.1.3) | Application dependency tree. Integrate React Suspense into your apps |
| 🧩 three `0.169.0` | mrdoob | [Repository](https://github.com/mrdoob/three.js) · [Project page](https://threejs.org/) · [Release metadata](https://registry.npmjs.org/three/0.169.0) | Application dependency tree. JavaScript 3D library |
| 🧩 three-stdlib `2.36.1` | Paul Henschel | [Repository](https://github.com/pmndrs/three-stdlib) · [Project page](https://github.com/pmndrs/three-stdlib) · [Release metadata](https://registry.npmjs.org/three-stdlib/2.36.1) | Application dependency tree. stand-alone library of threejs examples |
| 🧩 potpack `1.0.2` | Vladimir Agafonkin | [Repository](https://github.com/mapbox/potpack) · [Project page](https://mapbox.github.io/potpack/) · [Release metadata](https://registry.npmjs.org/potpack/1.0.2) | Application dependency tree. A tiny library for packing 2D rectangles (for sprite layouts) |
| 🧩 tinyglobby `0.2.17` | Superchupu | [Repository](https://github.com/SuperchupuDev/tinyglobby) · [Project page](https://superchupu.dev/tinyglobby) · [Release metadata](https://registry.npmjs.org/tinyglobby/0.2.17) | Build / development. A fast and minimal alternative to globby and fast-glob |
| 🧩 tinyqueue `3.0.0` | Project contributors (no author field published) | [Repository](https://github.com/mourner/tinyqueue) · [Project page](https://github.com/mourner/tinyqueue) · [Release metadata](https://registry.npmjs.org/tinyqueue/3.0.0) | Application dependency tree. The smallest and simplest JavaScript priority queue |
| 🧩 update-browserslist-db `1.2.3` | Andrey Sitnik | [Repository](https://github.com/browserslist/update-db) · [Project page](https://github.com/browserslist/update-db#readme) · [Release metadata](https://registry.npmjs.org/update-browserslist-db/1.2.3) | Build / development. CLI tool to update caniuse-lite to refresh target browsers from Browserslist config |
| 🧩 use-sync-external-store `1.6.0` | Project contributors (no author field published) | [Repository](https://github.com/facebook/react) · [Project page](https://github.com/facebook/react#readme) · [Release metadata](https://registry.npmjs.org/use-sync-external-store/1.6.0) | Application dependency tree. Backwards compatible shim for React's useSyncExternalStore. Works with any React that supports hooks. |
| 🧩 vite `6.4.3` | Evan You | [Repository](https://github.com/vitejs/vite) · [Project page](https://vite.dev) · [Release metadata](https://registry.npmjs.org/vite/6.4.3) | Build / development. Native-ESM powered web dev build tool |
| 🧩 which-module `2.0.1` | nexdrew | [Repository](https://github.com/nexdrew/which-module) · [Project page](https://github.com/nexdrew/which-module#readme) · [Release metadata](https://registry.npmjs.org/which-module/2.0.1) | Application dependency tree. Find the module object for something that was require()d |
| 🧩 wrap-ansi `6.2.0` | Sindre Sorhus | [Repository](https://github.com/chalk/wrap-ansi) · [Project page](https://github.com/chalk/wrap-ansi#readme) · [Release metadata](https://registry.npmjs.org/wrap-ansi/6.2.0) | Application dependency tree. Wordwrap a string with ANSI escape codes |
| 🧩 y18n `4.0.3` | Ben Coe | [Repository](https://github.com/yargs/y18n) · [Project page](https://github.com/yargs/y18n) · [Release metadata](https://registry.npmjs.org/y18n/4.0.3) | Application dependency tree. the bare-bones internationalization library used by yargs |
| 🧩 yallist `3.1.1` | Isaac Z. Schlueter | [Repository](https://github.com/isaacs/yallist) · [Project page](https://github.com/isaacs/yallist#readme) · [Release metadata](https://registry.npmjs.org/yallist/3.1.1) | Build / development. Yet Another Linked List |
| 🧩 yargs `15.4.1` | Project contributors (no author field published) | [Repository](https://github.com/yargs/yargs) · [Project page](https://yargs.js.org/) · [Release metadata](https://registry.npmjs.org/yargs/15.4.1) | Application dependency tree. yargs the modern, pirate-themed, successor to optimist. |
| 🧩 yargs-parser `18.1.3` | Ben Coe | [Repository](https://github.com/yargs/yargs-parser) · [Project page](https://github.com/yargs/yargs-parser#readme) · [Release metadata](https://registry.npmjs.org/yargs-parser/18.1.3) | Application dependency tree. the mighty option parser used by yargs |
| 🧩 zustand `5.0.15` | Paul Henschel | [Repository](https://github.com/pmndrs/zustand) · [Project page](https://github.com/pmndrs/zustand) · [Release metadata](https://registry.npmjs.org/zustand/5.0.15) | Application dependency tree. 🐻 Bear necessities for state management in React |

</details>
<!-- NPM-CREDITS:END -->

<!-- COMMUNITY-CREDITS:END -->
