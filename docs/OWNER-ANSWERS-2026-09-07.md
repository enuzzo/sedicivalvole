# Owner answers — September 7 closeout

Owner follow-up received: see [accepted decisions and sequence](OWNER-DECISIONS-2026-09-07.md). Broad acceptance questions are resolved; only native Pause intent remains a current clarification. The original questionnaire is retained below for traceability.

Fill each `Answer:` line. `Not tested` is a useful answer: it preserves the gate without inventing a pass. The historical decisions and answers in `PIANO.md` remain valid; this file collects only current acceptance and next-scope questions. Technical fixes and evidence collection remain the implementer's responsibility.

## Immediate diagnostic interpretation

### A01 — Browser gaps (D07-02; milestone 16)

During Sunday's session, were the approximately 10-minute and 30-minute gaps caused by leaving/closing the browser, another Tesla screen/app, or did the app remain visible and freeze? Did music continue?

Answer:

### A02 — Native pauses (D07-05; milestones 7 and 10C)

Were the final music pauses on Sunday and Monday intentional, for example using Tesla's media control or switching audio source? Monday's pause follows a track ending. If unwanted, describe what you saw/heard and which control you last touched.

Answer:

### A03 — Visible faults (D07-01/04; milestone 5)

Was ATLAS visibly jerky or delayed? Did Drivey show a blank/error screen on its first load and work after reselecting it? Describe either symptom separately from the diagnostic FPS figure.

Answer:

## Existing-product acceptance

### A04 — Audio and eight effects (milestones 2, 4)

For FRACTURE, JUNCTION, NIGHTSHIFT, Jamendo and Illobo separately: which did you actually listen to, were low-speed/transition/volume behavior acceptable, and were braking UNDERWATER and the manual effects audible and useful? List any untested sources/effects. These reports mainly establish MUTE/Jamendo exposure.

Answer:

### A05 — Touch, media controls and readability (milestones 7, 8, 10A–10C, 13)

Do controls now open while moving, remain usable and retract after closing or about six seconds of inactivity? Are Music, Palette, Now Playing and LIGHT/DARK readable? Which native Play/Pause/Previous/Next controls actually worked, and did returning to the browser resume correctly?

Answer:

### A06 — ATLAS and Discover (milestones 2, 9, 9A, 10)

Does ATLAS retain the route origin and one marker, collapse/reopen correctly and show readable PALETTE/STANDARD maps and statistics? Does Discover search/read articles correctly and does scanning its QR open the intended destination on your phone? Mark each untested part.

Answer:

### A07 — Visual acceptance (milestones 5, 11, 11A, 11B)

Which visuals felt smooth and comfortable, including Drivey at walking pace and Meridian braking/recovery? For Japanese Mist, Acid Orchard, Chromatic Silk and both PRTCL types, note actual use, braking response, switching and any prolonged degradation. LAB acceptance can remain `Not tested` separately.

Answer:

### A08 — iPhone test device (milestones 14, 16)

Which iPhone model/iOS/Safari version can you test, and is landscape use with state-preserving rotation required before the first release? The responsive implementation and test preparation are ours; only physical device observations require you.

Answer:

## Product choices

### A09 — Curated experiences (milestone 12)

Are the shipped Night Glass (Vertigo / Graphite / DARK / Lounge) and Neon Groove (Aperture / Neon / DARK / Funk) acceptable as the first completed pair? Name any mismatch. Recommendation: accept or refine these two before expanding the catalogue.

Answer:

### A10 — Priority and first release scope (milestones 15–17)

Recommendation: close the diagnostic/reliability checkpoint first, then conduct the Engine review and incremental integration before the dual-mode release. Do you prefer that sequence, or an explicitly Flux-only first release with Engine following? This is a scope decision, not a deployment permission request.

Answer:

### A11 — Future statistics surface (approved draft, not today's reliability blocker)

Should the separate statistics visual be useful during the journey or mainly for passenger/stationary review? The travel-ATLAS direction is already approved; no need to approve it again. Recommendation: keep this expansion after the reliability checkpoint. Three concrete visual directions will be prepared before design selection.

Answer:

## Questions deliberately not asked again

Illobo authorization, PolyForm licensing, Jamendo versus the rejected sources, the fixed 130 km/h ceiling, Engine/Flux identity, and standing deployment authorization are settled. `PIANO.md` Q3 concerns a retired visual path; Q16/Q22/Q24 describe technical evidence/revalidation, not unanswered product permission. Old statements such as “no Jamendo adapter” are historical, not current blockers.

Engine's actual visual choice and exact candidate/source admission belong after its concrete review. This questionnaire does not reopen sealed archives or claim Phase A completion. Production release approval belongs after acceptance, not in a speculative blanket question now.
