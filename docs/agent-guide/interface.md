# Interface contracts

Read only the sections affected by the task. These are maintained agent contracts, not a new design proposal. Music behavior is in [music.md](music.md); map and passenger geometry is in [maps.md](maps.md). Consult those when an interface change affects their behavior.

## Design decisions

Before implementing a new visual direction, present exactly two carefully developed Image Gen directions and wait for the owner's selection. The September 20 owner instruction supersedes the former three-direction rule project-wide. Ground both directions in actual product captures and the established design system; vary meaningful layout or interaction choices rather than merely recoloring the same screen. A selected direction or an explicit delegation for a named change resolves that gate only for that scope. Bug fixes and refinements within an already selected design do not restart selection. The current selections are Modular Aperture, refined Balanced Rail, Launch Cockpit with the September 10 compact Intro corrections, Engine Telemetry, the ATLAS/Stats remix, Travel Report, Air Atlas A and its A+C flight view, and the subtle spherical radar lens A. Night Glass's first curated composition and Launch Cockpit had explicit scoped design delegation; that is not blanket future delegation.

The September 23 owner explicitly delegates the Meridian reinterpretation and
PRTCL curve refinement, and requests a stronger Aperture bend across the whole
tunnel. That named delegation resolves selection for these changes: folded,
palette-lit Meridian galleries; signed PRTCL banking/torsion; and modest near-rim
translation with stronger mid-depth Aperture curvature. Curve-driven audio is
explicitly deferred. This is not approval to redesign other surfaces.

The September 24 owner selected **Night Instrument (direction A)** for the Tesla
display and passenger remote and approved every item of the proposal, with
autonomous implementation and no separate Image Gen round. It retains the rail
geometry, targets, type ladder and chrome rules while changing material, light,
imagery and motion; it supersedes the footer labels, per-chip filter icons, the
Intro presets/palette rule, FX Deck slider rows, the two TAMARRO buttons and
the remote's right-side pages. See [Night Instrument](../NIGHT-INSTRUMENT-2026-09-24.md).
This is not blanket approval for unrelated redesigns.

For substantial visual work whose reference is unclear or no longer fits the goal, clarify the source using the installed Product Design entry point and relevant context workflow. The old `get-context` skill name is not present in this environment's catalog; do not invent its availability. A requested audit uses screenshot evidence and the available audit workflow. The September 4 ban on the frontend builder belonged to that refinement; Launch Cockpit explicitly superseded it for its redesign. Match tools to the actual current task and installed skills.

When implementing a selected generated mock, reproduce its layout, anatomy, density, spacing, colors, typography, visible content and hierarchy as faithfully as possible, subject to explicit owner amendments. The established design system takes precedence over generated artistic deviations: retain its tokens, typography, geometry, accessibility and shared components. Correct misleading states or unsupported browser promises instead of reproducing them. Record necessary departures beside the selected reference, compare actual rendered screens with that reference at the agreed viewport and correct avoidable drift before handoff. Use actual current browser captures for product evidence; remove obsolete current-product captures. Keep private reference images outside Git. Oversized generated Intro concepts are rejected and must not become product artwork.

The September 18 owner selected **XYZ Cross** for the phone motion companion:
central TARE with live XYZ/gyro, a top-bar phone icon and compact QR/three-SVG
guide. The September 19 owner refinement reuses piston/Orbitron branding and
shared RED/DARK roles, prioritizes portrait use in an approximately 45° holder,
and keeps placement/debug disclosures below the instrument. This is scoped
approval for that feature. See
[implementation contract](../PHONE-MOTION-COMPANION-2026-09-18.md). The subsequent owner selection is
[TRACE with the phone indicator and ZERO below the cube](../design/phone-motion-2026-09-19/README.md).
Its **recalibrate** subtitle and unobstructed graph supersede the older central
TARE placement. The implemented TRACE instrument uses the existing WebGL2
renderer, a bounded three-second acceleration trail, a relative-orientation phone
indicator and separate camera recentering. Missing values remain dashes; the
empty graph has no demonstration trace. The September 19 owner-requested
companion-guide refinement retains its existing three-step layout, uses original
palette-based three-color SVGs for Scan / Connect / Zero, shortens the primary copy, and places
network/privacy explanations behind an accessible details button. This is a
refinement within the selected companion design, not a pending new direction.
The subsequent owner request adds three stacked benefit lines, large step labels,
a highlighted next action, evidence-based completion marks and brief reconnect
messages. The phone inherits the display palette and effective LIGHT/DARK appearance
from its QR, then follows changes over the paired channel. TRACE recolors without
resetting its history, camera or ZERO. Action emphasis pulses only twice (3.6 s)
and stays static with reduced motion. Technical quality is disclosed on demand;
ZERO stays below the graph and is brought into view once sensors start successfully.

The September 20 owner refinement adds a slow repeating accent ring around only
the active, incomplete numbered setup step, on both the phone and receiver drawer.
It follows existing progress state and disappears on completion; completed checks
and inactive steps stay still. Reduced motion keeps the ring static. This scoped
progress-ring instruction supersedes the two-pulse limit above only for the step
indicator; existing action-button emphasis remains bounded.

The September 19 morning owner refinement keeps sensor enablement, ZERO,
RECENTER VIEW and STOP in the initial phone viewport. The portrait instrument
uses the available viewport height; detailed XYZ readings and disclosures follow
below. Compact phone steps retain their labels and completion states; their SVG
illustrations remain on the display guide. Short plots omit crowded numerical
ticks, retaining axis labels, and never invent a trace. Avoid scrolling an
already-visible ZERO when sensors become live.

The September 20 phone onboarding request supersedes the initial-viewport cube and
all-at-once control hierarchy for the companion's next selected implementation.
The requested sequence is local sensors, pairing, placement, ZERO, explicit
screen-awake activation, then live readings. Clear interruption and restart guidance
must appear on both paired surfaces. The owner selected the first phone layout and second receiver drawer, combined
with numbered/checkmarked progress and automatic collapse after completed setup.
The selected implementation retains real semantic tokens and touch targets; local
verification and canonical/physical acceptance remain separately recorded. See
[onboarding brief](../design/phone-onboarding-2026-09-20/README.md).

The September 20 owner review reopens aesthetic acceptance. Its scoped repair keeps
the selected arrangement: an intrinsic-height, 640 px maximum receiver panel bounded
by the viewport, common content gutters, a connected progress rail, accent telemetry
icons, and right-aligned disclosure carets. Alternative local WebRTC and this-device
sensing live in Connection details. Generic setup, errors and recovery say phone/page/
browser; do not infer iOS or Safari from a missing capability. Use the
[revision evidence](../qa/2026-09-20-phone-design-review/README.md); physical acceptance
and the owner's aesthetic judgement remain separate from the agent's fidelity pass.


## Passenger remote pairing — September 23

The command-only receiver reuses the approved companion geometry, typography,
semantic palette, numbered progress rail and close/disclosure glyphs. Its own
`remote/receiver.css` is imported by the receiver component into the eager App
bundle; never rely on the lazy phone route to load display styles. Use the shared
DialogSurface for focus, Escape, backdrop and drag handling.

At 773 × 601, the right-hand panel is at most 640 px wide, intrinsically sized and
bounded by 16 px viewport gutters. Instructions sit beside a 240 × 240 px QR;
its SVG has explicit dimensions and an internal four-module white quiet zone.
The complete QR, status, cancel action and closed disclosure fit without scrolling.
Optional expanded details may scroll inside the panel. Below 550 px the QR precedes
instructions; phone preview at 390 × 844 fits the entire panel. Controls retain
48 px targets and 56 px primary recovery targets; copy uses the shared type ladder.

Scan / Connect / Ready checks follow actual admission and channel confirmation.
Network gaps retain the admitted pairing and say Reconnecting; expiry or errors
offer one CREATE NEW QR action. Closing the panel preserves the pairing;
CANCEL PAIRING / DISCONNECT PHONE revokes it. Physical camera readability,
Tesla touch, phone backgrounding and sustained network quality remain device gates.

## Shared geometry and palette

The compact speed numeral is a read-only value. The September 23 drive showed
that tapping it could silently change GPS to Demo; source selection now uses
the report's explicit action, and Demo adds `SIM` beside the speed unit. Keep
GPS status distinct from the speed source and from Engine audio state.

The maintained [interface system](../DESIGN-SYSTEM.md) links the exact shared
control module, production styles and runnable HTML/CSS reference. Use it for
label/control consistency; specimen layout does not own production geometry.

Flux/Music uses a Braun-influenced, Swiss, minimal, slightly brutalist language: flat black/off-white surfaces, tabular numerals and a strict grid. Keep flat square/rectangular controls and restrained rounded slider housings; no decorative knobs, glassmorphism or appliance chrome. Explicit circular artwork and palette swatches below are intentional exceptions, not a direction for circular action buttons.

Tesla Compact's semantic ladder is `13 / 14 / 15 / 15 / 17 / 22 / 32 px`: metadata, labels, body, actions, active names, titles and primary values. Keep high-contrast 13 px metadata, `48 px` action targets and `56 px` primary targets. Apply the roles to public UI, owner LAB, ShaderGradient workbench, diagnostics, attribution and responsive layouts, retaining explicit surface-specific geometry in [maps.md](maps.md). Do not restore the retired blanket Automotive Glance floor or shrink touch regions with text. Preserve editorial Title Case versus functional uppercase, avoid redundant rows, and use disclosure carets only for real menus.

At `773 x 601`, the top bar, lower Now Playing band and footer are each `64 px`. Use the same cell baselines, optical icon frames, stroke, spacing and state rules across navbar/footer. Balanced Rail keeps the piston mark and speed adjacent at the left in every running mode, stationary or moving, with unchanged 64 px bar height (56 px phone landscape). The mark is 60 px (52 px in the compact phone cell), enlarged on September 19 without increasing either rail dimension. Global mode/status/actions follow to the right. Contextual controls share a reserved right-hand lane and reflow as whole groups; they never enter the identity lane. The September 19 owner explicitly superseded the earlier map-only hidden-logo workaround. See [shared rail contract](../DESIGN-SYSTEM.md#stable-identity-and-contextual-action-lane--september-19).

`PALETTE` controls the field and interface accent together; do not return to vehicle-paint language or expose low-level shader controls. Resolve critical LIGHT/DARK UI roles centrally, preserving passing colors and minimally adjusting lightness/chroma at fixed hue. Record original/resolved values and measured contrast; validate the palette matrix and actual rendered backgrounds. Renderer artwork remains palette-owned. The running footer uses a recognizable palette-library icon with visible `Palette`, Title Case names and high-contrast 13 px metadata; swatches stay inside its popup. Intro's direct cycle is a separate selected behavior.

## Chrome and drawers

At rest, global header actions and the footer retract; the adjacent logo and speed remain in their stable left-hand cells. This September 19 owner correction supersedes the former speed-only moving state. Deliberate pointer/touch or keyboard wake works at **any speed**, and its first press wakes without changing a value. Passive pointer motion, GPS updates, simulated acceleration/braking, regeneration and movement do not wake chrome. Departure may retract once; later speed samples cannot cancel a deliberate wake. Keep a six-second inactivity deadline and immediate retraction after completed unpinned actions or drawer close. Stale keyboard focus cannot extend the deadline; actually open surfaces retain usable controls and focus. The older `0.8 km/h` moving-control lock is explicitly superseded by the September 5 correction.

Every shared drawer closes with CLOSE, Escape, exposed-backdrop tap or one dominant swipe in its exit direction. Capture the pointer once a non-control drag begins; suppress app overscroll. Reserve the first `28 px` of the left edge for Chromium history so one physical swipe cannot perform both actions. Do not claim the embedded Tesla native gesture can be disabled. Dialogs restore focus to their opener.

Real modal passenger surfaces suppress global chrome and Now Playing. ATLAS suppresses Now Playing and expands the map/panel to the full available field when chrome rests; do not reintroduce the retired chart sidebar to satisfy this. Contextual controls (Atlas camera/framing, Air Atlas camera, Fly With secondary camera, visual cycles and Engine profiles) are hidden and inert while global chrome is awake and appear in the vacated bar space while chrome rests. Keep ordinary field tap separate from drag/pinch; outside taps close drawers/cards/popovers without activating underlying controls. Prtcl/Drivey/Gradient cycle controls use `6 px` corners and align functional label and value to the same left edge without changing dimensions, targets or color roles. Visual/Music open explicit caret-marked libraries. Catalogue cards do not advertise internal view/render/type/variant counts; keep internal IDs stable, but remove visible catalogue numbers and repeated SELECT from the running Visual drawer, retaining ACTIVE and a compact inactive icon (September 8 correction).

UNDERWATER occupies the complete speed-badge footprint with a contrast-safe palette-derived background, descends from and returns to that badge, and respects reduced motion. The owner-directed September 5 refinement makes the subordinate strip `32 px` tall beneath the unchanged `64 px` speed control; it must not resemble an alarm-red warning. See [Night Glass refinement](../NIGHT-GLASS-2026-09-05.md#2026-09-05-0147--publication-and-owner-directed-refinement).

The network cell is a browser connection estimate, not cellular reception or an active ping service. Healthy is a readable outlined dot with an accessible name, without redundant NET ONLINE text. Constrained/offline states use actionable `16 px` text and browser-estimated downlink when available.

The September 11 owner refinement puts compact Visual choices first, then a
separator and Presets. Engine's selected minimal Telemetry direction includes an
explicitly delegated RPM-stem crest, voice heading and accent gear; it does not
change acoustic/motion ownership. See [road refinement](../ROAD-REFINEMENT-2026-09-11.md).

## Running media and effects

Night Instrument (September 24) owns the running chrome material: plates of
keys, one label row and one value row per footer key (Sound, Brake FX, Visual,
Music, MIX, Palette), artwork on the library keys with the caret on the label
row, and LEDs for state. Its stylesheet is `src/night-instrument.css`, loaded
last; phone landscape keeps 56 px rails with 48 px keys.

Now Playing is persistent whenever eligible chrome is awake, not a transient toast. It belongs to the footer's **single animated/inert container** immediately above the footer; suppress it in ATLAS and while any real menu, popup or passenger panel is open. It shows committed artwork, title, artist/source and previous/play-pause/next, following manual and natural track changes. Align artwork, copy and transport on a common center; size credit-role columns from content so labels cannot overlap titles. The older independent overlay is superseded.

The dark Music drawer's chart icon is visibly white and NOW PLAYING stays on one line. Preserve pinned black `chart-bar.svg` bytes; apply presentation through LIGHT/DARK/AUTO roles rather than recoloring or duplicating the vendor source. Use deliberate vertical scrolling rather than reducing semantic type or targets. Pace/Genre chips and track rows are whole-surface controls with standard media icons. Source and transport behavior, the three playable scores, and title-specific Illobo covers are in [music.md#soundtrack-and-selection](music.md#soundtrack-and-selection).

FX Deck is a compact **non-modal** overlay above the footer, opened by persistent MIX, with a readable `2 x 4` layout, independent depth sliders and one reset. Since September 24 each effect is a performance pad: tap plays the authored hit or stops it, vertical drag sets depth, and the pad is an ARIA slider with keyboard control. It may pin itself open while the visual runs, but never enters the app's inert modal boundary or returns to the bottom of Music. Preserve values across music sources. The eight processors and audible limits are in [music.md#effects-boundary](music.md#effects-boundary).

## Intro and branding

Intro is the initial chooser; Splash is its loading transition. Both display build identity; Intro puts it bottom right. Use Music publicly and `flux` internally, with Engine as an equal immediate mode and one contextual START. The older separate PLAY THE ROAD brand-first screen and its `360 x 160 px` launch CTA/42 px mark are superseded by [Launch Cockpit's explicit decision](../LAUNCH-COCKPIT-2026-09-07.md#decision-and-scope). Keep the Signal Gate background: paired vermilion/ice-blue lanes bending from lower edges into a central vertical gate on black, restrained WebGL2 with Canvas2D fallback, not a static raster.

Exact textual sedicivalvole wordmarks use isolated lowercase Orbitron `750`, `-0.02em` tracking in launch, Instrument Deck and owner LAB; the running top bar uses the 16 Road mark where space permits. Other UI/report type remains Space Grotesk. Preserve real transparent mark, source/creator links, the readable `A project by enuzzo` / Illobo credit and local-capability disclosure. No fake knobs, latches, vents, safety inserts or nonfunctional controls. Safety copy is only DRIVE RESPONSIBLY, directly below the wordmark; do not restore subordinate driving instructions or ceiling explanations there.

The owner-selected September 11 entrance leaves the Signal Gate unobscured for two seconds, then expands the chooser from its center over 1.2 seconds. Hidden controls are not focusable during the delay; reduced motion reveals the chooser without scaling or a visible fade. Preparation continues in parallel and menu/selection updates must not replay the entrance.

The centered intrinsic sheet follows content on both axes, never expands to fill a tall Mac window, and keeps the existing light/dark shell, semantic colors and START hierarchy. Two equal Music/Visual content columns remain at Tesla size, with small amber Music and accent Engine icons. Short windows scroll inside the bounded centered sheet with room reserved for the fixed footer; verify tall desktop, Tesla and phone geometry. The older Road Sheet direct-choice grid and fixed equal top/bottom alignment are superseded by compact artwork/action rows, not a license to enlarge the sheet.

Every new Intro starts with Soundtrack, even after saved Play the Road; retain saved mute and explicit choices within that visit. Each visit rolls a fresh genre/visual without immediate repeats; Choose keeps precise genre, pace, Lobo, score and visual choices reachable. Genre and pace are alternative filters. Atlas/Discover remain deliberate passenger choices; Gradient has one equal roulette weight. Mute replaces Visuals only and uses the same launch path. START never waits for remote music; obey [exact selection readiness](music.md#soundtrack-and-selection) and [silent preparation](motion-runtime.md#preparation-and-recovery).

Soundtrack preparation distinguishes loading, unavailable and offline states. On a catalogue error, the existing Random action becomes Retry for the same selection; Choose remains available and START stays independent of remote readiness. A prepared running track is READY, not indefinitely LOADING. Never describe a failed empty catalogue as still preparing.

Keep `80 px` square covers with `6 px` corners and `8 px` top/bottom padding. Remove the media group's outer border and divider. Compact Choose/Random outline-icon actions sit to the right, both with `32 px` visible outlines and `48 px` touch regions; do not increase row footprint. Their action rows have the later `5 px` top margin. Use the actual prepared title and matching artwork; clear stale metadata during selection replacement. Label the music panel SOUNDTRACK plus genre, without repeating an identical Soundtrack genre. Artist is removed **only from Intro**; running credit/miniplayer attribution is unchanged. Earlier 64 px circles, zero image padding and right-aligned Intro artist are superseded.

Keep `36 px` circular preset previews, two stable unique genre-labelled suggestions, a visible PRESETS label (not RESET), and separate aligned preset/palette groups with a vertical rule. Stack groups at narrow widths rather than hiding PRESETS. Palette cycles directly with current swatch/name, without opening a dialog or rerolling suggestions. Random presets refreshes suggestions without applying them, avoids previous suggestions and preserves an already selected preset. The ten-preset catalogue and actual screenshot previews are recorded in [Intro preview refinement](../INTRO-PREVIEW-CAPTURES-2026-09-10.md#intro-preview-and-preset-refinement--2026-09-10); retain Sky Radio and City Jazz bindings through the shared registry. No generated concept art enters the product.

Credits stay bottom left. Put the yellow Buy Me a Coffee cup immediately after About at `48 px` height, shared with REPORT. Its verified destination is `buymeacoffee.com/enuzzo`; retain supplied QR and payment-independent suggestion invitation. Its dialog is viewport-centered, scrolls internally within bounds and restores focus. Never fabricate purchases/donations: any playful project-energy signal starting from 15 must explicitly say it does not represent purchases. About keeps build, privacy/local-check disclosure and Reset Saved State. Earlier top-left support and bottom-right support/bottom-center safety placements are superseded.

## Phone behavior

The selected Compact Cockpit keeps the Tesla organization, thin retracting bars, full touch targets and safe areas. Named physical targets are iPhone 17 Pro and Pro Max; iOS versions are unspecified. Rotation preserves audio, selection and renderer. An accessible inert portrait notice applies only to phones, never a portrait desktop or Tesla viewport.

Landscape palette taps must survive Safari blur with no known next focus target; retain actual outside-pointer, known focus-departure and Escape dismissal. Installed webapp footer backgrounds extend to the bottom edge while contents respect the safe area. Use [road UI evidence](../ROAD-UI-REFINEMENT-2026-09-09.md#implemented) for this specific behavior. Browser emulation does not close physical touch, safe-area, cabin, native-media, network or sustained-GPU acceptance.

## Passenger remote companion — September 23

The selected direction is the compact A variant: a narrow Now Playing row with
one cover and previous/play/next beside it, followed by four clear home targets
for Mode, Music, Visual and Effects. Engine character and Palette remain in the
same content hierarchy without adding vertical cover art. Each target opens a
right-side page with an obvious title, Back control and close control. A
horizontal swipe in either direction closes or steps back, so the phone behaves
like a small native control surface rather than a long settings page.

Effects are visible on Home as a low-friction play area, with the full list of
manual effects in the Effects page. The remote mirrors the display's applied
state after an acknowledged command. It never displays or requests IMU data;
the only onboarding action is scanning the display QR once. A one-hour encrypted
HTTPS pairing is retained through temporary outages and reloads, with a visible
Forget action for revocation. This UI selection does not close real-device
transport, Safari background, safe-area or passenger acceptance.

The September 24 Night Instrument selection supersedes the right-side pages:
the remote mirrors the display at the top (visual frame, cover, transport),
then a Music/Engine switch and Visual, Music, FX and Palette sections behind a
tab bar; pairing, Forget and command semantics are unchanged.

The owner's quality pass retains that selected composition. A persistent header
uses the transparent piston mark and Orbitron wordmark above connection status.
Before admission, show a three-step guide (open the display phone panel, scan,
control the drive), existing scan/connect artwork and expandable connection help;
do not show placeholder remote controls as a connected session. HELP can reopen
the guide without losing the pair. Terminal errors explain how to create a new QR.
Use the pairing link's palette and appearance while connecting, then follow the
display's current theme and resolved light/dark appearance in every state heartbeat.
Auto follows the display's effective result, not the phone's system preference.
Use 44 px minimum touch targets and safe-area-aware vertical scrolling. Modal pages
isolate background controls, trap/restore keyboard focus and support Escape;
horizontal slider gestures must not trigger page dismissal.

The September 23 road audit separates **Braking Underwater** (the automatic
vehicle master) from **Manual FX**, which remain independent. Do not place an
unqualified ON/OFF beside a manual-effects heading. With braking audio disabled,
the display's Underwater badge says **VISUAL ONLY**. Engine exposes the dry-audio
boundary and disables musical effect controls. Both surfaces share authored tap
depths. A phone slider may preview its requested position with **Sending…**;
an acknowledgement restores the display's authoritative state. Coalesce pending
positions per effect so a fast drag cannot drop its final value; preserve ordered
transport gestures. See [audio audit](../AUDIO-EFFECTS-AUDIT-2026-09-23.md).

## Owner-supplied piston identity — September 11

The owner replaced the Road mark with `logo/pistons-v1/source.png`. Use the
versioned `brand/pistons-v1/` icon family for Intro, Splash, chrome, About and
diagnostics in both appearances. Use transparent `mark-*` PNGs, the transparent
ICO favicon, and `report-mark-pistons-transparent.png` in Travel Report, without
a background card. Preserve source alpha and geometry when resizing. Only the
dedicated iOS Home icon uses an opaque 180px PNG. The original artwork remains
byte-identical. Historical vectors remain archived, not selected.

The September 19 size refinement gives the Intro piston mark a 64 px frame
(48 px visually on phones, within its existing 36 px layout slot). Only the
desktop Intro heading grows to 64 px; running chrome retains its fixed height.

## Mounted phone response — September 19

The September 20 owner refinement supersedes the LIVE/GPS/DEMO subtitle: the phone cell is icon-only within the existing shared 32 px frame / 28 px glyph / 2 px stroke. Use a satellite for GPS fallback, a checked phone for paired-but-not-active input and a phone with a gyroscope for effective sensor response. Pairing, recovery and Demo have distinct inner symbols. Connection alone never claims effective road input; the immediately visible drawer subtitle names the actual source. The existing panels explain connection/calibration/fallback. Phone adds explicit portrait-holder selection beside ZERO; TRACE stays available for other poses. See [the implementation contract](../PHONE-ROAD-INPUT-2026-09-19.md).

## Any-pose companion and console artwork — September 20

The owner clarified that ZERO must accept flat, upright, inclined, portrait and
landscape placement, without a holder requirement. The existing wizard stays;
placement confirmation no longer opts into vehicle axes. Optional aligned car
motion lives in sensor details and requires its own explicit declaration and ZERO.
The default placement/ZERO PNG now illustrates the inclined double-phone console
tray shown in owner references, in the already-selected illustration style.
The original clamp illustration remains available as zero.png; zero-console.png
is the new default on both surfaces. This is an explicitly requested asset
correction, not a new pending direction-selection gate. Reference photographs stay
external; see [prompt and provenance](../design/phone-onboarding-2026-09-20/CONSOLE-PROMPT.md).
