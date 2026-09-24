# Night Instrument — September 24

## Decision and scope

On September 24 the owner reviewed an aesthetic audit of the running product
and the passenger remote, selected direction **A — Night Instrument**, and
approved every proposal in it, including the effects, animations and the
iPhone companion rework. The owner explicitly asked for autonomous
implementation after a stable backup point, and accepted that the direction is
realised without the usual Image Gen selection round. This is scoped approval
for the items below; it does not delegate unrelated future redesigns.

Principle: the field is the show; the interface is a precision instrument lit
by it. The Braun/Swiss vocabulary stays (flat, gridded, tabular numerals, no
knobs or glass). What changes is material, light and imagery:

- plates carry keys; one housing per group; no divider lines;
- the palette accent behaves as light (LEDs, lit lines), not as large fills;
- every animation reads a real signal (speed, playback, depth, gear, pairing);
- choices are shown, not described (preview frames, covers, swatches);
- LIGHT is a porcelain day instrument, DARK a night one; both come from the
  existing semantic roles and contrast resolver.

Backup point: tag `pre-night-instrument-20260924` (pushed) at `138fa6a`, the
source of live build `20260923-2255`; the local build copy is
`prototype/drive-lab/output/dist-before-night-instrument-20260923-2255`.

## Owner audio correction

The owner reported that the three tone effects sounded crackly and did not
isolate their bands. Measured on an `OfflineAudioContext` at the authored hit:

| Effect | Before | After |
| --- | --- | --- |
| Bass (`bassDrive`) | +9.7 dB at 100 Hz (a boost through a tanh drive) | −65.8 dB at 60 Hz, −34 dB at 150 Hz, 0.0 dB from 1 kHz |
| Mid (`radioCut`) | 16.2 % harmonic distortion | −77 dB at 60 Hz, +2.6 dB at 1 kHz, −50 dB at 12 kHz |
| High (`highCut`) | only −12.9 dB at 8 kHz (dry path blended back in) | 0.0 dB to 400 Hz, −52 dB at 6 kHz, −82 dB at 12 kHz |

All three are now serial fourth-order Butterworth filters (two biquads per
edge, Web Audio Q expressed in decibels), with no waveshaper and no parallel
dry blend; distortion is 0 % within measurement. A two-percent bypass
crossfade keeps exact zero transparent. Displayed names are **Bass Cut**,
**Mid Focus** and **High Cut**; internal ids stay `bassDrive`, `radioCut`,
`highCut` for saved state and the remote protocol. The last slider stretch adds
bounded resonance (at most +4 dB over Butterworth) rather than distortion.

## Tesla display

- **Top rail.** Mark and a recessed speed display with odometer digits and one
  lit gauge line for the shared 130 km/h response ceiling. Music/Engine is a
  sliding two-position switch with LEDs. Network, appearance, GPS and remote
  share one housing; Discover and Report are separate keys. Cells arrive in
  reading order on wake.
- **Rest.** Mark and speed display share one shadowed plate; nothing else.
- **Footer.** Keys on a plate, one label row and one value row for every key:
  Sound (speaker glyph), Brake FX (LED), Visual and Music (current artwork,
  caret on the label row), MIX (eight LEDs, one per effect), Palette (live
  orb). Labels replace the ambiguous `MUTE OFF` / `FX ON` / `FX ↑`.
- **Now Playing.** One 72 px plate, 56 px transport keys, activity bars only
  while audio plays, the piston mark when a track has no artwork.
- **Visual library.** A 5 × 2 gallery of the existing real preview frames with
  an ACTIVE LED chip and an arrow chip for destinations. The Intro picker uses
  the same gallery. No generated concept art is used.
- **Music library.** One sliding source switch, borderless chips, the LED only
  on the selected pace/genre, score sleeves with a single round play key, and
  decoded Jamendo text (`FairyTale&amp;Ghosts` → `FairyTale&Ghosts`).
- **Performance FX.** Eight pads in the existing non-modal 2 × 4 deck. Tap plays
  the authored hit or stops the effect; vertical drag sets depth, drawn as a
  soft column of light. Each pad is an ARIA slider with keyboard control.
- **Engine.** Twelve steady shift lights (no flashing), a dashed RPM peak hold,
  a detented gear change and one full-width TAMARRO bar named at both ends so
  driver and passenger reach it; its fill follows real RPM while revving.
- **Intro.** One plate with sliding switches, record-sleeve choices, a quiet
  presets/palette housing (no vertical rule), the palette named as in the
  footer, and START marked with the Signal Gate.
- **Signature motion.** START grows a vertical light gate and the running field
  opens from that seam. Palette changes spread from the touched swatch through
  the View Transitions API. Both are skipped with reduced motion or without
  support.

## Passenger remote

The display is mirrored at the top: the current visual frame as backdrop, the
cover, title, source and large transport. Below it a Music/Engine switch and
four sections behind a native tab bar — Visual (3-column gallery, tap to
switch), Music (Play the Road covers or Soundtrack), FX (Braking Underwater and
eight pads) and Palette (real swatches); Engine mode shows the engine
characters instead of Visual/Music. The pairing guide is illustrated with an
original animated scene, a three-step list and a strip of the visuals it will
control. Pairing, reload persistence, acknowledgements, coalesced effect
commands and Forget are unchanged.

## Supersessions

These owner-approved changes supersede, within this scope: the running footer
labels; per-chip media icons in the Soundtrack filters; the Intro's vertical
rule between presets and palette; slider rows in the FX Deck (depth control
remains independent per effect); the two TAMARRO buttons; the remote's
right-side pages for Mode/Music/Visual/Effects; the tone effects' "distorted at
100 %" character for Bass/Mid/High. All geometry contracts that are not listed
here remain: 64 px Tesla rails (56 px phone landscape), 48/56 px targets, the
13–32 px type ladder, chrome rest/wake rules and renderer artwork.

## Verification

- Native aggregate: 1,105 tests pass, including new decoded-metadata and
  Butterworth tone-filter checks.
- `scripts/qa-night-instrument.mjs` drives the real local App with synthetic
  catalogue/audio and a controllable GPS: 46 captures across LIGHT/DARK at
  773 × 601, a moving 84 km/h state, Engine, pads (tap 78 %, drag 52 %),
  palette, narrow 702 × 546 and phone landscape 844 × 390, and a real local
  display↔phone pairing through the localhost relay where a phone pad lights
  the display's MIX key. No page errors, console errors or diagnostic sends.
- A browser measurement confirms every visual name fits the footer Visual key
  at 773 × 601.

Browser rendering does not establish cabin legibility, Tesla touch, GPU cost of
the new transitions, or iPhone Safari behaviour; those remain physical gates.
