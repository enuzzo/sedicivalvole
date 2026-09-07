# Owner answers — September 7 closeout

September 7 night precedence: the owner selected Travel Report direction 1.
PDF preview/download and verified-recipient email are now implemented and
locally verified; see [implementation and publication status](NIGHT-IMPLEMENTATION-2026-09-07.md).
Earlier design-only labels below preserve the preceding checkpoint.

Owner follow-up received: see [accepted decisions and sequence](OWNER-DECISIONS-2026-09-07.md). All current owner clarification lines are answered, including A02. The owner recalls intentional interruptions and no sudden uncommanded music stop.

A12 is prepared for the first Engine listening result after implementation. No implementation approval is awaiting the owner. `Not tested` is a useful answer: it preserves the gate without inventing a pass. The historical decisions and answers in `PIANO.md` remain valid; this file collects only current acceptance and next-scope questions. Technical fixes and evidence collection remain the implementer's responsibility.

## Immediate diagnostic interpretation

### A01 — Browser gaps (D07-02; milestone 16)

During Sunday's session, were the approximately 10-minute and 30-minute gaps caused by leaving/closing the browser, another Tesla screen/app, or did the app remain visible and freeze? Did music continue?

Answer: The browser was minimized while Tesla navigation was in use. This is consistent with the gaps; uninterrupted background music was not separately confirmed.

### A02 — Native pauses (D07-05; milestones 7 and 10C)

Were the final music pauses on Sunday and Monday intentional, for example using Tesla's media control or switching audio source? Monday's pause follows a track ending. If unwanted, describe what you saw/heard and which control you last touched.

Answer: Probably intentional. The owner does not recall sudden uncommanded interruption and confirms deliberately interrupting at times to view Tesla navigation. This resolves the question as no reported spontaneous fault, not event-by-event certainty.

### A03 — Visible faults (D07-01/04; milestone 5)

Was ATLAS visibly jerky or delayed? Did Drivey show a blank/error screen on its first load and work after reselecting it? Describe either symptom separately from the diagnostic FPS figure.

Answer: Drivey failed without network and did not retry. Automatic bounded recovery is requested. No separate ATLAS smoothness verdict was supplied.

## Existing-product acceptance

### A04 — Audio and eight effects (milestones 2, 4)

For FRACTURE, JUNCTION, NIGHTSHIFT, Jamendo and Illobo separately: which did you actually listen to, were low-speed/transition/volume behavior acceptable, and were braking UNDERWATER and the manual effects audible and useful? List any untested sources/effects. These reports mainly establish MUTE/Jamendo exposure.

Answer: Flux, Soundtrack and FX accepted, with possible small refinements later. This is broad owner acceptance, not a claim that every source/effect was separately measured.

### A05 — Touch, media controls and readability (milestones 7, 8, 10A–10C, 13)

Do controls now open while moving, remain usable and retract after closing or about six seconds of inactivity? Are Music, Palette, Now Playing and LIGHT/DARK readable? Which native Play/Pause/Previous/Next controls actually worked, and did returning to the browser resume correctly?

Answer: Interface accepted, with possible small refinements later. Native Pause intent remains A02; unreported individual hardware-control tests are not invented.

### A06 — ATLAS and Discover (milestones 2, 9, 9A, 10)

Does ATLAS retain the route origin and one marker, collapse/reopen correctly and show readable PALETTE/STANDARD maps and statistics? Does Discover search/read articles correctly and does scanning its QR open the intended destination on your phone? Mark each untested part.

Answer: Discover accepted. ATLAS will become a more informative travel map, potentially with precisely located Discover POIs; statistics become a separate full-screen experience.

### A07 — Visual acceptance (milestones 5, 11, 11A, 11B)

Which visuals felt smooth and comfortable, including Drivey at walking pace and Meridian braking/recovery? For Japanese Mist, Acid Orchard, Chromatic Silk and both PRTCL types, note actual use, braking response, switching and any prolonged degradation. LAB acceptance can remain `Not tested` separately.

Answer: The owner confirmed the ATLAS/statistics separation. No renderer-by-renderer smoothness verdict or GPU/LAB test result was supplied; keep those technical evidence gates separate from broad Flux acceptance.

### A08 — iPhone test device (milestones 14, 16)

Which iPhone model/iOS/Safari version can you test, and is landscape use with state-preserving rotation required before the first release? The responsive implementation and test preparation are ours; only physical device observations require you.

Answer: iPhone work follows Engine. Device/version details are deferred until that work starts.

## Product choices

### A09 — Curated experiences (milestone 12)

Are the shipped Night Glass (Vertigo / Graphite / DARK / Lounge) and Neon Groove (Aperture / Neon / DARK / Funk) acceptable as the first completed pair? Name any mismatch. Recommendation: accept or refine these two before expanding the catalogue.

Answer: Broad Flux/interface acceptance received; no separate preset-by-preset verdict supplied and no further blanket acceptance request is needed now.

### A10 — Priority and first release scope (milestones 15–17)

Recommendation: close the diagnostic/reliability checkpoint first, then conduct the Engine review and incremental integration before the dual-mode release. Do you prefer that sequence, or an explicitly Flux-only first release with Engine following? This is a scope decision, not a deployment permission request.

Answer: Reliability fixes first, then Engine review/integration and owner trial. iPhone follows Engine.

### A11 — Future statistics surface (approved draft, not today's reliability blocker)

Should the separate statistics visual be useful during the journey or mainly for passenger/stationary review? The travel-ATLAS direction is already approved; no need to approve it again. Recommendation: keep this expansion after the reliability checkpoint. Three concrete visual directions will be prepared before design selection.

Answer: Create a distinct full-screen enhanced statistics experience from the existing sidebar; travel ATLAS becomes an informative map. Information design is delegated; three compositions precede visual implementation.

## Questions deliberately not asked again

Illobo authorization, PolyForm licensing, Jamendo versus the rejected sources, the fixed 130 km/h ceiling, Engine/Flux identity, and standing deployment authorization are settled. `PIANO.md` Q3 concerns a retired visual path; Q16/Q22/Q24 describe technical evidence/revalidation, not unanswered product permission. Old statements such as “no Jamendo adapter” are historical, not current blockers.

Engine's direction 2 (Telemetry), pinned MIT source and bundled WAV admission are now explicitly approved. This questionnaire does not reopen sealed archives or claim Phase A completion. Production release approval belongs after acceptance, not in a speculative blanket question now.


### A12 — Engine first listen

Source/WAV admission and Telemetry direction 2 are settled. After trying the
implemented build, which profile do you prefer (Mono/Rosso/Touring)? Do acceleration,
upshift, lift/downshift and stopped TAMARRO feel coherent, and does Engine ↔ Flux
retain correct mute/native media behavior? A short journey with REPORT afterward
can separate listening preference from measurable timing/network issues.

Answer: First listen broadly positive. Requested corrections: no UNDERWATER or other creative FX in Engine; no volume duck on deceleration; larger persistent TAMARRO controls on both sides at zero; occasional tiny stationary revs. Implemented in the September 7 refinement. Profile preference and sustained vehicle acceptance are not yet specified.

Refinement listening response: [Ready for your notes on sound level during lift/downshift, stationary controls and tiny idle blips.]

### A13 — ATLAS / Stats visual remix (answered 2026-09-07)

Answer: ATLAS and Stats must be separate. Select Travel Observatory's map and
POIs; clicking a point opens a compact photo/title/description card and Read more
opens the full Wikipedia article while remaining over Atlas. Stats takes the
first proposal's speed bands/elevation gain/loss, the second's heading/network
instruments and red speed trace, and the third's speed/altitude chart. The
Journey Magazine photo card is the selected place-card reference. The owner
explicitly authorizes implementation of this remix; no further composition
selection is pending. PDF/email remains the separate documented design scope.
