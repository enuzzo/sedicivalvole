# Project Instructions for Agents

These rules apply to every change in the `sedicivalvole` project.

## Language

- Write all source code, code comments, documentation, commit-ready text, logs, and product interface copy in English.
- Italian is reserved for direct conversation between the user and the assistant.

## Versioning and traceability

- `VERSION` is the only SemVer source of truth. Do not duplicate the number manually; builds must read or receive it through a verified pipeline.
- Every build carries a build stamp in the form `20260826-1543` (`YYYYMMDD-HHMM`), generated at build time. Always write the build stamp when publishing or deploying, and record it in the deployment evidence. The stamp identifies the build; it does not replace `VERSION`.
- Update `CHANGELOG.md` for every user-visible change or relevant technical change. The changelog must be strictly progressive and append-only: never rewrite, alter, or remove past entries under any circumstances. Every changelog entry must explicitly record the date, local time (e.g. `2026-08-27 15:10`), the corresponding short commit hash (e.g. `[c85b70c]`), and the build stamp when deploying (e.g. `build 20260827-1510`).
- Keep unreleased changes under `Unreleased` in chronological progressive order; create a versioned ISO-dated section only when releasing, and synchronize `VERSION`.
- Update the README, feature status, and architecture when facts change.
- Use only real, verified screenshots from the current build at agreed Tesla viewports. Remove obsolete captures.
- Create small, verified commits frequently during active development. Push each verified checkpoint when a configured remote exists; never invent or configure a remote without the user's destination.
- After each user-approved product change, deploy the verified build to the canonical live root and validate the product-visible result.
- If the active context becomes unreliable or overloaded, first inventory every pending requirement and local change, write a concrete task list, and hand the work to a fresh session at an appropriate reasoning effort without leaving the Dropbox project directory.
- When work continues across desktop and mobile clients, do not assume locally queued desktop messages reached the synchronized thread. Before declaring requirements missing, inspect available local queue/history evidence, record recoverable requirements, and clearly mark any truncated content instead of reconstructing it.

## Secrets and local material

- Never read, print, diff, log, or version `.env` or local variants.
- Never place credentials in command lines, logs, screenshots, or documentation.
- Never version `_references/` or copy its external material into the repository.
- `.env.example` may contain only keys and harmless placeholders.

## Product and validation

- Separate implemented features, roadmap items, assumptions, and verified facts.
- Never present archived mocks or prototypes as the current product.
- Before a visual build, show exactly three directions and wait for a selection.
- Verify the experience at agreed Tesla viewports and on the target vehicle.
- During active development, deploy each user-approved product change to the canonical root at `https://sedicivalvole.app/`; the product remains experimental even though the source repository is public.
- An upload is not a successful deployment: verify the canonical URL, HTML, assets, version, and cache behavior after every publication.
- Keep the technical diagnostics accessible from within the main product experience.
- Treat `Engine` and `Flux` as equal primary product modes. The active mode must remain clearly identifiable and the mode switch must remain reachable from either experience.
- `Flux` is the current adaptive music and generative-field work. `Engine` is a separate engine-sound experience with its own audio model and instrument-inspired visual language.
- The current starburst/lens-flare Flux visual is rejected. Retain only central convergence, depth, speed response, and the low control plane; present exactly three revised minimal, Swiss-influenced directions before replacing it.
- `VERTIGO 02` embeds the byte-identical Codrops/Tympanus Infinite Lights Interstate 7 runtime from commit `e58d58520bc0dfde21f9e14e6a1b8c7f0a2a2a9e` as separately licensed third-party material. Do not alter, trim, or relicense its road, light sticks, car trails, bloom, camera, distortion, dependencies, or source files. Keep the iframe hidden until the external bridge removes the editorial shell; the bridge may drive the original time/FOV controls and map sedicivalvole themes onto existing runtime colour buffers and uniforms. Keep upstream-integrity tests and attribution green.
- `@shadergradient/react@2.4.20` and its pinned Three/R3F peers power one public **GRADIENT 08** family with the owner-selected **Japanese Mist**, **Acid Orchard**, and **Chromatic Silk** variants, plus the standalone and protected LAB workbenches. Expose the family as one Visual catalogue entry and keep a persistent in-visual `VARIANT` control that cycles the three exact variants. Keep the public renderer lazy-loaded as one separate chunk, retain the MIT notice, keep an exact source/change inventory, preserve the project-owned Canvas2D fallback, and require target-Tesla GPU acceptance. Do not modify or relicense upstream source without a new explicit owner decision.
- Keep `docs/MUSIC-CRAFT.md` current. It is the project's accumulated musical knowledge: theory, production technique, and the specific defects this codebase has made and fixed. Whenever a musical fault is diagnosed, a technique is researched, or a way to improve the score is found, record it there in the same session, with the reason a listener noticed it. It advises on quality and must never become a rulebook that prevents good music; delete an entry that constrains without cause.
- Prefer a check over a memory. A musical rule that can be asserted — consonance against the voiced chord, an effect's level, the variety a form claims — belongs in a test, because the alternative is hearing the fault, describing it, and hunting it again.
- Flux must feel like an authored adaptive score. Do not substitute exposed oscillator pings, a noise bed, or linear BPM escalation for arrangement, low end, rhythm, harmony, timbre, and spatial progression.
- JUNCTION must not equate road energy with a permanently loud break. Keep rest free of beat and bassline, introduce a quiet native-tempo break near `13 km/h`, cap the authored tempo ladder at `168 BPM`, and grow intensity primarily through orchestration, dynamics, punctuation and effects. Randomness may mix only complete, tempo-, harmony- and rhythm-compatible authored takes at eight-bar boundaries; paired decks must share one exact rhythmic spine, every encoded clip must be self-contained, and recent-family memory must prefer material the listener has not just heard. Use sample-accurate starts, never repeat the same primary take immediately, and never choose a bass, melody note or tonal accent without checking it against the voiced chord. Keep the six-clip decoded-memory bound and never publish an isolated source loop or stem.
- Prefer curated audiovisual environments and purposeful Visual/Music selectors over low-level `Atmos`, `Harmonics`, and `Pulse` controls in the primary driving surface. The owner-selected **Tesla Compact** refinement uses a semantic `13 / 14 / 15 / 15 / 17 / 22 / 32 px` type ladder, `48 px` action targets, `56 px` primary targets, and retracting `64 px` top and bottom chrome at `773 x 601`; do not restore a blanket type floor that consumes the visual field or reduce touch targets with the type. Keep `13 px` metadata high contrast, preserve the editorial Title Case/functional uppercase distinction, avoid redundant text rows, and use disclosure carets only for controls that open real menus. Modal passenger surfaces suppress global chrome and Now Playing; ATLAS suppresses Now Playing and expands its panel to the full field when chrome rests. Contextual visual-cycle controls follow chrome visibility and use the shared `6 px` radius. The user-adjustable energy-threshold slider is retired: normalize visual and music energy against the fixed `130 km/h` legal-road ceiling, while ensuring the tunnel is already visible by approximately `40 km/h`.
- Keep ATLAS map attribution mandatory but visually subordinate: a tiny, low, translucent text strip immediately above the footer, never a large white pill. Its passenger-location sidebar must collapse behind a persistent midpoint handle on the right edge; collapsing expands the map to the full field and the same handle must reopen it.
- Do not assume Apache, Nginx, or any other server technology without evidence.

## Licensing

- Keep `LICENSE`, `LICENSE-SCOPE.md`, `NOTICE`, README licensing copy, package metadata, and the licensing decision log synchronized.
- Original sedicivalvole code and documentation default to
  `PolyForm-Noncommercial-1.0.0`; this is source-visible noncommercial software,
  not open source. Original brand, screenshots, audio, and standalone
  visual/media assets remain excluded unless specifically licensed. Public
  versions already distributed under AGPL retain their earlier rights.
- The sole original creator and public licensor identity is `enuzzo`; do not
  imply a studio, company, or other legal entity. Third-party ownership and
  credits remain exactly as recorded in `THIRD_PARTY_NOTICES.md`.
- Record every third-party dependency or asset in `THIRD_PARTY_NOTICES.md` before it enters the product or repository.
- Do not use Creative Commons licenses for software.

## Standing deployment authorization — 2026-09-05

The owner explicitly authorizes deployment to `https://sedicivalvole.app/` now and in future sessions: deploy promptly within the agreed project work, without asking for another deployment confirmation. The owner accepts iterative fixes backed by Git, backups and session history. This supersedes earlier requirements to obtain fresh deployment approval for each change. Keep the existing relevant checks, traceable commits/build stamps and canonical post-deployment verification; use rollback or a focused fix when needed.

The owner's explicit configuration exception also permits the official `scripts/deploy_drive_lab_ftp.py` script to load `.env` internally for preflight, publication and postflight. This is the sole exception to the blanket `.env` reading prohibition above: agents must not inspect, print, diff, log, copy or version secret contents or place credentials in command lines. Do not ask again for that same internal-loading permission during ordinary authorized deployment.

## Community acknowledgements — 2026-09-05

Maintain the README community credits and `docs/COMMUNITY-THANKS.md` when sources are added, replaced or retired. Record the real author/project, exact code or material used, public contact routes and a warm, personalized unsent release thank-you draft. Separate shipped integrations from services, development tools and studies. Never describe the current PolyForm Noncommercial project as MIT/open source, infer private contact details, or send a message without explicit sending authorization.

### Complete README footer — owner's standing instruction, 2026-09-05

Keep every community credit in the final README section, including minor/transitive dependencies and sources without Git repositories: named authors, original repositories, articles/demos, exact code/material/service use and shipped/development/study status. Precede each entry with a restrained relevant emoji. Insert later product updates above `COMMUNITY-CREDITS:START`, never below the credits. Update README, THIRD_PARTY_NOTICES and COMMUNITY-THANKS together whenever provenance changes. Refresh the complete npm inventory with `python3 scripts/readme_dependency_credits.py --refresh` when the lockfile changes; run `--check` before publishing. The automated check does not replace review of authorship or non-npm sources. This is a persistent owner preference, not a one-time cleanup.


## Owner acceptance and reliability direction — 2026-09-07

Flux, Soundtrack, FX, interface and Discover are owner-accepted, subject to later
small refinements. Prioritize reliability fixes, then Engine, then iPhone.
Travel ATLAS becomes an informative map; move and expand the existing statistics
into a separate full-screen visual only after replacement parity is verified.
The owner delegates information design; exact-coordinate Discover POIs are a
candidate to research. Keep the three-direction visual gate before construction.
Transient failed loads must retry automatically with bounded backoff for several
minutes, online/foreground recovery, no overlapping attempts and cancellation on
selection change. Do not repeatedly reload hidden/offline renderers.
Future diagnostics have Standard and Dev levels. The owner explicitly authorizes
coordinate-free packets to the existing diagnostic destination every ten minutes
only in Dev, with automatic send default ON within Dev and a visible OFF switch.
This supersedes manual-only transmission for that future feature only; implement
matching disclosure, scheduling, server validation and tests before enabling it.
Do not promise background timer execution or infer default Dev mode. Record
minimized-browser gaps honestly. See docs/OWNER-DECISIONS-2026-09-07.md.

## Engine source decision — 2026-09-07

The owner explicitly directs implementation using pinned MIT
`markeasting/engine-audio`, including its bundled active WAVs, relying on the
repository's declared MIT licence. This supersedes older project/study holds and
additional owner-approval gates for that exact integration. Record the declared
licence, exact source/hash/change inventory and outstanding recording-provenance
follow-up truthfully; do not claim ownership independently verified or liability
transferred. Preserve upstream attribution and the existing deployment authority.
The prior sealed candidate may be inspected and adapted progressively for this
integration; no independent blind-review claim is made.


## Engine listening refinement — 2026-09-07

The owner requires Engine to bypass UNDERWATER and all Flux creative effects.
Deceleration changes RPM without artificial gain ducking. Keep prominent left
and right TAMARRO controls visible at displayed zero independently of chrome
retraction; stale evidence disables rather than removes them. Small periodic idle
blips require fresh exact standstill and stop on movement, mute or lifecycle loss.
This is a direct refinement of the selected Telemetry direction.

## Owner road feedback — 2026-09-07 evening

Manual TAMARRO must work as soon as Engine audio is ready, including before the
first GPS fix. This supersedes the earlier fresh-standstill gate for manual revs.
Movement still cancels manual revs. Automatic idle gestures require an actual
exact-zero watch observation; a bounded 12-second stationary watch hold bridges
the approximately 10-second stationary cadence observed in the owner's report.
Hidden state, missing/invalid live speed and renewed movement cancel that hold.
Live watch events use the shared receiver's monotonic time; one-shot renewals
retain acquisition/replay checks. Do not claim the old report proves a specific
provider-clock defect: it did not record acquisition timestamps or Engine reasons.
Stats for Nerds is Visual 09 in both launch and running catalogues, separate from
Atlas; remove their shared Map/Stats tabs. Retain the approved remix, with outward
curved heading bands. Intro means the initial chooser; Splash means its loading
transition. Both show the existing build identity, with Intro bottom right.

## Owner automatic diagnostics activation — 2026-09-07 evening

The owner explicitly requests implementing and publishing automatic diagnostic
mail now, enabled by default because the product is in active development.
This supersedes the future-only hold and proposed Standard default. Use Dev and
AUTO ON for fresh preferences, preserving an explicit saved OFF/Standard choice.
The current interval is 15 minutes of observed GPS driving (superseding ten
minutes); stops, simulated speed and hidden/unobserved time do not count.
Keep visible OFF in Intro and Session report, bounded coordinate-free packets to
the existing destination, one in-flight send, bounded retry, server validation,
and at most one pending packet on online/foreground recovery. Do not send
synthetic QA packets to the real mailbox. Do not promise timers while minimized.


## Owner night-work direction — 2026-09-07

The owner requests progressing all executable open work and welcomes deeper
Engine source/acoustic research. Current-state reconciliation distinguishes
shipped work, implementation, optional studies and physical acceptance gates.
For iPhone, the owner selects direction 1, Compact Cockpit: the existing Tesla
organization with thin retracting top/bottom bars, full touch targets and safe
areas. Named test devices are iPhone 17 Pro and iPhone 17 Pro Max; iOS versions
remain unspecified. Preserve audio, selection and renderer across rotation.
Use an accessible inert portrait notice only on phones, without treating desktop
portrait windows or the Tesla viewport as a phone.

The owner also selects report direction 1, Travel Report: compact cover, journey
summary, graphs and a technical appendix. Precise route inclusion remains an
explicit export option. Preserve immutable preview/download identity and
chosen-recipient verification; technical diagnostics remain coordinate-free.

## Owner altitude fallback — September 7 late evening

The owner explicitly requests a practical map/terrain height fallback when GPS
does not provide altitude. Keep reported GPS altitude visible independently of
the strict ascent/descent accuracy filter. Prefer GPS when present; label the
terrain estimate separately in Stats and PDF. Reuse the existing Open-Meteo /
Copernicus service with rounded request cells, bounded session cache, request
spacing and lifecycle recovery. Do not substitute terrain for a GPS reading or
add height/position values to automatic technical diagnostics.

## Owner Engine quality campaign — September 7 late evening

After the altitude release, Engine is the owner's primary development priority:
maximum audible quality and versatility, new engine types, coherent automatic
shifting, load response, turbo/turbine sounds and event timing. Study the local
analysis/reference folders and the fuller simulator sources before choosing
reuse, procedural synthesis or refactoring. The owner authorizes substantive
implementation and refactoring within this scope, followed by verified deployment.
A fresh task at Ultra reasoning is explicitly allowed, but work must run directly
in this saved Dropbox project on this Mac. Close commit/documentation/push/deploy
for prior changes first. Preserve the current reliable GPS/lifecycle and dry-audio
contracts, and do not treat a historical study's blind-review or AWAITING_APPROVAL
workflow as the active task. Current work is an informed implementation campaign.
Maintain source/asset provenance, existing licensing and the selected visual; a
new visual design still requires its separate three-direction selection.

## Owner road progression clarification — 2026-09-08

Engine must be restrained at urban 20–40 km/h and already feel powerful at
80 km/h, then progress through 100–130. Use coherent virtual wheel/gear/final
drive ratios and load-sensitive automatic shifts, with a 130 km/h acoustic
road ceiling. This supersedes the earlier redline-derived 35/65 km/h ladder.
Preserve genuine acceleration character, dry output and stationary TAMARRO;
the ceiling limits road response, not the explicit neutral rev gesture.
Study Ange Yaghi's public code and licensed material, distinguishing its
impulse responses, authored example ratios and manual controls from engine
recordings or an automatic gearbox. Do not present virtual state as Tesla data.


## Owner simulator clarification — 2026-09-08

The owner confirms Ange Yaghi's engine-sim and Real Engine Simulator
(https://realenginesimulator.com/) as central Engine research references. The
latter is the fuller simulator previously recalled. Explore its publicly
accessible engines, interface and explanations; no purchase or access bypass is
requested. Its public presets are free; Pro concerns the custom engine builder.
Study behavior and concepts without importing its proprietary runtime, audio,
parameters or presets. Continue the authorized original Engine implementation
inside the saved local project; preserve the selected Telemetry visual.

## Owner Tesla refinement — September 8, 2026

The owner physically tested build 0807: motion/progression/braking improved and
high-volume Mono/Rosso/Touring were good, with refinement requested. Research
real sports/rally gearing; favor second at 30 without restoring excessive city
RPM. Reduce perceived echo/phase smear and artificial Otto/Cinque/Turbine tones
while retaining full, deep body. Preserve dry output, GPS/lifecycle and TAMARRO.
A protected LAB comparison/annotation surface is proposed; present three
directions and retain the visual selection gate before constructing it. See
docs/ENGINE-LISTENING-REFINEMENT-2026-09-08.md.

## Owner listening LAB selection — 2026-09-08

The owner selects A/B listening: the same route, two calibrations, locally saved
preference and notes. Implement in the existing protected LAB, one take at a
time, explicit original levels, bounded local history and export. Preserve the
public refined default and existing dry/GPS/lifecycle contracts.

Keep A/B calibration labels and source identifiers synchronized whenever their
parameters change; an earlier calibration must not silently become a new sound.

## Active-session clock — owner correction, 2026-09-08

This supersedes the September 7 driving-only trigger: count fifteen minutes of
observable active session time, including stops, absent GPS, simulated input and
offline operation. Keep Dev/AUTO ON defaults and saved OFF/Standard. Hidden time
and execution gaps over five seconds remain unobserved; reload starts a fresh
session clock. At most one due report waits in memory for online/foreground
recovery; construct a fresh bounded coordinate-free snapshot when sending.
There is no persistent outbox or background execution promise.

Use `timeBasis: active-visible-session`, `intervalActiveMs`, `activeMs` and
`totalActiveMs` in new diagnostic delivery metadata. The server validates the new
clock explicitly and still accepts the older driving clock for already-open
clients. Preserve the fifteen-minute server floor and bounded transport retries.
Log `diagnostic-send.due` at the threshold, including offline state, then
`requested`, `accepted` or `failed` with automatic/manual attribution. Acceptance
means server mail-transport acceptance, not verified inbox delivery.

## Owner weak-network music feedback — 2026-09-08

Ship music control glyphs in the initial application payload, with visible
loading/retrying feedback instead of blank controls. Retain transport while
waiting for the catalogue. Recover artwork on network/foreground return and
republish native metadata. Verify native play/pause/previous/next through the
actual app handlers; do not equate API registration with Tesla button visibility.
Preserve the native invocation/outcome log and fixed recordings at 1x.


## Owner launch preparation — 2026-09-09

Make Engine loading prominent, centered and separate from TAMARRO controls.
Begin silent preparation in Intro: selected Lucky visual dependencies, selected
Jamendo recording/cover and at least Mono (follow explicit Engine selection).
Do not mount hidden renderers or start audio before a gesture. Retain bounded
verified encoded Engine assets across mode/profile changes within the page;
keep transient Jamendo media policy and explain browser-cache limits honestly.


## Owner open-session cache and updates — 2026-09-09

Retain verified static assets for at least seven days in build-specific browser
caches, without deleting a generation still used by an open client. Browser
eviction/quota/privacy restrictions remain explicit capability limits. Preserve
transient remote music and dynamic/private API boundaries. Check published build
identity every five minutes and on online/foreground return; renew a week-old
session only after a successful fresh check. Automatic reload requires thirty
observed quiet seconds in Intro, or muted audio plus fresh exact GPS standstill;
otherwise offer UPDATE. Interaction, movement, visibility loss and execution gaps
reset the quiet window. Keep saved preferences, never clear site storage globally,
and state that session counters restart. Never promise background execution.


## Owner road UI feedback — 2026-09-09 evening

Fix landscape iPhone palette taps and extend the installed webapp footer to the
bottom edge with safe-area-aware contents. Compact Discover names/row padding
and label actual providers. Reduce Atlas numbered discs while retaining touch
areas; prioritize smooth travel/rotation, north lock and zoom/reset controls.
Prepare Meguru radar integration; its new visual still requires A/B/C selection.
Do not claim desktop frame timing proves sustained Tesla 60 FPS.

## Owner Air Atlas refinement — 2026-09-10

Only selected aircraft have one contrasting ring, with ground distance below it. Shape availability must not depend on ground track. Retain exact model artwork where available and use clearly identified category silhouettes otherwise, with no neutral dots for known rotorcraft or civil aircraft. Buffer measured positions by five seconds for continuous interpolation; never claim an unobserved path or move stale targets indefinitely. Filter map transport to major roads; preserve lakes and airport/runway context while reducing minor water detail. True airways need a verified aeronautical source, not guessed routes. A separate nose-mounted oblique terrain view with elevation exaggeration 1.25 is requested; A Nose Camera / B Flight Instruments / C Dual View were presented and selection remains pending.
