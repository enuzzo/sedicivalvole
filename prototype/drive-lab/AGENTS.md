# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Durable product direction

- Direction 1 (luminous-axis tunnel) is the selected visual source of truth.
- The product has two equal, always-selectable primary modes: `Engine` and `Flux`.
- The current Drive Lab implementation is the `Flux` mode: adaptive music with abstract WebGL fields, gradients, depth, and optional abstract road/tunnel motion.
- `Engine` is a separate engine-emulation mode with selectable engine sound models and an instrument-inspired generative visual system. Do not implement its final visual direction before presenting exactly three Engine-specific directions.
- Mode switching shares the normalized speed source, diagnostics, audio-unlock lifecycle, master Stop/Mute, safety limits, and accessibility behavior. Never imply access to real RPM, throttle, gear, or CAN data without evidence.
- Keep the scene abstract, minimal and atmospheric; no scenery, characters or illustrative decoration.
- The initial flow is one deliberate `TEST & START` gesture, then a continuous fade into Drive Lab.
- Controls are touch-first, large, translucent at rest and fully visible on interaction.
- GPS and demo feed the same normalized speed signal; never display, persist or transmit coordinates.
- Speed raises energy through a smoothed saturating curve. Past the tempo knee, deepen arrangement instead of creating a frantic march.
- The visual must move as a rich field with WebGL2, plus reduced-motion and lightweight fallbacks.
- All interface copy, source code, comments, documentation, and logs must be in English. Italian is used only in direct conversation with the user.
- During this experimental development phase, verified builds are deployed to the canonical root at `https://sedicivalvole.app/` after user approval; diagnostics remain part of the main experience.
- Keep a continuous, restrained energy wave beneath the mix. Its frequency and gain rise smoothly with speed, while tempo and rhythmic density also grow toward bounded musical ceilings.
- Make frequent verified commits and push when a repository remote exists. Never leave the real Dropbox project directory for implementation work.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
