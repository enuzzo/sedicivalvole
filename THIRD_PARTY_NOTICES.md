# Third-Party Notices

The current Drive Lab uses third-party software dependencies, includes code translated from textStep under its author's direct authorization, and ships JUNCTION as original mixed music produced with the royalty-free MusicRadar material documented below. No loose sample, loop, one-shot, multisample, or source-pack file has entered the repository or any build.

Third-party components retain their original licences or direct permissions and
are not relicensed under the project's PolyForm grant.

| Component | Version | Copyright / authors | License | Changes | Location |
|---|---:|---|---|---|---|
| React | 19.2.0 | Meta Platforms, Inc. and contributors | MIT | none | `prototype/drive-lab/` |
| React DOM | 19.2.0 | Meta Platforms, Inc. and contributors | MIT | none | `prototype/drive-lab/` |
| Vite | 6.4.3 | Evan You and contributors | MIT | local configuration | `prototype/drive-lab/` |
| @vitejs/plugin-react | 5.0.4 | Vite contributors | MIT | none | `prototype/drive-lab/` |
| [ShaderGradient React](https://github.com/ruucm/shadergradient) | 2.4.20 | ruucm and stone-skipper | MIT | unmodified package; exact owner-selected starting points are registered by project-owned adapters for three lazy public visuals and both LAB surfaces | `prototype/drive-lab/` production dependencies |
| React Three Fiber | 9.7.0 | Paul Henschel and contributors | MIT | unmodified ShaderGradient rendering peer used only by the lazy ShaderGradient product chunk and LAB surfaces | `prototype/drive-lab/` production dependencies |
| Three.js | 0.169.0 | mrdoob and contributors | MIT | unmodified ShaderGradient rendering peer, distinct from the older r109 VERTIGO vendor copy | `prototype/drive-lab/` production dependencies |
| three-stdlib | 2.36.1 | Paul Henschel and contributors | MIT | unmodified ShaderGradient rendering peer used only by the lazy ShaderGradient product chunk and LAB surfaces | `prototype/drive-lab/` production dependencies |
| camera-controls | 2.9.0 | Yomotsu | MIT | unmodified ShaderGradient rendering peer used only by the lazy ShaderGradient product chunk and LAB surfaces | `prototype/drive-lab/` production dependencies |
| MapLibre GL JS | 5.7.1 | MapLibre contributors | BSD-3-Clause | lazy ATLAS renderer integration | `prototype/drive-lab/` |
| qrcode | 1.5.4 | Kazuhiko Arase and contributors | MIT | local passenger-link QR generation | `prototype/drive-lab/` |
| Simple Icons GitHub mark | current path | Simple Icons contributors | CC0-1.0 | small inline monochrome SVG identifying the public source link | `prototype/drive-lab/src/App.jsx` |
| [Tabler Icons — report, navigation, media, appearance, search, chart, map, chevron, external-link, music, engine, and Wikipedia-brand icons](https://github.com/tabler/tabler-icons/tree/v3.46.0/icons) | 3.46.0 (icon metadata 1.0 / 1.39 / 1.46 / 1.96 / 2.0) | Copyright (c) 2020-2026 Paweł Kuna | MIT | official SVGs retained byte-identically; monochrome presentation, live ATLAS rotation, and the Now Playing pulse are applied by product CSS | `prototype/drive-lab/public/third-party/tabler-icons/` |
| Buy Me a Coffee QR and cup identity | user-supplied 2026-08-28 | Buy Me a Coffee / Coffee Inc. | service-generated brand material; trademark rights retained by the owner | supplied QR embedded unchanged; small interface cup redrawn for the shared yellow launch/diagnostic trigger | `prototype/drive-lab/src/assets/bmc_qr.png`, `prototype/drive-lab/src/support-button.jsx`, `prototype/drive-lab/src/App.jsx` |
| Illobo LOBO identity marks | user-supplied 2026-08-31 | Lobo (`illobo`) | direct owner permission to use both supplied variants; all brand and trademark rights remain with Lobo | both SVGs retained byte-identically and presented as the Illobo Featured cover through a project-authored continuous four-second dissolve in each direction; no path or colour data is modified | `prototype/drive-lab/public/brand/illobo-featured-solid.svg`, `prototype/drive-lab/public/brand/illobo-featured-outline.svg` |
| Space Grotesk variable font | Google Fonts snapshot `2026-08-30`, upstream version 2.000 | Florian Karsten and the Space Grotesk Project Authors | SIL Open Font License 1.1 | locally hosted unmodified variable TrueType file for all reading text, values, controls, operational labels, LAB controls, and session-report typography | `prototype/drive-lab/public/fonts/` |
| Orbitron variable font | Google Fonts v35 | Matt McInerney and the Orbitron Project Authors | SIL Open Font License 1.1 | locally hosted unmodified variable WOFF2 used only for exact textual `sedicivalvole` wordmarks; the selected 16 Road mark retains its `16` converted at weight 750 into stable vector outlines | `prototype/drive-lab/public/fonts/`, `logo/` |
| OpenFreeMap public instance | continuously updated | OpenFreeMap contributors; OpenMapTiles and OpenStreetMap data contributors | service and data terms; attribution retained in-map | Natural pastel and palette-owned vector styles, buildings and named POIs from the existing OpenMapTiles poi layer (OpenStreetMap ODbL data) | `prototype/drive-lab/src/environments/atlas/` |
| [Open-Meteo Elevation API / Copernicus DEM GLO-90](https://open-meteo.com/en/docs/elevation-api) | Copernicus DEM 2021 GLO-90 | Open-Meteo; European Union, Copernicus programme | API data offered under CC BY 4.0; Copernicus acknowledgement retained | runtime-only fallback terrain elevation for an approximately 1 km rounded location cell when GPS height is absent; one App-owned cache serves all visuals and the explicitly exported PDF, with no persistent response storage | `prototype/drive-lab/src/environments/atlas/` |
| Localized Wikipedia API / PageImages / native Minerva article page | continuously updated | Wikimedia contributors and individual media authors | page and media-specific free licenses; selected article and source remain linked | runtime-only Discover and ATLAS POI nearby abstracts, free-license thumbnails and complete localized responsive Minerva article in the browser's supported language or the passenger's explicit selection; dark presentation uses Wikipedia's own accepted Minerva test parameter; no content is stored or bundled | `prototype/drive-lab/src/discover/`, `prototype/drive-lab/src/environments/atlas/` |
| Infinite Lights / Interstate 7 | commit `e58d58520bc0dfde21f9e14e6a1b8c7f0a2a2a9e` | Daniel Velasquez / Anemolo and Codrops/Tympanus | Custom Codrops usage notice in the vendored README | vendored files are byte-identical; external sedicivalvole runtime bridge only | `prototype/drive-lab/public/third-party/infinite-lights/` |
| Three.js | r109, upstream-bundled build | Three.js authors | MIT | none | `prototype/drive-lab/public/third-party/infinite-lights/js/three.min.js` |
| postprocessing | 6.8.5 | Raoul van Rüschen | Zlib | none | `prototype/drive-lab/public/third-party/infinite-lights/js/postprocessing.min.js` |
| textStep (transport, DSP) | commit `cb107d198b730db60cff4a87c7fd5b8d1fae3fb2` | Lobo (`illobo`) | GNU GPL v2.0, plus the author's direct unrestricted authorization | translated from Rust to JavaScript; see the per-file list below | `prototype/drive-lab/src/score/` |

Transitive dependencies and integrity hashes are locked in `prototype/drive-lab/package-lock.json`. A public release must generate and verify the complete dependency notice set.

The ShaderGradient package is admitted unmodified for the tracked local and
protected LAB workbenches and for the three owner-selected public visuals
`JAPANESE MIST 08`, `ACID ORCHARD 09`, and `CHROMATIC SILK 10`. Its MIT
permission notice is retained in `licenses/ShaderGradient-MIT.txt`. MIT permits
use, modification, and redistribution provided that the copyright and
permission notice travels with copied or modified portions. No ShaderGradient
code is relicensed under PolyForm. The project-owned adapters live in
`prototype/drive-lab/src/environments/shadergradient/`; they register the exact
selected settings, map bounded vehicle/audio response, lazy-load the upstream
renderer, report telemetry, and own the independent Canvas2D fallback. No
upstream package source is copied or modified.

No standalone luminous-axis or Braun launch-detail raster is present in the
tracked source tree or production build output. Interface details and active
project-authored fields are code-generated visuals, not copied Product Design
reference assets.

### Visual sources admitted on 2026-08-29

Four external visual sources informed Flux studies. InfiniteTubes remains a
project-authored clean-room boundary; Primordial is now a retired historical
study. PRTCL uses only three
formula adaptations under the repository owner's direct authorization; its
runtime, UI, dependencies, brand and assets remain excluded. After the first
Drivey result was rejected, DRIVEY moved to a source-faithful integration of the
separately licensed upstream runtime. Original licences and usage notices remain
with every referenced or integrated work.

| Source | Audited identity | Authors / credit | Licence or permission evidence | Sedici Valvole treatment |
|---|---|---|---|---|
| [Drivey](https://github.com/Rezmason/drivey) | `5104cdade2a3158786b05b9b0680a50e942830cf` | Rezmason; original Drivey lineage credited upstream | repository includes GNU GPL version 3 text; the unchanged 2018 `js/Drivey.js` header still says non-profit use and that GPLv3 was being considered; bundled three.js r115, expr-eval 2.0.2, and Hundred Rabbits Themes retain their MIT notices | 51 byte-identical modern-runtime files are integrated behind a separate sedicivalvole shell and bridge; `legacy/`, `readme_assets/`, screenshots and unnecessary media are excluded |
| PRTCL | `2a22f33b975e2c40b7ee0bdd2d1acb4cee4f5060` | audited README carried an obsolete studio attribution; project and repository creator is enuzzo | README states MIT but the audited checkout contains no `LICENSE` file; repository owner enuzzo supplied direct reuse and modification authorization for this work | Fractal Frequency, Murmuration, and Axiom formulas are adapted into a bounded project renderer; no PRTCL runtime, original preset file, UI, dependency, font, screenshot, brand asset, or other effect is included |
| [InfiniteTubes](https://github.com/Mamboleoo/InfiniteTubes) | `a3b831b6c95bed4d803dfeed8b66ec76de333996` | Louis Hoebregts for Codrops/Tympanus | custom Codrops integrated-use notice; as-is redistribution and pluginization restricted | Particles, Star Wars, and Triangle mechanics studied; original implementation only; all upstream assets excluded |
| [GLSL: Primordial Soup](https://codepen.io/shubniggurath/pen/NXGbBo) | Pen `NXGbBo`, rechecked 2026-08-29 | Liam Egan; embedded value-noise fragment credits Inigo Quilez | public Pen covered by [CodePen's current MIT default](https://blog.codepen.io/documentation/licensing/); separate terms for the embedded noise fragment were not established | rendered fluid mechanics studied; clean-room shader; no Pen or attributed noise source copied |

The complete admission evidence, rejected assets, selected PRTCL effects, and
runtime boundary are recorded in
[`docs/SOURCE-ADMISSION-2026-08-29.md`](docs/SOURCE-ADMISSION-2026-08-29.md).
The exact Drivey file hashes, bundled-library notices and unresolved header
ambiguity are preserved under
`prototype/drive-lab/public/third-party/drivey/`. Those manifest-listed files
are not relicensed under the sedicivalvole PolyForm grant; the project-authored
`sedicivalvole.html` shell and parent bridge follow the repository's current
PolyForm scope.

Material kept only under `_references/` remains external local source material. It is not automatically approved, redistributable, or part of the product.

### MusicRadar SampleRadar sample libraries

`_references/audio/samples/` holds four free sample libraries published by
[MusicRadar](https://www.musicradar.com/) through its SampleRadar series, and
originating from *Future Music* or *Computer Music* magazine:

| Library | Source | Credited creator |
|---|---|---|
| 207 free '90s jungle samples | <https://www.musicradar.com/news/sampleradar-free-90s-jungle-samples> | Cyclick Samples (`cyclickbob`) for MusicRadar |
| 797 free '90s synth samples | <https://www.musicradar.com/news/sampleradar-free-90s-synth-samples> | MusicRadar |
| 183 free 80s pop drums samples | <https://www.musicradar.com/news/sampleradar-free-80s-pop-drums-samples> | The MusicRadar Team; originally distributed by *Future Music* |
| 502 free '80s samples | <https://www.musicradar.com/news/sampleradar-free-80s-samples-1> | The MusicRadar Team; originally distributed by *Computer Music* |

**These samples are not ours. All rights in them remain with MusicRadar and the
credited creators.**

MusicRadar states the terms on both pages in the same words:

> Because they're royalty-free, you're welcome to use the samples in your music
> in any way you like — all we ask is that you don't re-distribute them.

The permission is to *use them in music*, including commercially. It is not a
permission to redistribute the loops themselves, and that restriction comes from
the rights holder: it cannot be lifted by an exclusion or exception in this
project's own licensing. `LICENSE-SCOPE.md` governs how the project's licence
applies to material the project includes; it cannot grant a right the project
does not hold.

**The project's decision, and how it is honoured technically.**

1. The libraries stay in the git-ignored `_references/` tree. No loop, one-shot
   or multisample from any pack is committed to this repository.
2. They are used the way the terms allow: as source material for composing
   sedicivalvole's own music.
3. What the product ships is that music. JUNCTION renders 192 bars of
   sedicivalvole arrangement — layering, voicing, processing chain and bus —
   into 24 complete eight-bar clips: three interchangeable complete
   performances for each of eight energy states, produced from 76 distinct
   source recordings. It uses the packs' native 127–168 BPM recordings without
   browser-side stretching, then packages the encoded production as one 5.8 MB
   segmented runtime bank. The browser schedules one self-contained synchronous
   performance at a time; it never receives an isolated loop or stem. It is not
   a disguised collection of source samples.

The distinction is the whole point, and it is not about Git. Serving the
individual loops as separate assets would put the pack itself on the network for
anyone to collect, which is redistribution whether or not the files were ever
committed. Serving a rendered arrangement is releasing a record made with
royalty-free samples, which is exactly what the licence describes.

Credit remains with MusicRadar and the credited creators, and the links above
are the canonical source for anyone who wants the original packs. They should be
obtained from MusicRadar, never from this project.

The Codrops/Tympanus `InfiniteLights` repository permits free use when the resource is integrated or built upon in personal or commercial websites, web apps, or templates, while prohibiting sale, redistribution, republication, or pluginization of the resource as-is. `VERTIGO 02` integrates Interstate 7 into the sedicivalvole product with an independently authored speed/FOV bridge; it is not offered as a standalone plugin or resource. The vendor snapshot retains the upstream README and notice, and deterministic hashes verify that its source has not been silently changed or relicensed. Credit belongs to Daniel Velasquez / Anemolo and Codrops/Tympanus for the original High-speed Light Trails experiment. See `docs/REFERENCE-STUDY-INFINITE-LIGHTS.md` for provenance and integration details.

### textStep and Lobo

[textStep](https://github.com/illobo/textStep) was conceived and created by
[Lobo (`illobo`)](https://github.com/illobo). Its original sequencer,
synthesizer, DSP, scene, and live-performance architecture informs the current
Flux sequencer and its planned multi-score extensions. That authorship deserves
explicit credit wherever the integration is described.

The upstream repository is published under GNU GPL version 2.0. The project
maintainer confirms and accepts responsibility for Lobo's additional direct,
unrestricted authorization to reuse its content, which is the basis on which the
translated code is combined with original sedicivalvole material under the
current mixed policy. The direct authorization is load-bearing and must not be
dropped from these notices; the translated code is not relicensed under
PolyForm.

**Derived code is now integrated and shipped.** As required, the exact
provenance follows. Every file carries the same information in its own header.

Translated from textStep at commit
`cb107d198b730db60cff4a87c7fd5b8d1fae3fb2`, all under
`prototype/drive-lab/src/score/`:

| File | Upstream file | Modifications |
|---|---|---|
| `clock.js` | `src/audio/clock.rs` | Rust to a JavaScript class; Ableton Link re-stamping omitted; additionally reports position inside a 32-step pattern and a four-bar phrase |
| `patterns.js` | `src/sequencer/drum_pattern.rs` | the upstream hex step encoding, decoded to velocities |
| `dsp/primitives.js` | `src/audio/drum_voice.rs` | noise, one-pole filters, state-variable filter, comb, drive, extracted as shared primitives |
| `dsp/drum-voices.js` | `src/audio/drum_voice.rs` | kick, snare, closed and open hats, clap; `f32` arithmetic becomes doubles, so output is not bit-identical; ride, cowbell and tom are not ported |
| `dsp/synth-voice.js` | `src/audio/synth_voice.rs` | oscillators with PolyBLEP, ADSR, 24 dB Cytomic filter |
| `dsp/effects.js` | `src/audio/effects.rs` | `RampedParam`, `TubeSaturator` with its 2x oversampler, `SidechainEnvelope`, `LookaheadLimiter` (threshold lowered from 0.95 to 0.72), and the musical delay subdivisions |

The following files in the same directory are **original sedicivalvole work**
and are not derived from textStep: `arranger.js`, `fracture-rhythm.js`, `score-core.js`,
`jungle-score.js`, `genres.js`, `dsp/brake-filter.js`,
`worklet/score-processor.js`, and the `StereoReverb`, `StereoChorus`,
`StereoWidth` and `TempoDelay` classes at the end of `dsp/effects.js`.

No upstream preset data, pattern preset, kit name, or audio asset is included.
Upstream preset families named after specific commercial records are
deliberately not carried across. See `docs/REFERENCE-STUDY-TEXTSTEP.md` for
provenance, architectural findings, and the adoption plan.

### Automatic music transcription development stack

The sample-harmony pilot uses a machine-local, Git-ignored Python environment.
None of these packages, their models, or their generated reports enter the
browser bundle or the published product.

| Package | Pinned version/range | Licence | Purpose and source |
|---|---:|---|---|
| [Spotify Basic Pitch](https://github.com/spotify/basic-pitch) | `0.4.0` | Apache-2.0 | High-recall polyphonic note proposals; never the final harmonic verdict |
| [NumPy](https://github.com/numpy/numpy) | `<2.1` | BSD-3-Clause | Numerical arrays used by the analysis stack |
| [Numba](https://github.com/numba/numba) | `0.60.0` | BSD-2-Clause | Matched CPython 3.11 acceleration dependency for Apple-silicon and Intel macOS |
| [llvmlite](https://github.com/numba/llvmlite) | `0.43.0` | BSD-2-Clause | Matched native macOS backend required by Numba |
| [scikit-learn](https://github.com/scikit-learn/scikit-learn) | `<=1.5.1` | BSD-3-Clause | Version bounded to Core ML Tools' verified conversion range |
| [setuptools](https://github.com/pypa/setuptools) | `<81` | MIT | Compatibility provider for the legacy `pkg_resources` import in Resampy |

Basic Pitch's transitive runtime on macOS includes Core ML Tools, librosa,
SciPy, Resampy, Pretty MIDI, mir_eval, SoundFile, and their declared Python
dependencies. Their installed licence files remain in the ignored virtual
environment. They are development tools only and do not alter the licensing of
the project's source or the external sample packs.

## Oklab conversion matrices — 2026-09-04

- Author: Björn Ottosson.
- Source: https://bottosson.github.io/posts/oklab/ (2021-01-25 sRGB matrix revision).
- The author explicitly dedicates the reference conversion implementation to the public domain (MIT is also offered as an alternative). This project uses the public-domain grant.
- Scope: forward/inverse numeric matrices in `prototype/drive-lab/src/semantic-theme.js`, translated into JavaScript.
- Project-owned additions: contrast calculation, hue-preserving gamut reduction, bounded lightness search, semantic role resolution, caching, and evidence export. No new package or renderer dependency.

### 2026-09-04 rail icon addition

`navigation.svg` is the unmodified outline navigation icon from Tabler Icons v3.46.0, under the existing Paweł Kuna MIT notice. The rail uses official SVG markup with project-owned optical sizing and a common 2 px non-scaling stroke; the upstream files remain unchanged.


## Palette control icon — 2026-09-05

`palette.svg` is retained byte-identically from Tabler Icons v3.46.0 (icon metadata
1.1), under the existing Paweł Kuna MIT notice. Source:
https://raw.githubusercontent.com/tabler/tabler-icons/v3.46.0/icons/outline/palette.svg
SHA-256: `27a5a19ae4b0f73ff4089b7f5a6c8fdf17f19ecc853e19fa04494f083943e778`.
Project CSS supplies size and semantic foreground through a mask; no upstream
geometry was edited.

## Night Glass experience preview — 2026-09-05

`prototype/drive-lab/public/experiences/night-glass.png` is a real browser capture
of the existing Vertigo/Infinite Lights integration with the Graphite palette.
Its underlying Codrops/Tympanus runtime retains the MIT attribution and exact
source inventory recorded above; no upstream source or dependency was changed.
The project-owned experience composition and product screenshot follow the
existing original-code and screenshot exclusions in LICENSE-SCOPE.md. Capture:
773 × 601 browser, field-only region x=0, y=140, width=773, height=420.

## 2026-09-05 — Owner-supplied Lobo round playlist marks

The owner supplied `lobo-round-bgb.svg` and `lobo-round-bgw.svg` directly for the Lobo playlist. Their exact bytes replace the two featured playlist marks, with the existing eight-second crossfade retained. These artist marks are excluded from the original-code license; no broader rights are asserted. Previous marks are retained only as reviewed deployment identities.

## 2026-09-05 — Neon Groove experience preview

`public/experiences/neon-groove.png` is a real capture of the existing project-owned Aperture renderer with the Neon palette at the agreed Tesla viewport. It is a product screenshot, excluded from the original-code license. No new renderer, recording or dependency is introduced.

## 2026-09-05 — Community credit reconciliation

The Night Glass preview paragraph above incorrectly called the Infinite Lights runtime MIT. Its actual governing upstream README carries the custom Codrops integrated-use notice already recorded in this file and LICENSE-SCOPE.md. The pinned source and bundled-library licenses are unchanged. No general MIT grant is claimed for that runtime.

The installed `qrcode@1.5.4` LICENSE states Copyright (c) 2012 Ryan Day, and its package metadata names Ryan Day (soldair) as author. Credit Ryan Day and contributors for node-qrcode, retaining Kazuhiko Arase's separate QR algorithm lineage rather than naming it as the sole package authorship.

SOUNDTRACK also uses Jamendo's runtime catalogue and eligible artist recordings through the existing server-side relay. Recording title, artist, source page and actual recording-specific Creative Commons terms are evaluated in `src/soundtrack/source-policy.js` and remain attached to playback; no universal music license or bundled Jamendo catalogue is claimed. Illobo's 29 recordings and supplied artwork are separately artist-authorized material, linked to https://soundcloud.com/illobo, not PolyForm-covered software. Existing in-product credit and source links remain required.

The README now contains a consolidated community credits table. `docs/COMMUNITY-THANKS.md` records public contact routes and unsent thank-you drafts, separating integrated code/assets, services/data, development tools and historical studies. These outreach drafts create no additional license or endorsement.

## 2026-09-05 02:40 — Complete public credit inventory

The final README section now includes individual acknowledgements for all named offline analysis dependencies above, the libsndfile audio-I/O backend ([upstream](https://github.com/libsndfile/libsndfile)), and Microsoft's Playwright verification tooling ([upstream](https://github.com/microsoft/playwright)). These are development acknowledgements, not new product integrations or redistributed copies. Their installed notices continue to govern their respective tools. No source, audio, model, dependency version or upstream licensing scope changed in this documentation checkpoint.

`docs/community-npm-credits.json` and the generated README appendix cover all 196 npm lockfile entries, including nested versions, transitive utilities and optional platform packages. This is an authorship/source inventory, not a replacement for license texts or a declaration that every locked dependency ships in the browser. Exact-version public registry metadata is retained for reproducibility. The maintainer script rejects missing/stale lockfile credits and a README whose community section is no longer last. Non-npm material still requires manual provenance review.

## Engine audio — Mark Oosting — admitted 2026-09-07

Source: https://github.com/markeasting/engine-audio at
`b8cf9887c914f17c2f006d68427080e39d02d0b0`, MIT, copyright 2025 Mark Oosting.
The owner explicitly authorizes integration of the source and bundled WAVs on
the basis of the repository's declared MIT licence. This supersedes the prior
project-level hold on those files; it does not assert independently verified
recording ownership or transfer responsibility to the upstream author. Preserve
original notices and exact per-file source/hash inventory in
`prototype/drive-lab/src/engine/source-inventory.json`. Upstream recording
provenance remains a follow-up; replace affected assets if contradictory rights
evidence appears. No competitor code or audio is included.

Reuse: engine/drivetrain/mixer primitives, three configurations, ratio/clamp
helpers and active WAVs. Adaptations: shared context/output injection, explicit
imports, corrected RPM units, bounded audio scheduling and original GPS/automatic
gearbox/lifecycle integration. Native upstream keyboard/demo UI is not shipped.


## Launch usability and audio-lifecycle studies — 2026-09-07

Jakob Nielsen / Nielsen Norman Group, [Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/),
and MDN contributors / Mozilla, [Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
and [autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay),
were consulted for contextual controls and explicit audio startup. Study only:
no source, prose excerpt, artwork or documentation is redistributed. These
acknowledgements do not change the project's PolyForm Noncommercial licence.

## Launch Cockpit icon extension — 2026-09-07

The unmodified `music.svg` and `engine.svg` outline icons from Tabler Icons v3.46.0 join the existing Paweł Kuna MIT inventory. Project CSS supplies amber/red masks; upstream SVG bytes remain unchanged. Sources: https://raw.githubusercontent.com/tabler/tabler-icons/v3.46.0/icons/outline/music.svg and https://raw.githubusercontent.com/tabler/tabler-icons/v3.46.0/icons/outline/engine.svg.

## FPDF session report renderer — 2026-09-07

Olivier Plathey's **FPDF 1.9**, released 2026-05-31, supplies the unmodified
PHP PDF writer and Helvetica/Helvetica Bold metrics for on-demand session reports.
Source: [official download](https://www.fpdf.org/en/download.php), archive
`https://www.fpdf.org/en/dl.php?f=zip&v=19`, SHA-256
`7d1ff963a434e05796db4bdbab7f542908fe20c57b225a55173191aea6444f16`.

FPDF uses its own permissive license, **not a claim of MIT licensing**. Its
original `license.txt` is retained beside the exact file/hash inventory under
`prototype/drive-lab/public/report-support/fpdf/`. Original report validation,
layout, verification and delivery orchestration remain sedicivalvole code under
the project's existing PolyForm Noncommercial scope. No FPDF tutorial, unrelated
extension, tFPDF/LGPL code or third-party document is copied into the product.
The renderer uses fixed local font metrics and the existing project-owned mark;
it never accepts user-supplied fonts, images, paths, PDF bytes or HTML.


## Engine acoustics source studies — 2026-09-07

These sources informed the original host analysis and improvement plan. No new
third-party source or recording from this list is included in the runtime.

- **DasEtwas — enginesound**: [https://github.com/DasEtwas/enginesound/tree/e5fcca587397c0c8ba9c9d24874b951fed74d260](https://github.com/DasEtwas/enginesound/tree/e5fcca587397c0c8ba9c9d24874b951fed74d260). MIT procedural cylinder/intake/exhaust and headless loop-export architecture; source study only, no code or example audio shipped.
- **Antonio-R1 — engine-sound-generator**: [https://github.com/Antonio-R1/engine-sound-generator/tree/c76c5adb9e63f5a54fb0def3b97e8e0ac1a7dea1](https://github.com/Antonio-R1/engine-sound-generator/tree/c76c5adb9e63f5a54fb0def3b97e8e0ac1a7dea1). MIT AudioWorklet/C++/WASM waveguide study; no code or assets shipped. The pinned JS/C++ generators read throttle without applying it to excitation. JS filter coefficients assume 44.1 kHz; C++ filters receive the actual rate. These findings informed original load articulation and rate-aware filters, not a donor import.
- **ATG / Dan — VehicleNoiseSynthesizer**: [https://github.com/ATG-Simulator/VehicleNoiseSynthesizer/tree/4241caca5a18be0d47f0b8586df93b1b42d7020d](https://github.com/ATG-Simulator/VehicleNoiseSynthesizer/tree/4241caca5a18be0d47f0b8586df93b1b42d7020d). MIT code study of RPM regions and discrete acoustic events; no Unity code or demo recordings shipped.
- **Ange Yaghi — engine-sim**: [https://github.com/ange-yaghi/engine-sim/tree/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630](https://github.com/ange-yaghi/engine-sim/tree/85f7c3b959a908ed5232ede4f1a4ac7eafe6b630). Physical engine/firing/path-length research; no code or bundled impulse responses shipped.
- **Baldan, Lachambre, Delle Monache and Boussard — engine sound synthesis (2015)**: [https://air.iuav.it/handle/11578/264484](https://air.iuav.it/handle/11578/264484). Institutional abstract and cited implementation study; full-paper equation audit not claimed; no paper text redistributed.
- **Robin Doerfler and Lonce Wyse — Pulse-Train-Resonator / Procedural Engine Sounds**: [https://arxiv.org/abs/2603.09391](https://arxiv.org/abs/2603.09391). 2026 paper and RPM/torque-annotated dataset study; no code/audio imported. CC BY-NC code is not admitted as project software.

Dataset: https://huggingface.co/datasets/rdoerfler/procedural-engine-sounds,
CC BY-NC 4.0 audio; no download or distribution in this checkpoint. Its RPM and
torque control channels are not playable audio. The software and audio licence
boundaries remain separate. The loop audit used the existing bundled NumPy
2.3.5, under its existing BSD-3-Clause notice, without changing the older music
analysis environment or its requirements. Host loop repair and driveline gates
are original project code; admitted Engine source/WAV hashes remain unchanged.

## Engine quality campaign source intake — 2026-09-07

- **February Solutions, MB — Engine Sim Game / Real Engine Simulator**: [authored architecture](https://realenginesimulator.com/about), [changelog](https://realenginesimulator.com/changelog) and [terms/pricing](https://realenginesimulator.com/terms). Owner-confirmed reference; public documentation and ordinary UI clicks were reviewed. The public selector contains 45 presets, and the publisher reserves the custom builder for paid Pro. Observed controls distinguish piston, rotary and turbojet models; automatic driving shows gear changes, converter slip and lockup. These observations and publisher descriptions are not listening or physical validation. Proprietary runtime, assets, configurations and constants are not imported.
- **TheDIYGuy999 — Rc_Engine_Sound_ESP32**: [pinned source](https://github.com/TheDIYGuy999/Rc_Engine_Sound_ESP32/tree/5520d721ef41b50f39dfe9a7081ac4620138702a). Exact revision verified September 7–8, 2026. README and transmission/sound entry-point study of automatic/DCT behavior and load/RPM layers; no licence-like file was found in the recursive tree, and the inspected files do not establish reuse permission. No code, encoded sound library or recording is imported.

## Original Engine acoustic implementation — 2026-09-08

`prototype/drive-lab/src/engine/procedural-dsp.js`, `procedural-processor.js`,
`procedural-voice.js`, `powertrain.js` and the new acoustic profile data are
original sedicivalvole work under the existing PolyForm Noncommercial scope.
They add a cycle-timed layer to Mono and the procedural Otto, Cinque and Turbine
voices. Public physics concepts and the credited studies above informed the
design; no new third-party implementation, preset, recording or IR is admitted.

The virtual control foundation still uses the previously admitted Mark Oosting
Engine/Drivetrain primitives. New profiles reuse that configuration scaffold
with project-authored overrides; it is not presented as wholly independent
powertrain physics. The existing donor source files and WAV bytes retain their
exact recorded hashes. Original acoustic synthesis does not settle or replace
the recorded provenance follow-up for the retained sample banks. See
[the source comparison](docs/ENGINE-SOURCE-COMPARISON-2026-09-08.md) and
[the exact admitted inventory](prototype/drive-lab/src/engine/source-inventory.json).
