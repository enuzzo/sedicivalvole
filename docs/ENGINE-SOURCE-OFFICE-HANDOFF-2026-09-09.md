# Engine source research — office handoff

Prepared September 9, 2026, Europe/Rome. Owner launches the next session manually.
This handoff does not launch another agent, buy software, or publish a build.

## Start here

Work directly in `<repository-root>`
on the office Mac, not the home-only `<historical-worktree-a9fc>`.
Read AGENTS.md, this document, and the linked research before searching. Confirm
Dropbox has finished syncing, Git is clean, branch/HEAD and remotes are expected,
and no other session is writing. Do not reset a newer checkout to this checkpoint.

Baseline before this documentation handoff: **895eb0c**, on main and
codex/engine-recording-research-20260908. Latest published product source:
**de16389**, build **20260908-2356**, VERSION **0.0.0**. Deployment evidence is in
[the retained-voices report](ENGINE-RETAINED-VOICES-2026-09-08.md) and DEPLOY.md.
The final documentation commit will be later than this baseline; inspect Git log.

## Owner decision, overriding earlier research proposals

**Keep Mono, Rosso and Touring.** The owner likes all three. Touring is the intended
third retained voice; an earlier conversational reference to “Turbine” was corrected.
**Otto, Cinque and Turbine are retired from selection**, already implemented and
published. Their internal definitions remain for history/tests. Do not remove
Mono's accepted hybrid component merely because other synthetic voices were rejected.

The 111-item recording catalogue was listened to and rejected as a research
direction: too many short, disconnected recordings, without convincing engine
load and RPM dynamics. More field recordings, stationary revs, single loops or
pitch-shifted snippets do not answer the request. Find **coherent engine banks**:
files from the same engine, split by RPM and ideally both power-on and power-off,
with usable mappings and rights. Repositories and game-audio sources are the target.

The owner heard the official FMOD granular truck demo and rejected its sound
(the flute comparison). **Stop FMOD acquisition and integration.** The earlier
account question is obsolete; do not ask again. This rejects that demo as a
candidate, not every possible sound made with FMOD. FMOD is middleware, not an
established free library of multiple usable engine banks. No FMOD code/media was
installed or shipped. Its example-media redistribution restriction independently
prevents treating demo WAV/OGG/FSB/BANK files as free product assets.

## Read-first evidence and source maps

1. [Retained voices / FMOD outcome](ENGINE-RETAINED-VOICES-2026-09-08.md).
2. [Game-audio research](ENGINE-GAME-AUDIO-RESEARCH-2026-09-08.md): fresh-source pass,
   official listings, licensing distinctions, acquisition limits.
3. [Recording research](ENGINE-RECORDING-RESEARCH-2026-09-08.md): prior source ledger,
   exact URLs, local acquisitions and screening. Its proposed recording comparison
   is superseded by the owner decision above; use it to avoid repeating work.
4. `tools/engine-listening-room/catalog.json`: exact visited/acquired source URLs,
   creators, codes, hashes, format/duration and preparation.
5. [Integration](ENGINE-INTEGRATION-2026-09-07.md),
   [source comparison](ENGINE-SOURCE-COMPARISON-2026-09-08.md),
   [listening refinement](ENGINE-LISTENING-REFINEMENT-2026-09-08.md),
   [existing A/B LAB](ENGINE-LISTENING-LAB-2026-09-08.md).
6. CURRENT-STATE.md for other work; MUSIC-CRAFT.md for accumulated audio findings.

Current accepted donor is `markeasting/engine-audio`, pinned at
`b8cf9887c914f17c2f006d68427080e39d02d0b0`. Inspect
`prototype/drive-lab/src/engine/source-inventory.json` and
`prototype/drive-lab/src/engine/upstream/configurations.ts` before choosing a donor.
The 16 active WAVs and their hashes establish the comparison baseline: `on_low`,
`on_high`, `off_low`, `off_high`, limiter and optional transmission layers.
Mono uses bac_mono, Rosso ferr_458, Touring procar. Configuration RPM values and
local pitch-reference calibration are not independently measured recording RPM.
The owner's explicit acceptance of this repository's declared MIT licence and
bundled WAVs is specific to this integration; recording provenance follow-up
remains open. It is not permission to assume unrelated code licences cover audio.

## Where not to search again, and what is actually still open

Deduplicate **exact projects, collections and URLs**, not entire hosting services.
GitHub must remain available for NEW repositories: a blanket GitHub ban would
contradict this task. Read the two research ledgers and catalogue first. Record
visited pages separately from search-result snippets, failed requests and files
actually inspected. Reopen an old source only to resolve a named unanswered
question, documenting that reason; do not repeat generic browsing.

| Source or family | Evidence / reason | Next-session treatment |
| --- | --- | --- |
| FMOD official granular truck, downloads, Studio examples and historical media | Owner rejected the demo; software is middleware; example-media redistribution restricted; download sign-in was not completed | Closed candidate. No account, installation, demo extraction or integration |
| Freesound / OpenGameArt recordings already catalogued, muted.io Performance Cars | Mostly disconnected or unidentified short clips; no verified coherent RPM/load bank. Owner rejected the mass-audition approach | Do not download/replay the same collection. Consult exact ledger only |
| dklon motorcycle archive, Generic V8 short loops, Opel clip, existing pauliuw/NOX listings | No demonstrated matched engine-state bank; motorcycle/short-loop auditions did not solve dynamics | No repeated generic motorcycle/engine-SFX search |
| Aircraft jets, Cessna, industrial turbines | Wrong acoustic target, explicitly rejected; Turbine voice retired | Exclude aviation/industrial searches |
| SFXMint AI-001/002/003 | Three independent generated clips, not a coherent engine bank; not individually established as owner-approved | Do not regenerate or expand this catalogue |
| CrunchySFX, omgaudio, SoundsFree, Nightloop-style generators | Generic synthesis or unclear output rights; no verified bank addressing the request | Deprioritize; do not restart synthetic substitutes |
| Jreo SVA/g4-svd, procedural-engine-sounds dataset | Synthesized material, despite code/data licences; not the desired recorded donor | Study only if owner changes direction |
| AKAudio engine synth, Andy Farnell models, Ange Yaghi engine-sim, Real Engine Simulator | Architecture/behavior studies, not established redistributable recording banks | Preserve prior learning; no procedural rewrite or proprietary runtime/preset extraction |
| Sonniss generic bundles and metadata-only academic libraries | Large non-targeted acquisition or unclear asset rights; not a verified ready bank | Only reconsider a specifically identified coherent bank with terms |
| Skril Studio free Rotary X8 and I6 German | Strong structural lead; official free listings/manual found. Actual files not acquired or auditioned; not rejected | Resolve exact asset inventory, RPM/load layout and usable licence first |
| Speed Dreams car data | Pinned data study exists; actual audio bank coverage not established or auditioned; per-file licensing required | Targeted data/configuration audit, not another generic project overview |
| VDrift car-data repository | Separate data source found, audio/rights audit unfinished | Targeted file and mapping audit |
| Stunt Rally | Community audio provenance unresolved; software GPL does not automatically license recordings | Inspect actual credits and asset rights before treating as usable |
| Soundwave Concepts downloads | Direct page timed out; search snippet suggested layered engine examples | Access failure, not an audition or licence rejection. One targeted retry may be useful |

Exact unresolved leads, avoiding rediscovery:

- [Skril Rotary X8](https://assetstore.unity.com/packages/audio/sound-fx/transportation/rotary-x8-free-engine-sound-pack-106119),
  [I6 German](https://assetstore.unity.com/packages/audio/sound-fx/transportation/i6-german-free-engine-sound-pack-106037),
  [author catalogue](https://skrilstudio.com/asset-products/),
  [official manual](https://skrilstudio.com/Docs/Realistic%20Engine%20Sounds%202%20Lite%20Edition%20Documentation.pdf).
  Free price is verified historically; exact downloaded file count is not. Do not
  copy a secondary “18 WAV” claim into verified results. Unity asset terms may
  allow embedded use while restricting raw redistribution; evaluate both separately.
  Do not reject a source merely for not being MIT/CC0, nor accept an agreement or
  buy access on the owner's behalf. If access needs the owner, finish independent work.
- Speed Dreams data revision `5ee49962064902d70cb702952d567ffccebf752c`;
  exact links/credits are in the recording report. Determine whether files are
  merely one steady loop per car or genuinely multiple load/RPM states.
- [Soundwave Concepts](https://www.soundwaveconcepts.com.au/downloads.HTM):
  snippet mentioned Big V8 and Yamaha 450/FMOD examples. Availability, exact
  files, cost and rights remain unverified; the snippet is not acquisition evidence.

Other domains already covered in the ledgers include itch.io, Wikimedia Commons,
Sonniss, BigSoundBank, Hugging Face, SourceForge, forge.a-lec.org, the relevant
academic repositories, Reddit, Unity, skrilstudio.com, sfxmint.com, crunchysfx.com,
omgaudio.vercel.app, soundsfree.art, akaudio.com, aspress.co.uk and flowlab.io.
Do not spend another pass rediscovering their same pages. Search-only mentions
are not verified sources; unofficial asset mirrors are not an acquisition route.

## Portable auditions and owner feedback

The following ignored folders were copied to the saved Dropbox project with
no overwrite of differing existing files: `_references/engine-listening-room/`,
`_references/engine-recording-research-2026-09-08/`, and
`_references/engine-game-audio-sources/`. Local copy verification covered
**130 files / 427,559,567 bytes**, including all **111 catalogue media hashes**.
Dropbox cloud transfer and availability on the office Mac are NOT verified.
Wait for sync and check the files there. Never add `_references/` to Git.

Owner feedback snapshot:
`_references/engine-listening-room/owner-feedback-2026-09-08.json`.
There are 30 rated entries: 2 Keep, 4 Maybe, 24 Reject. Unrated does not mean rejected.
Browser localStorage does not travel with Git or Dropbox; this JSON is the portable
record. The catalogue is 111 auditions, not 111 engines.

- Maybe V8-001/V8-002 Ford: attractive depth/revs, but missing driving under load.
- Maybe V8-003/V8-003-X Maserati: attractive ignition/idle/stationary revs;
  dynamic driving use remains unanswered.
- Keep MUT-009: nice but short revs; MUT-034: no written comment.
- Keep these as optional startup/neutral-gesture references, not evidence that
  they form a usable road engine bank. Do not ask the owner to listen to all 111 again.

If an exact old audition is needed, run only
`python3 tools/engine-listening-room/serve.py` from the saved repository and open
http://127.0.0.1:8767/. Do NOT rerun prepare.py by default: its original input
was in this Mac's `/tmp/sedicivalvole-engine-research-20260908`, which is not portable.
The prepared directory is self-contained. The new-source temporary research
folder is also not an office dependency. Existing code and catalogue are in Git.

## Execute a deep, selective investigation

1. Inventory existing evidence and build an exclusion ledger from exact URLs.
   Establish the accepted bank's role matrix before searching. Aim for recorded
   engine identity, consistent microphone perspective, several steady RPM bands,
   genuine loaded/coasting behavior and usable transition overlap. Startup/shutdown
   and limiter/transmission/turbo layers are optional additions, not substitutes.
2. Resolve the bounded Skril inventory/terms question and actual Speed Dreams /
   VDrift data coverage. In parallel conceptually, search NEW repositories and
   game projects with WAV/OGG/FLAC assets and configuration mappings: `on_low`,
   `off_low`, `on_high`, `coast`, `RPM`, `engine sound`, `vehicle audio`, `load`.
   Follow car configuration references to real assets; code-only audio engines,
   marketing clips and ripped commercial game banks do not qualify.
3. Before downloading a large collection, inspect its file listing, credits and
   asset licence. Record author, exact URL, revision, each relevant filename,
   role/RPM mapping, format, duration, rights, acquisition status and missing facts.
   Label candidates BANK VERIFIED, PARTIAL, REJECTED, ACCESS BLOCKED or RIGHTS
   UNRESOLVED. Keep structural verification separate from audible acceptance.
4. Acquire only promising authorised small banks outside Git; hash them and keep
   source notices. Verify actual content rather than inferring from names. Check
   steady sections, loop seams, clipping, phase/perspective consistency, load versus
   coast differences and moderate transposition. Do not invent RPM metadata.
5. Return a compact comparison of the best qualified candidates, ideally up to
   three but with no quota. If none qualifies, state that plainly with evidence;
   do not pad results with another hundred clips. Explain which missing property
   prevents each near miss from working.
6. For a qualified bank, propose or implement an isolated adaptation in the
   existing protected A/B LAB, preserving a stable reference and new calibration
   IDs. Use the same route, original levels and clearly labelled processing.
   Reuse the selected interface; a new visual surface still needs three directions.
   Owner listening decides improvement; technical playback alone does not prove it.

## Implementation boundaries and remaining gates

Preserve all three accepted public voices and their current calibration until a
specific improvement is established. Keep Engine dry and bypass Flux/UNDERWATER;
no deceleration gain ducking. Preserve GPS/lifecycle recovery, manual TAMARRO
before first GPS fix, movement cancellation and exact-zero requirements for
automatic idle gestures. Keep restrained urban 20–40 km/h, meaningful power at
80 and progression to the 130 km/h road ceiling with coherent virtual ratios.
Do not describe virtual RPM/gears as Tesla telemetry.

The previous product checkpoint passed 807 native tests, 10 packaging checks,
196 dependency-credit entries and canonical byte/cache verification. Local actual
selectors loaded all three retained voices without errors. Canonical viewport
was verified at innerWidth 773 / innerHeight 601; captured image scaling is
separately disclosed in the release report. New target-vehicle acceptance remains
open. This handoff adds no runtime change and needs no deployment.

For subsequent code changes, use the repository's architecture-aware commands
in `prototype/drive-lab`: `npm run native:check`, `npm run test:native`,
`npm run build:native`. Confirm supported Python (previous system Python 3.9 was
insufficient for a fixture). Do not copy node_modules across Intel/Apple Silicon
or bypass native wrappers after an esbuild architecture mismatch. Run relevant
checks once; broaden only as justified. Keep small verified commits and push.
For a product integration, update provenance/community documents together and
use the authorised official deployment script after green gates, with canonical
HTML/assets/build/cache verification. Never inspect or copy .env; its internal
loading by the official deployment script is the sole configured exception.

Other open acceptance items are separate from this Engine research priority:
physical Tesla/iPhone and renderer endurance, real native Tesla transport visibility,
and first real automatic diagnostic inbox receipt. A persistent report outbox is
an unimplemented proposal, not the current contract: the shipped timer counts
15 observable active-session minutes and retains one due send in memory.
Do not restart these unrelated projects or send synthetic diagnostic mail.

End the office session with evidence, unresolved candidates, updated URL exclusions,
exact local file locations and a concrete next step. Keep facts, inferences,
licensing gaps and owner listening judgments distinct.
