# Piston size and Session report refinement — September 19

The owner requested a more visible piston/16 mark on the opening screen, a
slightly larger navbar mark without increasing the navbar, and removal of the
redundant Stats shortcut from Session report. Original image bytes are unchanged.

- Intro: 64 px instead of 44 px; heading 64 px. Narrow layout: 48 px visual
  mark instead of 36 px, preserving its original layout slot.
- Navbar: 60 px instead of 52 px; compact 52 px instead of 48 px.
  The Tesla bar remains 64 px and phone landscape remains 56 px.
- Session report: removed button and unused styling; Visuals still owns Stats.
- Native functional/regression suite: 997/997; documentation: 8/8; credits: 189.
- Local screenshots cover Intro 773/390/320, Tesla navbar/report and phone
  landscape. Synthetic diagnostic delivery is blocked by the existing QA entry.
- The 320 px Intro still has the previously documented tight heading/content
  overflow; this scoped mark change does not expand its layout slot.

The owner's acceleration question was checked against App.jsx and
`motion/reference.js`: Engine and audio effects still use GPS/Demo-derived
motion. The fresh companion sample currently drives Aperture rotation only.
ZERO yields a phone tare frame, not calibrated vehicle longitudinal axes.
Phone-driven acceleration effects remain an unimplemented next integration;
this UI refinement does not claim to enable them. Physical device acceptance
is separate from browser evidence.
