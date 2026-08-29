# Manual recovery prompt

Use this prompt when manually opening the third Sedici Valvole recovery
session. Do not delegate it to another automatically created task.

---

You are the sole recovery owner for Sedici Valvole. Work in English for code,
documentation, commit text, logs and product copy; speak to me in Italian.

Repository and evidence paths:

- primary checkout:
  `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole`
- conflicted worktree:
  `/Users/enuzzo/.codex/worktrees/7c8d/sedicivalvole`
- complete chronological user-requirements ledger:
  `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole/docs/reconciliation/COMPLETE-USER-REQUIREMENTS-2026-08-29.md`
- execution-session inventory:
  `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole/docs/reconciliation/SESSION-01a04dcc-INVENTORY.md`
- worktree-session inventory:
  `/Users/enuzzo/.codex/worktrees/7c8d/sedicivalvole/docs/reconciliation/SESSION-01a04e30-INVENTORY.md`
- rejected DRIVEY screenshot:
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e30-fd21-7b62-89ba-1a1a14bda5ed/drivey-rejected-2026-08-29.png`

This is an emergency reconciliation after two sessions worked concurrently on
the same product. Do not create, fork, delegate or hand off another task. Do not
start by coding. Establish one writer and one checkout first.

## Mandatory first phase: preserve and verify

1. Read the complete primary-checkout `AGENTS.md`, the complete chronological
   user-requirements ledger and both session inventory documents above in full,
   and then the authoritative project documents listed by `AGENTS.md`,
   including `docs/CURRENT-STATE.md`, `docs/MUSIC-CRAFT.md`,
   `docs/FLUX-VISUAL-DIRECTIONS-2026-08-29.md`, `docs/DEPLOY.md`,
   `docs/SOURCE-ADMISSION-2026-08-29.md`,
   `docs/VISUAL-SOURCE-ARCHITECTURE-2026-08-29.md`, `CHANGELOG.md`, `VERSION`,
   licensing/notices and `design-qa.md`.
2. Never read, print, diff, log, copy or expose `.env` or local secret files.
   The user explicitly permits inspection of `_references/` for source/audio
   analysis, but raw reference material must remain unversioned and its rights
   must be verified before publishing derived material.
3. Before changing either checkout, independently capture:
   - `git worktree list --porcelain`;
   - full status and HEAD/origin identity for both checkouts;
   - `git status --porcelain=v2`, `git ls-files -u`, rebase metadata and reflog
     for the conflicted worktree;
   - the complete contents and patch identity of local commit `518d673`;
   - stage-1/2/3 blobs and all staged, unstaged, added and untracked files;
   - current listeners/processes associated with the worktree, including the
     recorded Vite chain around PID `29822` / `29847` / `29848` on
     `127.0.0.1:5173`, without assuming those PIDs are still current.
4. Expected but not trusted state:
   - primary `main == origin/main == ef8c767` before the inventory files;
   - primary checkout has the untracked reconciliation directory only;
   - worktree is detached at `ef8c767` with an interactive rebase stopped while
     replaying `518d673` (`onto=ef8c767`, `orig-head=518d673`,
     `stopped-sha=518d673`), six unmerged paths, staged additions and three
     additional unstaged edits;
   - the worktree inventory is the only reconciliation-era new file there.
   Report every discrepancy before proceeding.
5. Preserve recoverability before any destructive Git operation. Create a
   read-only evidence snapshot or durable temporary ref/patch for `518d673`,
   the index stages and unstaged resolution attempts. Do not run `rebase
   --continue`, `--abort`, `--skip`, reset, restore, clean, checkout or delete
   the worktree until this evidence is complete and you have explained the
   recovery choice to me.
6. Reverify the canonical deployment independently. The last recorded live
   identity is version `0.0.0`, source `ab7a00e`, build `20260829-1826`, while
   repository HEAD is the later documentation commit `ef8c767`. Verify bare and
   cache-busted HTML, headers/cache behavior, referenced assets and exact hashes.
   Do not treat recorded evidence as current proof.

Before mutation, give me a concise Italian reconciliation report containing:
the two checkout states, conflict map, commit ownership, live identity, what is
safe to preserve, what is rejected, what is unverified, and your recommended
recovery operation. Wait only if a genuinely destructive choice requires my
decision; otherwise proceed with the safest reversible preservation-first path.

## Truth boundaries and latest user decisions

- Session `01a04dcc` authored/pushed the range `48d4228..ef8c767` on main,
  including acceleration/effects, WAKE, FRACTURE, DIAG, JUNCTION PARK, ATLAS,
  NIGHTSHIFT and the currently deployed clean-room DRIVEY.
- Session `01a04e30` authored original `94bcd74`, mapped/pushed `45f7f33`, then
  pushed `371633e`, `77c0914`, `a797345`, and created local-only `518d673`.
  Its PRTCL/INFINITE/PRIMORDIAL code and contextual tuner exist only in the
  stopped worktree replay and are neither pushed nor live.
- Do not cherry-pick commits already present on main. Do not stage the current
  marker-free conflict working copies as a bulk resolution. Do not accept
  green pre-rebase tests as evidence that the current conflicted state works.
- The user totally rejected the rendered/deployed clean-room DRIVEY and the
  alternate clean-room Drivey inside `518d673`. DRIVEY is not accepted merely
  because it is tested or live. The required result is a faithful integration
  of the actual upstream Drivey repository/runtime and its camera/geometry
  character, with a narrow Sedici bridge for palette, speed, music and effects.
  Re-audit GPL, dependencies and asset provenance before integrating it.
- The four approved visual environments remain:
  1. DRIVEY 06 — faithful upstream integration, not either rejected
     approximation;
  2. PRTCL 07 — Fractal Frequency as primary plus Murmuration and Axiom, using
     the user's explicit ownership/reuse authorization honestly;
  3. INFINITE 08 — Particles, Star Wars and Triangle with verified Codrops,
     dependency and asset boundaries;
  4. PRIMORDIAL 09 — the approved fluid-field direction with verified CodePen
     and attributed-noise boundaries.
- OPEN, UNDERWATER and BLOOM require native responses in every active visual.
  Road speed and musical features remain separate inputs.
- NIGHTSHIFT, FRACTURE, JUNCTION PARK, DIAG, ATLAS, WAKE and the acceleration
  detector are implemented/pushed/live according to repository evidence, but
  their remaining human listening, visual and real-Tesla gates in the
  inventories are still open. Independently test them after reconciliation;
  do not silently regress them while rebuilding visuals.
- Preserve VERTIGO 02 byte-identical upstream files, Engine/Flux separation,
  coordinate-free diagnostics, mandatory ATLAS attribution and the six-clip
  decoded-audio bound.
- `CHANGELOG.md` is strictly append-only. Never edit or remove earlier entries,
  even when correcting a false claim; append a correction later.

## Recovery and implementation

1. Compare `518d673` against current main file by file. Classify every hunk as:
   rejected Drivey, potentially reusable PRTCL, potentially reusable INFINITE,
   potentially reusable PRIMORDIAL, shared tuner/lifecycle, obsolete integration
   assumption, or conflict with newer main behavior.
2. Prefer reconstructing approved pieces deliberately on current main after
   preservation over continuing the conflicted rebase blindly. Do not discard
   the old state until every useful hunk and artifact has been accounted for.
3. Remove or replace the rejected deployed Drivey only through a reviewed,
   reversible checkpoint. First inspect the real upstream runtime and show a
   same-viewport reference/candidate comparison. Do not invent another road.
4. Reassess PRTCL, INFINITE and PRIMORDIAL against their actual rendered
   sources. Existing worktree prototypes are candidates, not accepted designs.
   Salvage one environment at a time, excluding rejected Drivey and generic
   conflict resolutions until explicitly reviewed.
5. Establish dependencies from the lockfile and rebuild native packages for
   this Mac; never trust copied native `node_modules`.
6. For each small recovered or rebuilt unit, run focused tests, the full suite,
   production build, muted browser console/performance/memory QA, reduced-motion
   and lifecycle checks, responsive checks, and exact `773 x 601` source-versus-
   implementation comparison. Screenshots alone and green tests are not human
   acceptance.
7. Show me the visuals before publishing them. Do not deploy a rejected or
   merely machine-tested direction. After user approval, update factual docs,
   append the changelog, create a small verified commit, push it, deploy the
   exact committed source with a fresh build stamp, and verify canonical/cache-
   busted HTML, assets, version, source commit and cache behavior. Never expose
   secrets.
8. Keep frequent concise Italian updates. Clearly separate implemented,
   tested, pushed, live, human-accepted and real-Tesla-accepted states.

Do not declare the recovery complete until:

- one checkout and one session are the sole writer;
- the conflicted worktree has been preserved and intentionally resolved or
  retired without losing `518d673` or its unstaged edits;
- every requirement in the chronological ledger and every commit or task in
  both inventories is accounted for;
- the full current-main regression gate passes;
- the four visual directions have truthful status;
- rejected Drivey is not presented as accepted;
- Git state, remote state and live identity are explicitly reported.
