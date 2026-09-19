# Automatic report controls — September 19

The owner annotated the ambiguous AUTO SEND OFF button and reaffirmed Dev/ON as the development default. The annotated local QA page had explicitly forced OFF to protect against synthetic mail. It now mirrors Dev/ON while retaining its request-level delivery block.

Session report now separates a non-interactive AUTO REPORTS · ON/OFF state and cadence/status from the explicit PAUSE SENDING / ENABLE SENDING action. Standard offers ENABLE DEV REPORTS; selecting Dev enables automatic delivery. An intentional saved pause or Standard still survives normal product reload. Intro exposes state plus the explicit next action within the existing compact control.

The clock, recipient, report contents and server interval are unchanged: 15 minutes of observable active session time, including stops/GPS loss/offline activity, excluding hidden time and unobserved gaps over five seconds. One pending in-memory report, bounded retries and the server's fifteen-minute floor remain.

## Verification

- Native regression: 997 cases pass. Focused diagnostics/endpoint/presentation: 19 pass.
- Browser 773 × 601: initial Dev/ON, PAUSE → OFF with ENABLE SENDING, Standard → manual-only, Dev → ON. Screenshots preserve these states; no diagnostic submission.
- Intro at 320 × 568: automatic control occupies x=182.5…312, y=0…48; no horizontal overflow or overlap with cache control (right=152.8), and it ends at the cockpit's top edge.
- Report at 390 × 844: state and 48 px action remain side by side, without horizontal overflow.
- The owner-supplied Tesla report already records mode=dev, automaticEnabled=true and intervalActiveMs=900000. Its trigger is manual, so it proves configuration rather than automatic inbox delivery.
- Final affected/documentation checks: 52 pass. Public-source index: 1,553 text files, no findings. Credits: 189 exact entries.
- Synthetic QA requests remain blocked; no test email sent.

## Canonical publication

Source `1085bbf`, build **20260919-1630.1085bbf**, is published. Production verifies 827 exact static hashes. Official preserve-existing publication passes all gates: 38 files / 6,483,420 bytes, 825 static files and 29 recordings fully verified/reused, two older assets retained, ROOT_UPLOAD_ONLY.

`live-identity.json`: all 21 bare/cache-busted root and exact asset hash checks pass; roots return no-store/no-cache. `live-browser.json` and `live-intro-on.png`: canonical reload has the same release, explicit PAUSE SENDING action and Dev/ON, no horizontal overflow or console warnings/errors. The previous test browser's stored pause was explicitly re-enabled under the owner's instruction and remains ON after reload. Leave canonical on Intro, with no active session clock or synthetic diagnostic submission. The annotated local preview stays open with Dev/ON and blocked synthetic delivery.

Prior Engine cells, contextual chrome, encrypted phone transport and Aperture gyro changes remain included; physical phone/Tesla acceptance is separate.
