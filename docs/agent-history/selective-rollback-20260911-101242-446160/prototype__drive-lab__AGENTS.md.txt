# Drive Lab instructions

The root [AGENTS.md](../../AGENTS.md) governs this application. Product constraints are routed there by task; do not load every topic.

- App UI lives in `src/`. Preserve pinned third-party sources; renderer/bridge work needs the root Visuals route, audio work the Engine or Music route.
- For UI work, use the root UI route and the affected subsystem. Run/open the local preview when rendered validation is needed; preserve selected-reference fidelity.
- For a Sites handoff only, use the root Release route's Sites section. Keep the existing hosting/worker packaging contract intact.
- Record durable subsystem decisions in `docs/agent-context/` at the repository root, not as another chronological history in this file.
