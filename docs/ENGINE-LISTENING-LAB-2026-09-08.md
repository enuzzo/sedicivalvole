# Engine A/B listening LAB — September 8, 2026

The owner selected **A/B listening: the same route, two calibrations, saved
preference and notes** from the three offered directions. This implements that
selection inside the existing protected `/lab` Engine surface. The public
Telemetry design is unchanged.

## Listening flow

1. Open `/lab`, authenticate normally, then choose **Engine** in the LAB selector.
2. Choose the engine and **PLAY A** or **PLAY B**. Each starts from the beginning
   of the same 68-second city/road/return sequence: 0, 20, 30, 40, 80, 100, 130,
   then 0 km/h. Only one Engine runtime plays at once in the existing context.
3. Stop or switch takes whenever useful. The displayed listening duration records
   completed seconds; partial listens are valid feedback and are exported as such.
4. Open **Preference & notes**, select A, B or no preference, write the observation
   and save. The most recent 60 entries persist on this browser/device. Notes
   contain the engine, preference, route/calibration identifiers, build, sample
   rate, actual listening durations and up to 4,000 characters of text.
5. **EXPORT NOTES** downloads JSON for the owner to share. No automatic sending,
   recipient, route coordinates or diagnostic-mail integration is added.

A is the **08:34 reference**; B is the **11:02 refinement**. Both preserve their
original calibration levels: this is explicitly not a loudness-matched or blind
comparison. B remains the public default. The frozen A parameters restore the
older urban shift thresholds, sample weights, hybrid level, pipe/intake feedback,
pressure returns and turbo/turbine tones. Existing source WAVs and licensing are
unchanged. Manual speed/input/gear controls and diagnostics remain in a secondary
disclosure. Manual controls are locked during the authored route.

Switching engines keeps that engine's unsaved in-session draft separately.
Saved notes survive reload; unsaved drafts do not. Unavailable/full storage
shows failure and retains the written draft. Replay stops on hidden/context loss,
a renderer interruption or an unobserved control gap longer than 1.2 seconds;
it does not count a background gap or silently resume later. The route begins
only after the bank is prepared. Starting a take remounts the bench, disposing
its old runtime and resetting speed/load/gear state before the next take.

## Implementation and verification

- `lab-comparison.js` owns the immutable reference overrides, shared route and
  bounded note model. It is imported by the LAB, not the public application.
- `lab.jsx` owns replay, profile-specific drafts, preference storage and export.
  The parent keeps the audio source selected while keyed child runtimes dispose;
  leaving the complete LAB silences Engine and returns source ownership to Flux.
- The runtime accepts a profile resolver only when constructed with protected
  manual-bench capability. A test proves public Engine ignores an injected one.
- Procedural acoustic coefficients are named constructor options with exactly
  the 11:02 defaults. Reference options reproduce the earlier original DSP.
- A same-process comparison against the preserved 0834 and 1102 source snapshots
  verifies all road configuration arrays and **16 six-second stereo DSP cases**:
  A/B × four synthesized voices × 44.1/48 kHz. Every compared sample is identical
  (maximum difference zero), including load and boost changes. Rosso/Touring
  share unchanged sample assets; reference crossfade uses the earlier formula.
- Model checks cover route continuity and its speed ceiling, both urban schedules,
  invalid preferences, bounded notes/history, partial listens and corrupt storage.
- Browser acceptance covers full A and B routes, third versus second at 30 km/h,
  one context/one active worklet, stop/hidden cancellation, saved-note reload,
  export, draft restoration and a simulated storage-quota failure. Synthetic
  diagnostic/report endpoints are intercepted throughout.

The exported feedback supports the next real Tesla listening decision. Browser
playback and signal parity do not establish cabin preference or native Tesla
file-download behavior. Protected server authentication is preserved; local
compiled-LAB QA is distinguished from unauthenticated canonical protection checks.


## Public audio regression evidence

Twelve final 132-second real Chromium renders compare the current public default
to the 1102 source. Otto/Cinque/Turbine WAVs are byte-identical. Mono/Rosso/Touring
16-bit exports differ by at most one PCM step in fewer than 0.01% of samples;
whole-file identity is not claimed for these resampled recordings. All cap,
finite-output and clipping checks pass. [Public audio comparison](qa/2026-09-08-engine-ab/public-audio-identity.json)
and [direct A/B calibration identity](qa/2026-09-08-engine-ab/calibration-identity.json).
