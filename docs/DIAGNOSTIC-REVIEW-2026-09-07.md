# Diagnostic review — 2026-09-07

Scope: four received September 6–7 reports, current source inspection and milestone reconciliation. No runtime changes or new deployment. Baseline: clean `99c005a`, product `6e2abff`, VERSION `0.0.0`, build `20260905-0225`.

## Evidence and limits

All four MIME attachments were decoded locally and both compressed and uncompressed SHA-256 values matched their mail manifests. Raw messages and reports remain outside Git. No email was sent. Canonical HTML and its referenced main JS were fetched read-only on September 7: HTTP 200, HTML `no-store/no-cache`, cache MISS, main JS `index-CGxOfYXf.js`, build `20260905-0225`. This is a current identity check, not a repeated full deployment audit.

| Report, Europe/Rome | Recorded session span | Detailed observations | Interpretation |
|---|---:|---:|---|
| September 6, 14:03 | 1m32s | 46 | MUTE launch, Aperture then ATLAS |
| September 6, 14:35 | 26m19s | 486 | MUTE launch, later Jamendo; multiple visuals; one 610.2s observation gap |
| September 6, 15:05 | 56m25s | 497 | Same session as 14:35, not another independent endurance test; additionally a 1,785.3s gap |
| September 7, 08:40 | 6m27s | 192 | Soundtrack/Jamendo and Vertigo; no recorded runtime issues |

The long session contains about 39m56s of gaps and only about 16m27s between adjacent observations separated by at most ten seconds. That ten-second threshold is an analysis convention, not a new product contract. It does not prove continuous multi-hour operation. Zero hidden/offline observations cannot describe periods in which no samples were taken. All recorded samples/events/issues were transmitted; no transport trimming occurred. The two long reports repeat one Drivey error from the same session.

## Findings, ordered by action value

### D07-01 — ATLAS frame measurement can undercount healthy rendering

ATLAS reports 18.74 FPS / 86.53ms p95 in the first report and 15.29 FPS / 149.69ms p95 across approximately 168s of its visual phase in the longer session. These are sampled callback intervals, not a validated count of every rendered frame.

Source evidence: `src/environments/atlas/atlas-field.jsx` filters MapLibre render callbacks through `frameTelemetryIsDue` at `1000 / 30`; `src/render-telemetry.js` tests elapsed time against that threshold and the caller resets the previous timestamp to the accepted callback. A direct import of the current helper with 300 regular 33.3ms callbacks yields about 15.015 reported samples/s despite 30.030 input callbacks/s. At 33.4ms it reports approximately 29.940/s. A synthetic 60 FPS input is also undercounted. This reproduces measurement aliasing independently of the vehicle.

Recommendation: correct frame counting first, separating every-frame counters from throttled UI publication. Test 60/30 FPS, jitter around 33.33ms, genuine slow frames, suspension and renderer changes. Then profile actual ATLAS CPU/GPU work, route updates, road queries and camera animation before choosing a visual reduction. The high p95 observations still warrant investigation; the present evidence does not establish a precise true ATLAS FPS or its root cause.

### D07-02 — Suspension gaps distort headline FPS and trip estimates

The long report's global 14.13 FPS includes the approximately 29m45s callback gap. Its Vertigo visual phase reports 59.32 FPS; today's reports show 59.93 FPS in the Vertigo visual phase. Do not attribute the global figure to Vertigo or infer thermal collapse.

`recordDriveTelemetrySample` in `src/diagnostics-model.js` integrates average endpoint speed across the entire elapsed interval and assigns the interval to moving/stationary totals. It therefore interpolates across long unobserved periods. The 39.379km estimate and 56m22s moving total are not verified travel measurements. The newer journey-window structure correctly records gaps; the older summary has different semantics.

Recommendation: retain elapsed session time, add observed/unobserved time, and do not silently integrate unknown intervals into verified movement or distance. Keep any legacy estimate explicitly separate. Ask the owner whether the browser was left/backgrounded; a gap alone cannot distinguish lifecycle suspension, a stalled event loop or another interruption.

### D07-03 — Music attribution identifies an inactive score

All flight summaries label music `nightshift`, including MUTE and audible Jamendo sessions. `App.jsx` builds the phase label from `genreId` and records `musicId: genreIdRef.current`, while the actual Soundtrack controller and launch events identify the active source. The separate arrangement snapshot can describe inactive FRACTURE preparation as `loading`.

Recommendation: record active music mode, provider/current track identity, transport and mute state independently from the remembered adaptive score and its dormant arrangement. Add MUTE → Jamendo → adaptive score attribution checks. These reports cannot close NIGHTSHIFT, JUNCTION or FRACTURE listening gates merely because a phase name contains NIGHTSHIFT.

### D07-04 — One recoverable Drivey load timeout

The first Drivey selection in the long session fails about 15 seconds later with `Original Drivey load timed out`. Reselecting Drivey later succeeds, with approximately 58.86 reported FPS across its recorded visual phases. Browser network estimates fluctuate between 3g/4g; this is correlation, not proof of the failed resource or cause.

The project-owned bridge clears its deadline when the original runtime becomes ready and fails closed otherwise. Investigate which loading/readiness stage expires and test delayed load, retry and teardown. Preserve upstream bytes. Do not simply lengthen the timeout or label this a permanent GPU failure.

### D07-05 — Native Pause works; full native transport acceptance remains open

One Media Session Pause is recorded on each day, followed by successful serialized completion in about 2.0ms and 1.7ms respectively. Today's Pause arrives roughly 0.1s after a track-ended event; only the owner can confirm whether it was deliberate or an unwanted system pause. The trace proves invocation and resulting paused state, not which human/device generated the command. Do not ignore native Pause to conceal a possible issue.

Seven Sunday Jamendo library selections report successful completion in approximately 1.4–3.4 seconds. Today's launch completes in 58ms with prepared media, and Rock selection in approximately 2.0s. Ended events and queue progression are present. `waiting`, `stalled` and `suspend` lifecycle events must be interpreted with role, playback intent and buffered data; they are not individually proof of audible dropout. Native Play/Next/Previous, weak-network listening and subjective transition quality remain unaccepted.

### D07-06 — Useful positive vehicle evidence

- GPS speed is numeric in every recorded fix, approximately 89–100ms median cadence. Accuracy is good after acquisition; today's initial samples include poor/stale acquisition, so do not claim immediate readiness.
- Vertigo, Drivey after retry, PRTCL, Meridian and Aperture reach approximately 59–60 FPS in recorded visual phases. Japanese Mist and Acid Orchard have short approximately 56–57 FPS observations, insufficient for thermal acceptance; Chromatic Silk is not represented.
- Browser-reported output latency today ranges from 184 to 224ms. This is API output latency, not measured GPS-to-cabin end-to-end latency. Engine response tuning must accommodate it and be judged in the car.
- The report transport carries all retained evidence successfully. No raw coordinate fields were needed for this analysis. No recorded context-loss event was found; that is not a full GPU endurance pass.

## Recommended sequence

1. Correct D07-01/02/03 measurement semantics with deterministic checks.
2. Investigate Drivey loading and actual ATLAS rendering using trustworthy counters; repeat a short focused Tesla test.
3. Close the existing Flux listening, touch, native transport and recovery gates with owner observations.
4. Review Engine against the stabilized audio/GPS/lifecycle owners, then implement it incrementally after the study's review/admission decisions. Engine is milestone 15 itself; requiring every milestone, including release, to finish before Engine would be circular.
5. Keep optional expansion out of the reliability checkpoint. Travel ATLAS/statistics are approved future direction; they do not justify discarding existing statistics before a replacement is verified.

## Engine intake assessment

The sibling `sedicivalvole_engine_study` exists. Intake describes a standalone GEAPS candidate, automatic stepped gearbox, AUTO-only initial product, LAB-only mutually exclusive MANUAL and trusted-standstill TAMARRO. Historical candidate test counts are packaging claims, not rerun acceptance. No sealed archive was opened, extracted, executed or admitted in this review. This is prioritization/intake, not the complete independent Phase A review.

The public pinned [engine-sim README](https://github.com/ange-yaghi/engine-sim/blob/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630/README.md) describes a Windows build, manual clutch/gear controls and an audio-oriented simulator rather than an engineering-accuracy tool. Its transfer into this browser product is substantial work. The pinned [engine-audio package](https://github.com/markeasting/engine-audio/blob/b8cf9887c914f17c2f006d68427080e39d02d0b0/package.json) and public repository provide a browser-oriented candidate for further review. Prefer evaluating that route first, with engine-sim as complementary acoustics/offline research. Exact code, dependencies and recordings still require separate admission; current architecture must remain authoritative.

Owner answers: [OWNER-ANSWERS-2026-09-07.md](OWNER-ANSWERS-2026-09-07.md). Stable work IDs: [milestone checklist](MILESTONE-CHECKLIST-2026-08-31.md).
