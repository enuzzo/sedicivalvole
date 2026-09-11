# Drive Lab instructions

Applies to `prototype/drive-lab/`. Read the [root working agreement](../../AGENTS.md) if the host did not load it. The root's task table routes cross-directory product contracts; read only affected sections. This file adds subtree ownership, not a second set of product decisions.

## Local work

- Build app UI in `src/`. `App.jsx` owns shared session/audio/selection orchestration; use the existing focused model/renderer/service boundaries rather than inventing another lifecycle owner. `src/engine/`, `src/soundtrack/`, `src/score/`, `src/environments/`, `src/session/` and `src/reports/` identify affected owners, not mandatory reading lists.
- For a requested runnable preview, run the local server and open the browser available in this environment yourself. A documentation or read-only task does not require a server.
- Run package commands from this directory. `package.json` lists focused scripts; use behavior-relevant tests during implementation and the [delivery gates](../../docs/agent-guide/delivery.md#verification-proportional-to-the-change) for publication. Do not repeat passing suites without a new reason.
- Native packages copied through Dropbox can mismatch the host. Use `npm run native:check` when diagnosing that issue, and the existing `npm run test:native` / `npm run build:native` wrappers for native execution as needed. Establish the lockfile/host before preparing packages; [environment portability](../../docs/agent-guide/motion-runtime.md#environment-portability) preserves the cross-machine caution.
- Preserve `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs` and `tests/sites-worker.test.mjs`. A requested Sites handoff follows [Sites package](../../docs/agent-guide/delivery.md#sites-package), including its build/test outputs; canonical deployment has a separate official gate.

## Read across boundaries

Use [Interface](../../docs/agent-guide/interface.md) for affected launch/chrome/media/phone geometry; [Music](../../docs/agent-guide/music.md) or [Engine](../../docs/agent-guide/engine.md) for the corresponding audio owner; [Motion/runtime](../../docs/agent-guide/motion-runtime.md) when changing shared speed, freshness, buffering, lifecycle or caches. That shared document owns the fixed visual/music energy ceiling; never create an independent music threshold.

Map/aircraft/altitude and Stats changes read the matching [Maps](../../docs/agent-guide/maps.md) section. Diagnostic/PDF changes read [Diagnostics and reports](../../docs/agent-guide/diagnostics-reports.md). Renderer integration reads the exact [Visuals](../../docs/agent-guide/visuals.md) section and its pinned-source boundary. Do not load all references merely because their code shares this subtree.
