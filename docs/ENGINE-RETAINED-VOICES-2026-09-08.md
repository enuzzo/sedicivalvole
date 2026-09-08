# Retained Engine voices and FMOD evaluation

Owner decision, September 8, 2026: keep Mono, Rosso and Touring unchanged; remove Otto, Cinque and Turbine from the selectable product and LAB. This supersedes the earlier six-voice catalogue. The existing Mono hybrid layer is explicitly retained with its accepted calibration.

The shared public catalogue now admits only the three retained voices. Intro, running Telemetry, native next/previous profile cycling and profile validation already consume that catalogue. The A/B LAB now consumes it too and rejects a non-catalogue profile at its selection handler. LAB starts at Mono; historical notes remain intact. Original procedural definitions and tests remain as internal history and support for the unchanged Mono voice; they are not selectable engines. No audio assets, gearing, gain, filters, sample preparation or lifecycle behavior changed.

## FMOD: verified scope

FMOD, by Firelight Technologies, is audio middleware: Studio authors parameter-driven events and Engine plays them in an application. Its runtime can run in a browser; this does not make it a free multi-engine sample library. [Official product](https://www.fmod.com/) and [browser examples](https://www.fmod.com/assets/html5/core_api/demo.html).

FMOD staff confirms a Vehicles / Car Engine event with an RPM parameter in the Studio Examples project. The documentation verifies an example, not a count of independently recorded engine banks. [Staff explanation](https://qa.fmod.com/t/need-a-step-by-step-guide-for-creating-a-vehicle-engine-with-loops/22454).

The official [Granular Synth truck demo](https://www.fmod.com/assets/html5/core_api/granular_synth.html) was tested through its real Start Sample method control. It reported two playing channels and a 48 kHz mixer/system rate; Pause toggled On. This is runtime-control evidence, not an assistant listening-quality verdict. The public Studio Event Parameters web page was also inspected: that particular browser example controls footstep surface, not car RPM. Do not present it as the car demo. No example files or runtime were copied into sedicivalvole.

The [download page](https://www.fmod.com/download) requires sign-in. No account credentials were supplied and no account was created or EULA accepted. Full Studio acquisition and local integration remain blocked on normal account access and license acceptance.

The [current EULA](https://www.fmod.com/legal), section 1.4, prohibits redistributing example media including wav, ogg, mp3, fsb and bank files. Permission to use example code or qualify for a free software license does not grant sample redistribution. The [licensing page](https://www.fmod.com/licensing) distinguishes games from non-game/automotive/simulator use; no project eligibility or commercial rate is assumed. An integrated public demonstration using these example sounds is therefore not prepared. The official externally hosted demo is immediately testable without redistributing it.

The useful source target remains coherent original sample banks divided by RPM and load/release, with separately usable media rights. FMOD is a possible playback system to evaluate, not a replacement for that source requirement.

## Validation

The full native suite passes 807 tests with Python 3.11, including the two new catalogue tests. Ten final packaging/build checks also pass through the native wrapper; a direct unwrapped attempt hit the known ARM/x64 esbuild mismatch. A first invocation from the repository root had no package.json; the corrected app-directory run exposed one environment-only Python 3.9 failure in the deployment configuration fixture. The entire suite was rerun with the required Python 3.11 and passed. Build 20260908-2356, source de16389, generated both App and protected LAB. All 196 dependency credits pass. Local browser checks used the real Intro/session controls with a requested 773x601 viewport and disabled automatic diagnostic reports on the isolated local origin. The browser returned a scaled 703x546 capture. Mono reached HYBRID ENGINE; Rosso and Touring reached SAMPLE ENGINE. All three selectors worked and no browser errors were reported.

Official preflight passed with remote_writes=NONE. Publication and canonical evidence are recorded in DEPLOY.md and docs/qa/2026-09-08-engine-retirement. Vehicle retesting remains owner acceptance; unchanged audio calibration is code evidence, not a new physical listening result.

## Owner rejection after the official FMOD audition — September 9, 2026

The owner listened to the public granular truck example and rejected its thin, flute-like character. This is an owner listening verdict for that example, not a benchmark of all FMOD content. Cancel the proposed acquisition/integration path for this candidate; no account action is needed for it. Keep searching for appropriately licensed RPM/load-separated recordings comparable to the three retained engines. No FMOD code or media was integrated.
