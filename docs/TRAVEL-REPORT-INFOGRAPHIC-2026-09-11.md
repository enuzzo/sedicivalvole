# Travel Report infographic — September 11, 2026

The owner requested the Stats heading waves, one speed/elevation timeline,
observed listening and favourite genre/visual/palette, and a more graphic report
using the site's typeface. This extends the approved September 11 report layout.

## Product and data

The report has four A4 pages, or five with the explicitly selected route:
journey, optional route, rhythm, atmosphere and session details. Rounded metric
cards, generous type, restrained red/blue/sage blocks and original vector graphics
organize the information. Heading uses the same eight directions and six outward
bands as Stats. Speed and altitude share time but retain labelled independent
scales; missing observations and altitude source changes break their traces.
GPS height is solid; terrain estimates are dashed and separately attributed.

An optional `experience` field stores session-only observations. The existing
running-session sampler observes the visible visual/palette and confirmed audio
clock; visibility transitions also close the observation boundary. Listening
requires the same unmuted, playing track/score at both sample endpoints and a
plausibly advancing clock. Pause, buffering, seeks, hidden time and execution
gaps over five seconds cannot become inferred listening. Offline audio can count
if its clock genuinely continues. No additional audio context, timer or per-frame
React update is created. Stats, the report and audio retain their existing owners.

Only IDs, display titles, artist text, genre/visual/palette labels, hex swatches
and durations are admitted. Collections retain at most 64 tracks and 32 entries
per preference category; the listening total includes overflow tracks without
claiming an exact overflow count. Sampling is capped at 24 hours. Most-heard
tracks are ordered by measured listening duration; genre shares use listening
time and visual/palette shares use observed visible time. Short transitions can
be conservatively undercounted. Reports do not infer data for earlier sessions.
No preference history is persisted or added to automatic technical diagnostics.

The client freezes a detached snapshot at Export session. The server validates
bounded totals and metadata with a backward-compatible optional field. The
existing preview hash, remembered/verified recipient, idempotent send and
prepared offline download contracts are retained. Route cartography stays in
the same reviewed snapshot; no map fetch occurs at send time.

## Typeface and provenance

The report embeds Space Grotesk Regular 400 and Semibold 600, derived from the
existing admitted variable TTF. Western CP1252 text preserves accented Latin
characters; unsupported glyphs are transliterated for the PDF while the snapshot
retains its Unicode metadata. Long names shrink and then truncate within their
cards. No font is fetched during report generation.

Rebuild with `scripts/build_report_fonts.py` using FontTools 4.60.1 in a temporary
tooling environment. Its source hash, derived JSON/compressed-font hashes and
original OFL notice are recorded in `public/report-support/fonts/` relative to
Drive Lab. These derived fonts retain SIL OFL 1.1; original drawing and generation
code remain project code. FPDF 1.9 and its original core metrics are unchanged.

## Verification

- 56 focused checks pass: session observation, immutable model, real PHP renderer
  and preview/mail identity, optional maps, schema validation, font integrity,
  and deployment identity. Mail tests use a fake transport.
- All five pages of a synthetic route/listening example were rendered and
  visually inspected, including map attribution, shared chart, font embedding,
  favourites and heading waves. It is an example, not a reconstruction of the
  owner's supplied journey.
- Existing dependency credits remain complete: 196 exact lockfile credits.

The real app at 773 × 601 generated three report snapshots during Play the Road:
listening advanced to about 7.75 seconds, then remained identical across two
later paused exports while observed session time continued. The prepared blob
stayed downloadable after offline emulation. No page errors occurred; email
requests were blocked and preview used the actual local PHP renderer.

A Soundtrack check exposed a cached media snapshot: the displayed state could
retain a clock value from a buffer/lifecycle event after the recording was fully
loaded. Passive `getSnapshot()` now reads the deck's current media properties
without emitting updates, creating a timer or altering playback. Its 28 focused
controller tests pass, including a new event-free clock/pause case; the four
session observation checks also pass. There are 84 unique relevant checks across
the report, observation, controller and deployment groups.

Publication evidence is appended after the canonical gates complete.
Physical Tesla export/readability remains separate.
