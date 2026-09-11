# Road instruments and Travel Report — 2026-09-11

## Scope and owner feedback

The owner requested a clear current-location dot and short dashed trail, brighter
Air Atlas cartography, a recognizable natural-map action beside orientation/zoom,
compact Visual choices before Presets, and an explicitly delegated Engine
Telemetry refinement. The existing minimal instrument direction remains intact.
The owner also supplied two September 10 technical packets and the three-page
Travel Report, confirmed that PDF generation and recipient verification worked,
and requested a richer report with an actual map.

## Diagnostic evidence

Both supplied technical packets identify build `20260910-1402 / 243cc86`, a
773 × 601 viewport, GPS input, and no retained JavaScript runtime issues.
The earlier packet measured Air Atlas at 21.94 FPS across 129.8 observed seconds,
with p95 frame interval 248.3 ms. This is observed in-car evidence, not proof of a
single cause. The renderer now avoids unchanged marker transforms and duplicate
trail uploads; trail source publication is capped at once per second.

The later packet records weak-network hints and a Mono preparation timeout,
followed by one retry and `engine.bank.ready` about fourteen seconds after the
failure. The recovery already worked; no acoustic or bank tuning is inferred
from this event. Engine's approximately 10 FPS reporting cadence is the existing
100 ms telemetry update rate, not a failed 60 FPS renderer. Long unobserved gaps
remain excluded from active observation. Raw reports and the supplied PDF stay
outside the source repository.

## Product changes

- Engine: original 73-stem RPM comb with a crest centered on virtual RPM, a clear
  cursor, selected voice heading, and accent gear. Existing audio, gesture,
  standstill and ownership rules remain unchanged.
- Visual drawer: a compact two-column library leads, followed by a separator,
  Presets heading, and the existing curated combinations. Narrow layouts stack.
- Air Atlas: separate cartographic brightness from dark control panels; lift land
  and water visibility while retaining palette character. Render actual
  OpenMapTiles country/regional boundaries, distinguishing disputed lines.
  Natural-map, refresh and recenter use original SVG controls. UPDATE refreshes
  aircraft; the target icon recenters on the user and resumes Follow.
- The home marker is a white/blue dot with a heading cue when trustworthy, and a
  muted last-known state. Its session-only trail retains at most 128 measured
  samples, one kilometre and two minutes, breaking on coarse/stale fixes,
  missing speed, gaps over 30 seconds or implausible jumps. It adds no diagnostic
  coordinates or persistent route store.
- Map failures use the existing bounded five-minute recovery owner, pause while
  hidden/offline, and resume on online/foreground events. Camera framing,
  aircraft selection, audio and home history survive map retries. A failed map
  cannot cancel its recovery merely by emitting an idle event.

## Travel Report

Three A4 chapters cover the journey, separate speed/elevation charts, and the
session/technical appendix. Explicit route inclusion adds a fourth map page.
Direction distribution, time allocation, route start/finish, retained point count,
source distinctions and missing observations remain visible.

A print map is created only on demand, from the immutable opted-in route, using
existing MapLibre/OpenFreeMap/OpenMapTiles cartography. A fixed 1000 × 900 JPEG
and route are part of that same reviewed snapshot; sending never fetches a new
map. The server validates consent, dimensions, JPEG type and bounded size. No
arbitrary URL, HTML or PDF upload is introduced. The API body ceiling is bounded
to 1.25 MB; image data to 600 KB decoded; generated PDF to 2 MB.

Capture has a twelve-second total deadline and disposes its temporary map on
completion, cancellation or failure. Missing cartography falls back to an
explicitly labelled observed outline. Prepared downloads survive later network
loss. The existing verified-recipient, preview hash, idempotency and mail limits
remain in force. The original PDF contains drawing coordinates, not recoverable
geographic positions; technical packets deliberately contain no route. Therefore
new cartography is available on the next opted-in export, not reconstructed from
invented coordinates in the supplied historical PDF.

Map attribution stays in the exported page. Elevation attribution retains
Open-Meteo / EU Copernicus GLO-90 and CC BY 4.0. GPS altitude accuracy was absent
in the supplied packets, so unavailable GPS ascent/descent remains honest.

## Verification and acceptance

Focused Radar/Engine/curated-experience models, PHP report validation, immutable
snapshot/mail identity and production packaging were exercised. Local Chrome
checks use synthetic GPS/aircraft fixtures with technical mail intercepted;
print-map QA uses real existing cartography over an explicitly synthetic route.
PDF pages are rendered and inspected. Exact final release identity and final
checks are recorded in DEPLOY and the changelog after publication.

Owner confirmation closes the previously open recipient-verification workflow
for the supplied report. The new appearance, map capture and recovery changes
still require the next physical Tesla/iPhone and real-journey acceptance.

Cartographic schema: https://openmaptiles.org/schema/ . Map rendering API:
https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/ .
