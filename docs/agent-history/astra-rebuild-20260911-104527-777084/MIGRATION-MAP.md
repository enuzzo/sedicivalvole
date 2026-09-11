# Agent instruction migration map — September 11, 2026

Status: **completed local migration**. The initial map was saved before entrypoint replacement and was reconciled again against original wording after the semantic review. Final verification is recorded in VALIDATION.md. This is an audit artifact, not a mandatory future-task reading or maintenance burden.

Every substantive source block has one explicit disposition below. Complex blocks name all affected destinations; duplicates retain their original source IDs. Original wording is included for semantic comparison, not as active instructions. `source-units.json` holds exact line spans; byte copies and SHA-256 provenance are in this archive. The original two AGENTS and recovery prompt total 923 lines.

Disposition vocabulary: retained, moved with active routing, merged without loss, updated with explicit supersession, historical with reason, unresolved in the relevant active context. A later date or code behavior alone is not treated as revocation.

## Source-by-source decisions

### R001 — AGENTS.md:3-3

Original section: **Project Instructions for Agents** ([byte-identical original](AGENTS.md.txt), lines 3–3). Outcome: **retained**.

Active destination(s): [AGENTS.md#working-agreement](../../../AGENTS.md#working-agreement).

Consult when: All repository tasks.

Rule coverage / supersession: Project scope and all English code/comments/docs/logs/product/commit copy; Italian direct conversation.

<details><summary>Original wording for comparison</summary>

> These rules apply to every change in the `sedicivalvole` project.

</details>

### R002 — AGENTS.md:7-7

Original section: **Language** ([byte-identical original](AGENTS.md.txt), lines 7–7). Outcome: **retained**.

Active destination(s): [AGENTS.md#working-agreement](../../../AGENTS.md#working-agreement).

Consult when: All repository tasks.

Rule coverage / supersession: Project scope and all English code/comments/docs/logs/product/commit copy; Italian direct conversation.

<details><summary>Original wording for comparison</summary>

> - Write all source code, code comments, documentation, commit-ready text, logs, and product interface copy in English.

</details>

### R003 — AGENTS.md:8-8

Original section: **Language** ([byte-identical original](AGENTS.md.txt), lines 8–8). Outcome: **retained**.

Active destination(s): [AGENTS.md#working-agreement](../../../AGENTS.md#working-agreement).

Consult when: All repository tasks.

Rule coverage / supersession: Project scope and all English code/comments/docs/logs/product/commit copy; Italian direct conversation.

<details><summary>Original wording for comparison</summary>

> - Italian is reserved for direct conversation between the user and the assistant.

</details>

### R004 — AGENTS.md:12-12

Original section: **Versioning and traceability** ([byte-identical original](AGENTS.md.txt), lines 12–12). Outcome: **moved**.

Active destination(s): [docs/agent-guide/delivery.md#identity-and-records](../../../docs/agent-guide/delivery.md#identity-and-records).

Consult when: Build identity, changelog or release work.

Rule coverage / supersession: VERSION-only SemVer, generated stamp, progressive append-only entries, local date/time/hash and release stamp, Unreleased/versioned section conditions retained.

<details><summary>Original wording for comparison</summary>

> - `VERSION` is the only SemVer source of truth. Do not duplicate the number manually; builds must read or receive it through a verified pipeline.

</details>

### R005 — AGENTS.md:13-13

Original section: **Versioning and traceability** ([byte-identical original](AGENTS.md.txt), lines 13–13). Outcome: **moved**.

Active destination(s): [docs/agent-guide/delivery.md#identity-and-records](../../../docs/agent-guide/delivery.md#identity-and-records).

Consult when: Build identity, changelog or release work.

Rule coverage / supersession: VERSION-only SemVer, generated stamp, progressive append-only entries, local date/time/hash and release stamp, Unreleased/versioned section conditions retained.

<details><summary>Original wording for comparison</summary>

> - Every build carries a build stamp in the form `20260826-1543` (`YYYYMMDD-HHMM`), generated at build time. Always write the build stamp when publishing or deploying, and record it in the deployment evidence. The stamp identifies the build; it does not replace `VERSION`.

</details>

### R006 — AGENTS.md:14-14

Original section: **Versioning and traceability** ([byte-identical original](AGENTS.md.txt), lines 14–14). Outcome: **moved**.

Active destination(s): [docs/agent-guide/delivery.md#identity-and-records](../../../docs/agent-guide/delivery.md#identity-and-records).

Consult when: Build identity, changelog or release work.

Rule coverage / supersession: VERSION-only SemVer, generated stamp, progressive append-only entries, local date/time/hash and release stamp, Unreleased/versioned section conditions retained.

<details><summary>Original wording for comparison</summary>

> - Update `CHANGELOG.md` for every user-visible change or relevant technical change. The changelog must be strictly progressive and append-only: never rewrite, alter, or remove past entries under any circumstances. Every changelog entry must explicitly record the date, local time (e.g. `2026-08-27 15:10`), the corresponding short commit hash (e.g. `[c85b70c]`), and the build stamp when deploying (e.g. `build 20260827-1510`).

</details>

### R007 — AGENTS.md:15-15

Original section: **Versioning and traceability** ([byte-identical original](AGENTS.md.txt), lines 15–15). Outcome: **moved**.

Active destination(s): [docs/agent-guide/delivery.md#identity-and-records](../../../docs/agent-guide/delivery.md#identity-and-records).

Consult when: Build identity, changelog or release work.

Rule coverage / supersession: VERSION-only SemVer, generated stamp, progressive append-only entries, local date/time/hash and release stamp, Unreleased/versioned section conditions retained.

<details><summary>Original wording for comparison</summary>

> - Keep unreleased changes under `Unreleased` in chronological progressive order; create a versioned ISO-dated section only when releasing, and synchronize `VERSION`.

</details>

### R008 — AGENTS.md:16-16

Original section: **Versioning and traceability** ([byte-identical original](AGENTS.md.txt), lines 16–16). Outcome: **merged**.

Active destination(s): [docs/agent-guide/delivery.md#identity-and-records](../../../docs/agent-guide/delivery.md#identity-and-records), [AGENTS.md#working-agreement](../../../AGENTS.md#working-agreement).

Consult when: A task changes documented facts or contracts.

Rule coverage / supersession: Maintain README, feature status and architecture only when facts change; update the relevant agent contract rather than appending every decision to root.

<details><summary>Original wording for comparison</summary>

> - Update the README, feature status, and architecture when facts change.

</details>

### R009 — AGENTS.md:17-17

Original section: **Versioning and traceability** ([byte-identical original](AGENTS.md.txt), lines 17–17). Outcome: **merged**.

Active destination(s): [docs/agent-guide/interface.md#design-decisions](../../../docs/agent-guide/interface.md#design-decisions), [docs/agent-guide/delivery.md#verification-proportional-to-the-change](../../../docs/agent-guide/delivery.md#verification-proportional-to-the-change).

Consult when: Visual evidence or product screenshot changes.

Rule coverage / supersession: Current real captures, agreed Tesla viewport, obsolete current captures removed; reference and historical evidence are not current product.

<details><summary>Original wording for comparison</summary>

> - Use only real, verified screenshots from the current build at agreed Tesla viewports. Remove obsolete captures.

</details>

### R010 — AGENTS.md:18-18

Original section: **Versioning and traceability** ([byte-identical original](AGENTS.md.txt), lines 18–18). Outcome: **moved**.

Active destination(s): [docs/agent-guide/delivery.md#identity-and-records](../../../docs/agent-guide/delivery.md#identity-and-records).

Consult when: Active development checkpoint.

Rule coverage / supersession: Small verified commits/push to existing remote; no invented destination; current task restrictions still control.

<details><summary>Original wording for comparison</summary>

> - Create small, verified commits frequently during active development. Push each verified checkpoint when a configured remote exists; never invent or configure a remote without the user's destination.

</details>

### R011 — AGENTS.md:19-19

Original section: **Versioning and traceability** ([byte-identical original](AGENTS.md.txt), lines 19–19). Outcome: **merged**.

Active destination(s): [docs/agent-guide/delivery.md#canonical-publication](../../../docs/agent-guide/delivery.md#canonical-publication), [AGENTS.md#non-negotiable-boundaries](../../../AGENTS.md#non-negotiable-boundaries).

Consult when: Approved product delivery.

Rule coverage / supersession: Standing September 5 authority removes repeated deployment confirmation, preserves experimental maturity, checks, history, recovery and canonical verification.

<details><summary>Original wording for comparison</summary>

> - After each user-approved product change, deploy the verified build to the canonical live root and validate the product-visible result.

</details>

### R012 — AGENTS.md:20-20

Original section: **Versioning and traceability** ([byte-identical original](AGENTS.md.txt), lines 20–20). Outcome: **moved**.

Active destination(s): [docs/agent-guide/recovery.md#current-continuation](../../../docs/agent-guide/recovery.md#current-continuation).

Consult when: Unreliable context or desktop/mobile requirement recovery.

Rule coverage / supersession: Inventory every pending requirement/local edit; concrete handoff in saved Dropbox; inspect available queued history before declaring missing instructions, label truncated content.

<details><summary>Original wording for comparison</summary>

> - If the active context becomes unreliable or overloaded, first inventory every pending requirement and local change, write a concrete task list, and hand the work to a fresh session at an appropriate reasoning effort without leaving the Dropbox project directory.

</details>

### R013 — AGENTS.md:21-21

Original section: **Versioning and traceability** ([byte-identical original](AGENTS.md.txt), lines 21–21). Outcome: **moved**.

Active destination(s): [docs/agent-guide/recovery.md#current-continuation](../../../docs/agent-guide/recovery.md#current-continuation).

Consult when: Unreliable context or desktop/mobile requirement recovery.

Rule coverage / supersession: Inventory every pending requirement/local edit; concrete handoff in saved Dropbox; inspect available queued history before declaring missing instructions, label truncated content.

<details><summary>Original wording for comparison</summary>

> - When work continues across desktop and mobile clients, do not assume locally queued desktop messages reached the synchronized thread. Before declaring requirements missing, inspect available local queue/history evidence, record recoverable requirements, and clearly mark any truncated content instead of reconstructing it.

</details>

### R014 — AGENTS.md:25-25

Original section: **Secrets and local material** ([byte-identical original](AGENTS.md.txt), lines 25–25). Outcome: **merged**.

Active destination(s): [AGENTS.md#non-negotiable-boundaries](../../../AGENTS.md#non-negotiable-boundaries).

Consult when: All tasks; exact internal-loading exception only for official deployment.

Rule coverage / supersession: No .env reading/printing/diff/log/version or credential exposure; no _references version/copy; harmless .env.example only. R043 is explicitly routed exception.

<details><summary>Original wording for comparison</summary>

> - Never read, print, diff, log, or version `.env` or local variants.

</details>

### R015 — AGENTS.md:26-26

Original section: **Secrets and local material** ([byte-identical original](AGENTS.md.txt), lines 26–26). Outcome: **merged**.

Active destination(s): [AGENTS.md#non-negotiable-boundaries](../../../AGENTS.md#non-negotiable-boundaries).

Consult when: All tasks; exact internal-loading exception only for official deployment.

Rule coverage / supersession: No .env reading/printing/diff/log/version or credential exposure; no _references version/copy; harmless .env.example only. R043 is explicitly routed exception.

<details><summary>Original wording for comparison</summary>

> - Never place credentials in command lines, logs, screenshots, or documentation.

</details>

### R016 — AGENTS.md:27-27

Original section: **Secrets and local material** ([byte-identical original](AGENTS.md.txt), lines 27–27). Outcome: **merged**.

Active destination(s): [AGENTS.md#non-negotiable-boundaries](../../../AGENTS.md#non-negotiable-boundaries).

Consult when: All tasks; exact internal-loading exception only for official deployment.

Rule coverage / supersession: No .env reading/printing/diff/log/version or credential exposure; no _references version/copy; harmless .env.example only. R043 is explicitly routed exception.

<details><summary>Original wording for comparison</summary>

> - Never version `_references/` or copy its external material into the repository.

</details>

### R017 — AGENTS.md:28-28

Original section: **Secrets and local material** ([byte-identical original](AGENTS.md.txt), lines 28–28). Outcome: **merged**.

Active destination(s): [AGENTS.md#non-negotiable-boundaries](../../../AGENTS.md#non-negotiable-boundaries).

Consult when: All tasks; exact internal-loading exception only for official deployment.

Rule coverage / supersession: No .env reading/printing/diff/log/version or credential exposure; no _references version/copy; harmless .env.example only. R043 is explicitly routed exception.

<details><summary>Original wording for comparison</summary>

> - `.env.example` may contain only keys and harmless placeholders.

</details>

### R018 — AGENTS.md:32-32

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 32–32). Outcome: **retained**.

Active destination(s): [AGENTS.md#working-agreement](../../../AGENTS.md#working-agreement).

Consult when: Status claims in every task.

Rule coverage / supersession: Separate implemented, roadmap, assumed, verified and historical; no archived mock as current product.

<details><summary>Original wording for comparison</summary>

> - Separate implemented features, roadmap items, assumptions, and verified facts.

</details>

### R019 — AGENTS.md:33-33

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 33–33). Outcome: **retained**.

Active destination(s): [AGENTS.md#working-agreement](../../../AGENTS.md#working-agreement).

Consult when: Status claims in every task.

Rule coverage / supersession: Separate implemented, roadmap, assumed, verified and historical; no archived mock as current product.

<details><summary>Original wording for comparison</summary>

> - Never present archived mocks or prototypes as the current product.

</details>

### R020 — AGENTS.md:34-34

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 34–34). Outcome: **moved**.

Active destination(s): [docs/agent-guide/interface.md#design-decisions](../../../docs/agent-guide/interface.md#design-decisions).

Consult when: New visual direction.

Rule coverage / supersession: Exactly three before construction and owner selection, with only explicitly scoped selected/delegated exceptions.

<details><summary>Original wording for comparison</summary>

> - Before a visual build, show exactly three directions and wait for a selection.

</details>

### R021 — AGENTS.md:35-35

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 35–35). Outcome: **merged**.

Active destination(s): [docs/agent-guide/delivery.md#verification-proportional-to-the-change](../../../docs/agent-guide/delivery.md#verification-proportional-to-the-change).

Consult when: Experience verification.

Rule coverage / supersession: Agreed Tesla viewports plus target vehicle; browser tests and physical acceptance remain distinct.

<details><summary>Original wording for comparison</summary>

> - Verify the experience at agreed Tesla viewports and on the target vehicle.

</details>

### R022 — AGENTS.md:36-36

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 36–36). Outcome: **merged**.

Active destination(s): [docs/agent-guide/delivery.md#canonical-publication](../../../docs/agent-guide/delivery.md#canonical-publication), [AGENTS.md#non-negotiable-boundaries](../../../AGENTS.md#non-negotiable-boundaries).

Consult when: Approved product delivery.

Rule coverage / supersession: Standing September 5 authority removes repeated deployment confirmation, preserves experimental maturity, checks, history, recovery and canonical verification.

<details><summary>Original wording for comparison</summary>

> - During active development, deploy each user-approved product change to the canonical root at `https://sedicivalvole.app/`; the product remains experimental even though the source repository is public.

</details>

### R023 — AGENTS.md:37-37

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 37–37). Outcome: **merged**.

Active destination(s): [docs/agent-guide/delivery.md#canonical-publication](../../../docs/agent-guide/delivery.md#canonical-publication).

Consult when: Publication or server assumption.

Rule coverage / supersession: Bare/canonical and assets/version/cache checks remain; upload is insufficient; no unverified Apache/Nginx assumption.

<details><summary>Original wording for comparison</summary>

> - An upload is not a successful deployment: verify the canonical URL, HTML, assets, version, and cache behavior after every publication.

</details>

### R024 — AGENTS.md:38-38

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 38–38). Outcome: **moved**.

Active destination(s): [docs/agent-guide/diagnostics-reports.md#capture-and-presentation](../../../docs/agent-guide/diagnostics-reports.md#capture-and-presentation).

Consult when: Diagnostics entry and main shell.

Rule coverage / supersession: Keep accessible REPORT in main product.

<details><summary>Original wording for comparison</summary>

> - Keep the technical diagnostics accessible from within the main product experience.

</details>

### R025 — AGENTS.md:39-39

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 39–39). Outcome: **updated**.

Active destination(s): [docs/agent-guide/motion-runtime.md#energy-and-mode-boundary](../../../docs/agent-guide/motion-runtime.md#energy-and-mode-boundary).

Consult when: Mode selection, shared ownership or cross-mode features.

Rule coverage / supersession: Engine/Flux remain equal and distinct; public Flux label becomes Music by P083 and LAUNCH-COCKPIT / Decision and scope; active identity/reachable switch preserved.

<details><summary>Original wording for comparison</summary>

> - Treat `Engine` and `Flux` as equal primary product modes. The active mode must remain clearly identifiable and the mode switch must remain reachable from either experience.

</details>

### R026 — AGENTS.md:40-40

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 40–40). Outcome: **updated**.

Active destination(s): [docs/agent-guide/motion-runtime.md#energy-and-mode-boundary](../../../docs/agent-guide/motion-runtime.md#energy-and-mode-boundary).

Consult when: Mode selection, shared ownership or cross-mode features.

Rule coverage / supersession: Engine/Flux remain equal and distinct; public Flux label becomes Music by P083 and LAUNCH-COCKPIT / Decision and scope; active identity/reachable switch preserved.

<details><summary>Original wording for comparison</summary>

> - `Flux` is the current adaptive music and generative-field work. `Engine` is a separate engine-sound experience with its own audio model and instrument-inspired visual language.

</details>

### R027 — AGENTS.md:41-41

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 41–41). Outcome: **updated**.

Active destination(s): [docs/agent-guide/visuals.md#aperture-and-rejected-studies](../../../docs/agent-guide/visuals.md#aperture-and-rejected-studies), [docs/agent-guide/interface.md#design-decisions](../../../docs/agent-guide/interface.md#design-decisions).

Consult when: Aperture or new Flux direction.

Rule coverage / supersession: Starburst/lens flare rejection and convergence/depth/speed/low-plane intent retained; P004 explicitly selects Modular Aperture, resolving initial replacement selection only.

<details><summary>Original wording for comparison</summary>

> - The current starburst/lens-flare Flux visual is rejected. Retain only central convergence, depth, speed response, and the low control plane; present exactly three revised minimal, Swiss-influenced directions before replacing it.

</details>

### R028 — AGENTS.md:42-42

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 42–42). Outcome: **merged**.

Active destination(s): [docs/agent-guide/visuals.md#vertigo-02](../../../docs/agent-guide/visuals.md#vertigo-02).

Consult when: Vertigo integration or bridge change.

Rule coverage / supersession: Exact commit and entire scene/dependencies/byte identity, hidden editorial shell and permitted original time/FOV/color channels; integrity gates not bypassable.

<details><summary>Original wording for comparison</summary>

> - `VERTIGO 02` embeds the byte-identical Codrops/Tympanus Infinite Lights Interstate 7 runtime from commit `e58d58520bc0dfde21f9e14e6a1b8c7f0a2a2a9e` as separately licensed third-party material. Do not alter, trim, or relicense its road, light sticks, car trails, bloom, camera, distortion, dependencies, or source files. Keep the iframe hidden until the external bridge removes the editorial shell; the bridge may drive the original time/FOV controls and map sedicivalvole themes onto existing runtime colour buffers and uniforms. Keep upstream-integrity tests and attribution green.

</details>

### R029 — AGENTS.md:43-43

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 43–43). Outcome: **merged**.

Active destination(s): [docs/agent-guide/visuals.md#gradient-08](../../../docs/agent-guide/visuals.md#gradient-08).

Consult when: Gradient family, palette/response, bundling or LAB work.

Rule coverage / supersession: Pinned 2.4.20 stack, one family/three exact variants, persistent cycle, separate lazy chunk, MIT/inventory/fallback and physical GPU gate retained.

<details><summary>Original wording for comparison</summary>

> - `@shadergradient/react@2.4.20` and its pinned Three/R3F peers power one public **GRADIENT 08** family with the owner-selected **Japanese Mist**, **Acid Orchard**, and **Chromatic Silk** variants, plus the standalone and protected LAB workbenches. Expose the family as one Visual catalogue entry and keep a persistent in-visual `VARIANT` control that cycles the three exact variants. Keep the public renderer lazy-loaded as one separate chunk, retain the MIT notice, keep an exact source/change inventory, preserve the project-owned Canvas2D fallback, and require target-Tesla GPU acceptance. Do not modify or relicense upstream source without a new explicit owner decision.

</details>

### R030 — AGENTS.md:44-44

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 44–44). Outcome: **moved**.

Active destination(s): [docs/agent-guide/music.md#authored-score](../../../docs/agent-guide/music.md#authored-score).

Consult when: Music diagnosis, research or quality fix.

Rule coverage / supersession: Same-session MUSIC-CRAFT reason/listener record; delete causeless constraint; meaningful tests for assertable consonance/levels/variety.

<details><summary>Original wording for comparison</summary>

> - Keep `docs/MUSIC-CRAFT.md` current. It is the project's accumulated musical knowledge: theory, production technique, and the specific defects this codebase has made and fixed. Whenever a musical fault is diagnosed, a technique is researched, or a way to improve the score is found, record it there in the same session, with the reason a listener noticed it. It advises on quality and must never become a rulebook that prevents good music; delete an entry that constrains without cause.

</details>

### R031 — AGENTS.md:45-45

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 45–45). Outcome: **moved**.

Active destination(s): [docs/agent-guide/music.md#authored-score](../../../docs/agent-guide/music.md#authored-score).

Consult when: Music diagnosis, research or quality fix.

Rule coverage / supersession: Same-session MUSIC-CRAFT reason/listener record; delete causeless constraint; meaningful tests for assertable consonance/levels/variety.

<details><summary>Original wording for comparison</summary>

> - Prefer a check over a memory. A musical rule that can be asserted — consonance against the voiced chord, an effect's level, the variety a form claims — belongs in a test, because the alternative is hearing the fault, describing it, and hunting it again.

</details>

### R032 — AGENTS.md:46-46

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 46–46). Outcome: **moved**.

Active destination(s): [docs/agent-guide/music.md#authored-score](../../../docs/agent-guide/music.md#authored-score).

Consult when: Score architecture or musical content.

Rule coverage / supersession: Authored arrangement/low-end/rhythm/harmony/timbre/space retained; no oscillator-ping/noise/linear-BPM substitute.

<details><summary>Original wording for comparison</summary>

> - Flux must feel like an authored adaptive score. Do not substitute exposed oscillator pings, a noise bed, or linear BPM escalation for arrangement, low end, rhythm, harmony, timbre, and spatial progression.

</details>

### R033 — AGENTS.md:47-47

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 47–47). Outcome: **merged**.

Active destination(s): [docs/agent-guide/music.md#junction](../../../docs/agent-guide/music.md#junction).

Consult when: JUNCTION playback, generation, harmony, mixing or memory.

Rule coverage / supersession: Preserves rest/no beat+bass; 13 km/h, 168 BPM; eight bars; compatible complete takes; exact spine; reset/self-contained clips; sample accurate; no repeat; voiced chord; six clips; no isolated stem.

<details><summary>Original wording for comparison</summary>

> - JUNCTION must not equate road energy with a permanently loud break. Keep rest free of beat and bassline, introduce a quiet native-tempo break near `13 km/h`, cap the authored tempo ladder at `168 BPM`, and grow intensity primarily through orchestration, dynamics, punctuation and effects. Randomness may mix only complete, tempo-, harmony- and rhythm-compatible authored takes at eight-bar boundaries; paired decks must share one exact rhythmic spine, every encoded clip must be self-contained, and recent-family memory must prefer material the listener has not just heard. Use sample-accurate starts, never repeat the same primary take immediately, and never choose a bass, melody note or tonal accent without checking it against the voiced chord. Keep the six-clip decoded-memory bound and never publish an isolated source loop or stem.

</details>

### R034 — AGENTS.md:48-48

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 48–48). Outcome: **merged**.

Active destination(s): [docs/agent-guide/music.md#authored-score](../../../docs/agent-guide/music.md#authored-score), [docs/agent-guide/interface.md#shared-geometry-and-palette](../../../docs/agent-guide/interface.md#shared-geometry-and-palette), [docs/agent-guide/interface.md#chrome-and-drawers](../../../docs/agent-guide/interface.md#chrome-and-drawers), [docs/agent-guide/motion-runtime.md#energy-and-mode-boundary](../../../docs/agent-guide/motion-runtime.md#energy-and-mode-boundary).

Consult when: Primary controls, type/targets/chrome or visual/music energy.

Rule coverage / supersession: Separate reachable routes retain Atmos/Harmonics/Pulse exclusion, full 13/14/15/15/17/22/32 ladder, 48/56 targets, 64 chrome at 773x601, metadata contrast/case/carets, modal/ATLAS suppression/full field, cycle 6 px, fixed 130 and tunnel 40. This complex unit is not reduced to a generic UI pointer.

<details><summary>Original wording for comparison</summary>

> - Prefer curated audiovisual environments and purposeful Visual/Music selectors over low-level `Atmos`, `Harmonics`, and `Pulse` controls in the primary driving surface. The owner-selected **Tesla Compact** refinement uses a semantic `13 / 14 / 15 / 15 / 17 / 22 / 32 px` type ladder, `48 px` action targets, `56 px` primary targets, and retracting `64 px` top and bottom chrome at `773 x 601`; do not restore a blanket type floor that consumes the visual field or reduce touch targets with the type. Keep `13 px` metadata high contrast, preserve the editorial Title Case/functional uppercase distinction, avoid redundant text rows, and use disclosure carets only for controls that open real menus. Modal passenger surfaces suppress global chrome and Now Playing; ATLAS suppresses Now Playing and expands its panel to the full field when chrome rests. Contextual visual-cycle controls follow chrome visibility and use the shared `6 px` radius. The user-adjustable energy-threshold slider is retired: normalize visual and music energy against the fixed `130 km/h` legal-road ceiling, while ensuring the tunnel is already visible by approximately `40 km/h`.

</details>

### R035 — AGENTS.md:49-49

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 49–49). Outcome: **unresolved**.

Active destination(s): [docs/agent-guide/maps.md#atlas-and-stats](../../../docs/agent-guide/maps.md#atlas-and-stats).

Consult when: ATLAS attribution or location-sidebar redesign.

Rule coverage / supersession: Attribution low/translucent above footer retained. Explicit P094 retires chart handle/panel, not unambiguously a distinct location handle; retain condition-specific conflict, exact geometry via P039, no blocking unrelated tasks.

<details><summary>Original wording for comparison</summary>

> - Keep ATLAS map attribution mandatory but visually subordinate: a tiny, low, translucent text strip immediately above the footer, never a large white pill. Its passenger-location sidebar must collapse behind a persistent midpoint handle on the right edge; collapsing expands the map to the full field and the same handle must reopen it.

</details>

### R036 — AGENTS.md:50-50

Original section: **Product and validation** ([byte-identical original](AGENTS.md.txt), lines 50–50). Outcome: **merged**.

Active destination(s): [docs/agent-guide/delivery.md#canonical-publication](../../../docs/agent-guide/delivery.md#canonical-publication).

Consult when: Publication or server assumption.

Rule coverage / supersession: Bare/canonical and assets/version/cache checks remain; upload is insufficient; no unverified Apache/Nginx assumption.

<details><summary>Original wording for comparison</summary>

> - Do not assume Apache, Nginx, or any other server technology without evidence.

</details>

### R037 — AGENTS.md:54-54

Original section: **Licensing** ([byte-identical original](AGENTS.md.txt), lines 54–54). Outcome: **moved**.

Active destination(s): [docs/agent-guide/provenance.md#original-material](../../../docs/agent-guide/provenance.md#original-material), [docs/agent-guide/provenance.md#third-party-admission](../../../docs/agent-guide/provenance.md#third-party-admission).

Consult when: License, dependency, source, asset or distribution changes.

Rule coverage / supersession: Exact PolyForm name/creator, excluded assets, earlier AGPL rights, synchronized files, third-party admission before entry and no CC software retained.

<details><summary>Original wording for comparison</summary>

> - Keep `LICENSE`, `LICENSE-SCOPE.md`, `NOTICE`, README licensing copy, package metadata, and the licensing decision log synchronized.

</details>

### R038 — AGENTS.md:55-59

Original section: **Licensing** ([byte-identical original](AGENTS.md.txt), lines 55–59). Outcome: **moved**.

Active destination(s): [docs/agent-guide/provenance.md#original-material](../../../docs/agent-guide/provenance.md#original-material), [docs/agent-guide/provenance.md#third-party-admission](../../../docs/agent-guide/provenance.md#third-party-admission).

Consult when: License, dependency, source, asset or distribution changes.

Rule coverage / supersession: Exact PolyForm name/creator, excluded assets, earlier AGPL rights, synchronized files, third-party admission before entry and no CC software retained.

<details><summary>Original wording for comparison</summary>

> - Original sedicivalvole code and documentation default to
>   `PolyForm-Noncommercial-1.0.0`; this is source-visible noncommercial software,
>   not open source. Original brand, screenshots, audio, and standalone
>   visual/media assets remain excluded unless specifically licensed. Public
>   versions already distributed under AGPL retain their earlier rights.

</details>

### R039 — AGENTS.md:60-62

Original section: **Licensing** ([byte-identical original](AGENTS.md.txt), lines 60–62). Outcome: **moved**.

Active destination(s): [docs/agent-guide/provenance.md#original-material](../../../docs/agent-guide/provenance.md#original-material), [docs/agent-guide/provenance.md#third-party-admission](../../../docs/agent-guide/provenance.md#third-party-admission).

Consult when: License, dependency, source, asset or distribution changes.

Rule coverage / supersession: Exact PolyForm name/creator, excluded assets, earlier AGPL rights, synchronized files, third-party admission before entry and no CC software retained.

<details><summary>Original wording for comparison</summary>

> - The sole original creator and public licensor identity is `enuzzo`; do not
>   imply a studio, company, or other legal entity. Third-party ownership and
>   credits remain exactly as recorded in `THIRD_PARTY_NOTICES.md`.

</details>

### R040 — AGENTS.md:63-63

Original section: **Licensing** ([byte-identical original](AGENTS.md.txt), lines 63–63). Outcome: **moved**.

Active destination(s): [docs/agent-guide/provenance.md#original-material](../../../docs/agent-guide/provenance.md#original-material), [docs/agent-guide/provenance.md#third-party-admission](../../../docs/agent-guide/provenance.md#third-party-admission).

Consult when: License, dependency, source, asset or distribution changes.

Rule coverage / supersession: Exact PolyForm name/creator, excluded assets, earlier AGPL rights, synchronized files, third-party admission before entry and no CC software retained.

<details><summary>Original wording for comparison</summary>

> - Record every third-party dependency or asset in `THIRD_PARTY_NOTICES.md` before it enters the product or repository.

</details>

### R041 — AGENTS.md:64-64

Original section: **Licensing** ([byte-identical original](AGENTS.md.txt), lines 64–64). Outcome: **moved**.

Active destination(s): [docs/agent-guide/provenance.md#original-material](../../../docs/agent-guide/provenance.md#original-material), [docs/agent-guide/provenance.md#third-party-admission](../../../docs/agent-guide/provenance.md#third-party-admission).

Consult when: License, dependency, source, asset or distribution changes.

Rule coverage / supersession: Exact PolyForm name/creator, excluded assets, earlier AGPL rights, synchronized files, third-party admission before entry and no CC software retained.

<details><summary>Original wording for comparison</summary>

> - Do not use Creative Commons licenses for software.

</details>

### R042 — AGENTS.md:68-68

Original section: **Standing deployment authorization — 2026-09-05** ([byte-identical original](AGENTS.md.txt), lines 68–68). Outcome: **merged**.

Active destination(s): [docs/agent-guide/delivery.md#canonical-publication](../../../docs/agent-guide/delivery.md#canonical-publication), [AGENTS.md#non-negotiable-boundaries](../../../AGENTS.md#non-negotiable-boundaries).

Consult when: Approved product delivery.

Rule coverage / supersession: Standing September 5 authority removes repeated deployment confirmation, preserves experimental maturity, checks, history, recovery and canonical verification.

<details><summary>Original wording for comparison</summary>

> The owner explicitly authorizes deployment to `https://sedicivalvole.app/` now and in future sessions: deploy promptly within the agreed project work, without asking for another deployment confirmation. The owner accepts iterative fixes backed by Git, backups and session history. This supersedes earlier requirements to obtain fresh deployment approval for each change. Keep the existing relevant checks, traceable commits/build stamps and canonical post-deployment verification; use rollback or a focused fix when needed.

</details>

### R043 — AGENTS.md:70-70

Original section: **Standing deployment authorization — 2026-09-05** ([byte-identical original](AGENTS.md.txt), lines 70–70). Outcome: **merged**.

Active destination(s): [AGENTS.md#non-negotiable-boundaries](../../../AGENTS.md#non-negotiable-boundaries), [docs/agent-guide/delivery.md#canonical-publication](../../../docs/agent-guide/delivery.md#canonical-publication).

Consult when: Official authorized deployment only.

Rule coverage / supersession: Official script may internally load .env for preflight/publication/postflight; no inspection/exposure, no redundant approval; exception is narrow.

<details><summary>Original wording for comparison</summary>

> The owner's explicit configuration exception also permits the official `scripts/deploy_drive_lab_ftp.py` script to load `.env` internally for preflight, publication and postflight. This is the sole exception to the blanket `.env` reading prohibition above: agents must not inspect, print, diff, log, copy or version secret contents or place credentials in command lines. Do not ask again for that same internal-loading permission during ordinary authorized deployment.

</details>

### R044 — AGENTS.md:74-74

Original section: **Community acknowledgements — 2026-09-05** ([byte-identical original](AGENTS.md.txt), lines 74–74). Outcome: **merged**.

Active destination(s): [docs/agent-guide/provenance.md#community-credits](../../../docs/agent-guide/provenance.md#community-credits).

Consult when: Source/dependency/credit changes and before publication.

Rule coverage / supersession: Full final README credits incl transitive/non-Git, emoji, authors/material/use/status, public contacts and unsent warm drafts; update three docs together; refresh on lockfile and check before publishing.

<details><summary>Original wording for comparison</summary>

> Maintain the README community credits and `docs/COMMUNITY-THANKS.md` when sources are added, replaced or retired. Record the real author/project, exact code or material used, public contact routes and a warm, personalized unsent release thank-you draft. Separate shipped integrations from services, development tools and studies. Never describe the current PolyForm Noncommercial project as MIT/open source, infer private contact details, or send a message without explicit sending authorization.

</details>

### R045 — AGENTS.md:78-78

Original section: **Complete README footer — owner's standing instruction, 2026-09-05** ([byte-identical original](AGENTS.md.txt), lines 78–78). Outcome: **merged**.

Active destination(s): [docs/agent-guide/provenance.md#community-credits](../../../docs/agent-guide/provenance.md#community-credits).

Consult when: Source/dependency/credit changes and before publication.

Rule coverage / supersession: Full final README credits incl transitive/non-Git, emoji, authors/material/use/status, public contacts and unsent warm drafts; update three docs together; refresh on lockfile and check before publishing.

<details><summary>Original wording for comparison</summary>

> Keep every community credit in the final README section, including minor/transitive dependencies and sources without Git repositories: named authors, original repositories, articles/demos, exact code/material/service use and shipped/development/study status. Precede each entry with a restrained relevant emoji. Insert later product updates above `COMMUNITY-CREDITS:START`, never below the credits. Update README, THIRD_PARTY_NOTICES and COMMUNITY-THANKS together whenever provenance changes. Refresh the complete npm inventory with `python3 scripts/readme_dependency_credits.py --refresh` when the lockfile changes; run `--check` before publishing. The automated check does not replace review of authorship or non-npm sources. This is a persistent owner preference, not a one-time cleanup.

</details>

### R046 — AGENTS.md:83-98

Original section: **Owner acceptance and reliability direction — 2026-09-07** ([byte-identical original](AGENTS.md.txt), lines 83–98). Outcome: **updated**.

Active destination(s): [AGENTS.md#working-agreement](../../../AGENTS.md#working-agreement), [docs/agent-guide/motion-runtime.md#preparation-and-recovery](../../../docs/agent-guide/motion-runtime.md#preparation-and-recovery), [docs/agent-guide/maps.md#atlas-and-stats](../../../docs/agent-guide/maps.md#atlas-and-stats), [docs/agent-guide/diagnostics-reports.md#automatic-delivery](../../../docs/agent-guide/diagnostics-reports.md#automatic-delivery).

Consult when: Reliability, ATLAS/Stats redesign, diagnostic scheduling or backlog prioritization.

Rule coverage / supersession: Broad acceptance and reliability > Engine > iPhone retained without inventing tests. Map parity/POI direction retained and selected by P094. Backoff/recovery/cancel/no hidden-offline retry retained. Future-only ten-minute/default uncertainty superseded by R050 then R060/R061; current AUTO contract preserves privacy/disclosure/server checks/gaps.

<details><summary>Original wording for comparison</summary>

> Flux, Soundtrack, FX, interface and Discover are owner-accepted, subject to later
> small refinements. Prioritize reliability fixes, then Engine, then iPhone.
> Travel ATLAS becomes an informative map; move and expand the existing statistics
> into a separate full-screen visual only after replacement parity is verified.
> The owner delegates information design; exact-coordinate Discover POIs are a
> candidate to research. Keep the three-direction visual gate before construction.
> Transient failed loads must retry automatically with bounded backoff for several
> minutes, online/foreground recovery, no overlapping attempts and cancellation on
> selection change. Do not repeatedly reload hidden/offline renderers.
> Future diagnostics have Standard and Dev levels. The owner explicitly authorizes
> coordinate-free packets to the existing diagnostic destination every ten minutes
> only in Dev, with automatic send default ON within Dev and a visible OFF switch.
> This supersedes manual-only transmission for that future feature only; implement
> matching disclosure, scheduling, server validation and tests before enabling it.
> Do not promise background timer execution or infer default Dev mode. Record
> minimized-browser gaps honestly. See docs/OWNER-DECISIONS-2026-09-07.md.

</details>

### R047 — AGENTS.md:102-110

Original section: **Engine source decision — 2026-09-07** ([byte-identical original](AGENTS.md.txt), lines 102–110). Outcome: **merged**.

Active destination(s): [docs/agent-guide/engine.md#accepted-source-and-voices](../../../docs/agent-guide/engine.md#accepted-source-and-voices).

Consult when: Engine donor integration/provenance.

Rule coverage / supersession: Exact authorized declared-MIT WAV integration supersedes study holds; candidate adaptation allowed; no blind-review/independent rights/liability claim.

<details><summary>Original wording for comparison</summary>

> The owner explicitly directs implementation using pinned MIT
> `markeasting/engine-audio`, including its bundled active WAVs, relying on the
> repository's declared MIT licence. This supersedes older project/study holds and
> additional owner-approval gates for that exact integration. Record the declared
> licence, exact source/hash/change inventory and outstanding recording-provenance
> follow-up truthfully; do not claim ownership independently verified or liability
> transferred. Preserve upstream attribution and the existing deployment authority.
> The prior sealed candidate may be inspected and adapted progressively for this
> integration; no independent blind-review claim is made.

</details>

### R048 — AGENTS.md:115-120

Original section: **Engine listening refinement — 2026-09-07** ([byte-identical original](AGENTS.md.txt), lines 115–120). Outcome: **updated**.

Active destination(s): [docs/agent-guide/engine.md#output-and-road-response](../../../docs/agent-guide/engine.md#output-and-road-response), [docs/agent-guide/engine.md#tamarro-and-idle](../../../docs/agent-guide/engine.md#tamarro-and-idle).

Consult when: Engine output, deceleration, controls or idle.

Rule coverage / supersession: Dry bypass/no moving ducking retained; displayed-zero left/right visible across chrome and disabled under remaining audio/movement/lifecycle conditions. R049 and ROAD-FEEDBACK / Implemented corrections explicitly remove the GPS requirement for manual revs, including stale/absent GPS; stale-zero disables automatic idle. Automatic fresh-zero and movement/mute/lifecycle stop retained.

<details><summary>Original wording for comparison</summary>

> The owner requires Engine to bypass UNDERWATER and all Flux creative effects.
> Deceleration changes RPM without artificial gain ducking. Keep prominent left
> and right TAMARRO controls visible at displayed zero independently of chrome
> retraction; stale evidence disables rather than removes them. Small periodic idle
> blips require fresh exact standstill and stop on movement, mute or lifecycle loss.
> This is a direct refinement of the selected Telemetry direction.

</details>

### R049 — AGENTS.md:124-136

Original section: **Owner road feedback — 2026-09-07 evening** ([byte-identical original](AGENTS.md.txt), lines 124–136). Outcome: **updated**.

Active destination(s): [docs/agent-guide/engine.md#tamarro-and-idle](../../../docs/agent-guide/engine.md#tamarro-and-idle), [docs/agent-guide/motion-runtime.md#gps-and-simulator](../../../docs/agent-guide/motion-runtime.md#gps-and-simulator), [docs/agent-guide/maps.md#atlas-and-stats](../../../docs/agent-guide/maps.md#atlas-and-stats), [docs/agent-guide/interface.md#intro-and-branding](../../../docs/agent-guide/interface.md#intro-and-branding).

Consult when: Manual/automatic Engine freshness, Stats catalogue or Intro/Splash identity.

Rule coverage / supersession: Manual ready-before-GPS, movement cancel; automatic watch exact zero/12 s hold/~10 s cadence, missing/hidden cancel, monotonic watch vs acquired one-shot and historical clock uncertainty; Visual09 separate/outward heading bands; Intro/Splash build with Intro bottom-right preserved.

<details><summary>Original wording for comparison</summary>

> Manual TAMARRO must work as soon as Engine audio is ready, including before the
> first GPS fix. This supersedes the earlier fresh-standstill gate for manual revs.
> Movement still cancels manual revs. Automatic idle gestures require an actual
> exact-zero watch observation; a bounded 12-second stationary watch hold bridges
> the approximately 10-second stationary cadence observed in the owner's report.
> Hidden state, missing/invalid live speed and renewed movement cancel that hold.
> Live watch events use the shared receiver's monotonic time; one-shot renewals
> retain acquisition/replay checks. Do not claim the old report proves a specific
> provider-clock defect: it did not record acquisition timestamps or Engine reasons.
> Stats for Nerds is Visual 09 in both launch and running catalogues, separate from
> Atlas; remove their shared Map/Stats tabs. Retain the approved remix, with outward
> curved heading bands. Intro means the initial chooser; Splash means its loading
> transition. Both show the existing build identity, with Intro bottom right.

</details>

### R050 — AGENTS.md:140-149

Original section: **Owner automatic diagnostics activation — 2026-09-07 evening** ([byte-identical original](AGENTS.md.txt), lines 140–149). Outcome: **updated**.

Active destination(s): [docs/agent-guide/diagnostics-reports.md#automatic-delivery](../../../docs/agent-guide/diagnostics-reports.md#automatic-delivery).

Consult when: Automatic diagnostic defaults/delivery.

Rule coverage / supersession: Dev/AUTO ON, saved OFF/Standard, visible OFF, bounded coordinate-free fixed destination, single in-flight/pending/retry/server tests/no synthetic mail retained. Driving-only fifteen minutes is superseded by R060/R061 active session; not a new manual-only gate.

<details><summary>Original wording for comparison</summary>

> The owner explicitly requests implementing and publishing automatic diagnostic
> mail now, enabled by default because the product is in active development.
> This supersedes the future-only hold and proposed Standard default. Use Dev and
> AUTO ON for fresh preferences, preserving an explicit saved OFF/Standard choice.
> The current interval is 15 minutes of observed GPS driving (superseding ten
> minutes); stops, simulated speed and hidden/unobserved time do not count.
> Keep visible OFF in Intro and Session report, bounded coordinate-free packets to
> the existing destination, one in-flight send, bounded retry, server validation,
> and at most one pending packet on online/foreground recovery. Do not send
> synthetic QA packets to the real mailbox. Do not promise timers while minimized.

</details>

### R051 — AGENTS.md:154-162

Original section: **Owner night-work direction — 2026-09-07** ([byte-identical original](AGENTS.md.txt), lines 154–162). Outcome: **updated**.

Active destination(s): [AGENTS.md#working-agreement](../../../AGENTS.md#working-agreement), [docs/agent-guide/interface.md#phone-behavior](../../../docs/agent-guide/interface.md#phone-behavior), [docs/agent-guide/recovery.md#current-continuation](../../../docs/agent-guide/recovery.md#current-continuation), [docs/agent-guide/engine.md#research-and-campaign-scope](../../../docs/agent-guide/engine.md#research-and-campaign-scope).

Consult when: iPhone work or requested night-campaign continuation.

Rule coverage / supersession: One-night all-open-work mandate is historical, not universal backlog authority. Compact Cockpit direction 1, named iPhones/no known iOS, rotation ownership and phone-only inert notice retained; evidence layers kept.

<details><summary>Original wording for comparison</summary>

> The owner requests progressing all executable open work and welcomes deeper
> Engine source/acoustic research. Current-state reconciliation distinguishes
> shipped work, implementation, optional studies and physical acceptance gates.
> For iPhone, the owner selects direction 1, Compact Cockpit: the existing Tesla
> organization with thin retracting top/bottom bars, full touch targets and safe
> areas. Named test devices are iPhone 17 Pro and iPhone 17 Pro Max; iOS versions
> remain unspecified. Preserve audio, selection and renderer across rotation.
> Use an accessible inert portrait notice only on phones, without treating desktop
> portrait windows or the Tesla viewport as a phone.

</details>

### R052 — AGENTS.md:164-167

Original section: **Owner night-work direction — 2026-09-07** ([byte-identical original](AGENTS.md.txt), lines 164–167). Outcome: **moved**.

Active destination(s): [docs/agent-guide/diagnostics-reports.md#travel-report](../../../docs/agent-guide/diagnostics-reports.md#travel-report).

Consult when: Travel Report/PDF/recipient/route changes.

Rule coverage / supersession: Direction 1 cover/journey/graphs/appendix, explicit route inclusion, immutable preview/download and recipient verification, technical coordinate exclusion retained.

<details><summary>Original wording for comparison</summary>

> The owner also selects report direction 1, Travel Report: compact cover, journey
> summary, graphs and a technical appendix. Precise route inclusion remains an
> explicit export option. Preserve immutable preview/download identity and
> chosen-recipient verification; technical diagnostics remain coordinate-free.

</details>

### R053 — AGENTS.md:171-177

Original section: **Owner altitude fallback — September 7 late evening** ([byte-identical original](AGENTS.md.txt), lines 171–177). Outcome: **moved**.

Active destination(s): [docs/agent-guide/maps.md#altitude](../../../docs/agent-guide/maps.md#altitude).

Consult when: Altitude display, totals or PDF.

Rule coverage / supersession: GPS display independent of strict totals filter, GPS priority, labeled Open-Meteo/Copernicus fallback, rounded cache/spacing/recovery; no auto diagnostic geography.

<details><summary>Original wording for comparison</summary>

> The owner explicitly requests a practical map/terrain height fallback when GPS
> does not provide altitude. Keep reported GPS altitude visible independently of
> the strict ascent/descent accuracy filter. Prefer GPS when present; label the
> terrain estimate separately in Stats and PDF. Reuse the existing Open-Meteo /
> Copernicus service with rounded request cells, bounded session cache, request
> spacing and lifecycle recovery. Do not substitute terrain for a GPS reading or
> add height/position values to automatic technical diagnostics.

</details>

### R054 — AGENTS.md:181-193

Original section: **Owner Engine quality campaign — September 7 late evening** ([byte-identical original](AGENTS.md.txt), lines 181–193). Outcome: **updated**.

Active destination(s): [docs/agent-guide/engine.md#research-and-campaign-scope](../../../docs/agent-guide/engine.md#research-and-campaign-scope), [docs/agent-guide/engine.md#accepted-source-and-voices](../../../docs/agent-guide/engine.md#accepted-source-and-voices), [docs/agent-guide/engine.md#output-and-road-response](../../../docs/agent-guide/engine.md#output-and-road-response), [docs/agent-guide/interface.md#design-decisions](../../../docs/agent-guide/interface.md#design-decisions).

Consult when: Explicit Engine quality campaign.

Rule coverage / supersession: Campaign implementation/refactor authority retained in its scope, local Dropbox, study sources and close prior delivery; historical fresh-Ultra invitation does not auto-launch tasks or all backlog. Current source handoff/retained voices supersede old research candidates; provenance/dry/GPS/Telemetry and separate visual selection preserved.

<details><summary>Original wording for comparison</summary>

> After the altitude release, Engine is the owner's primary development priority:
> maximum audible quality and versatility, new engine types, coherent automatic
> shifting, load response, turbo/turbine sounds and event timing. Study the local
> analysis/reference folders and the fuller simulator sources before choosing
> reuse, procedural synthesis or refactoring. The owner authorizes substantive
> implementation and refactoring within this scope, followed by verified deployment.
> A fresh task at Ultra reasoning is explicitly allowed, but work must run directly
> in this saved Dropbox project on this Mac. Close commit/documentation/push/deploy
> for prior changes first. Preserve the current reliable GPS/lifecycle and dry-audio
> contracts, and do not treat a historical study's blind-review or AWAITING_APPROVAL
> workflow as the active task. Current work is an informed implementation campaign.
> Maintain source/asset provenance, existing licensing and the selected visual; a
> new visual design still requires its separate three-direction selection.

</details>

### R055 — AGENTS.md:197-205

Original section: **Owner road progression clarification — 2026-09-08** ([byte-identical original](AGENTS.md.txt), lines 197–205). Outcome: **updated**.

Active destination(s): [docs/agent-guide/engine.md#output-and-road-response](../../../docs/agent-guide/engine.md#output-and-road-response).

Consult when: Engine road calibration.

Rule coverage / supersession: 35/65 ladder superseded explicitly: 20–40 restraint, strong 80, 100–130 progression, virtual ratios/load/dwell, road ceiling not neutral rev, dry output and virtual-not-Tesla truth. Later second-at30 is calibration preference, not speed-only override.

<details><summary>Original wording for comparison</summary>

> Engine must be restrained at urban 20–40 km/h and already feel powerful at
> 80 km/h, then progress through 100–130. Use coherent virtual wheel/gear/final
> drive ratios and load-sensitive automatic shifts, with a 130 km/h acoustic
> road ceiling. This supersedes the earlier redline-derived 35/65 km/h ladder.
> Preserve genuine acceleration character, dry output and stationary TAMARRO;
> the ceiling limits road response, not the explicit neutral rev gesture.
> Study Ange Yaghi's public code and licensed material, distinguishing its
> impulse responses, authored example ratios and manual controls from engine
> recordings or an automatic gearbox. Do not present virtual state as Tesla data.

</details>

### R056 — AGENTS.md:210-217

Original section: **Owner simulator clarification — 2026-09-08** ([byte-identical original](AGENTS.md.txt), lines 210–217). Outcome: **merged**.

Active destination(s): [docs/agent-guide/engine.md#research-and-campaign-scope](../../../docs/agent-guide/engine.md#research-and-campaign-scope).

Consult when: Engine simulator/source research.

Rule coverage / supersession: Both named references, public access only, no purchase/bypass/proprietary import; Yaghi IR/ratios/manual controls distinguished from recordings/automatic gearbox.

<details><summary>Original wording for comparison</summary>

> The owner confirms Ange Yaghi's engine-sim and Real Engine Simulator
> (https://realenginesimulator.com/) as central Engine research references. The
> latter is the fuller simulator previously recalled. Explore its publicly
> accessible engines, interface and explanations; no purchase or access bypass is
> requested. Its public presets are free; Pro concerns the custom engine builder.
> Study behavior and concepts without importing its proprietary runtime, audio,
> parameters or presets. Continue the authorized original Engine implementation
> inside the saved local project; preserve the selected Telemetry visual.

</details>

### R057 — AGENTS.md:221-228

Original section: **Owner Tesla refinement — September 8, 2026** ([byte-identical original](AGENTS.md.txt), lines 221–228). Outcome: **updated**.

Active destination(s): [docs/agent-guide/engine.md#output-and-road-response](../../../docs/agent-guide/engine.md#output-and-road-response), [docs/agent-guide/engine.md#research-and-campaign-scope](../../../docs/agent-guide/engine.md#research-and-campaign-scope), [docs/agent-guide/engine.md#protected-listening-lab](../../../docs/agent-guide/engine.md#protected-listening-lab), [docs/agent-guide/engine.md#accepted-source-and-voices](../../../docs/agent-guide/engine.md#accepted-source-and-voices).

Consult when: Engine acoustic refinement or listening evaluation.

Rule coverage / supersession: 0807 road evidence remains historical; second near30, full body/no phase smear retained. R058 selected A/B resolves proposed LAB gate. Later retained-voices owner decision retires Otto/Cinque/Turbine without reverting Mono hybrid; no invented listening-build identity.

<details><summary>Original wording for comparison</summary>

> The owner physically tested build 0807: motion/progression/braking improved and
> high-volume Mono/Rosso/Touring were good, with refinement requested. Research
> real sports/rally gearing; favor second at 30 without restoring excessive city
> RPM. Reduce perceived echo/phase smear and artificial Otto/Cinque/Turbine tones
> while retaining full, deep body. Preserve dry output, GPS/lifecycle and TAMARRO.
> A protected LAB comparison/annotation surface is proposed; present three
> directions and retain the visual selection gate before constructing it. See
> docs/ENGINE-LISTENING-REFINEMENT-2026-09-08.md.

</details>

### R058 — AGENTS.md:232-235

Original section: **Owner listening LAB selection — 2026-09-08** ([byte-identical original](AGENTS.md.txt), lines 232–235). Outcome: **moved**.

Active destination(s): [docs/agent-guide/engine.md#protected-listening-lab](../../../docs/agent-guide/engine.md#protected-listening-lab).

Consult when: Protected A/B LAB calibration/replay/notes.

Rule coverage / supersession: Same route/two calibrations/one take/original levels/local bounded history+export; public default/dry/GPS retained, synchronize labels and source IDs for any parameter change.

<details><summary>Original wording for comparison</summary>

> The owner selects A/B listening: the same route, two calibrations, locally saved
> preference and notes. Implement in the existing protected LAB, one take at a
> time, explicit original levels, bounded local history and export. Preserve the
> public refined default and existing dry/GPS/lifecycle contracts.

</details>

### R059 — AGENTS.md:237-238

Original section: **Owner listening LAB selection — 2026-09-08** ([byte-identical original](AGENTS.md.txt), lines 237–238). Outcome: **moved**.

Active destination(s): [docs/agent-guide/engine.md#protected-listening-lab](../../../docs/agent-guide/engine.md#protected-listening-lab).

Consult when: Protected A/B LAB calibration/replay/notes.

Rule coverage / supersession: Same route/two calibrations/one take/original levels/local bounded history+export; public default/dry/GPS retained, synchronize labels and source IDs for any parameter change.

<details><summary>Original wording for comparison</summary>

> Keep A/B calibration labels and source identifiers synchronized whenever their
> parameters change; an earlier calibration must not silently become a new sound.

</details>

### R060 — AGENTS.md:242-248

Original section: **Active-session clock — owner correction, 2026-09-08** ([byte-identical original](AGENTS.md.txt), lines 242–248). Outcome: **merged**.

Active destination(s): [docs/agent-guide/diagnostics-reports.md#automatic-delivery](../../../docs/agent-guide/diagnostics-reports.md#automatic-delivery).

Consult when: Session clock, automatic diagnostic client/server/transport.

Rule coverage / supersession: Exact fifteen-minute active-visible clock includes stops/noGPS/simulation/offline; hidden or >5 s gap excluded; reload reset; one due memory snapshot/no outbox; exact metadata and event names, server old-client compatibility/floor, mail acceptance meaning retained.

<details><summary>Original wording for comparison</summary>

> This supersedes the September 7 driving-only trigger: count fifteen minutes of
> observable active session time, including stops, absent GPS, simulated input and
> offline operation. Keep Dev/AUTO ON defaults and saved OFF/Standard. Hidden time
> and execution gaps over five seconds remain unobserved; reload starts a fresh
> session clock. At most one due report waits in memory for online/foreground
> recovery; construct a fresh bounded coordinate-free snapshot when sending.
> There is no persistent outbox or background execution promise.

</details>

### R061 — AGENTS.md:250-256

Original section: **Active-session clock — owner correction, 2026-09-08** ([byte-identical original](AGENTS.md.txt), lines 250–256). Outcome: **merged**.

Active destination(s): [docs/agent-guide/diagnostics-reports.md#automatic-delivery](../../../docs/agent-guide/diagnostics-reports.md#automatic-delivery).

Consult when: Session clock, automatic diagnostic client/server/transport.

Rule coverage / supersession: Exact fifteen-minute active-visible clock includes stops/noGPS/simulation/offline; hidden or >5 s gap excluded; reload reset; one due memory snapshot/no outbox; exact metadata and event names, server old-client compatibility/floor, mail acceptance meaning retained.

<details><summary>Original wording for comparison</summary>

> Use `timeBasis: active-visible-session`, `intervalActiveMs`, `activeMs` and
> `totalActiveMs` in new diagnostic delivery metadata. The server validates the new
> clock explicitly and still accepts the older driving clock for already-open
> clients. Preserve the fifteen-minute server floor and bounded transport retries.
> Log `diagnostic-send.due` at the threshold, including offline state, then
> `requested`, `accepted` or `failed` with automatic/manual attribution. Acceptance
> means server mail-transport acceptance, not verified inbox delivery.

</details>

### R062 — AGENTS.md:260-265

Original section: **Owner weak-network music feedback — 2026-09-08** ([byte-identical original](AGENTS.md.txt), lines 260–265). Outcome: **merged**.

Active destination(s): [docs/agent-guide/music.md#soundtrack-and-selection](../../../docs/agent-guide/music.md#soundtrack-and-selection), [docs/agent-guide/diagnostics-reports.md#capture-and-presentation](../../../docs/agent-guide/diagnostics-reports.md#capture-and-presentation).

Consult when: Weak-network music, artwork, native media handlers or logs.

Rule coverage / supersession: Initial glyph payload, loading/retry and retained transport, artwork recovery/native metadata, actual handlers not registration, invocation/outcome evidence, 1x fixed recordings.

<details><summary>Original wording for comparison</summary>

> Ship music control glyphs in the initial application payload, with visible
> loading/retrying feedback instead of blank controls. Retain transport while
> waiting for the catalogue. Recover artwork on network/foreground return and
> republish native metadata. Verify native play/pause/previous/next through the
> actual app handlers; do not equate API registration with Tesla button visibility.
> Preserve the native invocation/outcome log and fixed recordings at 1x.

</details>

### R063 — AGENTS.md:270-275

Original section: **Owner launch preparation — 2026-09-09** ([byte-identical original](AGENTS.md.txt), lines 270–275). Outcome: **moved**.

Active destination(s): [docs/agent-guide/motion-runtime.md#preparation-and-recovery](../../../docs/agent-guide/motion-runtime.md#preparation-and-recovery), [docs/agent-guide/engine.md#tamarro-and-idle](../../../docs/agent-guide/engine.md#tamarro-and-idle), [docs/agent-guide/music.md#soundtrack-and-selection](../../../docs/agent-guide/music.md#soundtrack-and-selection).

Consult when: Intro preparation, Engine loading/cache or soundtrack readiness.

Rule coverage / supersession: Silent selected Lucky/Jamendo/cover and at least Mono/follow Engine choice; no hidden mounting/audio before gesture; encoded bounded verified retention, transient Jamendo; centered loading separate controls.

<details><summary>Original wording for comparison</summary>

> Make Engine loading prominent, centered and separate from TAMARRO controls.
> Begin silent preparation in Intro: selected Lucky visual dependencies, selected
> Jamendo recording/cover and at least Mono (follow explicit Engine selection).
> Do not mount hidden renderers or start audio before a gesture. Retain bounded
> verified encoded Engine assets across mode/profile changes within the page;
> keep transient Jamendo media policy and explain browser-cache limits honestly.

</details>

### R064 — AGENTS.md:280-289

Original section: **Owner open-session cache and updates — 2026-09-09** ([byte-identical original](AGENTS.md.txt), lines 280–289). Outcome: **moved**.

Active destination(s): [docs/agent-guide/motion-runtime.md#cache-and-updates](../../../docs/agent-guide/motion-runtime.md#cache-and-updates).

Consult when: Service worker/static caching/build checks/session renewal.

Rule coverage / supersession: Seven-day build caches/active-client protection, capability limits, remote/private exclusions; five-minute+recovery checks, successful fresh week renewal, thirty observed quiet seconds Intro or mute+fresh zero, resets/preferences/update/no background promises.

<details><summary>Original wording for comparison</summary>

> Retain verified static assets for at least seven days in build-specific browser
> caches, without deleting a generation still used by an open client. Browser
> eviction/quota/privacy restrictions remain explicit capability limits. Preserve
> transient remote music and dynamic/private API boundaries. Check published build
> identity every five minutes and on online/foreground return; renew a week-old
> session only after a successful fresh check. Automatic reload requires thirty
> observed quiet seconds in Intro, or muted audio plus fresh exact GPS standstill;
> otherwise offer UPDATE. Interaction, movement, visibility loss and execution gaps
> reset the quiet window. Keep saved preferences, never clear site storage globally,
> and state that session counters restart. Never promise background execution.

</details>

### R065 — AGENTS.md:294-299

Original section: **Owner road UI feedback — 2026-09-09 evening** ([byte-identical original](AGENTS.md.txt), lines 294–299). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#phone-behavior](../../../docs/agent-guide/interface.md#phone-behavior), [docs/agent-guide/maps.md#discover](../../../docs/agent-guide/maps.md#discover), [docs/agent-guide/maps.md#atlas-and-stats](../../../docs/agent-guide/maps.md#atlas-and-stats), [docs/agent-guide/maps.md#air-atlas](../../../docs/agent-guide/maps.md#air-atlas), [docs/agent-guide/delivery.md#verification-proportional-to-the-change](../../../docs/agent-guide/delivery.md#verification-proportional-to-the-change).

Consult when: Phone palette/footer, Discover rows, Atlas camera or radar.

Rule coverage / supersession: Safe-area-aware edge and tap fix retained; actual row/provider/camera corrections from ROAD-UI / Implemented. Radar A selected and rounded requests authorized in AIR-ATLAS opening decision; A+C/lens later selections retained. No desktop60FPS claim.

<details><summary>Original wording for comparison</summary>

> Fix landscape iPhone palette taps and extend the installed webapp footer to the
> bottom edge with safe-area-aware contents. Compact Discover names/row padding
> and label actual providers. Reduce Atlas numbered discs while retaining touch
> areas; prioritize smooth travel/rotation, north lock and zoom/reset controls.
> Prepare Meguru radar integration; its new visual still requires A/B/C selection.
> Do not claim desktop frame timing proves sustained Tesla 60 FPS.

</details>

### R066 — AGENTS.md:303-303

Original section: **Owner Air Atlas refinement — 2026-09-10** ([byte-identical original](AGENTS.md.txt), lines 303–303). Outcome: **updated**.

Active destination(s): [docs/agent-guide/maps.md#air-atlas](../../../docs/agent-guide/maps.md#air-atlas), [docs/agent-guide/maps.md#fly-with](../../../docs/agent-guide/maps.md#fly-with).

Consult when: Radar symbols, motion, base map or flight view.

Rule coverage / supersession: Selected-only ring/distance/exact or category shapes without track requirement, five-second measured interpolation, major roads/lakes/runway/limited water and source-required airways. Pending nose-camera gate resolved by R067 A+C; numeric 1.25 retained.

<details><summary>Original wording for comparison</summary>

> Only selected aircraft have one contrasting ring, with ground distance below it. Shape availability must not depend on ground track. Retain exact model artwork where available and use clearly identified category silhouettes otherwise, with no neutral dots for known rotorcraft or civil aircraft. Buffer measured positions by five seconds for continuous interpolation; never claim an unobserved path or move stale targets indefinitely. Filter map transport to major roads; preserve lakes and airport/runway context while reducing minor water detail. True airways need a verified aeronautical source, not guessed routes. A separate nose-mounted oblique terrain view with elevation exaggeration 1.25 is requested; A Nose Camera / B Flight Instruments / C Dual View were presented and selection remains pending.

</details>

### R067 — AGENTS.md:307-307

Original section: **Owner Air Atlas nose-camera selection — 2026-09-10** ([byte-identical original](AGENTS.md.txt), lines 307–307). Outcome: **moved**.

Active destination(s): [docs/agent-guide/maps.md#fly-with](../../../docs/agent-guide/maps.md#fly-with).

Consult when: Flight camera or radar return.

Rule coverage / supersession: A+C oblique real terrain 1.25 plus corner minimap/telemetry, shared delayed track, direct return, honest stale/altitude approximation, no video/clearance claim.

<details><summary>Original wording for comparison</summary>

> The owner selects A+C: an oblique nose-mounted view over real 3D terrain, exaggeration 1.25, with one corner card combining a minimap and compact telemetry. This resolves the earlier A/B/C gate. Keep direct return to the radar, shared five-second measured playback, honest stale/missing-data states and explicit approximate altitude reference. Do not imply onboard video or exact terrain clearance.

</details>

### R068 — AGENTS.md:311-311

Original section: **Owner compact Intro refinement — 2026-09-10** ([byte-identical original](AGENTS.md.txt), lines 311–311). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#intro-and-branding](../../../docs/agent-guide/interface.md#intro-and-branding), [docs/agent-guide/music.md#curated-experiences](../../../docs/agent-guide/music.md#curated-experiences), [docs/agent-guide/music.md#soundtrack-and-selection](../../../docs/agent-guide/music.md#soundtrack-and-selection).

Consult when: Compact Intro/defaults/artwork/presets.

Rule coverage / supersession: A only within original compact colors/center/START, 80 square/6 radius/compact controls, Mute and stable two genre presets/direct palette/no generated art. R069 supersedes saved-source exception; R070 removes Intro artist and adds 8 padding; actual prepared identity retained.

<details><summary>Original wording for comparison</summary>

> The owner selects direction A only as a small refinement of the current Intro and rejects the oversized generated cover concepts. Preserve current semantic UI colors, centered intrinsic sheet and existing START hierarchy. Use 80 px square covers with 6 px corners (previously 64 px circles), not the large concept images. Keep metadata and compact outline-icon Choose/Random controls to their right, without increasing the selection-row footprint. Soundtrack becomes the fresh/reset default while explicit stored sources remain respected; Visuals only is renamed Mute. Show actual prepared track title/artist beside its matching artwork. Two stable, randomly selected genre-labelled preset recommendations and a direct palette-cycle control share one row; broaden the underlying preset catalogue without adding visual clutter. This supersedes earlier circular-thumbnail rules for this surface. No generated concept artwork enters the product.

</details>

### R069 — AGENTS.md:315-315

Original section: **Owner Intro compression and default correction — 2026-09-10** ([byte-identical original](AGENTS.md.txt), lines 315–315). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#intro-and-branding](../../../docs/agent-guide/interface.md#intro-and-branding).

Consult when: Intro initial preference, outlines, media/preset geometry.

Rule coverage / supersession: Soundtrack on every Intro, saved mute/current visit intact; Random outlined32/touch48; 80 art; circular36 presets/divided groups/direct palette. R070 supersedes artist/right-align and zero padding only; no new design gate.

<details><summary>Original wording for comparison</summary>

> Start every new Intro with Soundtrack, including when the saved source is Play the Road. This supersedes the immediately preceding saved-source exception; keep saved mute and explicit choices within the current Intro. Put Random inside an outlined button like Choose, reduce their visible vertical padding, and retain 48 px touch regions around the compact 32 px outlines. Align the track artist right on the genre/metadata row. Keep media boxes at the 80 px artwork height with no vertical image padding. Restore circular preset previews and use aligned labelled preset/palette groups separated by a vertical rule. The palette remains a direct cycle. No further visual direction selection is pending.

</details>

### R070 — AGENTS.md:319-319

Original section: **Owner Intro breathing room — 2026-09-10** ([byte-identical original](AGENTS.md.txt), lines 319–319). Outcome: **merged**.

Active destination(s): [docs/agent-guide/interface.md#intro-and-branding](../../../docs/agent-guide/interface.md#intro-and-branding).

Consult when: Intro spacing, labels, artist or narrow layout.

Rule coverage / supersession: 80 cover+8 top/bottom, no media outer border/divider, SOUNDTRACK+nonduplicate genre, artist removed only Intro, PRESETS not RESET, label always visible with narrow stacking.

<details><summary>Original wording for comparison</summary>

> Keep 80 px covers and add 8 px top/bottom padding; remove the media group's outer border and internal divider. Explicitly label the music panel SOUNDTRACK, retaining genre alongside it without repeating an identical Soundtrack genre label. Remove the artist from Intro only; running credits/miniplayer remain unchanged. The owner clarified that the requested left-hand text is PRESETS, not a RESET command. Keep that label visible at all widths; on very narrow layouts the preset and palette groups stack to retain legibility.

</details>

### R071 — AGENTS.md:323-323

Original section: **Owner Air Atlas location and lens refinement — 2026-09-10** ([byte-identical original](AGENTS.md.txt), lines 323–323). Outcome: **merged**.

Active destination(s): [docs/agent-guide/maps.md#air-atlas](../../../docs/agent-guide/maps.md#air-atlas), [docs/agent-guide/maps.md#geographic-privacy](../../../docs/agent-guide/maps.md#geographic-privacy), [docs/agent-guide/motion-runtime.md#gps-and-simulator](../../../docs/agent-guide/motion-runtime.md#gps-and-simulator).

Consult when: Air Atlas location/freshness.

Rule coverage / supersession: First geographic fix at rest or >250 m permitted with approximation/refinement; does not relax motion/terrain/journey, distinguish permission/noAPI/last known; callbacks independent of Permissions API.

<details><summary>Original wording for comparison</summary>

> Use the first valid geographic fix for Air Atlas even when stationary or coarser than 250 m; label approximate accuracy and refine as trusted fixes arrive. Keep the existing trusted motion, terrain and journey gates unchanged. Distinguish granted location awaiting a fix, denied permission, unavailable API and last known position. Permissions API absence must not prevent actual geolocation callbacks from working. Do not equate permission with confirmed satellite reception or require movement for an initial position.

</details>

### R072 — AGENTS.md:325-325

Original section: **Owner Air Atlas location and lens refinement — 2026-09-10** ([byte-identical original](AGENTS.md.txt), lines 325–325). Outcome: **merged**.

Active destination(s): [docs/agent-guide/maps.md#air-atlas](../../../docs/agent-guide/maps.md#air-atlas).

Consult when: Flight trails, lens or hit regions.

Rule coverage / supersession: Five-second delayed trail end; 5 km/5 min/256 points, missing/implausible breaks; selected spherical display lens A, coordinates unchanged, warped hits, flat controls and ordinary map fallback; physical gate remains.

<details><summary>Original wording for comparison</summary>

> Show understated dashed received-flight trails, bounded to 5 km / five minutes / 256 samples per aircraft; stop at the delayed display sample and break on missing or implausible observations. The owner selected A, a subtle spherical display lens, over a real globe or inclined terrain. Keep geographic coordinates unchanged, align aircraft/home hit regions with the warped map and trails, retain flat controls, and fall back to the ordinary map if the lens GPU context is unavailable. Physical Tesla acceptance remains separate from browser simulation.

</details>

### R073 — AGENTS.md:329-329

Original section: **Owner Fly With continuity and controls — 2026-09-10** ([byte-identical original](AGENTS.md.txt), lines 329–329). Outcome: **merged**.

Active destination(s): [docs/agent-guide/maps.md#fly-with](../../../docs/agent-guide/maps.md#fly-with), [docs/agent-guide/maps.md#air-atlas](../../../docs/agent-guide/maps.md#air-atlas).

Consult when: Flight camera continuity/zoom/action or selected marker geometry.

Rule coverage / supersession: Every-frame delayed camera/no tile wait, retain last DEM, no lost-signal motion; zoom held pose without camera-position change; prominent palette original icon; 54 ring/42 silhouette/about4 clearance/distance.

<details><summary>Original wording for comparison</summary>

> Fly With updates the camera every animation frame from the measured five-second delayed track, without waiting for every new map tile. Preserve the last terrain height during missing DEM samples instead of dropping to zero. Do not invent motion after signal loss. Keep optical zoom in/out/reset reachable in the flight view, preserving the aircraft camera position; a held pose can still be zoomed. Give Fly With a prominent palette-colored action and original outline view/flight icon. The selected aircraft has one 54 px ring around its 42 px silhouette, with approximately 4 px inner clearance and the distance below it.

</details>

### R074 — AGENTS.md:334-334

Original section: **Owner radar coverage refinement — 2026-09-10** ([byte-identical original](AGENTS.md.txt), lines 334–334). Outcome: **merged**.

Active destination(s): [docs/agent-guide/maps.md#air-atlas](../../../docs/agent-guide/maps.md#air-atlas).

Consult when: Radar viewport, provider coverage or refresh.

Rule coverage / supersession: Visible area follows zoom/pan, bounded coverage, no nearest32, position vs message age, manual/selected refresh respects backoff and no false freshness. Specific verified current bounds are linked, not guessed.

<details><summary>Original wording for comparison</summary>

> Air Atlas traffic must follow the visible radar area on zoom and pan. Preserve bounded provider coverage, remove the nearest-32 display cutoff, and distinguish actual position age from message age. Manual and selected-aircraft refresh must respect backoff and never make old observations appear fresh.

</details>

### P001 — prototype/drive-lab/AGENTS.md:3-3

Original section: **Prototype Instructions** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 3–3). Outcome: **moved**.

Active destination(s): [prototype/drive-lab/AGENTS.md#local-work](../../../prototype/drive-lab/AGENTS.md#local-work).

Consult when: Requested runnable preview.

Rule coverage / supersession: Agent starts and opens available preview itself within task scope; not a server mandate for documentation-only work.

<details><summary>Original wording for comparison</summary>

> Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

</details>

### P002 — prototype/drive-lab/AGENTS.md:5-5

Original section: **Prototype Instructions** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 5–5). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#design-decisions](../../../docs/agent-guide/interface.md#design-decisions), [AGENTS.md#working-agreement](../../../AGENTS.md#working-agreement).

Consult when: Substantial visual change with unclear source, or durable contract amendment.

Rule coverage / supersession: Preserve context/fidelity intent; unavailable get-context replaced by installed Product Design entry routing, no global skill change. User explicitly requests relevant contract maintenance instead of root diary.

<details><summary>Original wording for comparison</summary>

> Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

</details>

### P003 — prototype/drive-lab/AGENTS.md:7-7

Original section: **Prototype Instructions** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 7–7). Outcome: **moved**.

Active destination(s): [docs/agent-guide/interface.md#design-decisions](../../../docs/agent-guide/interface.md#design-decisions).

Consult when: Selected-image implementation.

Rule coverage / supersession: Exact visual fidelity contract and explicit owner amendments preserved.

<details><summary>Original wording for comparison</summary>

> When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

</details>

### P004 — prototype/drive-lab/AGENTS.md:11-11

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 11–11). Outcome: **moved**.

Active destination(s): [docs/agent-guide/visuals.md#aperture-and-rejected-studies](../../../docs/agent-guide/visuals.md#aperture-and-rejected-studies).

Consult when: Aperture rendering.

Rule coverage / supersession: Selected Modular Aperture rest/tunnel/deceleration behavior.

<details><summary>Original wording for comparison</summary>

> - The approved Flux direction is **Modular Aperture**: a sparse rectangular field that is flat and calm at rest, forms a centered tunnel with normalized energy, and releases coherently during deceleration.

</details>

### P005 — prototype/drive-lab/AGENTS.md:12-12

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 12–12). Outcome: **updated**.

Active destination(s): [docs/agent-guide/visuals.md#aperture-and-rejected-studies](../../../docs/agent-guide/visuals.md#aperture-and-rejected-studies), [docs/agent-guide/interface.md#chrome-and-drawers](../../../docs/agent-guide/interface.md#chrome-and-drawers).

Consult when: Tunnel or resting/wake behavior.

Rule coverage / supersession: Dark void retained; fully retracted rest/speed-only/deliberate wake/no passive wake retained; stale-focus retention superseded by P067; moving wake corrected by P075.

<details><summary>Original wording for comparison</summary>

> - The tunnel terminus is a dark void, never a bright portal. At rest, header and footer must retreat completely off-canvas, secondary readouts disappear, and only speed plus its unit remain visible; the first deliberate pointer press/touch wakes chrome without changing a value. GPS updates, demo acceleration/braking, regeneration and passive pointer movement must never wake it; keyboard focus may keep an intentionally focused control accessible.

</details>

### P006 — prototype/drive-lab/AGENTS.md:13-13

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 13–13). Outcome: **moved**.

Active destination(s): [docs/agent-guide/interface.md#shared-geometry-and-palette](../../../docs/agent-guide/interface.md#shared-geometry-and-palette).

Consult when: Shared styling or palette.

Rule coverage / supersession: Swiss/Braun flat typography/grid, no knobs/glassmorphism/decorative chrome; curated palette field+accent and no paint/shader controls. Explicit circular artwork exceptions maintained.

<details><summary>Original wording for comparison</summary>

> - The Flux interface is Braun-influenced, Swiss, minimal, and slightly brutalist: flat black/off-white surfaces, a strict typographic grid with tabular numerals, square buttons, and sliders inside restrained rounded housings. Do not add circular buttons, knob controls, glassmorphism, or decorative chrome.

</details>

### P007 — prototype/drive-lab/AGENTS.md:14-14

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 14–14). Outcome: **moved**.

Active destination(s): [docs/agent-guide/interface.md#shared-geometry-and-palette](../../../docs/agent-guide/interface.md#shared-geometry-and-palette).

Consult when: Shared styling or palette.

Rule coverage / supersession: Swiss/Braun flat typography/grid, no knobs/glassmorphism/decorative chrome; curated palette field+accent and no paint/shader controls. Explicit circular artwork exceptions maintained.

<details><summary>Original wording for comparison</summary>

> - `PALETTE` is the purposeful colour control for the complete Flux surface. Its curated themes change both the generative field and the interface accent without exposing low-level shader parameters; do not return to the vehicle-paint metaphor.

</details>

### P008 — prototype/drive-lab/AGENTS.md:15-15

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 15–15). Outcome: **merged**.

Active destination(s): [docs/agent-guide/visuals.md#drivey](../../../docs/agent-guide/visuals.md#drivey).

Consult when: Drivey themes, steering, bridge or speed response.

Rule coverage / supersession: Two simultaneous accent+secondary channels Normal/Wire, automatic upstream Input/road following/no manual steering/only lane weave removed; quadratic compensation, synchronized traffic/reveal, exact 5/40/90/130 tests, no vendor edits.

<details><summary>Original wording for comparison</summary>

> - Every DRIVEY theme renders its native `accent` and `secondary` colours as two simultaneous material channels in both Normal and Wire modes; never collapse the pair into one interpolated tint.

</details>

### P009 — prototype/drive-lab/AGENTS.md:16-16

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 16–16). Outcome: **merged**.

Active destination(s): [docs/agent-guide/visuals.md#drivey](../../../docs/agent-guide/visuals.md#drivey).

Consult when: Drivey themes, steering, bridge or speed response.

Rule coverage / supersession: Two simultaneous accent+secondary channels Normal/Wire, automatic upstream Input/road following/no manual steering/only lane weave removed; quadratic compensation, synchronized traffic/reveal, exact 5/40/90/130 tests, no vendor edits.

<details><summary>Original wording for comparison</summary>

> - DRIVEY defaults to the original automatic road follower. Preserve its upstream `Input` class and road/curve steering, suppress manual steering in the product surface, and remove only the player car's random lane weaving.

</details>

### P010 — prototype/drive-lab/AGENTS.md:17-17

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 17–17). Outcome: **moved**.

Active destination(s): [docs/agent-guide/visuals.md#aperture-and-rejected-studies](../../../docs/agent-guide/visuals.md#aperture-and-rejected-studies).

Consult when: Rejected studies, reference handling or visual backlog.

Rule coverage / supersession: WAKE no salvage until new selection; private approved images retained; Laminar independent reinterpretation; unselected Switchback/Rolling Register backlog preserved.

<details><summary>Original wording for comparison</summary>

> - WAKE is rejected with no salvage path. Its ribbons, renderer, fallback, tests, QA captures, and active documentation stay outside the product until a new direction is explicitly selected through a future three-direction gate.

</details>

### P011 — prototype/drive-lab/AGENTS.md:18-18

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 18–18). Outcome: **moved**.

Active destination(s): [docs/agent-guide/visuals.md#aperture-and-rejected-studies](../../../docs/agent-guide/visuals.md#aperture-and-rejected-studies).

Consult when: Rejected studies, reference handling or visual backlog.

Rule coverage / supersession: WAKE no salvage until new selection; private approved images retained; Laminar independent reinterpretation; unselected Switchback/Rolling Register backlog preserved.

<details><summary>Original wording for comparison</summary>

> - Preserve the approved Modular Aperture and Laminar Product Design images only in the ignored local reference library. Laminar is visibly close to the Infinite Lights mechanics study and must be independently reinterpreted before any implementation.

</details>

### P012 — prototype/drive-lab/AGENTS.md:19-19

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 19–19). Outcome: **merged**.

Active destination(s): [docs/agent-guide/visuals.md#vertigo-02](../../../docs/agent-guide/visuals.md#vertigo-02).

Consult when: Vertigo work.

Rule coverage / supersession: Complete exact upstream pin/scene/dependencies, hidden editorial shell and narrowly permitted external controls merged with R028 without loss.

<details><summary>Original wording for comparison</summary>

> - `VERTIGO 02` is the selected second Flux environment and uses the byte-identical upstream Interstate 7 runtime from commit `e58d58520bc0dfde21f9e14e6a1b8c7f0a2a2a9e`. Preserve the complete third-party scene and files unchanged, including the road, repeated side light sticks, car trails, bloom, camera, distortion, and bundled dependencies. Keep its iframe black until the external bridge hides the upstream editorial shell. The bridge maps sedicivalvole speed to the original time/FOV controls and may update existing runtime colour buffers/uniforms from the selected theme without editing vendor files.

</details>

### P013 — prototype/drive-lab/AGENTS.md:20-20

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 20–20). Outcome: **merged**.

Active destination(s): [docs/agent-guide/motion-runtime.md#energy-and-mode-boundary](../../../docs/agent-guide/motion-runtime.md#energy-and-mode-boundary), [docs/agent-guide/music.md#authored-score](../../../docs/agent-guide/music.md#authored-score).

Consult when: Music/visual energy mapping or selectors.

Rule coverage / supersession: Fixed130, tunnel40, retired slider and truthful genre readiness reachable from both music and visual routing.

<details><summary>Original wording for comparison</summary>

> - The user-adjustable full-energy threshold is retired. Use `130 km/h` as the fixed legal-road visual/score ceiling, make the Aperture tunnel clearly visible by approximately `40 km/h`, and reserve the former threshold slot for truthful visual/score selection. Do not label an unimplemented musical genre as active.

</details>

### P014 — prototype/drive-lab/AGENTS.md:21-21

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 21–21). Outcome: **moved**.

Active destination(s): [docs/agent-guide/visuals.md#aperture-and-rejected-studies](../../../docs/agent-guide/visuals.md#aperture-and-rejected-studies).

Consult when: Rejected studies, reference handling or visual backlog.

Rule coverage / supersession: WAKE no salvage until new selection; private approved images retained; Laminar independent reinterpretation; unselected Switchback/Rolling Register backlog preserved.

<details><summary>Original wording for comparison</summary>

> - Keep the unselected Laminar Switchback and Rolling Register directions in the ignored local visual backlog; do not discard or present them as implemented environments.

</details>

### P015 — prototype/drive-lab/AGENTS.md:22-22

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 22–22). Outcome: **updated**.

Active destination(s): [docs/agent-guide/motion-runtime.md#energy-and-mode-boundary](../../../docs/agent-guide/motion-runtime.md#energy-and-mode-boundary).

Consult when: Shared mode ownership.

Rule coverage / supersession: Equal Engine/Flux retained; public Music and implemented Engine supersede Flux-only current-state wording. Shared speed/diagnostics/unlock/Stop/Mute/safety/accessibility, no actual car telemetry claims.

<details><summary>Original wording for comparison</summary>

> - The product has two equal, always-selectable primary modes: `Engine` and `Flux`.

</details>

### P016 — prototype/drive-lab/AGENTS.md:23-23

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 23–23). Outcome: **updated**.

Active destination(s): [docs/agent-guide/motion-runtime.md#energy-and-mode-boundary](../../../docs/agent-guide/motion-runtime.md#energy-and-mode-boundary).

Consult when: Shared mode ownership.

Rule coverage / supersession: Equal Engine/Flux retained; public Music and implemented Engine supersede Flux-only current-state wording. Shared speed/diagnostics/unlock/Stop/Mute/safety/accessibility, no actual car telemetry claims.

<details><summary>Original wording for comparison</summary>

> - The current Drive Lab implementation is the `Flux` mode: an authored adaptive arrangement with the procedural Modular Aperture WebGL field.

</details>

### P017 — prototype/drive-lab/AGENTS.md:24-24

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 24–24). Outcome: **updated**.

Active destination(s): [docs/agent-guide/engine.md#output-and-road-response](../../../docs/agent-guide/engine.md#output-and-road-response), [docs/agent-guide/interface.md#design-decisions](../../../docs/agent-guide/interface.md#design-decisions).

Consult when: Engine visual changes.

Rule coverage / supersession: Engine has separate selectable models/instrument visual; explicit Telemetry selection in ENGINE-INTEGRATION / Accepted scope resolves initial visual gate, future redesign still requires selection.

<details><summary>Original wording for comparison</summary>

> - `Engine` is a separate engine-emulation mode with selectable engine sound models and an instrument-inspired generative visual system. Do not implement its final visual direction before presenting exactly three Engine-specific directions.

</details>

### P018 — prototype/drive-lab/AGENTS.md:25-25

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 25–25). Outcome: **updated**.

Active destination(s): [docs/agent-guide/motion-runtime.md#energy-and-mode-boundary](../../../docs/agent-guide/motion-runtime.md#energy-and-mode-boundary).

Consult when: Shared mode ownership.

Rule coverage / supersession: Equal Engine/Flux retained; public Music and implemented Engine supersede Flux-only current-state wording. Shared speed/diagnostics/unlock/Stop/Mute/safety/accessibility, no actual car telemetry claims.

<details><summary>Original wording for comparison</summary>

> - Mode switching shares the normalized speed source, diagnostics, audio-unlock lifecycle, master Stop/Mute, safety limits, and accessibility behavior. Never imply access to real RPM, throttle, gear, or CAN data without evidence.

</details>

### P019 — prototype/drive-lab/AGENTS.md:26-26

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 26–26). Outcome: **updated**.

Active destination(s): [docs/agent-guide/visuals.md#shared-boundaries](../../../docs/agent-guide/visuals.md#shared-boundaries).

Consult when: New original field or selected geographic/source integration.

Rule coverage / supersession: Abstract/minimal/no characters default retained; explicit selected Drivey/maps are scoped exceptions, not retroactive bans on accepted product.

<details><summary>Original wording for comparison</summary>

> - Keep the scene abstract, minimal and atmospheric; no scenery, characters or illustrative decoration.

</details>

### P020 — prototype/drive-lab/AGENTS.md:27-28

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 27–28). Outcome: **merged**.

Active destination(s): [docs/agent-guide/visuals.md#gradient-08](../../../docs/agent-guide/visuals.md#gradient-08).

Consult when: Gradient renderer, old preference, LAB or road response.

Rule coverage / supersession: Retired custom renderer/no return, legacy Japanese Mist; exact 3 variants/family, original LAB geometry/motion and palette colors, braking fold/release, Soundtrack speed-only vs bounded scored audio, lazy chunk/MIT/fallback/reduced motion/130/Tesla, mechanics-only FeralUI/ColorFlow.

<details><summary>Original wording for comparison</summary>

> - The retired project-owned `GRADIENT 08` renderer must not return. Its saved
>   preference migrates to the **Japanese Mist** variant of the new family.

</details>

### P021 — prototype/drive-lab/AGENTS.md:29-43

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 29–43). Outcome: **merged**.

Active destination(s): [docs/agent-guide/visuals.md#gradient-08](../../../docs/agent-guide/visuals.md#gradient-08).

Consult when: Gradient renderer, old preference, LAB or road response.

Rule coverage / supersession: Retired custom renderer/no return, legacy Japanese Mist; exact 3 variants/family, original LAB geometry/motion and palette colors, braking fold/release, Soundtrack speed-only vs bounded scored audio, lazy chunk/MIT/fallback/reduced motion/130/Tesla, mechanics-only FeralUI/ColorFlow.

<details><summary>Original wording for comparison</summary>

> - The exact MIT ShaderGradient / Three / R3F stack powers one owner-selected
>   public **GRADIENT 08** family with three internal variants: **Japanese Mist**,
>   **Acid Orchard**, and **Chromatic Silk**. The launch and running catalogues
>   expose one family entry; a persistent in-visual `VARIANT` control cycles the
>   three variants without reopening a catalogue. They retain the exact
>   registered LAB geometry and motion settings while the selected product
>   palette supplies both primary colours plus one light-tinted derivative.
>   Project-owned road/audio response must make braking visibly fold and densify
>   the field, then restore the exact road state. Keep Soundtrack speed-only;
>   Play the Road may add bounded audio
>   response. Load the upstream stack only when one of these variants is selected,
>   keep it in a separate product chunk, retain the MIT
>   notice, preserve the Canvas2D fallback and reduced-motion path, and hold all
>   response at the `130 km/h` ceiling. Target-Tesla GPU acceptance remains a gate.
>   FeralUI and ColorFlow remain mechanics references only.

</details>

### P022 — prototype/drive-lab/AGENTS.md:44-49

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 44–49). Outcome: **moved**.

Active destination(s): [docs/agent-guide/visuals.md#prtcl](../../../docs/agent-guide/visuals.md#prtcl).

Consult when: PRTCL forms, braking or selection.

Rule coverage / supersession: Fractal/Axiom active and Murmuration parked; complete-form collapse22.5%, point27.5%, quick exact speed-scale restore, no subtle-glow substitute.

<details><summary>Original wording for comparison</summary>

> - PRTCL exposes Fractal and Axiom; Murmuration is parked outside the active
>   product until a new owner decision. UNDERWATER must collapse both complete
>   forms dramatically, with Fractal holding at `22.5%` of its natural form scale
>   and `27.5%` of its natural point scale, then surface quickly back to the exact
>   speed-owned scale as braking releases. Do not reduce this to a subtle glow or
>   point-size-only treatment.

</details>

### P023 — prototype/drive-lab/AGENTS.md:50-56

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 50–56). Outcome: **moved**.

Active destination(s): [docs/agent-guide/interface.md#chrome-and-drawers](../../../docs/agent-guide/interface.md#chrome-and-drawers).

Consult when: Shared drawer gestures.

Rule coverage / supersession: CLOSE/Escape/backdrop/dominant exit swipe, non-control capture, app overscroll, 28px native edge yielding and no disable claim.

<details><summary>Original wording for comparison</summary>

> - Every shared drawer closes through CLOSE, Escape, a tap on the exposed
>   backdrop, or one dominant directional swipe matching its exit. Capture the
>   pointer after a non-control drag begins, suppress browser overscroll within
>   the app, and reserve the first `28 px` of the left edge for Chromium's native
>   history gesture so one physical swipe cannot commit both actions. Never claim
>   the embedded Tesla Chromium gesture can be disabled; the app owns interior
>   swipes and deliberately yields the native edge.

</details>

### P024 — prototype/drive-lab/AGENTS.md:57-57

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 57–57). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#intro-and-branding](../../../docs/agent-guide/interface.md#intro-and-branding).

Consult when: Launch flow.

Rule coverage / supersession: PLAY THE ROAD brand-first step replaced explicitly by P083/Launch Cockpit single START; fade into running and silent preparation intent retained.

<details><summary>Original wording for comparison</summary>

> - The initial flow is one deliberate `PLAY THE ROAD` gesture, then a continuous fade into Drive Lab.

</details>

### P025 — prototype/drive-lab/AGENTS.md:58-58

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 58–58). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#intro-and-branding](../../../docs/agent-guide/interface.md#intro-and-branding), [docs/agent-guide/interface.md#design-decisions](../../../docs/agent-guide/interface.md#design-decisions).

Consult when: Launch background/support/identity.

Rule coverage / supersession: Signal Gate generative WebGL2+Canvas2D lanes/colors/gate retained. Old CTA and top-left support placement replaced by P083/P090; real credit/source/local note, QR/destination and no fabricated donation count retained, conditional playful15 disclosure preserved.

<details><summary>Original wording for comparison</summary>

> - The approved splash is the **Signal Gate** direction: paired vermilion and ice-blue light lanes bend from the lower edges into a narrow central vertical gate on black. Implement it as a restrained generative WebGL2 field with a Canvas2D fallback, not a static raster. The single large CTA reads `PLAY THE ROAD`; the `A project by enuzzo` / Illobo credit, public source and local-capability note sit below it at a clearly readable scale, never ultra-small. The restrained top-left Buy Me a Coffee control uses the verified `buymeacoffee.com/enuzzo` destination, the supplied QR and a payment-independent suggestion invitation. A playful project-energy signal may grow slowly from 15 only when it is explicitly labelled as not representing purchases; never fabricate a donation or customer total.

</details>

### P026 — prototype/drive-lab/AGENTS.md:59-59

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 59–59). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#intro-and-branding](../../../docs/agent-guide/interface.md#intro-and-branding).

Consult when: Brand wordmarks or launch layout.

Rule coverage / supersession: 360x160 launch surface/42mark retired with explicit brand-click removal; Orbitron750/-0.02em, 16 mark, Space Grotesk elsewhere, semantic functional controls and no fake appliance parts retained.

<details><summary>Original wording for comparison</summary>

> - The approved Signal Gate CTA is one flat, non-skeuomorphic `360 × 160 px` launch surface at the Tesla split viewport: warm ivory frame, the selected `42 px` 16 Road mark beside a lowercase Orbitron `750` `sedicivalvole` wordmark with restrained `-0.02em` tracking, and a full-width black Space Grotesk activation field containing only `PLAY THE ROAD`. Exact textual `sedicivalvole` project wordmarks in the Signal Gate, Instrument Deck and owner LAB use the same isolated Orbitron treatment; the running top bar uses only the 16 Road mark when space permits, and all other interface/report typography remains Space Grotesk. Keep the welcome as one semantic launch button; do not add simulated buttons, knobs, vents, latches, safety inserts or other nonfunctional appliance controls.

</details>

### P027 — prototype/drive-lab/AGENTS.md:60-60

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 60–60). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#intro-and-branding](../../../docs/agent-guide/interface.md#intro-and-branding).

Consult when: Intro composition.

Rule coverage / supersession: Road Sheet fixed grid/equal block edges superseded by P083/P087/R068 compact media/action row selection; semantic shell/START/intrinsic height remain. Does not reintroduce auto-growing deck.

<details><summary>Original wording for comparison</summary>

> - The selected Instrument Deck restyle is **Road Sheet**: one warm-light open sheet over the Signal Gate, a large light 16 Road mark and Orbitron wordmark, black/ink typography, light-grey direct-choice controls, restrained vermilion selection rails, and one black `START` field. At `773 × 601`, the MUSIC button stack and VISUAL button grid must align to exactly the same top and bottom edges. Keep the visual grid's overall height fixed and derive its row count from the registry so a third row compacts inside the existing block rather than enlarging the deck or moving `START`.

</details>

### P028 — prototype/drive-lab/AGENTS.md:61-61

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 61–61). Outcome: **merged**.

Active destination(s): [docs/agent-guide/interface.md#shared-geometry-and-palette](../../../docs/agent-guide/interface.md#shared-geometry-and-palette), [docs/agent-guide/interface.md#chrome-and-drawers](../../../docs/agent-guide/interface.md#chrome-and-drawers), [docs/agent-guide/maps.md#atlas-and-stats](../../../docs/agent-guide/maps.md#atlas-and-stats).

Consult when: Type, targets, bars, modal or catalogue behavior.

Rule coverage / supersession: Exact role ladder,48/56 targets,64 navbar/Now Playing/footer, ATLAS/modal suppression, full field,6px contextual cycles, real caret libraries. Surface-specific map geometry is not silently discarded.

<details><summary>Original wording for comparison</summary>

> - Controls are touch-first, flat, and fully legible; the GL field provides the visual contrast. The owner-selected **Tesla Compact** refinement replaces the retired blanket Automotive Glance floor with semantic roles shared by the public product, owner LAB, ShaderGradient workbench, diagnostics, attribution, and responsive states: `13 px` metadata, `14 px` labels, `15 px` body/action copy, `17 px` active names, `22 px` titles, and `32 px` primary values. Keep metadata high contrast, use tabular numerals for changing data, keep important action targets at least `48 px` and primary actions `56 px`, and preserve the full ladder rather than collapsing every role to one size. At the verified `773 x 601` viewport, the retracting top bar, lower Now Playing band and footer are each `64 px`; modal passenger surfaces suppress all global chrome and Now Playing, while ATLAS suppresses Now Playing and expands its panel to full height when chrome rests. Contextual visual-cycle controls retract with chrome and use the shared `6 px` radius. Visual/Music open explicit caret-marked libraries rather than cycling blindly.

</details>

### P029 — prototype/drive-lab/AGENTS.md:62-62

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 62–62). Outcome: **updated**.

Active destination(s): [docs/agent-guide/music.md#soundtrack-and-selection](../../../docs/agent-guide/music.md#soundtrack-and-selection), [docs/agent-guide/music.md#effects-boundary](../../../docs/agent-guide/music.md#effects-boundary).

Consult when: Music source switch/catalogue/FX.

Rule coverage / supersession: Persistent sources, Illobo/Jamendo equal,30min cadence, immediate choices/pace discovery/1x, universal MUTE/FX preserved. OPEN/BLOOM part of old macro set replaced explicitly by MUSIC-CRAFT6.16; Underwater remains.

<details><summary>Original wording for comparison</summary>

> - The running Music drawer has one persistent `Play the Road` / `Soundtrack` switch. Soundtrack gives compact equal hierarchy to `Illobo Featured` and `Jamendo Library`, rotates its displayed playlist and cover preview on a stable 30-minute window, and states that cadence. Jamendo pace, genre, and exact-track controls start playback immediately; pace is catalogue discovery only and never road-speed automation or playback-rate control. All fixed recordings stay at authored `1×`. Footer MUTE and FX are universal across both music sources; FX off silences OPEN/UNDERWATER/BLOOM audio processing without suppressing the same macros in visuals.

</details>

### P030 — prototype/drive-lab/AGENTS.md:63-66

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 63–66). Outcome: **moved**.

Active destination(s): [docs/agent-guide/music.md#soundtrack-and-selection](../../../docs/agent-guide/music.md#soundtrack-and-selection).

Consult when: Soundtrack startup or transport buffering.

Rule coverage / supersession: Immediate START/mute/truthful pending, exact three roles/preload metadata/6s floor/healthy previous/target silent wait+rewind/outgoing committed continuity/stable media handlers/ordered rapid commands/speed-only black module preserved.

<details><summary>Original wording for comparison</summary>

> - Soundtrack selection must never block `START`. Enter the visual immediately,
>   state truthfully when remote music data is pending or the browser reports a
>   constrained connection, and start prepared audio automatically when it
>   arrives. Mute follows the same launch path; it is not a hidden bypass.

</details>

### P031 — prototype/drive-lab/AGENTS.md:67-67

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 67–67). Outcome: **moved**.

Active destination(s): [docs/agent-guide/music.md#soundtrack-and-selection](../../../docs/agent-guide/music.md#soundtrack-and-selection).

Consult when: Soundtrack startup or transport buffering.

Rule coverage / supersession: Immediate START/mute/truthful pending, exact three roles/preload metadata/6s floor/healthy previous/target silent wait+rewind/outgoing committed continuity/stable media handlers/ordered rapid commands/speed-only black module preserved.

<details><summary>Original wording for comparison</summary>

> - Keep exactly three transient Soundtrack media roles. The current role owns `preload=auto`; adjacent roles begin at metadata-only and may promote to audio only after the current recording has `6 s` of forward buffer or reports enough data. PREVIOUS must rewind and reuse a healthy retained media element instead of destroying its browser buffer. Every initial, manual, or automatic change starts the target silently, waits for the same buffer floor inside the bounded transport deadline, rewinds it, and only then makes it audible; the committed outgoing track and metadata remain intact during that wait. Browser Media Session owns stable session-lifetime play, pause, previous, and next handlers, and rapid transport commands execute in exact order. In Soundtrack, the black source module shows speed only—no `FLUX`, BPM or energy.

</details>

### P032 — prototype/drive-lab/AGENTS.md:68-68

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 68–68). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#running-media-and-effects](../../../docs/agent-guide/interface.md#running-media-and-effects).

Consult when: Running Now Playing.

Rule coverage / supersession: Artwork/title/artist-source/transport/committed identity persistence retained; independent overlay superseded by P066 footer animated/inert ownership and menu suppression.

<details><summary>Original wording for comparison</summary>

> - Whenever the driving chrome is awake, one persistent lower Now Playing overlay sits immediately above the footer and contains artwork, title, artist/source, and previous/play-pause/next. It follows every committed Illobo or Jamendo identity, including natural automatic changes and changes initiated inside a drawer; it retracts with the chrome but must not become a transient toast.

</details>

### P033 — prototype/drive-lab/AGENTS.md:69-69

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 69–69). Outcome: **moved**.

Active destination(s): [docs/agent-guide/interface.md#running-media-and-effects](../../../docs/agent-guide/interface.md#running-media-and-effects), [docs/agent-guide/music.md#soundtrack-and-selection](../../../docs/agent-guide/music.md#soundtrack-and-selection).

Consult when: Music drawer typography/controls/covers.

Rule coverage / supersession: 773x601 scroll rather than sub-role/sub-target sizing, whole-surface chips/rows/icons, three real scores only, title-specific Illobo covers vs playlist marks.

<details><summary>Original wording for comparison</summary>

> - At the `773 × 601` Tesla viewport, Music preserves the Swiss Compact role hierarchy and uses deliberate vertical scrolling whenever the available content no longer fits: Pace and Genre are whole-surface one-tap chips with standard media icons, and track rows are whole-surface controls. Never recover a no-scroll composition by taking typography below its semantic role or primary controls below their touch geometry. Play the Road lists only the three scores that can actually play, each with concise listener-facing copy and its own coherent cover; roadmap-only scores stay out of the running drawer. Illobo tracks use a coherent title-specific cover collection while the two supplied Illobo marks remain the playlist identity.

</details>

### P034 — prototype/drive-lab/AGENTS.md:70-70

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 70–70). Outcome: **moved**.

Active destination(s): [docs/agent-guide/interface.md#running-media-and-effects](../../../docs/agent-guide/interface.md#running-media-and-effects).

Consult when: Chart icon or appearance tokens.

Rule coverage / supersession: White visible dark icon/NOW PLAYING one line; original black vendor SVG unchanged/non-destructive future appearance roles.

<details><summary>Original wording for comparison</summary>

> - In the current dark Music drawer, the Now Playing chart icon must be visibly white and `NOW PLAYING` must remain on one line. Preserve the pinned black `chart-bar.svg` source unchanged: DARK applies its white presentation non-destructively, and future `LIGHT / DARK / AUTO` tokens must select the appropriate contrast without duplicating or recolouring the vendor asset.

</details>

### P035 — prototype/drive-lab/AGENTS.md:71-71

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 71–71). Outcome: **merged**.

Active destination(s): [docs/agent-guide/visuals.md#drivey](../../../docs/agent-guide/visuals.md#drivey).

Consult when: Drivey themes, steering, bridge or speed response.

Rule coverage / supersession: Two simultaneous accent+secondary channels Normal/Wire, automatic upstream Input/road following/no manual steering/only lane weave removed; quadratic compensation, synchronized traffic/reveal, exact 5/40/90/130 tests, no vendor edits.

<details><summary>Original wording for comparison</summary>

> - DRIVEY road travel must remain calibrated to the smoothed GPS speed. Reuse VERTIGO's quadratic low-speed response to compensate the original Drivey car model's square-root cruise physics, synchronize the player and opposing traffic before revealing the iframe, and retain exact `5 / 40 / 90 / 130 km/h` equilibrium tests. Never alter the pinned upstream runtime to achieve this.

</details>

### P036 — prototype/drive-lab/AGENTS.md:72-72

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 72–72). Outcome: **updated**.

Active destination(s): [docs/agent-guide/music.md#effects-boundary](../../../docs/agent-guide/music.md#effects-boundary).

Consult when: Macro schema or manual effects graph.

Rule coverage / supersession: snapshot.values typed boundary, two-stage Underwater; eight not four/manual processors including retained3/removeChorus/add5, bounded shared graph/no Beat Repeat retained. OPEN/BLOOM retired by explicit MUSIC-CRAFT6.16, not conflated with manual FX.

<details><summary>Original wording for comparison</summary>

> - Treat the vehicle-macro snapshot as a typed boundary: audible consumers read `snapshot.values`, never undeclared top-level aliases. Soundtrack and NIGHTSHIFT share the two-stage perceptual UNDERWATER model. The current four-effect graph is only a published baseline: the mandatory revision has exactly eight manual effects, retains Flanger/Reverb/Echo, removes Chorus, and adds five differentiated processors including progressive manual Underwater plus deliberate low/high-frequency transformations. All eight share one level-bounded post-source graph across Play the Road and Soundtrack; do not restore the retired Beat Repeat worklet.

</details>

### P037 — prototype/drive-lab/AGENTS.md:73-73

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 73–73). Outcome: **moved**.

Active destination(s): [docs/agent-guide/interface.md#running-media-and-effects](../../../docs/agent-guide/interface.md#running-media-and-effects), [docs/agent-guide/music.md#effects-boundary](../../../docs/agent-guide/music.md#effects-boundary).

Consult when: FX Deck UI or processing.

Rule coverage / supersession: MIX nonmodal 2x4 above footer, strong100% bounded/no artifacts, independent depth/reset/persistence/pin/no inert/no Music-drawer relocation.

<details><summary>Original wording for comparison</summary>

> - The selected manual-effects surface is **FX Deck**: a persistent footer `MIX` control opens a compact non-modal overlay above the footer while the visual keeps running. Expand it to a readable `2 × 4` touch layout; make every `100%` state highly distorted and unmistakable without click, silence, clipping, runaway feedback, or destructive level jumps. Retain independent depth sliders and one reset, persist values when switching between Play the Road and Soundtrack, and never return these controls to the bottom of the Music drawer. The deck may pin the controls open but must never enter the application's inert modal boundary.

</details>

### P038 — prototype/drive-lab/AGENTS.md:74-74

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 74–74). Outcome: **unresolved**.

Active destination(s): [docs/agent-guide/maps.md#atlas-and-stats](../../../docs/agent-guide/maps.md#atlas-and-stats).

Consult when: ATLAS attribution or location-sidebar work.

Rule coverage / supersession: Explicit14px attribution retained alongside generic13 metadata. Location handle ambiguity remains isolated; chart handle retirement is not assumed to revoke different location sidebar.

<details><summary>Original wording for comparison</summary>

> - ATLAS keeps its mandatory attribution low, translucent, and visually subordinate immediately above the footer, never as a large white pill. It uses the `14 px` metadata role at strong enough contrast to remain readable. The passenger-location sidebar collapses behind a persistent midpoint handle on the right edge; the collapsed state gives the full field back to the map and the same handle reopens it.

</details>

### P039 — prototype/drive-lab/AGENTS.md:75-75

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 75–75). Outcome: **updated**.

Active destination(s): [docs/agent-guide/maps.md#atlas-and-stats](../../../docs/agent-guide/maps.md#atlas-and-stats).

Consult when: Stats parity or historical ATLAS/sidebar geometry.

Rule coverage / supersession: 320 sidebar/340Canvas and old chart handle retired by P094. Metric list, elevation and15MIN/1H/SESSION information retained for parity. 36x30 icon tab/48x48 target/no full rail accessible reopen remains conditional on unresolved location-handle applicability; no generic moved-to-UI assertion.

<details><summary>Original wording for comparison</summary>

> - The owner-selected ATLAS direction is the composite **Drive Lab**: its Swiss Compact panel is `320 px` wide with a `340 px` Canvas2D instrument; the first line is Speed, Distance, Moving time, and Average speed; the two-by-two chart field is Accel/Braking balance, Speed-band distribution, Heading history, and Moving/Stopped; Elevation spans the complete bottom width. All charts follow the shared `15 MIN / 1 H / SESSION` range. ATLAS is not a place index: never add a DISCOVER action, Wikipedia reading, QR, or duplicated place cards. The persistent midpoint handle presents an icon-only `36 × 30 px` rectangular tab inside a `48 × 48 px` interactive target with an accessible action name and no visible text; never make it a full-height rail.

</details>

### P040 — prototype/drive-lab/AGENTS.md:76-85

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 76–85). Outcome: **updated**.

Active destination(s): [docs/agent-guide/maps.md#discover](../../../docs/agent-guide/maps.md#discover).

Consult when: Discover geometry/reader/QR/navigation.

Rule coverage / supersession: 52heading/24title/48tools/246rail preserved;64 row rhythm superseded by explicit Sept9 compact72px/15names/13meta (not code alone); +N MORE/full same scroll/complete sandbox article/Google Maps exploration no auto directions/no Atlas links preserved.

<details><summary>Original wording for comparison</summary>

> - DISCOVER is a separate passenger index and complete localized Wikipedia
>   reader. At `773 × 601`, keep its compact `52 px` heading band with a `24 px`
>   title, `48 px` tools, `64 px` result rhythm, and `246 px` searchable
>   language-aware rail readable at a glance; fill the available
>   height before inserting an exact `+N MORE` marker, retain every loaded result
>   in the same scroll, and render the complete selected article in a sandbox
>   with readable chapters, images and infoboxes. Its QR opens the selected place
>   in exploratory Google Maps search without starting navigation; the passenger
>   may refine, explore, share, or explicitly request Directions. It must not
>   open, switch to, or link back to ATLAS.

</details>

### P041 — prototype/drive-lab/AGENTS.md:86-89

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 86–89). Outcome: **moved**.

Active destination(s): [docs/agent-guide/maps.md#discover](../../../docs/agent-guide/maps.md#discover).

Consult when: Discover search/language/reader layout.

Rule coverage / supersession: Global noGPS language search/relevance, location only empty nearby/ahead/region; infobox/lead responsive limits/no crop or word-column, stack narrow only; no LANGUAGE label/compact scope/readable metadata retained.

<details><summary>Original wording for comparison</summary>

> - DISCOVER free-text search is global across the selected Wikipedia language,
>   independent of the current position and available without GPS. Preserve
>   Wikipedia relevance order for global results; use location and heading only
>   for the empty-search `NEARBY / AHEAD / REGION` scopes.

</details>

### P042 — prototype/drive-lab/AGENTS.md:90-94

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 90–94). Outcome: **updated**.

Active destination(s): [docs/agent-guide/visuals.md#aperture-and-rejected-studies](../../../docs/agent-guide/visuals.md#aperture-and-rejected-studies), [docs/agent-guide/interface.md#chrome-and-drawers](../../../docs/agent-guide/interface.md#chrome-and-drawers).

Consult when: Aperture grid or catalogue labels.

Rule coverage / supersession: One exact origin retained; no internal count advertisements; visible01–08 numbering superseded by P097 owner removal, stable internal IDs remain.

<details><summary>Original wording for comparison</summary>

> - APERTURE uses one exact longitudinal grid origin across ceiling, floor and
>   side walls so perspective cuts meet cleanly at every corner. Splash and
>   running Visual catalogue cards never advertise internal view, render, type,
>   or variant counts. Keep the stable `01–08` catalogue numbering in the running
>   drawer and let each visual reveal its own persistent internal controls.

</details>

### P043 — prototype/drive-lab/AGENTS.md:95-99

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 95–99). Outcome: **moved**.

Active destination(s): [docs/agent-guide/interface.md#chrome-and-drawers](../../../docs/agent-guide/interface.md#chrome-and-drawers).

Consult when: Network status indicator.

Rule coverage / supersession: Browser estimate/no cellular or active ping, readable named outlined dot, no NET ONLINE, actionable16px constrained/offline/downlink.

<details><summary>Original wording for comparison</summary>

> - The navbar network state is an honest browser connection estimate, never a
>   claimed cellular signal meter or an active ping service. A healthy state is
>   a readable outlined dot with an accessible name and no meaningless `NET
>   ONLINE` copy. Constrained and offline states show actionable `16 px` text,
>   including the browser-estimated downlink when available.

</details>

### P044 — prototype/drive-lab/AGENTS.md:100-100

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 100–100). Outcome: **moved**.

Active destination(s): [docs/agent-guide/maps.md#discover](../../../docs/agent-guide/maps.md#discover).

Consult when: Discover search/language/reader layout.

Rule coverage / supersession: Global noGPS language search/relevance, location only empty nearby/ahead/region; infobox/lead responsive limits/no crop or word-column, stack narrow only; no LANGUAGE label/compact scope/readable metadata retained.

<details><summary>Original wording for comparison</summary>

> - In the DISCOVER reader, a Wikipedia infobox or lead image must never compress the article lead into a word-column at the Tesla viewport. Keep the desktop two-column reading relationship, but cap floated infoboxes responsively, bound lead-image height without cropping, and stack them only when the reader itself becomes narrow.

</details>

### P045 — prototype/drive-lab/AGENTS.md:101-101

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 101–101). Outcome: **moved**.

Active destination(s): [docs/agent-guide/maps.md#discover](../../../docs/agent-guide/maps.md#discover).

Consult when: Discover search/language/reader layout.

Rule coverage / supersession: Global noGPS language search/relevance, location only empty nearby/ahead/region; infobox/lead responsive limits/no crop or word-column, stack narrow only; no LANGUAGE label/compact scope/readable metadata retained.

<details><summary>Original wording for comparison</summary>

> - Keep DISCOVER's language selector self-explanatory without a visible `LANGUAGE` label, keep the `NEARBY / AHEAD / REGION` scope row vertically compact, and render each result's distance/ETA metadata large enough for a passenger to read at a glance.

</details>

### P046 — prototype/drive-lab/AGENTS.md:102-102

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 102–102). Outcome: **updated**.

Active destination(s): [docs/agent-guide/motion-runtime.md#energy-and-mode-boundary](../../../docs/agent-guide/motion-runtime.md#energy-and-mode-boundary), [docs/agent-guide/maps.md#geographic-privacy](../../../docs/agent-guide/maps.md#geographic-privacy), [docs/agent-guide/diagnostics-reports.md#travel-report](../../../docs/agent-guide/diagnostics-reports.md#travel-report).

Consult when: GPS handling, geographic service or route export.

Rule coverage / supersession: Shared normalized speed retained. Universal coordinates ban explicitly narrowed by selected source-coordinate POIs, optional route export R052 and Air Atlas forwarding approval; no diagnostic geography remains invariant. No unrelated location authority.

<details><summary>Original wording for comparison</summary>

> - GPS and demo feed the same normalized speed signal; never display, persist or transmit coordinates.

</details>

### P047 — prototype/drive-lab/AGENTS.md:103-103

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 103–103). Outcome: **moved**.

Active destination(s): [docs/agent-guide/motion-runtime.md#gps-and-simulator](../../../docs/agent-guide/motion-runtime.md#gps-and-simulator).

Consult when: Desktop simulator/GPS continuity.

Rule coverage / supersession: Held Space exact-speed stronger brake/settle, Model3 time curve soft GPS envelope only; ArrowUp hold/release and ArrowDown nominal lift/auto Demo same; no arbitrary timed GPS switch or jump. Precise source/curve references routed.

<details><summary>Original wording for comparison</summary>

> - In the desktop simulator, holding `Space` continuously brakes from the exact displayed speed and releasing it resumes the Demo after a short settle. Use the documented time-based Model 3 AWD reference curve for Demo acceleration/braking and only as a soft plausibility envelope for real GPS; never synthesize GPS motion.

</details>

### P048 — prototype/drive-lab/AGENTS.md:104-104

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 104–104). Outcome: **moved**.

Active destination(s): [docs/agent-guide/motion-runtime.md#gps-and-simulator](../../../docs/agent-guide/motion-runtime.md#gps-and-simulator).

Consult when: Desktop simulator/GPS continuity.

Rule coverage / supersession: Held Space exact-speed stronger brake/settle, Model3 time curve soft GPS envelope only; ArrowUp hold/release and ArrowDown nominal lift/auto Demo same; no arbitrary timed GPS switch or jump. Precise source/curve references routed.

<details><summary>Original wording for comparison</summary>

> - Treat `ArrowUp` as a held accelerator. Its release and `ArrowDown` enter the documented nominal regenerative lift-off curve from the exact current speed; never return to GPS on an arbitrary timer or introduce a speed discontinuity. Automatic Demo deceleration uses the same lift-off model, while `Space` remains the stronger service-brake input.

</details>

### P049 — prototype/drive-lab/AGENTS.md:105-105

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 105–105). Outcome: **updated**.

Active destination(s): [docs/agent-guide/diagnostics-reports.md#capture-and-presentation](../../../docs/agent-guide/diagnostics-reports.md#capture-and-presentation), [docs/agent-guide/diagnostics-reports.md#automatic-delivery](../../../docs/agent-guide/diagnostics-reports.md#automatic-delivery).

Consult when: Diagnostic capture or delivery.

Rule coverage / supersession: Original safe aggregate/trace/interaction fields and exclusions, bounded session-only sampling outside React and full-session aggregates preserved. Explicit gestures still work; manual-only/no automatic text superseded solely by R050/R060 authorized coordinate-free active-session delivery, not arbitrary telemetry.

<details><summary>Original wording for comparison</summary>

> - Extended diagnostics may aggregate frame pacing, connection changes, GPS accuracy/cadence, audio/runtime state, memory, storage, navigation/resource timing, and bounded events. Keep the fixed recipient in ignored local configuration, transmit only after the explicit SEND DIAGNOSTIC gesture, and never collect coordinates or enable automatic remote telemetry.

</details>

### P050 — prototype/drive-lab/AGENTS.md:106-106

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 106–106). Outcome: **moved**.

Active destination(s): [docs/agent-guide/diagnostics-reports.md#capture-and-presentation](../../../docs/agent-guide/diagnostics-reports.md#capture-and-presentation).

Consult when: REPORT entry or runtime measurements.

Rule coverage / supersession: Pinned labeled report icon not gear/tooltip, main-product access; bounded per-phase FPS/timing/heap/PCM/bank sizes outside per-frame React; unavailable APIs truthful.

<details><summary>Original wording for comparison</summary>

> - The product-facing diagnostic entry point is `REPORT`: keep the pinned Tabler report-analytics outline icon above an explicit visible label in the compact top-bar cell. Do not replace it with a gear, an icon-only affordance, or a hover-dependent tooltip; internal diagnostic identifiers may remain technical.

</details>

### P051 — prototype/drive-lab/AGENTS.md:107-107

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 107–107). Outcome: **moved**.

Active destination(s): [docs/agent-guide/diagnostics-reports.md#capture-and-presentation](../../../docs/agent-guide/diagnostics-reports.md#capture-and-presentation).

Consult when: REPORT entry or runtime measurements.

Rule coverage / supersession: Pinned labeled report icon not gear/tooltip, main-product access; bounded per-phase FPS/timing/heap/PCM/bank sizes outside per-frame React; unavailable APIs truthful.

<details><summary>Original wording for comparison</summary>

> - Performance diagnostics must retain bounded phase-specific summaries for splash, active Visual/Music combinations and the session-report-open state. Record FPS/frame-time distributions, browser-exposed JavaScript heap, decoded PCM and bank sizes without per-frame React state; report unsupported memory APIs truthfully as unavailable.

</details>

### P052 — prototype/drive-lab/AGENTS.md:108-108

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 108–108). Outcome: **updated**.

Active destination(s): [docs/agent-guide/diagnostics-reports.md#capture-and-presentation](../../../docs/agent-guide/diagnostics-reports.md#capture-and-presentation), [docs/agent-guide/diagnostics-reports.md#automatic-delivery](../../../docs/agent-guide/diagnostics-reports.md#automatic-delivery).

Consult when: Diagnostic capture or delivery.

Rule coverage / supersession: Original safe aggregate/trace/interaction fields and exclusions, bounded session-only sampling outside React and full-session aggregates preserved. Explicit gestures still work; manual-only/no automatic text superseded solely by R050/R060 authorized coordinate-free active-session delivery, not arbitrary telemetry.

<details><summary>Original wording for comparison</summary>

> - Keep the driving flight recorder coordinate-free, bounded, and in session memory: sample speed/GPS age and accuracy, input state, score state, frame pacing, network state, and visibility outside React state; retain full-session aggregates when old trace samples rotate; send the trace only through the explicit diagnostic gesture.

</details>

### P053 — prototype/drive-lab/AGENTS.md:109-109

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 109–109). Outcome: **updated**.

Active destination(s): [docs/agent-guide/diagnostics-reports.md#capture-and-presentation](../../../docs/agent-guide/diagnostics-reports.md#capture-and-presentation), [docs/agent-guide/diagnostics-reports.md#automatic-delivery](../../../docs/agent-guide/diagnostics-reports.md#automatic-delivery).

Consult when: Diagnostic capture or delivery.

Rule coverage / supersession: Original safe aggregate/trace/interaction fields and exclusions, bounded session-only sampling outside React and full-session aggregates preserved. Explicit gestures still work; manual-only/no automatic text superseded solely by R050/R060 authorized coordinate-free active-session delivery, not arbitrary telemetry.

<details><summary>Original wording for comparison</summary>

> - In debug builds, retain a dedicated long-lived interaction ledger for every semantic control activation and media command. Record exact sequence, timestamp, activation source, safe control identity, before/after transport snapshots, latency, browser media lifecycle, Media Session registration/invocation, playback confirmation, and bounded failure detail. Never record pointer coordinates, typed search text, GPS coordinates, media URLs, or automatic remote telemetry; SEND DIAGNOSTIC remains the only transmission gesture.

</details>

### P054 — prototype/drive-lab/AGENTS.md:110-110

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 110–110). Outcome: **moved**.

Active destination(s): [docs/agent-guide/diagnostics-reports.md#email-attachment](../../../docs/agent-guide/diagnostics-reports.md#email-attachment).

Consult when: Diagnostic email attachment.

Rule coverage / supersession: Concise body/full accepted gzip JSON/build+accepted timestamp/compressed+raw hashes/deterministic full roundtrip retained.

<details><summary>Original wording for comparison</summary>

> - Diagnostic email keeps only a concise human-readable summary in its body and attaches the complete accepted report as gzip-compressed JSON. Name the attachment with its build and accepted timestamp, publish uncompressed and compressed SHA-256 evidence in the summary, and keep a deterministic round-trip test that decompresses the attachment and compares the complete report.

</details>

### P055 — prototype/drive-lab/AGENTS.md:111-111

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 111–111). Outcome: **merged**.

Active destination(s): [docs/agent-guide/music.md#authored-score](../../../docs/agent-guide/music.md#authored-score).

Consult when: Score energy/structure/deceleration.

Rule coverage / supersession: Smoothed saturating speed, tempo knee/orchestration, continuous vs bar events, hysteresis/dwell/crossfades/musical braking retained.

<details><summary>Original wording for comparison</summary>

> - Speed raises energy through a smoothed saturating curve. Past the tempo knee, deepen arrangement instead of creating a frantic march.

</details>

### P056 — prototype/drive-lab/AGENTS.md:112-112

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 112–112). Outcome: **moved**.

Active destination(s): [docs/agent-guide/visuals.md#shared-boundaries](../../../docs/agent-guide/visuals.md#shared-boundaries).

Consult when: Visual renderer/fallback.

Rule coverage / supersession: Rich WebGL2 with reduced-motion and lightweight fallback kept, subject to renderer-specific source fidelity.

<details><summary>Original wording for comparison</summary>

> - The visual must move as a rich field with WebGL2, plus reduced-motion and lightweight fallbacks.

</details>

### P057 — prototype/drive-lab/AGENTS.md:113-113

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 113–113). Outcome: **merged**.

Active destination(s): [AGENTS.md#working-agreement](../../../AGENTS.md#working-agreement).

Consult when: All tasks.

Rule coverage / supersession: Language duplicate unified without changing English/Italian scope.

<details><summary>Original wording for comparison</summary>

> - All interface copy, source code, comments, documentation, and logs must be in English. Italian is used only in direct conversation with the user.

</details>

### P058 — prototype/drive-lab/AGENTS.md:114-114

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 114–114). Outcome: **updated**.

Active destination(s): [docs/agent-guide/delivery.md#canonical-publication](../../../docs/agent-guide/delivery.md#canonical-publication), [docs/agent-guide/diagnostics-reports.md#capture-and-presentation](../../../docs/agent-guide/diagnostics-reports.md#capture-and-presentation).

Consult when: Product deployment or diagnostics access.

Rule coverage / supersession: Experimental canonical root and main diagnostics retained; repeated owner approval superseded by R042 September5 standing authority.

<details><summary>Original wording for comparison</summary>

> - During this experimental development phase, verified builds are deployed to the canonical root at `https://sedicivalvole.app/` after user approval; diagnostics remain part of the main experience.

</details>

### P059 — prototype/drive-lab/AGENTS.md:115-115

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 115–115). Outcome: **merged**.

Active destination(s): [docs/agent-guide/music.md#authored-score](../../../docs/agent-guide/music.md#authored-score).

Consult when: Score energy/structure/deceleration.

Rule coverage / supersession: Smoothed saturating speed, tempo knee/orchestration, continuous vs bar events, hysteresis/dwell/crossfades/musical braking retained.

<details><summary>Original wording for comparison</summary>

> - Keep continuous speed/energy parameters separate from bar-quantized structural events. Use smoothing, hysteresis, dwell, crossfades, a tempo knee, and musically controlled deceleration.

</details>

### P060 — prototype/drive-lab/AGENTS.md:116-116

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 116–116). Outcome: **merged**.

Active destination(s): [docs/agent-guide/music.md#junction](../../../docs/agent-guide/music.md#junction).

Consult when: JUNCTION paired takes/rendering/history.

Rule coverage / supersession: Exact shared spine/eight-bar completion, reset voices/DSP/click-safe edges, recent history and six clips merged with R033.

<details><summary>Original wording for comparison</summary>

> - JUNCTION live pairs must share an identical authored rhythmic spine and complete the current eight-bar phrase before the next pair starts. Render every selectable clip with reset DSP/voice state and short click-safe edges; prefer unexposed families and takes from a bounded recent-history window, and keep the six-decoded-clip memory ceiling.

</details>

### P061 — prototype/drive-lab/AGENTS.md:117-117

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 117–117). Outcome: **merged**.

Active destination(s): [AGENTS.md#working-agreement](../../../AGENTS.md#working-agreement), [docs/agent-guide/delivery.md#identity-and-records](../../../docs/agent-guide/delivery.md#identity-and-records).

Consult when: Implementation or checkpoint.

Rule coverage / supersession: Saved Dropbox implementation and verified commits/push preserved; single-writer context distinguished from independently authorized separate-checkout work.

<details><summary>Original wording for comparison</summary>

> - Make frequent verified commits and push when a repository remote exists. Never leave the real Dropbox project directory for implementation work.

</details>

### P062 — prototype/drive-lab/AGENTS.md:118-118

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 118–118). Outcome: **merged**.

Active destination(s): [docs/agent-guide/delivery.md#identity-and-records](../../../docs/agent-guide/delivery.md#identity-and-records).

Consult when: Changelog maintenance.

Rule coverage / supersession: Append-only/local date+time/hash/build retained; task-specific migration prohibition is not permanent.

<details><summary>Original wording for comparison</summary>

> - Keep `CHANGELOG.md` strictly progressive and append-only: never rewrite, alter, or remove past entries under any circumstances. Every changelog entry must state the date, local time (`YYYY-MM-DD HH:MM`), commit hash (`[commit]`), and build stamp when deploying (`build YYYYMMDD-HHMM`).

</details>

### P063 — prototype/drive-lab/AGENTS.md:120-120

Original section: **Durable product direction** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 120–120). Outcome: **moved**.

Active destination(s): [prototype/drive-lab/AGENTS.md#local-work](../../../prototype/drive-lab/AGENTS.md#local-work), [docs/agent-guide/delivery.md#sites-package](../../../docs/agent-guide/delivery.md#sites-package).

Consult when: Drive Lab code or requested Sites handoff.

Rule coverage / supersession: src ownership and exact four package/worker/config/test paths intact; build+test:sites and exact three outputs only for Sites handoff.

<details><summary>Original wording for comparison</summary>

> Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

</details>

### P064 — prototype/drive-lab/AGENTS.md:124-125

Original section: **Owner update — 2026-09-04 refined Balanced Rail** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 124–125). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#shared-geometry-and-palette](../../../docs/agent-guide/interface.md#shared-geometry-and-palette), [docs/agent-guide/interface.md#chrome-and-drawers](../../../docs/agent-guide/interface.md#chrome-and-drawers), [docs/agent-guide/interface.md#design-decisions](../../../docs/agent-guide/interface.md#design-decisions).

Consult when: Reading superseding interface presentation.

Rule coverage / supersession: Precedence marker applied to its explicit decisions; later owner corrections applied per affected rule rather than dates alone.

<details><summary>Original wording for comparison</summary>

> These newer owner decisions supersede the earlier presentation and focus-retention
> rules above where they differ:

</details>

### P065 — prototype/drive-lab/AGENTS.md:127-129

Original section: **Owner update — 2026-09-04 refined Balanced Rail** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 127–129). Outcome: **merged**.

Active destination(s): [docs/agent-guide/interface.md#shared-geometry-and-palette](../../../docs/agent-guide/interface.md#shared-geometry-and-palette).

Consult when: Balanced Rail, typography/targets or palette contrast.

Rule coverage / supersession: 16 first/speed hierarchy/four optical cells,48/56 and shared footer rules; central contrast preserving passing colors/fixed hue/minimal changes/evidence matrix+actual backgrounds.

<details><summary>Original wording for comparison</summary>

> - Use the refined Balanced Rail direction. Keep 16 first while stationary; speed
>   alone has exceptional numerical hierarchy. Four right-side icons share optical
>   frames, stroke and central alignment within equal finger-sized cells.

</details>

### P066 — prototype/drive-lab/AGENTS.md:130-132

Original section: **Owner update — 2026-09-04 refined Balanced Rail** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 130–132). Outcome: **moved**.

Active destination(s): [docs/agent-guide/interface.md#running-media-and-effects](../../../docs/agent-guide/interface.md#running-media-and-effects).

Consult when: Now Playing/footer/modal ownership.

Rule coverage / supersession: Single animated/inert footer, suppression in Atlas/menu/popup/passenger; no independent overlay.

<details><summary>Original wording for comparison</summary>

> - Now Playing belongs to the footer's single animated/inert container. Suppress it
>   in ATLAS and while any real menu, popup or passenger panel is open. Never leave
>   an independent miniplayer overlay over a visual or Discover.

</details>

### P067 — prototype/drive-lab/AGENTS.md:133-137

Original section: **Owner update — 2026-09-04 refined Balanced Rail** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 133–137). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#chrome-and-drawers](../../../docs/agent-guide/interface.md#chrome-and-drawers).

Consult when: Chrome rest/inactivity/motion.

Rule coverage / supersession: Immediate close,6s deadline, stale focus no extension/open surface usable retained;0.8kmh ambient lock superseded explicitly by P075.

<details><summary>Original wording for comparison</summary>

> - Completed unpinned actions and closed drawers retract chrome immediately. The
>   inactivity deadline is six seconds. Stale keyboard focus must never extend it,
>   but an actually open surface must retain its controls and focus. At movement of
>   at least 0.8 km/h, unpinned chrome stays closed even after ambient taps; only the
>   speed/effect module remains. Motion itself never wakes controls.

</details>

### P068 — prototype/drive-lab/AGENTS.md:138-139

Original section: **Owner update — 2026-09-04 refined Balanced Rail** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 138–139). Outcome: **merged**.

Active destination(s): [docs/agent-guide/interface.md#shared-geometry-and-palette](../../../docs/agent-guide/interface.md#shared-geometry-and-palette).

Consult when: Balanced Rail, typography/targets or palette contrast.

Rule coverage / supersession: 16 first/speed hierarchy/four optical cells,48/56 and shared footer rules; central contrast preserving passing colors/fixed hue/minimal changes/evidence matrix+actual backgrounds.

<details><summary>Original wording for comparison</summary>

> - Preserve 48/56 px action targets and the semantic type ladder. Treat footer
>   cells, baselines, state styling, spacing and icons with the same rules as navbar.

</details>

### P069 — prototype/drive-lab/AGENTS.md:140-143

Original section: **Owner update — 2026-09-04 refined Balanced Rail** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 140–143). Outcome: **merged**.

Active destination(s): [docs/agent-guide/interface.md#shared-geometry-and-palette](../../../docs/agent-guide/interface.md#shared-geometry-and-palette).

Consult when: Balanced Rail, typography/targets or palette contrast.

Rule coverage / supersession: 16 first/speed hierarchy/four optical cells,48/56 and shared footer rules; central contrast preserving passing colors/fixed hue/minimal changes/evidence matrix+actual backgrounds.

<details><summary>Original wording for comparison</summary>

> - Resolve every palette's critical LIGHT/DARK UI roles centrally. Preserve passing
>   colours; adjust lightness/chroma minimally at fixed hue when necessary. Record
>   original/resolved values and measured ratios, and test both the palette matrix
>   and actual rendered backgrounds. Renderer artwork remains palette-owned.

</details>

### P070 — prototype/drive-lab/AGENTS.md:144-146

Original section: **Owner update — 2026-09-04 refined Balanced Rail** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 144–146). Outcome: **moved**.

Active destination(s): [docs/agent-guide/maps.md#atlas-and-stats](../../../docs/agent-guide/maps.md#atlas-and-stats), [docs/agent-guide/maps.md#discover](../../../docs/agent-guide/maps.md#discover).

Consult when: Map labels, Discover names or article/vendor boundaries.

Rule coverage / supersession: Readable Atlas case/spacing; two-line real Discover names and no decorative numbers; native article/upstream boundaries intact.

<details><summary>Original wording for comparison</summary>

> - ATLAS uses readable case and deliberate vertical spacing. DISCOVER real names
>   get at least two lines; remove decorative result numbers. Native article and
>   third-party renderer boundaries remain unchanged.

</details>

### P071 — prototype/drive-lab/AGENTS.md:147-149

Original section: **Owner update — 2026-09-04 refined Balanced Rail** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 147–149). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#chrome-and-drawers](../../../docs/agent-guide/interface.md#chrome-and-drawers).

Consult when: Underwater badge presentation.

Rule coverage / supersession: Full speed footprint/descend-return/palette contrast/reduced motion/no warning red retained; later owner Night Glass refinement specifies32px strip below64 badge.

<details><summary>Original wording for comparison</summary>

> - UNDERWATER extends the complete speed badge footprint, descends/returns from
>   that badge, uses a contrast-safe palette-derived background and respects reduced
>   motion. It must not read as an alarm-red warning.

</details>

### P072 — prototype/drive-lab/AGENTS.md:150-151

Original section: **Owner update — 2026-09-04 refined Balanced Rail** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 150–151). Outcome: **moved**.

Active destination(s): [docs/agent-guide/motion-runtime.md#preparation-and-recovery](../../../docs/agent-guide/motion-runtime.md#preparation-and-recovery).

Consult when: Launch/preload sharing.

Rule coverage / supersession: Request reuse across choices/Music and StrictMode lifecycle retained.

<details><summary>Original wording for comparison</summary>

> - Keep the splash preparation request reusable across launch choices and Music
>   selection, including React Strict Mode's development lifecycle.

</details>

### P073 — prototype/drive-lab/AGENTS.md:152-153

Original section: **Owner update — 2026-09-04 refined Balanced Rail** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 152–153). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#design-decisions](../../../docs/agent-guide/interface.md#design-decisions).

Consult when: Actual design audit or historical Sept4 refinement.

Rule coverage / supersession: Real-render audit intent retained; no new mandatory audit for unrelated UI bug. Frontend-builder ban was session-specific and P083 explicitly replaces for Launch Cockpit; Playwright/Chrome authorization is evidence for that work, not required tooling now.

<details><summary>Original wording for comparison</summary>

> - Use Product Design audit and real-render frontend testing, not the frontend
>   application builder. The owner authorized Playwright/Chrome for this work.

</details>

### P074 — prototype/drive-lab/AGENTS.md:154-157

Original section: **Owner update — 2026-09-04 refined Balanced Rail** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 154–157). Outcome: **updated**.

Active destination(s): [AGENTS.md#working-agreement](../../../AGENTS.md#working-agreement), [docs/agent-guide/recovery.md#conflicted-shared-work](../../../docs/agent-guide/recovery.md#conflicted-shared-work), [docs/agent-guide/delivery.md#canonical-publication](../../../docs/agent-guide/delivery.md#canonical-publication), [docs/agent-guide/delivery.md#verification-proportional-to-the-change](../../../docs/agent-guide/delivery.md#verification-proportional-to-the-change).

Consult when: Concurrent work, publication or evidence claims.

Rule coverage / supersession: Single writer saved checkout retained; that session no-new-task/worktree mandate not generalized to independent authorized work. Deployment confirmation explicitly superseded R042; browser != cabin/native/network/GPU retained.

<details><summary>Original wording for comparison</summary>

> - Keep one writer in the saved Dropbox checkout; no new task/worktree/checkout.
>   Verified Git checkpoints may be pushed. Canonical deployment still requires an
>   explicit owner request and the applicable gates; browser proof is not Tesla
>   cabin, native-media, network or sustained-GPU acceptance.

</details>

### P075 — prototype/drive-lab/AGENTS.md:162-166

Original section: **Owner correction — 2026-09-05 moving controls must remain reachable** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 162–166). Outcome: **moved**.

Active destination(s): [docs/agent-guide/interface.md#chrome-and-drawers](../../../docs/agent-guide/interface.md#chrome-and-drawers).

Consult when: Moving-control interaction.

Rule coverage / supersession: Deliberate touch/keyboard at any speed, one departure retract not each sample,6s/immediate-close/pinning/speed-only, no moving lock.

<details><summary>Original wording for comparison</summary>

> Supersedes the earlier instruction to ignore ambient taps while moving. A deliberate
> pointer/touch or keyboard wake must reveal usable navbar/footer at any speed.
> Departure may retract once; subsequent speed samples must not cancel that wake.
> Keep the six-second inactivity deadline, immediate completed-action/close retraction,
> open-surface pinning and speed-only resting state. Never make motion a control lock.

</details>

### P076 — prototype/drive-lab/AGENTS.md:171-176

Original section: **Owner refinement — 2026-09-05 Palette disclosure and Music density** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 171–176). Outcome: **moved**.

Active destination(s): [docs/agent-guide/interface.md#shared-geometry-and-palette](../../../docs/agent-guide/interface.md#shared-geometry-and-palette), [docs/agent-guide/interface.md#running-media-and-effects](../../../docs/agent-guide/interface.md#running-media-and-effects).

Consult when: Palette popup or media geometry.

Rule coverage / supersession: Named icon/label, swatches popup only,TitleCase/high-contrast13 metadata,48/56 targets; common-center artwork/text/transport and content-sized credit columns.

<details><summary>Original wording for comparison</summary>

> Use a recognizable palette-library icon with the visible label `Palette` in the
> footer. Keep the colour swatches inside its popup, without repeating the full
> collection in the footer. Palette names use Title Case and high-contrast 13 px
> metadata. Preserve 48/56 px targets as Music headings and supporting copy become
> more compact. Align Now Playing artwork, track copy and transport on a common
> centre; size credit role columns from their content so labels never overlap titles.

</details>

### P077 — prototype/drive-lab/AGENTS.md:180-187

Original section: **Owner delegation — 2026-09-05 curated surprise** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 180–187). Outcome: **updated**.

Active destination(s): [docs/agent-guide/music.md#curated-experiences](../../../docs/agent-guide/music.md#curated-experiences), [docs/agent-guide/interface.md#intro-and-branding](../../../docs/agent-guide/interface.md#intro-and-branding).

Consult when: Curated composition or preset application.

Rule coverage / supersession: One-time delegated first experience retained as scoped selection only. Night Glass Ambient explicitly replaced by Lounge in NIGHT-GLASS Sept5 owner-directed refinement. Shared registry/silent preparation/explicit playback/settings-derived identity/controls/recovery truthful.

<details><summary>Original wording for comparison</summary>

> The owner explicitly delegated selection, creative direction and implementation
> of the first curated experience, superseding the three-direction approval gate
> for this work. Night Glass pairs the unchanged Vertigo integration, Graphite,
> DARK and the existing Jamendo Ambient selection. Keep one shared registry/card
> in launch and Visual. Preparation is silent; START or an explicit running Play
> owns playback. Individual controls, diagnostics, motion wake and automatic chrome
> retraction remain available. Recognize an experience from actual settings, never
> from a stale saved label, and never claim a failed music request is playing.

</details>

### P078 — prototype/drive-lab/AGENTS.md:191-191

Original section: **Owner copy decision — 2026-09-05** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 191–191). Outcome: **moved**.

Active destination(s): [docs/agent-guide/interface.md#intro-and-branding](../../../docs/agent-guide/interface.md#intro-and-branding).

Consult when: Launch safety copy.

Rule coverage / supersession: Only DRIVE RESPONSIBLY, no subordinate instructions/ceiling text; energy130/control behavior unchanged.

<details><summary>Original wording for comparison</summary>

> The splash safety aside contains only `DRIVE RESPONSIBLY`. Do not restore the subordinate driving instructions or the speed-ceiling explanatory text there. This copy simplification does not change the fixed energy ceiling or control behavior.

</details>

### P079 — prototype/drive-lab/AGENTS.md:195-195

Original section: **Owner refinement — 2026-09-05 contextual visual controls** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 195–195). Outcome: **moved**.

Active destination(s): [docs/agent-guide/interface.md#chrome-and-drawers](../../../docs/agent-guide/interface.md#chrome-and-drawers).

Consult when: Prtcl/Drivey/Gradient cycle controls.

Rule coverage / supersession: Label and value share left edge, dimensions/targets/colors/chrome retained.

<details><summary>Original wording for comparison</summary>

> Align both the functional label and current value to the same left edge in the shared Prtcl, Drivey and Gradient cycle buttons. Keep their existing dimensions, touch targets, colour roles and chrome-owned visibility; do not mix a left label with a centered value.

</details>

### P080 — prototype/drive-lab/AGENTS.md:200-215

Original section: **Owner acceptance and reliability direction — 2026-09-07** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 200–215). Outcome: **updated**.

Active destination(s): [AGENTS.md#working-agreement](../../../AGENTS.md#working-agreement), [docs/agent-guide/motion-runtime.md#preparation-and-recovery](../../../docs/agent-guide/motion-runtime.md#preparation-and-recovery), [docs/agent-guide/maps.md#atlas-and-stats](../../../docs/agent-guide/maps.md#atlas-and-stats), [docs/agent-guide/diagnostics-reports.md#automatic-delivery](../../../docs/agent-guide/diagnostics-reports.md#automatic-delivery).

Consult when: Reliability, ATLAS/Stats redesign, diagnostic scheduling or backlog prioritization.

Rule coverage / supersession: Broad acceptance and reliability > Engine > iPhone retained without inventing tests. Map parity/POI direction retained and selected by P094. Backoff/recovery/cancel/no hidden-offline retry retained. Future-only ten-minute/default uncertainty superseded by R050 then R060/R061; current AUTO contract preserves privacy/disclosure/server checks/gaps.

<details><summary>Original wording for comparison</summary>

> Flux, Soundtrack, FX, interface and Discover are owner-accepted, subject to later
> small refinements. Prioritize reliability fixes, then Engine, then iPhone.
> Travel ATLAS becomes an informative map; move and expand the existing statistics
> into a separate full-screen visual only after replacement parity is verified.
> The owner delegates information design; exact-coordinate Discover POIs are a
> candidate to research. Keep the three-direction visual gate before construction.
> Transient failed loads must retry automatically with bounded backoff for several
> minutes, online/foreground recovery, no overlapping attempts and cancellation on
> selection change. Do not repeatedly reload hidden/offline renderers.
> Future diagnostics have Standard and Dev levels. The owner explicitly authorizes
> coordinate-free packets to the existing diagnostic destination every ten minutes
> only in Dev, with automatic send default ON within Dev and a visible OFF switch.
> This supersedes manual-only transmission for that future feature only; implement
> matching disclosure, scheduling, server validation and tests before enabling it.
> Do not promise background timer execution or infer default Dev mode. Record
> minimized-browser gaps honestly. See ../../docs/OWNER-DECISIONS-2026-09-07.md.

</details>

### P081 — prototype/drive-lab/AGENTS.md:219-227

Original section: **Engine source decision — 2026-09-07** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 219–227). Outcome: **merged**.

Active destination(s): [docs/agent-guide/engine.md#accepted-source-and-voices](../../../docs/agent-guide/engine.md#accepted-source-and-voices).

Consult when: Engine donor integration/provenance.

Rule coverage / supersession: Exact authorized declared-MIT WAV integration supersedes study holds; candidate adaptation allowed; no blind-review/independent rights/liability claim.

<details><summary>Original wording for comparison</summary>

> The owner explicitly directs implementation using pinned MIT
> `markeasting/engine-audio`, including its bundled active WAVs, relying on the
> repository's declared MIT licence. This supersedes older project/study holds and
> additional owner-approval gates for that exact integration. Record the declared
> licence, exact source/hash/change inventory and outstanding recording-provenance
> follow-up truthfully; do not claim ownership independently verified or liability
> transferred. Preserve upstream attribution and the existing deployment authority.
> The prior sealed candidate may be inspected and adapted progressively for this
> integration; no independent blind-review claim is made.

</details>

### P082 — prototype/drive-lab/AGENTS.md:232-237

Original section: **Engine listening refinement — 2026-09-07** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 232–237). Outcome: **updated**.

Active destination(s): [docs/agent-guide/engine.md#output-and-road-response](../../../docs/agent-guide/engine.md#output-and-road-response), [docs/agent-guide/engine.md#tamarro-and-idle](../../../docs/agent-guide/engine.md#tamarro-and-idle).

Consult when: Engine output, deceleration, controls or idle.

Rule coverage / supersession: Dry bypass/no moving ducking retained; displayed-zero left/right visible across chrome and disabled under remaining audio/movement/lifecycle conditions. R049 and ROAD-FEEDBACK / Implemented corrections explicitly remove the GPS requirement for manual revs, including stale/absent GPS; stale-zero disables automatic idle. Automatic fresh-zero and movement/mute/lifecycle stop retained.

<details><summary>Original wording for comparison</summary>

> The owner requires Engine to bypass UNDERWATER and all Flux creative effects.
> Deceleration changes RPM without artificial gain ducking. Keep prominent left
> and right TAMARRO controls visible at displayed zero independently of chrome
> retraction; stale evidence disables rather than removes them. Small periodic idle
> blips require fresh exact standstill and stop on movement, mute or lifecycle loss.
> This is a direct refinement of the selected Telemetry direction.

</details>

### P083 — prototype/drive-lab/AGENTS.md:242-250

Original section: **Owner delegation — 2026-09-07 Launch Cockpit** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 242–250). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#intro-and-branding](../../../docs/agent-guide/interface.md#intro-and-branding), [docs/agent-guide/music.md#soundtrack-and-selection](../../../docs/agent-guide/music.md#soundtrack-and-selection), [docs/agent-guide/interface.md#design-decisions](../../../docs/agent-guide/interface.md#design-decisions).

Consult when: Launch composition or queue start.

Rule coverage / supersession: Scoped delegated Cockpit selection, publicMusic/internalFlux,oneSTART/precise choices/nonrepeat/lucky/presets/no sound beforeSTART/no old loading queue/mute/dialogs/targets; older brand-first and specific builder ban superseded.

<details><summary>Original wording for comparison</summary>

> The owner requested immediate Engine/Music selection and delegated the splash
> redesign decision and frontend design/debug work. Three directions were presented;
> Cockpit was selected under that delegation, superseding the selection gate for
> this specific change. Use Music publicly and retain flux internally. Keep one
> START, precise genre/pace/Lobo choices, non-repeating lucky genre selection and
> existing curated presets. No sound before START; no old queue while a newly chosen
> catalogue is loading. Preserve mute, keyboard dialogs and Tesla 48/56 px targets.
> This supersedes the older brand-first splash and frontend-builder prohibition for
> this owner-requested redesign. See ../../docs/LAUNCH-COCKPIT-2026-09-07.md.

</details>

### P084 — prototype/drive-lab/AGENTS.md:255-258

Original section: **Owner clarification — 2026-09-07 TAMARRO / Show-off** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 255–258). Outcome: **updated**.

Active destination(s): [docs/agent-guide/engine.md#tamarro-and-idle](../../../docs/agent-guide/engine.md#tamarro-and-idle).

Consult when: TAMARRO gesture.

Rule coverage / supersession: Bounded varied up-release-up-limiter-down, SHOW-OFF subtitle,tap stop,dry path; trusted automatic standstill vs manual-before-fix later exception kept distinct.

<details><summary>Original wording for comparison</summary>

> TAMARRO means varied powerful neutral throttle blips at a stop: up, release, up,
> brief limiter flutter and down. It is not a maximum-throttle hold. Keep TAMARRO
> with the English SHOW-OFF subtitle. One tap plays a bounded phrase; another stops.
> Keep the unchanged dry audio/gain path, trusted standstill and lifecycle gates.

</details>

### P085 — prototype/drive-lab/AGENTS.md:263-263

Original section: **Owner tuning — 2026-09-07 everyday-road gears** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 263–263). Outcome: **updated**.

Active destination(s): [docs/agent-guide/engine.md#output-and-road-response](../../../docs/agent-guide/engine.md#output-and-road-response), [docs/agent-guide/engine.md#tamarro-and-idle](../../../docs/agent-guide/engine.md#tamarro-and-idle).

Consult when: Engine gears or idle eligibility.

Rule coverage / supersession: The parser splits line264 starting70.; both spans form the original35/65 ladder. Ladder explicitly superseded R055/P096, lower boundaries/dwell/dry/upstream retained; missing speed not standstill and RPM eligibility feedback retained.

<details><summary>Original wording for comparison</summary>

> Engine serves entertainment: second should enter around 30–40 km/h and third by

</details>

### P086 — prototype/drive-lab/AGENTS.md:264-267

Original section: **Owner tuning — 2026-09-07 everyday-road gears** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 264–267). Outcome: **updated**.

Active destination(s): [docs/agent-guide/engine.md#output-and-road-response](../../../docs/agent-guide/engine.md#output-and-road-response), [docs/agent-guide/engine.md#tamarro-and-idle](../../../docs/agent-guide/engine.md#tamarro-and-idle).

Consult when: Engine gears or idle eligibility.

Rule coverage / supersession: The parser splits line264 starting70.; both spans form the original35/65 ladder. Ladder explicitly superseded R055/P096, lower boundaries/dwell/dry/upstream retained; missing speed not standstill and RPM eligibility feedback retained.

<details><summary>Original wording for comparison</summary>

> 70. Host acoustic ratios target nominal 35/65 km/h upshifts, with separated lower
> boundaries and dwell preventing gear hunting. Preserve upstream files and the dry
> audio path. A static browser with missing GPS speed does not prove standstill;
> explain idle-blip eligibility in the RPM label rather than bypassing evidence.

</details>

### P087 — prototype/drive-lab/AGENTS.md:272-278

Original section: **Owner selection — 2026-09-07 compact Round Instruments** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 272–278). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#intro-and-branding](../../../docs/agent-guide/interface.md#intro-and-branding).

Consult when: Intro random choices or thumbnail layout.

Rule coverage / supersession: Two equal columns/light-dark/small amberMusic+accentEngine icons/48–56/genre+visual rerolls/precise choices/deliberate AtlasDiscover/Gradient equal weight retained.64px circular main thumbs superseded R06880px square6 corners.

<details><summary>Original wording for comparison</summary>

> The owner selected the second splash study with circular thumbnails at half their
> original diameter: 64 px. Keep two equal music/visual columns at Tesla size, the
> existing light/dark shell, small amber Music and accent Engine icons, and all
> 48/56 px targets. Each visit starts with a fresh soundtrack genre and visual
> effect; Feeling lucky and Change reroll without immediate repeats. Choose keeps
> precise genre/pace/Lobo/score and all visual choices reachable. Atlas and Discover
> remain deliberate passenger choices. Gradient has one equal roulette weight.

</details>

### P088 — prototype/drive-lab/AGENTS.md:282-285

Original section: **Owner correction — 2026-09-07 intrinsic launch height** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 282–285). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#intro-and-branding](../../../docs/agent-guide/interface.md#intro-and-branding).

Consult when: Intrinsic launch/preset/short window geometry.

Rule coverage / supersession: Content-height not tall-window fill,36px circular presets/48–56 retained;64px circles replaced80px. Flow footer placement superseded P089/P090 centered sheet/fixed credits/support-header, short flow remains reachable by scroll.

<details><summary>Original wording for comparison</summary>

> Launch rows and sheet height must follow content, never expand to consume a tall
> Mac window. Keep compact selection groups, 64 px circles, 36 px preset artwork,
> 48/56 px actions and a footer directly after the sheet. Short windows scroll the
> complete launch flow. Verify tall desktop geometry as well as Tesla and phone.

</details>

### P089 — prototype/drive-lab/AGENTS.md:289-292

Original section: **Owner positioning correction — 2026-09-07** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 289–292). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#intro-and-branding](../../../docs/agent-guide/interface.md#intro-and-branding).

Consult when: Centered sheet/footer positions.

Rule coverage / supersession: Centered both axes/bounded short-window scrolling/fixed credits preserved; support bottom-right and safety bottom-center explicitly replaced by P090 header support and below-wordmark safety.

<details><summary>Original wording for comparison</summary>

> Keep the compact launch sheet centered on the viewport on both axes. Credits
> remain at the viewport's bottom left, Support bottom right and safety copy bottom
> center, independently of the sheet. In short windows, scroll inside the centered
> sheet and reserve space for the fixed footer instead of clipping controls.

</details>

### P090 — prototype/drive-lab/AGENTS.md:297-302

Original section: **Owner support placement — 2026-09-07** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 297–302). Outcome: **moved**.

Active destination(s): [docs/agent-guide/interface.md#intro-and-branding](../../../docs/agent-guide/interface.md#intro-and-branding).

Consult when: Brand/support dialog.

Rule coverage / supersession: Transparent16mark,wordmark+Drive responsibly,yellow cup afterAbout48px/sharedREPORT,credits bottom-left,centered bounded dialog/return focus retained.

<details><summary>Original wording for comparison</summary>

> Supersedes the earlier viewport-footer placement for Support and safety copy.
> Keep the transparent 16 Road mark beside the wordmark, with Drive responsibly
> immediately below the wordmark. Put the yellow Buy Me a Coffee cup button directly
> after About at the same 48 px height. Keep credits at bottom left. Share that
> support button with the diagnostic panel. Its dialog is centered on the viewport,
> with bounded internal scrolling and focus restored to the originating control.

</details>

### P091 — prototype/drive-lab/AGENTS.md:306-311

Original section: **Owner next priority — 2026-09-07 ATLAS and Stats for Nerds** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 306–311). Outcome: **updated**.

Active destination(s): [docs/agent-guide/maps.md#atlas-and-stats](../../../docs/agent-guide/maps.md#atlas-and-stats), [docs/agent-guide/diagnostics-reports.md#travel-report](../../../docs/agent-guide/diagnostics-reports.md#travel-report), [AGENTS.md#working-agreement](../../../AGENTS.md#working-agreement).

Consult when: ATLAS/Stats/report scope or priority.

Rule coverage / supersession: Support-first sequence was dated work ordering, not universal interruption. Informative wider map/natural pastels/metric parity retained; pending design resolved P094 and R052; optional user-requested remembered+reset recipient retained.

<details><summary>Original wording for comparison</summary>

> After support, prioritize an informative wider ATLAS map and a separate full-screen
> Stats for Nerds surface. Include natural pastel cartography alongside product
> palettes. Preserve metrics while separating surfaces. Plan a branded session PDF
> with optional user-requested email delivery to a remembered recipient cleared by
> Reset Saved State. The three-direction selection is pending; see
> ../../docs/ATLAS-STATS-REPORT-PLAN-2026-09-07.md.

</details>

### P092 — prototype/drive-lab/AGENTS.md:316-324

Original section: **Owner idle tuning — 2026-09-07** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 316–324). Outcome: **moved**.

Active destination(s): [docs/agent-guide/engine.md#tamarro-and-idle](../../../docs/agent-guide/engine.md#tamarro-and-idle).

Consult when: Engine idle level/RPM/blips.

Rule coverage / supersession: Exact600RPM/70%,manual override entire phrase,>=1fresh restore/no jitter/stale restore,moving full,1800(+1200)/1.2sec/five-sec interval/70%,1000unknown,upstream/dry retained.

<details><summary>Original wording for comparison</summary>

> Confirmed standstill now uses 600 RPM and 70% of the normal Engine master level.
> TAMARRO overrides the quiet level for its entire phrase and releases to 600 RPM.
> Fresh accepted speed of at least 1 km/h restores full level; sub-threshold jitter,
> invalid/stale evidence and GPS loss cannot falsely restore it after a stop.
> Moving lift/downshifts retain full level. Automatic standstill blips reach about
> 1800 RPM (1200 above idle) over 1.2 seconds, with five seconds between gestures.
> Their level remains 70%; manual rev, motion and lifecycle cancellation still apply.
> The initial no-speed fallback remains 1000 RPM and never fabricates standstill.
> Only host orchestration changed; upstream code/WAV files and dry audio stay intact.

</details>

### P093 — prototype/drive-lab/AGENTS.md:326-329

Original section: **Owner idle tuning — 2026-09-07** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 326–329). Outcome: **historical**.

Active destination(s): [docs/agent-guide/engine.md#protected-listening-lab](../../../docs/agent-guide/engine.md#protected-listening-lab), [docs/agent-guide/delivery.md#verification-proportional-to-the-change](../../../docs/agent-guide/delivery.md#verification-proportional-to-the-change).

Consult when: Interpreting old Engine gain or browser validation.

Rule coverage / supersession: 657tests and0.112/0.16 targets are dated evidence, not current acceptance or tests to rerun by rote. Active docs retain numeric historical evidence and physical-listening caveat; complete trace remains in original snapshot.

<details><summary>Original wording for comparison</summary>

> Validation: 657 native tests, real browser master-gain targets at 0.112/0.16,
> GPS jitter/movement transitions, automatic blip trace and three-profile TAMARRO
> rise/fall/limiter/return checks pass. Browser audio is measured under headless mute;
> perceived loudness and target-Tesla listening remain owner acceptance.

</details>

### P094 — prototype/drive-lab/AGENTS.md:333-341

Original section: **ATLAS / Stats approved remix — 2026-09-07** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 333–341). Outcome: **updated**.

Active destination(s): [docs/agent-guide/maps.md#atlas-and-stats](../../../docs/agent-guide/maps.md#atlas-and-stats), [docs/agent-guide/diagnostics-reports.md#travel-report](../../../docs/agent-guide/diagnostics-reports.md#travel-report).

Consult when: ATLAS/Stats separation or place reader.

Rule coverage / supersession: Explicit remix selected, chart320/340/old handle retired, true POI/read-return/NaturalPalette/framing/audio preserved. Does not revoke separate Discover index no-Atlas-link. Later report selection replaces PDF-only plan status.

<details><summary>Original wording for comparison</summary>

> ATLAS and Stats for Nerds are separate passenger views, not a map plus statistics
> sidebar. The owner selected Travel Observatory's pastel map/POIs and summary
> bands, Mission Control's heading/network instruments, and Journey Magazine's
> photo place card plus speed/altitude timeline. POIs use actual Discover source
> coordinates; Read more opens the full Wikipedia article over Atlas and returns
> to the selected place. Natural and Palette remain distinct. Manual/Area/Trip
> framing persists until Follow. Preserve audio mode while changing passenger
> views. The former midpoint chart handle/320 px sidebar is superseded by this
> explicit selection. PDF/email remains the separate documented design scope.

</details>

### P095 — prototype/drive-lab/AGENTS.md:346-353

Original section: **Owner simulator clarification — 2026-09-08** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 346–353). Outcome: **merged**.

Active destination(s): [docs/agent-guide/engine.md#research-and-campaign-scope](../../../docs/agent-guide/engine.md#research-and-campaign-scope).

Consult when: Engine simulator/source research.

Rule coverage / supersession: Both named references, public access only, no purchase/bypass/proprietary import; Yaghi IR/ratios/manual controls distinguished from recordings/automatic gearbox.

<details><summary>Original wording for comparison</summary>

> The owner confirms Ange Yaghi's engine-sim and Real Engine Simulator
> (https://realenginesimulator.com/) as central Engine research references. The
> latter is the fuller simulator previously recalled. Explore its publicly
> accessible engines, interface and explanations; no purchase or access bypass is
> requested. Its public presets are free; Pro concerns the custom engine builder.
> Study behavior and concepts without importing its proprietary runtime, audio,
> parameters or presets. Continue the authorized original Engine implementation
> inside the saved local project; preserve the selected Telemetry visual.

</details>

### P096 — prototype/drive-lab/AGENTS.md:357-362

Original section: **Owner road progression clarification — 2026-09-08** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 357–362). Outcome: **updated**.

Active destination(s): [docs/agent-guide/engine.md#output-and-road-response](../../../docs/agent-guide/engine.md#output-and-road-response).

Consult when: Engine road calibration.

Rule coverage / supersession: 35/65 ladder superseded explicitly: 20–40 restraint, strong 80, 100–130 progression, virtual ratios/load/dwell, road ceiling not neutral rev, dry output and virtual-not-Tesla truth. Later second-at30 is calibration preference, not speed-only override.

<details><summary>Original wording for comparison</summary>

> Supersedes the earlier 35/65 km/h entertainment ladder: keep urban 20–40 km/h
> restrained, with strong character already at 80 and progression through 100–130.
> Use fixed virtual mechanical ratios, load-sensitive automatic shifts and a
> 130 km/h acoustic road ceiling. Preserve the dry level, no-GPS stationary
> TAMARRO and trusted idle/lifecycle contracts. Virtual gears/RPM are authored
> acoustic state, never measured Tesla telemetry. See ../../AGENTS.md.

</details>

### P097 — prototype/drive-lab/AGENTS.md:366-372

Original section: **Owner Atlas / Stats refinement — 2026-09-08** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 366–372). Outcome: **moved**.

Active destination(s): [docs/agent-guide/interface.md#chrome-and-drawers](../../../docs/agent-guide/interface.md#chrome-and-drawers), [docs/agent-guide/maps.md#atlas-and-stats](../../../docs/agent-guide/maps.md#atlas-and-stats).

Consult when: Visual catalogue, Stats gap display or Atlas recovery/POIs.

Rule coverage / supersession: Visible numbering/repeatedSELECT removed,ACTIVE+inactive icon retained; dashed both gaps with per-series shades/Estimated legend/no total or export changes; observed continuity; OSM independent of zoom/links/recovery retained.

<details><summary>Original wording for comparison</summary>

> Remove catalogue numbers and repeated SELECT from the running Visual drawer;
> retain ACTIVE and a compact icon on inactive entries. Join short and long chart
> gaps aesthetically, with dashed palette-derived alternate shades for each
> series and a visible Estimated legend below. Connections never change totals
> or exported observations. Add useful observed session continuity below Network.
> Atlas must recover after network/location restoration and expose nearby OSM
> places independently of map zoom, with Maps/Wikipedia links where supported.

</details>

### P098 — prototype/drive-lab/AGENTS.md:376-382

Original section: **Active-session clock — owner correction, 2026-09-08** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 376–382). Outcome: **merged**.

Active destination(s): [docs/agent-guide/diagnostics-reports.md#automatic-delivery](../../../docs/agent-guide/diagnostics-reports.md#automatic-delivery).

Consult when: Session clock, automatic diagnostic client/server/transport.

Rule coverage / supersession: Exact fifteen-minute active-visible clock includes stops/noGPS/simulation/offline; hidden or >5 s gap excluded; reload reset; one due memory snapshot/no outbox; exact metadata and event names, server old-client compatibility/floor, mail acceptance meaning retained.

<details><summary>Original wording for comparison</summary>

> This supersedes the September 7 driving-only trigger: count fifteen minutes of
> observable active session time, including stops, absent GPS, simulated input and
> offline operation. Keep Dev/AUTO ON defaults and saved OFF/Standard. Hidden time
> and execution gaps over five seconds remain unobserved; reload starts a fresh
> session clock. At most one due report waits in memory for online/foreground
> recovery; construct a fresh bounded coordinate-free snapshot when sending.
> There is no persistent outbox or background execution promise.

</details>

### P099 — prototype/drive-lab/AGENTS.md:384-390

Original section: **Active-session clock — owner correction, 2026-09-08** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 384–390). Outcome: **merged**.

Active destination(s): [docs/agent-guide/diagnostics-reports.md#automatic-delivery](../../../docs/agent-guide/diagnostics-reports.md#automatic-delivery).

Consult when: Session clock, automatic diagnostic client/server/transport.

Rule coverage / supersession: Exact fifteen-minute active-visible clock includes stops/noGPS/simulation/offline; hidden or >5 s gap excluded; reload reset; one due memory snapshot/no outbox; exact metadata and event names, server old-client compatibility/floor, mail acceptance meaning retained.

<details><summary>Original wording for comparison</summary>

> Use `timeBasis: active-visible-session`, `intervalActiveMs`, `activeMs` and
> `totalActiveMs` in new diagnostic delivery metadata. The server validates the new
> clock explicitly and still accepts the older driving clock for already-open
> clients. Preserve the fifteen-minute server floor and bounded transport retries.
> Log `diagnostic-send.due` at the threshold, including offline state, then
> `requested`, `accepted` or `failed` with automatic/manual attribution. Acceptance
> means server mail-transport acceptance, not verified inbox delivery.

</details>

### P100 — prototype/drive-lab/AGENTS.md:394-399

Original section: **Owner weak-network music feedback — 2026-09-08** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 394–399). Outcome: **merged**.

Active destination(s): [docs/agent-guide/music.md#soundtrack-and-selection](../../../docs/agent-guide/music.md#soundtrack-and-selection), [docs/agent-guide/diagnostics-reports.md#capture-and-presentation](../../../docs/agent-guide/diagnostics-reports.md#capture-and-presentation).

Consult when: Weak-network music, artwork, native media handlers or logs.

Rule coverage / supersession: Initial glyph payload, loading/retry and retained transport, artwork recovery/native metadata, actual handlers not registration, invocation/outcome evidence, 1x fixed recordings.

<details><summary>Original wording for comparison</summary>

> Ship music control glyphs in the initial application payload, with visible
> loading/retrying feedback instead of blank controls. Retain transport while
> waiting for the catalogue. Recover artwork on network/foreground return and
> republish native metadata. Verify native play/pause/previous/next through the
> actual app handlers; do not equate API registration with Tesla button visibility.
> Preserve the native invocation/outcome log and fixed recordings at 1x.

</details>

### P101 — prototype/drive-lab/AGENTS.md:403-403

Original section: **Owner compact Intro refinement — 2026-09-10** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 403–403). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#intro-and-branding](../../../docs/agent-guide/interface.md#intro-and-branding), [docs/agent-guide/music.md#curated-experiences](../../../docs/agent-guide/music.md#curated-experiences), [docs/agent-guide/music.md#soundtrack-and-selection](../../../docs/agent-guide/music.md#soundtrack-and-selection).

Consult when: Compact Intro/defaults/artwork/presets.

Rule coverage / supersession: A only within original compact colors/center/START, 80 square/6 radius/compact controls, Mute and stable two genre presets/direct palette/no generated art. R069 supersedes saved-source exception; R070 removes Intro artist and adds 8 padding; actual prepared identity retained.

<details><summary>Original wording for comparison</summary>

> The owner selects direction A only as a small refinement of the current Intro and rejects the oversized generated cover concepts. Preserve current semantic UI colors, centered intrinsic sheet and existing START hierarchy. Use 80 px square covers with 6 px corners (previously 64 px circles), not the large concept images. Keep metadata and compact outline-icon Choose/Random controls to their right, without increasing the selection-row footprint. Soundtrack becomes the fresh/reset default while explicit stored sources remain respected; Visuals only is renamed Mute. Show actual prepared track title/artist beside its matching artwork. Two stable, randomly selected genre-labelled preset recommendations and a direct palette-cycle control share one row; broaden the underlying preset catalogue without adding visual clutter. This supersedes earlier circular-thumbnail rules for this surface. No generated concept artwork enters the product.

</details>

### P102 — prototype/drive-lab/AGENTS.md:407-407

Original section: **Owner Intro compression and default correction — 2026-09-10** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 407–407). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#intro-and-branding](../../../docs/agent-guide/interface.md#intro-and-branding).

Consult when: Intro initial preference, outlines, media/preset geometry.

Rule coverage / supersession: Soundtrack on every Intro, saved mute/current visit intact; Random outlined32/touch48; 80 art; circular36 presets/divided groups/direct palette. R070 supersedes artist/right-align and zero padding only; no new design gate.

<details><summary>Original wording for comparison</summary>

> Start every new Intro with Soundtrack, including when the saved source is Play the Road. This supersedes the immediately preceding saved-source exception; keep saved mute and explicit choices within the current Intro. Put Random inside an outlined button like Choose, reduce their visible vertical padding, and retain 48 px touch regions around the compact 32 px outlines. Align the track artist right on the genre/metadata row. Keep media boxes at the 80 px artwork height with no vertical image padding. Restore circular preset previews and use aligned labelled preset/palette groups separated by a vertical rule. The palette remains a direct cycle. No further visual direction selection is pending.

</details>

### P103 — prototype/drive-lab/AGENTS.md:411-411

Original section: **Owner Intro breathing room — 2026-09-10** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 411–411). Outcome: **merged**.

Active destination(s): [docs/agent-guide/interface.md#intro-and-branding](../../../docs/agent-guide/interface.md#intro-and-branding).

Consult when: Intro spacing, labels, artist or narrow layout.

Rule coverage / supersession: 80 cover+8 top/bottom, no media outer border/divider, SOUNDTRACK+nonduplicate genre, artist removed only Intro, PRESETS not RESET, label always visible with narrow stacking.

<details><summary>Original wording for comparison</summary>

> Keep 80 px covers and add 8 px top/bottom padding; remove the media group's outer border and internal divider. Explicitly label the music panel SOUNDTRACK, retaining genre alongside it without repeating an identical Soundtrack genre label. Remove the artist from Intro only; running credits/miniplayer remain unchanged. The owner clarified that the requested left-hand text is PRESETS, not a RESET command. Keep that label visible at all widths; on very narrow layouts the preset and palette groups stack to retain legibility.

</details>

### P104 — prototype/drive-lab/AGENTS.md:415-415

Original section: **Owner Air Atlas location and lens refinement — 2026-09-10** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 415–415). Outcome: **merged**.

Active destination(s): [docs/agent-guide/maps.md#air-atlas](../../../docs/agent-guide/maps.md#air-atlas), [docs/agent-guide/maps.md#geographic-privacy](../../../docs/agent-guide/maps.md#geographic-privacy), [docs/agent-guide/motion-runtime.md#gps-and-simulator](../../../docs/agent-guide/motion-runtime.md#gps-and-simulator).

Consult when: Air Atlas location/freshness.

Rule coverage / supersession: First geographic fix at rest or >250 m permitted with approximation/refinement; does not relax motion/terrain/journey, distinguish permission/noAPI/last known; callbacks independent of Permissions API.

<details><summary>Original wording for comparison</summary>

> Use the first valid geographic fix for Air Atlas even when stationary or coarser than 250 m; label approximate accuracy and refine as trusted fixes arrive. Keep the existing trusted motion, terrain and journey gates unchanged. Distinguish granted location awaiting a fix, denied permission, unavailable API and last known position. Permissions API absence must not prevent actual geolocation callbacks from working. Do not equate permission with confirmed satellite reception or require movement for an initial position.

</details>

### P105 — prototype/drive-lab/AGENTS.md:417-417

Original section: **Owner Air Atlas location and lens refinement — 2026-09-10** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 417–417). Outcome: **merged**.

Active destination(s): [docs/agent-guide/maps.md#air-atlas](../../../docs/agent-guide/maps.md#air-atlas).

Consult when: Flight trails, lens or hit regions.

Rule coverage / supersession: Five-second delayed trail end; 5 km/5 min/256 points, missing/implausible breaks; selected spherical display lens A, coordinates unchanged, warped hits, flat controls and ordinary map fallback; physical gate remains.

<details><summary>Original wording for comparison</summary>

> Show understated dashed received-flight trails, bounded to 5 km / five minutes / 256 samples per aircraft; stop at the delayed display sample and break on missing or implausible observations. The owner selected A, a subtle spherical display lens, over a real globe or inclined terrain. Keep geographic coordinates unchanged, align aircraft/home hit regions with the warped map and trails, retain flat controls, and fall back to the ordinary map if the lens GPU context is unavailable. Physical Tesla acceptance remains separate from browser simulation.

</details>

### P106 — prototype/drive-lab/AGENTS.md:421-421

Original section: **Owner Fly With continuity and controls — 2026-09-10** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 421–421). Outcome: **merged**.

Active destination(s): [docs/agent-guide/maps.md#fly-with](../../../docs/agent-guide/maps.md#fly-with), [docs/agent-guide/maps.md#air-atlas](../../../docs/agent-guide/maps.md#air-atlas).

Consult when: Flight camera continuity/zoom/action or selected marker geometry.

Rule coverage / supersession: Every-frame delayed camera/no tile wait, retain last DEM, no lost-signal motion; zoom held pose without camera-position change; prominent palette original icon; 54 ring/42 silhouette/about4 clearance/distance.

<details><summary>Original wording for comparison</summary>

> Fly With updates the camera every animation frame from the measured five-second delayed track, without waiting for every new map tile. Preserve the last terrain height during missing DEM samples instead of dropping to zero. Do not invent motion after signal loss. Keep optical zoom in/out/reset reachable in the flight view, preserving the aircraft camera position; a held pose can still be zoomed. Give Fly With a prominent palette-colored action and original outline view/flight icon. The selected aircraft has one 54 px ring around its 42 px silhouette, with approximately 4 px inner clearance and the distance below it.

</details>

### P107 — prototype/drive-lab/AGENTS.md:426-426

Original section: **Owner radar coverage refinement — 2026-09-10** ([byte-identical original](prototype__drive-lab__AGENTS.md.txt), lines 426–426). Outcome: **merged**.

Active destination(s): [docs/agent-guide/maps.md#air-atlas](../../../docs/agent-guide/maps.md#air-atlas).

Consult when: Radar viewport, provider coverage or refresh.

Rule coverage / supersession: Visible area follows zoom/pan, bounded coverage, no nearest32, position vs message age, manual/selected refresh respects backoff and no false freshness. Specific verified current bounds are linked, not guessed.

<details><summary>Original wording for comparison</summary>

> Air Atlas traffic must follow the visible radar area on zoom and pan. Preserve bounded provider coverage, remove the nearest-32 display cutoff, and distinguish actual position age from message age. Manual and selected-aircraft refresh must respect backoff and never make old observations appear fresh.

</details>

### H001 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:3-4

Original section: **Manual recovery prompt** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 3–4). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident).

Consult when: Investigating the specific August29 incident only.

Rule coverage / supersession: Manual third-session orchestration and exact historical checkout/inventory/screenshot paths remain in the byte copy through compatibility pointer; no automatic new task, checkout or old recovery execution.

<details><summary>Original wording for comparison</summary>

> Use this prompt when manually opening the third Sedici Valvole recovery
> session. Do not delegate it to another automatically created task.

</details>

### H002 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:8-9

Original section: **Manual recovery prompt** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 8–9). Outcome: **merged**.

Active destination(s): [AGENTS.md#working-agreement](../../../AGENTS.md#working-agreement), [docs/agent-guide/recovery.md#conflicted-shared-work](../../../docs/agent-guide/recovery.md#conflicted-shared-work).

Consult when: Language or shared-checkout recovery.

Rule coverage / supersession: Italian conversation/English artifacts and one recovery writer retained; sole recovery owner was incident scope.

<details><summary>Original wording for comparison</summary>

> You are the sole recovery owner for Sedici Valvole. Work in English for code,
> documentation, commit text, logs and product copy; speak to me in Italian.

</details>

### H003 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:11-11

Original section: **Manual recovery prompt** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 11–11). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident).

Consult when: Investigating the specific August29 incident only.

Rule coverage / supersession: Manual third-session orchestration and exact historical checkout/inventory/screenshot paths remain in the byte copy through compatibility pointer; no automatic new task, checkout or old recovery execution.

<details><summary>Original wording for comparison</summary>

> Repository and evidence paths:

</details>

### H004 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:13-14

Original section: **Manual recovery prompt** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 13–14). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident).

Consult when: Investigating the specific August29 incident only.

Rule coverage / supersession: Manual third-session orchestration and exact historical checkout/inventory/screenshot paths remain in the byte copy through compatibility pointer; no automatic new task, checkout or old recovery execution.

<details><summary>Original wording for comparison</summary>

> - primary checkout:
>   `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole`

</details>

### H005 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:15-16

Original section: **Manual recovery prompt** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 15–16). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident).

Consult when: Investigating the specific August29 incident only.

Rule coverage / supersession: Manual third-session orchestration and exact historical checkout/inventory/screenshot paths remain in the byte copy through compatibility pointer; no automatic new task, checkout or old recovery execution.

<details><summary>Original wording for comparison</summary>

> - conflicted worktree:
>   `/Users/enuzzo/.codex/worktrees/7c8d/sedicivalvole`

</details>

### H006 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:17-18

Original section: **Manual recovery prompt** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 17–18). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident).

Consult when: Investigating the specific August29 incident only.

Rule coverage / supersession: Manual third-session orchestration and exact historical checkout/inventory/screenshot paths remain in the byte copy through compatibility pointer; no automatic new task, checkout or old recovery execution.

<details><summary>Original wording for comparison</summary>

> - complete chronological user-requirements ledger:
>   `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole/docs/reconciliation/COMPLETE-USER-REQUIREMENTS-2026-08-29.md`

</details>

### H007 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:19-20

Original section: **Manual recovery prompt** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 19–20). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident).

Consult when: Investigating the specific August29 incident only.

Rule coverage / supersession: Manual third-session orchestration and exact historical checkout/inventory/screenshot paths remain in the byte copy through compatibility pointer; no automatic new task, checkout or old recovery execution.

<details><summary>Original wording for comparison</summary>

> - execution-session inventory:
>   `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole/docs/reconciliation/SESSION-01a04dcc-INVENTORY.md`

</details>

### H008 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:21-22

Original section: **Manual recovery prompt** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 21–22). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident).

Consult when: Investigating the specific August29 incident only.

Rule coverage / supersession: Manual third-session orchestration and exact historical checkout/inventory/screenshot paths remain in the byte copy through compatibility pointer; no automatic new task, checkout or old recovery execution.

<details><summary>Original wording for comparison</summary>

> - worktree-session inventory:
>   `/Users/enuzzo/.codex/worktrees/7c8d/sedicivalvole/docs/reconciliation/SESSION-01a04e30-INVENTORY.md`

</details>

### H009 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:23-24

Original section: **Manual recovery prompt** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 23–24). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident).

Consult when: Investigating the specific August29 incident only.

Rule coverage / supersession: Manual third-session orchestration and exact historical checkout/inventory/screenshot paths remain in the byte copy through compatibility pointer; no automatic new task, checkout or old recovery execution.

<details><summary>Original wording for comparison</summary>

> - rejected DRIVEY screenshot:
>   `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e30-fd21-7b62-89ba-1a1a14bda5ed/drivey-rejected-2026-08-29.png`

</details>

### H010 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:26-28

Original section: **Manual recovery prompt** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 26–28). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident).

Consult when: Investigating the specific August29 incident only.

Rule coverage / supersession: Manual third-session orchestration and exact historical checkout/inventory/screenshot paths remain in the byte copy through compatibility pointer; no automatic new task, checkout or old recovery execution.

<details><summary>Original wording for comparison</summary>

> This is an emergency reconciliation after two sessions worked concurrently on
> the same product. Do not create, fork, delegate or hand off another task. Do not
> start by coding. Establish one writer and one checkout first.

</details>

### H011 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:32-39

Original section: **Mandatory first phase: preserve and verify** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 32–39). Outcome: **updated**.

Active destination(s): [docs/agent-guide/recovery.md#current-continuation](../../../docs/agent-guide/recovery.md#current-continuation).

Consult when: Actual incident recovery or missing-context continuation.

Rule coverage / supersession: Mandatory full reading of ledger/inventories/all manuals was incident-specific. Historical exact list preserved; current tasks route relevant sections only per explicit migration request, with full incident sources available if investigating it.

<details><summary>Original wording for comparison</summary>

> 1. Read the complete primary-checkout `AGENTS.md`, the complete chronological
>    user-requirements ledger and both session inventory documents above in full,
>    and then the authoritative project documents listed by `AGENTS.md`,
>    including `docs/CURRENT-STATE.md`, `docs/MUSIC-CRAFT.md`,
>    `docs/FLUX-VISUAL-DIRECTIONS-2026-08-29.md`, `docs/DEPLOY.md`,
>    `docs/SOURCE-ADMISSION-2026-08-29.md`,
>    `docs/VISUAL-SOURCE-ARCHITECTURE-2026-08-29.md`, `CHANGELOG.md`, `VERSION`,
>    licensing/notices and `design-qa.md`.

</details>

### H012 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:40-43

Original section: **Mandatory first phase: preserve and verify** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 40–43). Outcome: **merged**.

Active destination(s): [AGENTS.md#non-negotiable-boundaries](../../../AGENTS.md#non-negotiable-boundaries), [docs/agent-guide/provenance.md#third-party-admission](../../../docs/agent-guide/provenance.md#third-party-admission).

Consult when: Secret/reference handling or source analysis.

Rule coverage / supersession: No secret inspection; authorized private source/audio analysis and rights verification retained. Raw reference material stays unversioned; official narrow .env loader exception is R043.

<details><summary>Original wording for comparison</summary>

> 2. Never read, print, diff, log, copy or expose `.env` or local secret files.
>    The user explicitly permits inspection of `_references/` for source/audio
>    analysis, but raw reference material must remain unversioned and its rights
>    must be verified before publishing derived material.

</details>

### H013 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:44-53

Original section: **Mandatory first phase: preserve and verify** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 44–53). Outcome: **updated**.

Active destination(s): [docs/agent-guide/recovery.md#conflicted-shared-work](../../../docs/agent-guide/recovery.md#conflicted-shared-work).

Consult when: Real concurrent-edit/rebase conflict.

Rule coverage / supersession: Relevant identities/status/index stages/rebase metadata/local hunk ownership and live process checks retained.518d673/exact PIDs/old worktree are historical incident identifiers, not current facts.

<details><summary>Original wording for comparison</summary>

> 3. Before changing either checkout, independently capture:
>    - `git worktree list --porcelain`;
>    - full status and HEAD/origin identity for both checkouts;
>    - `git status --porcelain=v2`, `git ls-files -u`, rebase metadata and reflog
>      for the conflicted worktree;
>    - the complete contents and patch identity of local commit `518d673`;
>    - stage-1/2/3 blobs and all staged, unstaged, added and untracked files;
>    - current listeners/processes associated with the worktree, including the
>      recorded Vite chain around PID `29822` / `29847` / `29848` on
>      `127.0.0.1:5173`, without assuming those PIDs are still current.

</details>

### H014 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:54-62

Original section: **Mandatory first phase: preserve and verify** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 54–62). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident).

Consult when: Reconstructing the historical conflict.

Rule coverage / supersession: Expectedef8c767/replay518d673/six paths/untracked inventories are not trusted current state; exact values preserved in historical prompt, recheck if relevant.

<details><summary>Original wording for comparison</summary>

> 4. Expected but not trusted state:
>    - primary `main == origin/main == ef8c767` before the inventory files;
>    - primary checkout has the untracked reconciliation directory only;
>    - worktree is detached at `ef8c767` with an interactive rebase stopped while
>      replaying `518d673` (`onto=ef8c767`, `orig-head=518d673`,
>      `stopped-sha=518d673`), six unmerged paths, staged additions and three
>      additional unstaged edits;
>    - the worktree inventory is the only reconciliation-era new file there.
>    Report every discrepancy before proceeding.

</details>

### H015 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:63-68

Original section: **Mandatory first phase: preserve and verify** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 63–68). Outcome: **merged**.

Active destination(s): [docs/agent-guide/recovery.md#conflicted-shared-work](../../../docs/agent-guide/recovery.md#conflicted-shared-work).

Consult when: Destructive conflict recovery decision.

Rule coverage / supersession: Preserve refs/patches/index+unstaged recoverability first and explain choice; no destructive operation beyond authority; safe reversible preservation proceeds without invented confirmation.

<details><summary>Original wording for comparison</summary>

> 5. Preserve recoverability before any destructive Git operation. Create a
>    read-only evidence snapshot or durable temporary ref/patch for `518d673`,
>    the index stages and unstaged resolution attempts. Do not run `rebase
>    --continue`, `--abort`, `--skip`, reset, restore, clean, checkout or delete
>    the worktree until this evidence is complete and you have explained the
>    recovery choice to me.

</details>

### H016 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:69-73

Original section: **Mandatory first phase: preserve and verify** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 69–73). Outcome: **updated**.

Active destination(s): [docs/agent-guide/delivery.md#canonical-publication](../../../docs/agent-guide/delivery.md#canonical-publication), [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident).

Consult when: Live identity verification or historical August29 incident.

Rule coverage / supersession: Old0.0.0/ab7a00e/20260829-1826/ef8c767 are archived dated evidence; canonical+cache-busted/hash checks remain active only when delivery/live claim matters.

<details><summary>Original wording for comparison</summary>

> 6. Reverify the canonical deployment independently. The last recorded live
>    identity is version `0.0.0`, source `ab7a00e`, build `20260829-1826`, while
>    repository HEAD is the later documentation commit `ef8c767`. Verify bare and
>    cache-busted HTML, headers/cache behavior, referenced assets and exact hashes.
>    Do not treat recorded evidence as current proof.

</details>

### H017 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:75-79

Original section: **Mandatory first phase: preserve and verify** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 75–79). Outcome: **merged**.

Active destination(s): [docs/agent-guide/recovery.md#conflicted-shared-work](../../../docs/agent-guide/recovery.md#conflicted-shared-work).

Consult when: Destructive conflict recovery decision.

Rule coverage / supersession: Preserve refs/patches/index+unstaged recoverability first and explain choice; no destructive operation beyond authority; safe reversible preservation proceeds without invented confirmation.

<details><summary>Original wording for comparison</summary>

> Before mutation, give me a concise Italian reconciliation report containing:
> the two checkout states, conflict map, commit ownership, live identity, what is
> safe to preserve, what is rejected, what is unverified, and your recommended
> recovery operation. Wait only if a genuinely destructive choice requires my
> decision; otherwise proceed with the safest reversible preservation-first path.

</details>

### H018 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:83-85

Original section: **Truth boundaries and latest user decisions** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 83–85). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident).

Consult when: Historical authorship/commit reconciliation.

Rule coverage / supersession: Exact author ranges and local/pushed state retained as dated evidence, not current ownership or deployment. No current recovery task is launched.

<details><summary>Original wording for comparison</summary>

> - Session `01a04dcc` authored/pushed the range `48d4228..ef8c767` on main,
>   including acceleration/effects, WAKE, FRACTURE, DIAG, JUNCTION PARK, ATLAS,
>   NIGHTSHIFT and the currently deployed clean-room DRIVEY.

</details>

### H019 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:86-89

Original section: **Truth boundaries and latest user decisions** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 86–89). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident).

Consult when: Historical authorship/commit reconciliation.

Rule coverage / supersession: Exact author ranges and local/pushed state retained as dated evidence, not current ownership or deployment. No current recovery task is launched.

<details><summary>Original wording for comparison</summary>

> - Session `01a04e30` authored original `94bcd74`, mapped/pushed `45f7f33`, then
>   pushed `371633e`, `77c0914`, `a797345`, and created local-only `518d673`.
>   Its PRTCL/INFINITE/PRIMORDIAL code and contextual tuner exist only in the
>   stopped worktree replay and are neither pushed nor live.

</details>

### H020 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:90-92

Original section: **Truth boundaries and latest user decisions** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 90–92). Outcome: **moved**.

Active destination(s): [docs/agent-guide/recovery.md#conflicted-shared-work](../../../docs/agent-guide/recovery.md#conflicted-shared-work).

Consult when: Conflict or cherry-pick recovery.

Rule coverage / supersession: No duplicate cherry-picks, bulk marker-free resolution or pre-rebase green-proof shortcuts.

<details><summary>Original wording for comparison</summary>

> - Do not cherry-pick commits already present on main. Do not stage the current
>   marker-free conflict working copies as a bulk resolution. Do not accept
>   green pre-rebase tests as evidence that the current conflicted state works.

</details>

### H021 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:93-98

Original section: **Truth boundaries and latest user decisions** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 93–98). Outcome: **updated**.

Active destination(s): [docs/agent-guide/visuals.md#drivey](../../../docs/agent-guide/visuals.md#drivey), [docs/agent-guide/interface.md#design-decisions](../../../docs/agent-guide/interface.md#design-decisions), [docs/agent-guide/delivery.md#canonical-publication](../../../docs/agent-guide/delivery.md#canonical-publication).

Consult when: Drivey source fidelity/replacement.

Rule coverage / supersession: Both clean-room candidates rejected; actual source integration selected, narrow bridge, GPL/dependency/asset checks and same-viewport fidelity preserved. Historical deployed candidate need not be removed again; no present app change authorized here.

<details><summary>Original wording for comparison</summary>

> - The user totally rejected the rendered/deployed clean-room DRIVEY and the
>   alternate clean-room Drivey inside `518d673`. DRIVEY is not accepted merely
>   because it is tested or live. The required result is a faithful integration
>   of the actual upstream Drivey repository/runtime and its camera/geometry
>   character, with a narrow Sedici bridge for palette, speed, music and effects.
>   Re-audit GPL, dependencies and asset provenance before integrating it.

</details>

### H022 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:99-107

Original section: **Truth boundaries and latest user decisions** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 99–107). Outcome: **updated**.

Active destination(s): [docs/agent-guide/visuals.md#drivey](../../../docs/agent-guide/visuals.md#drivey), [docs/agent-guide/visuals.md#prtcl](../../../docs/agent-guide/visuals.md#prtcl), [docs/agent-guide/visuals.md#aperture-and-rejected-studies](../../../docs/agent-guide/visuals.md#aperture-and-rejected-studies), [docs/agent-guide/provenance.md#third-party-admission](../../../docs/agent-guide/provenance.md#third-party-admission).

Consult when: Historical visual salvage or future source integration.

Rule coverage / supersession: Four distinct outcomes: Drivey faithful upstream active; PRTCL direct formula grant retained but Murmuration parked byP022; INFINITE study remains conditional/inactive, no current implementation inferred; PRIMORDIAL explicitly retired byPIANO PP1/PP2. Original source restrictions/credits survive; historical catalogue numbers are not live selection.

<details><summary>Original wording for comparison</summary>

> - The four approved visual environments remain:
>   1. DRIVEY 06 — faithful upstream integration, not either rejected
>      approximation;
>   2. PRTCL 07 — Fractal Frequency as primary plus Murmuration and Axiom, using
>      the user's explicit ownership/reuse authorization honestly;
>   3. INFINITE 08 — Particles, Star Wars and Triangle with verified Codrops,
>      dependency and asset boundaries;
>   4. PRIMORDIAL 09 — the approved fluid-field direction with verified CodePen
>      and attributed-noise boundaries.

</details>

### H023 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:108-109

Original section: **Truth boundaries and latest user decisions** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 108–109). Outcome: **updated**.

Active destination(s): [docs/agent-guide/visuals.md#shared-boundaries](../../../docs/agent-guide/visuals.md#shared-boundaries), [docs/agent-guide/music.md#effects-boundary](../../../docs/agent-guide/music.md#effects-boundary), [docs/agent-guide/motion-runtime.md#energy-and-mode-boundary](../../../docs/agent-guide/motion-runtime.md#energy-and-mode-boundary).

Consult when: Vehicle macros or renderer response.

Rule coverage / supersession: Separate road/music inputs retained. OPEN/BLOOM native-response mandate explicitly superseded byMUSIC-CRAFT6.16 owner listening retirement; Underwater native response preserved.

<details><summary>Original wording for comparison</summary>

> - OPEN, UNDERWATER and BLOOM require native responses in every active visual.
>   Road speed and musical features remain separate inputs.

</details>

### H024 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:110-114

Original section: **Truth boundaries and latest user decisions** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 110–114). Outcome: **updated**.

Active destination(s): [AGENTS.md#working-agreement](../../../AGENTS.md#working-agreement), [docs/agent-guide/visuals.md#aperture-and-rejected-studies](../../../docs/agent-guide/visuals.md#aperture-and-rejected-studies), [docs/agent-guide/delivery.md#verification-proportional-to-the-change](../../../docs/agent-guide/delivery.md#verification-proportional-to-the-change).

Consult when: Interpreting historical feature/live/acceptance claims.

Rule coverage / supersession: All dated implemented/pushed/live claims preserved only as evidence; WAKE subsequently explicitly rejected P010; no regression or acceptance inferred from old tests. Current task reads only relevant contracts/physical gates.

<details><summary>Original wording for comparison</summary>

> - NIGHTSHIFT, FRACTURE, JUNCTION PARK, DIAG, ATLAS, WAKE and the acceleration
>   detector are implemented/pushed/live according to repository evidence, but
>   their remaining human listening, visual and real-Tesla gates in the
>   inventories are still open. Independently test them after reconciliation;
>   do not silently regress them while rebuilding visuals.

</details>

### H025 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:115-117

Original section: **Truth boundaries and latest user decisions** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 115–117). Outcome: **merged**.

Active destination(s): [docs/agent-guide/visuals.md#vertigo-02](../../../docs/agent-guide/visuals.md#vertigo-02), [docs/agent-guide/motion-runtime.md#energy-and-mode-boundary](../../../docs/agent-guide/motion-runtime.md#energy-and-mode-boundary), [docs/agent-guide/diagnostics-reports.md#capture-and-presentation](../../../docs/agent-guide/diagnostics-reports.md#capture-and-presentation), [docs/agent-guide/maps.md#atlas-and-stats](../../../docs/agent-guide/maps.md#atlas-and-stats), [docs/agent-guide/music.md#junction](../../../docs/agent-guide/music.md#junction).

Consult when: Cross-mode/source/privacy/map/audio-memory work.

Rule coverage / supersession: Distinct durable contracts explicitly routed: byte-identicalVertigo,equal separate modes,coordinate-free diagnostics,mandatory map attribution,six decoded clips.

<details><summary>Original wording for comparison</summary>

> - Preserve VERTIGO 02 byte-identical upstream files, Engine/Flux separation,
>   coordinate-free diagnostics, mandatory ATLAS attribution and the six-clip
>   decoded-audio bound.

</details>

### H026 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:118-119

Original section: **Truth boundaries and latest user decisions** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 118–119). Outcome: **merged**.

Active destination(s): [docs/agent-guide/delivery.md#identity-and-records](../../../docs/agent-guide/delivery.md#identity-and-records).

Consult when: Changelog changes.

Rule coverage / supersession: Never rewrite historical entry including false claim; append correction.

<details><summary>Original wording for comparison</summary>

> - `CHANGELOG.md` is strictly append-only. Never edit or remove earlier entries,
>   even when correcting a false claim; append a correction later.

</details>

### H027 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:123-126

Original section: **Recovery and implementation** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 123–126). Outcome: **updated**.

Active destination(s): [docs/agent-guide/recovery.md#conflicted-shared-work](../../../docs/agent-guide/recovery.md#conflicted-shared-work), [docs/agent-guide/visuals.md#shared-boundaries](../../../docs/agent-guide/visuals.md#shared-boundaries), [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident).

Consult when: Actual recovery/salvage request.

Rule coverage / supersession: Account for useful hunks/artifacts deliberately, do not blindly continue rebase or generic conflict results.518d673/four-environment reconstruction itinerary stays historical; inspect current selected source before salvage.

<details><summary>Original wording for comparison</summary>

> 1. Compare `518d673` against current main file by file. Classify every hunk as:
>    rejected Drivey, potentially reusable PRTCL, potentially reusable INFINITE,
>    potentially reusable PRIMORDIAL, shared tuner/lifecycle, obsolete integration
>    assumption, or conflict with newer main behavior.

</details>

### H028 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:127-129

Original section: **Recovery and implementation** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 127–129). Outcome: **updated**.

Active destination(s): [docs/agent-guide/recovery.md#conflicted-shared-work](../../../docs/agent-guide/recovery.md#conflicted-shared-work), [docs/agent-guide/visuals.md#shared-boundaries](../../../docs/agent-guide/visuals.md#shared-boundaries), [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident).

Consult when: Actual recovery/salvage request.

Rule coverage / supersession: Account for useful hunks/artifacts deliberately, do not blindly continue rebase or generic conflict results.518d673/four-environment reconstruction itinerary stays historical; inspect current selected source before salvage.

<details><summary>Original wording for comparison</summary>

> 2. Prefer reconstructing approved pieces deliberately on current main after
>    preservation over continuing the conflicted rebase blindly. Do not discard
>    the old state until every useful hunk and artifact has been accounted for.

</details>

### H029 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:130-132

Original section: **Recovery and implementation** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 130–132). Outcome: **updated**.

Active destination(s): [docs/agent-guide/visuals.md#drivey](../../../docs/agent-guide/visuals.md#drivey), [docs/agent-guide/interface.md#design-decisions](../../../docs/agent-guide/interface.md#design-decisions), [docs/agent-guide/delivery.md#canonical-publication](../../../docs/agent-guide/delivery.md#canonical-publication).

Consult when: Drivey source fidelity/replacement.

Rule coverage / supersession: Both clean-room candidates rejected; actual source integration selected, narrow bridge, GPL/dependency/asset checks and same-viewport fidelity preserved. Historical deployed candidate need not be removed again; no present app change authorized here.

<details><summary>Original wording for comparison</summary>

> 3. Remove or replace the rejected deployed Drivey only through a reviewed,
>    reversible checkpoint. First inspect the real upstream runtime and show a
>    same-viewport reference/candidate comparison. Do not invent another road.

</details>

### H030 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:133-136

Original section: **Recovery and implementation** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 133–136). Outcome: **updated**.

Active destination(s): [docs/agent-guide/recovery.md#conflicted-shared-work](../../../docs/agent-guide/recovery.md#conflicted-shared-work), [docs/agent-guide/visuals.md#shared-boundaries](../../../docs/agent-guide/visuals.md#shared-boundaries), [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident).

Consult when: Actual recovery/salvage request.

Rule coverage / supersession: Account for useful hunks/artifacts deliberately, do not blindly continue rebase or generic conflict results.518d673/four-environment reconstruction itinerary stays historical; inspect current selected source before salvage.

<details><summary>Original wording for comparison</summary>

> 4. Reassess PRTCL, INFINITE and PRIMORDIAL against their actual rendered
>    sources. Existing worktree prototypes are candidates, not accepted designs.
>    Salvage one environment at a time, excluding rejected Drivey and generic
>    conflict resolutions until explicitly reviewed.

</details>

### H031 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:137-138

Original section: **Recovery and implementation** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 137–138). Outcome: **moved**.

Active destination(s): [docs/agent-guide/motion-runtime.md#environment-portability](../../../docs/agent-guide/motion-runtime.md#environment-portability), [prototype/drive-lab/AGENTS.md#local-work](../../../prototype/drive-lab/AGENTS.md#local-work).

Consult when: Cross-machine native environment failure.

Rule coverage / supersession: Lockfile/native rebuild for this Mac, never trust copied node_modules; use existing wrappers, no install mandate for unrelated docs.

<details><summary>Original wording for comparison</summary>

> 5. Establish dependencies from the lockfile and rebuild native packages for
>    this Mac; never trust copied native `node_modules`.

</details>

### H032 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:139-143

Original section: **Recovery and implementation** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 139–143). Outcome: **updated**.

Active destination(s): [docs/agent-guide/delivery.md#verification-proportional-to-the-change](../../../docs/agent-guide/delivery.md#verification-proportional-to-the-change).

Consult when: Recovered app behavior or release verification.

Rule coverage / supersession: Full-suite-per-small-unit itinerary was emergency-specific. Retain targeted behavior checks, release regression/package gate, console/performance/memory/reduced-motion/lifecycle/responsive/source773x601 where relevant, and physical acceptance distinction. Current migration prohibits app execution.

<details><summary>Original wording for comparison</summary>

> 6. For each small recovered or rebuilt unit, run focused tests, the full suite,
>    production build, muted browser console/performance/memory QA, reduced-motion
>    and lifecycle checks, responsive checks, and exact `773 x 601` source-versus-
>    implementation comparison. Screenshots alone and green tests are not human
>    acceptance.

</details>

### H033 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:144-149

Original section: **Recovery and implementation** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 144–149). Outcome: **updated**.

Active destination(s): [docs/agent-guide/interface.md#design-decisions](../../../docs/agent-guide/interface.md#design-decisions), [docs/agent-guide/delivery.md#identity-and-records](../../../docs/agent-guide/delivery.md#identity-and-records), [docs/agent-guide/delivery.md#canonical-publication](../../../docs/agent-guide/delivery.md#canonical-publication).

Consult when: Selected visual publication.

Rule coverage / supersession: No rejected/unselected direction publication; build/docs/append changelog/smallcommit/push/exactsource stamp/canonical checks retained. Fresh deployment confirmation superseded R042, not visual selection/source gates.

<details><summary>Original wording for comparison</summary>

> 7. Show me the visuals before publishing them. Do not deploy a rejected or
>    merely machine-tested direction. After user approval, update factual docs,
>    append the changelog, create a small verified commit, push it, deploy the
>    exact committed source with a fresh build stamp, and verify canonical/cache-
>    busted HTML, assets, version, source commit and cache behavior. Never expose
>    secrets.

</details>

### H034 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:150-151

Original section: **Recovery and implementation** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 150–151). Outcome: **merged**.

Active destination(s): [AGENTS.md#working-agreement](../../../AGENTS.md#working-agreement), [docs/agent-guide/delivery.md#verification-proportional-to-the-change](../../../docs/agent-guide/delivery.md#verification-proportional-to-the-change).

Consult when: Progress/status communication.

Rule coverage / supersession: Concise Italian updates and all implementation/test/push/live/human/Tesla states distinct.

<details><summary>Original wording for comparison</summary>

> 8. Keep frequent concise Italian updates. Clearly separate implemented,
>    tested, pushed, live, human-accepted and real-Tesla-accepted states.

</details>

### H035 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:153-153

Original section: **Recovery and implementation** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 153–153). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident), [docs/agent-guide/recovery.md#conflicted-shared-work](../../../docs/agent-guide/recovery.md#conflicted-shared-work), [docs/agent-guide/delivery.md#verification-proportional-to-the-change](../../../docs/agent-guide/delivery.md#verification-proportional-to-the-change).

Consult when: Closing that exact emergency recovery only.

Rule coverage / supersession: Original incident completion list remains intact: sole writer,preserved+resolved worktree/518d673+edits,ledger+inventories,full current regression,four truthful states,rejectedDrivey,Git/remote/live. Durable preservation/truth/check distinctions active; no claim this migration re-executes or closes that incident.

<details><summary>Original wording for comparison</summary>

> Do not declare the recovery complete until:

</details>

### H036 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:155-155

Original section: **Recovery and implementation** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 155–155). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident), [docs/agent-guide/recovery.md#conflicted-shared-work](../../../docs/agent-guide/recovery.md#conflicted-shared-work), [docs/agent-guide/delivery.md#verification-proportional-to-the-change](../../../docs/agent-guide/delivery.md#verification-proportional-to-the-change).

Consult when: Closing that exact emergency recovery only.

Rule coverage / supersession: Original incident completion list remains intact: sole writer,preserved+resolved worktree/518d673+edits,ledger+inventories,full current regression,four truthful states,rejectedDrivey,Git/remote/live. Durable preservation/truth/check distinctions active; no claim this migration re-executes or closes that incident.

<details><summary>Original wording for comparison</summary>

> - one checkout and one session are the sole writer;

</details>

### H037 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:156-157

Original section: **Recovery and implementation** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 156–157). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident), [docs/agent-guide/recovery.md#conflicted-shared-work](../../../docs/agent-guide/recovery.md#conflicted-shared-work), [docs/agent-guide/delivery.md#verification-proportional-to-the-change](../../../docs/agent-guide/delivery.md#verification-proportional-to-the-change).

Consult when: Closing that exact emergency recovery only.

Rule coverage / supersession: Original incident completion list remains intact: sole writer,preserved+resolved worktree/518d673+edits,ledger+inventories,full current regression,four truthful states,rejectedDrivey,Git/remote/live. Durable preservation/truth/check distinctions active; no claim this migration re-executes or closes that incident.

<details><summary>Original wording for comparison</summary>

> - the conflicted worktree has been preserved and intentionally resolved or
>   retired without losing `518d673` or its unstaged edits;

</details>

### H038 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:158-159

Original section: **Recovery and implementation** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 158–159). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident), [docs/agent-guide/recovery.md#conflicted-shared-work](../../../docs/agent-guide/recovery.md#conflicted-shared-work), [docs/agent-guide/delivery.md#verification-proportional-to-the-change](../../../docs/agent-guide/delivery.md#verification-proportional-to-the-change).

Consult when: Closing that exact emergency recovery only.

Rule coverage / supersession: Original incident completion list remains intact: sole writer,preserved+resolved worktree/518d673+edits,ledger+inventories,full current regression,four truthful states,rejectedDrivey,Git/remote/live. Durable preservation/truth/check distinctions active; no claim this migration re-executes or closes that incident.

<details><summary>Original wording for comparison</summary>

> - every requirement in the chronological ledger and every commit or task in
>   both inventories is accounted for;

</details>

### H039 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:160-160

Original section: **Recovery and implementation** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 160–160). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident), [docs/agent-guide/recovery.md#conflicted-shared-work](../../../docs/agent-guide/recovery.md#conflicted-shared-work), [docs/agent-guide/delivery.md#verification-proportional-to-the-change](../../../docs/agent-guide/delivery.md#verification-proportional-to-the-change).

Consult when: Closing that exact emergency recovery only.

Rule coverage / supersession: Original incident completion list remains intact: sole writer,preserved+resolved worktree/518d673+edits,ledger+inventories,full current regression,four truthful states,rejectedDrivey,Git/remote/live. Durable preservation/truth/check distinctions active; no claim this migration re-executes or closes that incident.

<details><summary>Original wording for comparison</summary>

> - the full current-main regression gate passes;

</details>

### H040 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:161-161

Original section: **Recovery and implementation** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 161–161). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident), [docs/agent-guide/recovery.md#conflicted-shared-work](../../../docs/agent-guide/recovery.md#conflicted-shared-work), [docs/agent-guide/delivery.md#verification-proportional-to-the-change](../../../docs/agent-guide/delivery.md#verification-proportional-to-the-change).

Consult when: Closing that exact emergency recovery only.

Rule coverage / supersession: Original incident completion list remains intact: sole writer,preserved+resolved worktree/518d673+edits,ledger+inventories,full current regression,four truthful states,rejectedDrivey,Git/remote/live. Durable preservation/truth/check distinctions active; no claim this migration re-executes or closes that incident.

<details><summary>Original wording for comparison</summary>

> - the four visual directions have truthful status;

</details>

### H041 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:162-162

Original section: **Recovery and implementation** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 162–162). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident), [docs/agent-guide/recovery.md#conflicted-shared-work](../../../docs/agent-guide/recovery.md#conflicted-shared-work), [docs/agent-guide/delivery.md#verification-proportional-to-the-change](../../../docs/agent-guide/delivery.md#verification-proportional-to-the-change).

Consult when: Closing that exact emergency recovery only.

Rule coverage / supersession: Original incident completion list remains intact: sole writer,preserved+resolved worktree/518d673+edits,ledger+inventories,full current regression,four truthful states,rejectedDrivey,Git/remote/live. Durable preservation/truth/check distinctions active; no claim this migration re-executes or closes that incident.

<details><summary>Original wording for comparison</summary>

> - rejected Drivey is not presented as accepted;

</details>

### H042 — docs/reconciliation/MANUAL-RECOVERY-PROMPT.md:163-163

Original section: **Recovery and implementation** ([byte-identical original](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt), lines 163–163). Outcome: **historical**.

Active destination(s): [docs/agent-guide/recovery.md#historical-august-29-incident](../../../docs/agent-guide/recovery.md#historical-august-29-incident), [docs/agent-guide/recovery.md#conflicted-shared-work](../../../docs/agent-guide/recovery.md#conflicted-shared-work), [docs/agent-guide/delivery.md#verification-proportional-to-the-change](../../../docs/agent-guide/delivery.md#verification-proportional-to-the-change).

Consult when: Closing that exact emergency recovery only.

Rule coverage / supersession: Original incident completion list remains intact: sole writer,preserved+resolved worktree/518d673+edits,ledger+inventories,full current regression,four truthful states,rejectedDrivey,Git/remote/live. Durable preservation/truth/check distinctions active; no claim this migration re-executes or closes that incident.

<details><summary>Original wording for comparison</summary>

> - Git state, remote state and live identity are explicitly reported.

</details>
