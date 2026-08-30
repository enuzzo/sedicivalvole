# SOUNDTRACK Source Policy

Status: **implemented admission and transient metadata-rotation foundations; no
network catalogue or player is connected yet**. Updated on 2026-08-31.

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
this repository still plans direct source streaming with transient browser
media buffering only; it does not admit Jamendo hosted copies or offline audio.

Primary sources checked on 2026-08-30:

- [Jamendo API Terms of Use](https://devportal.jamendo.com/api_terms_of_use)
- [Jamendo tracks API](https://developer.jamendo.com/v3.0/tracks)
- [Creative Commons licence overview](https://creativecommons.org/cc-licenses/)

## Direct grants

A direct permission, including the owner-confirmed Illobo grant, must record a
stable evidence reference and an explicit decision for every capability. The
public policy object records only that reference and the capability decisions;
private messages or credentials never enter the repository.

## Current implementation

- `src/soundtrack/source-policy.js` owns licence parsing, Jamendo item
  normalization, direct-grant admission, and the effects gate.
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
- `tests/soundtrack-rotation.test.mjs` covers expiry, deduplication, three-role
  identity, broad rotation, back/forward, removal, exhaustion and recovery.
- These modules are not imported by the production application yet. Proxy
  fetching, any approved persistent metadata layer, three transient browser
  media elements, native `preload=auto`, UI, playback, attribution and canonical
  deployment remain later checkpoints. The current `preparedMetadataSlots`
  summary is not an audio-buffer or offline-duration claim.
