# SOUNDTRACK Source Policy

Status: **implemented server-side discovery, transient playback, vehicle/manual
effects, and passenger-operated library browsing**. Updated on 2026-08-31.

This policy turns source and licence evidence into fail-closed runtime
capabilities. It is an engineering gate, not a substitute for legal review.

## Capability contract

Every SOUNDTRACK item resolves four independent decisions:

| Capability | Meaning |
|---|---|
| `inAppSelection` | The recording may appear as a selectable product item. |
| `sourceStreaming` | Playback may use the source-provided stream URL without hosting a copy. |
| `audioEffects` | The recording may enter the project effects path. |
| `hostedCopy` | The project may host or deliver its own copy. |

Each value is exactly `allow`, `deny`, or `unknown`. Admission requires both
`inAppSelection` and `sourceStreaming` to be `allow`; effects additionally
require `audioEffects: allow`. `unknown` never inherits permission from another
field.

## Jamendo boundary

The first adapter accepts only complete items with a track identifier, title,
artist, source-owned HTTPS stream URL, direct Jamendo content link, and a known
Creative Commons licence URL. It retains only playback and attribution data;
download URLs and download flags do not enter the normalized product item.

The current project policy admits CC BY, BY-SA, BY-NC, and BY-NC-SA records for
this noncommercial product and preserves attribution, noncommercial, and
share-alike obligations as data. CC BY-ND and BY-NC-ND are deliberately
excluded from selection as well as effects, rather than relying on an
effect-bypass exception. Unknown or malformed licence identifiers fail closed.

Jamendo's current API terms permit noncommercial API use, require credit to the
member and Jamendo plus a direct backlink for every content item, and prohibit
applications designed for content caching or offline access. The tracks API
separates the stream `audio` field from downloads and exposes the required
credit, image, licence, music-information, and `shareurl` fields. Accordingly,
this repository uses direct source streaming with transient browser
media buffering only; it does not admit Jamendo hosted copies or offline audio.

Primary sources checked on 2026-08-31:

- [Jamendo API Terms of Use](https://devportal.jamendo.com/api_terms_of_use)
- [Jamendo tracks API](https://developer.jamendo.com/v3.0/tracks)
- [Creative Commons licence overview](https://creativecommons.org/cc-licenses/)

## Direct grants

A direct permission, including the owner-confirmed Illobo grant, must record a
stable evidence reference and an explicit decision for every capability. The
public policy object records only that reference and the capability decisions;
private messages or credentials never enter the repository.

The current Illobo grant explicitly allows in-product selection, source
delivery, effects processing, and a project-hosted copy. Its 29 immutable WAV
masters and 29 derived MP3 web masters remain in the ignored provenance archive;
neither enters Git. At publication time the protected deploy gate validates the
complete local manifest and every MP3 SHA-256, generates a bounded public
metadata catalogue, uploads the 29 web masters to `/audio/illobo/`, and verifies
every remote hash. The product links credit and QR to Illobo's public SoundCloud
page and labels the permission `Direct grant`; it never fabricates a Creative
Commons licence URL.

## Current implementation

- `src/soundtrack/source-policy.js` owns licence parsing, Jamendo item
  normalization, direct-grant admission, and the effects gate. Its optional
  discovery fields retain normalized `musicinfo.tags.genres` and only the five
  official `musicinfo.speed` values. Catalogue pace is never driving pace, and
  metadata never bypasses the licence gate.
- `tests/soundtrack-source-policy.test.mjs` covers unknown licences,
  NoDerivatives exclusion, Creative Commons obligations, Jamendo URL/credit
  validation, download-field removal, and explicit direct-grant decisions.
- `src/soundtrack/catalog-store.js` accepts only already-admitted items with
  complete stream, backlink, provider-credit and licence evidence; deduplicates
  them; and exposes a bounded session-memory metadata snapshot that fails closed
  after its TTL. No stale entry is returned for activation.
- `src/soundtrack/rotation-model.js` owns immutable previous/current/next
  metadata roles, bounded recent track/artist memory, different-artist
  preference, reversible movement, fresh-target replacement, displaced-entry
  release evidence, and recovery refill without replacing the audible current
  item. Exhaustion never changes mode.
- `src/soundtrack/media-deck-controller.js` maps those three metadata identities
  onto at most three direct-source browser media elements. Synchronization only
  prepares with native `preload=auto`; explicit play owns activation, late play
  promises cannot revive an old role, and displaced/changed elements lose their
  listeners and source before release. Its readiness/buffer snapshots are
  browser observations, never an offline guarantee.
- `src/soundtrack/transition-model.js` owns the nominal 450 ms equal-power skip
  envelope independently of media and queue mutation. Audio-clock sampling,
  revision/request guards, continuous reversal/third-target retiming, a strict
  three-identity ceiling, native gain curves and segmented-ramp fallback keep
  the transition deterministic without selecting another music mode.
- `src/soundtrack/attribution-model.js` projects that audio-clock mix into
  display-safe credit only: artist, title, optional album/artwork, provider,
  obligations, licence and direct content/QR destination. It follows every
  genuinely audible identity, never exposes a stream URL, and fails playback
  closed when any audible deck lacks complete admitted credit.
- `src/soundtrack/playback-boundary.js` makes the owner clarification
  executable: fixed recordings remain at authored `1×` playback, and driving
  cannot select or retime them. The shared manually operated footer `EFFECTS`
  master may enable
  the existing OPEN/UNDERWATER/BLOOM vehicle-reactive effects, independently of
  four normalized manual controls for flanger, reverb, chorus, and beat repeat.
  The same source capability gate applies to both effects paths.
- `src/soundtrack/catalog-client.js` keeps two source adapters distinct. Jamendo
  requests use the same-origin API/audio relays and explicit passenger
  pace/genre filters. Featured requests use only the static Illobo catalogue and
  same-origin hosted recordings. A source switch cannot reuse the other
  adapter's cached catalogue.
- `src/soundtrack/library-model.js` maps three passenger-facing pace choices to
  the official Jamendo `speed` enum, keeps a small explicit genre set, and owns a
  deterministic per-selection shuffle that changes at each 30-minute boundary.
  Each explicit Featured gesture rotates the complete 29-track Illobo ordering
  to a random start, avoiding the current identity when alternatives exist; it
  never substitutes a Jamendo record or discards an Illobo identity. Here
  `random start` means a random playlist head only: the chosen recording is
  recreated and begins at `0:00`, never at a random or retained media timestamp.
- `src/soundtrack/preview-controller.js` composes catalogue, rotation, transient
  media decks, attribution, and the live effect graph for explicit App/LAB use.
- `src/soundtrack/effects-controller.js` owns the Web Audio graph for OPEN,
  UNDERWATER, BLOOM, flanger, reverb, chorus, and bounded echo while
  keeping every media element at authored rate.
- `public/api/soundtrack-catalog.php` keeps the Jamendo client ID server-side,
  validates official speed and bounded genre filters, and returns only
  display/playback fields with short-lived no-store headers.
- `public/api/soundtrack-audio.php` resolves one exact admitted track ID, rejects
  effects-disallowed licences, forwards byte ranges, and streams without writing
  a hosted or offline Jamendo copy. This relay is not used by Illobo Featured.
- `scripts/deploy_drive_lab_ftp.py` is the sole Illobo publication boundary. It
  reads the ignored provenance manifest without copying it into Git, validates
  all 29 local masters, publishes the public catalogue and web audio, and checks
  all 29 remote hashes before the canonical entry can switch.
- `tests/soundtrack-rotation.test.mjs` covers expiry, deduplication, three-role
  identity, broad rotation, back/forward, removal, exhaustion and recovery.
- `tests/soundtrack-media-deck.test.mjs` covers direct-source preparation,
  readiness, observed buffered time, explicit play/pause, deck reuse, source
  replacement, stale events/promises, media failure and complete teardown.
- `tests/soundtrack-transition-model.test.mjs` covers duration, constant power,
  rapid reversal, three-deck retargeting, the fourth-deck refusal, AudioParam
  capability validation, curve/ramp scheduling and stale completion guards.
- `tests/soundtrack-attribution-model.test.mjs` covers display-field projection,
  stream removal, dominant/tied credit, three-deck retargeting, missing-credit
  refusal, optional artwork/album fallback and invalid transition evidence.
- `tests/soundtrack-playback-boundary.test.mjs` proves authored-rate and
  track-selection invariants, explicit vehicle-FX enablement, the exact four
  manual controls, normalized amounts, authorized passenger control, and
  fail-closed source/control decisions.
- The App and protected owner LAB now import the production preview/effect path.
  The App Music drawer switches between Play the Road and Soundtrack; within
  Soundtrack it presents equal compact Illobo Featured and Jamendo Library
  alternatives. Illobo exposes its own complete playlist with a random start on
  every press; Jamendo alone exposes cover previews and immediate play by
  pace/genre/exact track. Both retain the 30-minute editorial refresh notice.
  Both surfaces expose audio-clock-derived
  audible credits, direct Jamendo navigation, transport, the global vehicle-FX
  master, and four manual effects. The production deck applies the nominal
  `450 ms` equal-power model through normal skips, reversals, and rapid
  third-deck retargeting without exceeding three transient elements. The compact
  QR opens the current public track page and never exposes its relay or stream.
  Canonical publication and 29/29 FTP/HTTP identity checks pass; build
  `20260831-1755` adds the explicit `0:00` track-head guarantee. Target-vehicle
  playback/effects acceptance remains open.
  `preparedMetadataSlots`
  reports metadata roles only; it is not an audio-buffer or offline-duration
  claim. The browser retains no offline copy; owner-authorized Illobo web masters
  are deliberately hosted server-side, while Jamendo remains transient only.

## Library discovery boundary

The official Jamendo tracks schema was revalidated on 2026-08-31. The server may
send only `verylow`, `low`, `medium`, `high`, or `veryhigh` through its `speed`
filter and a bounded normalized genre through `tags`. These values belong
exclusively to passenger-operated catalogue discovery. Pressing a pace, genre,
or exact track is an explicit request to start that chosen catalogue path; no
vehicle event may make that request. Pace must not enter vehicle telemetry,
playback timing, playback rate, pitch, effects automation, persistent storage,
or an inference for records that omit it.
