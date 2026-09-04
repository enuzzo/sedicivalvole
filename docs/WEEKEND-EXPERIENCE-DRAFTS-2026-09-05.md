# Curated experiences and travel ATLAS — draft, 2026-09-05

Status: owner-approved direction; not implemented. Candidate names/combinations
below are agent proposals, not accepted music programming or final visual designs.

## Curated experiences

A saved experience combines existing visual family/variant, palette and music
selection, preserving independent controls and existing preferences. It must not
change the 130 km/h normalization, create a new audio graph or silently start
playback. Apply selections through the current state/transport owners as one
coherent operation; failure must leave a truthful, recoverable state.

Proposed first candidates for an audition/prototype:
- Night Glass: Japanese Mist, restrained dark palette, an explicitly chosen
  continuous Soundtrack selection; judge calmness and transition continuity.
- Road Form: Aperture plus an existing authored Play the Road score; judge
  rest-to-motion composition and the relationship of musical and visual density.
- City Companion: travel ATLAS plus an independently selected music source;
  judge place comprehension, map space and unobtrusive playback.

First deliverable: a small explicit registry and atomic apply/restore tests,
then a compact choice in the launch flow and one running selector using the same
registry. Present exactly three visual directions before a substantial new UI
build unless the owner explicitly supersedes that selection gate. Avoid adding
another drawer solely to expose settings already available. Measure touch count,
48/56 px targets, restored preferences, interrupted preload and chrome retraction.

## ATLAS and the separate statistics visual

Owner direction: ATLAS becomes the journey companion; move its elaborate drive
statistics into a distinct future visual (working concept: Observatory).
ATLAS should prioritize map, heading/location confidence, selected place and
passenger discovery. Keep attribution, demo provenance and sidebar collapse.
The statistics visual can explore speed history, motion phases, direction,
elevation, frame/network state and trip totals as a coherent instrument field.
It must consume existing normalized telemetry instead of duplicating collection,
claiming unavailable vehicle data or bringing back a generic Energy metric.

Sequence: inventory every existing Atlas statistic and its source; design three
compositions; select a direction; implement the new consumer; verify numerical
parity and accessibility; only then simplify ATLAS. Define whether the statistics
view is useful while moving or a passenger/stationary review surface. New metrics
need an observable source and a clear distinction between measurement and estimate.

## Weekend endurance

The owner will supply real multi-hour Sunday evidence. Complement it later with
long-running browser sequences and controlled offline/slow-network/recovery
fixtures. Do not confuse an accelerated 24-hour model test with wall-clock
endurance, thermal behavior or listening acceptance. Use the new diagnostic
journey overview to locate intervals; correlate detailed playback/network events
before inferring a cause. Keep all report transmission explicitly manual.
