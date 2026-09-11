# Interface contracts

Read only the sections affected by the task. These are maintained agent contracts, not a new design proposal. Music behavior is in [music.md](music.md); map and passenger geometry is in [maps.md](maps.md). Consult those when an interface change affects their behavior.

## Design decisions

Before constructing a new visual direction, present exactly three directions and wait for the owner's selection. A selected direction or an explicit delegation for a named change resolves that gate only for that scope. Bug fixes and refinements within an already selected design do not restart selection. The current selections are Modular Aperture, refined Balanced Rail, Launch Cockpit with the September 10 compact Intro corrections, Engine Telemetry, the ATLAS/Stats remix, Travel Report, Air Atlas A and its A+C flight view, and the subtle spherical radar lens A. Night Glass's first curated composition and Launch Cockpit had explicit scoped design delegation; that is not blanket future delegation.

For substantial visual work whose reference is unclear or no longer fits the goal, clarify the source using the installed Product Design entry point and relevant context workflow. The old `get-context` skill name is not present in this environment's catalog; do not invent its availability. A requested audit uses screenshot evidence and the available audit workflow. The September 4 ban on the frontend builder belonged to that refinement; Launch Cockpit explicitly superseded it for its redesign. Match tools to the actual current task and installed skills.

When implementing a selected generated mock, preserve its layout, anatomy, density, spacing, colors, typography, visible content and hierarchy, subject to explicit owner amendments. Use actual current browser captures for product evidence, at the agreed viewport; remove obsolete current-product captures. Keep private reference images outside Git. Oversized generated Intro concepts are rejected and must not become product artwork.

## Shared geometry and palette

Flux/Music uses a Braun-influenced, Swiss, minimal, slightly brutalist language: flat black/off-white surfaces, tabular numerals and a strict grid. Keep flat square/rectangular controls and restrained rounded slider housings; no decorative knobs, glassmorphism or appliance chrome. Explicit circular artwork and palette swatches below are intentional exceptions, not a direction for circular action buttons.

Tesla Compact's semantic ladder is `13 / 14 / 15 / 15 / 17 / 22 / 32 px`: metadata, labels, body, actions, active names, titles and primary values. Keep high-contrast 13 px metadata, `48 px` action targets and `56 px` primary targets. Apply the roles to public UI, owner LAB, ShaderGradient workbench, diagnostics, attribution and responsive layouts, retaining explicit surface-specific geometry in [maps.md](maps.md). Do not restore the retired blanket Automotive Glance floor or shrink touch regions with text. Preserve editorial Title Case versus functional uppercase, avoid redundant rows, and use disclosure carets only for real menus.

At `773 x 601`, the top bar, lower Now Playing band and footer are each `64 px`. Use the same cell baselines, optical icon frames, stroke, spacing and state rules across navbar/footer. Balanced Rail keeps the 16 mark first at rest; speed alone has exceptional numerical hierarchy. Four right-side icons have equal finger-sized cells with central optical alignment.

`PALETTE` controls the field and interface accent together; do not return to vehicle-paint language or expose low-level shader controls. Resolve critical LIGHT/DARK UI roles centrally, preserving passing colors and minimally adjusting lightness/chroma at fixed hue. Record original/resolved values and measured contrast; validate the palette matrix and actual rendered backgrounds. Renderer artwork remains palette-owned. The running footer uses a recognizable palette-library icon with visible `Palette`, Title Case names and high-contrast 13 px metadata; swatches stay inside its popup. Intro's direct cycle is a separate selected behavior.

## Chrome and drawers

At rest, header/footer retreat fully off-canvas and secondary readouts disappear; only speed and its unit remain. Deliberate pointer/touch or keyboard wake works at **any speed**, and its first press wakes without changing a value. Passive pointer motion, GPS updates, simulated acceleration/braking, regeneration and movement do not wake chrome. Departure may retract once; later speed samples cannot cancel a deliberate wake. Keep a six-second inactivity deadline and immediate retraction after completed unpinned actions or drawer close. Stale keyboard focus cannot extend the deadline; actually open surfaces retain usable controls and focus. The older `0.8 km/h` moving-control lock is explicitly superseded by the September 5 correction.

Every shared drawer closes with CLOSE, Escape, exposed-backdrop tap or one dominant swipe in its exit direction. Capture the pointer once a non-control drag begins; suppress app overscroll. Reserve the first `28 px` of the left edge for Chromium history so one physical swipe cannot perform both actions. Do not claim the embedded Tesla native gesture can be disabled. Dialogs restore focus to their opener.

Real modal passenger surfaces suppress global chrome and Now Playing. ATLAS suppresses Now Playing and expands the map/panel to the full available field when chrome rests; do not reintroduce the retired chart sidebar to satisfy this. Contextual Prtcl/Drivey/Gradient cycle controls retract with chrome, use `6 px` corners and align functional label and value to the same left edge without changing dimensions, targets or color roles. Visual/Music open explicit caret-marked libraries. Catalogue cards do not advertise internal view/render/type/variant counts; keep internal IDs stable, but remove visible catalogue numbers and repeated SELECT from the running Visual drawer, retaining ACTIVE and a compact inactive icon (September 8 correction).

UNDERWATER occupies the complete speed-badge footprint with a contrast-safe palette-derived background, descends from and returns to that badge, and respects reduced motion. The owner-directed September 5 refinement makes the subordinate strip `32 px` tall beneath the unchanged `64 px` speed control; it must not resemble an alarm-red warning. See [Night Glass refinement](../NIGHT-GLASS-2026-09-05.md#2026-09-05-0147--publication-and-owner-directed-refinement).

The network cell is a browser connection estimate, not cellular reception or an active ping service. Healthy is a readable outlined dot with an accessible name, without redundant NET ONLINE text. Constrained/offline states use actionable `16 px` text and browser-estimated downlink when available.

The September 11 owner refinement puts compact Visual choices first, then a
separator and Presets. Engine's selected minimal Telemetry direction includes an
explicitly delegated RPM-stem crest, voice heading and accent gear; it does not
change acoustic/motion ownership. See [road refinement](../ROAD-REFINEMENT-2026-09-11.md).

## Running media and effects

Now Playing is persistent whenever eligible chrome is awake, not a transient toast. It belongs to the footer's **single animated/inert container** immediately above the footer; suppress it in ATLAS and while any real menu, popup or passenger panel is open. It shows committed artwork, title, artist/source and previous/play-pause/next, following manual and natural track changes. Align artwork, copy and transport on a common center; size credit-role columns from content so labels cannot overlap titles. The older independent overlay is superseded.

The dark Music drawer's chart icon is visibly white and NOW PLAYING stays on one line. Preserve pinned black `chart-bar.svg` bytes; apply presentation through LIGHT/DARK/AUTO roles rather than recoloring or duplicating the vendor source. Use deliberate vertical scrolling rather than reducing semantic type or targets. Pace/Genre chips and track rows are whole-surface controls with standard media icons. Source and transport behavior, the three playable scores, and title-specific Illobo covers are in [music.md#soundtrack-and-selection](music.md#soundtrack-and-selection).

FX Deck is a compact **non-modal** overlay above the footer, opened by persistent MIX, with a readable `2 x 4` layout, independent depth sliders and one reset. It may pin itself open while the visual runs, but never enters the app's inert modal boundary or returns to the bottom of Music. Preserve values across music sources. The eight processors and audible limits are in [music.md#effects-boundary](music.md#effects-boundary).

## Intro and branding

Intro is the initial chooser; Splash is its loading transition. Both display build identity; Intro puts it bottom right. Use Music publicly and `flux` internally, with Engine as an equal immediate mode and one contextual START. The older separate PLAY THE ROAD brand-first screen and its `360 x 160 px` launch CTA/42 px mark are superseded by [Launch Cockpit's explicit decision](../LAUNCH-COCKPIT-2026-09-07.md#decision-and-scope). Keep the Signal Gate background: paired vermilion/ice-blue lanes bending from lower edges into a central vertical gate on black, restrained WebGL2 with Canvas2D fallback, not a static raster.

Exact textual sedicivalvole wordmarks use isolated lowercase Orbitron `750`, `-0.02em` tracking in launch, Instrument Deck and owner LAB; the running top bar uses the 16 Road mark where space permits. Other UI/report type remains Space Grotesk. Preserve real transparent mark, source/creator links, the readable `A project by enuzzo` / Illobo credit and local-capability disclosure. No fake knobs, latches, vents, safety inserts or nonfunctional controls. Safety copy is only DRIVE RESPONSIBLY, directly below the wordmark; do not restore subordinate driving instructions or ceiling explanations there.

The owner-selected September 11 entrance leaves the Signal Gate unobscured for two seconds, then expands the chooser from its center over 1.2 seconds. Hidden controls are not focusable during the delay; reduced motion reveals the chooser without scaling or a visible fade. Preparation continues in parallel and menu/selection updates must not replay the entrance.

The centered intrinsic sheet follows content on both axes, never expands to fill a tall Mac window, and keeps the existing light/dark shell, semantic colors and START hierarchy. Two equal Music/Visual content columns remain at Tesla size, with small amber Music and accent Engine icons. Short windows scroll inside the bounded centered sheet with room reserved for the fixed footer; verify tall desktop, Tesla and phone geometry. The older Road Sheet direct-choice grid and fixed equal top/bottom alignment are superseded by compact artwork/action rows, not a license to enlarge the sheet.

Every new Intro starts with Soundtrack, even after saved Play the Road; retain saved mute and explicit choices within that visit. Each visit rolls a fresh genre/visual without immediate repeats; Choose keeps precise genre, pace, Lobo, score and visual choices reachable. Genre and pace are alternative filters. Atlas/Discover remain deliberate passenger choices; Gradient has one equal roulette weight. Mute replaces Visuals only and uses the same launch path. START never waits for remote music; obey [exact selection readiness](music.md#soundtrack-and-selection) and [silent preparation](motion-runtime.md#preparation-and-recovery).

Keep `80 px` square covers with `6 px` corners and `8 px` top/bottom padding. Remove the media group's outer border and divider. Compact Choose/Random outline-icon actions sit to the right, both with `32 px` visible outlines and `48 px` touch regions; do not increase row footprint. Their action rows have the later `5 px` top margin. Use the actual prepared title and matching artwork; clear stale metadata during selection replacement. Label the music panel SOUNDTRACK plus genre, without repeating an identical Soundtrack genre. Artist is removed **only from Intro**; running credit/miniplayer attribution is unchanged. Earlier 64 px circles, zero image padding and right-aligned Intro artist are superseded.

Keep `36 px` circular preset previews, two stable unique genre-labelled suggestions, a visible PRESETS label (not RESET), and separate aligned preset/palette groups with a vertical rule. Stack groups at narrow widths rather than hiding PRESETS. Palette cycles directly with current swatch/name, without opening a dialog or rerolling suggestions. Random presets refreshes suggestions without applying them, avoids previous suggestions and preserves an already selected preset. The ten-preset catalogue and actual screenshot previews are recorded in [Intro preview refinement](../INTRO-PREVIEW-CAPTURES-2026-09-10.md#intro-preview-and-preset-refinement--2026-09-10); retain Sky Radio and City Jazz bindings through the shared registry. No generated concept art enters the product.

Credits stay bottom left. Put the yellow Buy Me a Coffee cup immediately after About at `48 px` height, shared with REPORT. Its verified destination is `buymeacoffee.com/enuzzo`; retain supplied QR and payment-independent suggestion invitation. Its dialog is viewport-centered, scrolls internally within bounds and restores focus. Never fabricate purchases/donations: any playful project-energy signal starting from 15 must explicitly say it does not represent purchases. About keeps build, privacy/local-check disclosure and Reset Saved State. Earlier top-left support and bottom-right support/bottom-center safety placements are superseded.

## Phone behavior

The selected Compact Cockpit keeps the Tesla organization, thin retracting bars, full touch targets and safe areas. Named physical targets are iPhone 17 Pro and Pro Max; iOS versions are unspecified. Rotation preserves audio, selection and renderer. An accessible inert portrait notice applies only to phones, never a portrait desktop or Tesla viewport.

Landscape palette taps must survive Safari blur with no known next focus target; retain actual outside-pointer, known focus-departure and Escape dismissal. Installed webapp footer backgrounds extend to the bottom edge while contents respect the safe area. Use [road UI evidence](../ROAD-UI-REFINEMENT-2026-09-09.md#implemented) for this specific behavior. Browser emulation does not close physical touch, safe-area, cabin, native-media, network or sustained-GPU acceptance.

## Owner-supplied piston identity — September 11

The owner replaced the Road mark with `logo/pistons-v1/source.png`. Use the
versioned `brand/pistons-v1/` icon family for Intro, Splash, chrome, About and
diagnostics in both appearances. Use transparent `mark-*` PNGs, the transparent
ICO favicon, and `report-mark-pistons-transparent.png` in Travel Report, without
a background card. Preserve source alpha and geometry when resizing. Only the
dedicated iOS Home icon uses an opaque 180px PNG. The original artwork remains
byte-identical. Historical vectors remain archived, not selected.
