# Audio effects and passenger control audit — September 23, 2026

## Road evidence and diagnosis

The owner reported that braking displayed Underwater without changing Soundtrack
and requested an extended effects/system check. The manually sent report accepted
at **18:35:35 UTC** is from **20260923-1953.b06b696**. Its gzip and decoded JSON
match the SHA-256 values in the received mail; the original remains outside Git.

- The session launches Soundtrack with vehicle effects enabled at 18:31:14 UTC.
- At **18:32:33.004 UTC**, `audio.vehicle-effects.changed` records `enabled: false`,
  immediately followed by an applied `vehicle-effects` remote command.
- At report capture the application and Soundtrack graph both have the master off.
  Soundtrack is playing, unmuted, with a shared running 48 kHz AudioContext,
  three attached media elements and no graph error. Runtime issues are empty.
- The current recording has about 50 seconds buffered; the next is prepared.
  GPS has 2,649 numeric samples and a median interval of 99.75 ms.
- Observed rendering averages 59.94 fps; one 5.99-second observation gap is separate
  from measured frames. Network hints deteriorate to 0.45 Mbps / 550 ms and an
  instrumented request failure is present. These are not measured audio dropouts.

The disabled master explains visual-only braking in the captured state. The report
has no continuously recorded braking-macro history, so it cannot establish the
exact amount at every earlier brake. No filter-strength or audio-routing repair
is inferred from the badge alone, and no DSP coefficients are changed.

## Implemented corrections

1. Name the phone switch **Braking Underwater**, separate from **Manual FX**.
   Explain that automatic OFF preserves visuals and leaves manual effects usable.
   The display's active badge adds **VISUAL ONLY** when its braking master is off.
2. Fix a reproduced slider-delivery defect: 100 rapid positions previously admitted
   only the first 12, leaving 12% queued instead of the requested 100%. Retain the
   latest pending position per effect; keep other effects and transport order.
   Old acknowledgements cannot erase a newer request. The phone previews pending
   values with **Sending…**, then reconciles to confirmed state even on rejection.
3. Share the authored eight tap depths between display and phone. Engine explicitly
   shows **DRY / Music only** and disables musical effect controls; saved musical
   settings are retained for returning to Music.

## Verification

The flow is Soundtrack playback → automatic/manual effects → phone commands →
confirmed display state, including OFF, reset, maximum depth and Engine mode.

- The native aggregate ran 1,079 tests before its Sites stage. One source assertion
  still expected the old `FX` toast text; it was updated to the explicit `BRAKING FX`
  copy. The complete affected presentation/remote suites and Sites stage then pass
  **44/44**. Combined gate coverage is **1,088 passing cases**, without rerunning
  unrelated passing suites. Three new behavioral regressions protect final slider
  delivery, ordered queue saturation and late/rejected acknowledgements.
- **19/19 real-browser audio checks** pass. Each of eight effects has distinct tap
  and full-depth output, finite non-silent samples, peak below 1.0 and a zero-depth
  reset identical to neutral. Automatic depth 0.4 and 1 change the actual signal;
  automatic OFF matches dry, and manual Underwater still changes audio with it off.
  All eight at 100% plus braking remain bounded at 0.212 RMS / 0.839 peak.
- A live HTMLMediaElement uses the production Soundtrack effects controller and
  the actual shared macro engine. The 4 kHz component falls about 73 dB on braking,
  returns with FX OFF while the badge stays active, and falls again with manual
  Underwater. Release restores the high band and clears the badge. GPS input at
  the report's 100 ms cadence triggers the filter; Engine clears the music macro.
  A first QA probe spaced GPS samples at 1,000 ms and correctly hit the existing
  700 ms derivative-expiry boundary; the final proof uses the observed cadence.
- IAB localhost QA uses a deterministic admitted recording fixture and a real
  encrypted local PHP pairing. At **773 × 601 / 390 × 844**, the phone transmits
  all eight values at 100%, display RESET restores all zeroes without changing the
  braking master, and a full horizontal Underwater drag reaches 100% on both ends.
  Manual controls remain usable with automatic braking off. Pause reaches the
  display. Dark/Neon state propagates to the phone without overflow. Engine
  presents disabled music effects and the dry-audio explanation.
- Inspected application/phone console warnings and errors are empty. Local fixture
  endpoints block external API/diagnostic delivery, and automatic sending is
  explicitly off in the QA session. No synthetic diagnostic mail is sent.

Browser plugin is absent; the installed CUA in-app browser provides DOM, interaction,
viewport, screenshot and console evidence. Audio fixtures, raw private diagnostic,
logs and screenshots remain outside Git in the local `2026-09-23-audio-effects-audit`
artifact directory. Offline renders substitute only the source adapter; filters,
modulation, distortion, mixing and limiting use actual Web Audio nodes. The live
media proof separately covers the real MediaElement source path.

## Delivery and limits

**Published: 20260923-2059.5967df1**, from source checkpoint `5967df1` on `main`.
The production App/LAB/Sites package passes 835 exact static hashes; eight
documentation checks and all 189 community credits pass. The compiled browser
also confirms Music → Engine → Music and an acknowledged 76% tap / 100% slider.

Official preserve-existing publication uploads 39 files / 6,498,536 bytes,
verifies/reuses 832 static files and 29 recordings, and retains two previous assets.
All **15 canonical HTTP checks** pass on bare, cache-busted and controlled-reload
requests. The 1,445-byte HTML has SHA-256
`ca7dee91377ad5d33fde6dd06c5ec3e5273d4db8183529910aa68ca1e0b4aa6e`;
referenced assets, phone bundles, release metadata and cache worker match locally.

Public IAB at 773 × 601 and 390 × 844 starts an actual Soundtrack recording,
pairs the companion, applies manual Underwater at 76% then 100% with braking off,
and confirms the 100% display value. Dark/Blue presentation, explicit braking
copy, RESET, braking re-enable and phone pause pass with no inspected console
warnings/errors. The temporary pairing is revoked and both tabs are closed.
Automatic mail stays off. Existing moving sessions are not forcibly reloaded.

The audit covers active audio/effects/control ownership and the repository's full
regression/package gates. It does not certify every visual, geographic service,
recording, native Tesla media handler or prolonged weak-network drive. Signal and
browser proof do not replace physical iPhone touch or cabin listening. The owner's
initial report that the companion works reasonably is useful road feedback, not
blanket physical acceptance of this subsequent correction.
