# Automatic report controls — September 19

The owner annotated the ambiguous AUTO SEND OFF button and reaffirmed Dev/ON as the development default. The annotated local QA page had explicitly forced OFF to protect against synthetic mail. It now mirrors Dev/ON while retaining its request-level delivery block.

Session report now separates a non-interactive AUTO REPORTS · ON/OFF state and cadence/status from the explicit PAUSE SENDING / ENABLE SENDING action. Standard offers ENABLE DEV REPORTS; selecting Dev enables automatic delivery. An intentional saved pause or Standard still survives normal product reload. Intro exposes state plus the explicit next action within the existing compact control.

The clock, recipient, report contents and server interval are unchanged: 15 minutes of observable active session time, including stops/GPS loss/offline activity, excluding hidden time and unobserved gaps over five seconds. One pending in-memory report, bounded retries and the server's fifteen-minute floor remain.

## Verification

- Native regression: 997 cases pass. Focused diagnostics/endpoint/presentation: 19 pass.
- Browser 773 × 601: initial Dev/ON, PAUSE → OFF with ENABLE SENDING, Standard → manual-only, Dev → ON. Screenshots preserve these states; no diagnostic submission.
- Intro at 320 × 568: automatic control occupies x=182.5…312, y=0…48; no horizontal overflow or overlap with cache control (right=152.8), and it ends at the cockpit's top edge.
- Synthetic QA requests remain blocked; no test email sent.

Build and live evidence will be added after canonical publication. Prior Engine cells, contextual chrome, encrypted phone transport and Aperture gyro changes remain included; physical phone/Tesla acceptance is separate.
