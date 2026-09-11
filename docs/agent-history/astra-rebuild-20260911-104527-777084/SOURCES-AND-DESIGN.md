# Sources, structure and consultation simulations

This is migration evidence, not ordinary-task instructions. Prepared September 11, 2026. The scope is local agent documentation only; no application bug/feature, build, suite, server, hardware, commit, push, deploy, index change or checkout operation is part of this work.

## Sources actually read

The supplied `prompting in astra.txt`, titled **Rethinking skills and prompts for GPT-6 Astra**, was read in full. It is user-supplied guidance, not an independently authenticated official publication. Both supplied images were examined: narrow skill applicability and conditional AGENTS document routing. Their examples informed the design; their unrelated PostgreSQL/database instructions were not adopted as project commands. The pasted request, separately identified by the owner, supplied the task authorization and restrictions.

All four requested official pages were accessible and the relevant page text was read, not just search snippets:

| Source | What it establishes | Application here |
| --- | --- | --- |
| [GPT-6 Astra model guidance](https://developers.openai.com/api/docs/guides/latest-model) — Initiative and follow-through, Instruction following, Subagent delegation, Testing and verification | Astra may seek clarification earlier, follow file instructions sensitively, delegate less, and verify too broadly for a small task. Scope and completion should be explicit; testing and delegation should fit the workflow. | Root defines completion and existing authority, targeted checks, specific decision boundaries and no mandatory delegation. No API setting is configured through prose. |
| [Codex AGENTS discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md) — How Codex discovers guidance | On startup, global override precedes global AGENTS; project discovery walks root to CWD, selecting override, AGENTS or configured fallback at each level. Deeper instructions override earlier ones. The documented default combined project-document limit is 32 KiB. | Root explicitly tells root-started tasks to read Drive Lab's local file when entering that subtree. Neither nested discovery from root nor automatic document-link loading is assumed. The effective global configuration was not modified or inferred from defaults. |
| [Build skills](https://learn.chatgpt.com/docs/build-skills) — Progressive disclosure, invocation, local discovery | Names/descriptions support selection; body loads on use and references on demand. Explicit/implicit invocation depends on a precise description. Repo skills are discovered in `.agents/skills` from CWD toward repository root. Initial metadata has a separate budget. | No new skill: existing procedures already have focused script/document entry points. Adding wrappers for every domain would add discovery metadata without a distinct reusable capability. |
| [Harness engineering](https://openai.com/index/harness-engineering/) — Repository knowledge as system of record, agent legibility | A short instruction entry can route to structured repository knowledge; inaccessible knowledge is not useful context. | Contracts have explicit task triggers and named active destinations. The migration map proves provenance/disposition but is not required for routine work. No observability, CI or document-gardening infrastructure was copied. |

These are three different kinds of claims: Astra behavioral guidance, Codex discovery mechanics, and local Sedicivalvole design choices. No claim is made that prose enables API features, changes the running model or measures quota savings.

## Repository instruction inventory

The three restored originals were read completely from disk and match baseline `2c73cc5b1a0dfe9aa8e14205050d7fc060f59427` byte for byte. Git confirms that baseline is the direct parent of first experiment `06625488db719a0d9bf57b296f1466ab86adfe80`, with the supplied September 10 14:08:44 +02:00 timestamp. HEAD is the later `9e3abe06687482e4163a8552f57973c7414a8be4`; instruction baseline does not imply product rollback.

| Surface | Observed state and treatment |
| --- | --- |
| Root AGENTS.md | Project-wide agreements, safety/authority, precise task routing; rewritten here. |
| prototype/drive-lab/AGENTS.md | Only local AGENTS; subtree/package/native/preview ownership retained and shortened. Root routes explicit reading when started above it. |
| Overrides and repository skills | No other active repository AGENTS/override/SKILL found in the inspected source/document/config tree. No repo `.agents/skills` or `.codex/skills` present. Dependencies, private references and build outputs are outside this instruction inventory. |
| Global AGENTS | Existing `~/.codex/AGENTS.md` has the owner's conversational preferences; no global override exists. Read-only, unchanged, not duplicated into every local contract. |
| Global skill catalog | OpenAI Docs and Skill Creator were read for this task. Old local `get-context` name is unavailable in the current catalog; its source-clarification intent now routes to the installed Product Design entry when relevant. No skill/plugin/configuration changes or bypass. No skill forced a permission stop. |
| Sites capability | Drive Lab has `.openai/hosting.json` and package scripts. Preserved and routed for an actual Sites build/handoff; this agent-document migration builds no website. |
| MANUAL-RECOVERY-PROMPT.md | Old August 29 third-session incident; replaced with a historical compatibility pointer after exact archival. Not executed. |
| Engine specialist instructions | `docs/ENGINE-SOURCE-OFFICE-HANDOFF-2026-09-09.md` and `docs/ENGINE-SOURCE-OFFICE-START-2026-09-09.txt` are unchanged. The handoff's owner decision/source map was read to preserve current retained voices and research restrictions; full specialist reading is routed only for an actual source-bank research task. |
| Other support/handoffs | SESSION-HANDOFF, CURRENT-STATE, PIANO, owner-decision documents, relevant specifications, source/licensing documents and script/package boundaries were consulted selectively as evidence. Their accumulated historical statements are not promoted wholesale into active instructions. SESSION_HANDOFF is already an obsolete compatibility pointer. |
| Earlier archives | `pre-gpt6-astra`, `pre-context-corrections-20260911-100025-955484` and `selective-rollback-20260911-101242-446160` remain intact. The rollback README and all eight corrected context copies were compared; they were not restored as a template. |

Initial differences from HEAD are recorded verbatim in `initial-state.json`: the three restored instruction files, an already-modified CHANGELOG, eight already-deleted experimental context cards, and two pre-existing untracked archive directories. No unexpected difference from the owner's reported restored instruction state was found. CHANGELOG's existing modification was additionally recorded and preserved.

## Structure choice

Two AGENTS entrypoints plus **ten** on-demand documents fit actual responsibilities. Interface retains selected launch/running/phone geometry. Music and Engine have distinct audio ownership. Motion/runtime owns shared speed, lifecycle and caches; Maps covers geographic requests and passenger surfaces; diagnostics/reports share capture/delivery boundaries; Visuals owns source-specific renderer contracts. Provenance and Delivery are separate because source admission is not the same task as publication. Recovery is conditional on interrupted/conflicted work, preventing the old emergency itinerary from applying to ordinary edits.

No additional nested AGENTS is needed: the behavioral contracts cross `App.jsx`, models, renderers, services, tests and deployment scripts. A directory file would not reliably capture those consumers from root startup. The existing Drive Lab AGENTS still usefully owns package CWD, src, native toolchain and Sites output boundaries. No new skill is justified: deployment/native/research procedures already have executable scripts or specialist documents with precise routing. This decision follows repository responsibilities, not a target number of cards.

Each contract has one primary thematic owner. Short cross-links retain shared dependencies: Music/Engine/Visuals route to shared motion; Maps/PDF route to geographic privacy and altitude; Interface routes to transport semantics; source integrations route to provenance. Links have conditions and exact anchors where a long chronological document would otherwise be ambiguous. The two AGENTS mutually refer only when not already loaded, not as a repeated reading loop.

## Explicit conflict resolutions

The complete source-by-source decisions are in [MIGRATION-MAP.md](MIGRATION-MAP.md). Material resolutions include:

- Night Glass Ambient → Lounge: explicit owner-directed refinement in NIGHT-GLASS, not code behavior or date alone. Other Ambient presets remain valid.
- OPEN/BLOOM → retired: MUSIC-CRAFT 6.16 records actual owner cabin feedback and removal. Braking UNDERWATER remains; the eight manual effects are a separate contract. The earlier experiment still carried the stale trio.
- Manual TAMARRO: ROAD-FEEDBACK / Implemented corrections removes the GPS requirement for ready/unmuted/foreground manual revs, including absent/stale GPS. Automatic idle still needs observed exact zero and the bounded hold. Visibility/disable-under-remaining-conditions and RPM feedback remain; the old blanket stale-manual gate is not reintroduced.
- Engine: declared-MIT integration supersedes historical blind-review holds; Telemetry selection is complete. Road ratios supersede 35/65. Later retained-voice and FMOD/recording-bank owner decisions supersede older six-voice/research candidates without erasing accepted Mono hybrid behavior.
- Automatic mail: future/ten-minute/manual-only and later driving-only rules are superseded by Dev/AUTO ON and fifteen minutes of observed active session. Saved OFF/Standard, privacy and server/transport bounds remain.
- ATLAS/Stats: selected remix retires chart sidebar/Canvas and shared tabs; metric parity, full-field chrome behavior and mandatory attribution survive. Atlas's own article return does not authorize Discover → Atlas navigation.
- Discover: retain independently specified header/title/rail/tool geometry; use owner-documented September 9 72/15/13 result geometry. Do not infer that compact-row feedback revokes every other dimension.
- Intro: explicit compact-owner amendments replace old brand CTA/grid/64px media, then saved-source exception, then artist/zero-padding. Keep running artist credits, 36px circular presets, two stable suggestions, palette divider/cycle, final labels and later actual preview/shuffle decisions.
- Geographic use: selected map/POI features, explicit optional route export and explicit Air Atlas forwarding create narrow exceptions to the original universal coordinate ban. Technical diagnostic geography remains prohibited.
- Visual gates: named selections resolve the old pending Engine, Launch, Atlas/Stats, report, Air Atlas, flight A+C and lens A questions. WAKE/PRIMORDIAL remain retired and Murmuration parked. No blanket future design delegation is inferred.
- Standing deployment replaces fresh deploy permission, while old night-work/new-session/full-audit/no-delegation mandates remain scoped to their incidents. Single-writer means the shared checkout; independently authorized separate work is not mislabeled as that same conflict.

The **location-sidebar handle** is intentionally unresolved: original root location-sidebar versus explicitly retired chart handle/320px panel/340px instrument. The active Maps section names both, the remaining tab/target geometry and the exact task requiring clarification. No new sidebar is invented; no unrelated map task is blocked. True airways still require a verified current licensed source, Engine recording provenance remains a disclosed follow-up, and physical acceptance remains distinct. Those are existing scoped open boundaries, not blockers to this migration.

## Consultation simulations

These are document-routing simulations, **not executed application tests**.

| Scenario | Entry and section route | Why; stopping and escalation boundary |
| --- | --- | --- |
| A. Fix an isolated running Now Playing credit overlap | Root → explicit Drive Lab AGENTS → Interface / Shared geometry and palette + Running media and effects. Inspect affected layout and actual screenshot. | Preserves 64px band, targets/type, common-center alignment, content-sized credit columns and footer ownership. No need to load Engine, Maps, whole architecture, source research or MUSIC-CRAFT. If transport ownership is affected, add Soundtrack only then. Verify affected rendering; delivery references enter only when closing the authorized product checkpoint. |
| B. Automatic Engine idle blips disappear after stationary GPS cadence | Root → Drive Lab → Engine / TAMARRO and idle + Motion/runtime / GPS and simulator, adding Preparation/recovery for a lifecycle cause. | Distinguishes manual no-GPS from exact-zero automatic hold, 12 seconds/10-second evidence, clock type, 600/1800 RPM, 70%, mute/movement and feedback. Inspect shared receiver and Engine consumers; use targeted freshness/gesture tests. Diagnostics capture is read only if report fields are changed. Do not open sample-bank research or presume a provider-clock defect. Physical listening remains separate from simulated callbacks. |
| C. Add an explicitly requested new travel preset using an existing visual and music source, with preparation across mode changes | Root → Drive Lab → Music / Curated experiences + Soundtrack and selection → Interface / Intro and branding → Motion/runtime / Preparation and recovery + Energy and mode boundary. Add the selected visual's Visuals or Maps section where its renderer/lifecycle is actually affected. | Shared preset registry, exact selected queue/no old queue, silent preload, stable recommendations, user gesture and shared audio/mode state must agree. New data destination/source would additionally require Maps privacy/Provenance; a genuinely new visual direction needs three choices before construction. Existing selections do not require reapproval. Integration checks cover the changed seams and final release gates, not every unrelated subsystem. |

The simulations establish a reviewable consultation path; they do not measure real model activation, latency, quota, audio behavior or product equivalence. A fresh Codex run may construct a new startup chain; this session retains its originally injected instructions. The next real bug task is intentionally not started here.
