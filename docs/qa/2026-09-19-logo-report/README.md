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

Owner clarified the usual mount: portrait in the inclined Tesla phone tray,
screen toward the driver/cabin. The [Tesla manual](https://www.tesla.com/ownersmanual/model3/en_pr/GUID-A1DF67DE-94B4-4859-98B4-B0A5D342FAB3.html)
identifies the front-console pads but provides no inclination angle. The
[W3C motion specification](https://www.w3.org/TR/orientation-event/) defines
phone-frame acceleration; measured gravity can supply tilt compensation, while
vehicle-forward direction still requires the mounting assumption/calibration.

Owner corrected the mount wording: portrait describes screen orientation, not
a physically vertical phone. The phone rests on the tray at an estimated
30–40 degree inclination (reference plane unspecified); do not hard-code that
estimate. Gravity at ZERO should measure the actual inclination.

## Publication

Source a1db5bd; canonical release 20260919-1649.a1db5bd. Official
preserve-existing publication: 38 files / 6,483,271 bytes; 825 static files and
29 recordings fully verified/reused; two old assets retained; ROOT_UPLOAD_ONLY.
All 21 HTTPS identity/hash/cache checks pass (see live-identity.json). Canonical
browser confirms the 64 px Intro mark and current release without warning/error.
Intro remains open, without starting a synthetic public diagnostic session.
The existing Visual picker was also checked: Stats for Nerds remains available.
