# Guided phone onboarding verification

## Scope and provenance

The owner selected the first phone concept and second receiver concept. The
[combined reference](../../design/phone-onboarding-2026-09-20/reference/selected-combination.png)
is implemented with the existing design system. See [design QA](../../../design-qa.md)
and the [asset inventory](../../design/phone-onboarding-2026-09-20/assets.json).

## Local evidence

- Full native regression: 1,034 passed, zero failures, on the implementation checkpoint.
- Final follow-up: 50 motion companion checks passed, including two new cases for
  fresh-QR instructions and connected-but-incomplete calibration.
- Focused source, typography and documentation checks: 68 passed; 189 credits;
  public hygiene: 1,585 text files without findings.
- Final committed-source package: `20260920-1716.24c955b`, 833 exact static hashes.
- Browser: Codex integrated Chromium. Synthetic sensors/session/wake fixtures
  exercise all five steps and collapse, denied wake, stopped and delayed sessions.
  They neither call the relay nor send diagnostics, request GPS or play audio.
- Primary onboarding and collapsed live content have equal client/scroll heights
  at 390 x 760 and 320 x 568; no horizontal overflow. Expanded optional details,
  unusually short viewports or enlarged accessibility text can scroll safely.
- LIGHT/DARK and receiver 773 x 601 captures preserve the selected hierarchy.
  Receiver delayed state blanks readings and RTT; live values identify forward
  acceleration and yaw rotation. Wake denial remains incomplete on step five.
- `compiled-phone.png` exercises the production phone entry separately. The other
  phone/receiver screenshots are synthetic fixture evidence, not physical results.

## Publication evidence

The first verified publication is `20260920-1653.2cd7623`, recorded by the
`release/initial-*` files. It passes sixteen canonical HTTPS identity/hash/cache/API
checks and public drawer, QR and cancellation checks. The final copy corrections
are tracked separately so the first publication record remains intact.

Final publication **20260920-1716.24c955b** passes official identity/upload verification:
38 files / 6,508,831 bytes, 831 static files and 29 recordings reused after verification,
one previous asset retained, ROOT_UPLOAD_ONLY. All sixteen canonical HTTPS checks
pass, including bare/cache-busted/reloaded HTML, exact assets and motion API rejection
boundaries. See [final publication](release/publication.txt) and
[canonical evidence](release/canonical.json). The public browser confirms build identity
and the compact drawer; physical iPhone acceptance is not inferred.

## Open physical acceptance

Actual Safari screen-wake acquisition/release, mounted sensor signs and a sustained
iPhone/Tesla session need the owner's real-device pass. The prior relay continuity
trials remain below the 95% target; this UI change does not relabel them as passed.
First real automatic diagnostic inbox receipt is also still open. No synthetic
mail was sent during these checks. GPS remains the speed authority.
