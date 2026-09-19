# Equal Engine cells and live micro-signals

The owner annotated the existing three-value band and explicitly requested equal
boxes, identical typography/alignment and a different minimal live microanimation
for each value. This refines selected Engine Telemetry B, preserving the upper
crest, shared chrome, lower response graphs and stationary controls.

## Implemented behavior

- Three equal grid columns, identical title/value/status/signal rows, all aligned
  left. Desktop values share 78 px; compact Tesla shares a responsive size;
  phone landscape shares 48 px. Labels/status remain 13 px.
- RPM: an original repeating cycle plot. Cadence scales with authored RPM;
  amplitude follows the existing drive value. This is a slowed encoding of the
  virtual sound engine, not a captured waveform or physical combustion reading.
- Speed: an original travelling ruler under a fixed index. Only fresh nonzero
  speed scrolls; degraded GPS remains numeric with SIGNAL AGING and stops the
  ruler. Missing GPS displays a dash. Audio mute does not invalidate fresh speed.
- Gear: an original six-ratio selector follows the committed acoustic gear. Its
  two halves separate on release/synchronization and reunite on engagement.
  It does not run an arbitrary repeating animation at a stable gear. Neutral and
  continuous shaft select no discrete ratio.
- Paused/unprepared Engine freezes its cycle/shift cues. Hidden pages pause
  travel; reduced-motion disables travel and transitions while retaining values.
  The production plots add no animation scheduler or audio/sensor model changes.
- App and protected LAB import the same metric stylesheet. The speed cell keeps
  its real button and keyboard focus semantics.

## Preview

`/qa/engine-instrument.html` is a silent, development-only bench that mounts the
actual production component. It feeds synthetic speed through the existing gear
selection and shift-plan functions; no audio, geolocation or report is started.
Use Drive sequence, Stationary, Signal lost, Pause/Resume and Light/Dark. The
SIMULATED INPUT label distinguishes it from live telemetry. This file is outside
`public/` and excluded from the release. The preview server and owner-facing tab
are deliberately left open for further annotations.

The full app remains available at `/qa/ui-harmony.html?qaMute=1&speed=42`.
Its fixture mutes both modes and blocks diagnostic delivery. Actual Engine
runtime can therefore show paused RPM/gear rather than inventing activity.

## Verification

[Measured geometry](geometry.json) records equal cell widths, label/value row
y-coordinates, numeric font sizes and signal sizes. Screenshots are actual browser
renders, not generated concepts. The one-pixel inner-width difference is the
separator border; the outer columns are equal within subpixel rounding.

- [Desktop DARK](desktop-dark.png), [LIGHT](desktop-light.png), [Tesla](tesla-light.png).
- [Lost GPS](signal-lost.png) keeps the ruler inactive.
- [Compiled phone resting](compiled-phone-resting.png) and
  [awake](compiled-phone-awake.png), 667 × 375, retain all three signals without
  instrument scrolling. [Clearance](phone-clearance.json): graphs end at y=249,
  TAMARRO starts at y=255.
- [Motion samples](motion.json) observe changed rendered transform matrices and
  data-proportional cadence. Pause and signal-loss behavior were exercised in the
  browser. CSS reduced-motion handling is implemented; no operating-system
  preference change or physical device acceptance is claimed.

Six focused signal tests cover proportional mapping, invalid inputs, freshness,
paused audio, neutral/continuous ratios and actual phase allowlisting. The native
suite completed all existing functional tests plus these six; one deployment test
initially used the older Command Line Tools Python selected through PATH. It
passed with the normal Python restored, and the remaining Sites suite passed.
Total validated cases: 990 (initial run plus the targeted environment recheck).
The deployment/Sites recheck passes 35/35; final phone/recovery/documentation/signal
checks pass 25/25, and signal/LAB packaging checks pass 16/16. No gate was weakened.

The main candidate build verifies 827 exact static hashes. Final committed-source
build and canonical publication are recorded at closeout. Browser UI and synthetic
model samples do not establish physical Tesla touch, GPS, cabin audio or iPhone
acceptance. No diagnostic mail was sent. Unrelated recovery-prompt work is retained.
