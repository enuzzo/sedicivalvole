# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Durable product direction

- The approved Flux direction is **Modular Aperture**: a sparse rectangular field that is flat and calm at rest, forms a centered tunnel with normalized energy, and releases coherently during deceleration.
- The tunnel terminus is a dark void, never a bright portal. At rest, header and footer must retreat completely off-canvas, secondary readouts disappear, and only speed plus its unit remain visible; the first wake interaction must not change a value.
- The Flux interface is Braun-influenced, Swiss, minimal, and slightly brutalist: flat black/off-white surfaces, strict monospace typography, square buttons, and sliders inside restrained rounded housings. Do not add circular buttons, knob controls, glassmorphism, or decorative chrome.
- `BODY COLOR` is a purposeful visual control with curated Pearl, Graphite, Red, Blue, and Silver themes. It changes the generative field and control accent without exposing low-level shader parameters.
- Preserve the approved Modular Aperture and Laminar Product Design images only in the ignored local reference library. Laminar is visibly close to the Infinite Lights mechanics study and must be independently reinterpreted before any implementation.
- `VERTIGO 02` is the selected second Flux environment. Its target is the Interstate 7 / deep-distortion motion grammar: a power-curve vertical fold, subtle time-varying lateral drift, multiple coherent waves, longitudinal travel, and the same continuous geometry unfolding during deceleration. Use the ignored source as an executable mechanics specification, but implement the production shader independently and keep its palette and geometry configurable.
- Keep the unselected Laminar Switchback and Rolling Register directions in the ignored local visual backlog; do not discard or present them as implemented environments.
- The product has two equal, always-selectable primary modes: `Engine` and `Flux`.
- The current Drive Lab implementation is the `Flux` mode: an authored adaptive arrangement with the procedural Modular Aperture WebGL field.
- `Engine` is a separate engine-emulation mode with selectable engine sound models and an instrument-inspired generative visual system. Do not implement its final visual direction before presenting exactly three Engine-specific directions.
- Mode switching shares the normalized speed source, diagnostics, audio-unlock lifecycle, master Stop/Mute, safety limits, and accessibility behavior. Never imply access to real RPM, throttle, gear, or CAN data without evidence.
- Keep the scene abstract, minimal and atmospheric; no scenery, characters or illustrative decoration.
- The initial flow is one deliberate `TEST & START` gesture, then a continuous fade into Drive Lab.
- Controls are touch-first, large, flat, and fully legible; the GL field provides the visual contrast.
- GPS and demo feed the same normalized speed signal; never display, persist or transmit coordinates.
- Extended diagnostics may aggregate frame pacing, connection changes, GPS accuracy/cadence, audio/runtime state, memory, storage, navigation/resource timing, and bounded events. Keep the fixed recipient in ignored local configuration, transmit only after the explicit SEND DIAGNOSTIC gesture, and never collect coordinates or enable automatic remote telemetry.
- Speed raises energy through a smoothed saturating curve. Past the tempo knee, deepen arrangement instead of creating a frantic march.
- The visual must move as a rich field with WebGL2, plus reduced-motion and lightweight fallbacks.
- All interface copy, source code, comments, documentation, and logs must be in English. Italian is used only in direct conversation with the user.
- During this experimental development phase, verified builds are deployed to the canonical root at `https://sedicivalvole.app/` after user approval; diagnostics remain part of the main experience.
- Keep continuous speed/energy parameters separate from bar-quantized structural events. Use smoothing, hysteresis, dwell, crossfades, a tempo knee, and musically controlled deceleration.
- Make frequent verified commits and push when a repository remote exists. Never leave the real Dropbox project directory for implementation work.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
