# Weekend continuation — 2026-09-05

## Owner decisions and priorities

The owner is preserving the remaining account allowance for weekend support.
Prioritize incoming real-Tesla reports and long-trip reliability over a broad
new feature build. The owner plans a multi-hour Milan trip on Sunday 2026-09-06.
An initial approximately five-minute drive uses build 20260904-2351; inspect the
report's own build before attributing observations to a later deployment.

The owner authorized diagnostic improvements, tested commits/pushes and canonical
deployment, including the official internal configuration parser without secret
exposure. Keep one writer in the existing saved Dropbox checkout. Never create
another checkout/task, expose local config, copy `_references/`, send a diagnostic
without a direct request, or treat this handoff as an automatic scheduled job.

## Implemented long-trip diagnostic delta

`flightRecorder.journey` adds a whole-session overview alongside the existing
1,800 detailed observations at a nominal two-second cadence (about one hour).
It starts with one-minute windows and merges adjacent windows when the 240-window
bound is exceeded, doubling the target duration. This retains the beginning and
end of long trips rather than discarding early context. Each window retains
observation count, speed range, minimum observed running FPS, maximum observed
running p95 frame time, stale-GPS/offline/hidden observation counts and maximum
sampling gap. Counts describe observations, never inferred continuous durations.
FPS/p95 remain the existing running session metrics, not local window quantiles.
An explicit maximum sampling gap reveals suspension without inventing samples.
Existing interpolated distance estimates remain estimates, not route evidence.

The addition is coordinate-free, memory-only, backward-compatible with v4 and
included in the manual report. No GPS watcher, audio/render behavior, send route,
mail recipient, retry policy, body limit or gzip format changed. Reload/closing
the browser still loses the in-memory session: send from the tested session first.
A successful mail submission does not prove inbox delivery or real Tesla behavior.

Passed before publication: 629 native checks including Sites 9/9 and actual PHP.
New tests simulate 24 hours/43,201 observations, prove early-event retention,
bounded windows/detail, independent report snapshots, a two-hour suspended gap,
transport fitting with oversized events and complete real-PHP gzip round-trip.
Synthetic elapsed time is not a 24-hour wall-clock/browser/vehicle endurance run.
Publication evidence will be appended below after canonical verification.

## Approved ideas saved as drafts

See [WEEKEND-EXPERIENCE-DRAFTS-2026-09-05.md](WEEKEND-EXPERIENCE-DRAFTS-2026-09-05.md).
The owner approved curated experiences and a travel-oriented ATLAS, with a
separate future statistics visual (owner wording: “ninth view”). That phrase is
an intent, not an assertion about the current catalogue count or an approved
public name. Do not remove existing ATLAS functionality before its replacement
is implemented and checked. No preset or new visual was shipped in this pass;
this deliberately preserves the requested weekend allowance and stable test build.

## Engine study intake, not a completed independent review

Sibling path: `../sedicivalvole_engine_study` (outside the product).
Read intake: START_HERE, orchestration, public-source docket, review instructions
and owner gate/risk metadata. No archive was extracted, executed or copied.
The orchestration/gate context was seen, so do not call this a blind Phase A audit.
Some large orchestration/review output was truncated; a future complete review
must reread those documents in bounded chunks rather than assuming full coverage.

The supplied dossier proposes `markeasting/engine-audio` commit
`b8cf9887c914f17c2f006d68427080e39d02d0b0` as browser donor and
`ange-yaghi/engine-sim` commit `85f7c3b959a908ed5232ede4f1a4ac7eafe6b630`
as complementary physics/acoustics research. These are dossier claims, not
newly verified upstream/code/license conclusions. Verify exact upstream files,
licenses and each audio asset independently. No candidate source/audio is admitted.
The automatic gearbox is a study requirement; the manual upstream demos are not
proof that the product controller exists. Engine implementation waits for the
owner's later budget window. Do not port the candidate wholesale or create a
second AudioContext/GPS owner. The full candidate and source review remain open.

## Morning recovery checklist

1. Read AGENTS.md, CURRENT-STATE, SESSION-HANDOFF and this file. Inspect Git and
   Dropbox for clean synchronized HEAD/main/origin/main and one active writer.
2. Read the appended deployment identity below. Compare every incoming report's
   app build/commit, schema, session duration, sample counts and transport loss.
3. For the short drive, assess chrome retraction, Now Playing, ATLAS/DISCOVER,
   LIGHT/DARK, native playback and Underwater. A report may come from 2351 and
   legitimately lack `flightRecorder.journey`.
4. For Sunday, inspect journey windows across the entire session and use detailed
   recent trace/events plus full-session counters to distinguish sampling gaps,
   network failure, frame degradation and playback-state changes. The window
   counts alone do not prove cause or total outage duration.
5. Recommend the next bounded task using actual evidence. Curated experiences,
   ATLAS/statistics separation and Engine stay explicitly distinguishable from
   shipped features. Do not trigger any usage reset; none was authorized.


## Long-trip diagnostics published — 2026-09-05 00:20

Verified canonical version **0.0.0**, build **20260905-0012**, clean built source
**41721eb**. This supersedes build 20260904-2351 for newly loaded pages. Already
open sessions retain their own build and memory; inspect incoming report identity
before comparing them. The following documentation commit does not alter the
artifact's source identity.

- **629/629 native checks**, including Sites **9/9**, the actual PHP gzip fixture
  and the new 24-hour complete-report attachment test, passed on this ARM64 host.
- Clean production build passed: App **242** modules, LAB **154**, Sites package.
  The known large-chunk advisory remains. Post-build identity/Sites checks 10/10.
- Synthetic 24-hour run: **43,201 observations**, **1,800** detailed rows,
  **181** adaptive windows at target **480 seconds**, **32,374 bytes** for the
  journey JSON and **299,172 bytes** for that representative fitted request.
  Early offline/FPS degradation evidence survives. Simulation execution took
  176 ms on this host; this is not wall-clock endurance or Tesla performance.
- Preflight and independent postflight passed with `remote_writes=NONE`.
  Publisher verified **183 files / 215,959,583 bytes**, all **29** Illobo tracks
  and retained **one** previous fingerprinted asset. No legacy removal occurred.
- **12 canonical HTTP checks** passed. Bare root, cache-busted root and explicit
  PHP entry return the current byte-identical HTML with no-store/no-cache and
  cache MISS. All emitted JavaScript and main CSS match local bytes; unchanged
  CSS may legitimately return HIT. Main asset is `index-_4Y6QalF.js`.
- Current production Chrome **773 × 601** passed three focused integration
  checks: rendered raw report contains actual journey observations; the existing
  manual-send payload includes them and matches its exact byte budget; closing
  REPORT retracts chrome. Console warnings/errors/page errors: **0**. SEND was
  intercepted inside Playwright and answered locally, so **no email was sent**.
  The captured SENT state is a test response, not a claim of inbox delivery.
- Inbox delivery, real multi-hour driving, native playback, network recovery and
  sustained vehicle CPU/GPU/thermal behavior still need owner evidence. No new
  visual, experience preset, source dependency or Engine runtime was introduced.

Evidence: [native suite](qa/2026-09-05-long-trip/native-tests.txt),
[simulation](qa/2026-09-05-long-trip/simulation.json),
[canonical hashes](qa/2026-09-05-long-trip/canonical-evidence.json),
[publication](qa/2026-09-05-long-trip/publication.txt), and
[live browser integration](qa/2026-09-05-long-trip/live-browser-evidence.json).
